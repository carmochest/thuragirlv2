
/* ── one general-purpose sheet for invoices, payments, reminders and the rest ── */
function gsInit(){
  if ($("#gs")) return;
  var w = el("div", "shB"); w.id = "gs"; w.hidden = true;
  w.innerHTML = '<div class="shB-card" role="dialog" aria-modal="true" aria-labelledby="gs-t"><div class="shB-h"><div><div class="shB-k" id="gs-k"></div><h3 id="gs-t"></h3><div class="shB-sub" id="gs-sub"></div></div>' +
    '<button type="button" class="cb-btn shB-x" id="gs-x" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button></div><div class="gs-b" id="gs-b"></div></div>';
  $("#mock").appendChild(w);
  $("#gs-x").addEventListener("click", closeGS);
  w.addEventListener("click", function(ev){ if (ev.target === w) closeGS(); });
}
function openGS(k, title, sub){
  gsInit(); $("#gs-k").textContent = k; $("#gs-t").textContent = title; $("#gs-sub").textContent = sub || ""; $("#gs-sub").hidden = !sub;
  var b = $("#gs-b"); b.textContent = ""; var s = $("#gs"); s.hidden = false;
  try { $("#gs-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {}
  return b;
}
function closeGS(){ var s = $("#gs"); if (s) s.hidden = true; }
function btn(cls, label, fn, icon){ var b = el("button", cls); b.type = "button"; b.innerHTML = icon ? '<svg class="i"><use href="#' + icon + '"/></svg>' : ""; b.appendChild(document.createTextNode(label)); if (fn) b.addEventListener("click", fn); return b; }
function foot(a, b){ var f = el("div", "shB-f" + (b ? "" : " one")); f.appendChild(a); if (b) f.appendChild(b); return f; }
function refresh(){ BK_CACHE.key = ""; lastKey = ""; showTab(); }

/* ── terms (signup) ── */
function openTerms(){
  var b = openGS("Before launch", "Terms and PDPA notice", "");
  b.appendChild(el("p", "st-p", "The full Terms of Service and the PDPA privacy notice will be published here before ThuraGirl opens to customers."));
  var ul = el("ul", "st-list");
  ["In this test build your details stay in this browser. Nothing is sent to a server.", "Your password is stored only as a salted hash.", "You can erase the account and everything in it from Settings at any time."].forEach(function(t){ ul.appendChild(el("li", "", t)); });
  b.appendChild(ul); b.appendChild(foot(btn("pill acc", "Got it", closeGS)));
}

/* ── the sample, in one tap ── */
function useSample(silent){
  var u = me(), p = readTable(splitCsv(sampleCsv()));
  addStatement(u, "K-Bank", "0483511234", p); sampleBooks(u); u.sample = true; save();
  if (!silent){ if (tab !== "home") go(""); else refresh(); toast("Sample statement loaded. " + p.tx.length + " transactions read."); }
}

/* ── what needs the owner ── */
function tasks(u){
  var B = books(u), t = today(), out = [];
  if (!B) return out;
  (u.requests || []).filter(function(r){ return !r.file; }).forEach(function(r){
    out.push({ k: "req:" + r.id, ic: "i-doc", t: "Your accountant asked for a document", m: r.doc, late: { txt: "Requested " + ago(r.at, true), cls: "warn" }, btn: "Upload", rank: 1,
      fn: function(){ openKyc(r.form, r.doc + ". One PDF or image, up to 10 MB.", function(meta){ r.file = meta; r.done = Date.now(); save(); refresh(); toast("Sent to your accountant"); }); },
      story: { h: "Your accountant needs one more document", p: r.doc + ", for " + r.form + "." } });
  });
  (u.invoices || []).filter(function(v){ return !v.paid && v.due < t && (!v.reminded || diffDays(t, v.reminded) >= 7); }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var tot = invTotal(v);
    out.push({ k: "inv:" + v.id, ic: "i-alert", t: "Invoice #" + v.id + " is unpaid", m: v.to, amt: tot, late: { txt: lateTxt(v.due), cls: "bad" }, btn: "Remind", rank: 2, fn: function(){ openRemind(v); },
      story: { h: v.to + " has not paid you", p: "Invoice #" + v.id + " for " + baht(tot) + " is " + lateTxt(v.due).replace("late", "late") + ". I have a polite reminder ready to go." } });
  });
  (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, t) <= 7; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var late = v.due < t;
    out.push({ k: "bill:" + v.id, ic: "i-pay", t: "Pay " + v.to, m: v.note || "Bill", amt: v.amount, late: { txt: lateTxt(v.due), cls: late ? "bad" : v.due === t ? "warn" : "" }, btn: "Pay", rank: late ? 2 : 4, fn: function(){ openBill(v); },
      story: { h: late ? "The " + v.to + " bill is overdue" : v.to + " is due " + (v.due === t ? "today" : "soon"), p: baht(v.amount) + ", " + lateTxt(v.due).toLowerCase() + ". Scan the PromptPay code or mark it paid." } });
  });
  var since = addDays(B.asOf, -30);
  u.tx.filter(function(x){ return x.a <= -10000 && x.d >= since && /Stock and supplies|Marketing|Other costs|Utilities/.test(cat(x.t, x.a)) && !(u.rcpt || {})[txid(x)]; })
    .sort(function(a, b){ return a.a - b.a; }).slice(0, 2).forEach(function(x){
      out.push({ k: "rc:" + txid(x), ic: "i-receipt", t: "Missing receipt", m: x.t + ", " + nice(x.d), amt: -x.a, late: { txt: "Left your account on " + nice(x.d), cls: "" }, btn: "Upload", rank: 5,
        fn: function(){ openKyc("Receipt", x.t + " · " + baht(-x.a) + ". A photo or PDF of the receipt or tax invoice.", function(meta){ u.rcpt = u.rcpt || {}; u.rcpt[txid(x)] = meta; save(); refresh(); toast("Receipt filed"); }); },
        story: { h: "A receipt is missing", p: baht(-x.a) + " to " + x.t + " on " + nice(x.d) + ". Snap the receipt and I file it." } });
    });
  (u.banks || []).filter(function(b){ return Date.now() - b.at > 7 * 864e5; }).forEach(function(b){
    out.push({ k: "bk:" + b.bank + b.acct, ic: "i-up", t: b.bank + " statement is getting old", m: "Last uploaded " + ago(b.at, true), late: { txt: "Uploaded " + ago(b.at, true), cls: "warn" }, btn: "Upload", rank: 6, fn: function(){ openUpload(b); } });
  });
  return out.sort(function(a, b){ return a.rank - b.rank; });
}
function rowFor(x){
  var r = el("div", "row tk dyn"); r.setAttribute("data-k", x.k);
  r.innerHTML = '<span class="ic"><svg class="i"><use href="#' + x.ic + '"/></svg></span>';
  var rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t));
  var m = el("div", "m"); m.appendChild(el("span", x.late.cls, x.late.txt)); if (x.amt){ var ma = el("span", "ma", " · "); ma.appendChild(el("span", "num", baht(x.amt))); m.appendChild(ma); }
  rt.appendChild(m); r.appendChild(rt);
  if (x.amt) r.appendChild(el("span", "amt num", baht(x.amt)));
  r.appendChild(btn("pill soft act", x.btn, x.fn)); return r;
}
function paintNeeds(u){
  var sec = $(".needB"), setup = $("#b-setuprow"), rev = $("#b-rev"), B = books(u);
  $$(".needB .tk[data-k]:not(#b-rev)").forEach(function(n){ n.remove(); });
  var T = tasks(u); T.slice(0, 6).forEach(function(x){ sec.insertBefore(rowFor(x), setup); });
  var p = B && B.pack, showRev = !!(p && !(u.done["rev:" + p.key]));
  rev.hidden = !showRev; rev.classList.remove("gone", "going"); rev.style.height = "";
  if (p){ $(".rt .t", rev).textContent = p.name + " Review Pack"; $(".rt .m", rev).textContent = "Your month on one page. " + baht(p.kept) + " kept."; }
  var later = (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, today()) > 7 && diffDays(v.due, today()) <= 31; }).length + Math.max(0, T.length - 6);
  var more = $(".needB .more"); more.hidden = !later; if (later) more.firstChild.nodeValue = later + (later === 1 ? " more thing" : " more things") + " coming up this month";
}

