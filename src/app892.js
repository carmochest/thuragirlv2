/* ── Finance after the finance review: profit (accrual) and cash shown apart, a balance sheet,
   taxes with their status, paying known bills, what each bill is, the auditor, and chat history ── */
function NIx(e){ e.setAttribute("data-noi18n", ""); return e; }
function shortBaht(v){ var a = Math.abs(v), s = a >= 1e6 ? (a / 1e6).toFixed(2).replace(/\.?0+$/, "") + L("M", " ล้าน") : a >= 1e4 ? Math.round(a / 1e3) + L("K", " พัน") : money(a); return (v < 0 ? "−" : "") + "฿" + s; }
function dmy(s){ var d = day(s); return lang() === "th" ? d.getDate() + " " + mth(MONTH[d.getMonth()]) : d.getDate() + " " + MONTH[d.getMonth()].slice(0, 3); }
function monTx(m){ return lang() === "th" ? mth(m) : m; }

/* the profit comparison shows both numbers, never a bare multiple */
function cmpLine(F){
  if (F.prevKept == null) return L("From " + nice(F.from) + " to " + nice(F.to), "ตั้งแต่ " + dmy(F.from) + " ถึง " + dmy(F.to));
  var k = F.rev - F.exp, w = { mtd: L("the same days last month", "ช่วงเดียวกันของเดือนก่อน"), qtd: L("the same point last quarter", "ช่วงเดียวกันของไตรมาสก่อน"), ytd: L("the same point last year", "ช่วงเดียวกันของปีก่อน") }[per] || "";
  return (k >= F.prevKept ? L("Up from ", "เพิ่มจาก ") : L("Down from ", "ลดจาก ")) + baht(F.prevKept) + L(" on ", " ใน") + w;
}

