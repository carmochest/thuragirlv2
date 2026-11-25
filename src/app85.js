
/* ── several companies under one sign-in ── */
var COFIELDS = ["onboarded", "path", "company", "four", "setup", "banks", "tx", "txv", "hasData", "stmt", "done", "briefSeen", "reg", "invoices", "bills", "rcpt", "requests", "team", "records", "docs", "matched", "sample", "ctab", "welcome", "filesTab", "invites"];
function coSnap(u){ var o = {}; COFIELDS.forEach(function(k){ if (u[k] !== undefined) o[k] = u[k]; }); return o; }
function coEnsure(u){ if (!u.cos) u.cos = {}; if (!u.cur) u.cur = "c" + (u.created || Date.now()).toString(36); }
function coLoad(u, snap){ COFIELDS.forEach(function(k){ delete u[k]; }); Object.keys(snap).forEach(function(k){ u[k] = snap[k]; }); }
function coSub(s){
  if (!s.onboarded) return L("Not set up yet", "ยังตั้งค่าไม่เสร็จ");
  if (s.path === "new") return s.reg && s.reg.submitted ? L("Registering with DBD", "กำลังจดทะเบียนกับ DBD") : L("Not registered yet", "ยังไม่ได้จดทะเบียน");
  return (s.company && s.company.type ? T(s.company.type) : L("Company", "บริษัท")) + (s.company && s.company.taxid ? " · " + s.company.taxid : "");
}
function coLabel(s){ try { return coName(s); } catch (e) { return L("New company", "บริษัทใหม่"); } }
function switchCo(id, quiet){
  var u = me(); coEnsure(u); var tgt = u.cos[id]; if (!tgt || id === u.cur) return;
  if (u.onboarded) u.cos[u.cur] = coSnap(u);
  coLoad(u, tgt); delete u.cos[id]; u.cur = id; delete u.prevCo; save();
  BK_CACHE.key = ""; lastKey = ""; closeGS();
  if (!u.onboarded){ location.href = "../signup/"; return; }
  if (PAGE === "signup"){ location.replace("../dashboard/"); return; }
  go(""); if (!quiet) toast(L("Switched to ", "เปลี่ยนเป็น ") + coLabel(u));
}
function addCo(){
  var u = me(); coEnsure(u);
  var prev = u.cur; u.cos[prev] = coSnap(u);
  coLoad(u, { onboarded: false, path: "", company: { taxid: "", name: "", addr: "", type: "" }, four: {}, setup: { vat: "", sso: "", conn: {}, verify: null }, banks: [], hasData: false, stmt: null, done: {}, welcome: false, briefSeen: false, reg: blankReg() });
  u.cur = "c" + Date.now().toString(36); u.prevCo = prev; save();
  location.href = "../signup/";
}
function cancelAddCo(){
  var u = me(); if (!u || !u.prevCo || !u.cos || !u.cos[u.prevCo]) return;
  var id = u.prevCo; coLoad(u, u.cos[id]); delete u.cos[id]; u.cur = id; delete u.prevCo; save();
  location.replace("../dashboard/");
}
function openCoMenu(){
  var u = me(); coEnsure(u);
  var b = openGS(L("Company", "บริษัท"), L("Your companies", "บริษัทของคุณ"), "");
  var list = el("div", "co-list");
  var rows = [{ id: u.cur, s: u, cur: true }].concat(Object.keys(u.cos).map(function(id){ return { id: id, s: u.cos[id] }; }));
  rows.forEach(function(r){
    var n = coLabel(r.s), row = el("button", "co-row" + (r.cur ? " cur" : "")); row.type = "button";
    row.appendChild(el("b", "co-av", initials(n)));
    var tx = el("span", "co-tx"); tx.appendChild(el("strong", "", n)); tx.appendChild(el("small", "", coSub(r.s))); row.appendChild(tx);
    if (r.cur){ row.setAttribute("aria-current", "true"); var ck = el("span", "co-ck"); ck.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; row.appendChild(ck); }
    else row.addEventListener("click", function(){ switchCo(r.id); });
    list.appendChild(row);
  });
  var add = el("button", "co-row co-add"); add.type = "button"; add.innerHTML = '<b class="co-av"><svg class="i"><use href="#i-plus"/></svg></b>';
  var at = el("span", "co-tx"); at.appendChild(el("strong", "", L("Add a company", "เพิ่มบริษัท"))); at.appendChild(el("small", "", L("Registered already, or one I register for you", "จดทะเบียนแล้ว หรือให้หนูจดให้"))); add.appendChild(at);
  add.addEventListener("click", addCo); list.appendChild(add);
  b.appendChild(list);
  b.appendChild(el("p", "tnote", L("Each company keeps its own books, bank statements, team and tasks. Same sign-in, same plan price per company.", "แต่ละบริษัทแยกบัญชี รายการเดินบัญชี ทีม และงานของตัวเอง ใช้บัญชีเข้าสู่ระบบเดียวกัน ราคาแพ็กเกจต่อบริษัทเท่าเดิม")));
  var prefs = el("div", "co-prefs");
  prefs.appendChild(prefRow(L("Language", "ภาษา"), langSeg()));
  prefs.appendChild(prefRow(L("Theme", "ธีม"), themeSeg()));
  b.appendChild(prefs);
  var ft = el("div", "shB-f one"); ft.appendChild(btn("pill soft", L("All settings", "ตั้งค่าทั้งหมด"), function(){ closeGS(); go("settings"); }, "i-set")); b.appendChild(ft);
}
function prefRow(label, ctl){ var r = el("div", "frow"); r.appendChild(el("b", "", label)); r.appendChild(ctl); return r; }
function themeSeg(){
  var u = me(), labels = { auto: L("Auto", "อัตโนมัติ"), day: L("Day", "กลางวัน"), night: L("Night", "กลางคืน") }, keys = ["auto", "day", "night"];
  var cur = (u && u.theme) || db.theme || "auto";
  var w = seg(keys.map(function(k){ return labels[k]; }), labels[cur], function(v){ var k = keys[keys.map(function(x){ return labels[x]; }).indexOf(v)]; if (u) u.theme = k; db.theme = k; save(); applyTheme(); });
  $$("button", w).forEach(function(x){ x.setAttribute("data-noi18n", ""); }); return w;
}
function langSeg(){
  var w = seg(["English", "ไทย"], lang() === "th" ? "ไทย" : "English", function(v){ setLang(v === "ไทย" ? "th" : "en"); });
  w.setAttribute("data-noi18n", ""); $$("button", w).forEach(function(x){ x.setAttribute("data-noi18n", ""); x.setAttribute("lang", x.textContent === "ไทย" ? "th" : "en"); }); return w;
}
(function(){ var oc = $("#b-co"); if (!oc) return; var nc = oc.cloneNode(true); oc.parentNode.replaceChild(nc, oc); nc.addEventListener("click", openCoMenu); nc.setAttribute("aria-haspopup", "dialog"); })();

