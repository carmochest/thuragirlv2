/* ── guided chat: ThuraGirl asks, the owner answers by typing, talking or tapping ── */
function popOpts(list){
  var pop = $("#b-pop"), o = $("#b-opts", pop);
  if (!o){ o = el("div", "popO"); o.id = "b-opts"; pop.appendChild(o); }
  o.textContent = ""; o.hidden = !list || !list.length;
  (list || []).forEach(function(x){ o.appendChild(btn("pill " + (x.acc ? "acc" : "soft"), x.l, x.fn)); });
}
function tgSays(me2, reply, opts){
  var pop = $("#b-pop"); pop.hidden = false; $("#b-sug").hidden = true; $("#b-me").textContent = me2 || ""; $("#b-me").hidden = !me2;
  var r = $("#b-reply"); clearTimeout(chat.timer);
  if (calm || !me2){ r.textContent = reply; popOpts(opts); }
  else { r.innerHTML = '<span class="dotsT" aria-label="ThuraGirl is typing"><i></i><i></i><i></i></span>'; popOpts([]); chat.timer = setTimeout(function(){ r.textContent = reply; popOpts(opts); }, 420); }
  setTimeout(function(){ try { $("#b-in").focus({ preventScroll: true }); } catch (e) {} }, 0);
}
function amtOf(s){
  var m = String(s).replace(/,/g, "").replace(/฿|baht|บาท/gi, "").match(/(-?\d+(?:\.\d+)?)\s*(k|m|พัน|หมื่น|แสน|ล้าน)?/i); if (!m) return NaN;
  var n = +m[1], u = (m[2] || "").toLowerCase(); return Math.round(n * ({ k: 1e3, m: 1e6, "พัน": 1e3, "หมื่น": 1e4, "แสน": 1e5, "ล้าน": 1e6 }[u] || 1) * 100) / 100;
}
function daysOf(s){
  s = String(s).toLowerCase(); if (/today|now|วันนี้/.test(s)) return 0; if (/tomorrow|พรุ่งนี้/.test(s)) return 1;
  var m = s.match(/(\d+)\s*(day|d|วัน|week|wk|สัปดาห์|month|เดือน)?/); if (!m) return null;
  var n = +m[1], u = m[2] || "day"; return /week|wk|สัปดาห์/.test(u) ? n * 7 : /month|เดือน/.test(u) ? n * 30 : n;
}
function people(list){ var seen = {}, out = []; list.slice().reverse().forEach(function(v){ var k = v.to.toLowerCase(); if (!seen[k]){ seen[k] = 1; out.push(v.to); } }); return out.slice(0, 3); }
function endFlow(msg){ chat.flow = null; if (msg) tgSays("", msg); else { popOpts([]); $("#b-pop").hidden = true; } }
function flowStep(f, said){
  var u = me(), d = f.d, cancel = { l: "Cancel", fn: function(){ endFlow("Okay, I dropped it."); } };
  var q = f.steps[f.i];
  if (!q){ return; }
  var opts = (q.opts ? q.opts() : []).map(function(x){ return { l: x[0], fn: function(){ flowAnswer(x[1] != null ? x[1] : x[0], x[0]); } }; });
  if (q.extra) opts = opts.concat(q.extra());
  var ask = q.ask(); if (f.note){ ask = f.note + " " + ask; f.note = ""; }
  tgSays(said || "", ask, opts.concat([cancel]));
}
/* names you already deal with, matched as you type */
function contactNames(u, kind){
  var seen = {}, out = [];
  ((kind === "in" ? u.invoices : u.bills) || []).concat((kind === "in" ? u.bills : u.invoices) || []).forEach(function(v){ var k = (v.to || "").trim().toLowerCase(); if (k && !seen[k]){ seen[k] = 1; out.push(v.to.trim()); } });
  return out;
}
function matchName(list, t){ var k = t.trim().toLowerCase(); for (var i = 0; i < list.length; i++) if (list[i].toLowerCase() === k) return list[i]; return t.trim(); }
function suggestNames(){
  var f = chat.flow, q = f && f.steps[f.i], o = $("#b-opts"); if (!q || !q.suggest || !o) return;
  var v = $("#b-in").value.trim().toLowerCase(); o.textContent = "";
  if (!v){ o.hidden = true; return; }
  var hits = q.suggest().filter(function(n){ var l = n.toLowerCase(); return l.indexOf(v) === 0 || l.indexOf(" " + v) > 0; }).slice(0, 4);
  hits.forEach(function(n){ o.appendChild(btn("pill soft", n, function(){ $("#b-in").value = ""; flowAnswer(n, n); })); });
  o.hidden = !hits.length;
}
function flowAnswer(text, shown){
  var f = chat.flow, q = f && f.steps[f.i]; if (!q) return;
  var err = q.take(String(text).trim(), f.d);
  if (err){ tgSays(shown || text, err, (q.opts ? q.opts() : []).map(function(x){ return { l: x[0], fn: function(){ flowAnswer(x[1] != null ? x[1] : x[0], x[0]); } }; }).concat([{ l: "Cancel", fn: function(){ endFlow("Okay, I dropped it."); } }])); return; }
  var wasName = !!q.suggest;
  f.i++; while (f.steps[f.i] && f.steps[f.i].skip && f.steps[f.i].skip(f.d)) f.i++;
  if (wasName && f.d.isNew) f.note = "New name. I add them to your contacts when this is saved.";
  flowStep(f, shown || text);
}
function startInvoiceFlow(file){
  var u = me(), vatOn = u.setup.vat !== "No";
  if (gated(u)) return tgSays("", "Invoices open once the company is registered. Finish the registration first and I'll be ready.", [{ l: "Continue registration", acc: 1, fn: function(){ endFlow(); go("register"); } }]);
  chat.flow = { d: { file: file || null }, i: 0, steps: [
    { ask: function(){ return file ? "Which customer is this invoice for? Type their name." : "Let's make an invoice. Who is it for? Type their name."; }, suggest: function(){ return contactNames(u, "in"); },
      take: function(t, d){ if (t.length < 2) return "Type the customer's name, please."; d.to = matchName(contactNames(u, "in"), t); d.isNew = d.to === t && contactNames(u, "in").indexOf(t) < 0; } },
    { ask: function(){ return "What is it for? One line is enough, like \"Catering for 80 guests\"."; }, take: function(t, d){ if (!t) return "A short description, please."; d.what = t; } },
    { ask: function(){ return "How much" + (vatOn ? ", before VAT?" : "?"); }, take: function(t, d){ var n = amtOf(t); if (!(n > 0)) return "I need an amount, like 25,000 or 25k."; d.amt = n; } },
    { skip: function(){ return !vatOn; }, ask: function(){ return "Add 7% VAT on top?"; }, opts: function(){ return [["Yes, add VAT", "yes"], ["No VAT", "no"]]; },
      take: function(t, d){ if (/^(y|yes|ใช่|add)/i.test(t)) d.vat = true; else if (/^(n|no|ไม่)/i.test(t)) d.vat = false; else return "Yes or no?"; } },
    { ask: function(){ return "When should they pay?"; }, opts: function(){ return [["In 7 days", "7"], ["In 15 days", "15"], ["In 30 days", "30"]]; },
      take: function(t, d){ var n = daysOf(t); if (n == null) return "Tell me a number of days, like 15."; d.days = n; } },
    { ask: function(){ var d = chat.flow.d, tot = d.amt * (d.vat ? 1.07 : 1); return "Here it is: " + d.to + ", " + d.what + ", " + baht(Math.round(tot * 100) / 100) + (d.vat ? " with VAT" : "") + ", due " + nice(addDays(today(), d.days)) + ". Shall I create it?"; },
      extra: function(){ return [{ l: "Create invoice", acc: 1, fn: function(){ var d = chat.flow.d; var v = { id: nextInvNo(u), to: d.to, email: "", issued: today(), due: addDays(today(), d.days), items: [[d.what, 1, d.amt]], vat: !!d.vat, paid: "" }; if (d.file) v.file = d.file; u.invoices = u.invoices || []; u.invoices.push(v); save(); endFlow(); refresh(); openInvoice(v); toast("Invoice " + v.id + " created"); } },
        { l: "Use the full form", fn: function(){ endFlow(); newInvoice(); } }]; },
      take: function(t){ if (/^(y|yes|ok|create|ใช่|ตกลง)/i.test(t)){ $("#b-opts .pill.acc").click(); return "Creating it."; } return "Tap Create invoice, or Use the full form to add more lines."; } }
  ] };
  chat.flow.d.vat = vatOn;
  flowStep(chat.flow, "");
}
function startPayFlow(file){
  var u = me();
  chat.flow = { d: { file: file || null, pp: "" }, i: 0, steps: [
    { ask: function(){ return file ? "Got the bill. Who is it from? Type their name." : "Who do you need to pay? Type their name."; }, suggest: function(){ return contactNames(u, "out"); },
      take: function(t, d){ if (t.length < 2) return "Type who you're paying, please."; d.to = matchName(contactNames(u, "out"), t); d.isNew = d.to === t && contactNames(u, "out").indexOf(t) < 0; } },
    { ask: function(){ return "How much?"; }, take: function(t, d){ var n = amtOf(t); if (!(n > 0)) return "I need an amount, like 12,500."; d.amt = n; } },
    { ask: function(){ return "When is it due?"; }, opts: function(){ return [["Today", "0"], ["In 7 days", "7"], ["In 30 days", "30"]]; },
      take: function(t, d){ var n = daysOf(t); if (n == null) return "Tell me when, like today or in 7 days."; d.days = n; } },
    { ask: function(){ return "Do you have their PromptPay ID? A phone number or a 13-digit ID. I turn it into a QR code you can scan."; }, opts: function(){ return [["Skip", "skip"]]; },
      take: function(t, d){ if (/^skip|^no|ไม่มี|ข้าม/i.test(t)){ d.pp = ""; return; } var x = t.replace(/\D/g, ""); if (!(x.length === 10 || x.length === 13)) return "A 10-digit phone number or a 13-digit ID, or tap Skip."; d.pp = x; } },
    { ask: function(){ var d = chat.flow.d; return "Pay " + d.to + " " + baht(d.amt) + ", due " + nice(addDays(today(), d.days)) + (d.pp ? ", by PromptPay." : ".") + " Save it?"; },
      extra: function(){ return [{ l: "Save bill", acc: 1, fn: function(){ var d = chat.flow.d; var v = { id: "b" + Date.now(), to: d.to, amount: d.amt, due: addDays(today(), d.days), pp: d.pp, note: "", paid: "" }; if (d.file) v.file = d.file; u.bills = u.bills || []; u.bills.push(v); save(); endFlow(); refresh(); openBill(v); toast("Bill saved"); } },
        { l: "Use the full form", fn: function(){ endFlow(); newBill(); } }]; },
      take: function(t){ if (/^(y|yes|ok|save|ใช่|ตกลง)/i.test(t)){ $("#b-opts .pill.acc").click(); return "Saving it."; } return "Tap Save bill, or Use the full form."; } }
  ] };
  flowStep(chat.flow, "");
}