/* Finance: profit card, then cash, then statements and taxes */
var _renderMoney = renderMoney;
renderMoney = function(){
  _renderMoney();
  var u = me(), B = books(u); if (!B) return; var F = B.fin[per];
  var dt = $("#m-dtxt"); dt.textContent = cmpLine(F); NIx(dt); dt.parentNode.classList.toggle("down", F.prevKept != null && F.rev - F.exp < F.prevKept);
  var mg = $("#m-mg"); mg.textContent = F.rev ? (((F.rev - F.exp) / F.rev) * 100).toFixed(1) + L("% of revenue", "% ของรายได้") : ""; NIx(mg);
  /* cash, labelled as cash */
  var fl = $("#b-money .flowB"); if (fl){
    var h2 = $(".cardh h2", fl); h2.textContent = L("Cash in and out", "เงินสดเข้าออก"); NIx(h2);
    $("#m-in").textContent = baht(F.cin); $("#m-out").textContent = baht(F.cout);
    var cn = $(".cashnote", fl); if (!cn){ cn = NIx(el("p", "cashnote")); fl.appendChild(cn); }
    cn.textContent = L("What went through your bank. This is cash, not profit: it includes VAT, money collected on older invoices and stock not used yet.", "เงินที่ผ่านบัญชีธนาคารของคุณ นี่คือเงินสด ไม่ใช่กำไร เพราะรวม VAT เงินที่เก็บได้จากใบแจ้งหนี้เก่า และสต็อกที่ยังไม่ได้ใช้");
  }
  bsCard(u, B); taxCard(u, B);
};
/* profit and loss on an accrual basis */
plCard = function(F){
  var root = $("#m-plc"); if (!root) return; root.textContent = ""; NIx(root.parentNode);
  var ph = $(".plB .cardh h2"); if (ph) ph.textContent = L("Profit and loss", "กำไรขาดทุน");
  $("#m-plp").textContent = L(nice(F.from) + " to " + nice(F.to), dmy(F.from) + " ถึง " + dmy(F.to));
  function block(title, rows, total, cls){
    var h = el("div", "pl-h " + cls); h.appendChild(el("span", "", title)); h.appendChild(el("b", "num", baht(total))); root.appendChild(h);
    var list = rows.slice(0, 6), rest = rows.slice(6).reduce(function(a, r){ return a + r[1]; }, 0);
    if (rest > 0) list = list.concat([["Everything else", rest]]);
    list.forEach(function(r){
      var d = el("div", "pl-r"); d.appendChild(el("span", "", T_(cap(r[0])))); d.appendChild(el("em", "num", total ? Math.round(r[1] / total * 100) + "%" : "")); d.appendChild(el("span", "num", baht(r[1])));
      if (r[0] === "Cost of goods sold") d.addEventListener("click", function(){ cogsSheet(F); }), d.classList.add("tap");
      else if (r[0] === "Invoiced sales") d.addEventListener("click", function(){ go("money"); var l = $("#b-money .listB"); if (l) l.scrollIntoView({ behavior: "smooth", block: "start" }); }), d.classList.add("tap");
      else if (r[0] !== "Everything else") plTap(d, r[0], F, cls === "in");
      root.appendChild(d);
    });
    if (!list.length) root.appendChild(el("div", "pl-r", L("Nothing yet", "ยังไม่มี")));
  }
  block(L("Revenue, before VAT", "รายได้ ก่อน VAT"), F.revMix, F.rev, "in");
  block(L("Costs", "ค่าใช้จ่าย"), F.expMix, F.exp, "out");
  var k = F.rev - F.exp, t = el("div", "pl-t" + (k < 0 ? " neg" : "")); t.appendChild(el("span", "", k < 0 ? L("Loss", "ขาดทุน") : L("Profit before tax", "กำไรก่อนภาษี")));
  var v = el("div", "pl-tv"); v.appendChild(el("b", "num", (k < 0 ? "−" : "") + baht(Math.abs(k)))); if (F.rev) v.appendChild(el("small", "num", (k / F.rev * 100).toFixed(1) + L("% of revenue", "% ของรายได้"))); t.appendChild(v); root.appendChild(t);
  root.appendChild(el("p", "tnote", L("Accrual basis: sales count when invoiced, even if unpaid. Stock counts when it is used, not when bought. VAT and withholding tax are owed to the Revenue Department, so they are not costs.", "เกณฑ์คงค้าง: นับยอดขายเมื่อออกใบแจ้งหนี้ แม้ยังไม่ได้รับเงิน นับสต็อกเมื่อใช้ ไม่ใช่เมื่อซื้อ VAT และภาษีหัก ณ ที่จ่ายเป็นเงินที่ต้องนำส่งกรมสรรพากร จึงไม่ใช่ค่าใช้จ่าย")));
  plActions(root, F);
};
function cogsSheet(F){
  var u = me(), b = openGS(L("Costs", "ค่าใช้จ่าย"), L("Cost of goods sold", "ต้นทุนขาย"), L(nice(F.from) + " to " + nice(F.to), dmy(F.from) + " ถึง " + dmy(F.to)));
  var ul = NIx(el("ul", "shB-l"));
  function li(a, v){ var x = el("li"); x.appendChild(el("span", "", a)); x.appendChild(el("b", "num", v)); ul.appendChild(x); }
  li(L("Stock bought, before VAT", "ซื้อสต็อก ก่อน VAT"), baht(F.buys));
  li(F.dStock >= 0 ? L("Less: more stock on hand than before", "หัก: สต็อกคงเหลือเพิ่มขึ้น") : L("Add: stock used from what you had", "บวก: ใช้สต็อกที่มีอยู่"), (F.dStock >= 0 ? "−" : "+") + baht(Math.abs(F.dStock || 0)));
  li(L("Cost of goods sold", "ต้นทุนขาย"), baht(F.cogs));
  b.appendChild(ul);
  var st = stockAt(u, F.to);
  b.appendChild(NIx(el("p", "tnote", st ? L("Stock on hand " + baht(st.v) + ", counted " + niceY(st.d) + ". Count it at each month end and I keep cost of sales exact.", "สต็อกคงเหลือ " + baht(st.v) + " นับเมื่อ " + dmy(st.d) + " นับทุกสิ้นเดือนแล้วหนูจะคำนวณต้นทุนขายได้แม่นยำ")
    : L("No stock count yet, so all stock bought counts as used. Add a count at month end for an exact figure.", "ยังไม่มีการนับสต็อก จึงนับสต็อกที่ซื้อทั้งหมดเป็นของที่ใช้ไป นับสต็อกสิ้นเดือนเพื่อให้ได้ตัวเลขที่แม่นยำ"))));
  b.appendChild(btn("pill soft wide", L("Count stock now", "นับสต็อกตอนนี้"), function(){ closeGS(); stockSheet({ end: today(), month: MONTH[day(today()).getMonth()] }); }));
  var d = { v: "" };
  if (0) b.appendChild(fld(L("Stock on hand today (฿)", "สต็อกคงเหลือวันนี้ (บาท)"), "", { mode: "decimal", ph: st ? money(st.v) : "0", on: function(x, inp){ inp.value = x.replace(/[^\d.]/g, ""); d.v = inp.value; } }));
  b.appendChild(foot(btn("pill soft", L("Close", "ปิด"), closeGS))); if (0) b.appendChild(foot(btn("pill soft", L("Close", "ปิด"), closeGS), btn("pill acc", L("Save the count", "บันทึกการนับ"), function(){ if (!(num(d.v) >= 0) || d.v === "") return; u.stock = (u.stock || []).filter(function(s){ return s.d !== today(); }).concat([{ d: today(), v: num(d.v) }]); save(); refresh(); closeGS(); toast(L("Stock count saved", "บันทึกการนับสต็อกแล้ว")); })));
}