/* ── home: hero and tiles ── */
function paintHero(u){
  var B = books(u); if (!B) return;
  CASH = B.series.map(function(s){ return s[1]; }); CDAYS = B.series.map(function(s){ return s[0]; }); N = CASH.length; TOTAL = B.cash;
  lo = Math.min.apply(null, CASH); hi = Math.max.apply(null, CASH); if (hi === lo){ hi += 1; lo -= 1; }
  buildSpark(); restDay();
  $(".dB-hero .big").setAttribute("aria-label", money(B.cash) + " baht");
  $("#b-spark").setAttribute("aria-label", "Cash over the last 30 days, from " + baht(CASH[0]) + " to " + baht(TOTAL));
  var F = B.fin.mtd, tiles = [[".mini.t1", "Revenue", F.rev, F.dIn, "vs last month"], [".mini.t2", "Expenses", F.exp, F.dOut, "vs last month"], [".mini.t3", "Profit", F.rev - F.exp, F.d, F.rev ? ((F.rev - F.exp) / F.rev * 100).toFixed(1) + "% margin" : ""]];
  tiles.forEach(function(x){
    var b = $(x[0]); $(".n", b).textContent = baht(x[2]); b.setAttribute("aria-label", x[1] + ", " + money(x[2]) + " baht. Open Money");
    var d = $(".d", b); d.textContent = ""; if (x[3] != null){ d.insertAdjacentHTML("beforeend", '<svg class="i"' + (x[3] < 0 ? ' style="transform:scaleY(-1)"' : "") + '><use href="#i-trend"/></svg>'); d.appendChild(document.createTextNode(pctTxt(x[3]))); }
    d.appendChild(el("em", "", x[3] == null && x[0] !== ".mini.t3" ? "this month" : x[4]));
  });
  $(".snapB .sech span").textContent = MONTH[day(B.asOf).getMonth()] + " so far";
}

/* ── money lists ── */
function paintLists(u){
  var L = $$("#b-money .listB"), t = today();
  function fill(sec, title, items, empty, addLabel, addFn){
    sec.textContent = "";
    var tot = items.reduce(function(s, x){ return s + x.amt; }, 0), late = items.filter(function(x){ return x.due < t; }).length;
    var h = el("div", "cardh"); h.appendChild(el("h2", "", title)); h.appendChild(el("span", "tot num", baht(tot)));
    var sub = el("div", "sub", items.length + (items.length === 1 ? " open" : " open")); if (late){ sub.appendChild(document.createTextNode(" · ")); sub.appendChild(el("span", "bad", late + " overdue")); }
    h.appendChild(sub); sec.appendChild(h);
    if (!items.length) sec.appendChild(el("p", "st-p lpad", empty));
    items.forEach(function(x){
      var r = el("div", "row"), rt = el("button", "rt rtb"); rt.type = "button"; rt.addEventListener("click", x.open);
      rt.appendChild(el("div", "t", x.name)); var m = el("div", "m"); m.appendChild(el("span", x.due < t ? "bad" : "", lateTxt(x.due))); var ma = el("span", "ma", " · "); ma.appendChild(el("span", "num", baht(x.amt))); m.appendChild(ma); rt.appendChild(m);
      r.appendChild(rt); r.appendChild(el("span", "amt num", baht(x.amt))); r.appendChild(btn("pill soft act", x.btn, x.act)); sec.appendChild(r);
    });
    var add = btn("alt lpad", "", addFn); add.innerHTML = "<u>" + addLabel + "</u>"; sec.appendChild(add);
  }
  fill(L[0], "Owed to you", (u.invoices || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: invTotal(v), btn: v.due < t ? "Remind" : "View", act: function(){ if (v.due < t) openRemind(v); else openInvoice(v); }, open: function(){ openInvoice(v); } };
  }), "No unpaid invoices. Make one and I keep track of it.", "Create an invoice", function(){ newInvoice(); });
  fill(L[1], "You owe", (u.bills || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: v.amount, btn: "Pay", act: function(){ openBill(v); }, open: function(){ openBill(v); } };
  }), "No bills waiting. Add one and I remind you before it is due.", "Add a bill", function(){ newBill(); });
}