/* ── one Upload for everything: statements, receipts, bills, invoices, papers ── */
function anyUpload(f){
  var u = me(), ext = (f.name.split(".").pop() || "").toLowerCase(), meta = { name: f.name, size: f.size, at: Date.now() };
  chat.flow = null;
  if (["csv", "xlsx", "xls"].indexOf(ext) >= 0){
    if (gated(u)) return tgSays(f.name, "Bank statements open once the company is registered.", [{ l: "Continue registration", acc: 1, fn: function(){ endFlow(); go("register"); } }]);
    $("#b-pop").hidden = true; openUpload(); takeFile(f); return;
  }
  if (f.size > MAX) return tgSays(f.name, "That file is " + size(f.size) + ". The limit is 10 MB.");
  if (!(/^image\//.test(f.type) || ext === "pdf" || /^(heic|heif|jpg|jpeg|png|webp)$/.test(ext))) return tgSays(f.name, "I can read photos, PDFs, and CSV or Excel statements. That file type doesn't work here.");
  var keep = function(kind){ u.docs = (u.docs || []).concat([{ name: f.name, size: f.size, at: Date.now(), kind: kind }]); save(); };
  var opts = [
    { l: "A receipt", fn: function(){ if (!u.hasData){ keep("Receipts"); endFlow("Saved with your receipts. Once a statement is in, I match receipts to payments."); return; } chat.flow = null; tgSays("A receipt", fileReceipt(f)); } },
    { l: "A bill to pay", fn: function(){ startPayFlow(meta); } },
    { l: "An invoice I sent", fn: function(){ startInvoiceFlow(meta); } },
    { l: "A company paper", fn: function(){ keep("Company"); endFlow("Filed under Company in Settings, Files."); } },
    { l: "A bank statement", fn: function(){ endFlow("I can't read PDF or photo statements in this test build. Download the CSV or Excel version from your banking app and upload that."); } }
  ];
  tgSays(f.name, "Thanks. What is it?", opts.concat([{ l: "Cancel", fn: function(){ endFlow(); } }]));
}
(function(){
  $$("#app .js-anyup").forEach(function(b){ b.addEventListener("click", function(){ $("#b-chatfile").click(); }); });
  var pop = $("#b-pop"); if (pop) $("#b-popx").addEventListener("click", function(){ chat.flow = null; popOpts([]); });
})();

/* ── registration helpers ── */
function thaiIdOk(s){ if (!/^\d{13}$/.test(s)) return false; var t = 0; for (var i = 0; i < 12; i++) t += +s[i] * (13 - i); return (11 - t % 11) % 10 === +s[12]; }
var BADWORDS = [["ธนาคาร", "bank"], ["ประกันภัย", "insurance"], ["ประกันชีวิต", "life insurance"], ["หลักทรัพย์", "securities"], ["มหาวิทยาลัย", "university"], ["กองทุน", "fund"], ["ราช", "royal"], ["สหกรณ์", "cooperative"], ["มูลนิธิ", "foundation"], ["รัฐบาล", "government"]];
function nameWarn(n){
  n = (n || "").trim(); if (!n) return "";
  if (/[A-Za-z]/.test(n) && !/[฀-๿]/.test(n)) return "DBD needs the name in Thai letters. Write how it sounds in Thai, like แบงค็อก ไบท์ส. The English name goes below.";
  if (/บริษัท|จำกัด/.test(n)) return "Leave out บริษัท and จำกัด. I add them for you.";
  var b = BADWORDS.filter(function(w){ return n.indexOf(w[0]) >= 0; })[0];
  if (b) return "Names with " + b[0] + " (" + b[1] + ") need special permission. Pick another word if you can.";
  return "";
}
var OBJ = {
  "Restaurant": ["Operate restaurants and sell food and drinks", "Provide catering and event food services", "Sell food through delivery apps and online channels"],
  "Retail / Shopfront": ["Retail sale of general goods", "Import and distribute goods for sale", "Sell goods online"],
  "Online / E-commerce": ["Sell goods through websites, marketplaces and social media", "Provide online marketing and fulfilment services", "Import goods for online sale"],
  "Cafe / Bakery": ["Operate cafés and sell coffee, drinks and baked goods", "Produce and sell bakery products wholesale", "Provide catering for events"],
  "Beauty / Salon": ["Operate beauty salons, spas and hair services", "Sell beauty and personal care products", "Provide training in beauty services"],
  "Services / Agency": ["Provide consulting and professional services", "Provide marketing, design and advertising services", "Provide IT and software services"],
  "Manufacturing": ["Manufacture and process goods", "Sell manufactured goods wholesale and retail", "Import raw materials and export finished goods"],
  "Other": ["Carry on trade and services in general", "Buy, sell, import and export goods", "Provide services to businesses and the public"]
};
var ZIPPROV = { "10": "Bangkok", "11": "Nonthaburi", "12": "Pathum Thani", "13": "Phra Nakhon Si Ayutthaya", "20": "Chon Buri", "21": "Rayong", "50": "Chiang Mai", "57": "Chiang Rai", "73": "Nakhon Pathom", "74": "Samut Sakhon", "76": "Phetchaburi", "77": "Prachuap Khiri Khan", "80": "Nakhon Si Thammarat", "81": "Krabi", "83": "Phuket", "84": "Surat Thani", "90": "Songkhla", "40": "Khon Kaen", "30": "Nakhon Ratchasima", "34": "Ubon Ratchathani", "41": "Udon Thani", "65": "Phitsanulok" };
function regFees(cap){ var u = Math.ceil(cap / 100000); return Math.min(25000, Math.max(500, u * 50)) + Math.min(250000, Math.max(5000, u * 500)); }
function chipRow(items, on){ var c = el("div", "chips qch"); items.forEach(function(x){ var b2 = el("button", "", x[0]); b2.type = "button"; if (x[2]) b2.setAttribute("aria-pressed", "true"); b2.addEventListener("click", function(){ on(x[1]); }); c.appendChild(b2); }); return c; }

/* ── settings, in tabs so nothing crowds ── */
/* two pages: Company settings (this company only) and Your account (you, whichever company is open) */
var setTab = "account", PTABS = [["account", "Profile"], ["notif", "Notifications"], ["security", "Security"]], CTABS = [["company", "Company"], ["team", "Team"], ["apps", "Apps"], ["files", "Files"], ["billing", "Plan"]];
function setScope(){ return PTABS.some(function(t){ return t[0] === setTab; }) ? "you" : "co"; }
function renderSettings(){
  var u = me(), root = $("#b-settings"), oldNav = $(".stabs", root), keepX = oldNav ? oldNav.scrollLeft : 0; root.textContent = ""; root.classList.remove("in");
  var you = setScope() === "you", STABS = you ? PTABS : CTABS;
  var h = el("div", "pgh"); h.appendChild(el("h1", "", you ? "Your account" : "Company settings"));
  var hp = el("p", "", you ? L("Your profile, sign-in and preferences. Changes save as you type.", "โปรไฟล์ การเข้าสู่ระบบ และการตั้งค่าของคุณ บันทึกให้อัตโนมัติขณะพิมพ์") : coLabel(u) + L(" · Changes save as you type.", " · บันทึกให้อัตโนมัติขณะพิมพ์")); hp.setAttribute("data-noi18n", ""); h.appendChild(hp); root.appendChild(h);
  var nav = el("div", "chips stabs"); nav.setAttribute("role", "tablist");
  STABS.forEach(function(t){ var b = el("button", "", t[1]); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(setTab === t[0])); b.setAttribute("aria-pressed", String(setTab === t[0])); b.addEventListener("click", function(){ setTab = t[0]; renderSettings(); }); nav.appendChild(b); });
  root.appendChild(nav);
  nav.scrollLeft = keepX;
  var on = $('[aria-selected="true"]', nav);
  if (on) requestAnimationFrame(function(){ var l = on.offsetLeft - nav.offsetLeft, r = l + on.offsetWidth; if (l < nav.scrollLeft + 16 || r > nav.scrollLeft + nav.clientWidth - 16) nav.scrollTo({ left: Math.max(0, l - (nav.clientWidth - on.offsetWidth) / 2), behavior: keepX ? "smooth" : "auto" }); });
  var T = setTab;
  if (T === "account"){ profileCard(u, root); appearanceCard(u, root); accountCard(u, root); }
  else if (T === "notif") notifCard(u, root);
  else if (T === "company"){ companyCard(u, root); recordsCard(u, root); }
  else if (T === "team"){ teamCard(u, root); accessCard(u, root); }
  else if (T === "apps"){ var cn = card("Connected apps"); cn.appendChild(connList(u, function(){ renderSettings(); })); root.appendChild(cn); if (!gated(u)) banksCard(u, root); }
  else if (T === "files"){ filesCard(u, root); if (!gated(u)) dataCard(u, root); }
  else if (T === "security"){ securityCard(u, root); tfaCard(u, root); deleteCard(u, root); }
  else if (T === "billing") billingCard(u, root);
  /* a quiet way across to the other page */
  var sw = el("button", "set-sw"); sw.type = "button"; sw.setAttribute("data-noi18n", "");
  sw.appendChild(document.createTextNode(you ? L("Settings for ", "ตั้งค่าของ ") + coLabel(u) : L("Your account settings", "ตั้งค่าบัญชีของคุณ")));
  sw.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>');
  sw.addEventListener("click", function(){ setTab = you ? "company" : "account"; renderSettings(); scrollTo(0, 0); }); root.appendChild(sw);
}
function profileCard(u, root){
  var c = card("Your profile"), g = el("div", "fgrid");
  g.appendChild(fld("Full name", u.name, { saved: 1, on: function(v){ if (!v.trim()) return "Please add your name"; u.name = v.trim(); save(); return ""; } }));
  g.appendChild(fld("What I call you", u.nick || first(u), { saved: 1, on: function(v){ u.nick = v.trim(); save(); } }));
  g.appendChild(fld("Email", u.email, { ro: 1 }));
  g.appendChild(fld("Phone", u.phone || "", { saved: 1, mode: "tel", ph: "081 234 5678", on: function(v, inp){ inp.value = v.replace(/[^\d+ ]/g, ""); u.phone = inp.value; save(); return u.phone && u.phone.replace(/\D/g, "").length < 9 ? "At least 9 digits" : ""; } }));
  g.appendChild(fld("Role", u.path === "new" && !(u.reg && u.reg.submitted) ? "Founder" : "Owner", { ro: 1 }));
  g.appendChild(fld("Time zone", "Bangkok (GMT+7)", { ro: 1 }));
  c.appendChild(g);
  var lr = el("div", "frow"); lr.appendChild(el("b", "", "Language")); lr.appendChild(langSeg()); c.appendChild(lr);
  c.appendChild(el("p", "tnote", "Screens switch straight away. ThuraGirl answers in the language you write in."));
  root.appendChild(c);
}
function appearanceCard(u, root){
  var ap = card("Appearance"), row = el("div", "frow"); row.appendChild(el("b", "", "Theme"));
  var labels = { auto: "Auto", day: "Day", night: "Night" }, sg = seg(["Auto", "Day", "Night"], labels[u.theme || "auto"], function(v){ u.theme = v.toLowerCase(); db.theme = u.theme; save(); applyTheme(); });
  sg.classList.add("on-soft"); row.appendChild(sg); ap.appendChild(row); root.appendChild(ap);
}
function accountCard(u, root){
  var ac = card("Account"), r2 = el("div", "chips");
  r2.appendChild(btn("pill soft act", "Sign out", function(){ db.session = ""; save(); suStep = 0; toAuth("login"); }));
  r2.appendChild(btn("pill soft act danger", eraseArmed ? "Tap again to erase everything" : "Erase this test account", function(){ if (!eraseArmed){ eraseArmed = true; renderSettings(); return; } eraseArmed = false; delete db.users[u.email]; db.session = ""; save(); suStep = 0; toAuth(""); }));
  ac.appendChild(r2); ac.appendChild(el("p", "tnote", "Test build: this account lives only in this browser. Signing in on another device will not find it."));
  root.appendChild(ac);
}
function banksCard(u, root){
  var bk = card("Bank statements");
  if (!u.banks.length) bk.appendChild(el("p", "st-p", "No statements yet. Upload one and I build your dashboard from it."));
  u.banks.forEach(function(b){ var r = el("div", "docrow"), tx = el("div", "tx"); tx.appendChild(el("b", "", b.bank + " ···· " + b.acct.slice(-4))); tx.appendChild(el("span", "", (b.to ? "Up to " + nice(b.to) + " · " : "") + "uploaded " + ago(b.at, true))); r.appendChild(tx); r.appendChild(btn("pill soft act", "Upload", function(){ openUpload(b); })); bk.appendChild(r); });
  var ub = btn("pill soft act", u.banks.length ? "Add another bank" : "Upload a statement", function(){ openUpload(); }); ub.style.justifySelf = "start"; bk.appendChild(ub);
  root.appendChild(bk);
}
function companyCard(u, root){
  var co = card("Company");
  if (u.path === "new"){
    co.appendChild(el("p", "st-p", u.reg.submitted ? "Your registration has been submitted." : "Not registered yet. " + (regLeft(u) ? regLeft(u) + " of 5 parts still need you." : "Everything is ready to submit.")));
    var rb = btn("pill soft act", u.reg.submitted ? "View registration" : "Continue registration", function(){ go("register"); }); rb.style.justifySelf = "start"; co.appendChild(rb);
    root.appendChild(co); return;
  }
  var g2 = el("div", "fgrid"), c = u.company;
  g2.appendChild(fld("Registered company name", c.name, { saved: 1, on: function(v){ if (v.trim().length < 2) return "At least 2 characters"; c.name = v.trim(); save(); $("#b-co-n").textContent = coName(u); $("#b-co-i").textContent = initials(coName(u)); return ""; } }));
  g2.appendChild(fld("Tax ID", c.taxid, { saved: 1, mode: "numeric", max: 13, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); if (inp.value.length !== 13) return "Exactly 13 digits"; if (taxTaken(inp.value, u)) return "This company is already on ThuraGirl"; c.taxid = inp.value; save(); return ""; } }));
  g2.appendChild(fld("Registered address", c.addr, { saved: 1, wide: 1, on: function(v){ if (v.trim().length < 5) return "At least 5 characters"; c.addr = v.trim(); save(); return ""; } }));
  g2.appendChild(fld("Business type", c.type, { saved: 1, options: TYPES.map(function(t){ return [t[0], t[0]]; }), on: function(v){ c.type = v; save(); return ""; } }));
  co.appendChild(g2); co.appendChild(vatRows(u, function(){ renderSettings(); paintSetup(); setCount(); toast("Saved"); }));
  root.appendChild(co);
  var cv = card("Company verification"), vb = verifyBlock(u, function(){ renderSettings(); paintSetup(); setCount(); }); while (vb.firstChild) cv.appendChild(vb.firstChild); root.appendChild(cv);
}

