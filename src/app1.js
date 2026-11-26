(function(){
"use strict";
/* ThuraGirl test build. Everything is saved in this browser only. */
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
function el(tag, cls, text){ var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function money(n){ return Math.round(n).toLocaleString("en-US"); }
function baht(n){ return "฿" + money(n); }
function num(v){ var n = parseFloat(String(v).replace(/,/g, "")); return isFinite(n) ? n : NaN; }
function size(b){ return b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
var calm = false; try { calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
var CHECK = '<svg class="i"><use href="#i-check"/></svg>';
var MAX = 10 * 1048576;

/* ── storage ── */
var KEY = "tg.v2", db;
try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!db || !db.users) db = { users: {}, session: "" };
function save(){ try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
function me(){ return (db.session && db.users[db.session]) || null; }
function blankReg(){ return { names: ["", "", ""], objectives: "", fy: "12", capital: "", par: "", paid: "", people: [], office: { no: "", sub: "", dist: "", prov: "", zip: "" }, owner: "", applicant: "", signing: "", signers: [], seal: "", meeting: "", chair: "", auditor: { name: "", lic: "", fee: "" }, files: {}, submitted: false }; }
function digest(text){
  if (window.crypto && crypto.subtle && window.TextEncoder){
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function(buf){
      return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  var h = 5381; for (var i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return Promise.resolve("x" + (h >>> 0).toString(16));
}
function salt(){ var a = new Uint8Array(8); try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 8; i++) a[i] = Math.random() * 256; } return Array.prototype.map.call(a, function(b){ return ("0" + b.toString(16)).slice(-2); }).join(""); }

/* ── small ui helpers ── */
var toastT = 0;
var toastTr = function(s){ return s; };
function toast(msg){
  var t = $("#toast"); if (!t){ t = el("div", "toast"); t.id = "toast"; t.setAttribute("role", "status"); t.setAttribute("data-noi18n", ""); t.addEventListener("click", function(){ t.hidden = true; }); document.body.appendChild(t); }
  msg = String(msg || ""); var cut = msg.search(/[.!?] /), head = cut > 0 ? msg.slice(0, cut + 1) : msg, rest = cut > 0 ? msg.slice(cut + 2) : "";
  t.textContent = ""; t.className = "toast" + (rest || msg.length > 46 ? " card" : "");
  t.innerHTML = '<i class="tst-i"><svg class="i"><use href="#i-check"/></svg></i>';
  var tx = el("div", "tst-t"); tx.appendChild(el("b", "", toastTr(head).replace(/\.$/, ""))); if (rest) tx.appendChild(el("span", "", toastTr(rest))); t.appendChild(tx);
  t.hidden = false; t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toastT); toastT = setTimeout(function(){ t.hidden = true; }, rest ? 4200 : 2600);
}
function seg(opts, cur, on){
  var w = el("div", "ob-yn"); w.setAttribute("role", "group");
  opts.forEach(function(v){
    var b = el("button", "", v); b.type = "button"; b.setAttribute("aria-pressed", String(cur === v));
    b.addEventListener("click", function(){ $$("button", w).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); }); on(v); });
    w.appendChild(b);
  });
  return w;
}
function qrow(title, sub, opts, cur, on, cls){
  var row = el("div", "ob-row" + (cls || "")), tx = el("div", "tx"); tx.appendChild(el("b", "", title)); if (sub) tx.appendChild(el("span", "", sub));
  row.appendChild(tx); row.appendChild(seg(opts, cur, on)); return row;
}
// a labelled field. o.on(value) saves and may return an error message
function fld(label, val, o){
  o = o || {};
  var l = el("label", "fld" + (o.wide ? " wide" : "")); l.appendChild(el("span", "", label));
  var box = el("div", "fbox"); if (o.prefix) box.appendChild(el("i", "", o.prefix));
  var inp;
  if (o.options){ inp = el("select"); o.options.forEach(function(p){ var op = el("option", "", p[1]); op.value = p[0]; inp.appendChild(op); }); }
  else if (o.area) inp = el("textarea");
  else { inp = el("input"); inp.type = o.type || "text"; }
  inp.value = val == null ? "" : val; inp.autocomplete = "off";
  if (o.ph) inp.placeholder = o.ph; if (o.mode) inp.inputMode = o.mode; if (o.max) inp.maxLength = o.max; if (o.ro) inp.readOnly = true; if (o.maxDate) inp.max = o.maxDate;
  box.appendChild(inp); if (o.suffix) box.appendChild(el("i", "", o.suffix)); l.appendChild(box);
  if (o.type === "date") dateUI(inp, o);
  var er = el("small", "ferr"); l.appendChild(er);
  var run = function(){ var m = o.on ? o.on(inp.value, inp) : ""; er.textContent = m || ""; return m; };
  inp.addEventListener("input", run);
  if (o.saved) inp.addEventListener("change", function(){ if (!er.textContent) toast("Saved"); });
  return l;
}
function today(){ var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
function first(u){ return ((u && u.name) || "there").trim().split(/\s+/)[0]; }
function mascot(){ var d = document.createElement("div"); d.innerHTML = '<svg class="tg" width="48" height="50"><use href="#tg"/></svg>'; return d.firstChild; }

/* ── theme ── */
function applyTheme(){
  var u = me(), pref = (u && u.theme) || "auto", dark = false;
  try { dark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) {}
  var night = pref === "night" || (pref === "auto" && dark);
  $("#mock").setAttribute("data-mode", night ? "night" : "day");
  document.documentElement.classList.toggle("night", night);
}
try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme); } catch (e) {}

/* ── router ── */
var tab = "home", lastKey = "", PAGE = document.body.getAttribute("data-page") || "dashboard";
function toAuth(h){ if (PAGE === "signup") go(h); else location.href = "../signup/" + (h ? "#/" + h : ""); }
function go(path){ var h = "#/" + path; if (location.hash === h) route(); else location.hash = h; }
function route(){
  var r0 = (location.hash || "").replace(/^#\/?/, "");
  if (PAGE !== "signup" && (r0 === "demo" || /[?&]demo\b/.test(location.search))){ startDemo(); history.replaceState(null, "", location.pathname + "#/"); }
  var u = me(), r = (location.hash || "").replace(/^#\/?/, "");
  applyTheme(); demoBar(u);
  if (!u || !u.onboarded){
    if (PAGE !== "signup"){ location.replace("../signup/" + (!u && Object.keys(db.users).length ? "#/login" : "")); return; }
    $("#scr-auth").hidden = false; $("#app").hidden = true; closeAll(); lastKey = "";
    authMode = (!u && r === "login") ? "login" : "signup";
    if (u && suStep === 0) suStep = 1;
    renderAuth(); window.scrollTo(0, 0); return;
  }
  if (PAGE === "signup"){ location.replace("../dashboard/"); return; }
  $("#scr-auth").hidden = true; $("#app").hidden = false;
  tab = ["money", "brief", "settings", "register"].indexOf(r) >= 0 ? r : "home";
  if (tab === "register" && u.path !== "new") tab = "home";
  showTab();
}
window.addEventListener("hashchange", route);

/* ── sign up and sign in ── */
var TYPES = [["Restaurant","rest"],["Retail / Shopfront","shop"],["Online / E-commerce","online"],["Cafe / Bakery","cafe"],["Beauty / Salon","beauty"],["Services / Agency","serv"],["Manufacturing","mfg"],["Other","other"]];
var TAKEN = "0105537000123";
var DEMO = { "0105561023456": { name: "Bangkok Bites Co., Ltd.", addr: "88/12 Sukhumvit Soi 31, Watthana, Bangkok 10110" } };
var draft = { name: "", email: "", pw: "", agree: false }, suStep = 0, suMoved = false, authMode = "signup";
function suSteps(u){ return (u && u.path === "new") ? ["account", "fork", "four"] : ["account", "fork", "taxid", "type"]; }
function taxTaken(id, self){
  if (id === TAKEN) return true;
  for (var k in db.users) if (db.users[k] !== self && db.users[k].company && db.users[k].company.taxid === id) return true;
  return false;
}
function suGo(n){
  var u = me(); suStep = Math.max(u ? 1 : 0, suStep + n); suMoved = true;
  if (u && suStep >= suSteps(u).length){ u.onboarded = true; u.welcome = true; u.justIn = true; save(); suStep = 0; suMoved = false; go(""); return; }
  renderAuth();
}
function renderAuth(){
  var root = $("#su"), u = me(), S = suSteps(u), key = authMode === "login" ? "login" : S[suStep];
  root.textContent = "";
  var top = el("div", "su-top");
  var back = el("button", "su-back", "‹"); back.type = "button"; back.setAttribute("aria-label", "Back");
  back.disabled = key === "login" || suStep <= (u ? 1 : 0);
  back.addEventListener("click", function(){ suGo(-1); });
  var logo = el("div", "logo"); logo.innerHTML = '<svg class="tg" width="26" height="27"><use href="#tg"/></svg><span>thuragirl<i>.</i></span>';
  top.appendChild(back); top.appendChild(logo);
  if (key !== "login"){
    var prog = el("div", "su-prog"); for (var i = 0; i < S.length; i++) prog.appendChild(el("i", i <= suStep ? "on" : ""));
    top.appendChild(prog); top.appendChild(el("span", "su-count num", (suStep + 1) + " / " + S.length));
  }
  root.appendChild(top);

  var body = el("div", "su-body"), q = el("div", "su-q"), qt = el("div", "su-qt"), form = el("form", "su-a");
  form.setAttribute("novalidate", ""); q.appendChild(mascot());
  var valid = function(){ return true; }, next = null, firstInput = null, submit = function(){ suGo(1); };
  var err = el("div", "ferrB");
  function head(title, sub){ qt.appendChild(el("h2", "", title)); if (sub) qt.appendChild(el("p", "", sub)); }
  function nextBtn(label){ next = el("button", "su-next"); next.type = "submit"; next.innerHTML = '<span class="lbl">' + label + '</span><svg class="i"><use href="#i-arrow"/></svg>'; return next; }
  function field(id, ph, val, type, auto){
    var lab = el("label", "sr", ph); lab.htmlFor = id;
    var inp = el("input", "su-in"); inp.id = id; inp.type = type || "text"; inp.placeholder = ph; inp.autocomplete = auto || "off"; inp.value = val || "";
    form.appendChild(lab); if (!firstInput) firstInput = inp; return inp;
  }
  function pwField(id, ph, val, auto){
    var w = el("div", "ob-pw"), pw = field(id, ph, val, "password", auto); w.appendChild(pw);
    var eye = el("button", "eye"); eye.type = "button"; eye.setAttribute("aria-label", "Show password"); eye.innerHTML = '<svg class="i"><use href="#i-eye"/></svg>';
    eye.addEventListener("click", function(){ var show = pw.type === "password"; pw.type = show ? "text" : "password"; $("use", eye).setAttribute("href", show ? "#i-eyeoff" : "#i-eye"); });
    w.appendChild(eye); form.appendChild(w); return pw;
  }
  function check(){ if (next) next.disabled = !valid(); }
  function altLink(html, fn){ var a = el("button", "alt"); a.type = "button"; a.innerHTML = html; a.addEventListener("click", fn); return a; }

  if (key === "login"){
    head("Welcome back.", "Sign in to pick up where you left off.");
    var le = field("li-email", "Email", "", "email", "username"); form.appendChild(le);
    var lp = pwField("li-pass", "Password", "", "current-password");
    form.appendChild(err);
    [le, lp].forEach(function(n){ n.addEventListener("input", function(){ err.textContent = ""; check(); }); });
    valid = function(){ return !!le.value.trim() && !!lp.value; };
    submit = function(){
      var acc = db.users[le.value.trim().toLowerCase()];
      if (!acc){ err.textContent = "I can't find an account with that email in this browser."; return; }
      digest(acc.salt + lp.value).then(function(h){
        if (h !== acc.hash){ err.textContent = "That password doesn't match."; return; }
        var inNow = function(){ db.session = acc.email; acc.justIn = true; save(); suStep = acc.onboarded ? 0 : 1; go(""); };
        if (acc.tfa) tfaLogin(acc, inNow); else inNow();
      });
    };
    form.appendChild(nextBtn("Sign in"));
    if (pkOk()) form.appendChild(pkButton(err));
    form.appendChild(altLink(L("<u>Forgot your password?</u>", "<u>ลืมรหัสผ่าน?</u>"), function(){ openForgot(le.value, function(em){ le.value = em; lp.value = ""; check(); try { lp.focus(); } catch (e) {} }); }));
    form.appendChild(altLink("New here? <u>Create an account</u>", function(){ go("signup"); }));
  } else if (key === "account"){
    head("Let's get you in.", "It takes about a minute. Everything else can wait until you are inside.");
    var nm = field("su-name", "Your name", draft.name, "text", "name"); form.appendChild(nm);
    var em = field("su-email", "Email", draft.email, "email", "email"); form.appendChild(em);
    var pw = pwField("su-pass", "Create a password", draft.pw, "new-password");
    var rule = el("div", "su-hint ob-rule"); form.appendChild(rule);
    var ok = el("label", "shB-ok ob-ok"), cb = el("input"); cb.type = "checkbox"; cb.checked = draft.agree;
    var okt = el("span"); okt.innerHTML = "I accept the <u>Terms</u> and the <u>PDPA privacy notice</u>.";
    ok.appendChild(cb); ok.appendChild(okt); form.appendChild(ok); form.appendChild(err);
    $$("u", okt).forEach(function(n){ n.setAttribute("role", "link"); n.tabIndex = 0; n.addEventListener("click", function(ev){ ev.preventDefault(); ev.stopPropagation(); openTerms(); }); n.addEventListener("keydown", function(ev){ if (ev.key === "Enter"){ ev.preventDefault(); openTerms(); } }); });
    var syncA = function(){
      draft.name = nm.value; draft.email = em.value; draft.pw = pw.value; draft.agree = cb.checked; err.textContent = "";
      var long = draft.pw.length >= 8; rule.textContent = long ? "✓ 8 or more characters" : "At least 8 characters"; rule.classList.toggle("off", !long);
      check();
    };
    [nm, em, pw].forEach(function(n){ n.addEventListener("input", syncA); }); cb.addEventListener("change", syncA);
    valid = function(){ return !!draft.name.trim() && /^\S+@\S+\.\S+$/.test(draft.email.trim()) && draft.pw.length >= 8 && draft.agree; };
    submit = function(){
      var email = draft.email.trim().toLowerCase();
      if (db.users[email]){ err.textContent = "That email already has an account. Sign in instead."; return; }
      var s = salt();
      digest(s + draft.pw).then(function(h){
        db.users[email] = { name: draft.name.trim(), email: email, salt: s, hash: h, created: Date.now(), onboarded: false, path: "", company: { taxid: "", name: "", addr: "", type: "" }, four: {},
          setup: { vat: "", sso: "", conn: {}, verify: null }, banks: [], hasData: false, stmt: null, done: {}, welcome: false, briefSeen: false, theme: "auto", reg: blankReg() };
        db.session = email; save(); draft = { name: "", email: "", pw: "", agree: false }; suStep = 0; suGo(1);
      });
    };
    form.appendChild(nextBtn("Create account")); syncA();
    form.appendChild(altLink("Already have an account? <u>Sign in</u>", function(){ go("login"); }));
    form.appendChild(el("p", "tnote", "Test build: your details stay in this browser and are not sent anywhere. Please use a made-up password."));
  } else if (key === "fork"){
    head("Do you already have a company, " + first(u) + "?", "Either way, I handle the paperwork.");
    [["have", "Yes, it is registered", "I set it up from your 13-digit tax ID."], ["new", "Not yet", "I register one for you with DBD. It is included in every plan."]].forEach(function(o){
      var b = el("button", "su-choice"); b.type = "button";
      b.appendChild(el("b", "", o[1])); b.appendChild(el("span", "", o[2]));
      b.insertAdjacentHTML("beforeend", '<svg class="i su-chev"><use href="#i-chevr"/></svg>');
      b.addEventListener("click", function(){ u.path = o[0]; save(); suGo(1); });
      form.appendChild(b);
    });
  } else if (key === "taxid"){
    head("What is the company tax ID?", "The 13 digits on your company certificate.");
    var c = u.company;
    var tx = field("su-tax", "13-digit tax ID", c.taxid); tx.classList.add("ob-tax"); tx.inputMode = "numeric"; tx.maxLength = 13; form.appendChild(tx);
    var tr = el("div", "su-hint ob-rule"); form.appendChild(tr);
    var demoL = altLink("No tax ID to hand? <u>Use the demo company</u>", function(){ tx.value = "0105561023456"; cn.value = ""; ad.value = ""; syncT(); });
    form.appendChild(demoL);
    var found = el("div", "ob-found"), fh = el("div", "ob-fh"); found.appendChild(fh);
    var mk = function(id, label, val){ var l = el("label", "ob-f"); l.appendChild(el("span", "", label)); var n = el("input"); n.id = id; n.type = "text"; n.value = val; n.autocomplete = "off"; l.appendChild(n); found.appendChild(l); return n; };
    var cn = mk("su-cname", "Registered company name", c.name), ad = mk("su-addr", "Registered address", c.addr);
    form.appendChild(found);
    var syncT = function(){
      tx.value = tx.value.replace(/\D/g, "").slice(0, 13);
      var n = tx.value.length, dup = n === 13 && taxTaken(tx.value, u), d = DEMO[tx.value];
      if (d && !cn.value && !ad.value){ cn.value = d.name; ad.value = d.addr; }
      c.taxid = tx.value; c.name = cn.value; c.addr = ad.value; save();
      tr.textContent = n < 13 ? n + " of 13 digits" : dup ? "This company is already on ThuraGirl. Sign in instead." : "✓ 13 digits";
      tr.classList.toggle("off", n < 13); tr.classList.toggle("err", dup);
      found.hidden = !(n === 13 && !dup); demoL.hidden = n === 13;
      fh.innerHTML = d ? CHECK + "Demo company found. Fix anything that is out of date." : "Add the name and address exactly as registered.";
      check();
    };
    [tx, cn, ad].forEach(function(n){ n.addEventListener("input", syncT); });
    valid = function(){ return c.taxid.length === 13 && !taxTaken(c.taxid, u) && c.name.trim().length >= 2 && c.addr.trim().length >= 5; };
    form.appendChild(nextBtn("Continue")); syncT();
  } else if (key === "type"){
    head("Last one. What kind of business?", "So I can pick the right tax forms, accounts and vendor categories for you.");
    var grid = el("div", "ob-types");
    TYPES.forEach(function(t){
      var b = el("button", "ob-type"); b.type = "button"; b.setAttribute("aria-pressed", String(u.company.type === t[0]));
      b.innerHTML = '<svg class="i"><use href="#i-t-' + t[1] + '"/></svg>'; b.appendChild(el("span", "", t[0]));
      b.addEventListener("click", function(){
        u.company.type = t[0]; save(); $$(".ob-type", grid).forEach(function(x){ x.setAttribute("aria-pressed", String(x === b)); });
        setTimeout(function(){ suGo(1); }, calm ? 0 : 240);
      });
      grid.appendChild(b);
    });
    form.appendChild(grid);
  } else if (key === "four"){
    head("Four quick questions", "They tell me which papers DBD will ask for. You add the papers later, from inside the app.");
    var rows = el("div", "ob-rows");
    [["foreign", "Is any shareholder or director not Thai?", ["Yes", "No"]], ["licence", "Does the business need a specific licence?", ["Yes", "No"]],
     ["premises", "Are the premises rented or owned?", ["Rented", "Owned"]], ["thaiid", "Do all founders have a Thai ID that works for online identity checks?", ["Yes", "No"]]].forEach(function(r){
      rows.appendChild(qrow(r[1], "", r[2], u.four[r[0]], function(v){ u.four[r[0]] = v; save(); check(); }, " q"));
    });
    form.appendChild(rows);
    valid = function(){ return !!(u.four.foreign && u.four.licence && u.four.premises && u.four.thaiid); };
    form.appendChild(nextBtn("Take me in"));
  }
  form.addEventListener("submit", function(ev){ ev.preventDefault(); if (valid()) submit(); });
  check();
  q.appendChild(qt); body.appendChild(q); body.appendChild(form); root.appendChild(body);
  if (suMoved && firstInput) setTimeout(function(){ try { firstInput.focus({ preventScroll: true }); } catch (e) {} }, 0);
}