/* theme also works before sign-in */
applyTheme = (function(orig){ return function(){
  var u = me(); if (!u && db.theme){ var dark = false; try { dark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) {} var night = db.theme === "night" || (db.theme === "auto" && dark); $("#mock").setAttribute("data-mode", night ? "night" : "day"); document.documentElement.classList.toggle("night", night); return; }
  orig();
}; })(applyTheme);

/* sign-up screens: language and theme in the top bar, and a way back when adding a company */
renderAuth = (function(orig){ return function(){
  orig();
  var top = $("#su .su-top"); if (top && !$(".su-lang", top)){ var w = langSeg(); w.classList.add("su-lang"); top.appendChild(w); }
  var u = me();
  if (u && u.prevCo && u.cos && u.cos[u.prevCo] && authMode !== "login"){
    var bk = el("button", "alt su-cancel", L("Back to ", "กลับไปที่ ") + coLabel(u.cos[u.prevCo])); bk.type = "button"; bk.addEventListener("click", cancelAddCo);
    var body = $("#su .su-body"); if (body) body.appendChild(bk);
  }
}; })(renderAuth);

/* ── language ── */
function lang(){ var u = me(); return (u && u.lang) || db.lang || "en"; }
function L(en, th){ return lang() === "th" ? th : en; }
function setLang(l){
  var u = me(); if (u) u.lang = l; db.lang = l; save();
  document.documentElement.lang = l;
  i18nAll();
  if (u && u.onboarded && PAGE !== "signup"){ refresh(); if ($("#gs") && !$("#gs").hidden && $(".co-list")) openCoMenu(); }
  else if (PAGE === "signup") renderAuth();
}

