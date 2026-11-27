/* ── auditor desk: Thai. A text walker swaps English for Thai after every render, and back again ── */
(function(){
  var KEY = "tg.aud.lang", lang = "en";
  try { lang = localStorage.getItem(KEY) || ((JSON.parse(localStorage.getItem("tg.v2") || "{}").lang === "th") ? "th" : "en"); } catch (e) {}
  var D = {
    "Auditor": "ผู้สอบบัญชี", "Auditors": "ผู้สอบบัญชี", "Monthly close": "ปิดงบรายเดือน", "Yearly close": "ปิดงบรายปี", "Close type": "ประเภทการปิดงบ",
    "Month": "เดือน", "Month to close": "เดือนที่จะปิด", "Filter the queue": "กรองคิวงาน", "Queue": "คิวงาน", "Companies": "บริษัท", "Needs attention": "ต้องดูแล", "Documents requested": "ขอเอกสารแล้ว", "Month not over": "ยังไม่สิ้นเดือน", "A filing is late": "มีแบบที่เลยกำหนดยื่น", "Documents missing": "ขาดเอกสาร", "Request them from the client": "ขอจากลูกค้า", "Waiting on the client": "รอลูกค้าส่ง", "Everything is in": "เอกสารครบแล้ว", "Nothing to do yet": "ยังไม่มีงาน", "Done for this period": "เสร็จสำหรับงวดนี้", "Company queue": "คิวบริษัท",
    "Find a company": "ค้นหาบริษัท", "Whose companies": "บริษัทของใคร", "Mine": "ของฉัน", "Unassigned": "ยังไม่มีผู้รับผิดชอบ", "Everyone's": "ทั้งหมด", "All companies": "ทุกบริษัท",
    "Show sample companies": "แสดงบริษัทตัวอย่าง", "Signed up": "สมัครแล้ว", "Pick a company from the queue.": "เลือกบริษัทจากคิวงาน",
    "No companies are assigned to you yet.": "ยังไม่มีบริษัทที่มอบหมายให้คุณ", "No companies match.": "ไม่มีบริษัทที่ตรงกัน",
    "Waiting on documents": "รอเอกสาร", "Ready to close": "พร้อมปิดงบ", "Closed": "ปิดแล้ว", "Collecting": "กำลังรวบรวม", "Filed": "ยื่นแล้ว", "Missing": "ขาด", "Requested": "ขอแล้ว", "Received": "ได้รับแล้ว",
    "Month not over": "ยังไม่สิ้นเดือน", "Not needed": "ไม่ต้องยื่น", "Not needed:": "ไม่ต้องยื่น:", "Only when triggered": "เฉพาะเมื่อมีรายการ", "Every month, no form": "ทุกเดือน ไม่มีแบบ",
    "Mark received": "ทำเครื่องหมายว่าได้รับ", "Mark as missing": "ทำเครื่องหมายว่าขาด", "Mark DBD as filed": "ทำเครื่องหมายว่ายื่น DBD แล้ว", "Undo filed": "ยกเลิกสถานะยื่นแล้ว",
    "Request": "ขอเอกสาร", "Nothing to request": "ไม่มีเอกสารที่ต้องขอ", "View": "ดู", "View month": "ดูเดือนนี้", "Go to month": "ไปที่เดือน", "Close": "ปิด",
    "Close the year": "ปิดงบประจำปี", "Lock the books for this period": "ล็อกบัญชีของงวดนี้", "Mark every form as filed first": "ทำเครื่องหมายทุกแบบว่ายื่นแล้วก่อน", "Collect every document first": "รวบรวมเอกสารให้ครบก่อน",
    "Available once every document is in.": "ใช้ได้เมื่อได้รับเอกสารครบ", "After filing": "หลังยื่น", "After filing:": "หลังยื่น:", "The form": "แบบฟอร์ม", "Payment": "การชำระเงิน",
    "From ThuraGirl": "จาก ThuraGirl", "From client": "จากลูกค้า", "Sent by the client": "ลูกค้าส่งมา", "Pulled by ThuraGirl from the books": "ThuraGirl ดึงจากบัญชี",
    "Test build: files stay on the client's device, so there is nothing to preview here. In the live app the file opens in this panel.": "เวอร์ชันทดสอบ: ไฟล์อยู่ในอุปกรณ์ของลูกค้า จึงไม่มีตัวอย่างให้ดู ในระบบจริงไฟล์จะเปิดในแผงนี้",
    "Not kept in this test build": "ไม่ได้เก็บไว้ในเวอร์ชันทดสอบ", "This period": "งวดนี้", "Last month": "เดือนที่แล้ว", "Year to date": "ตั้งแต่ต้นปี",
    "Books": "บัญชี", "Bank statements": "รายการเดินบัญชีธนาคาร", "Sales tax invoices": "ใบกำกับภาษีขาย", "Purchases": "รายการซื้อ", "Receipts": "ใบเสร็จรับเงิน", "Receipt": "ใบเสร็จรับเงิน", "Invoice": "ใบแจ้งหนี้",
    "Trial balance": "งบทดลอง", "Trial balance (all account balances)": "งบทดลอง (ยอดคงเหลือทุกบัญชี)", "Trial balance and ledger": "งบทดลองและบัญชีแยกประเภท", "General ledger": "บัญชีแยกประเภททั่วไป", "Ledger": "บัญชีแยกประเภท", "Sub-ledgers": "บัญชีย่อย",
    "Reconciliations": "การกระทบยอด", "Accruals": "ค่าใช้จ่ายค้างจ่าย", "Adjustment entries": "รายการปรับปรุง", "Entries": "รายการบันทึก", "Provisions": "ประมาณการหนี้สิน", "Petty cash": "เงินสดย่อย",
    "Fixed assets and depreciation": "สินทรัพย์ถาวรและค่าเสื่อมราคา", "Tax depreciation": "ค่าเสื่อมราคาทางภาษี", "Stock count": "การตรวจนับสินค้า", "Loans": "เงินกู้", "Customer balances": "ยอดลูกหนี้", "Supplier balances": "ยอดเจ้าหนี้",
    "Card statements": "รายการบัตร", "Card payouts": "เงินโอนจากบัตร", "Wallet statements": "รายการกระเป๋าเงิน", "Payment-provider statements": "รายการจากผู้ให้บริการชำระเงิน", "Platform payouts": "เงินโอนจากแพลตฟอร์ม", "Platform settlements": "รายการชำระจากแพลตฟอร์ม",
    "Sales channels": "ช่องทางขาย", "Sales channel exports": "ไฟล์จากช่องทางขาย", "Sales documents": "เอกสารขาย", "Supplier documents": "เอกสารผู้ขาย", "Supplier payments": "การจ่ายเงินผู้ขาย", "Bank payments": "การจ่ายผ่านธนาคาร",
    "Credit notes": "ใบลดหนี้", "Debit notes": "ใบเพิ่มหนี้", "Credits": "เครดิต", "Full tax invoices": "ใบกำกับภาษีเต็มรูป", "Purchase orders": "ใบสั่งซื้อ", "Orders and delivery": "คำสั่งซื้อและการส่งมอบ", "Orders or contracts": "คำสั่งซื้อหรือสัญญา",
    "Goods or service received": "ได้รับสินค้าหรือบริการแล้ว", "Delivery or service acceptance": "ใบส่งมอบหรือใบรับงาน", "Service acceptance": "ใบรับงานบริการ", "Proof of where the service was used": "หลักฐานสถานที่ใช้บริการ", "Work done": "งานที่ทำ",
    "Contract": "สัญญา", "Contract or scope of work": "สัญญาหรือขอบเขตงาน", "Payment voucher": "ใบสำคัญจ่าย", "Payment proof": "หลักฐานการชำระเงิน", "Proof of payment": "หลักฐานการชำระเงิน", "Bank proof with date paid": "หลักฐานธนาคารพร้อมวันที่จ่าย", "Remittance proof": "หลักฐานการโอนเงิน",
    "Official receipt": "ใบเสร็จรับเงินทางการ", "Submission reference": "เลขอ้างอิงการยื่น", "Submission response": "ผลตอบรับการยื่น", "Accepted status": "สถานะรับเรื่อง", "Filing files": "ไฟล์สำหรับยื่น", "For corrections": "สำหรับการแก้ไข",
    "Sales VAT report": "รายงานภาษีขาย", "Purchase VAT report": "รายงานภาษีซื้อ", "VAT reports": "รายงานภาษีมูลค่าเพิ่ม", "VAT return": "แบบแสดงรายการภาษีมูลค่าเพิ่ม", "Overpaid VAT carried forward": "ภาษีชำระเกินยกไป",
    "VAT paid on behalf of a foreign supplier": "ภาษีมูลค่าเพิ่มที่นำส่งแทนผู้ขายต่างประเทศ", "VAT registered": "จดทะเบียนภาษีมูลค่าเพิ่ม", "Not VAT registered": "ไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม", "the company is not VAT registered": "บริษัทไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม",
    "Withholding tax on salaries": "ภาษีหัก ณ ที่จ่ายจากเงินเดือน", "Withholding tax: payments to individuals": "ภาษีหัก ณ ที่จ่าย: จ่ายบุคคลธรรมดา", "Withholding tax: payments to companies": "ภาษีหัก ณ ที่จ่าย: จ่ายนิติบุคคล",
    "Withholding certificates received": "หนังสือรับรองการหักภาษีที่ได้รับ", "Withholding certificates received (tax credits)": "หนังสือรับรองการหักภาษีที่ได้รับ (เครดิตภาษี)", "Earlier certificates": "หนังสือรับรองก่อนหน้า", "Earlier forms": "แบบที่ยื่นก่อนหน้า",
    "Payee record: tax ID, person or company, branch, address": "ข้อมูลผู้รับเงิน: เลขผู้เสียภาษี บุคคลหรือนิติบุคคล สาขา ที่อยู่", "Payee country": "ประเทศของผู้รับเงิน", "Payments abroad": "การจ่ายเงินไปต่างประเทศ", "Tax residency certificate": "หนังสือรับรองถิ่นที่อยู่ทางภาษี", "Exchange rate source": "แหล่งอัตราแลกเปลี่ยน",
    "Social security": "ประกันสังคม", "SSO enrolled": "ขึ้นทะเบียนประกันสังคม", "No SSO": "ไม่มีประกันสังคม", "the company is not enrolled with SSO": "บริษัทไม่ได้ขึ้นทะเบียนประกันสังคม", "the company has no employees": "บริษัทไม่มีพนักงาน", "No employees": "ไม่มีพนักงาน",
    "Payroll register with wage base and both contributions": "ทะเบียนเงินเดือนพร้อมฐานค่าจ้างและเงินสมทบทั้งสองฝ่าย", "Payroll register: gross, deductions, net": "ทะเบียนเงินเดือน: รวม หัก สุทธิ", "Payroll journal entry": "รายการบันทึกเงินเดือน", "Payroll payment": "การจ่ายเงินเดือน", "Bank payroll file": "ไฟล์เงินเดือนของธนาคาร",
    "Pay inputs": "ข้อมูลค่าจ้าง", "Overtime": "ค่าล่วงเวลา", "Bonus": "โบนัส", "Commission": "ค่านายหน้า", "Attendance": "การเข้างาน", "HR changes": "การเปลี่ยนแปลงพนักงาน", "Start dates": "วันเริ่มงาน", "Resignations": "การลาออก", "Terminations": "การเลิกจ้าง", "Employment contracts": "สัญญาจ้าง",
    "Employee list with status: active, joined, left, unpaid leave": "รายชื่อพนักงานพร้อมสถานะ: ทำงาน เข้าใหม่ ลาออก ลาไม่รับค่าจ้าง", "Employee list: joiners and leavers": "รายชื่อพนักงาน: เข้าใหม่และลาออก", "Annual payroll summary, for the calendar year": "สรุปเงินเดือนทั้งปี ตามปีปฏิทิน", "Full payment list": "รายการจ่ายทั้งหมด",
    "Half-year corporate income tax": "ภาษีเงินได้นิติบุคคลครึ่งปี", "Annual corporate income tax": "ภาษีเงินได้นิติบุคคลประจำปี", "Annual filing with DBD": "การยื่นประจำปีกับกรมพัฒนาธุรกิจการค้า", "DBD financial statements": "งบการเงินยื่นกรมพัฒนาธุรกิจการค้า", "DBD": "DBD",
    "Profit forecast": "ประมาณการกำไร", "Full-year forecast": "ประมาณการทั้งปี", "Assumptions": "สมมติฐาน", "Management accounts": "งบการเงินเพื่อการบริหาร", "SME status": "สถานะ SME", "BOI incentives": "สิทธิประโยชน์ BOI", "Losses and incentives": "ขาดทุนสะสมและสิทธิประโยชน์",
    "Tax losses": "ขาดทุนทางภาษี", "Tax losses brought forward": "ขาดทุนทางภาษียกมา", "Non-deductible expenses": "รายจ่ายที่หักไม่ได้", "Entertainment": "ค่ารับรอง", "Donations": "เงินบริจาค", "Related-party transaction records": "รายการกับบุคคลที่เกี่ยวข้อง",
    "Bridge from accounting profit to taxable profit": "การกระทบกำไรทางบัญชีกับกำไรทางภาษี", "Approval for combined filing": "การอนุมัติยื่นรวม", "Branch list": "รายชื่อสาขา", "Year-end books": "บัญชีสิ้นปี", "Year-end adjustments": "รายการปรับปรุงสิ้นปี",
    "Final accounts": "บัญชีขั้นสุดท้าย", "Final and locked": "สิ้นสุดและล็อกแล้ว", "Final statements": "งบการเงินฉบับสุดท้าย", "Financial statements": "งบการเงิน", "Statements for the full month": "รายการเดินบัญชีทั้งเดือน", "Statements with last year's figures": "งบการเงินพร้อมตัวเลขปีก่อน",
    "Statements in DBD's electronic format": "งบการเงินในรูปแบบอิเล็กทรอนิกส์ของ DBD", "Schedules": "ตารางประกอบ", "Notes": "หมายเหตุประกอบงบ", "Notes PDF": "หมายเหตุประกอบงบ PDF", "Audit report": "รายงานผู้สอบบัญชี", "Audit report PDF": "รายงานผู้สอบบัญชี PDF",
    "Signed audit report with the CPA's name and registration number": "รายงานผู้สอบบัญชีที่ลงนาม พร้อมชื่อและเลขทะเบียนผู้สอบบัญชี", "List of open exceptions": "รายการข้อยกเว้นที่ยังค้าง",
    "Board and AGM": "กรรมการและการประชุมผู้ถือหุ้น", "Board documents": "เอกสารกรรมการ", "AGM notice": "หนังสือเชิญประชุมสามัญผู้ถือหุ้น", "AGM minutes": "รายงานการประชุมสามัญผู้ถือหุ้น", "Shareholder list": "บัญชีรายชื่อผู้ถือหุ้น", "Share register as of the AGM date": "ทะเบียนผู้ถือหุ้น ณ วันประชุม",
    "Share transfers during the year": "การโอนหุ้นระหว่างปี", "Capital and share data": "ข้อมูลทุนและหุ้น", "Company documents": "เอกสารบริษัท", "Registration": "การจดทะเบียน", "Supporting documents": "เอกสารประกอบ",
    "Royalties, interest, dividends. Same documents as ภ.ง.ด.3 and 53": "ค่าสิทธิ ดอกเบี้ย เงินปันผล ใช้เอกสารเดียวกับ ภ.ง.ด.3 และ 53",
    "New company (not registered yet)": "บริษัทใหม่ (ยังไม่จดทะเบียน)", "Not added": "ยังไม่ได้เพิ่ม", "Due today": "ครบกำหนดวันนี้",
    "Set up the auditor desk": "ตั้งค่าโต๊ะทำงานผู้สอบบัญชี", "This first account is the lead. The lead adds the other auditors and decides who looks after which company.": "บัญชีแรกนี้คือหัวหน้า หัวหน้าจะเพิ่มผู้สอบบัญชีคนอื่นและกำหนดว่าใครดูแลบริษัทไหน",
    "Create the lead account": "สร้างบัญชีหัวหน้า", "Full name": "ชื่อ-นามสกุล", "Name": "ชื่อ", "Work email": "อีเมลที่ทำงาน", "Email": "อีเมล", "CPA number": "เลขทะเบียนผู้สอบบัญชี", "CPA or tax auditor registration number": "เลขทะเบียนผู้สอบบัญชีหรือผู้สอบบัญชีภาษีอากร",
    "Password": "รหัสผ่าน", "Type it again": "พิมพ์อีกครั้ง", "Sign in": "เข้าสู่ระบบ", "Sign out": "ออกจากระบบ", "Sign in with a passkey": "เข้าสู่ระบบด้วยพาสคีย์", "or": "หรือ", "Try the demo": "ลองเดโม", "Look around the desk with sample companies. No account needed.": "ดูโต๊ะทำงานด้วยบริษัทตัวอย่าง ไม่ต้องมีบัญชี", "Demo with sample companies": "เดโมด้วยบริษัทตัวอย่าง", "Leave the demo": "ออกจากเดโม", "Demo Auditor": "ผู้สอบบัญชีเดโม", "Set password and sign in": "ตั้งรหัสผ่านและเข้าสู่ระบบ", "One more step": "อีกหนึ่งขั้นตอน",
    "The back office for ThuraGirl's auditors.": "ระบบหลังบ้านสำหรับผู้สอบบัญชีของ ThuraGirl", "New here? Ask your lead auditor to add you. Then sign in with your email and set a password.": "เพิ่งเริ่มใช้? ขอให้หัวหน้าผู้สอบบัญชีเพิ่มคุณก่อน แล้วเข้าสู่ระบบด้วยอีเมลและตั้งรหัสผ่าน",
    "Your lead added you. Set a password to finish.": "หัวหน้าเพิ่มคุณแล้ว ตั้งรหัสผ่านเพื่อเสร็จสิ้น", "Add your name and a work email.": "ใส่ชื่อและอีเมลที่ทำงาน",
    "Test build: accounts stay in this browser and are not sent anywhere. Please use a made-up password.": "เวอร์ชันทดสอบ: บัญชีเก็บไว้ในเบราว์เซอร์นี้และไม่ถูกส่งไปที่ใด โปรดใช้รหัสผ่านสมมติ",
    "That password doesn't match.": "รหัสผ่านไม่ถูกต้อง", "The password needs at least 8 characters.": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "The two passwords don't match.": "รหัสผ่านทั้งสองไม่ตรงกัน", "There's no auditor with that email. Ask your lead to add you.": "ไม่พบผู้สอบบัญชีที่ใช้อีเมลนี้ ขอให้หัวหน้าเพิ่มคุณ",
    "Type the 6-digit code from your authenticator app, or a backup code.": "พิมพ์รหัส 6 หลักจากแอปยืนยันตัวตน หรือรหัสสำรอง", "Sign-in security": "ความปลอดภัยในการเข้าสู่ระบบ", "Passkey": "พาสคีย์", "Add a passkey": "เพิ่มพาสคีย์", "Sign in with Face ID or Touch ID instead of a password.": "เข้าสู่ระบบด้วย Face ID หรือ Touch ID แทนรหัสผ่าน",
    "Two-step sign-in": "การยืนยันสองขั้นตอน", "Two-step sign-in is off": "การยืนยันสองขั้นตอนปิดอยู่", "After your password, ask for a code from an authenticator app.": "หลังใส่รหัสผ่าน ให้ขอรหัสจากแอปยืนยันตัวตน", "Set it up": "ตั้งค่า", "Turn on": "เปิด", "Turn off": "ปิด",
    "Scan this in Google Authenticator, Microsoft Authenticator or 1Password, or type the key by hand.": "สแกนด้วย Google Authenticator, Microsoft Authenticator หรือ 1Password หรือพิมพ์คีย์เอง", "Keep them somewhere safe. Each one works once, if you lose your phone.": "เก็บไว้ในที่ปลอดภัย แต่ละรหัสใช้ได้ครั้งเดียว กรณีโทรศัพท์หาย",
    "Lead auditor: adds auditors and assigns companies": "หัวหน้าผู้สอบบัญชี: เพิ่มผู้สอบบัญชีและมอบหมายบริษัท", "Add auditor": "เพิ่มผู้สอบบัญชี", "Role": "บทบาท", "Lead": "หัวหน้า",
    "Restaurant": "ร้านอาหาร", "Cafe and bakery": "คาเฟ่และเบเกอรี่", "Beauty and salon": "ความงามและซาลอน", "Services and agency": "บริการและเอเจนซี", "Online and e-commerce": "ออนไลน์และอีคอมเมิร์ซ", "Manufacturing": "การผลิต", "Craft and manufacturing": "งานฝีมือและการผลิต",
    "Bangkok": "กรุงเทพฯ", "Chiang Mai": "เชียงใหม่", "Phuket": "ภูเก็ต", "Krabi": "กระบี่", "Rayong": "ระยอง", "Nonthaburi": "นนทบุรี",
    "Test build. Companies that sign up in this browser join the queue and get their requests on their own dashboard. The sample companies are made up.": "เวอร์ชันทดสอบ บริษัทที่สมัครในเบราว์เซอร์นี้จะเข้าคิว และเห็นคำขอเอกสารบนแดชบอร์ดของตัวเอง บริษัทตัวอย่างเป็นข้อมูลสมมติ",
    "Bank": "ธนาคาร", "Built": "สร้างแล้ว", "Accounts": "บัญชี"
  };
  var MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var MS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var TF = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  var TS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  function be(y){ return String(+y + 543); }
  function dt(s){ // "15 Mar 2026" or "15 Mar"
    return s.replace(/(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?: (\d{4}))?/g, function(_, d, m, y){ return d + " " + TS[MS.indexOf(m)] + (y ? " " + be(y) : ""); });
  }
  function form(s){ return /^(ภ\.|บอจ|สปส|DBD|Books)/.test(s) ? (s === "Books" ? "บัญชี" : s) : (D[s] || s); }
  var R = [
    [/^(\d+) · (A filing is late|Request them from the client|Waiting on the client|Everything is in|Nothing to do yet|Done for this period)$/, function(m){ return m[1] + " · " + D[m[2]]; }],
    [/^Not needed: (.+)$/, function(m){ return "ไม่ต้องยื่น: " + (D[m[1]] || m[1]); }],
    [/^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})$/, function(m){ return TF[MO.indexOf(m[1])] + " " + be(m[2]); }],
    [/^Year ending (\d{1,2}) (\w+) (\d{4})$/, function(m){ return "ปีบัญชีสิ้นสุด " + m[1] + " " + TF[MO.indexOf(m[2])] + " " + be(m[3]); }],
    [/^Close (January|February|March|April|May|June|July|August|September|October|November|December)$/, function(m){ return "ปิดงบ" + TF[MO.indexOf(m[1])]; }],
    [/^(\d+) compan(?:y|ies) · most urgent first$/, function(m){ return m[1] + " บริษัท · เรียงตามความเร่งด่วน"; }],
    [/^(\d+) days? late$/, function(m){ return "เลยกำหนด " + m[1] + " วัน"; }],
    [/^Due in (\d+) days?$/, function(m){ return "ครบกำหนดใน " + m[1] + " วัน"; }],
    [/^(\d+) employees?$/, function(m){ return "พนักงาน " + m[1] + " คน"; }],
    [/^(\d+) missing$/, function(m){ return "ขาด " + m[1]; }],
    [/^(\d+) requested$/, function(m){ return "ขอแล้ว " + m[1]; }],
    [/^(\d+) monthly packs?$/, function(m){ return "ชุดเอกสารรายเดือน " + m[1] + " ชุด"; }],
    [/^(\d+) of (\d+) documents( received)?$/, function(m){ return "ได้รับเอกสาร " + m[1] + " จาก " + m[2]; }],
    [/^(\d+) requests? sent to (.+)$/, function(m){ return "ส่งคำขอ " + m[1] + " รายการถึง " + m[2]; }],
    [/^Request (\d+) missing$/, function(m){ return "ขอเอกสารที่ขาด " + m[1] + " รายการ"; }],
    [/^(Mine|Unassigned|Everyone's) (\d+)$/, function(m){ return D[m[1]] + " " + m[2]; }],
    [/^Part (\d+)$/, function(m){ return "ส่วนที่ " + m[1]; }],
    [/^Mark (.+) as filed$/, function(m){ return "ทำเครื่องหมายว่ายื่น " + m[1] + " แล้ว"; }],
    [/^(.+?)([:,]) (\d+) missing$/, function(m){ return form(m[1]) + m[2] + " ขาด " + m[3]; }],
    [/^(.+?)([:,]) (\d+) requested$/, function(m){ return form(m[1]) + m[2] + " ขอแล้ว " + m[3]; }],
    [/^(.+?)([:,]) (complete|filed|not needed|month not over)$/, function(m){ return form(m[1]) + m[2] + " " + { complete: "ครบแล้ว", filed: "ยื่นแล้ว", "not needed": "ไม่ต้องยื่น", "month not over": "ยังไม่สิ้นเดือน" }[m[3]]; }],
    [/^(ภ\.\S+|บอจ\.\S+|สปส\.\S+) (\d+) (missing|requested)$/, function(m){ return m[1] + (m[3] === "missing" ? " ขาด " : " ขอแล้ว ") + m[2]; }],
    [/^(ภ\.\S+|บอจ\.\S+|สปส\.\S+) (complete|filed|not needed|payment)$/, function(m){ return m[1] + " " + { complete: "ครบแล้ว", filed: "ยื่นแล้ว", "not needed": "ไม่ต้องยื่น", payment: "การชำระ" }[m[2]]; }],
    [/^(ภ\.\S+) applies this month$/, function(m){ return m[1] + " ต้องยื่นเดือนนี้"; }],
    [/^Earlier (ภ\.\S+)$/, function(m){ return m[1] + " ก่อนหน้า"; }],
    [/^Full-year payroll, matched to the (\d+) monthly (ภ\.\S+) forms$/, function(m){ return "เงินเดือนทั้งปี กระทบกับ " + m[2] + " รายเดือน " + m[1] + " ฉบับ"; }],
    [/^Annual withholding certificates for employees \((.+)\)$/, function(m){ return "หนังสือรับรองการหักภาษีประจำปีของพนักงาน (" + m[1] + ")"; }],
    [/^Withholding certificates issued \((.+)\)$/, function(m){ return "หนังสือรับรองการหักภาษีที่ออก (" + m[1] + ")"; }],
    [/^VAT registration \((.+)\)$/, function(m){ return "การจดทะเบียนภาษีมูลค่าเพิ่ม (" + m[1] + ")"; }],
    [/^Late\. Was due (.+)$/, function(m){ return "เลยกำหนด เดิมครบ " + due(m[1]); }],
    [/^Was due (.+?), before they joined ThuraGirl$/, function(m){ return "เดิมครบ " + due(m[1]) + " ก่อนเข้าร่วม ThuraGirl"; }],
    [/^Was due (.+)$/, function(m){ return "เดิมครบ " + due(m[1]); }],
    [/^Due (.+)$/, function(m){ return "ครบกำหนด " + due(m[1]); }],
    [/^(.+) is now with (.+)$/, function(m){ return m[1] + " อยู่ในความดูแลของ " + m[2] + " แล้ว"; }],
    [/^(.+) added\. They sign in with this email and set a password\.$/, function(m){ return "เพิ่ม " + m[1] + " แล้ว เข้าสู่ระบบด้วยอีเมลนี้และตั้งรหัสผ่าน"; }],
    [/^Welcome, (.+)$/, function(m){ return "ยินดีต้อนรับ คุณ" + m[1]; }],
    [/^(.+) \(you\)$/, function(m){ return m[1] + " (คุณ)"; }],
    [/^(.+) · (Lead|Auditor) · (\d+) compan(?:y|ies)( · hasn't signed in yet)?$/, function(m){ return m[1] + " · " + (m[2] === "Lead" ? "หัวหน้า" : "ผู้สอบบัญชี") + " · " + m[3] + " บริษัท" + (m[4] ? " · ยังไม่เคยเข้าสู่ระบบ" : ""); }],
    [/^(.+) · (Bangkok|Chiang Mai|Phuket|Krabi|Rayong|Nonthaburi)$/, function(m){ return (D[m[1]] || m[1]) + " · " + D[m[2]]; }],
    [/^(Restaurant|Cafe and bakery|Beauty and salon|Services and agency|Online and e-commerce|Manufacturing|Craft and manufacturing) · (.+?)( · Unassigned)?$/, function(m){ return D[m[1]] + " · " + m[2] + (m[3] ? " · ยังไม่มีผู้รับผิดชอบ" : ""); }],
    [/^Password, at least (\d+) characters$/, function(m){ return "รหัสผ่าน อย่างน้อย " + m[1] + " ตัวอักษร"; }],
    [/^New password, at least (\d+) characters$/, function(m){ return "รหัสผ่านใหม่ อย่างน้อย " + m[1] + " ตัวอักษร"; }],
    [/^(.+), CPA$/, function(m){ return m[1] + " ผู้สอบบัญชีรับอนุญาต"; }],
    [/^Request sent to (.+?)\. It shows in Needs you on their dashboard\.$/, function(m){ return "ส่งคำขอถึง " + m[1] + " แล้ว จะแสดงในส่วนที่ต้องทำบนแดชบอร์ดของลูกค้า"; }],
    [/^(\d+) requests sent to (.+?)\. They show in Needs you on their dashboard\.$/, function(m){ return "ส่งคำขอ " + m[1] + " รายการถึง " + m[2] + " แล้ว จะแสดงในส่วนที่ต้องทำบนแดชบอร์ดของลูกค้า"; }],
    [/^Test build\. Companies that sign up in this browser/, function(m, s){ return D["Test build. Companies that sign up in this browser join the queue and get their requests on their own dashboard. The sample companies are made up."] + (s.indexOf("Acc") > 0 ? " บัญชีผู้สอบบัญชีเก็บไว้ในเบราว์เซอร์นี้" : ""); }]
  ];
  function due(s){ return dt(s).replace(/ by e-filing, /g, " ยื่นออนไลน์, ").replace(/ on paper$/, " ยื่นกระดาษ").replace(/ by e-filing$/, " ยื่นออนไลน์"); }
  function tr(s){
    var t = s.trim(); if (!t || !/[A-Za-z]/.test(t)) return s;
    var out = D[t];
    if (out == null) for (var i = 0; i < R.length; i++){ var m = t.match(R[i][0]); if (m){ out = R[i][1](m, t); break; } }
    if (out == null) return s;
    return s.replace(t, out);
  }
  var busy = false, ATTR = ["placeholder", "aria-label", "title"];
  function walk(root){
    busy = true;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())){
      var p = n.parentNode; if (!p || p.nodeName === "SCRIPT" || p.nodeName === "STYLE" || (p.closest && p.closest("[data-noi18n]"))) continue;
      if (n.__th == null || n.nodeValue !== n.__th) n.__en = n.nodeValue;
      var v = lang === "th" ? tr(n.__en) : n.__en; if (n.nodeValue !== v) n.nodeValue = v; n.__th = v;
    }
    (root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label],[title]") : []).forEach(function(e){
      ATTR.forEach(function(a){ var cur = e.getAttribute(a); if (cur == null) return; var ka = "__en_" + a, kt = "__th_" + a;
        if (e[kt] == null || cur !== e[kt]) e[ka] = cur; var v = lang === "th" ? tr(e[ka]) : e[ka]; if (cur !== v) e.setAttribute(a, v); e[kt] = v; });
    });
    document.documentElement.lang = lang;
    busy = false;
  }
  var queued = false;
  function soon(){ if (busy || queued) return; queued = true; (window.requestAnimationFrame || setTimeout)(function(){ queued = false; walk(document.body); }); }
  new MutationObserver(function(){ if (!busy) soon(); }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTR });
  // EN / ไทย switch, bottom left on every screen
  var sw = document.createElement("div"); sw.className = "lng"; sw.setAttribute("data-noi18n", ""); sw.setAttribute("role", "group"); sw.setAttribute("aria-label", "Language");
  [["en", "EN"], ["th", "ไทย"]].forEach(function(o){ var b = document.createElement("button"); b.type = "button"; b.textContent = o[1]; b.setAttribute("aria-pressed", String(lang === o[0]));
    b.addEventListener("click", function(){ lang = o[0]; try { localStorage.setItem(KEY, lang); } catch (e) {} Array.prototype.forEach.call(sw.children, function(x, i){ x.setAttribute("aria-pressed", String(["en", "th"][i] === lang)); }); walk(document.body); });
    sw.appendChild(b); });
  document.body.appendChild(sw);
  walk(document.body);
})();