/* balance sheet: what the company has, what it owes */
function bsCard(u, B){
  var old = $("#m-bs"); if (old) old.remove();
  var S = bsheet(u, B), c = NIx(el("section", "card bsB")); c.id = "m-bs";
  var h = el("div", "cardh"); h.appendChild(el("h2", "", L("Balance sheet", "งบแสดงฐานะการเงิน"))); h.appendChild(el("div", "sub", L("As of " + niceY(S.asOf), "ณ วันที่ " + dmy(S.asOf)))); c.appendChild(h);
  /* one bar: what you own, split into what you owe and what is yours */
  var bar = el("div", "bs-bar"), tot = Math.max(1, S.tA), a = el("i", "owe"), e = el("i", "eq");
  a.style.width = Math.min(100, S.tL / tot * 100) + "%"; e.style.width = Math.max(0, 100 - S.tL / tot * 100) + "%"; bar.appendChild(a); bar.appendChild(e); c.appendChild(bar);
  var lg = el("div", "bs-lg"); lg.innerHTML = '<span><i class="owe"></i>' + esc(L("Owed to others", "หนี้สิน")) + '</span><span><i class="eq"></i>' + esc(L("Yours (equity)", "ส่วนของเจ้าของ")) + "</span>"; c.appendChild(lg);
  function grp(title, rows, total){
    var g = el("div", "bs-g"), gh = el("div", "pl-h"); gh.appendChild(el("span", "", title)); gh.appendChild(el("b", "num", baht(total))); g.appendChild(gh);
    rows.forEach(function(r){ var d = el("div", "pl-r"); d.appendChild(el("span", "", L(r[0], BS_TH[r[0]] || r[0]))); d.appendChild(el("span", "num", baht(r[1]))); g.appendChild(d); });
    c.appendChild(g);
  }
  grp(L("What the company has", "สินทรัพย์"), S.assets, S.tA);
  grp(L("What it owes", "หนี้สิน"), S.liabs, S.tL);
  var t = el("div", "pl-t" + (S.eq < 0 ? " neg" : "")); t.appendChild(el("span", "", L("Owner's equity", "ส่วนของเจ้าของ"))); var tv = el("div", "pl-tv"); tv.appendChild(el("b", "num", (S.eq < 0 ? "−" : "") + baht(Math.abs(S.eq)))); tv.appendChild(el("small", "", L("Share capital plus profits kept", "ทุนจดทะเบียนรวมกำไรสะสม"))); t.appendChild(tv); c.appendChild(t);
  c.appendChild(el("p", "tnote", L("Equipment and loans appear once you add them. Your auditor confirms the year-end balance sheet.", "อุปกรณ์และเงินกู้จะแสดงเมื่อคุณเพิ่มเข้ามา ผู้สอบบัญชีจะยืนยันงบแสดงฐานะการเงินสิ้นปี")));
  var acts = el("div", "pl-acts"); acts.appendChild(btn("pill soft", L("Print or PDF", "พิมพ์หรือ PDF"), function(){ bsPrint(S); }, "i-receipt")); c.appendChild(acts);
  var pl = $("#b-money .plB"); if (pl && pl.parentNode) pl.parentNode.insertBefore(c, pl.nextSibling);
}
var BS_TH = { "Cash at bank": "เงินฝากธนาคาร", "Owed to you (receivables)": "ลูกหนี้การค้า", "Stock on hand": "สินค้าคงเหลือ", "Equipment": "อุปกรณ์", "You owe suppliers (payables)": "เจ้าหนี้การค้า", "VAT to pay": "ภาษีมูลค่าเพิ่มค้างจ่าย", "Withholding tax and SSO to pay": "ภาษีหัก ณ ที่จ่ายและประกันสังคมค้างจ่าย", "Company income tax so far (estimate)": "ภาษีเงินได้นิติบุคคลสะสมถึงวันนี้ (ประมาณการ)" };
function bsPrint(S){
  var u = me(), th = lang() === "th", rows = [];
  function r(k, en, tl, a, i){ rows.push({ k: k, t: th ? tl : en, a: a, i: i || 0 }); }
  r("h", "Assets", "สินทรัพย์"); S.assets.forEach(function(x){ r("r", x[0], BS_TH[x[0]] || x[0], x[1], 2); }); r("s", "Total assets", "รวมสินทรัพย์", S.tA);
  r("h", "Liabilities", "หนี้สิน"); S.liabs.forEach(function(x){ r("r", x[0], BS_TH[x[0]] || x[0], x[1], 2); }); r("s", "Total liabilities", "รวมหนี้สิน", S.tL);
  r("g", "Owner's equity", "ส่วนของผู้ถือหุ้น", S.eq);
  var M = { isModel: 1, th: th, rows: rows, co: coName(u), taxid: (u.company || {}).taxid || "", title: th ? "งบแสดงฐานะการเงิน" : "Statement of financial position", period: (th ? "ณ วันที่ " : "As of ") + niceY(S.asOf), unit: th ? "หน่วย: บาท" : "Amounts in Thai Baht",
    note: th ? "จัดทำโดย ThuraGirl เป็นงบภายในที่ยังไม่ผ่านการตรวจสอบ ส่วนของผู้ถือหุ้นคำนวณจากสินทรัพย์หักหนี้สิน" : "Prepared by ThuraGirl. Unaudited management accounts; owner's equity is assets less liabilities.", made: (th ? "จัดทำวันที่ " : "Prepared ") + niceY(today()), file: "BS-" + S.asOf };
  plPrint(M);
}

