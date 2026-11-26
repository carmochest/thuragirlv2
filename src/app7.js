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
  function P(cls, html){ var x = el("p", cls); x.innerHTML = html; x.setAttribute("data-noi18n", ""); return x; }
  function n(v){ return '<b class="num">' + esc(v) + "</b>"; }
  function card(kick, title, cls){ var c = el("section", "cf-card " + (cls || "")), h = el("div", "cf-h"); h.appendChild(el("span", "cf-k", kick)); if (title) h.appendChild(el("h2", "", title)); c.appendChild(h); return c; }

  // what needs a yes, most pressing first
  var urgent = [];
  if (p && !u.done["rev:" + p.key]) urgent.push({ ic: "i-chart", h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept.", btn: "Review", fn: openSheet, k: "rev" });
  TK.filter(function(x){ return x.rank <= 3 && x.k.indexOf("rev") !== 0; }).forEach(function(x){ urgent.push({ ic: x.ic || "i-clock", h: x.story ? x.story.h : x.t, p: x.story ? x.story.p : (x.m || ""), btn: x.btn, fn: x.fn, k: x.k, amt: x.amt, late: x.late }); });
  var top = urgent.slice(0, 5), restN = TK.filter(function(x){ return x.k.indexOf("rev") !== 0; }).length - top.filter(function(x){ return x.k !== "rev"; }).length;

  var wrap = el("div", "cf");
  var mast = el("div", "cf-mast"); mast.innerHTML = '<svg class="tg" width="30" height="31"><use href="#tg"/></svg>';
  var mt = el("div", "cf-mt"); mt.appendChild(el("b", "", "The Morning Brief")); mt.appendChild(el("span", "", (th ? now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" }) : now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })) + " · " + L("about 5 minutes", "อ่านราว 5 นาที")));
  mt.lastChild.setAttribute("data-noi18n", ""); mast.appendChild(mt); wrap.appendChild(mast);
  var hi = el("h1", "cf-hi", (hr < 12 ? L("Good morning, ", "อรุณสวัสดิ์ คุณ ") : hr < 18 ? L("Good afternoon, ", "สวัสดีตอนบ่าย คุณ ") : L("Good evening, ", "สวัสดีตอนเย็น คุณ ")) + nm + L(".", "")); hi.setAttribute("data-noi18n", ""); wrap.appendChild(hi);

  // 1. the short version
  var sv = card("The short version", "", "lead");
  var cashS = B.cashD == null ? "" : B.cashD >= 0 ? L(", up " + pctTxt(B.cashD) + " since 1 " + mName, " เพิ่มขึ้น " + pctTxt(B.cashD) + " ตั้งแต่ 1 " + mT) : L(", down " + pctTxt(B.cashD) + " since 1 " + mName, " ลดลง " + pctTxt(B.cashD) + " ตั้งแต่ 1 " + mT);
  sv.appendChild(P("cf-big", L("You have " + n(baht(B.cash)) + " in the bank" + cashS + ".", "ตอนนี้มีเงินในบัญชี " + n(baht(B.cash)) + cashS)));
  var mS = L(mName + " has brought in " + n(baht(F.rev)) + " so far. After " + n(baht(F.exp)) + " of costs, you have " + (K >= 0 ? "kept " + n(baht(K)) : "spent " + n(baht(-K)) + " more than came in") + ".",
    mT + " มีเงินเข้าแล้ว " + n(baht(F.rev)) + " หักค่าใช้จ่าย " + n(baht(F.exp)) + (K >= 0 ? " เหลือเก็บ " + n(baht(K)) : " ใช้เกินรายรับ " + n(baht(-K))));
  if (F.d != null && K > 0 && Math.abs(F.d) >= 200) mS += L(" That is well " + (F.d >= 0 ? "ahead of" : "behind") + " this point last month.", " " + (F.d >= 0 ? "ดีกว่า" : "น้อยกว่า") + "ช่วงเดียวกันของเดือนก่อนมาก");
  else if (F.d != null && K > 0) mS += L(" That is " + pctTxt(F.d) + (F.d >= 0 ? " more" : " less") + " than at this point last month.", " " + (F.d >= 0 ? "มากกว่า" : "น้อยกว่า") + "ช่วงเดียวกันของเดือนก่อน " + pctTxt(F.d));
  sv.appendChild(P("", mS));
  sv.appendChild(P("", !top.length ? L("Nothing is late and nothing needs signing today. A quiet morning.", "วันนี้ไม่มีอะไรค้างและไม่มีอะไรต้องอนุมัติ เช้าที่สบาย ๆ")
    : top.length === 1 ? L("One thing needs you today: " + esc(top[0].h.charAt(0).toLowerCase() + top[0].h.slice(1)) + ".", "วันนี้มีหนึ่งเรื่องที่รอคุณ: " + esc(T_(top[0].h)))
    : L(top.length + " things need you today. The most pressing: " + esc(top[0].h.charAt(0).toLowerCase() + top[0].h.slice(1)) + ".", "วันนี้มี " + top.length + " เรื่องที่รอคุณ เรื่องแรกคือ " + esc(T_(top[0].h)))));
  wrap.appendChild(sv);

  // 2. what's urgent
  var ur = card("Needs you", top.length ? "What's urgent" : "Nothing urgent");
  if (!top.length) ur.appendChild(el("p", "cf-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var it = el("div", "cf-item"); it.appendChild(el("span", "cf-no num", String(i + 1)));
    var bd = el("div", "cf-bd"); bd.appendChild(el("h3", "", s.h)); bd.appendChild(el("p", "", s.p));
    var ft = el("div", "cf-ft"); if (s.late && s.late.txt) ft.appendChild(el("span", "cf-tag " + (s.late.cls || ""), s.late.txt)); if (s.amt) ft.appendChild(el("b", "num cf-amt", baht(s.amt)));
    ft.appendChild(btn("pill " + (i === 0 ? "acc" : "soft act"), s.btn, s.fn)); bd.appendChild(ft); it.appendChild(bd); ur.appendChild(it);
  });
  if (restN > 0){ var lk = btn("lnk cf-more", restN + (restN === 1 ? " smaller thing can wait" : " smaller things can wait"), function(){ go(""); }); lk.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); ur.appendChild(lk); }
  wrap.appendChild(ur);

  // 3. what I did for you
  var dn = card("Done for you", "What I did while you slept"), ul = el("ul", "cf-done");
  var rc = Object.keys(u.rcpt || {}).length, items = [B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost"];
  if (u.matched) items.push(u.matched + " payments matched to invoices and bills");
  if (rc) items.push(rc + (rc === 1 ? " receipt" : " receipts") + " filed");
  var rem = (u.invoices || []).filter(function(v){ return v.reminded && diffDays(today(), v.reminded) <= 7; }).length; if (rem) items.push(rem + (rem === 1 ? " payment reminder" : " payment reminders") + " sent this week");
  var pf = (u.invoices || []).concat(u.bills || []).filter(function(v){ return v.proof; }).length; if (pf) items.push(pf + (pf === 1 ? " payment slip" : " payment slips") + " filed");
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) items.push(TP.name + " tax forms approved");
  else if (TP) items.push(TP.name + " tax forms prepared and checked");
  if (p && u.done["rev:" + p.key]) items.push(p.name + " books signed off");
  items.push("Cash, costs and profit brought up to date for " + mName);
  items.forEach(function(tx){ var li = el("li"); li.innerHTML = '<i><svg class="i"><use href="#i-check"/></svg></i>'; li.appendChild(el("span", "", tx)); ul.appendChild(li); });
  dn.appendChild(ul); wrap.appendChild(dn);

  // 4. worth a look
  var ns = noticed(u, B), big = F.expMix[0];
  if (big && F.exp) ns.unshift(L("Your biggest cost this month is " + big[0].toLowerCase() + ": " + baht(big[1]) + ", or " + Math.round(big[1] / F.exp * 100) + "% of everything that went out.", "ค่าใช้จ่ายก้อนใหญ่สุดเดือนนี้คือ" + T(cap(big[0])) + " " + baht(big[1]) + " หรือ " + Math.round(big[1] / F.exp * 100) + "% ของเงินออกทั้งหมด"));
  if (ns.length){
    var ob = card("Worth a look", "What I noticed");
    ns.slice(0, 4).forEach(function(s){ var r = el("div", "cf-note"); r.innerHTML = '<i><svg class="i"><use href="#i-trend"/></svg></i>'; r.appendChild(el("p", "", s)); ob.appendChild(r); });
    wrap.appendChild(ob);
  }

  // 5. the week ahead
  var ev = weekAhead(u, B).sort(function(a, b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  var wk = card("Coming up", "The week ahead");
  if (!ev.length) wk.appendChild(el("p", "cf-calm", "No bills, invoices or filings fall due in the next seven days."));
  ev.forEach(function(e){ wk.appendChild(dayRow(e)); });
  wrap.appendChild(wk);

  var end = el("div", "cf-end"); end.innerHTML = '<svg class="tg" width="26" height="27"><use href="#tg"/></svg>'; end.appendChild(el("p", "", "That is everything for today. Enjoy your coffee. Ask me anything below.")); wrap.appendChild(end);
  pg.appendChild(wrap);
}
function T_(s){ return lang() === "th" ? T(s) : s; }
function dayRow(e){
  var dd = day(e[0]), r = el("div", "pb-row"), dy = el("span", "pb-day");
  dy.appendChild(el("small", "", e[0] === today() ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dy.appendChild(el("b", "num", String(dd.getDate()))); r.appendChild(dy);
  r.appendChild(el("span", "pb-rt", e[1])); r.appendChild(el("b", "num pb-v " + e[3], (e[3] === "in" ? "+" : "−") + e[2])); return r;
}
/* home borrows the week ahead from the brief */
function paintWeek(u){
  var B = books(u), host = $("#b-week"), needs = $(".needB");
  if (!host && needs){ host = el("section", "card weekB"); host.id = "b-week"; host.setAttribute("aria-label", "The week ahead"); needs.parentNode.insertBefore(host, needs.nextSibling); }
  if (!host) return; host.textContent = "";
  if (!B){ host.hidden = true; return; }
  var ev = weekAhead(u, B).sort(function(a, b){ return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; });
  host.hidden = !ev.length; if (!ev.length) return;
  var h = el("div", "cardh"); h.appendChild(el("h2", "", "The week ahead"));
  var tin = 0, tout = 0; ev.forEach(function(e){ var v = +String(e[2]).replace(/[^\d.]/g, ""); if (e[3] === "in") tin += v; else tout += v; });
  h.appendChild(el("div", "sub", (tin ? "+" + baht(tin) + " in" : "") + (tin && tout ? " · " : "") + (tout ? "−" + baht(tout) + " out" : ""))); host.appendChild(h);
  ev.slice(0, 5).forEach(function(e){ host.appendChild(dayRow(e)); });
}
