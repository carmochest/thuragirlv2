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
  function sec(title, kick){ var s = el("section", "mb-sec"), h = el("div", "mb-sh"); if (kick) h.appendChild(el("span", "mb-kick", kick)); h.appendChild(el("h2", "", title)); s.appendChild(h); return s; }

  // what needs a yes, most pressing first
  var urgent = [];
  if (p && !u.done["rev:" + p.key]) urgent.push({ ic: "i-chart", h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept.", btn: "Review", fn: openSheet, k: "rev" });
  TK.filter(function(x){ return (x.rank <= 3 || (x.due && diffDays(x.due, today()) <= 3)) && x.k.indexOf("rev") !== 0; }).forEach(function(x){ urgent.push({ ic: x.ic || "i-clock", h: x.story ? x.story.h : x.t, p: x.story ? x.story.p : (x.m || ""), btn: x.btn, fn: x.fn, k: x.k, amt: x.amt, late: x.late }); });
  var top = urgent.slice(0, 6), restN = TK.filter(function(x){ return x.k.indexOf("rev") !== 0; }).length - top.filter(function(x){ return x.k !== "rev"; }).length;

  var wrap = el("div", "mb");

  // ── hero
  var hero = el("header", "mb-hero");
  var tr = el("div", "mb-top"), dt = el("div", "mb-dt");
  dt.appendChild(NI(el("small", "", th ? now.toLocaleDateString("th-TH", { weekday: "short" }) : now.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase())));
  dt.appendChild(el("b", "num", String(now.getDate()))); tr.appendChild(dt);
  var tt = el("div", "mb-tt"); tt.appendChild(el("span", "mb-name", "The Morning Brief")); tt.appendChild(NI(el("span", "mb-meta", (th ? mth(MONTH[now.getMonth()]) + " " + (now.getFullYear() + 543) : MONTH[now.getMonth()] + " " + now.getFullYear()) + L(" · 5 min read", " · อ่าน 5 นาที")))); tr.appendChild(tt);
  tr.insertAdjacentHTML("beforeend", '<svg class="tg mb-logo" width="40" height="42"><use href="#tg"/></svg>');
  hero.appendChild(tr);
  hero.appendChild(NI(el("p", "mb-hi", (hr < 12 ? L("Good morning, ", "อรุณสวัสดิ์ คุณ ") : hr < 18 ? L("Good afternoon, ", "สวัสดีตอนบ่าย คุณ ") : L("Good evening, ", "สวัสดีตอนเย็น คุณ ")) + nm)));
  var hl = NI(el("h1", "mb-hl"));
  hl.innerHTML = L("You have <em>" + esc(shortB(B.cash)) + "</em> in the bank" + (top.length ? ", and <em>" + top.length + (top.length === 1 ? " thing" : " things") + "</em> need" + (top.length === 1 ? "s" : "") + " you today." : ", and nothing needs you today."),
    "มีเงินในบัญชี <em>" + esc(shortB(B.cash)) + "</em> " + (top.length ? "และวันนี้มี <em>" + top.length + " เรื่อง</em>รอคุณอยู่" : "และวันนี้ไม่มีอะไรรอคุณ"));
  hero.appendChild(hl);
  var st = el("div", "mb-stats");
  [[L("Cash", "เงินสด"), baht(B.cash), B.cashD == null ? "" : (B.cashD >= 0 ? "↑ " : "↓ ") + pctTxt(B.cashD)],
   [L("Kept", "เหลือเก็บ"), (K < 0 ? "−" : "") + baht(Math.abs(K)), L("of ", "จาก ") + shortB(F.rev)],
   [L("Needs you", "รอคุณ"), String(top.length), restN > 0 ? L("+" + restN + " later", "+" + restN + " รอได้") : L("then all clear", "แล้วก็ว่าง")]].forEach(function(x){
    var t = NI(el("div", "mb-stat")); t.appendChild(el("span", "", x[0])); t.appendChild(el("b", "num", x[1])); if (x[2]) t.appendChild(el("small", "num", x[2])); st.appendChild(t);
  });
  hero.appendChild(st); wrap.appendChild(hero);

  // ── today's list
  var ls = sec(top.length ? "Today's list" : "Nothing on today's list", top.length ? L(top.length + (top.length === 1 ? " thing" : " things") + ", most pressing first", top.length + " เรื่อง เรียงจากด่วนที่สุด") : "");
  NI($(".mb-kick", ls) || el("i"));
  if (!top.length) ls.appendChild(el("p", "mb-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var c = el("article", "mb-task" + (i === 0 ? " lead" : ""));
    if (i === 0) c.appendChild(el("span", "mb-rib", "Start here"));
    var hd = el("div", "mb-th"); hd.innerHTML = '<i class="mb-ic"><svg class="i"><use href="#' + s.ic + '"/></svg></i>';
    var tx = el("div", "mb-tx"); tx.appendChild(el("h3", "", s.h)); if (s.late && s.late.txt) tx.appendChild(el("span", "mb-tag " + (s.late.cls || ""), s.late.txt)); hd.appendChild(tx); c.appendChild(hd);
    c.appendChild(el("p", "mb-p", s.p));
    var ft = el("div", "mb-tf"); ft.appendChild(el("b", "num mb-amt", s.amt ? baht(s.amt) : "")); ft.appendChild(btn("pill soft act", s.btn, s.fn)); c.appendChild(ft);
    ls.appendChild(c);
  });
  if (restN > 0){ var lk = btn("mb-more", restN + (restN === 1 ? " smaller thing can wait" : " smaller things can wait"), function(){ go(""); }); lk.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); ls.appendChild(lk); }
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
      var c = el("article", "mb-ins t" + (i % 3)); c.innerHTML = '<i class="mb-ic sm"><svg class="i"><use href="#i-trend"/></svg></i>';
      if (fig){ var f = NI(el("b", "num mb-fig", fig)); c.appendChild(f); if (unit) c.appendChild(NI(el("span", "mb-unit", unit))); }
      c.appendChild(el("p", "", s)); rail.appendChild(c);
    });
    is.appendChild(rail); wrap.appendChild(is);
  }

  // ── today's receipt: what ThuraGirl did
  var rs = sec("What I took care of", L("While you were busy", "ระหว่างที่คุณยุ่งอยู่")); NI($(".mb-kick", rs));
  var rc = Object.keys(u.rcpt || {}).length, items = [], mins = 0;
  function did(t, m){ items.push(t); mins += m; }
  did(B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost", B.n / 6);
  if (u.matched) did(u.matched + " payments matched to invoices and bills", u.matched * 2);
  if (rc) did(rc + (rc === 1 ? " receipt" : " receipts") + " filed", rc * 2);
  var rem = (u.invoices || []).filter(function(v){ return v.reminded && diffDays(today(), v.reminded) <= 7; }).length; if (rem) did(rem + (rem === 1 ? " payment reminder" : " payment reminders") + " sent this week", rem * 5);
  var pf = (u.invoices || []).concat(u.bills || []).filter(function(v){ return v.proof; }).length; if (pf) did(pf + (pf === 1 ? " payment slip" : " payment slips") + " filed", pf * 2);
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) did(TP.name + " tax forms approved", 45); else if (TP) did(TP.name + " tax forms prepared and checked", 45);
  if (p && u.done["rev:" + p.key]) did(p.name + " books signed off", 30);
  did("Cash, costs and profit brought up to date for " + mName, 15);
  var rp = el("div", "mb-rcpt"), rh = el("div", "mb-rh"); rh.appendChild(el("b", "", "ThuraGirl")); rh.appendChild(NI(el("span", "num", th ? now.toLocaleDateString("th-TH") : now.toLocaleDateString("en-GB")))); rp.appendChild(rh);
  items.forEach(function(t){ var r = el("div", "mb-rl"); r.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; r.appendChild(el("span", "", t)); rp.appendChild(r); });
  var mr = Math.max(5, Math.round(mins / 5) * 5), h = Math.floor(mr / 60), mm = mr % 60, tot = el("div", "mb-rt"); tot.appendChild(el("span", "", "Time saved, about"));
  tot.appendChild(NI(el("b", "num", L(((h ? h + " h " : "") + (mm ? mm + " min" : "")).trim(), ((h ? h + " ชม. " : "") + (mm ? mm + " นาที" : "")).trim())))); rp.appendChild(tot);
  rs.appendChild(rp); wrap.appendChild(rs);

  // ── sign-off
  var end = el("div", "mb-end"); end.innerHTML = '<svg class="tg" width="44" height="46"><use href="#tg"/></svg>';
  end.appendChild(NI(el("p", "mb-sign", L("That's all for today. Enjoy your coffee, " + nm + ".", "วันนี้มีแค่นี้ ดื่มกาแฟให้อร่อยนะคะ คุณ " + nm))));
  end.appendChild(el("p", "mb-by", "ThuraGirl, your bookkeeper. Ask me anything below."));
  wrap.appendChild(end);
  pg.appendChild(wrap);
}
function T_(s){ return lang() === "th" ? T(s) : s; }
function dayRow(e){
  var dd = day(e[0]), r = el("div", "pb-row"), dy = el("span", "pb-day");
  dy.appendChild(el("small", "", e[0] === today() ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dy.appendChild(el("b", "num", String(dd.getDate()))); r.appendChild(dy);
  r.appendChild(el("span", "pb-rt", e[1])); r.appendChild(el("b", "num pb-v " + e[3], (e[3] === "in" ? "+" : "−") + e[2])); return r;
}