/* ── review pack ── */
function paintPack(u){
  var B = books(u), p = B && B.pack, s = $("#b-sheet"); if (!p) return;
  var all = (u.invoices || []).filter(function(v){ return !v.paid && v.due < today(); }).reduce(function(a, v){ return a + invTotal(v); }, 0);
  var miss = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; }).length;
  $("#b-sh-t").textContent = p.name + ", on one page"; $(".shB-sub", s).textContent = coName(u) + " · 1 to " + day(p.to).getDate() + " " + p.name;
  var dd = $$(".shB-n dd", s); dd[0].textContent = baht(p.inc); dd[1].textContent = baht(p.exp); dd[2].textContent = baht(p.kept);
  var li = $$(".shB-l li b", s); li[0].textContent = p.inc ? (p.kept / p.inc * 100).toFixed(1) + "%" : "–"; li[1].textContent = baht(p.tax[0] + p.tax[1]); li[2].textContent = baht(all); li[3].textContent = String(miss);
  $$(".shB-l li span", s)[1].textContent = "Tax to set aside (estimate)";
  $(".shB-ok span", s).textContent = "I've reviewed " + p.name + " and it looks right.";
}
function openSheet(){ var u = me(); paintPack(u); var s = $("#b-sheet"); $("#b-agree").checked = false; $("#b-approve").disabled = true; s.hidden = false; try { $("#b-shx").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeSheet(){ $("#b-sheet").hidden = true; }
function approvePack(){ var u = me(), B = books(u); if (!B || !B.pack) return; u.done["rev:" + B.pack.key] = { at: Date.now() }; save(); closeSheet(); collapse($("#b-rev")); setTimeout(function(){ setCount(); }, 400); if (tab === "brief") renderBrief(); toast(B.pack.name + " is signed off"); }

/* ── morning brief ── */
function renderBrief(){
  var u = me(), B = books(u), pg = $("#b-brief"); if (!B) return;
  $$("#b-brief > :not(.emptyP)").forEach(function(n){ n.remove(); });
  var now = new Date(), T = tasks(u), p = B.pack, F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()];
  var stories = [];
  if (p && !u.done["rev:" + p.key]) stories.push({ h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept. Tick the box and I lock the month.", btn: "Review", acc: 1, fn: openSheet });
  T.filter(function(x){ return x.story && x.rank <= 2; }).forEach(function(x){ stories.push({ h: x.story.h, p: x.story.p, btn: x.btn, fn: x.fn }); });
  var top = stories.slice(0, 3), rest = T.filter(function(x){ return !top.some(function(s){ return s.fn === x.fn; }); });
  var mast = el("div", "br-mast"); mast.appendChild(el("b", "", "The Morning Brief")); mast.appendChild(el("span", "", now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))); mast.appendChild(el("span", "br-rt", "1 min read")); pg.appendChild(mast);
  var hd = el("header", "br-head"), h1 = el("h1"); h1.id = "br-h1";
  h1.appendChild(el("span", "l1", B.cashD == null ? "Cash is " + baht(B.cash) + "." : "Cash is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(B.cashD) + "."));
  if (top.length){ h1.appendChild(el("em", "", ["", "One thing", "Two things", "Three things"][top.length])); h1.appendChild(document.createTextNode(" need" + (top.length === 1 ? "s" : "") + " your yes.")); }
  else h1.appendChild(el("em", "", "Nothing needs you today."));
  hd.appendChild(h1);
  var names = u.banks.map(function(b){ return b.bank; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
  var lede = el("p", "br-lede"); lede.innerHTML = "Good morning, " + esc(first(u)) + ". You have <b class=\"num\">" + baht(B.cash) + "</b> " + (names.length ? "across " + esc(names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]) : "in the bank") + ". " +
    esc(mName) + " has brought in <b class=\"num\">" + baht(F.rev) + "</b> so far, and you have " + (F.rev >= F.exp ? "kept <b class=\"num\">" + baht(F.rev - F.exp) + "</b> of it." : "spent <b class=\"num\">" + baht(F.exp - F.rev) + "</b> more than came in.");
  hd.appendChild(lede); var by = el("div", "br-by"); by.appendChild(el("span", "", "By ThuraGirl, your bookkeeper")); hd.appendChild(by); pg.appendChild(hd);
  var grid = el("div", "br-grid"), main = el("div", "br-main"), side = el("aside", "br-side");
  main.appendChild(el("div", "br-sec", top.length ? "Needs your yes" : "All clear"));
  if (!top.length) main.appendChild(el("p", "br-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var a = el("article", "story"); a.appendChild(el("span", "no", String(i + 1))); a.appendChild(el("h3", "", s.h)); a.appendChild(el("p", "todo", s.p));
    a.appendChild(btn("pill " + (s.acc ? "acc" : "soft act"), s.btn, s.fn)); main.appendChild(a);
  });
  if (rest.length){ main.appendChild(el("div", "br-sec br-gap", "Can wait")); rest.slice(0, 4).forEach(function(x){ var r = el("div", "row"), rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t)); rt.appendChild(el("div", "m", x.late.txt + (x.amt ? " · " + baht(x.amt) : ""))); r.appendChild(rt); r.appendChild(btn("pill soft act", x.btn, x.fn)); main.appendChild(r); }); }
  var old = u.banks.filter(function(b){ return isStale(b.at); })[0], br = el("div", "row"), brt = el("div", "rt");
  brt.appendChild(el("div", "t", old ? old.bank + " statement is getting old" : "Bank statements are up to date")); brt.appendChild(el("div", "m", u.banks.map(function(b){ return b.bank + " up to " + nice(b.to || B.asOf); }).join(" · ")));
  br.appendChild(brt); br.appendChild(btn("pill soft", "Update", function(){ openUpload(old || u.banks[0]); })); main.appendChild(br);
  side.appendChild(el("div", "br-sec", "Done for you"));
  var dn = el("ul", "br-done"), rc = Object.keys(u.rcpt || {}).length;
  [B.n + " bank lines read and sorted into " + Object.keys(F.cats).length + " categories this month", (u.matched || 0) + " payments matched to invoices and bills", rc + (rc === 1 ? " receipt" : " receipts") + " filed"].forEach(function(t){ var li = el("li"); li.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; li.appendChild(document.createTextNode(t)); dn.appendChild(li); });
  side.appendChild(dn);
  var lk = el("div", "br-sec br-gap br-lk"); lk.appendChild(el("span", "", mName + " so far")); var sm = btn("lnk", "See money", function(){ go("money"); }); sm.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); lk.appendChild(sm); side.appendChild(lk);
  var nums = el("ul", "br-nums");
  [["Money in", F.rev, F.dIn, true], ["Money out", F.exp, F.dOut, false], ["Kept", F.rev - F.exp, F.d, true]].forEach(function(x){ var li = el("li"); li.appendChild(el("span", "", x[0])); li.appendChild(el("b", "num", baht(x[1]))); li.appendChild(el("em", "num" + (x[2] != null && (x[2] >= 0) === x[3] ? " up" : ""), x[2] == null ? "" : (x[2] >= 0 ? "+" : "−") + pctTxt(x[2]))); nums.appendChild(li); });
  side.appendChild(nums);
  var up = (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, today()) <= 14; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; });
  if (up.length){
    side.appendChild(el("div", "br-sec br-gap", "Coming up")); var ul = el("ul", "br-nums br-up");
    up.slice(0, 4).forEach(function(v){ var li = el("li"), s = el("span", "", v.to); s.appendChild(el("small", v.due < today() ? "bad" : "", lateTxt(v.due))); li.appendChild(s); li.appendChild(el("b", "num", baht(v.amount))); ul.appendChild(li); });
    side.appendChild(ul);
  }
  grid.appendChild(main); grid.appendChild(side); pg.appendChild(grid);
  pg.appendChild(el("p", "br-end", "That is everything for today. Ask me anything below."));
}