/* company records: from the registration, or pulled from DBD and confirmed */
var DBDDEMO = { "0105561023456": { reg: "2018-06-22", capital: 2000000, par: 100, status: "Active", signing: "Any one director signs and affixes the company seal",
  directors: ["Chet Suriya", "Pimchanok Wongsa"], holders: [["Chet Suriya", 12000], ["Pimchanok Wongsa", 6000], ["Somchai Saetang", 2000]], objectives: 4 } };
function recordsFromReg(u){
  var r = u.reg, sc = shareCount(r);
  return { src: "reg", capital: num(r.capital), par: num(r.par), signing: r.signing, reg: "", status: r.submitted ? "Submitted to DBD" : "Not registered yet",
    directors: r.people.filter(function(p){ return p.roles.d; }).map(pname), holders: r.people.filter(holder).map(function(p){ return [pname(p), num(p.shares) || 0]; }), objectives: lines(r.objectives).length, shares: sc };
}
function autoRecords(u){
  if (u.path === "new" || u.records || !u.company || u.company.taxid.length !== 13) return;
  var d = DBDDEMO[u.company.taxid];
  u.records = d ? JSON.parse(JSON.stringify(d)) : { reg: "", capital: 0, par: 0, status: "", signing: "", directors: [], holders: [], objectives: 0, miss: 1 };
  u.records.src = "dbd"; u.records.at = Date.now(); u.records.ok = false; save();
}
function recordsCard(u, root){
  var c = card("Company records"), R = u.path === "new" ? recordsFromReg(u) : u.records;
  if (u.path !== "new" && !R){
    c.appendChild(el("p", "st-p", "Directors, shareholders, capital and signing rules. I pull them from DBD with your tax ID, and you check them."));
    var pb = btn("pill acc", "Pull my records from DBD", function(){
      pb.disabled = true; pb.textContent = "Asking DBD…";
      setTimeout(function(){
        var d = DBDDEMO[u.company.taxid];
        u.records = d ? JSON.parse(JSON.stringify(d)) : { reg: "", capital: 0, par: 0, status: "", signing: "", directors: [], holders: [], objectives: 0, miss: 1 };
        u.records.src = "dbd"; u.records.at = Date.now(); u.records.ok = false; save(); renderSettings();
      }, calm ? 0 : 900);
    }, "i-arrow"); pb.style.justifySelf = "start"; c.appendChild(pb);
    c.appendChild(el("p", "tnote", "Test build: only the demo tax ID 0105561023456 returns records. The live app asks DBD for every company."));
    root.appendChild(c); return;
  }
  if (R.miss) c.appendChild(el("p", "ferrB", "DBD has no record for this tax ID in the test build. Add them below, or upload your company affidavit and BOJ.5 and I read them."));
  if (R.src === "dbd" && !R.ok) c.appendChild(el("div", "confirm-note", "From DBD " + ago(R.at, true) + ". Check each line, fix anything out of date, then confirm."));
  if (R.src === "reg") c.appendChild(el("p", "st-p", "From your registration. " + (u.reg.submitted ? "These become the official records once DBD registers the company." : "Change them in the registration.")));
  var dl = el("dl", "recs");
  function row(k, v){ dl.appendChild(el("dt", "", k)); dl.appendChild(el("dd", "", v || "Not set")); }
  row("Status", R.status); if (R.reg) row("Registered", niceY(R.reg)); row("Registered capital", R.capital ? baht(R.capital) + (R.par ? " · " + money(R.capital / R.par) + " shares of " + baht(R.par) : "") : ""); row("Who can sign", R.signing); row("Objectives", R.objectives ? R.objectives + " on file" : "");
  c.appendChild(dl);
  var edit = R.src === "dbd";
  function list(title, items, add, fmt, rm){
    c.appendChild(el("b", "regsub", title + " · " + items.length));
    var rows = el("div", "ob-rows");
    items.forEach(function(x, i){ var r = el("div", "ob-row"), nm = typeof x === "string" ? x : x[0]; r.appendChild(el("span", "ob-av", initials(nm))); var t = el("div", "tx"); t.appendChild(el("b", "", nm)); if (fmt) t.appendChild(el("span", "", fmt(x))); r.appendChild(t); if (edit) r.appendChild(btn("pill soft act", "Remove", function(){ rm(i); })); rows.appendChild(r); });
    c.appendChild(rows); if (edit) c.appendChild(add);
  }
  var tot = R.holders.reduce(function(a, h){ return a + h[1]; }, 0);
  var nd = { n: "" }, addD = el("div", "addrow"); addD.appendChild(fld("Add a director", "", { ph: "Full name", on: function(v){ nd.n = v; } })); addD.appendChild(btn("pill soft act", "Add", function(){ if (nd.n.trim().length < 2) return; R.directors.push(nd.n.trim()); R.ok = false; save(); renderSettings(); toast("Director added. A change of directors must also be filed with DBD within 14 days."); }));
  list("Directors", R.directors, addD, null, function(i){ R.directors.splice(i, 1); R.ok = false; save(); renderSettings(); });
  var nh = { n: "", s: "" }, addH = el("div", "addrow two"); addH.appendChild(fld("Add a shareholder", "", { ph: "Full name", on: function(v){ nh.n = v; } })); addH.appendChild(fld("Shares", "", { mode: "numeric", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); nh.s = inp.value; } }));
  addH.appendChild(btn("pill soft act", "Add", function(){ if (nh.n.trim().length < 2 || !(+nh.s > 0)) return; R.holders.push([nh.n.trim(), +nh.s]); R.ok = false; save(); renderSettings(); toast("Shareholder added. File an updated BOJ.5 with DBD to make it official."); }));
  list("Shareholders", R.holders, addH, function(h){ return money(h[1]) + " shares" + (tot ? " · " + (h[1] / tot * 100).toFixed(1) + "%" : ""); }, function(i){ R.holders.splice(i, 1); R.ok = false; save(); renderSettings(); });
  if (edit){
    if (R.ok) c.appendChild(el("p", "okt", "You confirmed these " + ago(R.ok, true) + "."));
    else { var cf = btn("pill acc", "These are right", function(){ R.ok = Date.now(); save(); renderSettings(); toast("Records confirmed"); }); cf.style.justifySelf = "start"; c.appendChild(cf); }
    var again = btn("alt", "", function(){ delete u.records; save(); renderSettings(); }); again.innerHTML = "<u>Pull from DBD again</u>"; c.appendChild(again);
  }
  root.appendChild(c);
}