var MF = { January: "มกราคม", February: "กุมภาพันธ์", March: "มีนาคม", April: "เมษายน", May: "พฤษภาคม", June: "มิถุนายน", July: "กรกฎาคม", August: "สิงหาคม", September: "กันยายน", October: "ตุลาคม", November: "พฤศจิกายน", December: "ธันวาคม" };
var MS = { Jan: "ม.ค.", Feb: "ก.พ.", Mar: "มี.ค.", Apr: "เม.ย.", May: "พ.ค.", Jun: "มิ.ย.", Jul: "ก.ค.", Aug: "ส.ค.", Sep: "ก.ย.", Oct: "ต.ค.", Nov: "พ.ย.", Dec: "ธ.ค." };
var WD = { Monday: "วันจันทร์", Tuesday: "วันอังคาร", Wednesday: "วันพุธ", Thursday: "วันพฤหัสบดี", Friday: "วันศุกร์", Saturday: "วันเสาร์", Sunday: "วันอาทิตย์" };
var MO = "(January|February|March|April|May|June|July|August|September|October|November|December)";
var CATL = { "stock and supplies": "สินค้าและวัตถุดิบ", "rent": "ค่าเช่า", "other costs": "ค่าใช้จ่ายอื่น", "tax and social security": "ภาษีและประกันสังคม", "utilities": "ค่าน้ำค่าไฟ", "marketing": "การตลาด", "wages": "ค่าจ้าง", "payroll": "เงินเดือน" };
function mth(m){ return MF[m] || m; }
function dates(s){
  return s.replace(/\b(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})\b/g, function(x, d, m, y){ return d + " " + MS[m] + " " + (+y + 543); })
    .replace(new RegExp("\\b(\\d{1,2}) " + MO + "(?: (\\d{4}))?\\b", "g"), function(x, d, m, y){ return d + " " + MF[m] + (y ? " " + (+y + 543) : ""); })
    .replace(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/g, function(x){ return WD[x]; });
}
// fragments inside longer sentences
function inl(s){
  s = dates(s)
    .replace(/(\d+) days? late/g, "เลยกำหนด $1 วัน").replace(/\b[Dd]ue in (\d+) days?/g, "ครบกำหนดใน $1 วัน").replace(/\b[Dd]ue today\b/g, "ครบกำหนดวันนี้")
    .replace(/\binvoice (#\S+) from ([^(;]+?) \(/g, "ใบแจ้งหนี้ $1 จาก $2 (").replace(/\byour ([^(;]+?) bill \(/g, "บิล $1 ของคุณ (")
    .replace(/\bstock and supplies|\bother costs|\btax and social security|\brent\b|\butilities\b|\bmarketing\b|\bwages\b/g, function(x){ return CATL[x] || x; });
  Object.keys(TH).forEach(function(k){ if (k.length > 3 && /\(/.test(k) && s.indexOf(k) >= 0) s = s.split(k).join(TH[k]); });
  return s;
}
var UPD = function(d){ return d === "Up" || d === "up" ? "เพิ่มขึ้น" : "ลดลง"; };
var RULES = [
  [/^(\d[\d,]*) of (\d[\d,]*)$/, "$1 จาก $2"],
  [/^(\d+) of (\d+) digits$/, "$1 จาก $2 หลัก"],
  [/^(\d+) of (\d+) parts done$/, "เสร็จแล้ว $1 จาก $2 ส่วน"],
  [/^(\d+) of (\d+) parts still need you\.?$/, "ยังเหลืออีก $1 จาก $2 ส่วน"],
  [/^(\d+) of (\d+) added\.$/, "เพิ่มแล้ว $1 จาก $2"],
  [/^(\d+) invoices?$/, "ใบแจ้งหนี้ $1 ใบ"], [/^(\d+) bills?$/, "บิล $1 ใบ"], [/^(\d+) receipts?$/, "ใบเสร็จ $1 ใบ"], [/^(\d+) people$/, "$1 คน"], [/^(\d+) (?:person|people)$/, "$1 คน"],
  [/^(฿[\d,.]+) open$/, "ค้างรับ $1"], [/^(\d+) min read$/, "อ่าน $1 นาที"], [/^(\d+) overdue$/, "เลยกำหนด $1 รายการ"], [/^([\d,.]+) baht$/, "$1 บาท"],
  [/^(\d+) days? late\.?$/, "เลยกำหนด $1 วัน"], [/^Overdue (\d+) days?$/, "เลยกำหนด $1 วัน"], [/^(\d+) days?$/, "$1 วัน"], [/^Due in (\d+) days?$/, "ครบกำหนดใน $1 วัน"],
  [/^([\d,]+) shares?$/, "$1 หุ้น"], [/^([\d,]+) shares of (฿[\d,]+)$/, "$1 หุ้น หุ้นละ $2"], [/^That makes ([\d,]+) shares\.$/, "รวมเป็น $1 หุ้น"],
  [/^(-?[\d.]+)% margin$/, "อัตรากำไร $1%"], [/^(-?[\d.]+)% vs last month$/, "$1% เทียบเดือนก่อน"], [/^(-?[\d.]+)% this month$/, "$1% เดือนนี้"],
  [/^(\d+) quick things? (?:are|is) left, whenever you are ready\.$/, "เหลืออีก $1 เรื่องสั้น ๆ พร้อมเมื่อไหร่ก็ทำได้"],
  [/^(\d+) quick things? (?:are )?left$/, "เหลืออีก $1 เรื่องสั้น ๆ"], [/^(\d+) to go$/, "เหลืออีก $1"], [/^(\d+) more scheduled this week$/, "สัปดาห์นี้มีอีก $1 รายการ"],
  [/^(\d+) more things? coming up this month$/, "เดือนนี้มีอีก $1 เรื่องที่ใกล้ถึง"], [/^(\d+) on file$/, "มีแล้ว $1"], [/^(\d+) open$/, "ค้างอยู่ $1"],
  [/^paid on (.+)$/, function(m){ return "จ่ายวันที่ " + dates(m[1]); }],
  [/^(฿[\d,]+) a month before SSO and tax\.$/, "$1 ต่อเดือน ก่อนหักประกันสังคมและภาษี"], [/^(฿[\d,]+) a month$/, "$1 ต่อเดือน"], [/^(฿[\d,]+) a month, VAT included$/, "$1 ต่อเดือน รวม VAT"],
  [/^(Up|Down) ([\d.]+)% (?:on|vs) last month$/, function(m){ return UPD(m[1]) + " " + m[2] + "% จากเดือนก่อน"; }],
  [/^(Up|Down) ([\d.]+)% (?:on|vs) last quarter$/, function(m){ return UPD(m[1]) + " " + m[2] + "% จากไตรมาสก่อน"; }],
  [/^(Up|Down) ([\d.]+)% (?:on|vs) last year$/, function(m){ return UPD(m[1]) + " " + m[2] + "% จากปีก่อน"; }],
  [/^(Up|Down) ([\d.]+)% since (.+)$/, function(m){ return UPD(m[1]) + " " + m[2] + "% ตั้งแต่ " + dates(m[3]); }],
  [/^(Up|Down) ([\d.]+)% this (month|quarter|year)$/, function(m){ return UPD(m[1]) + " " + m[2] + "% " + { month: "เดือนนี้", quarter: "ไตรมาสนี้", year: "ปีนี้" }[m[3]]; }],
  [/^Cash is (up|down) ([\d.]+)%\.$/, function(m){ return "เงินสด" + UPD(m[1]) + " " + m[2] + "%"; }],
  [/^(Revenue|Expenses|Profit|Money in|Money out), ([\d,.-]+) baht\. Open (?:Money|Finance)$/, function(m){ return T(m[1]) + " " + m[2] + " บาท เปิดหน้าการเงิน"; }],
  [/^([^.]+): in (฿[\d,]+), out (฿[\d,]+), kept (-?฿[\d,-]+)$/, function(m){ return T(m[1]) + ": เข้า " + m[2] + " ออก " + m[3] + " เหลือ " + m[4]; }],
  [/^Wk (\d+)$/, "สัปดาห์ $1"],
  [/^(Invoices|Bills|Bank statements|Receipts|Statements|Files) (\d+)$/, function(m){ return T(m[1]) + " " + m[2]; }],
  [/^Good (morning|afternoon|evening), (.+?)\. You have$/, function(m){ return "สวัสดีตอน" + { morning: "เช้า", afternoon: "บ่าย", evening: "เย็น" }[m[1]] + " คุณ " + m[2] + " คุณมี"; }],
  [/^Good (morning|afternoon|evening), (.+?)\.?$/, function(m){ return "สวัสดีตอน" + { morning: "เช้า", afternoon: "บ่าย", evening: "เย็น" }[m[1]] + " คุณ " + m[2]; }],
  [/^Do you already have a company, (.+)\?$/, "คุณ $1 มีบริษัทอยู่แล้วหรือยัง"], [/^You're in, ([^.]+)\.$/, "เข้ามาแล้ว คุณ $1"], [/^Welcome, ([^.]+)\.$/, "ยินดีต้อนรับ คุณ $1"],
  [/^Welcome back, (.+)\.$/, "ยินดีต้อนรับกลับมา คุณ $1"], [/^Connect your apps, (.+)$/, "คุณ $1 มาเชื่อมต่อแอปกัน"], [/^([^.]+) \(you\)$/, "$1 (คุณ)"],
  [/^Invoice (#?\S+) for (฿[\d,.]+) is (\d+) days late\. I have a polite reminder ready to go\.$/, "ใบแจ้งหนี้ $1 ยอด $2 เลยกำหนดมา $3 วันแล้ว หนูเตรียมข้อความทวงแบบสุภาพไว้ให้แล้ว"],
  [/^Invoice (#?\S+) for$/, "ใบแจ้งหนี้ $1 ยอด"], [/^is (\d+) days late\. I have a polite reminder ready to go\.$/, "เลยกำหนดมา $1 วันแล้ว หนูเตรียมข้อความทวงแบบสุภาพไว้ให้แล้ว"],
  [/^Invoice (#?\S+) is unpaid$/, "ใบแจ้งหนี้ $1 ยังไม่ได้รับชำระ"], [/^Invoice (#?INV-\S+)$/, "ใบแจ้งหนี้ $1"], [/^([^.]+) has not paid you$/, "$1 ยังไม่จ่ายเงิน"],
  [/^Invoice to (.+)$/, "ใบแจ้งหนี้ถึง $1"],
  [/^Pay (฿[\d,]+) to (\d+) people on ([^.]+)\.$/, function(m){ return "จ่าย " + m[1] + " ให้ " + m[2] + " คน วันที่ " + dates(m[3]); }],
  [/^Here it is: (.+?), (.+), (฿[\d,.]+)( with VAT)?, due (.+)\. Shall I create it\?$/, function(m){ return "สรุปนะ: " + m[1] + ", " + m[2] + ", " + m[3] + (m[4] ? " รวม VAT" : "") + " ครบกำหนด " + dates(m[5]) + " ให้หนูสร้างเลยไหม"; }],
  [/^Pay (.+?) (฿[\d,.]+), due (.+?)(, by PromptPay)?\. Save it\?$/, function(m){ return "จ่าย " + m[1] + " " + m[2] + " ครบกำหนด " + dates(m[3]) + (m[4] ? " ผ่านพร้อมเพย์" : "") + " บันทึกเลยไหม"; }],
  [/^Pay ([^.]+)$/, function(m){ return "จ่าย " + T(m[1]); }],
  [new RegExp("^Your " + MO + " books are ready to sign off$"), function(m){ return "บัญชีเดือน" + mth(m[1]) + " พร้อมให้คุณรับรองแล้ว"; }],
  [new RegExp("^Your " + MO + " taxes are ready$"), function(m){ return "ภาษีเดือน" + mth(m[1]) + " พร้อมแล้ว"; }],
  [new RegExp("^" + MO + " Review Pack$"), function(m){ return "สรุปประจำเดือน" + mth(m[1]); }],
  [new RegExp("^" + MO + " tax package$"), function(m){ return "ชุดภาษีเดือน" + mth(m[1]); }],
  [new RegExp("^" + MO + ", on one page$"), function(m){ return "เดือน" + mth(m[1]) + " ในหน้าเดียว"; }],
  [new RegExp("^Signed off\\. " + MO + " is locked and filed\\.$"), function(m){ return "รับรองแล้ว ปิดบัญชีเดือน" + mth(m[1]) + " และยื่นเรียบร้อย"; }],
  [new RegExp("^I've reviewed " + MO + " and it looks right\\.$"), function(m){ return "ฉันตรวจบัญชีเดือน" + mth(m[1]) + " แล้ว ถูกต้อง"; }],
  [new RegExp("^How was " + MO + "\\?$"), function(m){ return "เดือน" + mth(m[1]) + " เป็นยังไงบ้าง"; }],
  [new RegExp("^" + MO + " tax forms approved$"), function(m){ return "อนุมัติแบบภาษีเดือน" + mth(m[1]) + " แล้ว"; }],
  [new RegExp("^Closed your " + MO + " books, every baht accounted for$"), function(m){ return "ปิดบัญชีเดือน" + mth(m[1]) + " แล้ว ครบทุกบาท"; }],
  [new RegExp("^" + MO + " payroll$"), function(m){ return "เงินเดือนเดือน" + mth(m[1]); }],
  [new RegExp("^" + MO + " payroll is ready$"), function(m){ return "เงินเดือนเดือน" + mth(m[1]) + " พร้อมแล้ว"; }],
  [new RegExp("^" + MO + " so far$"), function(m){ return "เดือน" + mth(m[1]) + " ถึงตอนนี้"; }],
  [new RegExp("^(\\d+) to (\\d+) " + MO + "$"), function(m){ return m[1] + " ถึง " + m[2] + " " + mth(m[3]); }],
  [new RegExp("^\\. " + MO + " has brought in$"), function(m){ return " เดือน" + mth(m[1]) + " มีเงินเข้า"; }],
  [new RegExp("^across (.+), as of (.+?)\\. " + MO + " has brought in$"), function(m){ return "ใน " + T(m[1]) + " ณ วันที่ " + dates(m[2]) + " เดือน" + mth(m[3]) + " มีเงินเข้า"; }],
  [/^(฿[\d,]+) kept\.$/, "เหลือเก็บ $1"],
  [/^Issued (.+)$/, function(m){ return "ออกวันที่ " + dates(m[1]); }], [/^due (.+)$/, function(m){ return "ครบกำหนด " + dates(m[1]); }],
  [/^Free trial until ([^.]+)\.$/, function(m){ return "ทดลองใช้ฟรีถึง " + dates(m[1]); }],
  [/^From (\d.+) to (\d.+)$/, function(m){ return "ตั้งแต่ " + dates(m[1]) + " ถึง " + dates(m[2]); }],
  [/^Up to (\d.+)$/, function(m){ return "ถึง " + dates(m[1]); }], [/^Left your account on (.+)$/, function(m){ return "ออกจากบัญชีวันที่ " + dates(m[1]); }],
  [/^· ID card copy for (.+)$/, "· สำเนาบัตรประชาชนของ $1"], [/^· At least 2 founders \(you have (\d+)\)$/, "· ผู้ก่อการอย่างน้อย 2 คน (ตอนนี้มี $1)"],
  [/^· Shares must add up to ([\d,]+) \(now ([\d,]+)\)$/, "· หุ้นรวมต้องได้ $1 หุ้น (ตอนนี้ $2)"],
  [/^· (.+?): ((?:birth date|complete address|occupation|13-digit national ID|at least 1 share|first and last name|a role|nationality)(?:, .+)?)$/, function(m){ var P = { "birth date": "วันเกิด", "complete address": "ที่อยู่ครบถ้วน", "occupation": "อาชีพ", "13-digit national ID": "เลขบัตรประชาชน 13 หลัก", "at least 1 share": "อย่างน้อย 1 หุ้น", "first and last name": "ชื่อและนามสกุล", "a role": "บทบาท", "nationality": "สัญชาติ" }; return "· " + m[1] + ": " + m[2].split(", ").map(function(x){ return P[x] || x; }).join(", "); }],
  [/^Filed (\d+) receipts you snapped or forwarded$/, "จัดเก็บใบเสร็จ $1 ใบที่คุณถ่ายหรือส่งต่อมา"], [/^Matched (\d+) bank payments to the right bills$/, "จับคู่รายการจ่าย $1 รายการกับบิลที่ถูกต้อง"],
  [/^(\d[\d,]*) bank lines read and sorted into (\d+) kinds of cost$/, "อ่านรายการเดินบัญชี $1 รายการ แยกเป็นค่าใช้จ่าย $2 ประเภท"], [/^(\d[\d,]*) transactions read\.$/, "อ่านไป $1 รายการ"],
  [/^Cash is (฿[\d,]+) across (\d+) accounts?, as of ([^.]+)\.$/, function(m){ return "เงินสด " + m[1] + " จาก " + m[2] + " บัญชี ณ วันที่ " + dates(m[3]); }],
  [new RegExp("^That is (up|down) ([\\d.]+)% since the start of " + MO + "\\.$"), function(m){ return UPD(m[1]) + " " + m[2] + "% นับจากต้นเดือน" + mth(m[3]); }],
  [/^The lowest point in the last 30 days was (฿[\d,]+) on ([^.]+)\.$/, function(m){ return "จุดต่ำสุดใน 30 วันที่ผ่านมาคือ " + m[1] + " เมื่อ " + dates(m[2]); }],
  [/^Cash over the last 30 days, from (฿[\d,]+) to (฿[\d,]+)$/, "เงินสด 30 วันล่าสุด จาก $1 เป็น $2"],
  [/^Cash over the last 30 days, (rising|falling) from ([\d.]+) to ([\d.]+) million baht$/, function(m){ return "เงินสด 30 วันล่าสุด " + (m[1] === "rising" ? "เพิ่ม" : "ลด") + "จาก " + m[2] + " เป็น " + m[3] + " ล้านบาท"; }],
  [/^([^.]+) is (up|down) ([\d.]+)% on the same days last month: (฿[\d,]+) against (฿[\d,]+)\.$/, function(m){ return T(m[1]) + " " + UPD(m[2]) + " " + m[3] + "% เทียบช่วงเดียวกันของเดือนก่อน: " + m[4] + " เทียบกับ " + m[5]; }],
  [/^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days bring in the most: about (฿[\d,]+) each over the last four weeks\.$/, function(m){ return WD[m[1] + "day"] + "ขายได้มากที่สุด: เฉลี่ยราว " + m[2] + " ต่อวัน ในสี่สัปดาห์ที่ผ่านมา"; }],
  [/^Your cash covers about ([\d.]+) months? of spending at the pace of the last three months\.$/, "เงินสดของคุณพอใช้จ่ายได้ราว $1 เดือน ตามอัตราการใช้จ่ายสามเดือนที่ผ่านมา"],
  [new RegExp("^" + MO + ": (฿[\\d,]+) in and (฿[\\d,]+) out\\.$"), function(m){ return "เดือน" + mth(m[1]) + ": เงินเข้า " + m[2] + " เงินออก " + m[3]; }],
  [/^You kept (-?฿[\d,-]+), a (-?[\d.]+)% margin\.$/, "คุณเหลือเก็บ $1 อัตรากำไร $2%"],
  [/^The biggest cost was ([^.]+) at (฿[\d,]+)\.$/, function(m){ return "ค่าใช้จ่ายก้อนใหญ่สุดคือ" + (CATL[m[1]] || m[1]) + " " + m[2]; }],
  [new RegExp("^(฿[\\d,]+) went out in " + MO + " so far\\.$"), function(m){ return "เดือน" + mth(m[2]) + " ถึงตอนนี้ เงินออก " + m[1]; }],
  [/^The biggest: ([^.]+)\.$/, function(m){ return "ก้อนใหญ่สุด: " + inl(m[1]); }],
  [new RegExp("^For " + MO + " so far I would set aside (฿[\\d,]+): VAT (฿[\\d,]+), withholding (฿[\\d,]+), and (฿[\\d,]+) towards company tax\\.$"), function(m){ return "สำหรับเดือน" + mth(m[1]) + " ถึงตอนนี้ หนูแนะนำให้กันไว้ " + m[2] + ": VAT " + m[3] + " ภาษีหัก ณ ที่จ่าย " + m[4] + " และภาษีนิติบุคคล " + m[5]; }],
  [/^You have (\d+) bills? to pay, (฿[\d,]+) in total\.$/, "คุณมีบิลต้องจ่าย $1 ใบ รวม $2"], [/^Next: ([^.]+)\.$/, function(m){ return "ถัดไป: " + inl(m[1]); }],
  [/^(\d+) invoices? (?:are|is) open, (฿[\d,]+) in total\.$/, "มีใบแจ้งหนี้ค้างรับ $1 ใบ รวม $2"], [/^Late: ([^.]+)\.$/, function(m){ return "เลยกำหนด: " + inl(m[1]); }],
  [/^(\d+) things are overdue: ([^.]+)\.$/, function(m){ return "มี " + m[1] + " รายการเลยกำหนด: " + inl(m[2]); }],
  [/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (\d{1,2} \w+)$/, function(m){ return WD[m[1]] + "ที่ " + dates(m[2]); }],
  [new RegExp("^(\\d{1,2} " + MO + "( \\d{4})?|\\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{4})$"), function(m){ return dates(m[0]); }],
  [new RegExp("^" + MO + "$"), function(m){ return mth(m[1]); }],
  [/^Switched to (.+)$/, "เปลี่ยนเป็น $1 แล้ว"], [/^Request(?:s)? sent to (.+)$/, "ส่งคำขอถึง $1 แล้ว"],
  [/^Your accountant asked for (\d+) documents$/, "นักบัญชีขอเอกสาร $1 รายการ"], [/^Receipt missing: (.+)$/, function(m){ return "ขาดใบเสร็จ: " + T(m[1]); }],
  [/^It is all on one page: (฿[\d,]+) in, (฿[\d,]+) out, (-?฿[\d,-]+) kept\.$/, "ทุกอย่างอยู่ในหน้าเดียว: เงินเข้า $1 เงินออก $2 เหลือเก็บ $3"],
  [new RegExp("^Profit and loss, " + MO + " so far \\(from your bank lines\\)$"), function(m){ return "งบกำไรขาดทุน เดือน" + mth(m[1]) + " ถึงตอนนี้ (จากรายการเดินบัญชี)"; }],
  [/^Kept (-?฿[\d,-]+), a (-?[\d.]+)% margin$/, "เหลือเก็บ $1 อัตรากำไร $2%"],
  [/^([A-Z][A-Za-z ,&]+?) (-?฿[\d,.-]+)$/, function(m){ var t = T(m[1]); return t === m[1] ? m[0] : t + " " + m[2]; }],
  [/^Sample statement loaded\. (\d[\d,]*) transactions read\.$/, "โหลดรายการเดินบัญชีตัวอย่างแล้ว อ่านไป $1 รายการ"]
];
var TCACHE = {};
function T(s){
  if (s == null) return s; var k = String(s), t = k.replace(/\s+/g, " ").trim(); if (!t || !/[A-Za-z]/.test(t)) return k;
  if (TCACHE[t] != null) return TCACHE[t];
  var out = tr(t); TCACHE[t] = out; return out;
}
function tr(t){
  if (TH.hasOwnProperty(t)) return TH[t];
  var e = t.match(/^(.*?)\s*·$/); if (e) return T(e[1]) + " ·";
  e = t.match(/^·\s*(.*)$/); if (e && TH.hasOwnProperty(e[1])) return "· " + TH[e[1]];
  if (t.indexOf(" · ") > 0) return t.split(" · ").map(T).join(" · ");
  for (var i = 0; i < RULES.length; i++){ var m = t.match(RULES[i][0]); if (m) return typeof RULES[i][1] === "function" ? RULES[i][1](m) : t.replace(RULES[i][0], RULES[i][1]); }
  var parts = t.split(/(?<=[.?!])\s+(?=[A-Z฿0-9"“])/); if (parts.length > 1) return parts.map(T).join(" ");
  return t;
}

/* walk the page and swap text, keeping the English so it can switch back */
var I18N = new WeakMap(), I18NA = new WeakMap(), i18nBusy = false, ATTRS = ["placeholder", "aria-label", "title"];
function skipEl(e){ for (var n = e; n && n.nodeType === 1; n = n.parentNode){ if (/^(SCRIPT|STYLE|TEXTAREA|INPUT|svg)$/i.test(n.tagName) || n.hasAttribute("data-noi18n") || n.isContentEditable || n.id === "b-me" || n.id === "b-in") return true; } return false; }
function i18nNode(n, th){
  var rec = I18N.get(n), v = n.nodeValue;
  if (rec && (v === rec.th || v === rec.en)){ var want = th ? rec.th : rec.en; if (v !== want) n.nodeValue = want; return; }
  if (!th) return; if (!/[A-Za-z]{2}/.test(v)) return;
  var pe = n.parentElement; if (!pe || skipEl(pe)) return;
  var lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0], out = /\n/.test(v.trim()) ? v.trim().split("\n").map(function(x){ return x.trim() ? T(x) : x; }).join("\n") : T(v);
  if (out === v.replace(/\s+/g, " ").trim() || out === v.trim()) return;
  var nv = out ? lead + out + trail : (lead || trail ? " " : "");
  I18N.set(n, { en: v, th: nv }); n.nodeValue = nv;
}
function i18nAttrs(e, th){
  var rec = I18NA.get(e) || {};
  ATTRS.forEach(function(a){
    var v = e.getAttribute(a); if (v == null) return; var r = rec[a];
    if (r && (v === r.th || v === r.en)){ var w = th ? r.th : r.en; if (v !== w) e.setAttribute(a, w); return; }
    if (!th || !/[A-Za-z]{2}/.test(v) || e.hasAttribute("data-noi18n")) return;
    var o = T(v); if (o === v) return; rec[a] = { en: v, th: o }; e.setAttribute(a, o);
  });
  I18NA.set(e, rec);
}
function i18nTree(root, th){
  if (!root) return;
  if (root.nodeType === 3){ i18nNode(root, th); return; }
  if (root.nodeType !== 1) return;
  var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) i18nNode(n, th);
  if (root.matches && root.matches("[placeholder],[aria-label],[title]")) i18nAttrs(root, th);
  if (root.querySelectorAll) root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(function(e){ i18nAttrs(e, th); });
}
function i18nAll(){ i18nBusy = true; var th = lang() === "th"; document.documentElement.lang = th ? "th" : "en"; i18nTree(document.body, th); i18nObs.takeRecords(); i18nBusy = false; }
var i18nQ = [], i18nT = 0;
var i18nObs = new MutationObserver(function(recs){
  if (i18nBusy || lang() !== "th") return;
  recs.forEach(function(r){ if (r.type === "childList") r.addedNodes.forEach(function(n){ i18nQ.push(n); }); else i18nQ.push(r.target); });
  if (!i18nT) i18nT = requestAnimationFrame(function(){ i18nT = 0; i18nBusy = true; var q = i18nQ; i18nQ = []; q.forEach(function(n){ if (n.isConnected) i18nTree(n, true); }); i18nObs.takeRecords(); i18nBusy = false; });
});
i18nObs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
// toasts appear right away
toast = (function(orig){ return function(msg){ orig(lang() === "th" ? T(msg) : msg); }; })(toast);
document.documentElement.lang = lang();

/* Thai questions reach the same answers */
var THQ = [[/เงินสด|เงินในบัญชี|เงินเหลือ/, "How's my cash?"], [/เลยกำหนด|ค้างจ่าย|เกินกำหนด/, "What's overdue?"], [/ใครค้าง|ลูกหนี้|ยังไม่จ่าย/, "Who owes me money?"], [/เงินไปไหน|ใช้จ่าย|ค่าใช้จ่าย/, "Where did the money go?"],
  [/กำไรขาดทุน|งบกำไร|p&l/i, "Show the full P&L"], [/บิล|ต้องจ่าย/, "What bills do I have?"], [/vat|ภาษีมูลค่าเพิ่ม|ภาษี/i, "How much VAT should I set aside?"], [/เดือนนี้|เดือนที่แล้ว|เป็นยังไง/, "How was this month?"]];
brain = (function(orig){ return function(q){ if (/[\u0E00-\u0E7F]/.test(q)){ for (var i = 0; i < THQ.length; i++) if (THQ[i][0].test(q)) return orig(THQ[i][1]); } return orig(q); }; })(brain);
if (lang() === "th") i18nAll();
window.__tgT = T;
