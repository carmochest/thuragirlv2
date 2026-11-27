/* ── forgot password: ask for the email, send a link, set a new password ── */
function openForgot(prefill, onDone){
  var b = openGS(L("Password", "รหัสผ่าน"), L("Reset your password", "ตั้งรหัสผ่านใหม่"), L("I send a link to your email. It works for 30 minutes.", "หนูจะส่งลิงก์ไปที่อีเมลของคุณ ใช้ได้ 30 นาที"));
  var st = { email: prefill || "" };
  var f = fld(L("Email", "อีเมล"), st.email, { type: "email", ph: "you@company.co.th", on: function(v){ st.email = v; go2.disabled = !/^\S+@\S+\.\S+$/.test(v.trim()); } });
  b.appendChild(f);
  var go2 = btn("pill acc", L("Send reset link", "ส่งลิงก์ตั้งรหัสใหม่"), function(){
    var email = st.email.trim().toLowerCase(), acc = db.users[email];
    b.textContent = "";
    var ok = el("div", "fp-ok"); ok.innerHTML = '<i class="mb-bi"><svg class="i"><use href="#i-check"/></svg></i>';
    var t = el("div"); t.appendChild(el("b", "", L("Check your email", "ตรวจสอบอีเมลของคุณ")));
    t.appendChild(el("p", "st-p", L("If " + email + " has an account, a reset link is on its way. Check spam if it isn't there in a few minutes.", "ถ้า " + email + " มีบัญชีอยู่ ลิงก์จะส่งไปเร็ว ๆ นี้ หากไม่เห็นภายในไม่กี่นาที ลองดูในโฟลเดอร์สแปม")));
    ok.appendChild(t); b.appendChild(ok);
    b.appendChild(el("p", "tnote", L("Test build: no email is sent. Open the link here instead.", "เวอร์ชันทดสอบ: ไม่มีการส่งอีเมล เปิดลิงก์ได้ที่นี่แทน")));
    b.appendChild(foot(btn("pill soft", L("Close", "ปิด"), closeGS), btn("pill acc", L("Open the reset link", "เปิดลิงก์ตั้งรหัสใหม่"), function(){
      if (!acc){ toast(L("No account with that email in this browser.", "ไม่พบบัญชีอีเมลนี้ในเบราว์เซอร์นี้")); return; }
      newPass(acc, onDone);
    })));
  });
  go2.disabled = !/^\S+@\S+\.\S+$/.test(st.email.trim());
  b.appendChild(foot(btn("pill soft", L("Cancel", "ยกเลิก"), closeGS), go2));
}
function newPass(acc, onDone){
  var b = openGS(L("Password", "รหัสผ่าน"), L("Choose a new password", "ตั้งรหัสผ่านใหม่"), acc.email);
  var v = { a: "", c: "" }, er = el("div", "ferrB");
  b.appendChild(fld(L("New password", "รหัสผ่านใหม่"), "", { type: "password", ph: L("At least 8 characters", "อย่างน้อย 8 ตัวอักษร"), on: function(x){ v.a = x; sync(); } }));
  b.appendChild(fld(L("Type it again", "พิมพ์อีกครั้ง"), "", { type: "password", on: function(x){ v.c = x; sync(); } }));
  b.appendChild(er);
  var save2 = btn("pill acc", L("Save new password", "บันทึกรหัสผ่านใหม่"), function(){
    var s = salt(); digest(s + v.a).then(function(h){
      acc.salt = s; acc.hash = h; save(); closeGS();
      toast(L("Password changed. Sign in with the new one.", "เปลี่ยนรหัสผ่านแล้ว เข้าสู่ระบบด้วยรหัสใหม่ได้เลย"));
      if (onDone) onDone(acc.email);
    });
  });
  function sync(){ er.textContent = v.c && v.a !== v.c ? L("The two passwords don't match.", "รหัสผ่านทั้งสองไม่ตรงกัน") : ""; save2.disabled = !(v.a.length >= 8 && v.a === v.c); }
  b.appendChild(foot(btn("pill soft", L("Cancel", "ยกเลิก"), closeGS), save2)); sync();
}