/* ── invoices ── */
function nextInvNo(u){ var y = new Date().getFullYear(), n = (u.invoices || []).reduce(function(m, v){ var x = String(v.id).match(/(\d+)$/); return x ? Math.max(m, +x[1]) : m; }, 0) + 1; return "INV-" + y + "-" + ("00" + n).slice(-3); }
function newInvoice(pre){
  var u = me(), d = { to: (pre && pre.to) || "", email: "", items: [["", "1", ""]], vat: u.setup.vat !== "No", days: "30" };
  var b = openGS("New invoice", "Create an invoice", "I number it, add VAT if you charge it, and remind you when it is late.");
  var err = el("div", "ferrB"), tot = el("dl", "shB-n"), lines = el("div", "inv-lines");
  function sums(){ var s = d.items.reduce(function(a, it){ return a + (num(it[1]) || 0) * (num(it[2]) || 0); }, 0), v = d.vat ? s * 0.07 : 0; return [s, v, s + v]; }
  function paintTot(){ var s = sums(); tot.innerHTML = ""; [["Subtotal", s[0]], [d.vat ? "VAT 7%" : "No VAT", s[1]], ["Total", s[2]]].forEach(function(x){ var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "num", baht(x[1]))); tot.appendChild(w); }); }
  function paintLines(){
    lines.textContent = "";
    d.items.forEach(function(it, i){
      var r = el("div", "inv-line");
      r.appendChild(fld(i ? "" : "What for", it[0], { ph: "Catering, 50 guests", on: function(v){ it[0] = v; } }));
      r.appendChild(fld(i ? "" : "Qty", it[1], { mode: "decimal", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); it[1] = inp.value; paintTot(); } }));
      r.appendChild(fld(i ? "" : "Price each", it[2], { prefix: "฿", mode: "decimal", ph: "0", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); it[2] = inp.value; paintTot(); } }));
      if (d.items.length > 1){ var x = el("button", "cb-btn rm"); x.type = "button"; x.setAttribute("aria-label", "Remove this line"); x.innerHTML = '<svg class="i"><use href="#i-x"/></svg>'; x.addEventListener("click", function(){ d.items.splice(i, 1); paintLines(); paintTot(); }); r.appendChild(x); }
      lines.appendChild(r);
    });
  }
  var g = el("div", "fgrid");
  g.appendChild(fld("Customer", d.to, { ph: "Company or person", on: function(v){ d.to = v; err.textContent = ""; } }));
  g.appendChild(fld("Customer email (optional)", d.email, { type: "email", ph: "For sending it", on: function(v){ d.email = v.trim(); } }));
  b.appendChild(g); paintLines(); b.appendChild(lines);
  var addL = btn("alt", "", function(){ d.items.push(["", "1", ""]); paintLines(); paintTot(); }); addL.innerHTML = "<u>Add a line</u>"; b.appendChild(addL);
  var r1 = el("div", "frow"); r1.appendChild(el("b", "", "Charge VAT (7%)")); r1.appendChild(seg(["Yes", "No"], d.vat ? "Yes" : "No", function(v){ d.vat = v === "Yes"; paintTot(); })); b.appendChild(r1);
  var r2 = el("div", "frow"); r2.appendChild(el("b", "", "Payment due in")); r2.appendChild(seg(["7 days", "15 days", "30 days"], d.days + " days", function(v){ d.days = v.split(" ")[0]; })); b.appendChild(r2);
  paintTot(); b.appendChild(tot); b.appendChild(err);
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), btn("pill acc", "Create invoice", function(){
    var items = d.items.filter(function(it){ return it[0].trim() || num(it[2]); });
    if (!d.to.trim()) return (err.textContent = "Add who the invoice is for.");
    if (!items.length || items.some(function(it){ return !it[0].trim() || !(num(it[1]) > 0) || !(num(it[2]) > 0); })) return (err.textContent = "Each line needs a description, a quantity and a price.");
    var v = { id: nextInvNo(u), to: d.to.trim(), email: d.email, issued: today(), due: addDays(today(), +d.days), items: items.map(function(it){ return [it[0].trim(), num(it[1]), num(it[2])]; }), vat: d.vat, paid: "" };
    u.invoices = u.invoices || []; u.invoices.push(v); save(); refresh(); openInvoice(v); toast("Invoice " + v.id + " created");
  })));
}
function openInvoice(v){
  var u = me(), tot = invTotal(v), sub = Math.round(tot / (v.vat ? 1.07 : 1) * 100) / 100;
  var b = openGS("Invoice " + v.id, v.to, "Issued " + niceY(v.issued) + " · due " + niceY(v.due));
  var n = el("dl", "shB-n"); [["Subtotal", sub], [v.vat ? "VAT 7%" : "No VAT", tot - sub], ["Total", tot]].forEach(function(x){ var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "num", baht(x[1]))); n.appendChild(w); }); b.appendChild(n);
  var ul = el("ul", "shB-l"); v.items.forEach(function(it){ var li = el("li"); li.appendChild(el("span", "", it[0] + (it[1] !== 1 ? " × " + it[1] : ""))); li.appendChild(el("b", "num", baht(it[1] * it[2]))); ul.appendChild(li); }); b.appendChild(ul);
  b.appendChild(el("p", "st-p" + (v.paid ? " okt" : v.due < today() ? " badt" : ""), v.paid ? "Paid on " + niceY(v.paid) + (v.via === "statement" ? ". I found the payment in your bank statement." : ".") : lateTxt(v.due) + (v.reminded ? ". Reminder sent " + niceY(v.reminded) + "." : ".")));
  var pr = btn("pill soft", "Printable invoice", function(){ printInvoice(v); }, "i-doc");
  var sec = v.paid ? btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; save(); refresh(); openInvoice(v); })
    : btn("pill acc", "Mark as paid", function(){ v.paid = today(); save(); refresh(); openInvoice(v); toast("Marked as paid"); });
  b.appendChild(foot(pr, sec));
  if (!v.paid){ var rm = btn("pill soft wide", v.due < today() ? "Send a reminder" : "Send it to the customer", function(){ openRemind(v, v.due >= today()); }, "i-chat"); b.appendChild(rm); }
  var del = btn("alt danger", "Delete this invoice", function(){ if (del.getAttribute("data-arm")){ u.invoices = u.invoices.filter(function(x){ return x !== v; }); save(); refresh(); closeGS(); toast("Invoice deleted"); } else { del.setAttribute("data-arm", "1"); del.textContent = "Tap again to delete"; } });
  b.appendChild(del);
}
function printInvoice(v){
  var u = me(), tot = invTotal(v), sub = Math.round(tot / (v.vat ? 1.07 : 1) * 100) / 100, c = u.company || {};
  var rows = v.items.map(function(it){ return "<tr><td>" + esc(it[0]) + "</td><td class=r>" + esc(it[1]) + "</td><td class=r>" + baht(it[2]) + "</td><td class=r>" + baht(it[1] * it[2]) + "</td></tr>"; }).join("");
  var h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(v.id) + "</title><style>" +
    "body{font:15px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#0F1514;margin:0;background:#F4F5F5}main{max-width:760px;margin:24px auto;background:#fff;border-radius:18px;padding:40px}" +
    "h1{font-size:30px;letter-spacing:-.03em;margin:0}.top{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.mute{color:#667270}table{width:100%;border-collapse:collapse;margin:28px 0}" +
    "th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #E2E6E5}th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#667270}.r{text-align:right}.tot td{border:0;padding:6px}.tot .big td{font-size:19px;font-weight:700}" +
    ".bar{display:flex;gap:10px;justify-content:flex-end;max-width:760px;margin:24px auto 0}button{border:0;border-radius:99px;padding:11px 18px;font:700 14px system-ui;background:#0FBFB6;color:#04201D;cursor:pointer}" +
    ".note{font-size:12.5px;color:#667270;margin-top:28px}@media print{body{background:#fff}main{margin:0;padding:0}.bar{display:none}}</style></head><body>" +
    '<div class="bar"><button onclick="print()">Print or save as PDF</button></div><main><div class="top"><div><h1>' + (v.vat ? "Tax invoice" : "Invoice") + '</h1><div class="mute">' + esc(v.id) + "</div></div><div><b>" + esc(coName(u)) + "</b><br>" +
    (c.addr ? esc(c.addr) + "<br>" : "") + (c.taxid ? "Tax ID " + esc(c.taxid) : "") + "</div></div>" +
    '<div class="top" style="margin-top:26px"><div><div class="mute">Bill to</div><b>' + esc(v.to) + "</b>" + (v.email ? "<br>" + esc(v.email) : "") + '</div><div><div class="mute">Issued</div>' + niceY(v.issued) + '<div class="mute" style="margin-top:6px">Due</div>' + niceY(v.due) + "</div></div>" +
    "<table><tr><th>Description</th><th class=r>Qty</th><th class=r>Price</th><th class=r>Amount</th></tr>" + rows + "</table>" +
    '<table class="tot"><tr><td class=r>Subtotal</td><td class=r style="width:160px">' + baht(sub) + "</td></tr><tr><td class=r>" + (v.vat ? "VAT 7%" : "No VAT") + "</td><td class=r>" + baht(tot - sub) + '</td></tr><tr class="big"><td class=r>Total</td><td class=r>' + baht(tot) + "</td></tr></table>" +
    (v.paid ? "<p><b>Paid on " + niceY(v.paid) + ".</b></p>" : "") + '<p class="note">Made with ThuraGirl (test build).</p></main></body></html>';
  var url = URL.createObjectURL(new Blob([h], { type: "text/html" })), w = window.open(url, "_blank");
  if (!w){ var a = document.createElement("a"); a.href = url; a.download = v.id + ".html"; document.body.appendChild(a); a.click(); a.remove(); toast("Saved the invoice as a file"); }
  setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
}

