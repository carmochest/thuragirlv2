/* ── the books on an accrual basis ──
   Bank lines are cash. Profit is not cash. This turns the two into proper management accounts:
   - sales are recognised when invoiced (unpaid invoices count), shop sales on the day, both without VAT
   - a bank line that settles an invoice or a bill is a collection or a payment, not new income or cost
   - stock bought goes to inventory; cost of goods sold = purchases − the change in stock on hand
   - VAT, withholding tax and the staff half of social security are money owed to the state, not costs
   Treatment follows bible-v2 (revenue, inventory, VAT and WHT rules). Estimates until the auditor closes the month. */
var SALES_C = { "Card sales": 1, "QR payments": 1, "Delivery and marketplaces": 1, "Transfers from customers": 1, "Invoiced sales": 1 };
var OTHER_INC = { "Interest": 1, "Refunds": 1, "Other income": 1 };
function isIncCat(c){ return !!(SALES_C[c] || OTHER_INC[c]); }
var STOCK_RX = /MAKRO|LOTUS|BIG ?C|\bCP\b|WHOLESALE|SUPPL|MARKET|FOOD|BEVERAGE|INGRED|SEAFOOD|MEAT|ตลาด|วัตถุดิบ/i;
function billDate(v){ return v.date || addDays(v.due, -30); }
function billKind(v){ return v.kind || (STOCK_RX.test(v.to + " " + (v.note || "")) ? "stock" : "expense"); }
function billCat(v){ var c = cat(v.to + " " + (v.note || ""), -1); return c === "Stock and supplies" ? "Other costs" : c; }
function billVat(u, v){ return u.setup && u.setup.vat !== "No" && v.vat !== false; }
function invNet(v){ return v.items.reduce(function(a, it){ return a + (+it[1] || 0) * (+it[2] || 0); }, 0); }
/* stock on hand: the latest count on or before a day */
function stockAt(u, d){ var best = null; (u.stock || []).forEach(function(s){ if (s.d <= d && (!best || s.d > best.d)) best = s; }); return best; }

/* which bank lines settle an invoice or a bill. One line settles one document, never two.
   A bill marked paid by hand is linked when the matching line arrives, so it is not counted again. */
function docLinks(u){
  var used = {}, out = {};
  function find(sign, amount, from, to){
    var hit = null; (u.tx || []).forEach(function(x){ if (hit || used[txid(x)] || (x.a > 0) !== (sign > 0)) return; if (Math.abs(Math.abs(x.a) - amount) < 1 && x.d >= from && x.d <= to) hit = x; }); return hit;
  }
  (u.invoices || []).forEach(function(v){
    if (!v.paid) return; var x = v.tx && (u.tx || []).filter(function(y){ return txid(y) === v.tx; })[0];
    if (!x) x = find(1, invTotal(v), v.issued, v.via === "hand" ? addDays(v.paid, 15) : "9999");
    if (x){ used[txid(x)] = 1; out[txid(x)] = { kind: "inv", doc: v }; v.tx = txid(x); }
  });
  (u.bills || []).forEach(function(v){
    if (!v.paid) return; var x = v.tx && (u.tx || []).filter(function(y){ return txid(y) === v.tx; })[0];
    if (!x) x = find(-1, v.amount, addDays(billDate(v), -5), v.via === "hand" ? addDays(v.paid, 15) : "9999");
    if (x){ used[txid(x)] = 1; out[txid(x)] = { kind: "bill", doc: v }; v.tx = txid(x); }
  });
  return out;
}