/* ── delete my account (PDPA right to erasure) ── */
function deleteCard(u, root){
  var c = card(L("Delete my account", "ลบบัญชีของฉัน"));
  c.appendChild(el("p", "st-p", L("This removes your sign-in, your companies' books, files and settings from ThuraGirl. Filed tax records we must keep by law are kept for 5 years, then deleted.", "ลบการเข้าสู่ระบบ บัญชี ไฟล์ และการตั้งค่าของบริษัทคุณออกจาก ThuraGirl เอกสารภาษีที่ยื่นแล้วซึ่งกฎหมายกำหนดให้เก็บ จะเก็บไว้ 5 ปีแล้วลบ")));
  c.appendChild(btn("pill soft danger-out", L("Delete my account", "ลบบัญชีของฉัน"), function(){ openDelete(u); }));
  root.appendChild(c);
}
function openDelete(u){
  var b = openGS(L("Account", "บัญชี"), L("Delete your account?", "ลบบัญชีของคุณ?"), L("This can't be undone.", "ย้อนกลับไม่ได้"));
  var ul = el("ul", "del-l");
  [L("Your sign-in, passkeys and two-step codes", "การเข้าสู่ระบบ พาสคีย์ และรหัสสองขั้นตอน"), L("Bank lines, invoices, bills and receipts", "รายการเดินบัญชี ใบแจ้งหนี้ บิล และใบเสร็จ"), L("Team, payroll and settings", "ทีม เงินเดือน และการตั้งค่า"), L("Any plan ends at once, with no further charge", "แพ็กเกจจะสิ้นสุดทันที ไม่มีการเรียกเก็บเงินเพิ่ม")].forEach(function(t){ ul.appendChild(el("li", "", t)); });
  b.appendChild(ul);
  b.appendChild(el("p", "st-p", L("Want a copy first? Use Download a copy in Settings, Files.", "ต้องการสำเนาก่อนไหม ใช้ปุ่มดาวน์โหลดสำเนาในการตั้งค่า หัวข้อไฟล์")));
  var typed = "", word = L("DELETE", "ลบ");
  var f = fld(L("Type " + word + " to confirm", "พิมพ์คำว่า " + word + " เพื่อยืนยัน"), "", { ph: word, on: function(v){ typed = v; del.disabled = typed.trim().toUpperCase() !== word; } });
  b.appendChild(f);
  var del = btn("pill inkb", L("Delete my account", "ลบบัญชีของฉัน"), function(){
    delete db.users[u.email]; db.session = ""; save(); closeGS();
    toast(L("Your account is deleted.", "ลบบัญชีของคุณแล้ว")); setTimeout(function(){ location.href = "../signup/"; }, 900);
  });
  del.disabled = true;
  b.appendChild(foot(btn("pill soft", L("Keep my account", "เก็บบัญชีไว้"), closeGS), del));
  b.appendChild(el("p", "tnote", L("Test build: this clears the account from this browser. The live app also deletes it from ThuraGirl's servers and emails you a confirmation.", "เวอร์ชันทดสอบ: ลบบัญชีออกจากเบราว์เซอร์นี้ ระบบจริงจะลบออกจากเซิร์ฟเวอร์ของ ThuraGirl และส่งอีเมลยืนยันให้")));
}

/* ── demo: /dashboard/#/demo opens a ready-made restaurant with sample books, no sign-up ── */
function startDemo(){
  var email = "demo@thuragirl.test", u = db.users[email];
  if (!u){
    u = db.users[email] = { name: "Demo Owner", nick: "Nok", email: email, salt: "", hash: "x", created: Date.now() - 3 * 864e5, onboarded: true, path: "have", demo: true,
      company: { taxid: "0105561023456", name: "Bangkok Bites Co., Ltd.", addr: "88/12 Sukhumvit Soi 31, Watthana, Bangkok 10110", type: "Restaurant" }, four: {},
      setup: { vat: "Yes", sso: "Yes", conn: { tgbooks: Date.now(), grab: Date.now(), lineman: Date.now() }, verify: null }, banks: [], hasData: false, done: {}, welcome: false, briefSeen: false, theme: db.theme || "auto", lang: db.lang, noConnAsk: true, reg: blankReg() };
    db.session = email;
    var p = readTable(splitCsv(sampleCsv())); addStatement(u, "K-Bank", "0483511234", p);
    /* a second bank, so the demo shows how several accounts look: a savings account that only earns interest */
    var sv = [], bal = 250000, end = addDays(today(), -1); for (var m = 5; m >= 0; m--){ var d = addDays(end, -30 * m - 2), i = Math.round(bal * 0.0045 / 12 * 100) / 100; bal = Math.round((bal + i) * 100) / 100; sv.push({ d: d, t: "INTEREST CREDIT SAVINGS", a: i, b: bal }); }
    addStatement(u, "SCB", "4072219908", { tx: sv });
    sampleBooks(u); u.sample = true;
  }
  if (u.company && u.company.type === "rest") u.company.type = "Restaurant";
  demoBriefs(u);
  db.session = email; u.justIn = false; save();
}
function demoBar(u){
  var bar = $("#demo-bar"); if (bar) bar.remove();
  if (!u || !u.demo) return;
  bar = el("div", "demo-bar"); bar.id = "demo-bar"; bar.setAttribute("data-noi18n", "");
  bar.appendChild(el("span", "", L("Demo with a sample restaurant", "เดโมด้วยข้อมูลร้านอาหารตัวอย่าง")));
  var a = el("a", "", L("Create my account", "สร้างบัญชีของฉัน")); a.href = "../signup/"; a.addEventListener("click", function(){ db.session = ""; save(); });
  bar.appendChild(a); document.body.insertBefore(bar, document.body.firstChild);
}