/* taxes: every filing, its status and what is paid */
var FORM_TH = { "PP.30": "ภ.พ.30", "PND.3 / PND.53": "ภ.ง.ด.3 / ภ.ง.ด.53", "PND.1": "ภ.ง.ด.1", "SPS 1-10": "สปส.1-10", "PND.50": "ภ.ง.ด.50", "PND.51": "ภ.ง.ด.51" };
function formTx(f){ return L(f.form, FORM_TH[f.form] || f.form); }
function perTx(f){ return f.k === "pnd50" ? L(f.month, String(+f.month + 543)) : monTx(f.month); }
var TAX_TH = { "VAT": "ภาษีมูลค่าเพิ่ม", "Withholding tax on rent and services": "ภาษีหัก ณ ที่จ่าย ค่าเช่าและค่าบริการ", "Salary tax withheld": "ภาษีเงินเดือนหัก ณ ที่จ่าย", "Social security, you and your staff": "ประกันสังคม ส่วนของคุณและพนักงาน", "Company income tax, full-year estimate": "ภาษีเงินได้นิติบุคคล ประมาณการทั้งปี" };
var ST_L = { estimated: ["Estimated", "ประมาณการ"], confirmed: ["Confirmed", "ยืนยันแล้ว"], filed: ["Filed", "ยื่นแล้ว"], paid: ["Paid", "จ่ายแล้ว"] };
function stChip(st){ return el("span", "txs " + st, L(ST_L[st][0], ST_L[st][1])); }
function taxCard(u, B){
  var c = $("#b-money .taxB"); if (!c) return; NIx(c); c.textContent = "";
  var T = taxFilings(u, B), open = T.list.filter(function(f){ return f.st !== "paid" && f.liab; }), due = open.reduce(function(s, f){ return s + f.amt; }, 0);
  var h = el("div", "cardh"); h.appendChild(el("h2", "", L("Taxes", "ภาษี"))); var tt = el("span", "tot num", baht(due)); h.appendChild(tt);
  h.appendChild(el("div", "sub", L("Still to pay, filings below", "ยอดที่ยังต้องจ่าย ตามแบบด้านล่าง"))); c.appendChild(h);
  var steps = el("div", "tx-steps"); ["estimated", "confirmed", "filed", "paid"].forEach(function(s, i){ steps.appendChild(stChip(s)); if (i < 3) steps.appendChild(el("i", "tx-ar")); }); c.appendChild(steps);
  var ul = el("ul", "txl"), paid = T.list.filter(function(f){ return f.st === "paid"; });
  function row(f){
    var li = el("li", "tap"); li.tabIndex = 0; li.setAttribute("role", "button");
    var tx = el("div"); tx.appendChild(el("b", "", formTx(f) + " · " + perTx(f)));
    tx.appendChild(el("small", "", L(f.name, TAX_TH[f.name] || f.name) + " · " + (f.st === "paid" ? L("paid " + nice(f.paidOn), "จ่ายแล้ว " + dmy(f.paidOn)) : L("due " + nice(f.due), "ครบกำหนด " + dmy(f.due)))));
    li.appendChild(tx); var r = el("div", "txr"); r.appendChild(el("span", "num", baht(f.amt))); r.appendChild(stChip(f.st)); li.appendChild(r);
    var openIt = function(){ taxSheet(u, f); };
    li.addEventListener("click", openIt); li.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); openIt(); } });
    return li;
  }
  T.list.filter(function(f){ return f.st !== "paid"; }).forEach(function(f){ ul.appendChild(row(f)); });
  c.appendChild(ul);
  /* what is already paid folds away, one tap to see it */
  if (paid.length){
    var dl = el("details", "txpaid"), sm = el("summary"), pt = paid.reduce(function(s, f){ return s + f.amt; }, 0);
    sm.appendChild(el("span", "", L("Paid", "จ่ายแล้ว") + " · " + paid.length + L(paid.length === 1 ? " filing" : " filings", " แบบ"))); sm.appendChild(el("b", "num", baht(pt))); dl.appendChild(sm);
    var pu = el("ul", "txl"); paid.forEach(function(f){ pu.appendChild(row(f)); }); dl.appendChild(pu); c.appendChild(dl);
  }
}
function taxSheet(u, f){
  var b = openGS(formTx(f), L(f.name, TAX_TH[f.name] || f.name), perTx(f) + " · " + baht(f.amt)); NIx(b);
  var tl = el("div", "tx-tl"), order = ["estimated", "confirmed", "filed", "paid"], at = order.indexOf(f.st);
  var DESC = { estimated: L("Worked out from the books so far. It moves until the month closes.", "คำนวณจากบัญชีถึงตอนนี้ ตัวเลขยังเปลี่ยนได้จนกว่าจะปิดเดือน"), confirmed: L("Month closed. The figure is final and ready for you to approve.", "ปิดเดือนแล้ว ตัวเลขสุดท้ายพร้อมให้คุณอนุมัติ"), filed: L("Sent to the Revenue Department.", "ยื่นต่อกรมสรรพากรแล้ว"), paid: L("The payment is in your bank statement.", "พบรายการจ่ายในรายการเดินบัญชีแล้ว") };
  order.forEach(function(s, i){ var r = el("div", "tx-st" + (i <= at ? " on" : "")); r.appendChild(el("i")); var t = el("div"); t.appendChild(el("b", "", L(ST_L[s][0], ST_L[s][1]))); t.appendChild(el("small", "", DESC[s])); r.appendChild(t); tl.appendChild(r); });
  b.appendChild(tl);
  var ul = el("ul", "shB-l");
  function li(a, v){ var x = el("li"); x.appendChild(el("span", "", a)); x.appendChild(el("b", "num", v)); ul.appendChild(x); }
  if (f.k === "vat"){ li(L("VAT on your sales (output)", "ภาษีขาย"), baht(f.out)); li(L("VAT on your purchases (input)", "ภาษีซื้อ"), "−" + baht(f.in)); }
  li(L("Amount", "ยอดเงิน"), baht(f.amt)); li(f.st === "paid" ? L("Paid on", "จ่ายเมื่อ") : L("Due", "ครบกำหนด"), f.st === "paid" ? niceY(f.paidOn) : niceY(f.due));
  b.appendChild(ul);
  if (f.k === "pnd50") b.appendChild(el("p", "tnote", L("An estimate from this year's profit so far, at SME rates (0% on the first ฿300,000, then 15% up to ฿3M, 20% above). Half-year PND.51 is due in August.", "ประมาณการจากกำไรปีนี้ถึงตอนนี้ ตามอัตรา SME (0% สำหรับ 300,000 บาทแรก 15% ถึง 3 ล้านบาท และ 20% ส่วนที่เกิน) แบบ ภ.ง.ด.51 ครึ่งปีครบกำหนดเดือนสิงหาคม")));
  b.appendChild(foot(btn("pill soft", L("Close", "ปิด"), closeGS)));
}