/* ── reminders: written for the owner to send from their own email or chat ── */
function openRemind(v, initial){
  var u = me(), tot = invTotal(v), sign = "\n" + (u.name || "") + "\n" + coName(u);
  var msg = initial ? "Hello " + v.to + ",\n\nPlease find invoice " + v.id + " for " + baht(tot) + ", due on " + niceY(v.due) + ".\n\nThank you," + sign
    : "Hello " + v.to + ",\n\nA friendly reminder that invoice " + v.id + " for " + baht(tot) + " was due on " + niceY(v.due) + ". If you have already paid, thank you, and please ignore this message.\n\nKind regards," + sign;
  var b = openGS(initial ? "Send invoice" : "Reminder", v.to, "Invoice " + v.id + " · " + baht(tot) + " · " + lateTxt(v.due));
  var em = fld("Send to", v.email, { type: "email", ph: "customer@example.com", on: function(x){ v.email = x.trim(); save(); } }); b.appendChild(em);
  var ta = fld("Message", msg, { area: 1, wide: 1 }); $("textarea", ta).rows = 8; b.appendChild(ta);
  function done(how){ if (!initial){ v.reminded = today(); } else v.sent = today(); save(); refresh(); closeGS(); toast(how); }
  var mail = btn("pill acc", "Email it", function(){
    var t = $("textarea", ta).value; location.href = "mailto:" + encodeURIComponent(v.email || "") + "?subject=" + encodeURIComponent((initial ? "Invoice " : "Reminder: invoice ") + v.id + " from " + coName(u)) + "&body=" + encodeURIComponent(t);
    done("Opened your email app");
  }, "i-chat");
  var copy = btn("pill soft", "Copy message", function(){
    var t = $("textarea", ta).value;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ done("Copied. Paste it into LINE or email."); }, function(){ $("textarea", ta).select(); toast("Select the text and copy it"); });
  });
  b.appendChild(foot(copy, mail));
  if (navigator.share){ b.appendChild(btn("pill soft wide", "Share to LINE or another app", function(){ navigator.share({ title: "Invoice " + v.id, text: $("textarea", ta).value }).then(function(){ done("Shared"); }, function(){}); })); }
  b.appendChild(el("p", "tnote", "In the full app I send this for you. Here it goes out from your own email or chat app."));
}

