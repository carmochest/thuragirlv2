/* ── profit and loss as a proper statement: print, PDF and share ──
   Layout follows the function-of-expense format used by TFRS for NPAEs (Thai DBD) and IFRS. */
function plModel(F){
  var u = me(), th = lang() === "th", c = u.company || {}, cats = F.cats || {};
  function g(k){ return cats[k] || 0; }
  function W(en, tl){ return th ? tl : en; }
  var otherInc = g("Interest") + g("Refunds") + g("Other income"), rev = Math.max(0, F.rev - otherInc);
  var cos = g("Cost of goods sold"), sell = g("Marketing"), fin = 0;
  var admin = Math.max(0, F.exp - cos - sell - fin);
  var adminLines = [["Wages", g("Wages")], ["Rent", g("Rent")], ["Utilities", g("Utilities")], ["Bank fees", g("Bank fees")], ["Other costs", g("Other costs")]].filter(function(x){ return x[1] > 0; });
  var gp = rev - cos, pbit = rev + otherInc - cos - sell - admin, pbt = pbit - fin, tax = pbt > 0 ? Math.max(0, F.tax[2] || 0) : 0, np = pbt - tax;
  var revLines = (F.revMix || []).filter(function(x){ return ["Interest", "Refunds", "Other income"].indexOf(x[0]) < 0; });
  var R = [];
  function row(kind, en, tl, amt, ind){ R.push({ k: kind, t: W(en, tl), a: amt, i: ind || 0 }); }
  function sub(name, amt){ R.push({ k: "r", t: th ? T(name) : name, a: amt, i: 2 }); }
  row("r", "Revenue from sales and services", "รายได้จากการขายหรือการให้บริการ", rev);
  revLines.forEach(function(x){ sub(x[0], x[1]); });
  row("r", "Cost of sales and services", "ต้นทุนขายหรือต้นทุนการให้บริการ", -cos);
  row("s", gp >= 0 ? "Gross profit" : "Gross loss", gp >= 0 ? "กำไรขั้นต้น" : "ขาดทุนขั้นต้น", gp);
  row("r", "Other income", "รายได้อื่น", otherInc);
  row("r", "Selling expenses", "ค่าใช้จ่ายในการขาย", -sell);
  row("r", "Administrative expenses", "ค่าใช้จ่ายในการบริหาร", -admin);
  adminLines.forEach(function(x){ sub(x[0], -x[1]); });
  row("s", pbit >= 0 ? "Operating profit" : "Operating loss", pbit >= 0 ? "กำไรจากการดำเนินงาน" : "ขาดทุนจากการดำเนินงาน", pbit);
  row("r", "Finance costs", "ต้นทุนทางการเงิน", -fin);
  row("s", pbt >= 0 ? "Profit before income tax" : "Loss before income tax", pbt >= 0 ? "กำไรก่อนภาษีเงินได้" : "ขาดทุนก่อนภาษีเงินได้", pbt);
  row("r", "Income tax expense (estimate)", "ภาษีเงินได้ (ประมาณการ)", -tax);
  row("g", np >= 0 ? "Net profit for the period" : "Net loss for the period", np >= 0 ? "กำไรสุทธิสำหรับงวด" : "ขาดทุนสุทธิสำหรับงวด", np);
  function dt(s){ var d = day(s); return th ? d.getDate() + " " + mth(MONTH[d.getMonth()]) + " " + (d.getFullYear() + 543) : d.getDate() + " " + MONTH[d.getMonth()] + " " + d.getFullYear(); }
  return {
    th: th, rows: R, np: np, margin: rev + otherInc ? np / (rev + otherInc) * 100 : 0,
    co: coName(u), taxid: c.taxid || "", addr: c.addr || "",
    title: W("Statement of profit or loss", "งบกำไรขาดทุน"),
    period: W("For the period " + dt(F.from) + " to " + dt(F.to), "สำหรับงวดตั้งแต่วันที่ " + dt(F.from) + " ถึงวันที่ " + dt(F.to)),
    unit: W("Amounts in Thai Baht", "หน่วย: บาท"),
    note: W("Prepared by ThuraGirl on an accrual basis from bank statements, invoices, bills and stock counts. Income tax is an estimate. Unaudited management accounts; your accountant finalises the annual financial statements under TFRS for NPAEs.",
      "จัดทำโดย ThuraGirl ตามเกณฑ์คงค้าง จากรายการเดินบัญชี ใบแจ้งหนี้ บิล และการนับสต็อก ภาษีเงินได้เป็นตัวเลขประมาณการ เป็นงบภายในที่ยังไม่ผ่านการตรวจสอบ ผู้สอบบัญชีจะจัดทำงบการเงินประจำปีตามมาตรฐาน TFRS for NPAEs"),
    made: W("Prepared " + dt(today()), "จัดทำวันที่ " + dt(today())),
    file: "PL-" + (coName(u) || "company").replace(/[^\w฀-๿]+/g, "-").replace(/^-|-$/g, "") + "-" + F.from + "-to-" + F.to
  };
}
function plAmt(a){ if (!a) return "–"; var s = Math.abs(a).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return a < 0 ? "(" + s + ")" : s; }

