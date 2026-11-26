/* ── morning brief ── */
function catsBetween(u, a, b){ var o = {}; (u.tx || []).forEach(function(x){ if (x.d < a || x.d > b || x.a >= 0) return; var c = cat(x.t, x.a); o[c] = (o[c] || 0) - x.a; }); return o; }
function sparkSvg(vals, w, h){
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi === lo){ hi++; lo--; }
  var pts = vals.map(function(v, i){ return (i / (vals.length - 1) * w).toFixed(1) + "," + (h - 3 - (v - lo) / (hi - lo) * (h - 6)).toFixed(1); });
  return '<svg class="br-spk" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(" ") + '"/><circle cx="' + pts[pts.length - 1].split(",")[0] + '" cy="' + pts[pts.length - 1].split(",")[1] + '" r="2.6"/></svg>';
}
function noticed(u, B){
  var F = B.fin.mtd, out = [], A = day(B.asOf), pa = iso(new Date(A.getFullYear(), A.getMonth() - 1, 1)), pb = iso(new Date(A.getFullYear(), A.getMonth() - 1, Math.min(A.getDate(), new Date(A.getFullYear(), A.getMonth(), 0).getDate())));
  if (pa >= B.first){
    var cur = catsBetween(u, F.from, B.asOf), prev = catsBetween(u, pa, pb), best = null;
    Object.keys(cur).forEach(function(c){ var p = prev[c] || 0, d = cur[c] - p; if (p > 5000 && Math.abs(d) > 4000 && (!best || Math.abs(d) > Math.abs(best.d))) best = { c: c, d: d, p: p, v: cur[c] }; });
    if (best) out.push(cap(best.c) + " is " + (best.d > 0 ? "up " : "down ") + pctTxt(Math.abs(best.d) / best.p * 100) + " on the same days last month: " + baht(best.v) + " against " + baht(best.p) + ".");
  }
  var since = addDays(B.asOf, -27), byWd = [0, 0, 0, 0, 0, 0, 0], days = {};
  (u.tx || []).forEach(function(x){ if (x.d < since || x.a <= 0) return; byWd[day(x.d).getDay()] += x.a; days[x.d] = 1; });
  var top = byWd.indexOf(Math.max.apply(null, byWd)), WD = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  if (Object.keys(days).length >= 14 && byWd[top] > 0) out.push(WD[top] + " bring in the most: about " + baht(Math.round(byWd[top] / 4 / 100) * 100) + " each over the last four weeks.");
  var spent = 0; (u.tx || []).forEach(function(x){ if (x.d > addDays(B.asOf, -90) && x.a < 0) spent -= x.a; });
  var mo = spent / 3; if (mo > 0 && B.cash > 0) out.push("Your cash covers about " + (B.cash / mo).toFixed(1) + " months of spending at the pace of the last three months.");
  return out.slice(0, 3);
}
function cap(s){ s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function weekAhead(u, B){
  var t = today(), end = addDays(t, 6), ev = [];
  (u.bills || []).forEach(function(v){ if (!v.paid && v.due >= t && v.due <= end) ev.push([v.due, v.to, baht(v.amount), "out"]); });
  (u.invoices || []).forEach(function(v){ if (!v.paid && v.due >= t && v.due <= end) ev.push([v.due, v.to + " pays you", baht(invTotal(v)), "in"]); });
  if ((u.team || []).length && !u.done["pay:" + payKey()]){ var pd = payDay(); if (pd >= t && pd <= end) ev.push([pd, "Payroll", baht(payRun(u).net), "out"]); }
  var T = taxPack(u, B); if (T && !u.done["tax:" + T.key]) T.forms.forEach(function(f){ if (f[3] >= t && f[3] <= end) ev.push([f[3], "File " + f[1], baht(f[2]), "out"]); });
  return ev;
}
function renderBrief(){
  var u = me(), B = books(u), pg = $("#b-brief"); if (!B) return;
  $$("#b-brief > :not(.emptyP)").forEach(function(n){ n.remove(); });
  var th = lang() === "th", now = new Date(), TK = tasks(u), p = B.pack, F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()], hr = now.getHours(), nm = first(u);
  var mT = th ? mth(mName) : mName, K = F.rev - F.exp;
  function NI(e){ e.setAttribute("data-noi18n", ""); return e; }
  function shortB(v){ var a = Math.abs(v), s = a >= 1e6 ? (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + L("M", " ล้าน") : a >= 1e4 ? Math.round(a / 1e3) + L("K", " พัน") : money(a); return (v < 0 ? "−" : "") + "฿" + s; }
  function NIS(t){ return { ni: t }; }
  function sec(title, kick){ if (kick && kick.ni != null){ var s0 = sec(title, " "); var kk = $(".mb-kick", s0); kk.textContent = kick.ni; NI(kk); return s0; } var s = el("section", "mb-sec"), h = el("div", "mb-sh"); if (kick) h.appendChild(el("span", "mb-kick", kick)); h.appendChild(el("h2", "", title)); s.appendChild(h); return s; }

  // what needs a yes, most pressing first
  var urgent = [];
  if (p && !u.done["rev:" + p.key]) urgent.push({ ic: "i-chart", h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept.", btn: "Review", fn: openSheet, k: "rev" });
  TK.filter(function(x){ return x.k.indexOf("rev") !== 0 && ((x.late && x.late.cls === "bad") || (x.due && diffDays(x.due, today()) <= 1) || x.rank <= 1); }).forEach(function(x){ urgent.push({ ic: x.ic || "i-clock", h: x.story ? x.story.h : x.t, p: x.story ? x.story.p : (x.m || ""), btn: x.btn, fn: x.fn, k: x.k, amt: x.amt, late: x.late }); });
  var top = urgent.slice(0, 3), allN = TK.filter(function(x){ return x.k.indexOf("rev") !== 0; }).length + (p && !u.done["rev:" + p.key] ? 1 : 0), restN = allN - top.length;

  var wrap = el("div", "mb");

  // ── hero
  var hero = el("header", "mb-hero");
  var tr = el("div", "mb-top"), dt = el("div", "mb-dt");
  dt.appendChild(NI(el("small", "", th ? now.toLocaleDateString("th-TH", { weekday: "short" }) : now.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase())));
  dt.appendChild(el("b", "num", String(now.getDate()))); tr.appendChild(dt);
  var tt = el("div", "mb-tt"); tt.appendChild(el("span", "mb-name", "The Morning Brief")); tt.appendChild(NI(el("span", "mb-meta", (th ? mth(MONTH[now.getMonth()]) + " " + (now.getFullYear() + 543) : MONTH[now.getMonth()] + " " + now.getFullYear()) + L(" · 2 min read", " · อ่าน 2 นาที")))); tr.appendChild(tt);
  tr.insertAdjacentHTML("beforeend", '<svg class="tg mb-logo" width="40" height="42"><use href="#tg"/></svg>');
  hero.appendChild(tr);
  // one greeting and one sign-off per day, picked from a pool, so it isn't the same line every morning
  var seed = 0, dk = iso(now); for (var si = 0; si < dk.length; si++) seed = (seed * 31 + dk.charCodeAt(si)) >>> 0;
  function pick(a, o){ return a[(seed + (o || 0)) % a.length]; }
  var wd = now.getDay(), part = hr < 12 ? 0 : hr < 18 ? 1 : 2;
  var GREET = [
    [["Good morning, ", "อรุณสวัสดิ์ คุณ "], ["Morning, ", "สวัสดีตอนเช้า คุณ "], ["Hello again, ", "สวัสดีอีกครั้ง คุณ "], ["Rise and shine, ", "ตื่นมาสดใสนะคะ คุณ "], ["Hi there, ", "สวัสดีค่ะ คุณ "]],
    [["Good afternoon, ", "สวัสดีตอนบ่าย คุณ "], ["Hello, ", "สวัสดีค่ะ คุณ "], ["Afternoon, ", "บ่ายนี้เป็นไงบ้างคะ คุณ "], ["Welcome back, ", "ยินดีต้อนรับกลับมา คุณ "]],
    [["Good evening, ", "สวัสดีตอนเย็น คุณ "], ["Evening, ", "เย็นนี้เป็นไงบ้างคะ คุณ "], ["Hello, ", "สวัสดีค่ะ คุณ "], ["Still at it, ", "ยังทำงานอยู่เลยนะคะ คุณ "]]][part];
  var gr = wd === 1 && part === 0 && seed % 2 ? ["Happy Monday, ", "สุขสันต์วันจันทร์ คุณ "] : wd === 5 && seed % 2 ? ["Happy Friday, ", "สุขสันต์วันศุกร์ คุณ "] : pick(GREET);
  hero.appendChild(NI(el("p", "mb-hi", L(gr[0], gr[1]) + nm)));
  var hl = NI(el("h1", "mb-hl"));
  hl.innerHTML = L("You have <em>" + esc(shortB(B.cash)) + "</em> in the bank" + (top.length ? ", and <em>" + top.length + (top.length === 1 ? " thing" : " things") + "</em> need" + (top.length === 1 ? "s" : "") + " you today." : ", and nothing needs you today."),
    "มีเงินในบัญชี <em>" + esc(shortB(B.cash)) + "</em> " + (top.length ? "และวันนี้มี <em>" + top.length + " เรื่อง</em>รอคุณอยู่" : "และวันนี้ไม่มีอะไรรอคุณ"));
  hero.appendChild(hl);
  var mgP = F.rev ? K / F.rev * 100 : 0, nb = (u.bills || []).filter(function(v){ return !v.paid && v.due >= today() && diffDays(v.due, today()) <= 7 && !top.some(function(t){ return t.k === "bill:" + v.id; }); }).sort(function(a, z){ return a.due < z.due ? -1 : 1; })[0];
  function bb(v){ return "<b>" + esc(v) + "</b>"; }
  function dTH(s2){ var d2 = day(s2); return d2.getDate() + " " + mth(MONTH[d2.getMonth()]); }
  var blurb = L(esc(mName) + " so far: " + bb(baht(F.rev)) + " in and " + bb(baht(F.exp)) + " out, so you have " + (K >= 0 ? "kept " + bb(baht(K)) + " (" + bb(mgP.toFixed(1) + "%") + " of sales)" : "spent " + bb(baht(-K)) + " more than came in") + (F.d != null && Math.abs(F.d) < 200 && K > 0 ? ", " + bb((F.d >= 0 ? "+" : "−") + pctTxt(F.d)) + " on last month" : "") + ". ",
    esc(mT) + " ถึงวันนี้ เงินเข้า " + bb(baht(F.rev)) + " เงินออก " + bb(baht(F.exp)) + (K >= 0 ? " เหลือเก็บ " + bb(baht(K)) + " (" + bb(mgP.toFixed(1) + "%") + " ของยอดขาย)" : " ใช้เกินรายรับ " + bb(baht(-K))) + (F.d != null && Math.abs(F.d) < 200 && K > 0 ? " " + bb((F.d >= 0 ? "+" : "−") + pctTxt(F.d)) + " เทียบเดือนก่อน" : "") + " ");
  if (top.length) blurb += L("First up: " + esc(top[0].h.charAt(0).toLowerCase() + top[0].h.slice(1)) + ". ", "เรื่องแรก: " + esc(T_(top[0].h)) + " ");
  else blurb += L("Nothing needs you today. ", "วันนี้ไม่มีอะไรต้องทำ ");
  if (nb) blurb += L("Next bill: " + esc(nb.to) + ", " + bb(baht(nb.amount)) + " on " + bb(nice(nb.due)) + ".", "บิลถัดไป: " + esc(T_(nb.to)) + " " + bb(baht(nb.amount)) + " วันที่ " + bb(dTH(nb.due)));
  var bl = NI(el("p", "mb-blurb")); bl.innerHTML = blurb; hero.appendChild(bl);
  var st = el("div", "mb-stats");
  [[L("Cash", "เงินสด"), baht(B.cash), B.cashD == null ? "" : (B.cashD >= 0 ? "↑ " : "↓ ") + pctTxt(B.cashD)],
   [L("Money in", "เงินเข้า"), baht(F.rev), F.dIn == null ? mT : (F.dIn >= 0 ? "↑ " : "↓ ") + pctTxt(F.dIn)],
   [L("Money out", "เงินออก"), baht(F.exp), F.dOut == null ? mT : (F.dOut >= 0 ? "↑ " : "↓ ") + pctTxt(F.dOut)],
   [L("Kept in ", "เหลือเก็บเดือน") + mT, (K < 0 ? "−" : "") + baht(Math.abs(K)), mgP.toFixed(1) + L("% margin", "% อัตรากำไร")]].forEach(function(x){
    var t = NI(el("div", "mb-stat")); t.appendChild(el("span", "", x[0])); t.appendChild(el("b", "num", x[1])); if (x[2]) t.appendChild(el("small", "num", x[2])); st.appendChild(t);
  });
  var tiles = $$(".mb-stat", st), mg = F.rev ? Math.max(0, Math.min(100, K / F.rev * 100)) : 0;
  tiles[0].insertAdjacentHTML("beforeend", sparkSvg(B.series.map(function(z){ return z[1]; }), 120, 26).replace("br-spk", "br-spk mb-spk"));
  var ring = el("i", "mb-ring"); ring.style.setProperty("--p", mg.toFixed(1)); ring.appendChild(el("em", "num", Math.round(mg) + "%")); tiles[3].appendChild(ring);
  hero.appendChild(st); wrap.appendChild(hero);

  // ── today's list
  var ls = sec(top.length ? "Needs you today" : "Nothing urgent today", top.length ? L("Only what is late or due today", "เฉพาะเรื่องที่เลยกำหนดหรือครบกำหนดวันนี้") : "");
  NI($(".mb-kick", ls) || el("i"));
  if (!top.length) ls.appendChild(el("p", "mb-calm", "Nothing is late and nothing is due today."));
  top.forEach(function(s, i){
    var c = el("article", "mb-task" + (i === 0 ? " lead" : ""));
    if (i === 0) c.appendChild(el("span", "mb-rib", "Start here"));
    var hd = el("div", "mb-th"); hd.innerHTML = '<i class="mb-ic"><svg class="i"><use href="#' + s.ic + '"/></svg></i>';
    var tx = el("div", "mb-tx"); tx.appendChild(el("h3", "", s.h)); if (s.late && s.late.txt) tx.appendChild(el("span", "mb-tag " + (s.late.cls || ""), s.late.txt)); hd.appendChild(tx); c.appendChild(hd);
    c.appendChild(el("p", "mb-p", s.p));
    var ft = el("div", "mb-tf"); ft.appendChild(el("b", "num mb-amt", s.amt ? baht(s.amt) : "")); ft.appendChild(btn("pill soft act", s.btn, s.fn)); c.appendChild(ft);
    ls.appendChild(c);
  });
  if (restN > 0){ var lk = btn("mb-more", L(restN + (restN === 1 ? " more thing" : " more things") + " can wait. See all on Home", "อีก " + restN + " เรื่องรอได้ ดูทั้งหมดที่หน้าหลัก"), function(){ go(""); }); NI(lk); lk.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); ls.appendChild(lk); }
  wrap.appendChild(ls);

  // ── insights, a swipeable rail
  var ns = noticed(u, B), big = F.expMix[0];
  if (big && F.exp) ns.unshift("Your biggest cost this month is " + big[0].toLowerCase() + ": " + baht(big[1]) + ", or " + Math.round(big[1] / F.exp * 100) + "% of everything that went out.");
  if (ns.length){
    var is = sec("Worth knowing", L("Nothing to do, just good to know", "ไม่ต้องทำอะไร แค่น่ารู้ไว้")); NI($(".mb-kick", is));
    var rail = el("div", "mb-rail");
    ns.slice(0, 4).forEach(function(s, i){
      var m = s.match(/covers about ([\d.]+) months?/), fig, unit = "";
      if (m){ fig = m[1]; unit = L("months of cash", "เดือน ที่เงินสดพอใช้"); }
      else { var q = s.match(/(\d[\d.]*)%/) || s.match(/฿[\d,]+/); fig = q ? (q[1] ? q[1] + "%" : q[0]) : ""; if (/ down /.test(s) && q && q[1]) fig = "−" + fig; else if (/ up /.test(s) && q && q[1]) fig = "+" + fig; }
      var c = el("article", "mb-ins t" + (i % 3) + (/^−/.test(fig || "") ? " dn" : "")); c.innerHTML = '<i class="mb-ic sm"><svg class="i"><use href="#i-trend"/></svg></i>';
      if (fig){ var f = NI(el("b", "num mb-fig", fig)); c.appendChild(f); if (unit) c.appendChild(NI(el("span", "mb-unit", unit))); }
      c.appendChild(el("p", "", s)); rail.appendChild(c);
    });
    is.appendChild(rail); wrap.appendChild(is);
  }

  // ── today's receipt: what ThuraGirl did
  var rs = sec("What I took care of", L("While you were busy", "ระหว่างที่คุณยุ่งอยู่")); NI($(".mb-kick", rs));
  var rc = Object.keys(u.rcpt || {}).length, items = [], mins = 0;
  var basis = [];
  function did(t, m, why){ items.push(t); mins += m; if (why) basis.push([why, m]); }
  did(B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost", B.n / 6, L(B.n + " bank lines × 10 sec to sort by hand", B.n + " รายการ × 10 วินาที ถ้าแยกเอง"));
  if (u.matched) did(u.matched + " payments matched to invoices and bills", u.matched * 2, L(u.matched + (u.matched === 1 ? " payment" : " payments") + " × 2 min to match", u.matched + " รายการ × 2 นาที ในการจับคู่"));
  if (rc) did(rc + (rc === 1 ? " receipt" : " receipts") + " filed", rc * 2, L(rc + (rc === 1 ? " receipt" : " receipts") + " × 2 min to file", rc + " ใบ × 2 นาที ในการเก็บ"));
  var rem = (u.invoices || []).filter(function(v){ return v.reminded && diffDays(today(), v.reminded) <= 7; }).length; if (rem) did(rem + (rem === 1 ? " payment reminder" : " payment reminders") + " sent this week", rem * 5, L(rem + (rem === 1 ? " reminder" : " reminders") + " × 5 min to write", rem + " ข้อความ × 5 นาที ในการเขียน"));
  var pf = (u.invoices || []).concat(u.bills || []).filter(function(v){ return v.proof; }).length; if (pf) did(pf + (pf === 1 ? " payment slip" : " payment slips") + " filed", pf * 2, L(pf + (pf === 1 ? " slip" : " slips") + " × 2 min to file", pf + " ใบ × 2 นาที ในการเก็บ"));
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) did(TP.name + " tax forms approved", 45, L("Tax forms: 45 min to prepare", "แบบภาษี: 45 นาที ในการเตรียม")); else if (TP) did(TP.name + " tax forms prepared and checked", 45, L("Tax forms: 45 min to prepare", "แบบภาษี: 45 นาที ในการเตรียม"));
  if (p && u.done["rev:" + p.key]) did(p.name + " books signed off", 30, L("Month-end pack: 30 min", "สรุปสิ้นเดือน: 30 นาที"));
  did("Cash, costs and profit brought up to date for " + mName, 15, L("Updating the month's numbers: 15 min", "อัปเดตตัวเลขประจำเดือน: 15 นาที"));
  var rp = el("div", "mb-rcpt"), rh = el("div", "mb-rh"); rh.appendChild(el("b", "", "ThuraGirl")); rh.appendChild(NI(el("span", "num", th ? now.toLocaleDateString("th-TH") : now.toLocaleDateString("en-GB")))); rp.appendChild(rh);
  items.forEach(function(t){ var r = el("div", "mb-rl"); r.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; r.appendChild(el("span", "", t)); rp.appendChild(r); });
  var mr = Math.max(5, Math.round(mins / 5) * 5), h = Math.floor(mr / 60), mm = mr % 60, tot = el("div", "mb-rt"); tot.appendChild(el("span", "", "Time saved, about"));
  tot.appendChild(NI(el("b", "num", L(((h ? h + " h " : "") + (mm ? mm + " min" : "")).trim(), ((h ? h + " ชม. " : "") + (mm ? mm + " นาที" : "")).trim())))); rp.appendChild(tot);
  var how = el("details", "mb-how"), hs = el("summary", "", "How I work this out"); how.appendChild(hs);
  var hl2 = NI(el("ul"));
  basis.forEach(function(x){ var li = el("li"); li.appendChild(el("span", "", x[0])); var mn = Math.round(x[1]); li.appendChild(el("b", "num", mn >= 60 ? Math.floor(mn / 60) + L(" h ", " ชม. ") + (mn % 60 ? mn % 60 + L(" min", " นาที") : "") : mn + L(" min", " นาที"))); hl2.appendChild(li); });
  how.appendChild(hl2); how.appendChild(el("p", "", "Typical times for a small business doing this by hand. An estimate, not a measurement.")); rp.appendChild(how);
  rs.appendChild(rp); wrap.appendChild(rs);

  // ── sign-off
  var end = el("div", "mb-end"); end.innerHTML = '<svg class="tg" width="44" height="46"><use href="#tg"/></svg>';
  var BYE = [
    ["That's all for today. Enjoy your coffee, {n}.", "วันนี้มีแค่นี้ ดื่มกาแฟให้อร่อยนะคะ คุณ {n}"],
    ["That's everything. Go get them, {n}.", "ครบแล้วค่ะ ลุยเลยนะคะ คุณ {n}"],
    ["All caught up. Have a lovely day, {n}.", "ตามทันหมดแล้ว ขอให้เป็นวันที่ดีนะคะ คุณ {n}"],
    ["The books are in good hands. Off you go, {n}.", "บัญชีอยู่ในมือหนูแล้ว ไปทำงานได้เลยค่ะ คุณ {n}"],
    ["That's the lot. I'll keep an eye on things, {n}.", "หมดแล้วค่ะ เดี๋ยวหนูคอยดูให้นะคะ คุณ {n}"],
    ["Done for now. Take a breath, {n}.", "เท่านี้ก่อนค่ะ พักหายใจสักนิดนะคะ คุณ {n}"],
    ["You're all set. Make it a good one, {n}.", "พร้อมแล้วค่ะ ขอให้วันนี้ดีนะคะ คุณ {n}"]];
  var bye = wd === 1 ? ["That's your week started. Have a good one, {n}.", "เริ่มต้นสัปดาห์เรียบร้อย ขอให้เป็นสัปดาห์ที่ดีนะคะ คุณ {n}"]
    : wd === 5 ? ["That's all for today. Have a lovely weekend, {n}.", "วันนี้มีแค่นี้ ขอให้สุดสัปดาห์นี้สบาย ๆ นะคะ คุณ {n}"]
    : wd === 0 || wd === 6 ? ["That's all. Enjoy the rest of your weekend, {n}.", "เท่านี้ค่ะ พักผ่อนสุดสัปดาห์ให้เต็มที่นะคะ คุณ {n}"]
    : part === 2 ? ["That's all for today. Get some rest, {n}.", "วันนี้มีแค่นี้ พักผ่อนเยอะ ๆ นะคะ คุณ {n}"]
    : !top.length ? ["Nothing needs you today. Enjoy the quiet, {n}.", "วันนี้ไม่มีอะไรต้องทำ สบาย ๆ นะคะ คุณ {n}"]
    : F.d != null && F.d > 10 && K > 0 && seed % 2 ? ["A strong month so far. Keep it going, {n}.", "เดือนนี้ไปได้สวย ไปต่อเลยค่ะ คุณ {n}"]
    : pick(BYE, 3);
  end.appendChild(NI(el("p", "mb-sign", L(bye[0], bye[1]).replace("{n}", nm))));
  end.appendChild(el("p", "mb-by", "ThuraGirl, your bookkeeper. Ask me anything below."));
  wrap.appendChild(end);
  pg.appendChild(wrap);
  setTimeout(function(){ mbBold(wrap); }, 140);
}
var MB_RX = null;
function mbBold(root){
  if (!MB_RX){
    var en = "January|February|March|April|May|June|July|August|September|October|November|December", thm = Object.keys(MF).map(function(k){ return MF[k]; }).join("|");
    MB_RX = new RegExp("(−?฿[\\d,]+(?:\\.\\d+)?(?:\\s?(?:M|K|ล้าน|พัน))?|[+−-]?\\d[\\d.,]*\\s?%|#?INV-[\\w-]+|\\d{1,2} (?:" + en + "|" + thm + ")(?: \\d{4})?|\\d[\\d,.]*\\s?(?:days?|people|months?|things?|bank lines|kinds|payments?|receipts?|reminders?|slips?|วัน|คน|เดือน|เรื่อง|รายการ|ประเภท|ครั้ง|ใบ))", "g");
  }
  $$(".mb-p, .mb-tx h3, .mb-ins p, .mb-rl span, .mb-calm", root).forEach(function(e){
    var w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT), list = [], n;
    while ((n = w.nextNode())) if (!n.parentNode.closest("b,em")) list.push(n);
    list.forEach(function(t){
      var v = t.nodeValue; MB_RX.lastIndex = 0; if (!MB_RX.test(v)) return; MB_RX.lastIndex = 0;
      var f = document.createDocumentFragment(), last = 0, m;
      while ((m = MB_RX.exec(v))){ if (m.index > last) f.appendChild(document.createTextNode(v.slice(last, m.index))); var b = el("b", "kd num", m[0]); b.setAttribute("data-noi18n", ""); f.appendChild(b); last = m.index + m[0].length; }
      if (last < v.length) f.appendChild(document.createTextNode(v.slice(last)));
      e.setAttribute("data-noi18n", ""); t.parentNode.replaceChild(f, t);
    });
  });
}
function T_(s){ return lang() === "th" ? T(s) : s; }
function dayRow(e){
  var dd = day(e[0]), r = el("div", "pb-row"), dy = el("span", "pb-day");
  dy.appendChild(el("small", "", e[0] === today() ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dy.appendChild(el("b", "num", String(dd.getDate()))); r.appendChild(dy);
  r.appendChild(el("span", "pb-rt", e[1])); r.appendChild(el("b", "num pb-v " + e[3], (e[3] === "in" ? "+" : "−") + e[2])); return r;
}
