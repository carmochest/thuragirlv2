
/* ── the app shell ── */
function closeAll(){ ["#b-sheet", "#b-setup", "#kyc", "#up-sheet"].forEach(function(s){ var n = $(s); if (n) n.hidden = true; }); }
function coName(u){ if (u.path === "new"){ var n = u.reg.names[0].trim(); return n ? "บริษัท " + n + " จำกัด" : "New company"; } return u.company.name || "My company"; }
function initials(s){ var w = s.replace(/^บริษัท\s*/, "").replace(/\s*จำกัด$/, "").trim().split(/\s+/), a = (w[0] || "?").charAt(0), b = w[1] ? w[1].charAt(0) : (w[0] || "").charAt(1); return (a + (b || "")).toUpperCase(); }
function showTab(){
  var u = me(), app = $("#app");
  app.classList.toggle("nodata", !u.hasData);
  ["home", "money", "brief", "settings", "register"].forEach(function(t){ $("#b-" + t).hidden = t !== tab; });
  $("#b-back").hidden = tab === "home";
  $("#b-money-btn").setAttribute("aria-pressed", String(tab === "money"));
  $("#b-brief-btn").setAttribute("aria-pressed", String(tab === "brief"));
  $(".dockB").hidden = tab === "settings" || tab === "register";
  $("#b-co-n").textContent = coName(u); $("#b-co-i").textContent = initials(coName(u));
  var wasBrief = lastTab === "brief"; lastTab = tab;
  $("#b-brief-dot").hidden = !u.hasData || (tab === "brief" || briefSeenToday(u));
  paintHome();
  if (tab === "money"){ renderMoney(); paintLists(u); paintContacts(u); }
  if (tab === "brief") renderBrief();
  if (tab === "settings") renderSettings();
  if (tab === "register") renderRegister();
  paintSync(u);
  briefStrip(u); if (tab === "home" && wasBrief) briefTuck();
  var cs = chips(); $$("#b-sug button").forEach(function(b, i){ b.textContent = cs[i]; });
  var key = db.session + ":" + tab + ":" + (u.hasData ? 1 : 0);
  if (key !== lastKey){ closeAll(); play(); window.scrollTo(0, 0); }
  lastKey = key;
  maybeConnect(u);
}
function play(){
  var u = me(), pg = $("#b-" + tab);
  if (!calm){ pg.classList.remove("in"); void pg.offsetWidth; pg.classList.add("in"); }
  var B = books(u); if (!B) return;
  if (tab === "money") countUp($("#m-val"), Math.abs(B.fin[per].rev - B.fin[per].exp), 700);
  if (tab === "home"){ restDay(); countUp($("#b-val"), TOTAL, 900); }
}

/* ── home: cash line ── */
var CDAYS = [], CASH = [1731500,1738200,1744900,1741300,1752600,1761000,1757400,1722800,1729500,1741100,1750700,1763900,1771200,1768000,1779400,
            1790600,1786100,1797300,1808800,1802500,1774900,1783600,1795000,1806700,1815300,1811800,1824400,1833000,1836900,1842300];
var N = CASH.length, TOTAL = CASH[N - 1], raf = 0, lo = Math.min.apply(null, CASH), hi = Math.max.apply(null, CASH);
function pt(i){ return [i / (N - 1) * 600, 88 - (CASH[i] - lo) / (hi - lo) * 76]; }
function buildSpark(){
  var P = [], i; for (i = 0; i < N; i++) P.push(pt(i));
  var d = "M" + P[0][0] + " " + P[0][1].toFixed(1);
  for (i = 0; i < N - 1; i++){
    var a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], e = P[Math.min(N - 1, i + 2)];
    d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + " " + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + " " + c[0].toFixed(1) + " " + c[1].toFixed(1);
  }
  $("#b-line").setAttribute("d", d); $("#b-area").setAttribute("d", d + " L600 100 L0 100 Z"); mark(N - 1);
}
function mark(i){ var p = pt(i), dot = $("#b-dot"), x = $("#b-x"); dot.style.left = x.style.left = (p[0] / 6) + "%"; dot.style.top = p[1] + "%"; }
function showDay(i){
  cancelAnimationFrame(raf); var ago = N - 1 - i;
  $("#b-val").textContent = money(CASH[i]);
  $("#b-dtxt").textContent = CDAYS[i] ? nice(CDAYS[i]) : ago === 0 ? "Today" : ago === 1 ? "Yesterday" : ago + " days ago";
  $("#b-delta").classList.add("scrub"); $("#b-spark").classList.add("on"); mark(i);
}
function restDay(){ var B = books(me()), d = B && B.cashD; $("#b-val").textContent = money(TOTAL); $("#b-dtxt").textContent = d == null ? (B ? "As of " + nice(B.asOf) : "") : (d >= 0 ? "Up " : "Down ") + pctTxt(d) + " this month"; $("#b-delta").classList.toggle("down", d != null && d < 0); $("#b-delta").classList.remove("scrub"); $("#b-spark").classList.remove("on"); mark(N - 1); }
function countUp(val, to, ms){
  cancelAnimationFrame(raf); if (calm){ val.textContent = money(to); return; }
  var t0 = 0, from = to * 0.94;
  raf = requestAnimationFrame(function tick(t){ if (!t0) t0 = t; var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); val.textContent = money(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(tick); });
}