/* Home: the profit tile shows last month's figure instead of a multiple */
var _paintHomeTiles = null;
function profitTileFix(){
  var B = books(me()); if (!B) return; var F = B.fin.mtd, t = $(".mini.t3 .d"); if (!t || F.prevKept == null) return;
  /* the tile keeps a plain percentage; both numbers are in its label and on Finance */
  t.parentNode.title = L("Profit " + baht(F.rev - F.exp) + ", against " + baht(F.prevKept) + " on the same days last month", "กำไร " + baht(F.rev - F.exp) + " เทียบกับ " + baht(F.prevKept) + " ช่วงเดียวกันเดือนก่อน");
}

/* Pay: pick a bill ThuraGirl already knows, or add a new one */
function payPick(){
  var u = me(), open = (u.bills || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; });
  if (!open.length){ startPayFlow(); return; }
  var b = openGS(L("Pay", "จ่าย"), L("Which bill?", "จ่ายบิลไหน"), L("Bills I already have. Tap one to pay it, so nothing is typed twice.", "บิลที่หนูมีอยู่แล้ว แตะเพื่อจ่าย จะได้ไม่ต้องกรอกซ้ำ")); NIx(b);
  var list = el("div", "co-list");
  open.forEach(function(v){
    var late = v.due < today(), r = el("button", "co-row"); r.type = "button";
    var tx = el("span", "co-tx"); tx.appendChild(el("strong", "", L(v.to, T_(v.to)))); var sm = el("small", "", baht(v.amount) + " · "); var lt = el("span", late ? "bad" : "", L(lateTxt(v.due), T_(lateTxt(v.due)))); sm.appendChild(lt); sm.appendChild(document.createTextNode(" · " + kindName(billKind(v)))); tx.appendChild(sm); r.appendChild(tx);
    r.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>');
    r.addEventListener("click", function(){ openBill(v); }); list.appendChild(r);
  });
  b.appendChild(list);
  b.appendChild(foot(btn("pill soft", L("A new bill", "บิลใหม่"), function(){ closeGS(); startPayFlow(); }, "i-plus")));
}
function kindName(k){ return k === "stock" ? L("For resale (stock)", "ซื้อมาขาย (สต็อก)") : k === "asset" ? L("Equipment", "อุปกรณ์") : L("Business expense", "ค่าใช้จ่าย"); }
function serviceCo(u){ return /service|consult|agency|บริการ/i.test((u.company && u.company.type) || ""); }

