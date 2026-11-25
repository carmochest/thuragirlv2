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
  var now = new Date(), T = tasks(u), p = B.pack, F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()], hr = now.getHours();
  var stories = [];
  if (p && !u.done["rev:" + p.key]) stories.push({ h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept. Tick the box and I lock the month.", btn: "Review", acc: 1, fn: openSheet });
  T.filter(function(x){ return x.story && x.rank <= 3; }).forEach(function(x){ stories.push({ h: x.story.h, p: x.story.p, btn: x.btn, fn: x.fn, k: x.k }); });
  var top = stories.slice(0, 3), rest = T.filter(function(x){ return !top.some(function(s){ return s.k === x.k; }); });

  var mast = el("div", "br-mast"); mast.appendChild(el("b", "", "The Morning Brief")); mast.appendChild(el("span", "", now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })));
  mast.appendChild(el("span", "br-rt", coName(u))); pg.appendChild(mast);

  var hd = el("header", "br-head"), h1 = el("h1"); h1.id = "br-h1";
  h1.appendChild(el("span", "l1", B.cashD == null ? "Cash is " + baht(B.cash) + "." : "Cash is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(Math.abs(B.cashD)) + "."));
  if (top.length){ h1.appendChild(el("em", "", ["", "One thing", "Two things", "Three things"][top.length])); h1.appendChild(document.createTextNode(" need" + (top.length === 1 ? "s" : "") + " your yes.")); }
  else h1.appendChild(el("em", "", "Nothing needs you today."));
  hd.appendChild(h1);
  var names = (u.banks || []).map(function(b){ return b.bank; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
  var lede = el("p", "br-lede"); lede.innerHTML = (hr < 12 ? "Good morning, " : hr < 18 ? "Good afternoon, " : "Good evening, ") + esc(first(u)) + ". You have <b class=\"num\">" + baht(B.cash) + "</b> " + (names.length ? "across " + esc(names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]) : "in the bank") + ", as of " + esc(nice(B.asOf)) + ". " +
    esc(mName) + " has brought in <b class=\"num\">" + baht(F.rev) + "</b> so far, and you have " + (F.rev >= F.exp ? "kept <b class=\"num\">" + baht(F.rev - F.exp) + "</b> of it." : "spent <b class=\"num\">" + baht(F.exp - F.rev) + "</b> more than came in.");
  hd.appendChild(lede); pg.appendChild(hd);

  // the numbers, in one strip
  var figs = el("div", "br-figs"), cashF = el("button", "br-fig wide"); cashF.type = "button"; cashF.addEventListener("click", function(){ go(""); });
  cashF.appendChild(el("span", "k", "Cash, last 30 days")); var cv = el("b", "num", baht(B.cash)); cashF.appendChild(cv); cashF.insertAdjacentHTML("beforeend", sparkSvg(B.series.map(function(s){ return s[1]; }), 160, 38));
  cashF.appendChild(el("small", "", B.cashD == null ? "As of " + nice(B.asOf) : (B.cashD >= 0 ? "Up " : "Down ") + pctTxt(Math.abs(B.cashD)) + " since 1 " + mName));
  figs.appendChild(cashF);
  [["Money in", F.rev, F.dIn, true], ["Money out", F.exp, F.dOut, false], ["Kept", F.rev - F.exp, F.d, true]].forEach(function(x){
    var f = el("button", "br-fig"); f.type = "button"; f.addEventListener("click", function(){ go("money"); });
    f.appendChild(el("span", "k", x[0])); f.appendChild(el("b", "num", baht(x[1])));
    var good = x[2] != null && (x[2] >= 0) === x[3];
    f.appendChild(el("small", good ? "up" : "", x[2] == null ? mName + " so far" : (x[2] >= 0 ? "Up " : "Down ") + pctTxt(Math.abs(x[2])) + " on last month"));
    figs.appendChild(f);
  });
  pg.appendChild(figs);

  var grid = el("div", "br-grid"), main = el("div", "br-main"), side = el("aside", "br-side");
  main.appendChild(el("div", "br-sec", top.length ? "Needs your yes" : "All clear"));
  if (!top.length) main.appendChild(el("p", "br-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var a = el("article", "story"); a.appendChild(el("span", "no", String(i + 1))); a.appendChild(el("h3", "", s.h)); a.appendChild(el("p", "todo", s.p));
    a.appendChild(btn("pill " + (s.acc || i === 0 ? "acc" : "soft act"), s.btn, s.fn)); main.appendChild(a);
  });

  // the week ahead
  var ev = weekAhead(u, B), wk = el("div", "br-week"), t = today();
  main.appendChild(el("div", "br-sec br-gap", "The week ahead"));
  for (var i = 0; i < 7; i++){
    var d = addDays(t, i), dd = day(d), col = el("div", "br-day" + (i === 0 ? " now" : "") + ((dd.getDay() === 0 || dd.getDay() === 6) ? " we" : ""));
    var dh = el("div", "dh"); dh.appendChild(el("span", "", i === 0 ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dh.appendChild(el("b", "num", String(dd.getDate()))); col.appendChild(dh);
    ev.filter(function(e){ return e[0] === d; }).forEach(function(e){ var it = el("div", "ev " + e[3]); it.appendChild(el("span", "", e[1])); it.appendChild(el("b", "num", e[2])); col.appendChild(it); });
    wk.appendChild(col);
  }
  main.appendChild(wk);
  if (!ev.length) main.appendChild(el("p", "br-calm sm", "No bills, invoices or filings fall due in the next seven days."));

  if (rest.length){
    main.appendChild(el("div", "br-sec br-gap", "Can wait"));
    rest.slice(0, 4).forEach(function(x){ var r = el("div", "row"), rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t)); rt.appendChild(el("div", "m", x.late.txt + (x.amt ? " · " + baht(x.amt) : ""))); r.appendChild(rt); r.appendChild(btn("pill soft act", x.btn, x.fn)); main.appendChild(r); });
  }

  var ns = noticed(u, B);
  if (ns.length){
    side.appendChild(el("div", "br-sec", "What I noticed")); var nl = el("ol", "br-note");
    ns.forEach(function(s){ nl.appendChild(el("li", "", s)); }); side.appendChild(nl);
  }
  side.appendChild(el("div", "br-sec" + (ns.length ? " br-gap" : ""), "Done for you"));
  var dn = el("ul", "br-done"), rc = Object.keys(u.rcpt || {}).length, items = [B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost"]; if (u.matched) items.push(u.matched + " payments matched to invoices and bills");
  if (rc) items.push(rc + (rc === 1 ? " receipt" : " receipts") + " filed");
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) items.push(TP.name + " tax forms approved");
  if (p && u.done["rev:" + p.key]) items.push(p.name + " books signed off");
  items.forEach(function(tx){ var li = el("li"); li.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; li.appendChild(document.createTextNode(tx)); dn.appendChild(li); });
  side.appendChild(dn);

  var mix = F.expMix.slice(0, 4), mx = mix.length ? mix[0][1] : 0;
  if (mix.length){
    var lk = el("div", "br-sec br-gap br-lk"); lk.appendChild(el("span", "", "Where it went")); var sm = btn("lnk", "See money", function(){ go("money"); }); sm.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); lk.appendChild(sm); side.appendChild(lk);
    var bars = el("ul", "br-bars");
    mix.forEach(function(m){ var li = el("li"), top2 = el("div", "bt"); top2.appendChild(el("span", "", cap(m[0]))); top2.appendChild(el("b", "num", baht(m[1]))); li.appendChild(top2); var bar = el("i"); bar.style.width = Math.max(4, m[1] / mx * 100) + "%"; li.appendChild(bar); bars.appendChild(li); });
    side.appendChild(bars);
  }
  grid.appendChild(main); grid.appendChild(side); pg.appendChild(grid);
  var end = el("p", "br-end", "That is everything for today. Ask me anything below."); pg.appendChild(end);
}