/* ── bills and paying them ── */
function newBill(pre){
  var u = me(), d = { to: "", amount: "", due: today(), pp: "", note: "" };
  var b = openGS("Pay", "Pay someone", "Add the bill. With a PromptPay ID I make a QR code you can scan in any Thai banking app.");
  var err = el("div", "ferrB"), g = el("div", "fgrid");
  g.appendChild(fld("Pay to", d.to, { ph: "Supplier or person", on: function(v){ d.to = v; err.textContent = ""; } }));
  g.appendChild(fld("Amount", d.amount, { prefix: "฿", mode: "decimal", ph: "0", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); d.amount = inp.value; } }));
  g.appendChild(fld("Due", d.due, { type: "date", on: function(v){ d.due = v; } }));
  g.appendChild(fld("PromptPay ID (optional)", d.pp, { mode: "numeric", max: 13, ph: "Phone or tax ID", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); d.pp = inp.value; return d.pp && !(d.pp.length === 10 || d.pp.length === 13) ? "A 10-digit phone number or a 13-digit ID" : ""; } }));
  g.appendChild(fld("Note (optional)", d.note, { wide: 1, ph: "Invoice number, what it is for", on: function(v){ d.note = v; } }));
  b.appendChild(g); b.appendChild(err);
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), btn("pill acc", "Save bill", function(){
    if (!d.to.trim()) return (err.textContent = "Add who you are paying.");
    if (!(num(d.amount) > 0)) return (err.textContent = "Add the amount.");
    if (!d.due) return (err.textContent = "Add the due date.");
    if (d.pp && !(d.pp.length === 10 || d.pp.length === 13)) return (err.textContent = "Check the PromptPay ID.");
    var v = { id: "b" + Date.now().toString(36), to: d.to.trim(), amount: num(d.amount), due: d.due, pp: d.pp, note: d.note.trim(), paid: "" };
    u.bills = u.bills || []; u.bills.push(v); save(); refresh(); openBill(v); toast("Bill saved");
  })));
}
function openBill(v){
  var u = me(), b = openGS("Bill", v.to, baht(v.amount) + " · " + (v.paid ? "paid " + niceY(v.paid) : lateTxt(v.due)) + (v.note ? " · " + v.note : ""));
  var qr = el("div", "qrbox");
  function paintQr(){
    qr.textContent = "";
    if (!v.pp){ qr.appendChild(el("p", "st-p", "Add the supplier's PromptPay ID and I make a QR code with the amount filled in.")); return; }
    var pl = promptPay(v.pp, v.amount); if (!pl){ qr.appendChild(el("p", "ferrB", "That PromptPay ID does not look right.")); return; }
    var box = el("div", "qr"); box.appendChild(el("span", "st-p", "Making the code…")); qr.appendChild(box);
    qrSvg(pl).then(function(svg){ box.innerHTML = svg; }, function(){ box.textContent = "The QR code could not load. Check your connection."; });
    qr.appendChild(el("p", "st-p", "Scan with any Thai banking app. PromptPay " + v.pp + ", " + baht(v.amount) + "."));
  }
  if (!v.paid){
    b.appendChild(fld("PromptPay ID", v.pp, { mode: "numeric", max: 13, ph: "Phone or tax ID", on: function(x, inp){ inp.value = x.replace(/\D/g, ""); if (inp.value.length === 10 || inp.value.length === 13){ v.pp = inp.value; save(); paintQr(); return ""; } if (!inp.value){ v.pp = ""; save(); paintQr(); } return inp.value ? "A 10-digit phone number or a 13-digit ID" : ""; } }));
    paintQr(); b.appendChild(qr);
    b.appendChild(foot(btn("pill soft", "Close", closeGS), btn("pill acc", "Mark as paid", function(){ v.paid = today(); save(); refresh(); closeGS(); toast(v.to + " marked as paid"); })));
  } else {
    b.appendChild(el("p", "st-p okt", "Paid on " + niceY(v.paid) + (v.via === "statement" ? ". I found it in your bank statement." : ".")));
    b.appendChild(foot(btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; save(); refresh(); openBill(v); })));
  }
  var del = btn("alt danger", "Delete this bill", function(){ if (del.getAttribute("data-arm")){ u.bills = u.bills.filter(function(x){ return x !== v; }); save(); refresh(); closeGS(); toast("Bill deleted"); } else { del.setAttribute("data-arm", "1"); del.textContent = "Tap again to delete"; } });
  b.appendChild(del);
}

/* ── receipts and other files dropped into the chat ── */
function fileReceipt(f){
  var u = me(), meta = { name: f.name, size: f.size, at: Date.now() };
  var open = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; })[0];
  u.rcpt = u.rcpt || {};
  if (open){ u.rcpt[open.k.slice(3)] = meta; save(); refresh(); return "Got it. I filed " + f.name + " as the receipt for " + open.m + "."; }
  u.rcpt["file:" + Date.now()] = meta; save(); refresh(); return "Got it. I saved " + f.name + " with your receipts.";
}

/* ── ThuraGirl answers from the books ── */
function span(u, a, b){
  var o = { inc: 0, exp: 0, cats: {}, n: 0 };
  (u.tx || []).forEach(function(x){ if (x.d < a || x.d > b) return; o.n++; if (x.a > 0) o.inc += x.a; else o.exp -= x.a; var c = cat(x.t, x.a); o.cats[c] = (o.cats[c] || 0) + Math.abs(x.a); });
  o.kept = o.inc - o.exp; return o;
}
function whichMonth(t, asOf){
  var A = day(asOf), y = A.getFullYear(), m = -1;
  if (/last month|previous month|เดือนที่แล้ว|เดือนก่อน/.test(t)) m = A.getMonth() - 1;
  else if (/this month|เดือนนี้/.test(t)) m = A.getMonth();
  else MONTH.forEach(function(n, i){ if (new RegExp("\\b(" + n.toLowerCase() + "|" + MON3[i] + ")\\b").test(t)) m = i; });
  if (m < 0) return null;
  if (m > A.getMonth()) y -= 1; if (m < 0){ m += 12; y -= 1; }
  var a = iso(new Date(y, m, 1)), b = iso(new Date(y, m + 1, 0)); if (b > asOf) b = asOf;
  return { a: a, b: b, name: MONTH[m], partial: b === asOf && day(asOf).getDate() < new Date(y, m + 1, 0).getDate() };
}
var CATWORDS = [[/wage|salar|payroll|staff/, "Wages"], [/rent|landlord/, "Rent"], [/marketing|ads?\b|advert|facebook/, "Marketing"], [/stock|ingredient|supplies|makro|food cost|supplier/, "Stock and supplies"],
  [/utilit|electric|water|internet|power/, "Utilities"], [/tax|vat|sso|social security/, "Tax and social security"], [/fee|bank charge/, "Bank fees"]];