/* the printable page, with selectable text */
function plPrint(F){
  var M = F && F.isModel ? F : plModel(F), w = window.open("", "_blank");
  var rows = M.rows.map(function(r){ return '<tr class="' + r.k + " i" + r.i + '"><td>' + esc(r.t) + '</td><td class="r">' + (r.k === "h" ? "" : plAmt(r.a)) + "</td></tr>"; }).join("");
  var h = '<!doctype html><html lang="' + (M.th ? "th" : "en") + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(M.file) + "</title>" +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Noto+Sans+Thai:wght@400;600;700&display=swap">' +
    "<style>@page{size:A4;margin:18mm 16mm}body{font:14px/1.5 Manrope,'Noto Sans Thai',system-ui,sans-serif;color:#0F1514;margin:0;background:#F4F5F5}" +
    "main{max-width:760px;margin:20px auto;background:#fff;border-radius:16px;padding:44px 48px}.hd{text-align:center;margin-bottom:26px}.hd b{display:block;font-size:17px}.hd h1{font-size:22px;margin:6px 0 2px;letter-spacing:-.01em}" +
    ".mute{color:#5A6462;font-size:12.5px}table{width:100%;border-collapse:collapse}td{padding:6px 4px;vertical-align:bottom}td.r{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;width:150px}" +
    "tr.h td{font-weight:800;padding-top:16px}tr.i2 td{color:#5A6462;font-size:13px;padding-top:2px;padding-bottom:2px}tr.i2 td:first-child{padding-left:18px}tr.s td{padding-top:10px}" +
    "tr.s td,tr.m td{font-weight:700}tr.s td.r{border-top:1px solid #0F1514}tr.g td{font-weight:800;font-size:15px;padding-top:12px}tr.g td.r{border-top:1px solid #0F1514;border-bottom:3px double #0F1514}" +
    ".unit{text-align:right;margin-bottom:6px}.note{margin-top:30px;border-top:1px solid #E2E6E5;padding-top:12px}.bar{display:flex;gap:10px;justify-content:flex-end;max-width:760px;margin:20px auto 0}" +
    "button{border:0;border-radius:99px;padding:11px 18px;font:700 14px Manrope,system-ui;background:#0FBFB6;color:#0F1514;cursor:pointer}@media print{body{background:#fff}main{margin:0;padding:0;border-radius:0}.bar{display:none}}</style></head><body>" +
    '<div class="bar"><button onclick="print()">' + (M.th ? "พิมพ์หรือบันทึกเป็น PDF" : "Print or save as PDF") + "</button></div><main>" +
    '<div class="hd"><b>' + esc(M.co) + "</b>" + (M.taxid ? '<div class="mute">' + (M.th ? "เลขประจำตัวผู้เสียภาษี " : "Tax ID ") + esc(M.taxid) + "</div>" : "") + "<h1>" + esc(M.title) + '</h1><div class="mute">' + esc(M.period) + "</div></div>" +
    '<div class="unit mute">' + esc(M.unit) + "</div><table>" + rows + '</table><p class="note mute">' + esc(M.note) + "<br>" + esc(M.made) + "</p></main></body></html>";
  if (w){ w.document.open(); w.document.write(h); w.document.close(); setTimeout(function(){ try { w.focus(); w.print(); } catch (e) {} }, 900); }
  else { var url = URL.createObjectURL(new Blob([h], { type: "text/html" })), a = document.createElement("a"); a.href = url; a.download = M.file + ".html"; document.body.appendChild(a); a.click(); a.remove(); }
}