/* ── home: banks ── */
function ago(ts, long){
  var m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return long ? m + (m === 1 ? " minute ago" : " minutes ago") : m + "m ago";
  var h = Math.floor(m / 60); if (h < 24) return long ? h + (h === 1 ? " hour ago" : " hours ago") : h + "h ago";
  var d = Math.floor(h / 24); return long ? d + (d === 1 ? " day ago" : " days ago") : d + "d ago";
}
function isStale(ts){ return Date.now() - ts > 36 * 3600e3; }
function fullAcct(a){ return a.length > 6 ? a.slice(0, 3) + " " + a.slice(3, 6) + " " + a.slice(6) : a; }
function bankBal(u, b){ var k = b.bank + "|" + b.acct, t = u.tx || []; for (var i = t.length - 1; i >= 0; i--) if (t[i].k === k && t[i].b != null) return t[i].b; return b.bal != null ? b.bal : null; }
function paintBanks(){
  var u = me(), bar = $("#b-bkbar"), panel = $("#b-bkpanel"), many = u.banks.length > 1;
  /* several banks: the bar says how many and flags any that are out of date; the panel lists each with its balance, then the total */
  if (many){
    var st = u.banks.filter(function(b){ return isStale(b.at); }).length;
    bar.innerHTML = "<span><b>" + L(u.banks.length + " banks", "บัญชี " + u.banks.length + " ธนาคาร") + '</b><em class="' + (st ? "stale" : "") + '">' + (st ? L(st + " out of date", "ไม่อัปเดต " + st) : esc(u.banks.map(function(b){ return b.bank; }).join(", "))) + '</em></span><svg class="i"><use href="#i-chev"/></svg>';
  } else bar.innerHTML = u.banks.map(function(b){ return "<span><b>" + esc(b.bank) + '</b><em class="' + (isStale(b.at) ? "stale" : "") + '">' + ago(b.at) + "</em></span>"; }).join("") + '<svg class="i"><use href="#i-chev"/></svg>';
  bar.setAttribute("data-noi18n", "");
  panel.textContent = "";
  var tot = 0, anyBal = false;
  u.banks.forEach(function(b){
    var row = el("div", "bkrow"); row.appendChild(el("div", "nm", b.bank));
    var bal = bankBal(u, b); if (bal != null){ tot += bal; anyBal = true; }
    row.appendChild(el("div", "bal num", bal != null ? baht(bal) : ""));
    var meta = el("div", "meta"), acc = el("span", "num acc", "···· " + b.acct.slice(-4)); meta.appendChild(acc);
    if (b.acct.length > 4){
      var eye = el("button", "eye"); eye.type = "button"; eye.setAttribute("aria-label", "Show " + b.bank + " account number"); eye.setAttribute("aria-pressed", "false"); eye.innerHTML = '<svg class="i"><use href="#i-eye"/></svg>';
      eye.addEventListener("click", function(){ var show = eye.getAttribute("aria-pressed") !== "true"; eye.setAttribute("aria-pressed", String(show)); acc.textContent = show ? fullAcct(b.acct) : "···· " + b.acct.slice(-4); $("use", eye).setAttribute("href", show ? "#i-eyeoff" : "#i-eye"); });
      meta.appendChild(eye);
    }
    meta.appendChild(el("span", "syn" + (isStale(b.at) ? " stale" : ""), (b.to ? "Up to " + nice(b.to) + " · " : "") + "uploaded " + ago(b.at, true))); row.appendChild(meta);
    var up = el("button", "pill up " + (isStale(b.at) ? "acc" : "soft"), "Upload"); up.type = "button"; up.addEventListener("click", function(){ openUpload(b); });
    row.appendChild(up); panel.appendChild(row);
  });
  if (many && anyBal){ var tr = el("div", "bktot"); tr.appendChild(el("span", "", L("All banks", "รวมทุกธนาคาร"))); tr.appendChild(el("b", "num", baht(tot))); panel.appendChild(tr); }
  var add = btn("pill soft bkadd", L("Add another bank", "เพิ่มธนาคาร"), function(){ openUpload(); }, "i-plus"); panel.appendChild(add);
}

