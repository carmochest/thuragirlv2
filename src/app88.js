/* ── sales by channel: one donut on Finance, custom charts from chat ── */
var CHANNELS = [
  [/GRAB/i, "GrabFood"], [/LINE ?MAN|WONGNAI/i, "LINE MAN"], [/SHOPEE/i, "Shopee"], [/LAZADA/i, "Lazada"], [/TIKTOK/i, "TikTok Shop"],
  [/FOODPANDA/i, "foodpanda"], [/ROBINHOOD/i, "Robinhood"],
  [/POS|EDC|CARD|SETTLE|MERCHANT/i, "In-store card"], [/QR|PROMPTPAY|พร้อมเพย์/i, "In-store QR"],
  [/TRF|TRANSFER|INWARD|โอน|DEPOSIT|ฝาก/i, "Invoices and transfers"]
];
var CH_TH = { "In-store card": "บัตรที่ร้าน", "In-store QR": "QR ที่ร้าน", "Invoices and transfers": "ใบแจ้งหนี้และโอนเงิน", "Other": "อื่น ๆ" };
function chName(n){ return L(n, CH_TH[n] || n); }
function chOf(x){
  if (!(x.a > 0) || /INTEREST|ดอกเบี้ย|REFUND|คืนเงิน/i.test(x.t)) return null;
  for (var i = 0; i < CHANNELS.length; i++) if (CHANNELS[i][0].test(x.t)) return CHANNELS[i][1];
  return "Other";
}
function chSum(u, a, b){
  var o = {}, tot = 0;
  (u.tx || []).forEach(function(x){ if (x.d < a || x.d > b) return; var c = chOf(x); if (!c) return; o[c] = (o[c] || 0) + x.a; tot += x.a; });
  var rows = Object.keys(o).map(function(k){ return [k, o[k]]; }).sort(function(p, q){ return q[1] - p[1]; });
  return { rows: rows, tot: tot };
}
function asOfOf(u){ return (u.tx || []).reduce(function(m, x){ return x.d > m ? x.d : m; }, "0000"); }
// one teal, stepped down for each slice, then greys: Option B allows a single accent
var CH_COL = ["var(--m-accent)", "color-mix(in srgb,var(--m-accent) 68%,var(--m-surface))", "color-mix(in srgb,var(--m-accent) 42%,var(--m-surface))", "color-mix(in srgb,var(--m-accent) 24%,var(--m-surface))", "color-mix(in srgb,var(--m-mute) 55%,var(--m-surface))", "color-mix(in srgb,var(--m-mute) 30%,var(--m-surface))"];
function donut(rows, tot, size){
  var R = 15.9155, sv = '<svg class="dn" viewBox="0 0 42 42" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="21" cy="21" r="' + R + '" fill="none" stroke="var(--m-soft)" stroke-width="6"/>', at = 25;
  rows.forEach(function(r, i){
    var p = tot ? r[1] / tot * 100 : 0, gap = rows.length > 1 ? .6 : 0;
    sv += '<circle cx="21" cy="21" r="' + R + '" fill="none" stroke="' + CH_COL[Math.min(i, CH_COL.length - 1)] + '" stroke-width="6" stroke-dasharray="' + Math.max(0, p - gap).toFixed(2) + " " + (100 - Math.max(0, p - gap)).toFixed(2) + '" stroke-dashoffset="' + at.toFixed(2) + '"/>';
    at -= p;
  });
  return sv + "</svg>";
}
function topRows(rows, n){
  if (rows.length <= n) return rows;
  var keep = rows.slice(0, n - 1), rest = rows.slice(n - 1).reduce(function(s, r){ return s + r[1]; }, 0);
  return keep.concat([["Other", rest]]);
}
var chPer = "m";
function chCard(u){
  var old = $("#m-chan"); if (old) old.remove();
  if (!u.tx || !u.tx.length) return;
  var A = asOfOf(u), d = day(A), mS = iso(new Date(d.getFullYear(), d.getMonth(), 1)), yS = iso(new Date(d.getFullYear(), 0, 1));
  var S = chSum(u, chPer === "m" ? mS : yS, A), rows = topRows(S.rows, 6);
  var c = el("section", "card chanB"); c.id = "m-chan"; c.setAttribute("aria-label", "Sales by channel"); c.setAttribute("data-noi18n", "");
  var h = el("div", "cardh"); h.appendChild(el("h2", "", L("Sales by channel", "ยอดขายตามช่องทาง")));
  var seg = el("div", "chseg"); [["m", L("Month", "เดือน")], ["y", L("Year", "ปี")]].forEach(function(o){ var b = el("button", "", o[1]); b.type = "button"; b.setAttribute("aria-pressed", String(chPer === o[0])); b.addEventListener("click", function(){ chPer = o[0]; chCard(me()); }); seg.appendChild(b); });
  h.appendChild(seg);
  var mT = lang() === "th" ? mth(MONTH[d.getMonth()]) : MONTH[d.getMonth()], yT = lang() === "th" ? String(d.getFullYear() + 543) : String(d.getFullYear());
  h.appendChild(el("div", "sub", (chPer === "m" ? mT + " " + yT : yT) + L(" so far", " ถึงตอนนี้")));
  c.appendChild(h);
  if (!S.tot){ c.appendChild(el("p", "st-p", L("No sales in this period yet.", "ยังไม่มียอดขายในช่วงนี้"))); }
  else {
    var body = el("div", "chbody"), ring = el("div", "chring"); ring.innerHTML = donut(rows, S.tot, 168);
    var mid = el("div", "chmid"); mid.appendChild(el("b", "num", "฿" + (S.tot >= 1e6 ? (S.tot / 1e6).toFixed(2) + L("M", " ล้าน") : money(Math.round(S.tot))))); mid.appendChild(el("small", "", L("sales", "ยอดขาย"))); ring.appendChild(mid);
    body.appendChild(ring);
    var lg = el("div", "chleg");
    rows.forEach(function(r, i){
      var row = el("div", "chrow"), sw = el("i", "chsw"); sw.style.background = CH_COL[Math.min(i, CH_COL.length - 1)];
      row.appendChild(sw); row.appendChild(el("span", "chn", chName(r[0]))); var v = el("span", "chv"); v.appendChild(el("b", "num", baht(Math.round(r[1])))); v.appendChild(el("small", "", Math.round(r[1] / S.tot * 100) + "%")); row.appendChild(v);
      lg.appendChild(row);
    });
    body.appendChild(lg); c.appendChild(body);
    var top = rows[0]; c.appendChild(el("p", "chnote", L(chName(top[0]) + " brings in the most, " + Math.round(top[1] / S.tot * 100) + "% of sales.", chName(top[0]) + " ทำยอดได้มากที่สุด " + Math.round(top[1] / S.tot * 100) + "% ของยอดขาย")));
  }
  c.appendChild(btn("alt chask", L("Ask for a custom chart, like \"Compare GrabFood vs LINE MAN for 3 months\"", "ขอกราฟแบบอื่นได้ เช่น \"เทียบ GrabFood กับ LINE MAN 3 เดือน\""), function(){ var i = $("#b-in"); i.value = L("Compare GrabFood vs LINE MAN for 3 months", "เทียบ GrabFood กับ LINE MAN 3 เดือน"); $("#b-send").disabled = false; try { i.focus(); } catch (e) {} }));
  var flow = $("#b-money .flowB"); if (flow && flow.parentNode) flow.parentNode.insertBefore(c, flow.nextSibling);
  pinCards(u);
}