/* a bill: what it is (stock, expense or equipment), and how it links to the bank */
var _openBill = openBill;
openBill = function(v){
  _openBill(v);
  var u = me(), b = $("#gs-b"); if (!b) return;
  var box = NIx(el("div", "bk-kind"));
  if (!serviceCo(u)){
    box.appendChild(el("b", "", L("What is it?", "บิลนี้คืออะไร")));
    var keys = ["stock", "expense", "asset"], labels = keys.map(kindName);
    var sg = seg(labels, kindName(billKind(v)), function(x){ v.kind = keys[labels.indexOf(x)]; save(); BK_CACHE.key = ""; refresh(); toast(L("Saved as ", "บันทึกเป็น ") + x); });
    $$("button", sg).forEach(function(x){ x.setAttribute("data-noi18n", ""); }); box.appendChild(sg);
    box.appendChild(el("small", "", billKind(v) === "stock" ? L("Goes to stock on hand, and into cost of goods sold as it is used.", "เข้าสต็อกคงเหลือ และเป็นต้นทุนขายเมื่อใช้ไป") : billKind(v) === "asset" ? L("Equipment is an asset. Your auditor spreads its cost over its life.", "อุปกรณ์เป็นสินทรัพย์ ผู้สอบบัญชีจะทยอยตัดค่าเสื่อมตามอายุการใช้งาน") : L("Counts as a cost in the month of the bill.", "นับเป็นค่าใช้จ่ายในเดือนของบิล")));
  }
  var lk = el("p", "st-p");
  lk.textContent = v.paid ? (v.tx ? L("Linked to the bank line on " + niceY(v.tx.split("|")[1]) + ". Counted once.", "จับคู่กับรายการธนาคารวันที่ " + dmy(v.tx.split("|")[1]) + " แล้ว นับครั้งเดียว") : L("When the payment shows up in your bank statement, I link it to this bill so it is counted once.", "เมื่อรายการจ่ายเงินขึ้นในรายการเดินบัญชี หนูจะจับคู่กับบิลนี้ให้ จึงนับครั้งเดียว"))
    : L("Mark it paid after you transfer. The bank line is matched to this bill later, not counted twice.", "กดว่าจ่ายแล้วหลังโอน ภายหลังรายการธนาคารจะถูกจับคู่กับบิลนี้ ไม่นับซ้ำ");
  box.appendChild(lk);
  b.insertBefore(box, b.firstChild);
};