/* ── home: tasks, setup reminder, welcome ── */
function collapse(n){ n.style.height = n.offsetHeight + "px"; void n.offsetHeight; n.classList.add("gone"); n.style.height = "0px"; setTimeout(function(){ n.hidden = true; }, calm ? 0 : 380); }
function setupLeft(u){ return (u.setup.vat && u.setup.sso ? 0 : 1) + (Object.keys(u.setup.conn).length ? 0 : 1) + (u.setup.verify ? 0 : 1); }
function setCount(){
  var u = me(), n = $$(".needB .tk").filter(function(r){ return !r.hidden && !r.classList.contains("gone") && !r.classList.contains("going") && (u.hasData || r.id === "b-setuprow"); }).length;
  $("#b-cnt").textContent = n; $("#b-clear").hidden = n !== 0;
  $("#b-clear-t").textContent = u.hasData ? "You're all caught up" : "Nothing needs you yet";
  $("#b-clear-m").textContent = u.hasData ? "Nothing else needs you today." : "Upload a bank statement and I will find what does.";
  $("#b-reset").hidden = true;
}
function paintSetup(){
  var u = me(), isNew = u.path === "new", n = isNew ? regLeft(u) : setupLeft(u), things = n === 1 ? "1 quick thing" : n + " quick things";
  var row = $("#b-setuprow"); row.classList.remove("gone", "going"); row.style.height = ""; row.hidden = isNew ? !!u.reg.submitted : n === 0;
  $("#b-setup-t").textContent = isNew ? "Register your company" : "Finish setting up your company";
  $("#b-setup-m").textContent = isNew ? (n ? n + " of 5 parts still need you" : "Ready to submit") : things + " left";
  $("#b-setup-btn").textContent = isNew ? "Continue" : "Set up";
  $("#b-wel").hidden = !u.welcome;
  $("#b-wel-t").textContent = "You're in, " + first(u) + ".";
  $("#b-wel-m").textContent = isNew ? (u.reg.submitted ? "Your registration is in. Have a look around." : "Have a look around. Registering the company is five short parts, whenever you are ready.")
    : n ? "Have a look around. " + things + (n === 1 ? " is" : " are") + " left, whenever you are ready." : "Have a look around. Setup is complete.";
  var goB = $("#b-wel-go"); goB.textContent = isNew ? "Register" : "Finish setup"; goB.hidden = isNew ? !!u.reg.submitted : n === 0;
}
function paintHome(){
  var u = me();
  if (u.hasData && !(u.tx && u.tx.length)){ u.hasData = false; save(); $("#app").classList.add("nodata"); }
  autoRecords(u); paintSetup(); paintBanks(); paintHero(u); paintNeeds(u); setCount(); paintEmpty(u);
}
function openSetupTask(){ var u = me(); if (u.path === "new") go("register"); else openSetup(); }