/* chat: "compare Shopee vs LINE MAN last 3 months", "sales by channel", "breakdown of grab" */
function chQuery(q){
  var t = q.toLowerCase();
  if (!/channel|compare|\bvs\.?\b|versus|breakdown|break down|split|ช่องทาง|เทียบ|แยก/.test(t)) return null;
  var u = me(); if (!u || !u.tx || !u.tx.length) return null;
  var names = [];
  CHANNELS.forEach(function(c){ var n = c[1]; if ((n === "GrabFood" && /grab|แกร็บ/.test(t)) || (n === "LINE MAN" && /line ?man|wongnai|ไลน์แมน/.test(t)) || (n === "Shopee" && /shopee|ช้อปปี้/.test(t)) || (n === "Lazada" && /lazada|ลาซาด้า/.test(t)) || (n === "TikTok Shop" && /tiktok/.test(t)) || (n === "foodpanda" && /panda/.test(t)) || (n === "Robinhood" && /robinhood/.test(t)) || (n === "In-store card" && /card|pos|บัตร/.test(t)) || (n === "In-store QR" && /\bqr\b|promptpay|พร้อมเพย์/.test(t)) || (n === "Invoices and transfers" && /invoice|transfer|catering|ใบแจ้งหนี้|โอน/.test(t))) names.push(n); });
  var m = t.match(/(\d+)\s*(month|mo|เดือน)/), n = m ? Math.min(12, Math.max(1, +m[1])) : /year|ปี/.test(t) ? 12 : 3;
  return { chs: names, n: n };
}
function chSeries(u, spec){
  var A = day(asOfOf(u)), out = [];
  for (var i = spec.n - 1; i >= 0; i--){
    var s = new Date(A.getFullYear(), A.getMonth() - i, 1), e = new Date(A.getFullYear(), A.getMonth() - i + 1, 0);
    var S = chSum(u, iso(s), iso(e) < iso(A) ? iso(e) : iso(A)), o = {}; S.rows.forEach(function(r){ o[r[0]] = r[1]; });
    out.push({ m: s.getMonth(), y: s.getFullYear(), v: o, tot: S.tot });
  }
  var chs = spec.chs.length ? spec.chs : (function(){ var all = {}; out.forEach(function(p){ Object.keys(p.v).forEach(function(k){ all[k] = (all[k] || 0) + p.v[k]; }); }); return Object.keys(all).sort(function(a, b){ return all[b] - all[a]; }).slice(0, 4); })();
  return { months: out, chs: chs };
}
function chChart(u, spec){
  var D = chSeries(u, spec), w = el("div", "chq"); w.setAttribute("data-noi18n", "");
  var max = 1; D.months.forEach(function(p){ D.chs.forEach(function(c){ max = Math.max(max, p.v[c] || 0); }); });
  var plot = el("div", "chq-plot");
  D.months.forEach(function(p){
    var g = el("div", "chq-g"), bars = el("div", "chq-b");
    D.chs.forEach(function(c, i){ var b = el("i"); b.style.height = Math.max(2, (p.v[c] || 0) / max * 100) + "%"; b.style.background = CH_COL[Math.min(i * (D.chs.length > 2 ? 1 : 2), CH_COL.length - 1)]; b.title = chName(c) + " " + baht(Math.round(p.v[c] || 0)); bars.appendChild(b); });
    g.appendChild(bars); g.appendChild(el("span", "", lang() === "th" ? ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][p.m] : MONTH[p.m].slice(0, 3))); plot.appendChild(g);
  });
  w.appendChild(plot);
  var lg = el("div", "chq-l");
  D.chs.forEach(function(c, i){ var tot = D.months.reduce(function(s, p){ return s + (p.v[c] || 0); }, 0), r = el("span"); var sw = el("i", "chsw"); sw.style.background = CH_COL[Math.min(i * (D.chs.length > 2 ? 1 : 2), CH_COL.length - 1)]; r.appendChild(sw); r.appendChild(document.createTextNode(chName(c) + " ")); r.appendChild(el("b", "num", baht(Math.round(tot)))); lg.appendChild(r); });
  w.appendChild(lg);
  var sums = D.chs.map(function(c){ return [c, D.months.reduce(function(s, p){ return s + (p.v[c] || 0); }, 0)]; }).sort(function(a, b){ return b[1] - a[1]; });
  var txt;
  if (!sums.length || !sums[0][1]) txt = L("I don't see sales from " + (spec.chs.map(chName).join(" or ") || "those channels") + " in the last " + spec.n + " months.", "ไม่พบยอดขายจาก " + (spec.chs.map(chName).join(" หรือ ") || "ช่องทางนั้น") + " ใน " + spec.n + " เดือนที่ผ่านมา");
  else if (sums.length === 1) txt = L(chName(sums[0][0]) + " brought in " + baht(Math.round(sums[0][1])) + " over the last " + spec.n + " months.", chName(sums[0][0]) + " ทำยอดได้ " + baht(Math.round(sums[0][1])) + " ใน " + spec.n + " เดือนที่ผ่านมา");
  else txt = L(chName(sums[0][0]) + " leads with " + baht(Math.round(sums[0][1])) + " over the last " + spec.n + " months" + (sums[1][1] ? ", " + (sums[0][1] / sums[1][1]).toFixed(1) + "× " + chName(sums[1][0]) : "") + ".", chName(sums[0][0]) + " นำด้วย " + baht(Math.round(sums[0][1])) + " ใน " + spec.n + " เดือนที่ผ่านมา" + (sums[1][1] ? " เป็น " + (sums[0][1] / sums[1][1]).toFixed(1) + " เท่าของ " + chName(sums[1][0]) : ""));
  return { el: w, txt: txt, title: (D.chs.map(chName).join(L(" vs ", " กับ "))) + L(", last " + spec.n + " months", " · " + spec.n + " เดือนล่าสุด"), chs: D.chs };
}
function chAnswer(q, spec){
  var u = me(), C = chChart(u, spec), r = $("#b-reply");
  r.textContent = C.txt; r.appendChild(C.el);
  var pinned = (u.pins || []).some(function(p){ return p.chs.join() === C.chs.join() && p.n === spec.n; });
  popOpts(pinned ? [] : [{ l: L("Pin to Finance", "ปักหมุดไว้ที่การเงิน"), acc: 1, fn: function(){
    u.pins = (u.pins || []).concat([{ chs: C.chs, n: spec.n, at: Date.now() }]).slice(-4); save(); popOpts([]); toast(L("Pinned. You'll find it on Finance.", "ปักหมุดแล้ว ดูได้ที่หน้าการเงิน")); if (tab === "money") chCard(u);
  } }]);
}
function pinCards(u){
  $$(".pinB").forEach(function(n){ n.remove(); });
  var after = $("#m-chan"); if (!after) return;
  (u.pins || []).slice().reverse().forEach(function(p, ri){
    var i = u.pins.length - 1 - ri, C = chChart(u, p), c = el("section", "card pinB"); c.setAttribute("data-noi18n", "");
    var h = el("div", "cardh"); h.appendChild(el("h2", "", C.title));
    var x = el("button", "cb-btn"); x.type = "button"; x.setAttribute("aria-label", L("Unpin", "เลิกปักหมุด")); x.innerHTML = '<svg class="i"><use href="#i-x"/></svg>';
    x.addEventListener("click", function(){ u.pins.splice(i, 1); save(); pinCards(u); }); h.appendChild(x);
    h.appendChild(el("div", "sub", L("Pinned from chat", "ปักหมุดจากแชท"))); c.appendChild(h);
    c.appendChild(el("p", "chnote", C.txt)); c.appendChild(C.el);
    after.parentNode.insertBefore(c, after.nextSibling);
  });
}