function brain(q){
  var u = me(), t = q.toLowerCase(), B = books(u), T = today();
  if (/^(hi|hello|hey|สวัสดี)/.test(t)) return "Hello " + first(u) + ". Ask me about your cash, a month, who owes you, your bills or where the money goes.";
  if (/(create|make|new|send|write|ทำ|สร้าง).*(invoice|bill to|ใบแจ้งหนี้)|^invoice/.test(t)){ setTimeout(function(){ newInvoice(); }, 300); return "Opening a new invoice for you."; }
  if (/upload|statement|import/.test(t) && !/p&l|profit/.test(t)){ setTimeout(function(){ openUpload(); }, 300); return "Opening the statement upload. CSV and Excel files work best."; }
  if (!B) return "I don't have any numbers yet. Upload a bank statement, or try the sample, and I can answer that.";
  var F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()];
  var openInv = (u.invoices || []).filter(function(v){ return !v.paid; }), lateInv = openInv.filter(function(v){ return v.due < T; });
  var openBills = (u.bills || []).filter(function(v){ return !v.paid; }), lateBills = openBills.filter(function(v){ return v.due < T; });
  if (/^(pay|i want to pay|make a payment)/.test(t)){ setTimeout(function(){ newBill(); }, 300); return "Opening a new payment. Add the PromptPay ID and I make a QR code."; }
  if (/who owes|owes me|owed to me|receivable|unpaid invoice|outstanding invoice/.test(t)){
    if (!openInv.length) return "Nobody owes you anything right now. Every invoice is paid.";
    return openInv.length + (openInv.length === 1 ? " invoice is" : " invoices are") + " open, " + baht(openInv.reduce(function(s, v){ return s + invTotal(v); }, 0)) + " in total." +
      (lateInv.length ? " Late: " + lateInv.map(function(v){ return v.to + " (" + baht(invTotal(v)) + ", " + lateTxt(v.due) + ")"; }).join(", ") + ". Open one in Money and tap Remind." : " None are late yet.");
  }
  if (/overdue|late|behind/.test(t)){
    var L = lateInv.map(function(v){ return "invoice #" + v.id + " from " + v.to + " (" + baht(invTotal(v)) + ", " + lateTxt(v.due) + ")"; }).concat(lateBills.map(function(v){ return "your " + v.to + " bill (" + baht(v.amount) + ", " + lateTxt(v.due) + ")"; }));
    return L.length ? (L.length === 1 ? "One thing is overdue: " : L.length + " things are overdue: ") + L.join("; ") + "." : "Nothing is overdue. Well done.";
  }
  if (/bill|i owe|do i owe|payable|due soon|upcoming/.test(t)){
    if (!openBills.length) return "No bills are waiting. Add one with Pay and I remind you before it is due.";
    return "You have " + openBills.length + (openBills.length === 1 ? " bill" : " bills") + " to pay, " + baht(openBills.reduce(function(s, v){ return s + v.amount; }, 0)) + " in total. Next: " +
      openBills.sort(function(a, b){ return a.due < b.due ? -1 : 1; }).slice(0, 3).map(function(v){ return v.to + " " + baht(v.amount) + " (" + lateTxt(v.due).toLowerCase() + ")"; }).join(", ") + ".";
  }
  if (/vat|tax|set aside|pp\.?30/.test(t)){
    var x = F.tax; return "For " + mName + " so far I would set aside " + baht(x[0] + x[1] + x[2]) + ": VAT " + baht(x[0]) + (u.setup.vat === "No" ? " (you said you are not VAT registered)" : "") + ", withholding " + baht(x[1]) + ", and " + baht(x[2]) + " towards company tax. These are estimates from your statements, not a filing.";
  }
  var cw = CATWORDS.filter(function(c){ return c[0].test(t); })[0], wm = whichMonth(t, B.asOf);
  if (cw && /how much|spend|spent|cost|pay|paid|on /.test(t) || cw && !/profit|p&l/.test(t)){
    var r = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s = span(u, r.a, r.b), v = s.cats[cw[1]] || 0;
    return v ? cw[1] + " in " + r.name + ": " + baht(v) + ", " + (s.exp ? Math.round(v / s.exp * 100) : 0) + "% of everything that went out." : "I don't see any " + cw[1].toLowerCase() + " in " + r.name + ".";
  }
  if (/where.*(go|went)|spend|spent|expens|cost|money out/.test(t)){
    var r2 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s2 = span(u, r2.a, r2.b), top = Object.keys(s2.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s2.cats[b] - s2.cats[a]; });
    return baht(s2.exp) + " went out in " + r2.name + ". The biggest: " + top.slice(0, 4).map(function(c){ return c.toLowerCase() + " " + baht(s2.cats[c]) + " (" + Math.round(s2.cats[c] / s2.exp * 100) + "%)"; }).join(", ") + ".";
  }
  if (/come from|revenue|sales|income|earn|money in|customers?/.test(t)){
    var r3 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s3 = span(u, r3.a, r3.b), tops = Object.keys(s3.cats).filter(function(c){ return INC.some(function(e){ return e[1] === c; }) || c === "Other income"; }).sort(function(a, b){ return s3.cats[b] - s3.cats[a]; });
    return baht(s3.inc) + " came in during " + r3.name + ": " + tops.slice(0, 4).map(function(c){ return c.toLowerCase() + " " + baht(s3.cats[c]); }).join(", ") + ".";
  }
  if (/p&l|profit and loss|income statement|full p/.test(t)){
    var r4 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s4 = span(u, r4.a, r4.b), lines = ["Profit and loss, " + r4.name + " (from your bank lines)", "Money in " + baht(s4.inc)];
    Object.keys(s4.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s4.cats[b] - s4.cats[a]; }).forEach(function(c){ lines.push("  " + c + " " + baht(s4.cats[c])); });
    lines.push("Money out " + baht(s4.exp)); lines.push((s4.kept >= 0 ? "Kept " : "Lost ") + baht(Math.abs(s4.kept)) + (s4.inc ? ", a " + (s4.kept / s4.inc * 100).toFixed(1) + "% margin" : ""));
    return lines.join("\n");
  }
  if (wm || /how was|how did|profit|month|quarter|year|doing|perform/.test(t)){
    var r5 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" };
    if (/quarter/.test(t)){ var Q = B.fin.qtd; return "This quarter so far: " + baht(Q.rev) + " in, " + baht(Q.exp) + " out, " + baht(Q.rev - Q.exp) + " kept" + (Q.d != null ? ", " + (Q.d >= 0 ? "up " : "down ") + pctTxt(Q.d) + " on the same point last quarter." : "."); }
    if (/year/.test(t)){ var Y = B.fin.ytd; return "This year so far (since your statements start on " + nice(B.first) + "): " + baht(Y.rev) + " in, " + baht(Y.exp) + " out, " + baht(Y.rev - Y.exp) + " kept."; }
    var s5 = span(u, r5.a, r5.b); if (!s5.n) return "I don't have statements for " + r5.name + ". They start on " + niceY(B.first) + ".";
    var big = Object.keys(s5.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s5.cats[b] - s5.cats[a]; })[0];
    return r5.name + (r5.partial ? "" : "") + ": " + baht(s5.inc) + " in and " + baht(s5.exp) + " out. You " + (s5.kept >= 0 ? "kept " + baht(s5.kept) : "spent " + baht(-s5.kept) + " more than came in") + (s5.inc ? ", a " + (s5.kept / s5.inc * 100).toFixed(1) + "% margin" : "") + "." + (big ? " The biggest cost was " + big.toLowerCase() + " at " + baht(s5.cats[big]) + "." : "");
  }
  if (/cash|bank|balance|money|how much do i have/.test(t)){
    var low = B.series.reduce(function(m, s){ return s[1] < m[1] ? s : m; }, B.series[0]);
    return "Cash is " + baht(B.cash) + " across " + u.banks.length + (u.banks.length === 1 ? " account" : " accounts") + ", as of " + nice(B.asOf) + "." + (B.cashD != null ? " That is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(B.cashD) + " since the start of " + mName + "." : "") + " The lowest point in the last 30 days was " + baht(low[1]) + " on " + nice(low[0]) + ".";
  }
  if (/receipt/.test(t)){ var n = Object.keys(u.rcpt || {}).length, miss = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; }).length; return n + (n === 1 ? " receipt is" : " receipts are") + " filed." + (miss ? " " + miss + " large payments still need one. Tap + to add a photo." : ""); }
  if (/help|what can you|how do/.test(t)) return "I read your bank statements and keep your books. Ask me things like \"How was " + (B.pack ? B.pack.name : mName) + "?\", \"Where did the money go?\", \"Who owes me money?\", \"How much did I spend on wages?\" or \"Show the full P&L\". I can also make an invoice or a payment.";
  return "I'm not sure about that one yet. In this test build I answer from your statements, invoices and bills. Try \"How's my cash?\", \"What's overdue?\" or \"Where did the money go?\"";
}