/* ── upload a bank statement ── */
var BANKS = ["K-Bank", "SCB", "Bangkok Bank", "Krungsri", "Krungthai", "ttb", "Other"], up = { file: null, bank: "", acct: "", err: "" };
function takeFile(f){
  up.err = ""; up.parsed = null; up.close = "";
  var ext = (f.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") up.err = "I can't read PDF statements in this test build yet. Download a CSV or Excel file from your bank's app or website instead.";
  else if (["csv", "xlsx", "xls", "txt"].indexOf(ext) < 0) up.err = "That file type doesn't work here. Use CSV or Excel.";
  else if (f.size > MAX) up.err = "That file is " + size(f.size) + ". The limit is 10 MB.";
  if (up.err){ up.file = null; renderUpload(); return; }
  up.file = { name: f.name, size: f.size, reading: true }; renderUpload();
  var done = function(p){ if (!up.file || up.file.name !== f.name) return; up.file.reading = false; if (p.err){ up.err = p.err; up.file = null; } else { up.parsed = p; if (p.acct && !up.acct) up.acct = p.acct; } renderUpload(); };
  var fail = function(){ done({ err: "I couldn't open that file. Check that it is a CSV or Excel statement." }); };
  var fr = new FileReader();
  if (ext === "csv" || ext === "txt"){ fr.onload = function(){ try { done(readTable(splitCsv(String(fr.result)))); } catch (e) { fail(); } }; fr.onerror = fail; fr.readAsText(f); }
  else { fr.onload = function(){ readSheet(new Uint8Array(fr.result)).then(done, fail); }; fr.onerror = fail; fr.readAsArrayBuffer(f); }
}
function renderUpload(){
  var body = $("#up-body"); body.textContent = "";
  var drop = el("button", "drop" + (up.file ? " has" : "")); drop.type = "button";
  if (up.file){
    var P = up.parsed, extra = up.file.reading ? "Reading…" : P ? P.tx.length + " transactions, " + niceY(P.tx[0].d) + " to " + niceY(P.tx[P.tx.length - 1].d) + (P.hasBal ? ", closing balance " + baht(P.tx[P.tx.length - 1].b) : "") : size(up.file.size);
    drop.innerHTML = '<svg class="i"><use href="#i-doc"/></svg>'; drop.appendChild(el("span", "", up.file.name)); drop.appendChild(el("small", "", extra + " · tap to change"));
  } else { drop.innerHTML = '<svg class="i"><use href="#i-up"/></svg><span>Choose a file or drop it here</span><small>CSV or Excel from your bank, up to 10 MB</small>'; }
  drop.addEventListener("click", function(){ $("#up-file").click(); });
  drop.addEventListener("dragover", function(ev){ ev.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function(){ drop.classList.remove("over"); });
  drop.addEventListener("drop", function(ev){ ev.preventDefault(); var f = ev.dataTransfer && ev.dataTransfer.files[0]; if (f) takeFile(f); });
  body.appendChild(drop);
  var g = el("div", "fgrid"), okBtn, needClose = up.parsed && !up.parsed.hasBal;
  var sync = function(){ if (okBtn) okBtn.disabled = !(up.parsed && up.bank && /^\d{4,15}$/.test(up.acct) && (!needClose || isFinite(num(up.close)))); };
  g.appendChild(fld("Bank", up.bank, { options: [["", "Choose a bank"]].concat(BANKS.map(function(b){ return [b, b]; })), on: function(v){ up.bank = v; sync(); } }));
  g.appendChild(fld("Account number", up.acct, { mode: "numeric", max: 15, ph: "Digits only", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); up.acct = inp.value; sync(); return up.acct && up.acct.length < 4 ? "At least the last 4 digits" : ""; } }));
  if (needClose) g.appendChild(fld("Balance at the end of this statement", up.close, { wide: 1, prefix: "฿", mode: "decimal", ph: "The file has no balance column", on: function(v, inp){ inp.value = v.replace(/[^\d.\-]/g, ""); up.close = inp.value; sync(); } }));
  body.appendChild(g);
  var er = el("div", "ferrB", up.err); body.appendChild(er);
  var f = el("div", "shB-f"), samp = el("button", "pill soft", "Use the sample"); samp.type = "button";
  samp.addEventListener("click", function(){ var p = readTable(splitCsv(sampleCsv())); up = { file: { name: "sample-kbank-statement.csv", size: 0 }, parsed: p, bank: "K-Bank", acct: p.acct || "0483511234", err: "", sample: true, close: "" }; renderUpload(); });
  okBtn = el("button", "pill acc", "Upload"); okBtn.type = "button";
  okBtn.addEventListener("click", function(){
    var u = me(), r = addStatement(u, up.bank, up.acct, up.parsed, needClose ? num(up.close) : null);
    if (up.sample){ sampleBooks(u); u.sample = true; }
    save(); BK_CACHE.key = "";
    var msg = r.added + " transactions read" + (r.matched ? ", " + r.matched + " payments matched" : "") + ".";
    $("#up-sheet").hidden = true; up = { file: null, bank: "", acct: "", err: "" }; if (tab !== "home") go(""); else refresh(); toast(msg);
  });
  f.appendChild(samp); f.appendChild(okBtn); body.appendChild(f); sync();
  body.appendChild(el("p", "tnote", "Your bank's app or website can export statements as CSV or Excel. The file is read here, in your browser, and is not sent anywhere."));
}
function openUpload(b){
  if (gated(me())){ toast("Register the company first. Statements open after that."); go("register"); return; }
  up = { file: null, bank: b ? b.bank : "", acct: b ? b.acct : "", err: "" }; renderUpload();
  var s = $("#up-sheet"); s.hidden = false; try { $("#up-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {}
}

/* ── money ── */
function plCard(F){
  var root = $("#m-plc"); if (!root) return; root.textContent = "";
  $("#m-plp").textContent = nice(F.from) + " to " + nice(F.to);
  function block(title, rows, total, cls){
    var h = el("div", "pl-h " + cls); h.appendChild(el("span", "", title)); h.appendChild(el("b", "num", baht(total))); root.appendChild(h);
    var list = rows.slice(0, 6), rest = rows.slice(6).reduce(function(a, r){ return a + r[1]; }, 0);
    if (rest > 0) list = list.concat([["Everything else", rest]]);
    list.forEach(function(r){ var d = el("div", "pl-r"); d.appendChild(el("span", "", cap(r[0]))); d.appendChild(el("em", "num", total ? Math.round(r[1] / total * 100) + "%" : "")); d.appendChild(el("span", "num", baht(r[1]))); if (r[0] !== "Everything else") plTap(d, r[0], F, cls === "in"); root.appendChild(d); });
    if (!list.length) root.appendChild(el("div", "pl-r", "Nothing yet"));
  }
  block("Money in", F.revMix, F.rev, "in"); block("Money out", F.expMix, F.exp, "out");
  var k = F.rev - F.exp, t = el("div", "pl-t" + (k < 0 ? " neg" : "")); t.appendChild(el("span", "", k < 0 ? "Loss" : "Kept (profit)"));
  var v = el("div", "pl-tv"); v.appendChild(el("b", "num", (k < 0 ? "−" : "") + baht(Math.abs(k)))); if (F.rev) v.appendChild(el("small", "num", (k / F.rev * 100).toFixed(1) + "% of money in")); t.appendChild(v); root.appendChild(t);
  plActions(root, F);
}
var per = "mtd";
function tickL(n){ return n === 0 ? "0" : n >= 1e6 ? (n / 1e6) + "M" : (n / 1e3) + "K"; }
function niceStep(max){ var pow = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), c = [1, 2, 5, 10]; for (var i = 0; i < c.length; i++) if (max / (c[i] * pow) <= 4) return c[i] * pow; return 10 * pow; }
function mix(root, rows, cls){
  root.textContent = ""; var total = rows.reduce(function(a, r){ return a + r[1]; }, 0), top = Math.max.apply(null, rows.map(function(r){ return r[1]; }));
  rows.forEach(function(r){ var d = el("div", "mx"); d.appendChild(el("span", "mx-n", r[0])); d.appendChild(el("span", "mx-v num", baht(r[1]))); d.appendChild(el("span", "mx-p num", Math.round(r[1] / total * 100) + "%")); var bar = el("i", "mx-b" + cls); bar.style.width = (r[1] / top * 100) + "%"; d.appendChild(bar); root.appendChild(d); });
}
function renderMoney(){
  var B = books(me()); if (!B) return;
  var F = B.fin[per], profit = F.rev - F.exp;
  $("#m-lab").textContent = F.lab; $("#m-val").textContent = money(Math.abs(profit)); $("#m-val").previousElementSibling.textContent = profit < 0 ? "−฿" : "฿";
  $("#m-dtxt").textContent = F.d == null ? "From " + nice(F.from) + " to " + nice(F.to) : (F.d >= 0 ? "Up " : "Down ") + pctTxt(F.d) + " " + F.vs; $("#m-dtxt").parentNode.classList.toggle("down", F.d != null && F.d < 0);
  $("#m-mg").textContent = F.rev ? (profit / F.rev * 100).toFixed(1) + "% margin" : "";
  $("#m-in").textContent = baht(F.rev); $("#m-out").textContent = baht(F.exp);
  var top = Math.max(1, Math.max.apply(null, F.flow.map(function(r){ return Math.max(r[1], r[2]); }))), step = niceStep(top), max = Math.ceil(top / step) * step;
  var grid = $("#m-grid"), cols = $("#m-cols"), xs = $("#m-x"), tip = $("#m-tip"), tbl = $("#m-tbl");
  grid.textContent = ""; cols.textContent = ""; xs.textContent = ""; tip.hidden = true;
  for (var v = 0; v <= max; v += step){ var g = el("span"); g.style.bottom = (v / max * 100) + "%"; g.appendChild(el("em", "", tickL(v))); grid.appendChild(g); }
  tbl.innerHTML = "<caption>Money in and out</caption><tr><th>Period</th><th>In</th><th>Out</th><th>Kept</th></tr>";
  F.flow.forEach(function(r){
    var b = el("button", "bcol"); b.type = "button"; b.setAttribute("aria-label", r[0] + ": in " + baht(r[1]) + ", out " + baht(r[2]) + ", kept " + baht(r[1] - r[2]));
    var pair = el("span", "bpair"), i1 = el("i", "in"), i2 = el("i", "out"); i1.style.height = (r[1] / max * 100) + "%"; i2.style.height = (r[2] / max * 100) + "%"; pair.appendChild(i1); pair.appendChild(i2); b.appendChild(pair);
    var show = function(){
      tip.innerHTML = ""; tip.appendChild(el("b", "", r[0]));
      [["in", "In", r[1]], ["out", "Out", r[2]], ["", "Kept", r[1] - r[2]]].forEach(function(x){ var line = el("span"); if (x[0]) line.appendChild(el("i", "swc " + x[0])); line.appendChild(document.createTextNode(x[1])); line.appendChild(el("em", "", baht(x[2]))); tip.appendChild(line); });
      tip.hidden = false; var W = cols.clientWidth, w = tip.offsetWidth, cx = b.offsetLeft + b.offsetWidth / 2, gap = pair.offsetWidth / 2 + 10;
      tip.style.left = (cx + gap + w <= W ? cx + gap : Math.max(0, cx - gap - w)) + "px";
    }, hide = function(){ tip.hidden = true; };
    b.addEventListener("pointerenter", show); b.addEventListener("focus", show); b.addEventListener("click", show); b.addEventListener("pointerleave", hide); b.addEventListener("blur", hide);
    cols.appendChild(b); xs.appendChild(el("span", "", r[0]));
    var tr = el("tr"); [r[0], baht(r[1]), baht(r[2]), baht(r[1] - r[2])].forEach(function(c){ tr.appendChild(el("td", "", c)); }); tbl.appendChild(tr);
  });
  plCard(F);
  $("#m-vat").previousElementSibling.lastChild.textContent = me().setup.vat === "No" ? "Not VAT registered" : "Monthly VAT, net payable (estimate)";
  chCard(me());
  $("#m-vat").textContent = baht(F.tax[0]); $("#m-wht").textContent = baht(F.tax[1]); $("#m-corp").textContent = baht(F.tax[2]); $("#m-tax").textContent = baht(F.tax[0] + F.tax[1] + F.tax[2]);
}

/* ── setup that follows signup (registered company) ── */
function stSec(title, tag, done){
  var sec = el("div", "st-sec"), h = el("div", "st-h"); h.appendChild(el("b", "", title));
  if (done) h.insertAdjacentHTML("beforeend", '<span class="st-ok">' + CHECK + "Done</span>"); else if (tag) h.appendChild(el("span", "st-tag", tag));
  sec.appendChild(h); return sec;
}
function connRows(u, again){ return connList(u, again, true); }
function vatRows(u, again){
  var r = el("div", "ob-rows");
  r.appendChild(qrow("VAT registered", "You charge 7% VAT and file PP.30", ["Yes", "No"], u.setup.vat, function(v){ u.setup.vat = v; save(); again(); }));
  r.appendChild(qrow("Social security (SSO)", "Your employees are enrolled", ["Yes", "No"], u.setup.sso, function(v){ u.setup.sso = v; save(); again(); }));
  return r;
}
function verifyBlock(u, again){
  var w = el("div", "st-sec");
  if (u.setup.verify){ var g = el("div", "ob-got"); g.innerHTML = CHECK; g.appendChild(el("span", "", "Received: " + u.setup.verify.name + " (" + size(u.setup.verify.size) + ")")); w.appendChild(g); }
  else w.appendChild(el("p", "st-p", "One photo or PDF of your company certificate, up to 10 MB."));
  var v = el("button", "pill soft act"); v.type = "button"; v.innerHTML = '<svg class="i"><use href="#i-lock"/></svg>' + (u.setup.verify ? "Replace the file" : "Verify now");
  v.addEventListener("click", function(){ openKyc("Company certificate", "One PDF or image, up to 10 MB. Make sure the company name and tax ID are readable.", function(meta){ u.setup.verify = meta; save(); again(); toast("Company certificate received"); }); });
  w.appendChild(v); return w;
}
function renderSetup(){
  var u = me(), b = $("#st-body"), again = function(){ renderSetup(); paintSetup(); setCount(); }; b.textContent = "";
  $("#st-sub").textContent = "Three quick things. They also live in Settings, so there is no rush.";
  var s1 = stSec("VAT and social security", "Before your first filing", !!(u.setup.vat && u.setup.sso)); s1.appendChild(vatRows(u, again)); b.appendChild(s1);
  var s2 = stSec("Connect your accounts", "Optional", Object.keys(u.setup.conn).length > 0); s2.appendChild(connRows(u, again)); b.appendChild(s2);
  var s3 = stSec("Verify your company", "Optional", !!u.setup.verify), vb = verifyBlock(u, again); while (vb.firstChild) s3.appendChild(vb.firstChild); b.appendChild(s3);
}
function openSetup(){ renderSetup(); var s = $("#b-setup"); s.hidden = false; try { $("#st-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }

/* ── documents: handed to a verification partner. Here the file is checked and only its name and size are kept ── */
var kycT = 0, kycCb = null, kycDoc = ["", ""], kycFile = null;
function kycStage(st, err){
  var b = $("#kyc-body"); b.textContent = ""; clearTimeout(kycT);
  if (st === "pick"){
    b.appendChild(el("h3", "", kycDoc[0])); b.appendChild(el("p", "", kycDoc[1]));
    if (err) b.appendChild(el("div", "ferrB", err));
    [["#kyc-cam", "i-cam", "Take a photo", "Use your camera"], ["#kyc-file", "i-doc", "Upload a file", "PDF, JPG or PNG"]].forEach(function(o){
      var x = el("button", "kyc-opt"); x.type = "button"; x.innerHTML = '<svg class="i"><use href="#' + o[1] + '"/></svg>'; var t = el("span", "", o[2]); t.appendChild(el("small", "", o[3])); x.appendChild(t);
      x.addEventListener("click", function(){ $(o[0]).click(); }); b.appendChild(x);
    });
  } else if (st === "check"){
    var w = el("div", "kyc-ok"); w.innerHTML = '<span class="dotsT" aria-hidden="true"><i></i><i></i><i></i></span>'; w.appendChild(el("h3", "", "Checking the document")); w.appendChild(el("p", "", "This takes a few seconds.")); b.appendChild(w);
    kycT = setTimeout(function(){ kycStage("ok"); }, calm ? 0 : 1200);
  } else {
    var o2 = el("div", "kyc-ok"); o2.innerHTML = '<span class="ck">' + CHECK + "</span>"; o2.appendChild(el("h3", "", "Looks good")); o2.appendChild(el("p", "", kycFile.name + " · " + size(kycFile.size)));
    var d = el("button", "pill acc", "Done"); d.type = "button"; d.addEventListener("click", function(){ var cb = kycCb, f = kycFile; closeKyc(); if (cb) cb(f); }); o2.appendChild(d); b.appendChild(o2);
  }
}
function kycTake(inp){
  var f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
  if (!(f.type === "application/pdf" || /^image\//.test(f.type))) return kycStage("pick", "Only a PDF or an image works here.");
  if (f.size > MAX) return kycStage("pick", "That file is " + size(f.size) + ". The limit is 10 MB.");
  kycFile = { name: f.name, size: f.size }; kycStage("check");
}
function openKyc(title, sub, cb){ kycDoc = [title, sub]; kycCb = cb; var k = $("#kyc"); k.hidden = false; kycStage("pick"); try { $("#kyc-x").focus({ preventScroll: true }); $(".kyc-card").scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeKyc(){ clearTimeout(kycT); $("#kyc").hidden = true; kycCb = null; }