/* P&L drill-down: tap a line, see what is inside it */
function payee(t){
  var s = String(t).replace(/\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/gi, "").replace(/\b\d+\s*STAFF\b/i, "").replace(/[#\d]+/g, "").replace(/\b(BATCH|PAYMENT|BILL|PAYOUT|RECEIVED|SETTLEMENT|INV)\b/gi, " $1").replace(/\s+/g, " ").trim();
  s = s.replace(/\s+(BATCH|INV)$/i, "");
  return s.toLowerCase().replace(/(^|\s)\S/g, function(m){ return m.toUpperCase(); }).replace(/\b(Ais|Mea|Mwa|Pea|Sso|Cp|Ptt|Lpg|Pos|Qr|Vat|Tisco)\b/g, function(m){ return m.toUpperCase(); });
}
function plTap(row, name, F, inc){
  row.classList.add("tap"); row.setAttribute("role", "button"); row.tabIndex = 0;
  row.appendChild(el("i", "pl-go")); row.lastChild.innerHTML = '<svg class="i"><use href="#i-chevr"/></svg>';
  var go = function(){ plDrill(name, F, inc); };
  row.addEventListener("click", go); row.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } });
}
function plDrill(name, F, inc){
  var u = me(), o = {}, tot = 0, n = 0;
  (u.tx || []).forEach(function(x){ if (x.d < F.from || x.d > F.to || (x.a > 0) !== inc) return; if ((x.c || cat(x.t, x.a)).toLowerCase() !== String(name).toLowerCase()) return; var p = payee(x.t) || x.t; o[p] = (o[p] || 0) + Math.abs(x.a); tot += Math.abs(x.a); n++; });
  var rows = topRows(Object.keys(o).map(function(k){ return [k, o[k]]; }).sort(function(p, q){ return q[1] - p[1]; }), 6);
  var b = openGS(inc ? L("Money in", "เงินเข้า") : L("Money out", "เงินออก"), T_(cap(name)), lang() === "th" ? day(F.from).getDate() + " " + mth(MONTH[day(F.from).getMonth()]) + " – " + day(F.to).getDate() + " " + mth(MONTH[day(F.to).getMonth()]) : nice(F.from) + " – " + nice(F.to));
  var w = el("div", "drill"); w.setAttribute("data-noi18n", "");
  var ring = el("div", "chring"); ring.innerHTML = donut(rows, tot, 150);
  var mid = el("div", "chmid"); mid.appendChild(el("b", "num", "฿" + (tot >= 1e6 ? (tot / 1e6).toFixed(2) + L("M", " ล้าน") : money(Math.round(tot))))); mid.appendChild(el("small", "", n + L(n === 1 ? " payment" : " payments", " รายการ"))); ring.appendChild(mid); w.appendChild(ring);
  var lg = el("div", "chleg");
  rows.forEach(function(r, i){ var row = el("div", "chrow"), sw = el("i", "chsw"); sw.style.background = CH_COL[Math.min(i, CH_COL.length - 1)]; row.appendChild(sw); row.appendChild(el("span", "chn", r[0] === "Other" ? L("Everything else", "อื่น ๆ") : r[0])); var v = el("span", "chv"); v.appendChild(el("b", "num", baht(Math.round(r[1])))); v.appendChild(el("small", "", (tot ? Math.round(r[1] / tot * 100) : 0) + "%")); row.appendChild(v); lg.appendChild(row); });
  w.appendChild(lg); b.appendChild(w);
  if (rows.length) b.appendChild(el("p", "chnote", L(rows[0][0] + " is the biggest part, " + Math.round(rows[0][1] / tot * 100) + "% of this line.", rows[0][0] + " เป็นส่วนที่ใหญ่ที่สุด " + Math.round(rows[0][1] / tot * 100) + "% ของรายการนี้")));
  b.appendChild(foot(btn("pill soft", L("Ask about this", "ถามเรื่องนี้"), function(){ closeGS(); var i = $("#b-in"); i.value = L("Break down " + cap(name).toLowerCase() + " by month", "แยก" + T_(cap(name)) + "ตามเดือน"); $("#b-send").disabled = false; try { i.focus(); } catch (e) {} }), btn("pill acc", L("Done", "เสร็จ"), closeGS)));
}