/* two-step sign-in with an authenticator app (TOTP, RFC 6238) */
var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32(bytes){ var bits = "", out = ""; for (var i = 0; i < bytes.length; i++) bits += ("00000000" + bytes[i].toString(2)).slice(-8); for (var j = 0; j + 5 <= bits.length; j += 5) out += B32[parseInt(bits.substr(j, 5), 2)]; return out; }
function unb32(s){ var bits = "", out = []; s.replace(/=+$/, "").toUpperCase().split("").forEach(function(c){ bits += ("00000" + B32.indexOf(c).toString(2)).slice(-5); }); for (var i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2)); return new Uint8Array(out); }
function totp(secret, step){
  var c = new Uint8Array(8), n = step; for (var i = 7; i >= 0; i--){ c[i] = n & 255; n = Math.floor(n / 256); }
  return crypto.subtle.importKey("raw", unb32(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]).then(function(k){ return crypto.subtle.sign("HMAC", k, c); }).then(function(sig){
    var h = new Uint8Array(sig), o = h[19] & 15, v = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]; return ("000000" + (v % 1e6)).slice(-6);
  });
}
function totpOk(secret, code){ var s = Math.floor(Date.now() / 30000); return Promise.all([s - 1, s, s + 1].map(function(x){ return totp(secret, x); })).then(function(a){ return a.indexOf(code) >= 0; }); }
function tfaCard(u, root){
  var c = card("Two-step sign-in");
  if (u.tfa){
    c.appendChild(el("p", "okt", "On, with an authenticator app. Added " + ago(u.tfa.at, true) + "."));
    c.appendChild(el("p", "st-p", (u.tfa.codes || []).filter(function(x){ return !x.used; }).length + " backup codes left. Each one works once, if you lose your phone."));
    var ch = el("div", "chips");
    ch.appendChild(btn("pill soft act", "New backup codes", function(){ u.tfa.codes = mkCodes(); save(); showCodes(u.tfa.codes); }));
    ch.appendChild(btn("pill soft act danger", u.tfaArm ? "Tap again to turn off" : "Turn off", function(){ if (!u.tfaArm){ u.tfaArm = 1; renderSettings(); return; } delete u.tfaArm; delete u.tfa; save(); renderSettings(); toast("Two-step sign-in is off"); }));
    c.appendChild(ch); delete u.tfaArm; root.appendChild(c); return;
  }
  c.appendChild(el("p", "st-p", "After your password, I also ask for a 6-digit code from an app like Google Authenticator, Microsoft Authenticator or 1Password."));
  var b = btn("pill soft act", "Set it up", function(){ setupTfa(u); }); b.style.justifySelf = "start"; c.appendChild(b);
  root.appendChild(c);
}
function mkCodes(){ var out = []; for (var i = 0; i < 10; i++){ var r = rnd(5), s = ""; for (var j = 0; j < 5; j++) s += ("0" + r[j].toString(16)).slice(-2); out.push({ c: s.slice(0, 5) + "-" + s.slice(5), used: 0 }); } return out; }
function showCodes(codes){
  var b = openGS("Two-step sign-in", "Your backup codes", "Keep them somewhere safe. Each one works once.");
  var g = el("div", "codes"); codes.forEach(function(x){ g.appendChild(el("code", "", x.c)); }); b.appendChild(g);
  b.appendChild(foot(btn("pill soft", "Copy", function(){ try { navigator.clipboard.writeText(codes.map(function(x){ return x.c; }).join("\n")); toast("Copied"); } catch (e) {} }), btn("pill acc", "Done", function(){ closeGS(); renderSettings(); })));
}
function setupTfa(u){
  var sec = b32(rnd(20)), uri = "otpauth://totp/ThuraGirl:" + encodeURIComponent(u.email) + "?secret=" + sec + "&issuer=ThuraGirl&digits=6&period=30";
  var b = openGS("Two-step sign-in", "Scan this in your authenticator app", "Or type the key by hand.");
  var qb = el("div", "qrbox"), q = el("div", "qr"); qb.appendChild(q); qb.appendChild(el("code", "key", sec.match(/.{1,4}/g).join(" "))); b.appendChild(qb);
  qrSvg(uri).then(function(svg){ q.innerHTML = svg; }, function(){ q.textContent = "QR code didn't load. Type the key instead."; });
  var d = { c: "" }, g = el("div", "fgrid"); g.appendChild(fld("6-digit code from the app", "", { mode: "numeric", max: 6, wide: 1, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); d.c = inp.value; ok.disabled = d.c.length !== 6; } })); b.appendChild(g);
  var er = el("div", "ferrB"); b.appendChild(er);
  var ok = btn("pill acc", "Turn on", function(){ totpOk(sec, d.c).then(function(good){ if (!good){ er.textContent = "That code doesn't match. Check the phone's time is set automatically, and try the newest code."; return; } u.tfa = { secret: sec, at: Date.now(), codes: mkCodes() }; save(); toast("Two-step sign-in is on"); showCodes(u.tfa.codes); }); }); ok.disabled = true;
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), ok));
}
function tfaLogin(acc, done){
  var root = $("#su"), body = $(".su-body", root), form = el("form", "su-a"), qt = $(".su-qt", root);
  qt.textContent = ""; qt.appendChild(el("h2", "", "One more step.")); qt.appendChild(el("p", "", "Type the 6-digit code from your authenticator app, or a backup code."));
  var lab = el("label", "sr", "Code"), inp = el("input", "su-in"); inp.id = "li-code"; inp.autocomplete = "one-time-code"; inp.inputMode = "numeric"; inp.placeholder = "123456"; form.appendChild(lab); form.appendChild(inp);
  var err = el("div", "ferrB"); form.appendChild(err);
  var nb = el("button", "su-next"); nb.type = "submit"; nb.innerHTML = '<span class="lbl">Verify</span><svg class="i"><use href="#i-arrow"/></svg>'; form.appendChild(nb);
  form.addEventListener("submit", function(ev){
    ev.preventDefault(); var v = inp.value.trim().toLowerCase();
    var bc = (acc.tfa.codes || []).filter(function(x){ return !x.used && x.c === v; })[0];
    if (bc){ bc.used = Date.now(); save(); done(); return; }
    totpOk(acc.tfa.secret, v.replace(/\D/g, "")).then(function(g){ if (g) done(); else err.textContent = "That code doesn't match. Try the newest one."; });
  });
  var old = $("form", body); body.replaceChild(form, old); setTimeout(function(){ inp.focus(); }, 0);
}

