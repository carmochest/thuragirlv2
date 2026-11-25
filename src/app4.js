
/* ── books: everything on the dashboard is worked out from the statements in this browser ── */
var MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];
var MON3 = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
var THMON = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
function iso(d){ return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function day(s){ var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(s, n){ var d = day(s); d.setDate(d.getDate() + n); return iso(d); }
function diffDays(a, b){ return Math.round((day(a) - day(b)) / 864e5); }
function nice(s){ var d = day(s); return d.getDate() + " " + MONTH[d.getMonth()]; }
function niceY(s){ var d = day(s); return d.getDate() + " " + MONTH[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); }
function pct(a, b){ return b ? (a - b) / Math.abs(b) * 100 : null; }
function pctTxt(p){ return p == null ? "" : Math.abs(p).toFixed(1) + "%"; }

/* reading a statement: CSV text or a spreadsheet, in English or Thai */
function splitCsv(text){
  text = String(text).replace(/^﻿/, "");
  var first = text.split(/\r?\n/).slice(0, 20).join("\n"), cnt = function(c){ return (first.match(new RegExp(c === "\t" ? "\t" : "\\" + c, "g")) || []).length; };
  var dl = [",", ";", "\t"].sort(function(a, b){ return cnt(b) - cnt(a); })[0];
  var rows = [], row = [], cell = "", q = false;
  for (var i = 0; i < text.length; i++){
    var c = text[i];
    if (q){ if (c === '"'){ if (text[i + 1] === '"'){ cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === dl){ row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r"){ if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length){ row.push(cell); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(x){ return String(x).trim(); }); });
}
function amt(v){
  if (v == null || v === "") return NaN;
  if (typeof v === "number") return v;
  var s = String(v).trim(), neg = /^\(.*\)$/.test(s) || /-$/.test(s) || /^-/.test(s) || /\bDR\b/i.test(s);
  s = s.replace(/[^\d.]/g, ""); if (!s) return NaN;
  var n = parseFloat(s); return isFinite(n) ? (neg ? -n : n) : NaN;
}
function yr(y){ y = +y; if (y < 100) y = y >= 50 ? 2500 + y : 2000 + y; if (y > 2400) y -= 543; return y; }
function pdate(v){
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return iso(v);
  if (typeof v === "number" && v > 20000 && v < 80000){ var d0 = new Date(Date.UTC(1899, 11, 30) + v * 864e5); return iso(new Date(d0.getUTCFullYear(), d0.getUTCMonth(), d0.getUTCDate())); }
  var s = String(v).trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?.*$/, ""), m;
  if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))) return iso(new Date(yr(m[1]), m[2] - 1, +m[3]));
  if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})$/))) return iso(new Date(yr(m[3]), m[2] - 1, +m[1]));
  if ((m = s.match(/^(\d{1,2})[\s-]*([A-Za-z]{3})[A-Za-z]*[\s-]*(\d{2,4})$/))){ var mi = MON3.indexOf(m[2].toLowerCase()); if (mi >= 0) return iso(new Date(yr(m[3]), mi, +m[1])); }
  if ((m = s.match(/^(\d{1,2})\s*(\S+\.\S*\.?)\s*(\d{2,4})$/))){ var ti = THMON.indexOf(m[2].replace(/\.?$/, ".")); if (ti >= 0) return iso(new Date(yr(m[3]), ti, +m[1])); }
  return "";
}
var HEAD = {
  date: /^(date|txn date|transaction date|posting date|value date|วันที่|วันที่ทำรายการ|วัน)/i,
  desc: /(desc|detail|รายการ|narrative|particular|memo|remark|channel|ช่องทาง|รายละเอียด)/i,
  ref: /(reference|ref\b|ref\.|เลขที่อ้างอิง)/i,
  credit: /(credit|deposit|ฝาก|money in|เงินเข้า|^in$|รับ)/i,
  debit: /(debit|withdraw|ถอน|money out|เงินออก|^out$|จ่าย)/i,
  amount: /(amount|จำนวนเงิน|^ยอดเงิน$)/i,
  balance: /(balance|คงเหลือ|ยอดคงเหลือ)/i
};
function readTable(rows){
  var hi = -1, col = {};
  for (var i = 0; i < Math.min(rows.length, 25) && hi < 0; i++){
    var c = {}, r = rows[i];
    r.forEach(function(h, j){
      h = String(h == null ? "" : h).trim(); if (!h) return;
      if (HEAD.balance.test(h)){ if (c.balance == null) c.balance = j; }
      else if (HEAD.date.test(h)){ if (c.date == null) c.date = j; }
      else if (HEAD.credit.test(h)){ if (c.credit == null) c.credit = j; }
      else if (HEAD.debit.test(h)){ if (c.debit == null) c.debit = j; }
      else if (HEAD.amount.test(h)){ if (c.amount == null) c.amount = j; }
      else if (HEAD.desc.test(h)){ if (c.desc == null) c.desc = j; }
      else if (HEAD.ref.test(h)){ if (c.ref == null) c.ref = j; }
    });
    if (c.date != null && (c.amount != null || c.credit != null || c.debit != null)){ hi = i; col = c; }
  }
  var acct = "";
  rows.slice(0, Math.max(hi, 0)).forEach(function(r){ var m = r.join(" ").match(/(\d{3}-?\d-?\d{5}-?\d)/); if (m && !acct) acct = m[1].replace(/\D/g, ""); });
  if (hi < 0) return { err: "I couldn't find the date and amount columns in this file. Export the statement from your bank as CSV or Excel and try again." };
  var out = [];
  rows.slice(hi + 1).forEach(function(r){
    var d = pdate(r[col.date]); if (!d) return;
    var a = NaN;
    if (col.amount != null) a = amt(r[col.amount]);
    if (!isFinite(a) || col.amount == null){ var cr = amt(r[col.credit]), db = amt(r[col.debit]); a = (isFinite(cr) ? Math.abs(cr) : 0) - (isFinite(db) ? Math.abs(db) : 0); if (!isFinite(cr) && !isFinite(db)) a = NaN; }
    if (!isFinite(a) || a === 0) return;
    var t = [r[col.desc], col.ref != null && r[col.ref] && String(r[col.desc] || "").indexOf(r[col.ref]) < 0 ? r[col.ref] : ""].filter(function(x){ return x != null && String(x).trim(); }).join(" ").trim() || (a > 0 ? "Money in" : "Money out");
    var b = col.balance != null ? amt(r[col.balance]) : NaN;
    out.push({ d: d, t: t, a: Math.round(a * 100) / 100, b: isFinite(b) ? b : null });
  });
  if (!out.length) return { err: "I found the columns but no transactions under them. Check that the file is a bank statement." };
  if (out.length > 1 && out[0].d > out[out.length - 1].d) out.reverse();
  out = out.map(function(x, i){ x.i = i; return x; }).sort(function(p, q){ return p.d < q.d ? -1 : p.d > q.d ? 1 : p.i - q.i; });
  out.forEach(function(x){ delete x.i; });
  return { tx: out, acct: acct, hasBal: out.some(function(x){ return x.b != null; }) };
}
var xlsxP = null;
function loadScript(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function(){ no(new Error("load")); }; document.head.appendChild(s); }); }
function readSheet(buf){
  if (!xlsxP) xlsxP = window.XLSX ? Promise.resolve() : loadScript("../assets/vendor/xlsx.core.min.js");
  return xlsxP.then(function(){ var wb = XLSX.read(buf, { type: "array", cellDates: true }), ws = wb.Sheets[wb.SheetNames[0]]; return readTable(XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" })); });
}

/* what each line is */
var INC = [[/GRAB|LINE ?MAN|WONGNAI|FOODPANDA|ROBINHOOD|SHOPEE|LAZADA|TIKTOK/i, "Delivery and marketplaces"], [/POS|EDC|CARD|SETTLE|MERCHANT/i, "Card sales"],
  [/QR|PROMPTPAY|พร้อมเพย์/i, "QR payments"], [/INTEREST|ดอกเบี้ย/i, "Interest"], [/REFUND|คืนเงิน/i, "Refunds"], [/TRF|TRANSFER|INWARD|โอน|DEPOSIT|ฝาก/i, "Transfers from customers"]];
var EXP = [[/PAYROLL|SALARY|WAGE|เงินเดือน|ค่าจ้าง/i, "Wages"], [/RENT|ค่าเช่า|PROPERTY|LEASE/i, "Rent"],
  [/REVENUE DEP|กรมสรรพากร|\bRD\b|VAT|TAX|SOCIAL SEC|\bSSO\b|ประกันสังคม/i, "Tax and social security"],
  [/\bMEA\b|\bPEA\b|ELECTRIC|ไฟฟ้า|WATER|\bMWA\b|\bPWA\b|ประปา|\bAIS\b|TRUE|DTAC|3BB|INTERNET|\bNT\b/i, "Utilities"],
  [/FACEBOOK|\bMETA\b|GOOGLE|\bADS?\b|MARKETING|โฆษณา/i, "Marketing"],
  [/MAKRO|LOTUS|BIG ?C|\bCP\b|WHOLESALE|SUPPL|MARKET|FOOD|BEVERAGE|INGRED|ตลาด|วัตถุดิบ/i, "Stock and supplies"],
  [/FEE|CHARGE|ค่าธรรมเนียม/i, "Bank fees"]];
function cat(t, a){ var L = a > 0 ? INC : EXP; for (var i = 0; i < L.length; i++) if (L[i][0].test(t)) return L[i][1]; return a > 0 ? "Other income" : "Other costs"; }
function txid(x){ return x.k + "|" + x.d + "|" + x.a + "|" + x.t; }

/* the numbers */
var BK_CACHE = { key: "", v: null };
function books(u){
  if (!u || !u.tx || !u.tx.length) return null;
  var key = u.email + ":" + u.tx.length + ":" + (u.txv || 0) + ":" + (u.setup && u.setup.vat);
  if (BK_CACHE.key === key) return BK_CACHE.v;
  var tx = u.tx, asOf = tx.reduce(function(m, x){ return x.d > m ? x.d : m; }, tx[0].d);
  var accts = {};
  tx.forEach(function(x){ (accts[x.k] = accts[x.k] || []).push(x); });
  function balAt(k, d){
    var L = accts[k], last = null;
    for (var i = 0; i < L.length && L[i].d <= d; i++) last = L[i];
    if (last) return last.b;
    var f = L[0]; return f.b != null ? f.b - f.a : null;
  }
  // fill balances that the file did not have, from the closing balance the owner gave us
  Object.keys(accts).forEach(function(k){
    var L = accts[k], bank = (u.banks || []).filter(function(b){ return b.bank + "|" + b.acct === k; })[0];
    if (L.every(function(x){ return x.b != null; })) return;
    var run = bank && bank.close != null ? bank.close : 0;
    for (var i = L.length - 1; i >= 0; i--){ if (L[i].b == null) L[i].b = run; run = L[i].b - L[i].a; }
  });
  var cash = Object.keys(accts).reduce(function(s, k){ return s + (balAt(k, asOf) || 0); }, 0);
  var series = [];
  for (var i = 29; i >= 0; i--){ var d = addDays(asOf, -i); series.push([d, Object.keys(accts).reduce(function(s, k){ return s + (balAt(k, d) || 0); }, 0)]); }
  var A = day(asOf), y = A.getFullYear(), mo = A.getMonth(), dd = A.getDate();
  var mStart = iso(new Date(y, mo, 1)), pmStart = iso(new Date(y, mo - 1, 1)), pmEnd = iso(new Date(y, mo - 1, Math.min(dd, new Date(y, mo, 0).getDate())));
  var q0 = Math.floor(mo / 3) * 3, qStart = iso(new Date(y, q0, 1)), off = diffDays(asOf, qStart), pqStart = iso(new Date(y, q0 - 3, 1)), pqEnd = addDays(pqStart, off);
  var yStart = iso(new Date(y, 0, 1)), pyStart = iso(new Date(y - 1, 0, 1)), pyEnd = iso(new Date(y - 1, mo, dd));
  var first = tx[0].d;
  function sum(a, b){
    var o = { inc: 0, exp: 0, cats: {}, n: 0 };
    tx.forEach(function(x){ if (x.d < a || x.d > b) return; o.n++; if (x.a > 0) o.inc += x.a; else o.exp -= x.a; var c = x.c || cat(x.t, x.a); o.cats[c] = (o.cats[c] || 0) + Math.abs(x.a); });
    o.kept = o.inc - o.exp; return o;
  }
  function mixOf(o, inc){
    var rows = Object.keys(o.cats).filter(function(c){ return (INC.some(function(r){ return r[1] === c; }) || c === "Other income") === inc; }).map(function(c){ return [c, o.cats[c]]; }).sort(function(p, q){ return q[1] - p[1]; });
    if (rows.length > 6){ var rest = rows.slice(5).reduce(function(s, r){ return s + r[1]; }, 0); rows = rows.slice(0, 5).concat([[inc ? "Everything else" : "Everything else", rest]]); }
    return rows;
  }
  var vatOn = !(u.setup && u.setup.vat === "No");
  function taxes(o, months, ytdKept){
    var sales = o.inc - (o.cats["Interest"] || 0) - (o.cats["Refunds"] || 0), buys = (o.cats["Stock and supplies"] || 0) + (o.cats["Utilities"] || 0) + (o.cats["Marketing"] || 0);
    var vat = vatOn ? Math.max(0, (sales - buys) * 7 / 107) : 0, wht = (o.cats["Rent"] || 0) * 0.05 + (o.cats["Marketing"] || 0) * 0.02;
    var annual = Math.max(0, ytdKept / Math.max(1, (mo + dd / 31)) * 12), cit = annual <= 300000 ? 0 : annual <= 3000000 ? (annual - 300000) * 0.15 : 405000 + (annual - 3000000) * 0.2;
    return [Math.round(vat), Math.round(wht), Math.round(cit * months / 12)];
  }
  function weeks(a, b){ var r = [], s = a, n = 1; while (s <= b){ var e = addDays(s, 6); if (e > b) e = b; var o = sum(s, e); r.push(["Wk " + n, o.inc, o.exp]); s = addDays(e, 1); n++; } return r; }
  function months(a, b){ var r = [], d = day(a); while (iso(d) <= b){ var s = iso(d), e = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); if (e > b) e = b; if (e >= first){ var o = sum(s, e); r.push([MONTH[d.getMonth()].slice(0, 3), o.inc, o.exp]); } d = new Date(d.getFullYear(), d.getMonth() + 1, 1); } return r; }
  var ytd = sum(yStart, asOf);
  function per(lab, vs, a, b, pa, pb, flow, mths){
    var o = sum(a, b), p = pa >= first ? sum(pa, pb) : null;
    return { lab: lab, vs: vs, rev: o.inc, exp: o.exp, d: p ? pct(o.kept, p.kept) : null, dIn: p ? pct(o.inc, p.inc) : null, dOut: p ? pct(o.exp, p.exp) : null, flow: flow,
      revMix: mixOf(o, true), expMix: mixOf(o, false), tax: taxes(o, mths, ytd.kept), cats: o.cats, from: a < first ? first : a, to: b };
  }
  var fin = {
    mtd: per("Profit this month", "vs last month", mStart, asOf, pmStart, pmEnd, weeks(mStart, asOf), 1),
    qtd: per("Profit this quarter", "vs last quarter", qStart, asOf, pqStart, pqEnd, months(qStart, asOf), 3),
    ytd: per("Profit this year", "vs last year", yStart, asOf, pyStart, pyEnd, months(yStart, asOf), mo + 1)
  };
  // the last full month, for the Review Pack
  var lmS = pmStart, lmE = iso(new Date(y, mo, 0)), lm = sum(lmS, lmE), pack = null;
  if (first <= addDays(lmS, 10) && lm.n) pack = { key: lmS.slice(0, 7), name: MONTH[day(lmS).getMonth()], from: lmS, to: lmE, inc: lm.inc, exp: lm.exp, kept: lm.kept, tax: taxes(lm, 1, ytd.kept) };
  var mStartBal = series.length ? Object.keys(accts).reduce(function(s, k){ return s + (balAt(k, addDays(mStart, -1)) || 0); }, 0) : 0;
  var v = { asOf: asOf, first: first, cash: cash, series: series, fin: fin, pack: pack, cashD: mStart > first ? pct(cash, mStartBal) : null, n: tx.length, accts: Object.keys(accts).length };
  BK_CACHE = { key: key, v: v }; return v;
}

/* a sample restaurant, so the whole app can be tried without a real statement */
function sampleCsv(){
  var s = 20260425; function r(){ s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }
  function between(a, b){ return Math.round((a + r() * (b - a)) / 10) * 10; }
  var end = addDays(today(), -1), start = addDays(end, -150), d = start, bal = 640000, rows = [], n = 4800;
  function add(t, a, ref){ bal = Math.round((bal + a) * 100) / 100; rows.push([d, t, ref || "", a > 0 ? a.toFixed(2) : "", a < 0 ? (-a).toFixed(2) : "", bal.toFixed(2)]); }
  while (d <= end){
    var dt = day(d), wd = dt.getDay(), dm = dt.getDate(), wk = wd === 0 || wd === 6, mname = MONTH[dt.getMonth()].slice(0, 3).toUpperCase();
    if (dm === 1) add("WATTHANA PROPERTY MGMT RENT " + mname, -65000);
    if (dm === 3) add("MEA ELECTRICITY BILL PAYMENT", -between(10800, 13600));
    if (dm === 4) add("MWA WATER BILL PAYMENT", -between(1500, 2100));
    if (dm === 6) add("AIS FIBRE INTERNET", -1290);
    if (dm === 7 || dm === 21) add("FACEBOOK ADS META PLATFORMS", -between(4800, 7600));
    if (dm === 15){ add("REVENUE DEPT VAT PP30 PAYMENT", -between(17000, 26000)); add("SOCIAL SECURITY OFFICE SSO", -5250); }
    if (dm === 10) add("TRANSFER FROM SUKHUMVIT CATERING CO", between(68000, 142000), "INV-" + (n++));
    if (dm === 18 && r() < .7) add("INWARD TRF BANGKOK HOTEL GROUP", between(42000, 88500), "INV-" + (n++));
    add("POS SETTLEMENT BATCH " + (4000 + Math.floor(r() * 999)), between(wk ? 14500 : 9000, wk ? 21000 : 14500));
    add("QR PAYMENT RECEIVED PROMPTPAY", between(wk ? 7000 : 4200, wk ? 11000 : 7600));
    if (wd === 1 || wd === 4) add("GRAB FOOD MERCHANT PAYOUT", between(17000, 29000));
    if (wd === 2) add("LINE MAN WONGNAI PAYOUT", between(11000, 19000));
    if (wd === 2 || wd === 5) add("MAKRO SUKHUMVIT", -between(13500, 24500));
    if (wd !== 0) add("KLONG TOEY MARKET SUPPLIER", -between(3200, 6200));
    if (wd === 3 && r() < .5) add("THAI BEVERAGE CO SUPPLIER", -between(8000, 16000));
    if (dm === 25) add("PAYROLL SALARY " + mname + " 7 STAFF", -between(232000, 241000));
    if (wd === 1) add("PTT LPG GAS DELIVERY", -between(6200, 8800));
    if (wd === 4) add("CP FRESH MEAT SUPPLY", -between(21000, 29000));
    if (wd === 6) add("SIAM FRESH SEAFOOD", -between(16000, 23000));
    if (dm === 12) add("BANGKOK INSURANCE PREMIUM", -between(8500, 9500));
    if (dm === 20) add("KITCHEN EQUIPMENT LEASE TISCO", -18500);
    if (dm === 28) add("ACCOUNT FEE", -50);
    d = addDays(d, 1);
  }
  var head = [["K-Bank Statement"], ["Account No.", "048-3-51123-4"], ["Account Name", "Sample restaurant"], [], ["Date", "Description", "Reference", "Credit", "Debit", "Balance"]];
  return head.concat(rows).map(function(r){ return r.map(function(c){ return /[",]/.test(c) ? '"' + String(c).replace(/"/g, '""') + '"' : c; }).join(","); }).join("\n");
}
function sampleBooks(u){
  var t = today();
  if (!u.invoices || !u.invoices.length) u.invoices = [
    { id: "INV-2026-038", to: "Bangkok Hotel Group", email: "", issued: addDays(t, -75), due: addDays(t, -45), items: [["Catering, staff party", 1, 82710.28]], vat: true, paid: "" },
    { id: "INV-2026-039", to: "Lotus Wholesale", email: "", issued: addDays(t, -39), due: addDays(t, -9), items: [["Prepared meals, bulk order", 1, 60000]], vat: true, paid: "" },
    { id: "INV-2026-040", to: "Sukhumvit Catering", email: "", issued: addDays(t, -15), due: addDays(t, 15), items: [["Event catering, 120 guests", 1, 132710.28]], vat: true, paid: "" },
    { id: "INV-2026-041", to: "Asok Tower Building", email: "", issued: addDays(t, -7), due: addDays(t, 23), items: [["Lobby café supply", 1, 26168.22]], vat: true, paid: "" }];
  if (!u.bills || !u.bills.length) u.bills = [
    { id: "b1", to: "Watthana Property Mgmt", amount: 65000, due: addDays(t, -2), pp: "", note: "Rent", paid: "" },
    { id: "b2", to: "MEA (electricity)", amount: 12200, due: addDays(t, 3), pp: "", note: "", paid: "" },
    { id: "b3", to: "Makro Sukhumvit", amount: 18400, due: addDays(t, 5), pp: "", note: "Credit account", paid: "" },
    { id: "b4", to: "Thai Beverage Co", amount: 32800, due: addDays(t, 8), pp: "", note: "", paid: "" }];
  if (!u.setup.vat) u.setup.vat = "Yes";
  if (!u.setup.sso) u.setup.sso = "Yes";
  if (!u.team || !u.team.length) u.team = [["Somchai Saetang", "Head chef", 48000], ["Pimchanok Wongsa", "Operations manager", 55000], ["Anucha Phromsiri", "Sous chef", 32000], ["Niran Chaiyaporn", "Bookkeeper", 36000], ["Kanokwan Jaidee", "Front of house lead", 28000], ["Thanapon Rattanakul", "Marketing", 26000], ["Suwannee Tanyaluk", "Server", 18500]].map(function(p){ return { name: p[0], role: p[1], pay: p[2] }; });
  var pd = day(addDays(t, -1)); u.done["tax:" + iso(new Date(pd.getFullYear(), pd.getMonth() - 1, 1)).slice(0, 7)] = Date.now() - 6 * 864e5;
}
function invTotal(v){ var s = v.items.reduce(function(a, it){ return a + (+it[1] || 0) * (+it[2] || 0); }, 0); return Math.round((v.vat ? s * 1.07 : s) * 100) / 100; }
function lateTxt(due){ var n = diffDays(today(), due); return n > 0 ? n + (n === 1 ? " day late" : " days late") : n === 0 ? "Due today" : "Due in " + (-n) + (n === -1 ? " day" : " days"); }

/* add a parsed statement to the books, and tick off what it pays */
function addStatement(u, bank, acct, parsed, close){
  var k = bank + "|" + acct;
  u.tx = (u.tx || []).filter(function(x){ return x.k !== k || x.d < parsed.tx[0].d || x.d > parsed.tx[parsed.tx.length - 1].d; });
  var seen = {}; u.tx.forEach(function(x){ seen[txid(x)] = 1; });
  var added = 0;
  parsed.tx.forEach(function(x){ var y = { d: x.d, t: x.t, a: x.a, b: x.b, k: k }; if (!seen[txid(y)]){ u.tx.push(y); added++; } });
  u.tx.sort(function(p, q){ return p.d < q.d ? -1 : p.d > q.d ? 1 : 0; });
  u.txv = (u.txv || 0) + 1;
  var last = parsed.tx[parsed.tx.length - 1], b = (u.banks || []).filter(function(x){ return x.bank === bank && x.acct === acct; })[0];
  if (!b){ b = { bank: bank, acct: acct }; u.banks.push(b); }
  b.at = Date.now(); b.to = last.d; if (close != null) b.close = close; b.bal = last.b != null ? last.b : close;
  var matched = 0;
  (u.invoices || []).forEach(function(v){
    if (v.paid) return; var tot = invTotal(v);
    var hit = u.tx.filter(function(x){ return x.a > 0 && x.d >= v.issued && Math.abs(x.a - tot) < 1; })[0];
    if (hit){ v.paid = hit.d; v.via = "statement"; matched++; }
  });
  (u.bills || []).forEach(function(v){
    if (v.paid) return;
    var hit = u.tx.filter(function(x){ return x.a < 0 && Math.abs(-x.a - v.amount) < 1 && x.d >= addDays(v.due, -30); })[0];
    if (hit){ v.paid = hit.d; v.via = "statement"; matched++; }
  });
  u.matched = (u.matched || 0) + matched;
  u.hasData = true;
  return { added: added, matched: matched };
}

/* PromptPay QR (EMVCo), so a bill can be paid by scanning it in any Thai banking app */
function crc16(s){ var c = 0xFFFF; for (var i = 0; i < s.length; i++){ c ^= s.charCodeAt(i) << 8; for (var j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; c &= 0xFFFF; } return ("000" + c.toString(16).toUpperCase()).slice(-4); }
function tlv(t, v){ return t + ("0" + v.length).slice(-2) + v; }
function promptPay(id, amount){
  id = String(id).replace(/\D/g, ""); var acc;
  if (id.length === 10 && id[0] === "0") acc = tlv("01", "0066" + id.slice(1));
  else if (id.length === 13) acc = tlv("02", id);
  else if (id.length === 15) acc = tlv("03", id);
  else return "";
  var p = tlv("00", "01") + tlv("01", amount ? "12" : "11") + tlv("29", tlv("00", "A000000677010111") + acc) + tlv("53", "764") + (amount ? tlv("54", (+amount).toFixed(2)) : "") + tlv("58", "TH") + "6304";
  return p + crc16(p);
}
var qrP = null;
function qrSvg(text){
  if (!qrP) qrP = window.qrcode ? Promise.resolve() : loadScript("../assets/vendor/qrcode.js");
  return qrP.then(function(){
    var q = qrcode(0, "M"); q.addData(text); q.make();
    var n = q.getModuleCount(), m = 2, path = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) path += "M" + (c + m) + " " + (r + m) + "h1v1h-1z";
    return '<svg viewBox="0 0 ' + (n + m * 2) + " " + (n + m * 2) + '" role="img" aria-label="PromptPay QR code" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="' + path + '" fill="#0F1514"/></svg>';
  });
}