/* Company settings: the auditor ThuraGirl assigned */
var DEMO_AUD = { name: "Kanya Srisuk", firm: "ThuraGirl Audit Partners", cpa: "CPA 10482", email: "audit@thuragirl.com", phone: "02 026 1188" };
function auditorCard(u, root){
  var a = u.auditor && u.auditor.name ? u.auditor : u.demo || u.sample ? DEMO_AUD : null, c = card(L("Your auditor", "ผู้สอบบัญชีของคุณ")); NIx(c);
  if (!a){ c.appendChild(el("p", "st-p", L("Being assigned. You'll see their name, licence number and contact here within two working days.", "กำลังจัดผู้สอบบัญชีให้ คุณจะเห็นชื่อ เลขใบอนุญาต และช่องทางติดต่อที่นี่ภายในสองวันทำการ"))); root.appendChild(c); return; }
  var g = el("div", "aud-id"); g.appendChild(el("b", "co-av", initials(a.name)));
  var t = el("div"); t.appendChild(el("strong", "", a.name)); t.appendChild(el("small", "", (a.firm || DEMO_AUD.firm) + " · " + L("licence ", "ใบอนุญาต ") + (a.cpa || "—"))); g.appendChild(t); c.appendChild(g);
  var ul = el("ul", "shB-l");
  [[L("Email", "อีเมล"), a.email || DEMO_AUD.email], [L("Phone", "โทรศัพท์"), a.phone || DEMO_AUD.phone]].forEach(function(x){ var li = el("li"); li.appendChild(el("span", "", x[0])); li.appendChild(el("b", "", x[1])); ul.appendChild(li); });
  c.appendChild(ul);
  c.appendChild(el("p", "tnote", L("ThuraGirl assigns a licensed auditor (CPA) to every company. They review your months and sign the year-end statements. To ask for a change, write in the chat.", "ThuraGirl จัดผู้สอบบัญชีรับอนุญาต (CPA) ให้ทุกบริษัท ผู้สอบบัญชีตรวจบัญชีรายเดือนและลงนามงบการเงินสิ้นปี หากต้องการเปลี่ยน พิมพ์บอกในแชทได้")));
  root.appendChild(c);
}
var _renderSettings = renderSettings;
renderSettings = function(){ _renderSettings(); if (setTab === "company"){ var root = $("#b-settings"), sw = $(".set-sw", root); auditorCard(me(), root); if (sw) root.appendChild(sw); } };

/* chat keeps the conversation: earlier questions and answers stay above the latest one */
var chatTurn = 0;
function chatLog(){ var u = me(); if (!u) return []; u.chatLog = u.chatLog || []; return u.chatLog; }
function chatKeep(){
  var pop = $("#b-pop"), r = $("#b-reply"), m = $("#b-me"); if (!pop || !r || pop.hidden || $(".dotsT", r)) return;
  var a = r.textContent.trim(), q = m.hidden ? "" : m.textContent.trim(); if (!a) return;
  var log = chatLog(), last = log[log.length - 1]; if (last && last.q === q && last.a === a) return;
  /* one entry per turn: a reply that is re-rendered (translated, finished typing) replaces its own entry */
  if (last && last.turn === chatTurn){ last.a = a; last.q = q; save(); return; }
  log.push({ q: q, a: a, at: Date.now(), turn: chatTurn }); if (log.length > 40) log.splice(0, log.length - 40); save();
}
function chatHist(){
  var pop = $("#b-pop"); if (!pop) return; var h = $("#b-hist");
  if (!h){ h = el("div", "hist"); h.id = "b-hist"; var me2 = $("#b-me"); pop.insertBefore(h, me2); }
  var log = chatLog(), cur = { q: $("#b-me").hidden ? "" : $("#b-me").textContent.trim(), a: $("#b-reply").textContent.trim() };
  h.textContent = "";
  log.forEach(function(x, i){ if (i === log.length - 1 && x.q === cur.q && x.a === cur.a) return; if (x.q) h.appendChild(el("div", "ch-q", x.q)); h.appendChild(el("div", "ch-a", x.a)); });
  h.hidden = !h.childNodes.length;
  if (!h.hidden) requestAnimationFrame(function(){ h.scrollTop = h.scrollHeight; });
}
["ask", "tgSays", "say"].forEach(function(n){
  var f = { ask: ask, tgSays: tgSays, say: say }[n];
  var w = function(){ chatKeep(); chatTurn = Date.now() + Math.random(); var r = f.apply(this, arguments); chatHist(); return r; };
  if (n === "ask") ask = w; else if (n === "tgSays") tgSays = w; else say = w;
});
/* the answer arrives a moment later; keep it once it lands */
(function(){ var r = $("#b-reply"); if (!r || !window.MutationObserver) return; new MutationObserver(function(){ if (!$(".dotsT", r)) chatKeep(); }).observe(r, { childList: true, characterData: true, subtree: true }); })();

