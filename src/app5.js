
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
function closeGS(){ var s = $("#gs"); if (s){ var was = !s.hidden; s.hidden = true; if (was && s.getAttribute("data-dirty")){ s.removeAttribute("data-dirty"); refresh(); } } }
function btn(cls, label, fn, icon){ var b = el("button", cls); b.type = "button"; b.innerHTML = icon ? '<svg class="i"><use href="#' + icon + '"/></svg>' : ""; b.appendChild(document.createTextNode(label)); if (fn) b.addEventListener("click", fn); return b; }
function foot(a, b){ var f = el("div", "shB-f" + (b ? "" : " one")); f.appendChild(a); if (b) f.appendChild(b); return f; }
/* after an action: update the page in place. Same tab, same scroll position, no replayed entrance animation */
function refresh(){
  BK_CACHE.key = ""; var y = window.scrollY; showTab();
  if (tab === "money"){ var B = books(me()); if (B && B.fin[per]) $("#m-val").textContent = money(Math.abs(B.fin[per].rev - B.fin[per].exp)); }
  window.scrollTo(0, y);
}

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
function sendReq(r, after){ openKyc(r.form, r.doc + ". One PDF or image, up to 10 MB.", function(meta){ r.file = meta; r.file.at = Date.now(); r.done = Date.now(); save(); refresh(); toast("Sent to your accountant"); if (after) after(); }); }
function openReqs(){
  var u = me(), reqs = (u.requests || []).filter(function(r){ return !r.file; });
  if (!reqs.length){ closeGS(); return; }
  var b = openGS("Your accountant", reqs.length + " documents to send", "Send them one by one, whenever you can. Each goes straight to your accountant.");
  var by = {}; reqs.forEach(function(r){ (by[r.form] = by[r.form] || []).push(r); });
  Object.keys(by).forEach(function(f){
    b.appendChild(el("b", "regsub", f));
    var rows = el("div", "ob-rows");
    by[f].forEach(function(r){ var row = el("div", "docrow"), tx = el("div", "tx"); tx.appendChild(el("b", "", r.doc)); tx.appendChild(el("span", "", "Requested " + ago(r.at, true))); row.appendChild(tx); row.appendChild(btn("pill soft act", "Upload", function(){ closeGS(); sendReq(r, openReqs); })); rows.appendChild(row); });
    b.appendChild(rows);
  });
  b.appendChild(foot(btn("pill acc", "Later", closeGS)));
}
function tasks(u){
  var B = books(u), t = today(), out = [];
  if (!B) return out;
  var reqs = (u.requests || []).filter(function(r){ return !r.file; });
  if (reqs.length === 1){ var r1 = reqs[0];
    out.push({ k: "req:" + r1.id, ic: "i-doc", t: "Your accountant asked for a document", m: r1.doc, late: { txt: "Requested " + ago(r1.at, true), cls: "warn" }, btn: "Upload", rank: 1, fn: function(){ sendReq(r1); },
      story: { h: "Your accountant needs one more document", p: r1.doc + ", for " + r1.form + "." } }); }
  else if (reqs.length > 1) out.push({ k: "req:all", ic: "i-doc", t: "Your accountant asked for " + reqs.length + " documents", m: reqs.map(function(r){ return r.form; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).join(", "), late: { txt: "Requested " + ago(reqs[0].at, true), cls: "warn" }, btn: "See list", rank: 1, fn: openReqs,
      story: { h: "Your accountant needs " + reqs.length + " documents", p: "For " + reqs.map(function(r){ return r.form; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).slice(0, 3).join(", ") + ". Most are a quick photo or a download from your bank." } });
  (u.invoices || []).filter(function(v){ return !v.paid && v.due < t && (!v.reminded || diffDays(t, v.reminded) >= 7); }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var tot = invTotal(v);
    out.push({ k: "inv:" + v.id, ic: "i-alert", t: "Invoice #" + v.id + " is unpaid", m: v.to, amt: tot, late: { txt: lateTxt(v.due), cls: "bad" }, btn: "Remind", rank: 2, fn: function(){ openRemind(v); },
      story: { h: v.to + " has not paid you", p: "Invoice #" + v.id + " for " + baht(tot) + " is " + lateTxt(v.due).replace("late", "late") + ". I have a polite reminder ready to go." } });
  });
  (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, t) <= 7; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var late = v.due < t;
    out.push({ k: "bill:" + v.id, due: v.due, ic: "i-pay", t: "Pay " + v.to, m: v.note || "Bill", amt: v.amount, late: { txt: lateTxt(v.due), cls: late ? "bad" : v.due === t ? "warn" : "" }, btn: "Pay", rank: late ? 2 : 4, fn: function(){ openBill(v); },
      story: { h: late ? "The " + v.to + " bill is overdue" : v.to + " is due " + (v.due === t ? "today" : "soon"), p: baht(v.amount) + ", " + lateTxt(v.due).toLowerCase() + ". Scan the PromptPay code or mark it paid." } });
  });
  var since = addDays(B.asOf, -30);
  u.tx.filter(function(x){ return x.a <= -10000 && x.d >= since && /Stock and supplies|Marketing|Other costs|Utilities/.test(cat(x.t, x.a)) && !(u.rcpt || {})[txid(x)]; })
    .sort(function(a, b){ return a.a - b.a; }).slice(0, 2).forEach(function(x){
      out.push({ k: "rc:" + txid(x), ic: "i-receipt", t: "Receipt missing: " + cap(x.t.toLowerCase()), m: x.t + ", " + nice(x.d), amt: -x.a, late: { txt: "Left your account on " + nice(x.d), cls: "" }, btn: "Upload", rank: 5,
        fn: function(){ openKyc("Receipt", x.t + " · " + baht(-x.a) + ". A photo or PDF of the receipt or tax invoice.", function(meta){ u.rcpt = u.rcpt || {}; u.rcpt[txid(x)] = meta; save(); refresh(); toast("Receipt filed"); }); },
        story: { h: "A receipt is missing", p: baht(-x.a) + " to " + x.t + " on " + nice(x.d) + ". Snap the receipt and I file it." } });
    });
  (u.banks || []).filter(function(b){ return Date.now() - b.at > 7 * 864e5; }).forEach(function(b){
    out.push({ k: "bk:" + b.bank + b.acct, ic: "i-up", t: b.bank + " statement is getting old", m: "Last uploaded " + ago(b.at, true), late: { txt: "Uploaded " + ago(b.at, true), cls: "warn" }, btn: "Upload", rank: 6, fn: function(){ openUpload(b); } });
  });
  moreTasks(u, B, out); proofTasks(u, out);
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
  var T = tasks(u), lat = laterBills(u), shown = needsAll ? T.concat(lat) : T.slice(0, 6);
  shown.forEach(function(x){ sec.insertBefore(rowFor(x), setup); });
  var p = B && B.pack, showRev = !!(p && !(u.done["rev:" + p.key]));
  rev.hidden = !showRev; rev.classList.remove("gone", "going"); rev.style.height = "";
  if (p){ $(".rt .t", rev).textContent = p.name + " Review Pack"; $(".rt .m", rev).textContent = "Your month on one page. " + baht(p.kept) + " kept."; }
  var later = lat.length + Math.max(0, T.length - 6);
  var more = $(".needB .more");
  if (!more.getAttribute("role")){ more.setAttribute("role", "button"); more.tabIndex = 0; more.addEventListener("click", function(){ needsAll = !needsAll; paintNeeds(me()); if (!needsAll) $(".needB").scrollIntoView({ block: "start", behavior: "smooth" }); }); more.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); more.click(); } }); }
  more.hidden = !later; more.classList.toggle("open", needsAll);
  if (later) more.firstChild.nodeValue = needsAll ? "Show less" : later + (later === 1 ? " more thing" : " more things") + " coming up this month";
}
var needsAll = false;
function laterBills(u){
  var t = today();
  return (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, t) > 7 && diffDays(v.due, t) <= 31; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { k: "later:" + v.id, ic: "i-clock", t: "Pay " + v.to, m: v.note || "Bill", amt: v.amount, late: { txt: lateTxt(v.due), cls: "" }, btn: "View", rank: 9, fn: function(){ openBill(v); } };
  });
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
    var b = $(x[0]); $(".n", b).textContent = baht(x[2]); b.setAttribute("aria-label", x[1] + ", " + money(x[2]) + " baht. Open Finance");
    var d = $(".d", b); d.textContent = ""; if (x[3] != null){ d.insertAdjacentHTML("beforeend", '<svg class="i"' + (x[3] < 0 ? ' style="transform:scaleY(-1)"' : "") + '><use href="#i-trend"/></svg>'); d.appendChild(document.createTextNode(pctTxt(x[3]))); }
    d.appendChild(el("em", "", x[3] == null && x[0] !== ".mini.t3" ? "this month" : x[4])); d.classList.toggle("down", x[3] != null && x[3] < 0);
  });
  $(".snapB .sech span").textContent = MONTH[day(B.asOf).getMonth()] + " so far";
}