function accSum(u, a, b, links){
  var vatOn = !(u.setup && u.setup.vat === "No");
  var o = { inc: 0, exp: 0, cats: {}, n: 0, cin: 0, cout: 0, ccats: {}, outVat: 0, inVat: 0, buys: 0, cogs: 0, settled: 0 };
  function add(c, v, inc){ o.cats[c] = (o.cats[c] || 0) + v; if (inc) o.inc += v; else o.exp += v; }
  (u.tx || []).forEach(function(x){
    if (x.d < a || x.d > b) return; o.n++;
    var c = x.c || cat(x.t, x.a), v = Math.abs(x.a);
    if (x.a > 0) o.cin += v; else o.cout += v; o.ccats[c] = (o.ccats[c] || 0) + v;
    if (links[txid(x)]){ o.settled += v; return; }
    if (x.a > 0){
      if (SALES_C[c]){ var net = vatOn ? v / 1.07 : v; o.outVat += v - net; add(c, net, 1); }
      else add(c, v, 1);
      return;
    }
    if (c === "Tax and social security"){ if (/SOCIAL|\bSSO\b|ประกันสังคม/i.test(x.t)) add("Wages", v / 2); return; }
    if (c === "Stock and supplies"){ var nb = vatOn && !/MARKET|ตลาด/i.test(x.t) ? v / 1.07 : v; o.inVat += v - nb; o.buys += nb; return; }
    if (c === "Utilities" && vatOn){ var nu = v / 1.07; o.inVat += v - nu; add(c, nu); return; }
    add(c, v);
  });
  (u.invoices || []).forEach(function(v){ if (v.issued < a || v.issued > b) return; var net = invNet(v); add("Invoiced sales", net, 1); if (v.vat) o.outVat += net * 0.07; });
  (u.bills || []).forEach(function(v){
    var d = billDate(v); if (d < a || d > b) return;
    var net = billVat(u, v) ? v.amount / 1.07 : v.amount; o.inVat += v.amount - net;
    if (billKind(v) === "stock") o.buys += net; else if (billKind(v) === "asset") o.equip = (o.equip || 0) + net; else add(billCat(v), net);
  });
  var s0 = stockAt(u, addDays(a, -1)), s1 = stockAt(u, b), dS = s0 && s1 ? s1.v - s0.v : 0;
  o.cogs = Math.max(0, o.buys - dS); o.dStock = dS; if (o.cogs) add("Cost of goods sold", o.cogs);
  ["inc", "exp", "outVat", "inVat", "buys"].forEach(function(k){ o[k] = Math.round(o[k] * 100) / 100; });
  Object.keys(o.cats).forEach(function(k){ o.cats[k] = Math.round(o.cats[k] * 100) / 100; });
  o.kept = o.inc - o.exp; o.ckept = o.cin - o.cout;
  return o;
}

/* balance sheet at a day: what the company has and what it owes */
function bsheet(u, B){
  var d = B.asOf, vatOn = !(u.setup && u.setup.vat === "No");
  var ar = (u.invoices || []).filter(function(v){ return !v.paid && v.issued <= d; }).reduce(function(s, v){ return s + invTotal(v); }, 0);
  var ap = (u.bills || []).filter(function(v){ return !v.paid && billDate(v) <= d; }).reduce(function(s, v){ return s + v.amount; }, 0);
  var st = stockAt(u, d), stock = st ? st.v : 0;
  var T = taxFilings(u, B), owed = T.list.filter(function(f){ return f.st !== "paid" && f.liab; });
  var vat = owed.filter(function(f){ return f.k === "vat"; }).reduce(function(s, f){ return s + f.amt; }, 0);
  var wht = owed.filter(function(f){ return f.k === "pnd1" || f.k === "pnd3" || f.k === "sso"; }).reduce(function(s, f){ return s + f.amt; }, 0);
  var cit = T.citYear;
  var equip = (u.bills || []).filter(function(v){ return billKind(v) === "asset" && billDate(v) <= d; }).reduce(function(s, v){ return s + (billVat(u, v) ? v.amount / 1.07 : v.amount); }, 0);
  var assets = [["Cash at bank", B.cash], ["Owed to you (receivables)", ar], ["Stock on hand", stock], ["Equipment", equip]].filter(function(r){ return r[1]; });
  var liabs = [["You owe suppliers (payables)", ap], ["VAT to pay", vatOn ? vat : 0], ["Withholding tax and SSO to pay", wht], ["Company income tax (estimate)", cit]].filter(function(r){ return r[1]; });
  var tA = assets.reduce(function(s, r){ return s + r[1]; }, 0), tL = liabs.reduce(function(s, r){ return s + r[1]; }, 0);
  return { asOf: d, assets: assets, liabs: liabs, tA: tA, tL: tL, eq: tA - tL, stockAt: st ? st.d : "" };
}

/* each tax filing with its status: estimated (month still running), confirmed (month closed and approved),
   filed, paid (the payment is in the bank). Due dates are the e-filing dates (Revenue Department, SSO). */