/* month-end stock count: companies that sell goods count what is on the shelves at each month end */
function stockDue(u){
  if (!u.hasData || serviceCo(u)) return null;
  var t = today(), d = day(t), endThis = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)), endLast = iso(new Date(d.getFullYear(), d.getMonth(), 0));
  function has(end){ return (u.stock || []).some(function(s){ return s.d >= addDays(end, -3) && s.d <= addDays(end, 7); }); }
  if (diffDays(endThis, t) <= 3 && !has(endThis)) return { end: endThis, month: MONTH[day(endThis).getMonth()] };
  if (!has(endLast) && (u.stock || []).length) return { end: endLast, month: MONTH[day(endLast).getMonth()] };
  return null;
}
function stockSheet(SC){
  var u = me(), last = stockAt(u, today()), m = monTx(SC.month);
  var b = openGS(L("Stock count", "นับสต็อก"), L("Stock on hand, end of " + SC.month, "สต็อกคงเหลือ สิ้นเดือน" + m), L("Count what is on the shelves and in the storeroom, at cost before VAT.", "นับของบนชั้นและในห้องเก็บของ ตามราคาทุนก่อน VAT")); NIx(b);
  var d = { v: "" };
  b.appendChild(fld(L("Value at cost (฿)", "มูลค่าตามราคาทุน (บาท)"), "", { mode: "decimal", ph: last ? money(last.v) : "0", on: function(x, inp){ inp.value = x.replace(/[^\d.]/g, ""); d.v = inp.value; } }));
  if (last) b.appendChild(el("p", "tnote", L("Last count " + baht(last.v) + " on " + niceY(last.d) + ".", "นับครั้งล่าสุด " + baht(last.v) + " เมื่อ " + dmy(last.d))));
  b.appendChild(el("p", "tnote", L("Cost of goods sold = stock bought − the change in stock on hand. Without a count, everything bought counts as used.", "ต้นทุนขาย = สต็อกที่ซื้อ − ส่วนเปลี่ยนแปลงของสต็อกคงเหลือ ถ้าไม่นับ จะถือว่าของที่ซื้อทั้งหมดใช้ไปแล้ว")));
  b.appendChild(foot(btn("pill soft", L("Later", "ไว้ทีหลัง"), closeGS), btn("pill acc", L("Save the count", "บันทึกการนับ"), function(){
    if (d.v === "" || !(num(d.v) >= 0)) return;
    var when = SC.end < today() ? SC.end : today();
    u.stock = (u.stock || []).filter(function(s){ return s.d !== when; }).concat([{ d: when, v: num(d.v) }]); save(); BK_CACHE.key = ""; refresh(); closeGS(); toast(L("Stock count saved", "บันทึกการนับสต็อกแล้ว"));
  })));
}
/* the month close: the Review Pack asks for the month-end count when it is missing */
var _paintPack = paintPack;
paintPack = function(u){
  _paintPack(u);
  var old = $("#pk-stock"); if (old) old.remove();
  var B = books(u), p = B && B.pack; if (!p || serviceCo(u)) return;
  var has = (u.stock || []).some(function(s){ return s.d >= addDays(p.to, -3) && s.d <= addDays(p.to, 7); });
  var n = NIx(el("div", "bk-kind")); n.id = "pk-stock";
  n.appendChild(el("b", "", has ? L("Stock counted for " + p.name, "นับสต็อกเดือน" + monTx(p.name) + "แล้ว") : L("No stock count for " + p.name + " yet", "ยังไม่ได้นับสต็อกเดือน" + monTx(p.name))));
  n.appendChild(el("small", "", has ? L("Cost of goods sold uses your count of " + baht(stockAt(u, addDays(p.to, 7)).v) + ".", "ต้นทุนขายคำนวณจากสต็อกที่นับได้ " + baht(stockAt(u, addDays(p.to, 7)).v)) : L("Count it before you sign off, so cost of goods sold and profit are right.", "นับก่อนอนุมัติ เพื่อให้ต้นทุนขายและกำไรถูกต้อง")));
  if (!has) n.appendChild(btn("pill soft", L("Count stock", "นับสต็อก"), function(){ closeSheet(); stockSheet({ end: p.to, month: p.name }); }));
  var l = $("#b-sheet .shB-l"); if (l && l.parentNode) l.parentNode.insertBefore(n, l.nextSibling);
};