/* an A4 PDF built in the browser: the statement drawn at print resolution, so Thai renders exactly */
function plCanvas(M){
  var S = 2, Wd = 595.28 * S, Ht = 841.89 * S, cv = document.createElement("canvas"); cv.width = Math.round(Wd * 1.25); cv.height = Math.round(Ht * 1.25);
  var x = cv.getContext("2d"), k = cv.width / 595.28, FONT = "Manrope, 'Noto Sans Thai', system-ui, sans-serif";
  x.fillStyle = "#fff"; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = "#0F1514"; x.textBaseline = "alphabetic";
  function f(w, s){ x.font = w + " " + (s * k) + "px " + FONT; }
  function txt(t, X, Y, al){ x.textAlign = al || "left"; x.fillText(t, X * k, Y * k); }
  function line(X1, X2, Y, w){ x.fillRect(X1 * k, Y * k, (X2 - X1) * k, (w || .7) * k); }
  var L = 56, Rt = 539, y = 70;
  f("800", 13); txt(M.co, 297.6, y, "center"); y += 15;
  if (M.taxid){ f("500", 8.5); x.fillStyle = "#5A6462"; txt((M.th ? "เลขประจำตัวผู้เสียภาษี " : "Tax ID ") + M.taxid, 297.6, y, "center"); x.fillStyle = "#0F1514"; y += 13; }
  f("800", 16); txt(M.title, 297.6, y + 8, "center"); y += 24;
  f("500", 9); x.fillStyle = "#5A6462"; txt(M.period, 297.6, y, "center"); y += 30;
  f("500", 8); txt(M.unit, Rt, y, "right"); x.fillStyle = "#0F1514"; y += 8;
  M.rows.forEach(function(r){
    var ind = [0, 0, 14][r.i], sz = r.i === 2 ? 8.5 : 9.5;
    y += r.i === 2 ? 13 : r.k === "g" ? 24 : r.k === "s" ? 20 : 17;
    if (r.k === "s" || r.k === "g") line(Rt - 110, Rt, y - 11.5);
    f(r.k === "r" ? (r.i === 2 ? "500" : "600") : "800", r.k === "g" ? 10.5 : sz); if (r.k === "s") y += 0;
    x.fillStyle = r.i === 2 ? "#5A6462" : "#0F1514";
    txt(r.t, L + ind, y); if (r.k !== "h") txt(plAmt(r.a), Rt, y, "right");
    x.fillStyle = "#0F1514";
    if (r.k === "g"){ line(Rt - 110, Rt, y + 4); line(Rt - 110, Rt, y + 6.2); }
  });
  y = Math.max(y + 40, 700); line(L, Rt, y, .5); y += 16;
  f("500", 7.8); x.fillStyle = "#5A6462";
  var words = M.note.split(M.th ? /(?<=\s)/ : / /), ln = "";
  words.forEach(function(wd){ var t = ln + (M.th ? wd : (ln ? " " : "") + wd); if (x.measureText(t).width > (Rt - L) * k && ln){ txt(ln.trim(), L, y); y += 11; ln = M.th ? wd : wd; } else ln = t; });
  if (ln) { txt(ln.trim(), L, y); y += 11; }
  txt(M.made, L, y + 3);
  return cv;
}
function plPdfBlob(M){
  return (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
    var cv = plCanvas(M), b64 = cv.toDataURL("image/jpeg", 0.9).split(",")[1], bin = atob(b64), img = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) img[i] = bin.charCodeAt(i);
    var enc = new TextEncoder(), parts = [], len = 0, offs = [];
    function put(p){ var b = typeof p === "string" ? enc.encode(p) : p; parts.push(b); len += b.length; }
    function obj(n, body){ offs[n] = len; put(n + " 0 obj\n"); body(); put("\nendobj\n"); }
    function ascii(s){ return String(s).replace(/[^\x20-\x7E]/g, "").replace(/([()\\])/g, "\\$1"); }
    put("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    obj(1, function(){ put("<< /Type /Catalog /Pages 2 0 R >>"); });
    obj(2, function(){ put("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"); });
    obj(3, function(){ put("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"); });
    obj(4, function(){ put("<< /Type /XObject /Subtype /Image /Width " + cv.width + " /Height " + cv.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + img.length + " >>\nstream\n"); put(img); put("\nendstream"); });
    var cs = "q 595.28 0 0 841.89 0 0 cm /Im0 Do Q";
    obj(5, function(){ put("<< /Length " + cs.length + " >>\nstream\n" + cs + "\nendstream"); });
    obj(6, function(){ put("<< /Title (" + ascii(M.file) + ") /Producer (ThuraGirl) /Creator (ThuraGirl) >>"); });
    var xref = len; put("xref\n0 7\n0000000000 65535 f \n");
    for (var n = 1; n <= 6; n++) put(("0000000000" + offs[n]).slice(-10) + " 00000 n \n");
    put("trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    return new Blob(parts, { type: "application/pdf" });
  });
}
function plDownload(F){
  var M = F && F.isModel ? F : plModel(F);
  plPdfBlob(M).then(function(b){ var url = URL.createObjectURL(b), a = document.createElement("a"); a.href = url; a.download = M.file + ".pdf"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 60000); toast("Saved " + M.file + ".pdf"); });
}
function plShare(F){
  var M = F && F.isModel ? F : plModel(F);
  plPdfBlob(M).then(function(b){
    var file = null; try { file = new File([b], M.file + ".pdf", { type: "application/pdf" }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: M.title, text: M.co + " · " + M.period }).catch(function(){});
    else { plDownload(F); toast("Sharing isn't available here, so I saved the PDF instead"); }
  });
}
function plActions(root, F){
  var a = el("div", "pl-acts");
  a.appendChild(btn("pill soft", "PDF", function(){ plDownload(F); }, "i-doc"));
  a.appendChild(btn("pill soft", "Share", function(){ plShare(F); }, "i-up"));
  a.appendChild(btn("pill soft", "Print", function(){ plPrint(F); }, "i-receipt"));
  root.appendChild(a);
  root.appendChild(el("p", "tnote", "A statement in the standard TFRS for NPAEs layout: revenue, cost of sales, gross profit, expenses, tax and net profit."));
}
