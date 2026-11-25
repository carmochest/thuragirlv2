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
  var cards = [];
  if (p && !u.done["rev:" + p.key]) cards.push({ ic: "i-chart", h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept.", btn: "Review", fn: openSheet, k: "rev" });
  T.filter(function(x){ return x.rank <= 3 && x.k.indexOf("rev") !== 0; }).forEach(function(x){ cards.push({ ic: x.ic || "i-clock", h: x.story ? x.story.h : x.t, p: x.story ? x.story.p : (x.m || ""), btn: x.btn, fn: x.fn, k: x.k, amt: x.amt, late: x.late }); });
  var top = cards.slice(0, 5), rest = T.filter(function(x){ return !top.some(function(s){ return s.k === x.k; }) && x.k.indexOf("rev") !== 0; });
  var wrap = el("div", "pb");

  // hero: the one number, like a wallet balance
  var hero = el("section", "pb-hero");
  var hd = el("div", "pb-top"); hd.appendChild(el("span", "pb-kick", "The Morning Brief")); hd.appendChild(el("span", "pb-date", now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))); hero.appendChild(hd);
  hero.appendChild(el("p", "pb-hi", (hr < 12 ? "Good morning, " : hr < 18 ? "Good afternoon, " : "Good evening, ") + first(u) + "."));
  hero.appendChild(el("span", "pb-k", "Cash on hand"));
  hero.appendChild(el("b", "pb-bal num", baht(B.cash)));
  if (B.cashD != null) hero.appendChild(el("span", "pb-chg" + (B.cashD < 0 ? " dn" : ""), (B.cashD >= 0 ? "Up " : "Down ") + pctTxt(Math.abs(B.cashD)) + " since 1 " + mName));
  hero.insertAdjacentHTML("beforeend", sparkSvg(B.series.map(function(s){ return s[1]; }), 320, 64));
  var acts = el("div", "pb-acts");
  [["i-up", "Upload", function(){ var b2 = $(".js-anyup"); if (b2) b2.click(); }], ["i-doc", "Invoice", function(){ go(""); setTimeout(startInvoiceFlow, 120); }], ["i-pay", "Pay", function(){ go(""); setTimeout(startPayFlow, 120); }], ["i-chart", "Finance", function(){ go("money"); }]].forEach(function(a){
    var b = el("button", "pb-act"); b.type = "button"; b.innerHTML = '<i><svg class="i"><use href="#' + a[0] + '"/></svg></i>'; b.appendChild(el("span", "", a[1])); b.addEventListener("click", a[2]); acts.appendChild(b);
  });
  hero.appendChild(acts); wrap.appendChild(hero);

  // this month in three tiles
  var tiles = el("div", "pb-tiles");
  [["Money in", F.rev, F.dIn, true], ["Money out", F.exp, F.dOut, false], ["Kept", F.rev - F.exp, F.d, true]].forEach(function(x){
    var t = el("button", "pb-tile"); t.type = "button"; t.addEventListener("click", function(){ go("money"); });
    t.appendChild(el("span", "k", x[0])); t.appendChild(el("b", "num", baht(x[1])));
    var good = x[2] != null && (x[2] >= 0) === x[3];
    t.appendChild(el("small", good ? "up" : "", x[2] == null ? mName + " so far" : (x[2] >= 0 ? "↑ " : "↓ ") + pctTxt(Math.abs(x[2])) + " vs last month"));
    tiles.appendChild(t);
  });
  wrap.appendChild(tiles);

  // needs your yes: cards you swipe through
  var sec = el("section", "pb-sec"), sh = el("div", "pb-h"); sh.appendChild(el("h2", "", top.length ? "Needs your yes" : "All clear")); if (top.length) sh.appendChild(el("span", "pb-n num", String(top.length))); sec.appendChild(sh);
  if (!top.length) sec.appendChild(el("p", "pb-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  else {
    var rail = el("div", "pb-rail"); rail.setAttribute("role", "list");
    top.forEach(function(s, i){
      var c = el("article", "pb-card" + (i === 0 ? " lead" : "")); c.setAttribute("role", "listitem");
      var ct = el("div", "pb-ct"); ct.innerHTML = '<i class="pb-ic"><svg class="i"><use href="#' + s.ic + '"/></svg></i>';
      if (s.late && s.late.txt) ct.appendChild(el("span", "pb-tag " + (s.late.cls || ""), s.late.txt));
      c.appendChild(ct);
      c.appendChild(el("h3", "", s.h)); c.appendChild(el("p", "", s.p));
      var cf = el("div", "pb-cf"); if (s.amt) cf.appendChild(el("b", "num pb-amt", baht(s.amt))); cf.appendChild(btn("pill " + (i === 0 ? "acc" : "soft act"), s.btn, s.fn)); c.appendChild(cf);
      rail.appendChild(c);
    });
    sec.appendChild(rail);
    if (top.length > 1){
      var dots = el("div", "pb-dots"); top.forEach(function(s, i){ dots.appendChild(el("i", i === 0 ? "on" : "")); }); sec.appendChild(dots);
      rail.addEventListener("scroll", function(){ var w = rail.firstChild.getBoundingClientRect().width + 12, k = Math.round(rail.scrollLeft / w); $$("i", dots).forEach(function(d, j){ d.className = j === k ? "on" : ""; }); }, { passive: true });
    }
  }
  wrap.appendChild(sec);

  var cols = el("div", "pb-cols"), c1 = el("div", "pb-col"), c2 = el("div", "pb-col");
  var ev = weekAhead(u, B).sort(function(a, b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  var wk = el("section", "pb-box"); wk.appendChild(el("h2", "", "The week ahead"));
  if (!ev.length) wk.appendChild(el("p", "pb-calm", "No bills, invoices or filings fall due in the next seven days."));
  ev.forEach(function(e){
    var dd = day(e[0]), r = el("div", "pb-row"), dy = el("span", "pb-day"); dy.appendChild(el("small", "", e[0] === today() ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dy.appendChild(el("b", "num", String(dd.getDate()))); r.appendChild(dy);
    r.appendChild(el("span", "pb-rt", e[1])); r.appendChild(el("b", "num pb-v " + e[3], (e[3] === "in" ? "+" : "−") + e[2])); wk.appendChild(r);
  });
  c1.appendChild(wk);
  if (rest.length){
    var cw = el("section", "pb-box"); cw.appendChild(el("h2", "", "Can wait"));
    rest.slice(0, 4).forEach(function(x){ var r = el("div", "pb-row"); r.innerHTML = '<i class="pb-ic sm"><svg class="i"><use href="#' + (x.ic || "i-clock") + '"/></svg></i>'; var rt = el("span", "pb-rt"); rt.appendChild(el("b", "", x.t)); rt.appendChild(el("small", "", (x.late ? x.late.txt : "") + (x.amt ? " · " + baht(x.amt) : ""))); r.appendChild(rt); r.appendChild(btn("pill soft act", x.btn, x.fn)); cw.appendChild(r); });
    c1.appendChild(cw);
  }
  var ns = noticed(u, B);
  if (ns.length){
    var nb = el("section", "pb-box"); nb.appendChild(el("h2", "", "What I noticed"));
    ns.forEach(function(s){ var r = el("div", "pb-row top"); r.innerHTML = '<i class="pb-ic sm"><svg class="i"><use href="#i-trend"/></svg></i>'; r.appendChild(el("p", "pb-note", s)); nb.appendChild(r); });
    c2.appendChild(nb);
  }
  var mix = F.expMix.slice(0, 5), mx = mix.length ? mix[0][1] : 0;
  if (mix.length){
    var wb = el("section", "pb-box"), wh = el("div", "pb-h"); wh.appendChild(el("h2", "", "Where it went")); var sm = btn("lnk", "See finance", function(){ go("money"); }); sm.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); wh.appendChild(sm); wb.appendChild(wh);
    mix.forEach(function(m){ var r = el("div", "pb-bar"), tp = el("div", "bt"); tp.appendChild(el("span", "", cap(m[0]))); tp.appendChild(el("b", "num", baht(m[1]))); r.appendChild(tp); var bar = el("i"); bar.style.width = Math.max(4, m[1] / mx * 100) + "%"; r.appendChild(bar); wb.appendChild(r); });
    c2.appendChild(wb);
  }
  var dn = el("section", "pb-box"); dn.appendChild(el("h2", "", "Done for you"));
  var rc = Object.keys(u.rcpt || {}).length, items = [B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost"]; if (u.matched) items.push(u.matched + " payments matched to invoices and bills");
  if (rc) items.push(rc + (rc === 1 ? " receipt" : " receipts") + " filed");
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) items.push(TP.name + " tax forms approved");
  if (p && u.done["rev:" + p.key]) items.push(p.name + " books signed off");
  items.forEach(function(tx){ var r = el("div", "pb-row"); r.innerHTML = '<i class="pb-ic sm ok"><svg class="i"><use href="#i-check"/></svg></i>'; r.appendChild(el("span", "pb-rt", tx)); dn.appendChild(r); });
  c2.appendChild(dn);
  cols.appendChild(c1); cols.appendChild(c2); wrap.appendChild(cols);
  wrap.appendChild(el("p", "pb-end", "That is everything for today. Ask me anything below."));
  pg.appendChild(wrap);
}