/* ── chat: send, suggestions, + and the mic ── */
var chat = { timer: 0, rec: null, on: false };
function ask(q){
  q = (q || "").trim(); if (!q) return;
  var inp = $("#b-in"), pop = $("#b-pop"); inp.value = ""; $("#b-send").disabled = true; $("#b-sug").hidden = true; pop.hidden = false; $("#b-me").textContent = q;
  var r = $("#b-reply"); r.innerHTML = '<span class="dotsT" aria-label="ThuraGirl is typing"><i></i><i></i><i></i></span>';
  clearTimeout(chat.timer); chat.timer = setTimeout(function(){ r.textContent = brain(q); }, calm ? 0 : 650);
}
function say(me2, reply){ var pop = $("#b-pop"); pop.hidden = false; $("#b-sug").hidden = true; $("#b-me").textContent = me2; $("#b-reply").textContent = reply; }
function chips(){
  var u = me(), B = books(u), last = B && B.pack ? B.pack.name : "this month";
  return tab === "money" ? ["Who owes me money?", "Where did the money go?", "Show the full P&L"] : ["What's overdue?", "How was " + last + "?", "How's my cash?"];
}
function micToggle(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $("#b-mic"), inp = $("#b-in");
  if (!SR){ toast("Voice input doesn't work in this browser. Try Chrome, Edge or Safari."); return; }
  if (chat.on && chat.rec){ chat.rec.stop(); return; }
  var r = new SR(), got = "";
  r.lang = /^th/i.test(navigator.language || "") ? "th-TH" : "en-US"; r.interimResults = true; r.continuous = false;
  r.onstart = function(){ chat.on = true; mic.classList.add("rec"); mic.setAttribute("aria-pressed", "true"); inp.placeholder = "Listening…"; };
  r.onresult = function(ev){ var s = ""; for (var i = 0; i < ev.results.length; i++) s += ev.results[i][0].transcript; inp.value = s; $("#b-send").disabled = !s.trim(); if (ev.results[ev.results.length - 1].isFinal) got = s; };
  r.onerror = function(ev){ if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("Microphone access is blocked. Allow it for this site to talk to me."); else if (ev.error === "no-speech") toast("I didn't hear anything. Tap the mic and try again."); else if (ev.error !== "aborted") toast("Voice input stopped: " + ev.error); };
  r.onend = function(){ chat.on = false; mic.classList.remove("rec"); mic.setAttribute("aria-pressed", "false"); inp.placeholder = "Ask ThuraGirl"; if (got.trim()) ask(got); };
  chat.rec = r; try { r.start(); } catch (e) { toast("Voice input could not start."); }
}
function chatFile(f){
  var ext = (f.name.split(".").pop() || "").toLowerCase();
  if (["csv", "xlsx", "xls"].indexOf(ext) >= 0){ openUpload(); takeFile(f); return; }
  if (f.size > MAX){ say(f.name, "That file is " + size(f.size) + ". The limit is 10 MB."); return; }
  if (!(/^image\//.test(f.type) || ext === "pdf")){ say(f.name, "I can take bank statements (CSV or Excel) and receipts (photo or PDF). That file type doesn't work here."); return; }
  if (!me().hasData){ say(f.name, "Thanks. Upload a bank statement first, and I can match receipts like this one to your payments."); return; }
  say(f.name, fileReceipt(f));
}

/* ── settings: your data ── */
var dataArmed = false;
function dataCard(u, root){
  var c = card("Your data");
  c.appendChild(el("p", "st-p", u.tx && u.tx.length ? u.tx.length + " bank lines from " + u.banks.length + (u.banks.length === 1 ? " account" : " accounts") + ", " + (u.invoices || []).length + " invoices, " + (u.bills || []).length + " bills and " + Object.keys(u.rcpt || {}).length + " receipts are saved in this browser." : "Nothing is loaded yet. Upload a statement or try the sample."));
  var r = el("div", "chips");
  r.appendChild(btn("pill soft act", "Download a copy", function(){
    var copy = JSON.parse(JSON.stringify(u)); delete copy.salt; delete copy.hash;
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" })); a.download = "thuragirl-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove();
  }));
  if (!u.tx || !u.tx.length) r.appendChild(btn("pill soft act", "Load the sample", function(){ useSample(); }));
  else r.appendChild(btn("pill soft act danger", dataArmed ? "Tap again to clear" : "Clear statements and invoices", function(){
    if (!dataArmed){ dataArmed = true; renderSettings(); return; }
    dataArmed = false; u.tx = []; u.banks = []; u.invoices = []; u.bills = []; u.rcpt = {}; u.done = {}; u.hasData = false; u.matched = 0; u.sample = false; save(); BK_CACHE.key = ""; renderSettings(); toast("Cleared");
  }));
  c.appendChild(r); root.appendChild(c);
}