function taxFilings(u, B){
  var A = day(B.asOf), list = [], vatOn = !(u.setup && u.setup.vat === "No");
  var links = docLinks(u);
  function monthRange(off){ var s = new Date(A.getFullYear(), A.getMonth() + off, 1), e = new Date(A.getFullYear(), A.getMonth() + off + 1, 0); return [iso(s), iso(e) > B.asOf ? B.asOf : iso(e), s]; }
  var R = (u.team || []).length ? payRun(u) : null;
  [-1, 0].forEach(function(off){
    var m = monthRange(off), s = accSum(u, m[0], m[1], links), key = m[0].slice(0, 7), nx = new Date(m[2].getFullYear(), m[2].getMonth() + 1, 1), ym = iso(nx).slice(0, 8);
    var closed = off < 0, approved = !!u.done["tax:" + key];
    var paidLine = function(rx){ return (u.tx || []).filter(function(x){ return x.a < 0 && rx.test(x.t) && x.d >= iso(nx) && x.d <= addDays(iso(nx), 25); })[0]; };
    function st(rx){ var pl = paidLine(rx); return pl ? ["paid", pl] : closed && approved ? ["filed", null] : closed ? ["confirmed", null] : ["estimated", null]; }
    var mName = MONTH[m[2].getMonth()];
    if (vatOn){ var vs = st(/VAT|PP ?30/i), va = vs[1] ? -vs[1].a : Math.max(0, Math.round(s.outVat - s.inVat)); list.push({ k: "vat", form: "PP.30", name: "VAT", month: mName, key: key, amt: va, due: ym + "23", st: vs[0], paidOn: vs[1] && vs[1].d, liab: 1, out: Math.round(s.outVat), in: Math.round(s.inVat) }); }
    var whtAmt = Math.round((s.ccats["Rent"] || 0) * 0.05 + (s.ccats["Marketing"] || 0) * 0.02 + (s.ccats["Other costs"] || 0) * 0.01);
    if (whtAmt){ var ws = st(/PND ?(3|53)/i); list.push({ k: "pnd3", form: "PND.3 / PND.53", name: "Withholding tax on rent and services", month: mName, key: key, amt: ws[1] ? -ws[1].a : whtAmt, due: ym + "15", st: ws[0], paidOn: ws[1] && ws[1].d, liab: 1 }); }
    if (R){
      var ps = st(/PND ?1\b/i); if (R.tax) list.push({ k: "pnd1", form: "PND.1", name: "Salary tax withheld", month: mName, key: key, amt: ps[1] ? -ps[1].a : Math.round(R.tax), due: ym + "15", st: off < 0 || A.getDate() >= 25 ? ps[0] : "estimated", paidOn: ps[1] && ps[1].d, liab: 1 });
      if (u.setup.sso !== "No"){ var ss = st(/SOCIAL|\bSSO\b/i); list.push({ k: "sso", form: "SPS 1-10", name: "Social security, you and your staff", month: mName, key: key, amt: ss[1] ? -ss[1].a : Math.round(R.sso * 2), due: ym + "15", st: off < 0 || A.getDate() >= 25 ? ss[0] : "estimated", paidOn: ss[1] && ss[1].d, liab: 1 }); }
    }
  });
  /* company income tax: half-year PND.51 and year-end PND.50, estimated from this year's profit so far */
  var yS = iso(new Date(A.getFullYear(), 0, 1)), Y = accSum(u, yS, B.asOf, links), mo = A.getMonth() + A.getDate() / 31, annual = Math.max(0, Y.kept / Math.max(1, mo) * 12);
  var cit = annual <= 300000 ? 0 : annual <= 3000000 ? (annual - 300000) * 0.15 : 405000 + (annual - 3000000) * 0.2, citYear = Math.round(cit * Math.min(12, mo) / 12);
  list.push({ k: "pnd50", form: "PND.50", name: "Company income tax for the year", month: String(A.getFullYear()), key: "y" + A.getFullYear(), amt: Math.round(cit), due: (A.getFullYear() + 1) + "-05-30", st: "estimated", liab: 0 });
  return { list: list, citYear: citYear, annual: annual };
}

/* sample data: monthly stock counts, and bills dated so nothing is counted twice */
function sampleStock(u){
  if (u.stock && u.stock.length) return;
  var t = today(), d = day(t), v = [172000, 181500, 176800, 188200, 184600, 191300], out = [];
  for (var i = 5; i >= 1; i--){ out.push({ d: iso(new Date(d.getFullYear(), d.getMonth() - i + 1, 0)), v: v[5 - i] }); }
  out.push({ d: addDays(t, -2), v: v[5] });
  u.stock = out;
  (u.bills || []).forEach(function(b){
    if (b.id === "b1" && b.note === "Rent"){ b.amount = 19500; b.note = "Service charge, Q4"; }
    if (!b.date) b.date = addDays(b.due, b.id === "b1" ? -15 : -20);
  });
}