/* plan and billing: the page is ready; payments go through Beam once Surf's backend is live */
var PLANS = [["standard", "Standard", 1999, ["Bookkeeping, up to 150 documents a month", "VAT, withholding and SSO prepared every month", "Chat and LINE, unlimited", "Company registration included"]],
  ["pro", "Pro", 3999, ["Everything in Standard, unlimited documents", "Filings submitted for you", "Year-end closing with the auditor", "Payroll and more than one company"]]];
function billingCard(u, root){
  var c = card("Your plan"), trialEnd = addDays(iso(new Date(u.created || Date.now())), 14), cur = u.plan || "";
  c.appendChild(el("p", "st-p", cur ? "You're on " + PLANS.filter(function(p){ return p[0] === cur; })[0][1] + (u.planPending ? ". Payment is waiting for checkout." : ".") : "Free trial until " + niceY(trialEnd) + ". Pick a plan whenever you're ready; nothing is charged until the trial ends."));
  var g = el("div", "plans");
  PLANS.forEach(function(p){
    var on = cur === p[0], b = el("div", "plan" + (on ? " on" : ""));
    var hd = el("div", "plh"); hd.appendChild(el("b", "", p[1])); if (p[0] === "standard") hd.appendChild(el("span", "tag", "Most popular")); b.appendChild(hd);
    var pr = el("div", "plp"); pr.appendChild(el("b", "num", baht(p[2]))); pr.appendChild(el("span", "", " a month")); b.appendChild(pr);
    var ul = el("ul"); p[3].forEach(function(f){ var li = el("li"); li.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; li.appendChild(document.createTextNode(f)); ul.appendChild(li); }); b.appendChild(ul);
    b.appendChild(btn("pill " + (on ? "soft" : "acc") + " wide", on ? "Your plan" : cur ? "Switch to " + p[1] : "Choose " + p[1], on ? null : function(){ checkout(u, p); }));
    g.appendChild(b);
  });
  c.appendChild(g);
  c.appendChild(el("p", "tnote", "Prices are launch prices in baht, VAT included. Early customers keep them."));
  root.appendChild(c);
  var pm = card("Payment and receipts");
  pm.appendChild(el("p", "st-p", u.planPending ? "Checkout is ready to open on Beam, our payment partner. Card details are typed on Beam's page, never in ThuraGirl." : "Pay by card or PromptPay through Beam, our payment partner. Card details are typed on Beam's page, never in ThuraGirl."));
  pm.appendChild(el("p", "st-p", "Tax invoices for each payment appear here."));
  if (cur){ var cx = btn("alt", "", function(){ delete u.plan; delete u.planPending; save(); renderSettings(); toast("Plan cancelled. The trial or current period runs to its end."); }); cx.innerHTML = "<u>Cancel the plan</u>"; pm.appendChild(cx); }
  root.appendChild(pm);
}
function checkout(u, p){
  var b = openGS("Plan", "Switch to " + p[1], baht(p[2]) + " a month, VAT included");
  b.appendChild(el("p", "st-p", "Next you go to Beam's secure checkout to pay by card or PromptPay. Your plan starts as soon as Beam confirms the payment, and renews every month until you cancel."));
  b.appendChild(el("p", "tnote", "Test build: Beam checkout is not connected yet, so this only records your choice."));
  b.appendChild(foot(btn("pill soft", "Not now", closeGS), btn("pill acc", "Continue to payment", function(){ u.plan = p[0]; u.planPending = true; save(); closeGS(); renderSettings(); toast(p[1] + " chosen. Payment opens when billing goes live."); })));
}

(function(){ var i = $("#b-in"); if (i) i.addEventListener("input", suggestNames); })();