/* ── money lists ── */
var FOLD = {};
function foldBtn(open, n, fn){ var b = btn("fold lpad", open ? "Show fewer" : "Show all " + n, fn, "i-chev"); b.setAttribute("aria-expanded", String(open)); if (open) b.classList.add("open"); return b; }
function paintLists(u){
  var L = $$("#b-money .listB"), t = today();
  function fill(sec, title, items, empty, addLabel, addFn){
    sec.textContent = "";
    var tot = items.reduce(function(s, x){ return s + x.amt; }, 0), late = items.filter(function(x){ return x.due < t; }).length;
    var h = el("div", "cardh"); h.appendChild(el("h2", "", title)); h.appendChild(el("span", "tot num", baht(tot)));
    var sub = el("div", "sub", items.length + (items.length === 1 ? " open" : " open")); if (late){ sub.appendChild(document.createTextNode(" · ")); sub.appendChild(el("span", "bad", late + " overdue")); }
    h.appendChild(sub); sec.appendChild(h);
    if (!items.length) sec.appendChild(el("p", "st-p lpad", empty));
    var key = "fold:" + title, open = !!FOLD[key], cut = 4;
    items.forEach(function(x, i){
      if (i >= cut && !open) return;
      var r = el("div", "row"), rt = el("button", "rt rtb"); rt.type = "button"; rt.addEventListener("click", x.open);
      rt.appendChild(el("div", "t", x.name)); var m = el("div", "m"); m.appendChild(el("span", x.due < t ? "bad" : "", lateTxt(x.due))); var ma = el("span", "ma", " · "); ma.appendChild(el("span", "num", baht(x.amt))); m.appendChild(ma); rt.appendChild(m);
      r.appendChild(rt); r.appendChild(el("span", "amt num", baht(x.amt))); r.appendChild(btn("pill soft act", x.btn, x.act)); sec.appendChild(r);
    });
    if (items.length > cut) sec.appendChild(foldBtn(open, items.length, function(){ FOLD[key] = !open; paintLists(u); }));
    var add = btn("alt lpad", "", addFn); add.innerHTML = "<u>" + addLabel + "</u>"; sec.appendChild(add);
  }
  fill(L[0], "Owed to you", (u.invoices || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: invTotal(v), btn: v.due < t ? "Remind" : "View", act: function(){ if (v.due < t) openRemind(v); else openInvoice(v); }, open: function(){ openInvoice(v); } };
  }), "No unpaid invoices. Make one and I keep track of it.", "Create an invoice", function(){ startInvoiceFlow(); });
  fill(L[1], "You owe", (u.bills || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: v.amount, btn: "Pay", act: function(){ openBill(v); }, open: function(){ openBill(v); } };
  }), "No bills waiting. Add one and I remind you before it is due.", "Add a bill", function(){ startPayFlow(); });
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
  packMore(p, s);
}
/* the full month behind the one-pager: every money-in and money-out line, week by week, and the statement itself */
var packOpen = false;
function packMore(p, s){
  var old = $(".pk-more", s); if (old) old.remove(); if (!p.F) return;
  var w = el("div", "pk-more"), F = p.F;
  var t = btn("pk-tog", packOpen ? L("Hide the full month", "ซ่อนรายละเอียดทั้งเดือน") : L("See the full month", "ดูรายละเอียดทั้งเดือน"), function(){ packOpen = !packOpen; packMore(p, s); }, "i-chev");
  t.setAttribute("aria-expanded", String(packOpen)); w.appendChild(t);
  if (packOpen){
    var body = el("div", "pk-body");
    [[L("Money in", "เงินเข้า"), F.revMix, F.rev], [L("Money out", "เงินออก"), F.expMix, F.exp]].forEach(function(g){
      var h = el("div", "pk-h"); h.appendChild(el("span", "", g[0])); h.appendChild(el("b", "num", baht(g[2]))); body.appendChild(h);
      g[1].forEach(function(r){ var row = el("div", "pk-r"); row.appendChild(el("span", "", r[0])); row.appendChild(el("em", "num", g[2] ? Math.round(r[1] / g[2] * 100) + "%" : "")); row.appendChild(el("b", "num", baht(r[1]))); body.appendChild(row); });
    });
    var wk = el("div", "pk-wk"), mx = Math.max.apply(null, F.flow.map(function(x){ return Math.max(x[1], x[2]); }).concat([1]));
    var wh = el("div", "pk-h"); wh.appendChild(el("span", "", L("Week by week", "รายสัปดาห์"))); body.appendChild(wh);
    F.flow.forEach(function(x){
      var r = el("div", "pk-wr"); r.appendChild(el("span", "", x[0]));
      var bars = el("div", "pk-bars"), bi = el("i", "in"), bo = el("i", "out"); bi.style.width = (x[1] / mx * 100) + "%"; bo.style.width = (x[2] / mx * 100) + "%"; bars.appendChild(bi); bars.appendChild(bo); r.appendChild(bars);
      r.appendChild(el("b", "num", baht(x[1] - x[2]))); wk.appendChild(r);
    });
    body.appendChild(wk);
    var act = el("div", "pk-act"); plActions(act, F); body.appendChild(act);
    w.appendChild(body);
  }
  var ok = $(".shB-ok", s); ok.parentNode.insertBefore(w, ok);
}
function openSheet(){ var u = me(); packOpen = false; paintPack(u); var s = $("#b-sheet"); $("#b-agree").checked = false; $("#b-approve").disabled = true; s.hidden = false; try { $("#b-shx").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeSheet(){ $("#b-sheet").hidden = true; }
function approvePack(){ var u = me(), B = books(u); if (!B || !B.pack) return; u.done["rev:" + B.pack.key] = { at: Date.now() }; save(); closeSheet(); collapse($("#b-rev")); setTimeout(function(){ setCount(); }, 400); if (tab === "brief") renderBrief(); toast(B.pack.name + " is signed off"); }


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
  var emF, emAuto = true;
  g.appendChild(fld("Customer", d.to, { ph: "Company or person", on: function(v){ d.to = v; err.textContent = ""; var k = knownEmail(u, v); if (emAuto && emF){ d.email = k; $("input", emF).value = k; } } }));
  g.appendChild(emF = fld("Customer email (optional)", d.email, { type: "email", ph: "For sending it", on: function(v){ d.email = v.trim(); emAuto = !d.email; } }));
  b.appendChild(g); paintLines(); b.appendChild(lines);
  var addL = btn("alt", "", function(){ d.items.push(["", "1", ""]); paintLines(); paintTot(); }); addL.innerHTML = "<u>Add a line</u>"; b.appendChild(addL);
  var r1 = el("div", "frow"); r1.appendChild(el("b", "", "Charge VAT (7%)")); r1.appendChild(seg(["Yes", "No"], d.vat ? "Yes" : "No", function(v){ d.vat = v === "Yes"; paintTot(); })); b.appendChild(r1);
  var r2 = el("div", "frow"); r2.appendChild(el("b", "", "Payment due in")); r2.appendChild(seg(["7 days", "15 days", "30 days"], d.days + " days", function(v){ d.days = v.split(" ")[0]; })); b.appendChild(r2);
  paintTot(); b.appendChild(tot); b.appendChild(err);
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), btn("pill acc", "Create invoice", function(){
    var items = d.items.filter(function(it){ return it[0].trim() || num(it[2]); });
    if (!d.to.trim()) return (err.textContent = "Add who the invoice is for.");
    if (!items.length || items.some(function(it){ return !it[0].trim() || !(num(it[1]) > 0) || !(num(it[2]) > 0); })) return (err.textContent = "Each line needs a description, a quantity and a price.");
    rememberEmail(u, d.to, d.email);
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
  if (v.paid && v.via === "hand"){
    if (v.proof) b.appendChild(el("p", "st-p", "Payment slip filed: " + v.proof.name + "."));
    else b.appendChild(btn("pill soft wide", "Upload the payment slip", function(){ proofUp(v, "in"); }, "i-up"));
  }
  var sec = v.paid ? btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; v.proof = null; save(); refresh(); openInvoice(v); })
    : btn("pill acc", "Mark as paid", function(){ v.paid = today(); v.via = "hand"; v.proof = null; save(); refresh(); openInvoice(v); toast("Marked as paid. Add the payment slip when you can. It waits in Needs you."); });
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
function knownEmail(u, name){
  var k = String(name || "").trim().toLowerCase(); if (!k) return "";
  if (u.cmail && u.cmail[k]) return u.cmail[k];
  var hit = (u.invoices || []).slice().reverse().filter(function(x){ return x.email && String(x.to).trim().toLowerCase() === k; })[0];
  return hit ? hit.email : "";
}
function rememberEmail(u, name, email){ var k = String(name || "").trim().toLowerCase(); if (!k || !/^\S+@\S+\.\S+$/.test(email || "")) return; u.cmail = u.cmail || {}; u.cmail[k] = email; }
function openRemind(v, initial){
  var u = me(), tot = invTotal(v), sign = "\n" + (u.name || "") + "\n" + coName(u);
  var dd = day(v.due), thD = dd.getDate() + " " + mth(MONTH[dd.getMonth()]) + " " + (dd.getFullYear() + 543);
  var msg = initial ? L("Hello " + v.to + ",\n\nPlease find invoice " + v.id + " for " + baht(tot) + ", due on " + niceY(v.due) + ".\n\nThank you," + sign, "เรียน " + v.to + "\n\nขอส่งใบแจ้งหนี้เลขที่ " + v.id + " ยอด " + baht(tot) + " ครบกำหนดชำระวันที่ " + thD + "\n\nขอบคุณ" + sign)
    : L("Hello " + v.to + ",\n\nA friendly reminder that invoice " + v.id + " for " + baht(tot) + " was due on " + niceY(v.due) + ". If you have already paid, thank you, and please ignore this message.\n\nKind regards," + sign, "เรียน " + v.to + "\n\nขอเรียนแจ้งว่าใบแจ้งหนี้เลขที่ " + v.id + " ยอด " + baht(tot) + " ครบกำหนดชำระเมื่อวันที่ " + thD + " หากชำระแล้ว ขอบคุณ และขออภัยหากข้อความนี้ซ้ำซ้อน\n\nขอแสดงความนับถือ" + sign);
  var b = openGS(initial ? "Send invoice" : "Reminder", v.to, "Invoice " + v.id + " · " + baht(tot) + " · " + lateTxt(v.due));
  /* suggest the address I already know for this customer, from contacts or an earlier invoice */
  var known = knownEmail(u, v.to), sug = !v.email && known;
  if (sug) v.email = known;
  var em = fld("Send to", v.email, { type: "email", ph: "customer@example.com", on: function(x){ v.email = x.trim(); rememberEmail(u, v.to, v.email); save(); hint.hidden = true; } }); b.appendChild(em);
  var hint = el("p", "em-hint", sug ? L("Suggested from your contacts. Change it if it should go to someone else.", "แนะนำจากรายชื่อติดต่อของคุณ แก้ได้ถ้าต้องส่งให้คนอื่น") : !v.email ? L("No email for " + v.to + " yet. Add it once and I remember it for next time.", "ยังไม่มีอีเมลของ " + v.to + " ใส่ครั้งเดียว หนูจำไว้ให้ครั้งหน้า") : "");
  hint.hidden = !hint.textContent; hint.setAttribute("data-noi18n", ""); b.appendChild(hint);
  var ta = fld("Message", msg, { area: 1, wide: 1 }); $("textarea", ta).rows = 8; b.appendChild(ta);
  function done(how){ if (!initial){ v.reminded = today(); } else v.sent = today(); save(); refresh(); closeGS(); toast(how); }
  var mail = btn("pill acc", "Email it", function(){
    var t = $("textarea", ta).value; location.href = "mailto:" + encodeURIComponent(v.email || "") + "?subject=" + encodeURIComponent((initial ? "Invoice " : "Reminder: invoice ") + v.id + " from " + coName(u)) + "&body=" + encodeURIComponent(t);
    done("Opened your email app");
  }, "i-chat");
  var copy = btn("pill soft", "Copy message", function(){
    var t = $("textarea", ta).value;
    function ok(){
      if (!initial) v.reminded = today(); else v.sent = today(); save();
      $("#gs").setAttribute("data-dirty", "1"); copy.classList.add("copied"); copy.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; copy.appendChild(document.createTextNode("Copied"));
      clearTimeout(copy._t); copy._t = setTimeout(function(){ copy.classList.remove("copied"); copy.textContent = "Copy message"; }, 2200);
    }
    function legacy(){ var x = $("textarea", ta); x.focus(); x.select(); try { if (document.execCommand("copy")) return ok(); } catch (e) {} toast("Select the text and copy it"); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, legacy); else legacy();
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
  g.appendChild(fld("Due", d.due, { type: "date", required: 1, quick: [["Today", 0], ["In 7 days", 7], ["In 15 days", 15], ["In 30 days", 30]], on: function(v){ d.due = v; } }));
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
    b.appendChild(foot(btn("pill soft", "Close", closeGS), btn("pill acc", "Mark as paid", function(){ v.paid = today(); v.via = "hand"; v.proof = null; save(); refresh(); closeGS(); toast(v.to + " marked as paid. Add the transfer slip when you can. It waits in Needs you."); })));
  } else {
    b.appendChild(el("p", "st-p okt", "Paid on " + niceY(v.paid) + (v.via === "statement" ? ". I found it in your bank statement." : ".")));
    if (v.via === "hand"){ if (v.proof) b.appendChild(el("p", "st-p", "Transfer slip filed: " + v.proof.name + ".")); else b.appendChild(btn("pill soft wide", "Upload the transfer slip", function(){ proofUp(v, "out"); }, "i-up")); }
    b.appendChild(foot(btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; v.proof = null; save(); refresh(); openBill(v); })));
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
  if (/(create|make|new|send|write|ทำ|สร้าง).*(invoice|bill to|ใบแจ้งหนี้)|^invoice/.test(t)){ setTimeout(function(){ startInvoiceFlow(); }, 300); return "Opening a new invoice for you."; }
  if (/upload|statement|import/.test(t) && !/p&l|profit/.test(t)){ setTimeout(function(){ openUpload(); }, 300); return "Opening the statement upload. CSV and Excel files work best."; }
  if (!B) return "I don't have any numbers yet. Upload a bank statement, or try the sample, and I can answer that.";
  var F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()];
  var openInv = (u.invoices || []).filter(function(v){ return !v.paid; }), lateInv = openInv.filter(function(v){ return v.due < T; });
  var openBills = (u.bills || []).filter(function(v){ return !v.paid; }), lateBills = openBills.filter(function(v){ return v.due < T; });
  if (/^(pay|i want to pay|make a payment)/.test(t)){ setTimeout(function(){ startPayFlow(); }, 300); return "Opening a new payment. Add the PromptPay ID and I make a QR code."; }
  if (/who owes|owes me|owed to me|receivable|unpaid invoice|outstanding invoice/.test(t)){
    if (!openInv.length) return "Nobody owes you anything right now. Every invoice is paid.";
    return openInv.length + (openInv.length === 1 ? " invoice is" : " invoices are") + " open, " + baht(openInv.reduce(function(s, v){ return s + invTotal(v); }, 0)) + " in total." +
      (lateInv.length ? " Late: " + lateInv.map(function(v){ return v.to + " (" + baht(invTotal(v)) + ", " + lateTxt(v.due) + ")"; }).join(", ") + ". Open one in Finance and tap Remind." : " None are late yet.");
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
  if (chat.flow){ $("#b-in").value = ""; $("#b-send").disabled = true; return flowAnswer(q); }
  var inp = $("#b-in"), pop = $("#b-pop"); inp.value = ""; $("#b-send").disabled = true; $("#b-sug").hidden = true; pop.hidden = false; $("#b-me").textContent = q;
  var r = $("#b-reply"); r.innerHTML = '<span class="dotsT" aria-label="ThuraGirl is typing"><i></i><i></i><i></i></span>';
  popOpts([]); var cq = chQuery(q); clearTimeout(chat.timer); chat.timer = setTimeout(function(){ if (cq) chAnswer(q, cq); else r.textContent = brain(q); }, calm ? 0 : 650);
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
function chatFile(f){ anyUpload(f); }

/* ── settings: your data ── */
var dataArmed = false;
function dataCard(u, root){
  var c = card("Your data");
  c.appendChild(el("p", "st-p", u.tx && u.tx.length ? L(u.tx.length + " bank lines from " + u.banks.length + (u.banks.length === 1 ? " account" : " accounts") + ", " + (u.invoices || []).length + " invoices, " + (u.bills || []).length + " bills and " + Object.keys(u.rcpt || {}).length + " receipts are saved in this browser.", "รายการเดินบัญชี " + u.tx.length + " รายการจาก " + u.banks.length + " บัญชี ใบแจ้งหนี้ " + (u.invoices || []).length + " ใบ บิล " + (u.bills || []).length + " ใบ และใบเสร็จ " + Object.keys(u.rcpt || {}).length + " ใบ บันทึกอยู่ในเบราว์เซอร์นี้") : "Nothing is loaded yet. Upload a statement or try the sample."));
  var r = el("div", "chips");
  r.appendChild(btn("pill soft act", "Download a copy", function(){
    var copy = JSON.parse(JSON.stringify(u)); delete copy.salt; delete copy.hash;
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" })); a.download = "thuragirl-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove();
  }));
  if (!u.tx || !u.tx.length) r.appendChild(btn("pill soft act", "Load the sample", function(){ useSample(); }));
  else r.appendChild(btn("pill soft act danger", dataArmed ? L("Tap again to clear", "แตะอีกครั้งเพื่อล้าง") : L("Clear statements and invoices", "ล้างรายการเดินบัญชีและใบแจ้งหนี้"), function(){
    if (!dataArmed){ dataArmed = true; renderSettings(); return; }
    dataArmed = false; u.tx = []; u.banks = []; u.invoices = []; u.bills = []; u.rcpt = {}; u.done = {}; u.hasData = false; u.matched = 0; u.sample = false; save(); BK_CACHE.key = ""; renderSettings(); toast("Cleared");
  }));
  c.appendChild(r); root.appendChild(c);
}

/* ── proof of payment, asked for after a hand-marked payment ── */
function proofUp(v, kind){
  closeGS();
  openKyc(kind === "in" ? "Payment slip" : "Transfer slip", (kind === "in" ? "From " + v.to + ", invoice " + v.id : "To " + v.to) + ". A photo or PDF of the slip or bank notification.", function(meta){ v.proof = meta; save(); refresh(); toast(kind === "in" ? "Payment slip filed" : "Transfer slip filed"); });
}
function proofTasks(u, out){
  (u.invoices || []).filter(function(v){ return v.paid && v.via === "hand" && !v.proof; }).forEach(function(v){
    out.push({ k: "pf:" + v.id, ic: "i-receipt", t: "Add the payment slip from " + v.to, m: "Invoice #" + v.id, amt: invTotal(v), late: { txt: "Marked paid " + nice(v.paid), cls: "" }, btn: "Upload", rank: 3, fn: function(){ proofUp(v, "in"); },
      story: { h: "Add the payment slip from " + v.to, p: "You marked invoice #" + v.id + " as paid. A photo of the slip keeps the books audit-ready." } });
  });
  (u.bills || []).filter(function(v){ return v.paid && v.via === "hand" && !v.proof; }).forEach(function(v){
    out.push({ k: "pf:" + v.id, ic: "i-receipt", t: "Add the transfer slip for " + v.to, m: v.note || "Bill", amt: v.amount, late: { txt: "Marked paid " + nice(v.paid), cls: "" }, btn: "Upload", rank: 3, fn: function(){ proofUp(v, "out"); },
      story: { h: "Add the transfer slip for " + v.to, p: "You marked the " + v.to + " bill as paid. A photo of the slip keeps the books audit-ready." } });
  });
}
