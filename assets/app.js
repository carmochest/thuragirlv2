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
function toast(msg){
  var t = $("#toast"); if (!t){ t = el("div", "toast"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function(){ t.hidden = true; }, 2600);
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
  var u = me(), r = (location.hash || "").replace(/^#\/?/, "");
  applyTheme();
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

/* ── the app shell ── */
function closeAll(){ ["#b-sheet", "#b-setup", "#kyc", "#up-sheet"].forEach(function(s){ var n = $(s); if (n) n.hidden = true; }); }
function coName(u){ if (u.path === "new"){ var n = u.reg.names[0].trim(); return n ? "บริษัท " + n + " จำกัด" : "New company"; } return u.company.name || "My company"; }
function initials(s){ var w = s.replace(/^บริษัท\s*/, "").replace(/\s*จำกัด$/, "").trim().split(/\s+/), a = (w[0] || "?").charAt(0), b = w[1] ? w[1].charAt(0) : (w[0] || "").charAt(1); return (a + (b || "")).toUpperCase(); }
function showTab(){
  var u = me(), app = $("#app");
  app.classList.toggle("nodata", !u.hasData);
  ["home", "money", "brief", "settings", "register"].forEach(function(t){ $("#b-" + t).hidden = t !== tab; });
  $("#b-back").hidden = tab === "home";
  $("#b-money-btn").setAttribute("aria-pressed", String(tab === "money"));
  $("#b-brief-btn").setAttribute("aria-pressed", String(tab === "brief"));
  $(".dockB").hidden = tab === "settings" || tab === "register";
  $("#b-co-n").textContent = coName(u); $("#b-co-i").textContent = initials(coName(u));
  if (tab === "brief" && u.hasData && !u.briefSeen){ u.briefSeen = true; save(); }
  $("#b-brief-dot").hidden = !!u.briefSeen || !u.hasData;
  paintHome();
  if (tab === "money"){ renderMoney(); paintLists(u); paintContacts(u); }
  if (tab === "brief") renderBrief();
  if (tab === "settings") renderSettings();
  if (tab === "register") renderRegister();
  var cs = chips(); $$("#b-sug button").forEach(function(b, i){ b.textContent = cs[i]; });
  var key = db.session + ":" + tab + ":" + (u.hasData ? 1 : 0);
  if (key !== lastKey){ closeAll(); play(); window.scrollTo(0, 0); }
  lastKey = key;
  maybeConnect(u);
}
function play(){
  var u = me(), pg = $("#b-" + tab);
  if (!calm){ pg.classList.remove("in"); void pg.offsetWidth; pg.classList.add("in"); }
  var B = books(u); if (!B) return;
  if (tab === "money") countUp($("#m-val"), Math.abs(B.fin[per].rev - B.fin[per].exp), 700);
  if (tab === "home"){ restDay(); countUp($("#b-val"), TOTAL, 900); }
}

/* ── home: cash line ── */
var CDAYS = [], CASH = [1731500,1738200,1744900,1741300,1752600,1761000,1757400,1722800,1729500,1741100,1750700,1763900,1771200,1768000,1779400,
            1790600,1786100,1797300,1808800,1802500,1774900,1783600,1795000,1806700,1815300,1811800,1824400,1833000,1836900,1842300];
var N = CASH.length, TOTAL = CASH[N - 1], raf = 0, lo = Math.min.apply(null, CASH), hi = Math.max.apply(null, CASH);
function pt(i){ return [i / (N - 1) * 600, 88 - (CASH[i] - lo) / (hi - lo) * 76]; }
function buildSpark(){
  var P = [], i; for (i = 0; i < N; i++) P.push(pt(i));
  var d = "M" + P[0][0] + " " + P[0][1].toFixed(1);
  for (i = 0; i < N - 1; i++){
    var a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], e = P[Math.min(N - 1, i + 2)];
    d += " C" + (b[0] + (c[0] - a[0]) / 6).toFixed(1) + " " + (b[1] + (c[1] - a[1]) / 6).toFixed(1) + " " + (c[0] - (e[0] - b[0]) / 6).toFixed(1) + " " + (c[1] - (e[1] - b[1]) / 6).toFixed(1) + " " + c[0].toFixed(1) + " " + c[1].toFixed(1);
  }
  $("#b-line").setAttribute("d", d); $("#b-area").setAttribute("d", d + " L600 100 L0 100 Z"); mark(N - 1);
}
function mark(i){ var p = pt(i), dot = $("#b-dot"), x = $("#b-x"); dot.style.left = x.style.left = (p[0] / 6) + "%"; dot.style.top = p[1] + "%"; }
function showDay(i){
  cancelAnimationFrame(raf); var ago = N - 1 - i;
  $("#b-val").textContent = money(CASH[i]);
  $("#b-dtxt").textContent = CDAYS[i] ? nice(CDAYS[i]) : ago === 0 ? "Today" : ago === 1 ? "Yesterday" : ago + " days ago";
  $("#b-delta").classList.add("scrub"); $("#b-spark").classList.add("on"); mark(i);
}
function restDay(){ var B = books(me()), d = B && B.cashD; $("#b-val").textContent = money(TOTAL); $("#b-dtxt").textContent = d == null ? (B ? "As of " + nice(B.asOf) : "") : (d >= 0 ? "Up " : "Down ") + pctTxt(d) + " this month"; $("#b-delta").classList.toggle("down", d != null && d < 0); $("#b-delta").classList.remove("scrub"); $("#b-spark").classList.remove("on"); mark(N - 1); }
function countUp(val, to, ms){
  cancelAnimationFrame(raf); if (calm){ val.textContent = money(to); return; }
  var t0 = 0, from = to * 0.94;
  raf = requestAnimationFrame(function tick(t){ if (!t0) t0 = t; var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); val.textContent = money(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(tick); });
}

/* ── home: banks ── */
function ago(ts, long){
  var m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return long ? m + (m === 1 ? " minute ago" : " minutes ago") : m + "m ago";
  var h = Math.floor(m / 60); if (h < 24) return long ? h + (h === 1 ? " hour ago" : " hours ago") : h + "h ago";
  var d = Math.floor(h / 24); return long ? d + (d === 1 ? " day ago" : " days ago") : d + "d ago";
}
function isStale(ts){ return Date.now() - ts > 36 * 3600e3; }
function fullAcct(a){ return a.length > 6 ? a.slice(0, 3) + " " + a.slice(3, 6) + " " + a.slice(6) : a; }
function paintBanks(){
  var u = me(), bar = $("#b-bkbar"), panel = $("#b-bkpanel");
  bar.innerHTML = u.banks.map(function(b){ return "<span><b>" + esc(b.bank) + '</b><em class="' + (isStale(b.at) ? "stale" : "") + '">' + ago(b.at) + "</em></span>"; }).join("") + '<svg class="i"><use href="#i-chev"/></svg>';
  panel.textContent = "";
  u.banks.forEach(function(b){
    var row = el("div", "bkrow"); row.appendChild(el("div", "nm", b.bank));
    var meta = el("div", "meta"), acc = el("span", "num acc", "···· " + b.acct.slice(-4)); meta.appendChild(acc);
    if (b.acct.length > 4){
      var eye = el("button", "eye"); eye.type = "button"; eye.setAttribute("aria-label", "Show " + b.bank + " account number"); eye.setAttribute("aria-pressed", "false"); eye.innerHTML = '<svg class="i"><use href="#i-eye"/></svg>';
      eye.addEventListener("click", function(){ var show = eye.getAttribute("aria-pressed") !== "true"; eye.setAttribute("aria-pressed", String(show)); acc.textContent = show ? fullAcct(b.acct) : "···· " + b.acct.slice(-4); $("use", eye).setAttribute("href", show ? "#i-eyeoff" : "#i-eye"); });
      meta.appendChild(eye);
    }
    meta.appendChild(el("span", "syn" + (isStale(b.at) ? " stale" : ""), (b.to ? "Up to " + nice(b.to) + " · " : "") + "uploaded " + ago(b.at, true))); row.appendChild(meta);
    var up = el("button", "pill up " + (isStale(b.at) ? "acc" : "soft"), "Upload"); up.type = "button"; up.addEventListener("click", function(){ openUpload(b); });
    row.appendChild(up); panel.appendChild(row);
  });
  var add = el("button", "alt", ""); add.type = "button"; add.innerHTML = "<u>Add another bank</u>"; add.style.padding = "10px 6px"; add.addEventListener("click", function(){ openUpload(); }); panel.appendChild(add);
}

/* ── home: tasks, setup reminder, welcome ── */
function collapse(n){ n.style.height = n.offsetHeight + "px"; void n.offsetHeight; n.classList.add("gone"); n.style.height = "0px"; setTimeout(function(){ n.hidden = true; }, calm ? 0 : 380); }
function setupLeft(u){ return (u.setup.vat && u.setup.sso ? 0 : 1) + (Object.keys(u.setup.conn).length ? 0 : 1) + (u.setup.verify ? 0 : 1); }
function setCount(){
  var u = me(), n = $$(".needB .tk").filter(function(r){ return !r.hidden && !r.classList.contains("gone") && !r.classList.contains("going") && (u.hasData || r.id === "b-setuprow"); }).length;
  $("#b-cnt").textContent = n; $("#b-clear").hidden = n !== 0;
  $("#b-clear-t").textContent = u.hasData ? "You're all caught up" : "Nothing needs you yet";
  $("#b-clear-m").textContent = u.hasData ? "Nothing else needs you today." : "Upload a bank statement and I will find what does.";
  $("#b-reset").hidden = true;
}
function paintSetup(){
  var u = me(), isNew = u.path === "new", n = isNew ? regLeft(u) : setupLeft(u), things = n === 1 ? "1 quick thing" : n + " quick things";
  var row = $("#b-setuprow"); row.classList.remove("gone", "going"); row.style.height = ""; row.hidden = isNew ? !!u.reg.submitted : n === 0;
  $("#b-setup-t").textContent = isNew ? "Register your company" : "Finish setting up your company";
  $("#b-setup-m").textContent = isNew ? (n ? n + " of 5 parts still need you" : "Ready to submit") : things + " left";
  $("#b-setup-btn").textContent = isNew ? "Continue" : "Set up";
  $("#b-wel").hidden = !u.welcome;
  $("#b-wel-t").textContent = "You're in, " + first(u) + ".";
  $("#b-wel-m").textContent = isNew ? (u.reg.submitted ? "Your registration is in. Have a look around." : "Have a look around. Registering the company is five short parts, whenever you are ready.")
    : n ? "Have a look around. " + things + (n === 1 ? " is" : " are") + " left, whenever you are ready." : "Have a look around. Setup is complete.";
  var goB = $("#b-wel-go"); goB.textContent = isNew ? "Register" : "Finish setup"; goB.hidden = isNew ? !!u.reg.submitted : n === 0;
}
function paintHome(){
  var u = me();
  if (u.hasData && !(u.tx && u.tx.length)){ u.hasData = false; save(); $("#app").classList.add("nodata"); }
  autoRecords(u); paintSetup(); paintBanks(); paintHero(u); paintNeeds(u); setCount(); paintEmpty(u);
}
function openSetupTask(){ var u = me(); if (u.path === "new") go("register"); else openSetup(); }

/* ── upload a bank statement ── */
var BANKS = ["K-Bank", "SCB", "Bangkok Bank", "Krungsri", "Krungthai", "ttb", "Other"], up = { file: null, bank: "", acct: "", err: "" };
function takeFile(f){
  up.err = ""; up.parsed = null; up.close = "";
  var ext = (f.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") up.err = "I can't read PDF statements in this test build yet. Download a CSV or Excel file from your bank's app or website instead.";
  else if (["csv", "xlsx", "xls", "txt"].indexOf(ext) < 0) up.err = "That file type doesn't work here. Use CSV or Excel.";
  else if (f.size > MAX) up.err = "That file is " + size(f.size) + ". The limit is 10 MB.";
  if (up.err){ up.file = null; renderUpload(); return; }
  up.file = { name: f.name, size: f.size, reading: true }; renderUpload();
  var done = function(p){ if (!up.file || up.file.name !== f.name) return; up.file.reading = false; if (p.err){ up.err = p.err; up.file = null; } else { up.parsed = p; if (p.acct && !up.acct) up.acct = p.acct; } renderUpload(); };
  var fail = function(){ done({ err: "I couldn't open that file. Check that it is a CSV or Excel statement." }); };
  var fr = new FileReader();
  if (ext === "csv" || ext === "txt"){ fr.onload = function(){ try { done(readTable(splitCsv(String(fr.result)))); } catch (e) { fail(); } }; fr.onerror = fail; fr.readAsText(f); }
  else { fr.onload = function(){ readSheet(new Uint8Array(fr.result)).then(done, fail); }; fr.onerror = fail; fr.readAsArrayBuffer(f); }
}
function renderUpload(){
  var body = $("#up-body"); body.textContent = "";
  var drop = el("button", "drop" + (up.file ? " has" : "")); drop.type = "button";
  if (up.file){
    var P = up.parsed, extra = up.file.reading ? "Reading…" : P ? P.tx.length + " transactions, " + niceY(P.tx[0].d) + " to " + niceY(P.tx[P.tx.length - 1].d) + (P.hasBal ? ", closing balance " + baht(P.tx[P.tx.length - 1].b) : "") : size(up.file.size);
    drop.innerHTML = '<svg class="i"><use href="#i-doc"/></svg>'; drop.appendChild(el("span", "", up.file.name)); drop.appendChild(el("small", "", extra + " · tap to change"));
  } else { drop.innerHTML = '<svg class="i"><use href="#i-up"/></svg><span>Choose a file or drop it here</span><small>CSV or Excel from your bank, up to 10 MB</small>'; }
  drop.addEventListener("click", function(){ $("#up-file").click(); });
  drop.addEventListener("dragover", function(ev){ ev.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function(){ drop.classList.remove("over"); });
  drop.addEventListener("drop", function(ev){ ev.preventDefault(); var f = ev.dataTransfer && ev.dataTransfer.files[0]; if (f) takeFile(f); });
  body.appendChild(drop);
  var g = el("div", "fgrid"), okBtn, needClose = up.parsed && !up.parsed.hasBal;
  var sync = function(){ if (okBtn) okBtn.disabled = !(up.parsed && up.bank && /^\d{4,15}$/.test(up.acct) && (!needClose || isFinite(num(up.close)))); };
  g.appendChild(fld("Bank", up.bank, { options: [["", "Choose a bank"]].concat(BANKS.map(function(b){ return [b, b]; })), on: function(v){ up.bank = v; sync(); } }));
  g.appendChild(fld("Account number", up.acct, { mode: "numeric", max: 15, ph: "Digits only", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); up.acct = inp.value; sync(); return up.acct && up.acct.length < 4 ? "At least the last 4 digits" : ""; } }));
  if (needClose) g.appendChild(fld("Balance at the end of this statement", up.close, { wide: 1, prefix: "฿", mode: "decimal", ph: "The file has no balance column", on: function(v, inp){ inp.value = v.replace(/[^\d.\-]/g, ""); up.close = inp.value; sync(); } }));
  body.appendChild(g);
  var er = el("div", "ferrB", up.err); body.appendChild(er);
  var f = el("div", "shB-f"), samp = el("button", "pill soft", "Use the sample"); samp.type = "button";
  samp.addEventListener("click", function(){ var p = readTable(splitCsv(sampleCsv())); up = { file: { name: "sample-kbank-statement.csv", size: 0 }, parsed: p, bank: "K-Bank", acct: p.acct || "0483511234", err: "", sample: true, close: "" }; renderUpload(); });
  okBtn = el("button", "pill acc", "Upload"); okBtn.type = "button";
  okBtn.addEventListener("click", function(){
    var u = me(), r = addStatement(u, up.bank, up.acct, up.parsed, needClose ? num(up.close) : null);
    if (up.sample){ sampleBooks(u); u.sample = true; }
    save(); BK_CACHE.key = "";
    var msg = r.added + " transactions read" + (r.matched ? ", " + r.matched + " payments matched" : "") + ".";
    $("#up-sheet").hidden = true; up = { file: null, bank: "", acct: "", err: "" }; lastKey = ""; if (tab !== "home") go(""); else showTab(); toast(msg);
  });
  f.appendChild(samp); f.appendChild(okBtn); body.appendChild(f); sync();
  body.appendChild(el("p", "tnote", "Your bank's app or website can export statements as CSV or Excel. The file is read here, in your browser, and is not sent anywhere."));
}
function openUpload(b){
  if (gated(me())){ toast("Register the company first. Statements open after that."); go("register"); return; }
  up = { file: null, bank: b ? b.bank : "", acct: b ? b.acct : "", err: "" }; renderUpload();
  var s = $("#up-sheet"); s.hidden = false; try { $("#up-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {}
}

/* ── money ── */
var per = "mtd";
function tickL(n){ return n === 0 ? "0" : n >= 1e6 ? (n / 1e6) + "M" : (n / 1e3) + "K"; }
function niceStep(max){ var pow = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), c = [1, 2, 5, 10]; for (var i = 0; i < c.length; i++) if (max / (c[i] * pow) <= 4) return c[i] * pow; return 10 * pow; }
function mix(root, rows, cls){
  root.textContent = ""; var total = rows.reduce(function(a, r){ return a + r[1]; }, 0), top = Math.max.apply(null, rows.map(function(r){ return r[1]; }));
  rows.forEach(function(r){ var d = el("div", "mx"); d.appendChild(el("span", "mx-n", r[0])); d.appendChild(el("span", "mx-v num", baht(r[1]))); d.appendChild(el("span", "mx-p num", Math.round(r[1] / total * 100) + "%")); var bar = el("i", "mx-b" + cls); bar.style.width = (r[1] / top * 100) + "%"; d.appendChild(bar); root.appendChild(d); });
}
function renderMoney(){
  var B = books(me()); if (!B) return;
  var F = B.fin[per], profit = F.rev - F.exp;
  $("#m-lab").textContent = F.lab; $("#m-val").textContent = money(Math.abs(profit)); $("#m-val").previousElementSibling.textContent = profit < 0 ? "−฿" : "฿";
  $("#m-dtxt").textContent = F.d == null ? "From " + nice(F.from) + " to " + nice(F.to) : (F.d >= 0 ? "Up " : "Down ") + pctTxt(F.d) + " " + F.vs; $("#m-dtxt").parentNode.classList.toggle("down", F.d != null && F.d < 0);
  $("#m-mg").textContent = F.rev ? (profit / F.rev * 100).toFixed(1) + "% margin" : "";
  $("#m-in").textContent = baht(F.rev); $("#m-out").textContent = baht(F.exp);
  var top = Math.max(1, Math.max.apply(null, F.flow.map(function(r){ return Math.max(r[1], r[2]); }))), step = niceStep(top), max = Math.ceil(top / step) * step;
  var grid = $("#m-grid"), cols = $("#m-cols"), xs = $("#m-x"), tip = $("#m-tip"), tbl = $("#m-tbl");
  grid.textContent = ""; cols.textContent = ""; xs.textContent = ""; tip.hidden = true;
  for (var v = 0; v <= max; v += step){ var g = el("span"); g.style.bottom = (v / max * 100) + "%"; g.appendChild(el("em", "", tickL(v))); grid.appendChild(g); }
  tbl.innerHTML = "<caption>Money in and out</caption><tr><th>Period</th><th>In</th><th>Out</th><th>Kept</th></tr>";
  F.flow.forEach(function(r){
    var b = el("button", "bcol"); b.type = "button"; b.setAttribute("aria-label", r[0] + ": in " + baht(r[1]) + ", out " + baht(r[2]) + ", kept " + baht(r[1] - r[2]));
    var pair = el("span", "bpair"), i1 = el("i", "in"), i2 = el("i", "out"); i1.style.height = (r[1] / max * 100) + "%"; i2.style.height = (r[2] / max * 100) + "%"; pair.appendChild(i1); pair.appendChild(i2); b.appendChild(pair);
    var show = function(){
      tip.innerHTML = ""; tip.appendChild(el("b", "", r[0]));
      [["in", "In", r[1]], ["out", "Out", r[2]], ["", "Kept", r[1] - r[2]]].forEach(function(x){ var line = el("span"); if (x[0]) line.appendChild(el("i", "swc " + x[0])); line.appendChild(document.createTextNode(x[1])); line.appendChild(el("em", "", baht(x[2]))); tip.appendChild(line); });
      tip.hidden = false; var W = cols.clientWidth, w = tip.offsetWidth, cx = b.offsetLeft + b.offsetWidth / 2, gap = pair.offsetWidth / 2 + 10;
      tip.style.left = (cx + gap + w <= W ? cx + gap : Math.max(0, cx - gap - w)) + "px";
    }, hide = function(){ tip.hidden = true; };
    b.addEventListener("pointerenter", show); b.addEventListener("focus", show); b.addEventListener("click", show); b.addEventListener("pointerleave", hide); b.addEventListener("blur", hide);
    cols.appendChild(b); xs.appendChild(el("span", "", r[0]));
    var tr = el("tr"); [r[0], baht(r[1]), baht(r[2]), baht(r[1] - r[2])].forEach(function(c){ tr.appendChild(el("td", "", c)); }); tbl.appendChild(tr);
  });
  mix($("#m-rev"), F.revMix, ""); mix($("#m-exp"), F.expMix, " out");
  $("#m-vat").previousElementSibling.lastChild.textContent = me().setup.vat === "No" ? "Not VAT registered" : "Monthly VAT, net payable (estimate)";
  $("#m-vat").textContent = baht(F.tax[0]); $("#m-wht").textContent = baht(F.tax[1]); $("#m-corp").textContent = baht(F.tax[2]); $("#m-tax").textContent = baht(F.tax[0] + F.tax[1] + F.tax[2]);
}

/* ── setup that follows signup (registered company) ── */
function stSec(title, tag, done){
  var sec = el("div", "st-sec"), h = el("div", "st-h"); h.appendChild(el("b", "", title));
  if (done) h.insertAdjacentHTML("beforeend", '<span class="st-ok">' + CHECK + "Done</span>"); else if (tag) h.appendChild(el("span", "st-tag", tag));
  sec.appendChild(h); return sec;
}
function connRows(u, again){ return connList(u, again, true); }
function vatRows(u, again){
  var r = el("div", "ob-rows");
  r.appendChild(qrow("VAT registered", "You charge 7% VAT and file PP.30", ["Yes", "No"], u.setup.vat, function(v){ u.setup.vat = v; save(); again(); }));
  r.appendChild(qrow("Social security (SSO)", "Your employees are enrolled", ["Yes", "No"], u.setup.sso, function(v){ u.setup.sso = v; save(); again(); }));
  return r;
}
function verifyBlock(u, again){
  var w = el("div", "st-sec");
  if (u.setup.verify){ var g = el("div", "ob-got"); g.innerHTML = CHECK; g.appendChild(el("span", "", "Received: " + u.setup.verify.name + " (" + size(u.setup.verify.size) + ")")); w.appendChild(g); }
  else w.appendChild(el("p", "st-p", "One photo or PDF of your company certificate, up to 10 MB."));
  var v = el("button", "pill soft act"); v.type = "button"; v.innerHTML = '<svg class="i"><use href="#i-lock"/></svg>' + (u.setup.verify ? "Replace the file" : "Verify now");
  v.addEventListener("click", function(){ openKyc("Company certificate", "One PDF or image, up to 10 MB. Make sure the company name and tax ID are readable.", function(meta){ u.setup.verify = meta; save(); again(); toast("Company certificate received"); }); });
  w.appendChild(v); return w;
}
function renderSetup(){
  var u = me(), b = $("#st-body"), again = function(){ renderSetup(); paintSetup(); setCount(); }; b.textContent = "";
  $("#st-sub").textContent = "Three quick things. They also live in Settings, so there is no rush.";
  var s1 = stSec("VAT and social security", "Before your first filing", !!(u.setup.vat && u.setup.sso)); s1.appendChild(vatRows(u, again)); b.appendChild(s1);
  var s2 = stSec("Connect your accounts", "Optional", Object.keys(u.setup.conn).length > 0); s2.appendChild(connRows(u, again)); b.appendChild(s2);
  var s3 = stSec("Verify your company", "Optional", !!u.setup.verify), vb = verifyBlock(u, again); while (vb.firstChild) s3.appendChild(vb.firstChild); b.appendChild(s3);
}
function openSetup(){ renderSetup(); var s = $("#b-setup"); s.hidden = false; try { $("#st-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }

/* ── documents: handed to a verification partner. Here the file is checked and only its name and size are kept ── */
var kycT = 0, kycCb = null, kycDoc = ["", ""], kycFile = null;
function kycStage(st, err){
  var b = $("#kyc-body"); b.textContent = ""; clearTimeout(kycT);
  if (st === "pick"){
    b.appendChild(el("h3", "", kycDoc[0])); b.appendChild(el("p", "", kycDoc[1]));
    if (err) b.appendChild(el("div", "ferrB", err));
    [["#kyc-cam", "i-cam", "Take a photo", "Use your camera"], ["#kyc-file", "i-doc", "Upload a file", "PDF, JPG or PNG"]].forEach(function(o){
      var x = el("button", "kyc-opt"); x.type = "button"; x.innerHTML = '<svg class="i"><use href="#' + o[1] + '"/></svg>'; var t = el("span", "", o[2]); t.appendChild(el("small", "", o[3])); x.appendChild(t);
      x.addEventListener("click", function(){ $(o[0]).click(); }); b.appendChild(x);
    });
  } else if (st === "check"){
    var w = el("div", "kyc-ok"); w.innerHTML = '<span class="dotsT" aria-hidden="true"><i></i><i></i><i></i></span>'; w.appendChild(el("h3", "", "Checking the document")); w.appendChild(el("p", "", "This takes a few seconds.")); b.appendChild(w);
    kycT = setTimeout(function(){ kycStage("ok"); }, calm ? 0 : 1200);
  } else {
    var o2 = el("div", "kyc-ok"); o2.innerHTML = '<span class="ck">' + CHECK + "</span>"; o2.appendChild(el("h3", "", "Looks good")); o2.appendChild(el("p", "", kycFile.name + " · " + size(kycFile.size)));
    var d = el("button", "pill acc", "Done"); d.type = "button"; d.addEventListener("click", function(){ var cb = kycCb, f = kycFile; closeKyc(); if (cb) cb(f); }); o2.appendChild(d); b.appendChild(o2);
  }
}
function kycTake(inp){
  var f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
  if (!(f.type === "application/pdf" || /^image\//.test(f.type))) return kycStage("pick", "Only a PDF or an image works here.");
  if (f.size > MAX) return kycStage("pick", "That file is " + size(f.size) + ". The limit is 10 MB.");
  kycFile = { name: f.name, size: f.size }; kycStage("check");
}
function openKyc(title, sub, cb){ kycDoc = [title, sub]; kycCb = cb; var k = $("#kyc"); k.hidden = false; kycStage("pick"); try { $("#kyc-x").focus({ preventScroll: true }); $(".kyc-card").scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeKyc(){ clearTimeout(kycT); $("#kyc").hidden = true; kycCb = null; }

/* ── settings ── */
function card(title){ var c = el("section", "setc"); c.appendChild(el("h2", "", title)); return c; }
var eraseArmed = false;

/* ── register a new company (path B) ── */
var SECS = [["basics", "Name and purpose"], ["capital", "Capital and shares"], ["people", "People"], ["office", "Office and running the company"], ["docs", "Documents"]];
var MONTHS = ["31 January", "28 February", "31 March", "30 April", "31 May", "30 June", "31 July", "31 August", "30 September", "31 October", "30 November", "31 December"];
var regOpen = "", regEdit = "";
function lines(t){ return String(t || "").split(/\n/).map(function(s){ return s.trim(); }).filter(Boolean); }
function pname(p){ return ((p.first || "") + " " + (p.last || "")).trim() || "New person"; }
function shareCount(r){ var c = num(r.capital), p = num(r.par); return (c > 0 && p >= 5 && c % p === 0) ? c / p : 0; }
function holder(p){ return !!(p.roles.p || p.roles.s); }
function anyForeign(u){ return u.four.foreign === "Yes" || u.reg.people.some(function(p){ return p.nat === "fo"; }); }
function personMissing(p){
  var m = [];
  if (!p.first.trim() || !p.last.trim()) m.push("first and last name");
  if (!(p.roles.p || p.roles.d || p.roles.s)) m.push("a role");
  if (!p.nat) m.push("nationality");
  if (!p.dob) m.push("birth date"); else if (p.dob >= today()) m.push("a birth date in the past");
  if (p.addr.trim().length < 5) m.push("complete address");
  if (p.roles.p && !p.occ.trim()) m.push("occupation");
  if (p.nat === "th" && !thaiIdOk(p.nid)) m.push(/^\d{13}$/.test(p.nid) ? "a national ID that checks out (one digit looks wrong)" : "13-digit national ID");
  if (p.nat === "fo" && (!p.passport.trim() || !p.country.trim())) m.push("passport number and country");
  if (holder(p) && !(num(p.shares) >= 1)) m.push("at least 1 share");
  return m;
}
function docList(u){
  var r = u.reg, out = [], foreign = anyForeign(u);
  r.people.forEach(function(p){
    if (p.nat === "fo") out.push({ k: "pp:" + p.id, label: "Passport copy", sub: pname(p) });
    else out.push({ k: "id:" + p.id, label: "ID card copy", sub: pname(p) });
    if (foreign && p.nat !== "fo" && holder(p)) out.push({ k: "bs:" + p.id, label: "Bank statement", sub: pname(p) + " · needed because someone in the company is not Thai" });
  });
  if (num(r.capital) > 5000000) out.push({ k: "capital", label: "Proof of paid-up capital", sub: "Needed because capital is above ฿5,000,000" });
  out.push({ k: "title", label: "Title document for the premises", sub: "Always needed" });
  out.push({ k: "consent", label: "Signed consent letter to use the premises", sub: "Always needed" });
  return out;
}
function regCheck(u){
  var r = u.reg, o = { basics: [], capital: [], people: [], office: [], docs: [] };
  if (!r.names[0].trim()) o.basics.push("A first-choice company name"); else if (/[A-Za-z]/.test(r.names[0]) && !/[\u0E00-\u0E7F]/.test(r.names[0])) o.basics.push("The first-choice name in Thai letters");
  var ob = lines(r.objectives); if (!ob.length) o.basics.push("At least one objective"); else if (ob.length > 30) o.basics.push("No more than 30 objectives (you have " + ob.length + ")");
  var cap = num(r.capital), par = num(r.par), paid = num(r.paid);
  if (!(cap > 0)) o.capital.push("Registered capital");
  if (!(par >= 5)) o.capital.push("Par value of at least ฿5 per share"); else if (cap > 0 && cap % par !== 0) o.capital.push("A par value that divides the capital evenly");
  if (!(paid > 0)) o.capital.push("Paid-up amount per share"); else if (par >= 5 && paid < par * 0.25) o.capital.push("Paid-up amount of at least 25% of par (฿" + (par * 0.25).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " or more)"); else if (par >= 5 && paid > par) o.capital.push("Paid-up amount no higher than the par value");
  var P = r.people, pro = P.filter(function(p){ return p.roles.p; }).length, dir = P.filter(function(p){ return p.roles.d; }).length;
  if (pro < 2) o.people.push("At least 2 founders (you have " + pro + ")");
  if (dir < 1) o.people.push("At least 1 director");
  P.forEach(function(p){ var m = personMissing(p); if (m.length) o.people.push(pname(p) + ": " + m.join(", ")); });
  var sc = shareCount(r), held = P.reduce(function(a, p){ return a + (holder(p) && num(p.shares) > 0 ? num(p.shares) : 0); }, 0);
  if (sc && held !== sc) o.people.push("Shares must add up to " + money(sc) + " (now " + money(held) + ")");
  var of = r.office;
  if (!of.no.trim() || !of.sub.trim() || !of.dist.trim() || !of.prov.trim()) o.office.push("Full office address");
  if (!/^\d{5}$/.test(of.zip)) o.office.push("5-digit postcode");
  if (!r.owner.trim()) o.office.push("Who owns the premises");
  var ap = P.filter(function(p){ return p.id === r.applicant; })[0];
  if (!ap) o.office.push("The applicant"); else if (!(ap.roles.p && ap.roles.d)) o.office.push("An applicant who is both a founder and a director");
  if (!r.signing) o.office.push("Who can sign for the company"); else if (r.signing === "Named directors" && !r.signers.filter(function(id){ return P.some(function(p){ return p.id === id && p.roles.d; }); }).length) o.office.push("At least one named director who can sign");
  else if (r.signing === "Two directors jointly" && dir < 2) o.office.push("Two directors, to sign jointly");
  if (!r.seal) o.office.push("Whether there is a company seal");
  if (!r.meeting) o.office.push("First meeting date"); else if (r.meeting > today()) o.office.push("A first meeting date that is not in the future");
  if (!P.some(function(p){ return p.id === r.chair; })) o.office.push("Who chaired the meeting");
  docList(u).forEach(function(d){ if (!r.files[d.k]) o.docs.push(d.label + (d.sub && d.k.indexOf(":") > 0 ? " for " + d.sub.split(" · ")[0] : "")); });
  return o;
}
function regLeft(u){ var c = regCheck(u); return SECS.filter(function(s){ return c[s[0]].length; }).length; }
function regStatus(){
  var u = me(), c = regCheck(u), left = 0;
  SECS.forEach(function(s){
    var m = c[s[0]], head = $("#rh-" + s[0]), need = $("#rn-" + s[0]); if (!head) return; if (m.length) left += 1;
    head.classList.toggle("ok", !m.length); $(".chip", head).textContent = m.length ? m.length + " to go" : "Done";
    need.textContent = ""; if (m.length){ need.appendChild(el("b", "", "Still needed")); m.forEach(function(t){ need.appendChild(el("span", "", "· " + t)); }); }
  });
  var sub = $("#reg-submit"); if (sub){ sub.disabled = left > 0; $("#reg-note").textContent = left ? left + " of 5 parts still need you. Everything saves as you go." : "Everything is in. Submit when you are ready."; }
  var sc = $("#reg-shares"); if (sc){ var n = shareCount(u.reg); sc.textContent = n ? "That makes " + money(n) + " shares." : "The par value must divide the capital evenly."; }
  $("#b-co-n").textContent = coName(u); $("#b-co-i").textContent = initials(coName(u));
}
function renderRegister(){
  var u = me(), r = u.reg, root = $("#b-register"), c = regCheck(u); root.textContent = ""; root.classList.remove("in");
  var keep = function(){ save(); regStatus(); }, redo = function(){ save(); renderRegister(); };
  var h = el("div", "pgh"); h.appendChild(el("h1", "", "Register your company"));
  if (r.submitted){
    h.appendChild(el("p", "", "Your application is in. In the real app I file it with DBD and keep you posted here. This test build sends nothing."));
    root.appendChild(h);
    var done = card("What you sent"), ul = el("ul", "st-list");
    ["บริษัท " + r.names[0].trim() + " จำกัด", money(shareCount(r)) + " shares of " + baht(num(r.par)) + ", capital " + baht(num(r.capital)), r.people.length + " people, " + docList(u).length + " documents"].forEach(function(t){ ul.appendChild(el("li", "", t)); });
    done.appendChild(ul);
    var ed = el("button", "pill soft act", "Edit the application"); ed.type = "button"; ed.style.justifySelf = "start"; ed.addEventListener("click", function(){ r.submitted = false; redo(); paintSetup(); }); done.appendChild(ed);
    root.appendChild(done); return;
  }
  h.appendChild(el("p", "", "Five short parts, in any order. Most people finish in about 15 minutes. Everything saves as you go.")); root.appendChild(h);
  var doneN = SECS.filter(function(s){ return !c[s[0]].length; }).length, ov = el("div", "regov");
  var bar = el("div", "regbar"); SECS.forEach(function(s){ bar.appendChild(el("i", c[s[0]].length ? "" : "on")); }); ov.appendChild(bar);
  ov.appendChild(el("b", "", doneN + " of 5 parts done"));
  var nx = el("details", "regnext"); nx.appendChild(el("summary", "", "What happens after you submit"));
  var ol = el("ol"); ["I check everything and reserve the name with DBD. A name holds for 30 days.", "Everyone named confirms, online with a Thai ID or on paper.", "DBD registers the company, usually in 1 to 3 working days. The company tax ID is the registration number.", "You open the company bank account with the certificate, and upload its first statement here."].forEach(function(t){ ol.appendChild(el("li", "", t)); });
  nx.appendChild(ol); ov.appendChild(nx); root.appendChild(ov);
  if (!regOpen){ var firstOpen = SECS.filter(function(s){ return c[s[0]].length; })[0]; regOpen = firstOpen ? firstOpen[0] : "basics"; }

  SECS.forEach(function(s, i){
    var k = s[0], box = el("section", "regc" + (regOpen === k ? " open" : ""));
    var head = el("button", "regh"); head.type = "button"; head.id = "rh-" + k; head.setAttribute("aria-expanded", String(regOpen === k));
    head.innerHTML = '<span class="n">' + (i + 1) + "</span><b>" + esc(s[1]) + '</b><span class="chip"></span><svg class="i cv"><use href="#i-chev"/></svg>';
    head.addEventListener("click", function(){ regOpen = regOpen === k ? "none" : k; renderRegister(); });
    box.appendChild(head);
    var b = el("div", "regb"), need = el("div", "need"); need.id = "rn-" + k;
    if (regOpen === k){
      if (k === "basics"){
        var nw = el("div", "names");
        b.appendChild(el("p", "st-p", "Give up to three names in Thai, best first. If DBD says the first is taken, I try the next one."));
        ["First choice", "Second choice (optional)", "Third choice (optional)"].forEach(function(lab, j){ nw.appendChild(fld(lab, r.names[j], { prefix: "บริษัท", suffix: "จำกัด", ph: j ? "Another name, in case" : "ชื่อบริษัท", on: function(v){ r.names[j] = v; keep(); return nameWarn(v); } })); });
        b.appendChild(nw);
        b.appendChild(fld("English name (optional)", r.en || "", { suffix: "Co., Ltd.", ph: "Bangkok Bites", on: function(v){ r.en = v; keep(); return /co\.?,?\s*ltd|company limited/i.test(v) ? "Leave out Co., Ltd. I add it." : ""; } }));
        b.appendChild(el("b", "regsub", "What the company will do"));
        b.appendChild(el("p", "st-p", "Tap your kind of business to start from the usual wording, then edit. One line per activity, up to 30. Wider is fine; you can do less than you list, never more."));
        b.appendChild(chipRow(TYPES.map(function(t){ return [t[0], t[0]]; }), function(k){ var have = lines(r.objectives); (OBJ[k] || []).forEach(function(o){ if (have.indexOf(o) < 0) have.push(o); }); r.objectives = have.join("\n"); redo(); }));
        var obf = fld("One per line", r.objectives, { area: 1, ph: "Operate restaurants and sell food and drinks\nProvide catering and event food services", on: function(v){ r.objectives = v; keep(); var n = lines(v).length; return n > 30 ? n + " lines. The limit is 30." : ""; } }); obf.classList.add("wide"); b.appendChild(obf);
        b.appendChild(el("b", "regsub", "When the financial year ends"));
        b.appendChild(el("p", "st-p", "Most companies use 31 December. Your first year can be shorter than 12 months."));
        b.appendChild(fld("Year ends on", r.fy, { options: MONTHS.map(function(m, j){ return [String(j + 1), m]; }), on: function(v){ r.fy = v; keep(); } }));
      } else if (k === "capital"){
        var g = el("div", "fgrid"), digits = function(set){ return function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); set(inp.value); keep(); }; };
        g.appendChild(fld("Registered capital", r.capital, { prefix: "฿", mode: "numeric", ph: "1000000", on: digits(function(v){ r.capital = v; }) }));
        g.appendChild(fld("Par value per share (at least ฿5)", r.par, { prefix: "฿", mode: "numeric", ph: "100", on: digits(function(v){ r.par = v; }) }));
        g.appendChild(fld("Paid-up per share (at least 25% of par)", r.paid, { prefix: "฿", mode: "numeric", ph: "25", on: digits(function(v){ r.paid = v; }) }));
        b.appendChild(el("p", "st-p", "Capital is what the owners promise to put in. It is not a fee. ฿1,000,000 is the most common, and only a quarter of it has to be paid in at the start."));
        b.appendChild(chipRow([["฿1,000,000 (most common)", "1000000", r.capital === "1000000"], ["฿2,000,000", "2000000", r.capital === "2000000"], ["฿5,000,000", "5000000", r.capital === "5000000"]], function(v){ r.capital = v; if (!r.par) r.par = "100"; if (!r.paid) r.paid = "25"; redo(); }));
        b.appendChild(g);
        b.appendChild(el("b", "regsub", "How much is paid in now"));
        b.appendChild(chipRow([["All of it", "all", r.par && r.paid === r.par], ["A quarter (the minimum)", "q", r.par && num(r.paid) === num(r.par) * 0.25]], function(v){ var pr = num(r.par) || 100; r.par = String(pr); r.paid = String(v === "all" ? pr : pr * 0.25); redo(); }));
        var sh = el("p", "fhint"); sh.id = "reg-shares"; b.appendChild(sh);
        var cap = num(r.capital), sc0 = shareCount(r);
        if (cap > 0){
          var sm2 = el("ul", "st-list");
          if (sc0 && num(r.paid) > 0) sm2.appendChild(el("li", "", "The founders pay in " + baht(sc0 * num(r.paid)) + " now, into the company bank account once it is open."));
          sm2.appendChild(el("li", "", "Government fees for this capital: about " + baht(regFees(cap)) + " (memorandum and registration). ThuraGirl's fee is separate."));
          if (cap > 5000000) sm2.appendChild(el("li", "", "Above ฿5,000,000 DBD asks for proof the money is paid in. It is on the documents list."));
          if (anyForeign(u)) sm2.appendChild(el("li", "", "With a foreign founder, Thais must hold more than half the shares unless you have a foreign business licence. I check this in People."));
          b.appendChild(sm2);
        }
      } else if (k === "people"){
        b.appendChild(el("p", "st-p", "Add everyone involved. One person can hold several roles."));
        var rl = el("ul", "st-list"); [["Founder", "signs the memorandum and must hold at least 1 share. You need 2 or more."], ["Director", "runs the company and signs for it. You need 1 or more."], ["Shareholder", "owns shares but has no say in day-to-day running."]].forEach(function(x){ var li = el("li"); li.appendChild(el("b", "", x[0] + ": ")); li.appendChild(document.createTextNode(x[1])); rl.appendChild(li); }); b.appendChild(rl);
        var P0 = r.people, nPro = P0.filter(function(p){ return p.roles.p; }).length, nDir = P0.filter(function(p){ return p.roles.d; }).length, sc1 = shareCount(r), held1 = P0.reduce(function(a, p){ return a + (holder(p) ? num(p.shares) || 0 : 0); }, 0);
        var pst = el("div", "regstat");
        [["Founders", nPro + " of 2", nPro >= 2], ["Directors", nDir + " of 1", nDir >= 1], ["Shares given out", sc1 ? money(held1) + " of " + money(sc1) : "Set capital first", sc1 && held1 === sc1]].forEach(function(x){ var d0 = el("div", x[2] ? "ok" : ""); d0.appendChild(el("span", "", x[0])); d0.appendChild(el("b", "num", x[1])); pst.appendChild(d0); });
        b.appendChild(pst);
        var thaiHeld = P0.filter(function(p){ return holder(p) && p.nat === "th"; }).reduce(function(a, p){ return a + (num(p.shares) || 0); }, 0);
        if (anyForeign(u) && sc1 && held1 && thaiHeld * 2 <= held1) b.appendChild(el("p", "ferrB", "Thai shareholders hold " + Math.round(thaiHeld / held1 * 100) + "% of the shares. Without a foreign business licence they need more than 50%. Tell me if you have a licence or BOI promotion."));
        r.people.forEach(function(p){
          var pc = el("div", "person"), ph = el("div", "ph"), roles = [p.roles.p && "Founder", p.roles.d && "Director", p.roles.s && "Shareholder"].filter(Boolean).join(", ");
          ph.appendChild(el("b", "", pname(p))); ph.appendChild(el("span", "", roles || "No role yet"));
          var tg = el("button", "pill soft", regEdit === p.id ? "Close" : "Edit"); tg.type = "button"; tg.addEventListener("click", function(){ regEdit = regEdit === p.id ? "" : p.id; renderRegister(); }); ph.appendChild(tg); pc.appendChild(ph);
          if (regEdit === p.id){
            var pg = el("div", "fgrid");
            pg.appendChild(fld("First name", p.first, { on: function(v){ p.first = v; keep(); $("b", ph).textContent = pname(p); } }));
            pg.appendChild(fld("Last name", p.last, { on: function(v){ p.last = v; keep(); $("b", ph).textContent = pname(p); } }));
            pc.appendChild(pg);
            var rc = el("div", "chips"); rc.setAttribute("role", "group"); rc.setAttribute("aria-label", "Roles");
            [["p", "Founder"], ["d", "Director"], ["s", "Shareholder"]].forEach(function(x){ var rb = el("button", "", x[1]); rb.type = "button"; rb.setAttribute("aria-pressed", String(!!p.roles[x[0]])); rb.addEventListener("click", function(){ p.roles[x[0]] = !p.roles[x[0]]; redo(); }); rc.appendChild(rb); });
            pc.appendChild(rc);
            var nr = el("div", "frow"); nr.appendChild(el("b", "", "Nationality")); nr.appendChild(seg(["Thai", "Foreign"], p.nat === "th" ? "Thai" : p.nat === "fo" ? "Foreign" : "", function(v){ p.nat = v === "Thai" ? "th" : "fo"; redo(); })); pc.appendChild(nr);
            var pg2 = el("div", "fgrid");
            if (p.nat === "th") pg2.appendChild(fld("National ID (13 digits)", p.nid, { mode: "numeric", max: 13, ph: "On the front of the ID card", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); p.nid = inp.value; keep(); return inp.value.length === 13 && !thaiIdOk(inp.value) ? "One digit looks wrong. Check it against the card." : ""; } }));
            if (p.nat === "fo"){ pg2.appendChild(fld("Passport number", p.passport, { on: function(v){ p.passport = v; keep(); } })); pg2.appendChild(fld("Country", p.country, { on: function(v){ p.country = v; keep(); } })); }
            pg2.appendChild(fld("Birth date", p.dob, { type: "date", maxDate: today(), startYearsBack: 35, on: function(v){ p.dob = v; keep(); } }));
            if (p.roles.p) pg2.appendChild(fld("Occupation", p.occ, { on: function(v){ p.occ = v; keep(); } }));
            if (holder(p)) pg2.appendChild(fld("Shares held", p.shares, { mode: "numeric", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); p.shares = inp.value; keep(); } }));
            pg2.appendChild(fld("Home address, as on the ID card or passport", p.addr, { wide: 1, ph: "House number, street, subdistrict, district, province, postcode", on: function(v){ p.addr = v; keep(); } }));
            pc.appendChild(pg2);
            var rm = el("button", "alt danger", "Remove this person"); rm.type = "button"; rm.addEventListener("click", function(){ r.people = r.people.filter(function(x){ return x !== p; }); regEdit = ""; redo(); }); pc.appendChild(rm);
          }
          b.appendChild(pc);
        });
        var pch = el("div", "chips");
        if (!r.people.some(function(p){ return p.me; })) pch.appendChild(btn("pill soft act", "Add me", function(){ var nm2 = (u.name || "").trim().split(/\s+/), id = "p" + Date.now().toString(36); r.people.push({ id: id, me: 1, first: nm2[0] || "", last: nm2.slice(1).join(" "), roles: { p: true, d: true, s: false }, nat: "th", country: "", dob: "", addr: "", occ: "", nid: "", passport: "", shares: "" }); regEdit = id; redo(); }, "i-plus"));
        var hs = r.people.filter(holder);
        if (sc1 && hs.length >= 2) pch.appendChild(btn("pill soft act", "Split shares equally", function(){ var each = Math.floor(sc1 / hs.length), rest = sc1 - each * hs.length; hs.forEach(function(p, i){ p.shares = String(each + (i === 0 ? rest : 0)); }); redo(); toast("Shares split " + hs.length + " ways"); }));
        b.appendChild(pch);
        var addP = el("button", "pill soft act", "Add a person"); addP.type = "button"; addP.style.justifySelf = "start";
        addP.addEventListener("click", function(){ var id = "p" + Date.now().toString(36); r.people.push({ id: id, first: "", last: "", roles: { p: false, d: false, s: false }, nat: "", country: "", dob: "", addr: "", occ: "", nid: "", passport: "", shares: "" }); regEdit = id; redo(); });
        b.appendChild(addP);
      } else if (k === "office"){
        var of = r.office, og = el("div", "fgrid"), who = [["", "Choose a person"]].concat(r.people.map(function(p){ return [p.id, pname(p)]; }));
        var both = r.people.filter(function(p){ return p.roles.p && p.roles.d; })[0];
        if (!r.applicant && both){ r.applicant = both.id; save(); }
        if (!r.chair && both){ r.chair = both.id; save(); }
        b.appendChild(el("p", "st-p", "The registered office is where DBD and the Revenue Department send letters. A rented shop, an office or your home all work, with the owner's consent."));
        og.appendChild(fld("House number and street", of.no, { wide: 1, on: function(v){ of.no = v; keep(); } }));
        og.appendChild(fld("Subdistrict", of.sub, { on: function(v){ of.sub = v; keep(); } }));
        og.appendChild(fld("District", of.dist, { on: function(v){ of.dist = v; keep(); } }));
        og.appendChild(fld("Province", of.prov, { on: function(v){ of.prov = v; keep(); } }));
        og.appendChild(fld("Postcode", of.zip, { mode: "numeric", max: 5, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); of.zip = inp.value; keep(); if (inp.value.length === 5 && !of.prov && ZIPPROV[inp.value.slice(0, 2)]){ of.prov = ZIPPROV[inp.value.slice(0, 2)]; var pv = $$("#b-register .fld input").filter(function(x){ return /^(Province|จังหวัด)$/.test(x.parentNode.parentNode.firstChild.textContent); })[0]; if (pv) pv.value = of.prov; } } }));
        og.appendChild(fld("Who owns the place", r.owner, { wide: 1, ph: "Landlord's name, or yours if you own it", on: function(v){ r.owner = v; keep(); } }));
        og.appendChild(fld("Applicant (must be a founder and a director)", r.applicant, { options: who, on: function(v){ r.applicant = v; keep(); } }));
        og.appendChild(fld("Chair of the first meeting", r.chair, { options: who, on: function(v){ r.chair = v; keep(); } }));
        og.appendChild(fld("First meeting date", r.meeting, { type: "date", maxDate: today(), quick: [["Today", 0]], on: function(v){ r.meeting = v; keep(); } }));
        b.appendChild(og);
        b.appendChild(el("p", "st-p", "The first meeting is when the founders agree the rules and appoint the directors. It can be the same day you submit. The applicant files the papers and is usually you."));
        var sr = el("div", "frow"); sr.appendChild(el("b", "", "Who can sign for the company")); sr.appendChild(seg(["Any one director", "Two directors jointly", "Named directors"], r.signing, function(v){ r.signing = v; redo(); })); b.appendChild(sr);
        b.appendChild(el("p", "fhint", r.signing === "Two directors jointly" ? "Safer: no one can sign a contract or move money alone." : r.signing === "Named directors" ? "Only the directors you pick can sign." : "Simplest: any director can sign alone. Most small companies choose this."));
        if (r.signing === "Named directors"){
          var dc = el("div", "chips"), dirs = r.people.filter(function(p){ return p.roles.d; });
          if (!dirs.length) b.appendChild(el("p", "st-p", "Add a director in People first."));
          dirs.forEach(function(p){ var x = el("button", "", pname(p)); x.type = "button"; x.setAttribute("aria-pressed", String(r.signers.indexOf(p.id) >= 0)); x.addEventListener("click", function(){ var i = r.signers.indexOf(p.id); if (i >= 0) r.signers.splice(i, 1); else r.signers.push(p.id); redo(); }); dc.appendChild(x); });
          b.appendChild(dc);
        }
        var sl = el("div", "frow"); sl.appendChild(el("b", "", "Company seal")); sl.appendChild(seg(["Yes", "No"], r.seal, function(v){ r.seal = v; keep(); })); b.appendChild(sl);
        b.appendChild(el("p", "fhint", "Optional. Without a seal, the directors' signatures are enough."));
        b.appendChild(el("p", "st-p", "Auditor: ThuraGirl appoints a licensed auditor for you. Nothing to fill in here."));
      } else {
        var DL = docList(u), got = DL.filter(function(d){ return r.files[d.k]; }).length;
        b.appendChild(el("p", "st-p", got + " of " + DL.length + " added. A clear phone photo is fine; PDF or image, up to 10 MB each. The list follows the people and capital you entered."));
        var dl = el("div", "");
        docList(u).forEach(function(d){
          var row = el("div", "docrow"), tx = el("div", "tx"), f = r.files[d.k]; tx.appendChild(el("b", "", d.label));
          tx.appendChild(el("span", f ? "got" : "", f ? "✓ " + f.name + " (" + size(f.size) + ")" : d.sub)); row.appendChild(tx);
          var x = el("button", "pill soft act", f ? "Replace" : "Add"); x.type = "button";
          x.addEventListener("click", function(){ openKyc(d.label, (d.k.indexOf(":") > 0 ? d.sub.split(" · ")[0] + ". " : "") + "One PDF or image, up to 10 MB.", function(meta){ r.files[d.k] = meta; redo(); toast(d.label + " received"); }); });
          row.appendChild(x); dl.appendChild(row);
        });
        b.appendChild(dl);
      }
    }
    b.appendChild(need); box.appendChild(b); root.appendChild(box);
  });
  var sm = el("div", "subm"), note = el("p", "st-p"); note.id = "reg-note";
  var sb = el("button", "pill acc", "Submit for registration"); sb.type = "button"; sb.id = "reg-submit";
  sb.addEventListener("click", function(){ if (regLeft(u)) return; r.submitted = true; save(); renderRegister(); paintSetup(); setCount(); window.scrollTo(0, 0); toast("Application submitted"); });
  sm.appendChild(note); sm.appendChild(sb); root.appendChild(sm);
  regStatus();
}

/* ── wiring ── */
(function(){
  var sp = $("#b-spark");
  function at(ev){ var r = sp.getBoundingClientRect(), t = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)); showDay(Math.round(t * (N - 1))); }
  sp.addEventListener("pointerdown", at); sp.addEventListener("pointermove", at); sp.addEventListener("pointerleave", restDay); sp.addEventListener("pointercancel", restDay);
})();
$("#b-bkbar").addEventListener("click", function(){ var open = this.getAttribute("aria-expanded") !== "true"; this.setAttribute("aria-expanded", String(open)); $("#b-bkpanel").hidden = !open; });
$("#b-back").addEventListener("click", function(){ go(""); });
$("#b-logo").addEventListener("click", function(){ go(""); });
$("#b-money-btn").addEventListener("click", function(){ go(tab === "money" ? "" : "money"); });
$("#b-brief-btn").addEventListener("click", function(){ go(tab === "brief" ? "" : "brief"); });
$("#b-co").addEventListener("click", function(){ go(tab === "settings" ? "" : "settings"); });
$$('#app [data-go="money"]').forEach(function(b){ b.addEventListener("click", function(){ go("money"); }); });
$$("#app .js-upload").forEach(function(b){ b.addEventListener("click", function(){ openUpload(); }); });
$$("#app .js-invoice").forEach(function(b){ b.addEventListener("click", function(){ startInvoiceFlow(); }); });
$$("#app .js-pay").forEach(function(b){ b.addEventListener("click", function(){ startPayFlow(); }); });
$$("#app .js-sample").forEach(function(b){ b.addEventListener("click", function(){ useSample(); }); });
$("#b-setup-btn").addEventListener("click", openSetupTask);
$("#b-wel-go").addEventListener("click", openSetupTask);
$("#b-wel-x").addEventListener("click", function(){ me().welcome = false; save(); paintSetup(); });
$("#st-x").addEventListener("click", function(){ $("#b-setup").hidden = true; });
$("#st-done").addEventListener("click", function(){ $("#b-setup").hidden = true; });
$("#up-x").addEventListener("click", function(){ $("#up-sheet").hidden = true; });
$("#up-file").addEventListener("change", function(){ var f = this.files && this.files[0]; this.value = ""; if (f) takeFile(f); });
$("#kyc-x").addEventListener("click", closeKyc);
$("#kyc-cam").addEventListener("change", function(){ kycTake(this); });
$("#kyc-file").addEventListener("change", function(){ kycTake(this); });
gsInit();
["#b-sheet", "#b-setup", "#up-sheet", "#kyc"].forEach(function(s){ var n = $(s); n.addEventListener("click", function(ev){ if (ev.target === n){ if (s === "#kyc") closeKyc(); else n.hidden = true; } }); });
document.addEventListener("keydown", function(ev){
  if (ev.key !== "Escape") return;
  if (!$("#kyc").hidden) return closeKyc();
  if ($("#gs") && !$("#gs").hidden) return closeGS();
  ["#up-sheet", "#b-setup", "#b-sheet"].forEach(function(s){ $(s).hidden = true; });
});
// review pack
$("#b-review").addEventListener("click", openSheet);
$("#b-shx").addEventListener("click", closeSheet);
$("#b-agree").addEventListener("change", function(){ $("#b-approve").disabled = !this.checked; });
$("#b-approve").addEventListener("click", approvePack);
$("#b-shask").addEventListener("click", function(){ var B = books(me()); closeSheet(); var i = $("#b-in"); i.value = "How was " + (B && B.pack ? B.pack.name : "last month") + "?"; $("#b-send").disabled = false; try { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} });
// money
$$("#m-per button").forEach(function(b){ b.addEventListener("click", function(){ per = b.getAttribute("data-per"); $$("#m-per button").forEach(function(x){ var a = x === b; x.classList.toggle("on", a); x.setAttribute("aria-pressed", String(a)); }); renderMoney(); var B = books(me()); if (B) countUp($("#m-val"), Math.abs(B.fin[per].rev - B.fin[per].exp), 500); }); });
// chat
(function(){
  var inp = $("#b-in"), send = $("#b-send"), sug = $("#b-sug"), pop = $("#b-pop");
  inp.addEventListener("focus", function(){ if (!inp.value && pop.hidden) sug.hidden = false; });
  inp.addEventListener("blur", function(){ setTimeout(function(){ sug.hidden = true; }, 150); });
  inp.addEventListener("input", function(){ send.disabled = !inp.value.trim(); sug.hidden = !!inp.value || !pop.hidden; });
  $$("button", sug).forEach(function(b){ b.addEventListener("mousedown", function(ev){ ev.preventDefault(); }); b.addEventListener("click", function(){ ask(b.textContent); }); });
  $("#b-chat").addEventListener("submit", function(ev){ ev.preventDefault(); if (chat.on && chat.rec) chat.rec.abort(); ask(inp.value); });
  $("#b-popx").addEventListener("click", function(){ clearTimeout(chat.timer); pop.hidden = true; });
  $("#m-pl").addEventListener("click", function(){ ask("Show the full P&L"); });
  var mic = $('#b-chat [aria-label="Speak"]'); mic.id = "b-mic"; mic.setAttribute("aria-pressed", "false"); mic.addEventListener("click", micToggle);
  var plus = $('#b-chat [aria-label="Upload a file"]'), fi = el("input"); fi.type = "file"; fi.hidden = true; fi.accept = ".csv,.xlsx,.xls,.pdf,image/*"; fi.id = "b-chatfile";
  plus.setAttribute("aria-label", "Add a statement or receipt"); plus.title = "Add a statement or receipt";
  $("#b-chat").appendChild(fi); plus.addEventListener("click", function(){ fi.click(); });
  fi.addEventListener("change", function(){ var f = fi.files && fi.files[0]; fi.value = ""; if (f) chatFile(f); });
})();


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

/* ── one general-purpose sheet for invoices, payments, reminders and the rest ── */
function gsInit(){
  if ($("#gs")) return;
  var w = el("div", "shB"); w.id = "gs"; w.hidden = true;
  w.innerHTML = '<div class="shB-card" role="dialog" aria-modal="true" aria-labelledby="gs-t"><div class="shB-h"><div><div class="shB-k" id="gs-k"></div><h3 id="gs-t"></h3><div class="shB-sub" id="gs-sub"></div></div>' +
    '<button type="button" class="cb-btn shB-x" id="gs-x" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button></div><div class="gs-b" id="gs-b"></div></div>';
  $("#mock").appendChild(w);
  $("#gs-x").addEventListener("click", closeGS);
  w.addEventListener("click", function(ev){ if (ev.target === w) closeGS(); });
}
function openGS(k, title, sub){
  gsInit(); $("#gs-k").textContent = k; $("#gs-t").textContent = title; $("#gs-sub").textContent = sub || ""; $("#gs-sub").hidden = !sub;
  var b = $("#gs-b"); b.textContent = ""; var s = $("#gs"); s.hidden = false;
  try { $("#gs-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {}
  return b;
}
function closeGS(){ var s = $("#gs"); if (s) s.hidden = true; }
function btn(cls, label, fn, icon){ var b = el("button", cls); b.type = "button"; b.innerHTML = icon ? '<svg class="i"><use href="#' + icon + '"/></svg>' : ""; b.appendChild(document.createTextNode(label)); if (fn) b.addEventListener("click", fn); return b; }
function foot(a, b){ var f = el("div", "shB-f" + (b ? "" : " one")); f.appendChild(a); if (b) f.appendChild(b); return f; }
function refresh(){ BK_CACHE.key = ""; lastKey = ""; showTab(); }

/* ── terms (signup) ── */
function openTerms(){
  var b = openGS("Before launch", "Terms and PDPA notice", "");
  b.appendChild(el("p", "st-p", "The full Terms of Service and the PDPA privacy notice will be published here before ThuraGirl opens to customers."));
  var ul = el("ul", "st-list");
  ["In this test build your details stay in this browser. Nothing is sent to a server.", "Your password is stored only as a salted hash.", "You can erase the account and everything in it from Settings at any time."].forEach(function(t){ ul.appendChild(el("li", "", t)); });
  b.appendChild(ul); b.appendChild(foot(btn("pill acc", "Got it", closeGS)));
}

/* ── the sample, in one tap ── */
function useSample(silent){
  var u = me(), p = readTable(splitCsv(sampleCsv()));
  addStatement(u, "K-Bank", "0483511234", p); sampleBooks(u); u.sample = true; save();
  if (!silent){ if (tab !== "home") go(""); else refresh(); toast("Sample statement loaded. " + p.tx.length + " transactions read."); }
}

/* ── what needs the owner ── */
function sendReq(r, after){ openKyc(r.form, r.doc + ". One PDF or image, up to 10 MB.", function(meta){ r.file = meta; r.file.at = Date.now(); r.done = Date.now(); save(); refresh(); toast("Sent to your accountant"); if (after) after(); }); }
function openReqs(){
  var u = me(), reqs = (u.requests || []).filter(function(r){ return !r.file; });
  if (!reqs.length){ closeGS(); return; }
  var b = openGS("Your accountant", reqs.length + " documents to send", "Send them one by one, whenever you can. Each goes straight to your accountant.");
  var by = {}; reqs.forEach(function(r){ (by[r.form] = by[r.form] || []).push(r); });
  Object.keys(by).forEach(function(f){
    b.appendChild(el("b", "regsub", f));
    var rows = el("div", "ob-rows");
    by[f].forEach(function(r){ var row = el("div", "docrow"), tx = el("div", "tx"); tx.appendChild(el("b", "", r.doc)); tx.appendChild(el("span", "", "Requested " + ago(r.at, true))); row.appendChild(tx); row.appendChild(btn("pill soft act", "Upload", function(){ closeGS(); sendReq(r, openReqs); })); rows.appendChild(row); });
    b.appendChild(rows);
  });
  b.appendChild(foot(btn("pill acc", "Later", closeGS)));
}
function tasks(u){
  var B = books(u), t = today(), out = [];
  if (!B) return out;
  var reqs = (u.requests || []).filter(function(r){ return !r.file; });
  if (reqs.length === 1){ var r1 = reqs[0];
    out.push({ k: "req:" + r1.id, ic: "i-doc", t: "Your accountant asked for a document", m: r1.doc, late: { txt: "Requested " + ago(r1.at, true), cls: "warn" }, btn: "Upload", rank: 1, fn: function(){ sendReq(r1); },
      story: { h: "Your accountant needs one more document", p: r1.doc + ", for " + r1.form + "." } }); }
  else if (reqs.length > 1) out.push({ k: "req:all", ic: "i-doc", t: "Your accountant asked for " + reqs.length + " documents", m: reqs.map(function(r){ return r.form; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).join(", "), late: { txt: "Requested " + ago(reqs[0].at, true), cls: "warn" }, btn: "See list", rank: 1, fn: openReqs,
      story: { h: "Your accountant needs " + reqs.length + " documents", p: "For " + reqs.map(function(r){ return r.form; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).slice(0, 3).join(", ") + ". Most are a quick photo or a download from your bank." } });
  (u.invoices || []).filter(function(v){ return !v.paid && v.due < t && (!v.reminded || diffDays(t, v.reminded) >= 7); }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var tot = invTotal(v);
    out.push({ k: "inv:" + v.id, ic: "i-alert", t: "Invoice #" + v.id + " is unpaid", m: v.to, amt: tot, late: { txt: lateTxt(v.due), cls: "bad" }, btn: "Remind", rank: 2, fn: function(){ openRemind(v); },
      story: { h: v.to + " has not paid you", p: "Invoice #" + v.id + " for " + baht(tot) + " is " + lateTxt(v.due).replace("late", "late") + ". I have a polite reminder ready to go." } });
  });
  (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, t) <= 7; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).forEach(function(v){
    var late = v.due < t;
    out.push({ k: "bill:" + v.id, ic: "i-pay", t: "Pay " + v.to, m: v.note || "Bill", amt: v.amount, late: { txt: lateTxt(v.due), cls: late ? "bad" : v.due === t ? "warn" : "" }, btn: "Pay", rank: late ? 2 : 4, fn: function(){ openBill(v); },
      story: { h: late ? "The " + v.to + " bill is overdue" : v.to + " is due " + (v.due === t ? "today" : "soon"), p: baht(v.amount) + ", " + lateTxt(v.due).toLowerCase() + ". Scan the PromptPay code or mark it paid." } });
  });
  var since = addDays(B.asOf, -30);
  u.tx.filter(function(x){ return x.a <= -10000 && x.d >= since && /Stock and supplies|Marketing|Other costs|Utilities/.test(cat(x.t, x.a)) && !(u.rcpt || {})[txid(x)]; })
    .sort(function(a, b){ return a.a - b.a; }).slice(0, 2).forEach(function(x){
      out.push({ k: "rc:" + txid(x), ic: "i-receipt", t: "Receipt missing: " + cap(x.t.toLowerCase()), m: x.t + ", " + nice(x.d), amt: -x.a, late: { txt: "Left your account on " + nice(x.d), cls: "" }, btn: "Upload", rank: 5,
        fn: function(){ openKyc("Receipt", x.t + " · " + baht(-x.a) + ". A photo or PDF of the receipt or tax invoice.", function(meta){ u.rcpt = u.rcpt || {}; u.rcpt[txid(x)] = meta; save(); refresh(); toast("Receipt filed"); }); },
        story: { h: "A receipt is missing", p: baht(-x.a) + " to " + x.t + " on " + nice(x.d) + ". Snap the receipt and I file it." } });
    });
  (u.banks || []).filter(function(b){ return Date.now() - b.at > 7 * 864e5; }).forEach(function(b){
    out.push({ k: "bk:" + b.bank + b.acct, ic: "i-up", t: b.bank + " statement is getting old", m: "Last uploaded " + ago(b.at, true), late: { txt: "Uploaded " + ago(b.at, true), cls: "warn" }, btn: "Upload", rank: 6, fn: function(){ openUpload(b); } });
  });
  moreTasks(u, B, out);
  return out.sort(function(a, b){ return a.rank - b.rank; });
}
function rowFor(x){
  var r = el("div", "row tk dyn"); r.setAttribute("data-k", x.k);
  r.innerHTML = '<span class="ic"><svg class="i"><use href="#' + x.ic + '"/></svg></span>';
  var rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t));
  var m = el("div", "m"); m.appendChild(el("span", x.late.cls, x.late.txt)); if (x.amt){ var ma = el("span", "ma", " · "); ma.appendChild(el("span", "num", baht(x.amt))); m.appendChild(ma); }
  rt.appendChild(m); r.appendChild(rt);
  if (x.amt) r.appendChild(el("span", "amt num", baht(x.amt)));
  r.appendChild(btn("pill soft act", x.btn, x.fn)); return r;
}
function paintNeeds(u){
  var sec = $(".needB"), setup = $("#b-setuprow"), rev = $("#b-rev"), B = books(u);
  $$(".needB .tk[data-k]:not(#b-rev)").forEach(function(n){ n.remove(); });
  var T = tasks(u); T.slice(0, 6).forEach(function(x){ sec.insertBefore(rowFor(x), setup); });
  var p = B && B.pack, showRev = !!(p && !(u.done["rev:" + p.key]));
  rev.hidden = !showRev; rev.classList.remove("gone", "going"); rev.style.height = "";
  if (p){ $(".rt .t", rev).textContent = p.name + " Review Pack"; $(".rt .m", rev).textContent = "Your month on one page. " + baht(p.kept) + " kept."; }
  var later = (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, today()) > 7 && diffDays(v.due, today()) <= 31; }).length + Math.max(0, T.length - 6);
  var more = $(".needB .more"); more.hidden = !later; if (later) more.firstChild.nodeValue = later + (later === 1 ? " more thing" : " more things") + " coming up this month";
}

/* ── home: hero and tiles ── */
function paintHero(u){
  var B = books(u); if (!B) return;
  CASH = B.series.map(function(s){ return s[1]; }); CDAYS = B.series.map(function(s){ return s[0]; }); N = CASH.length; TOTAL = B.cash;
  lo = Math.min.apply(null, CASH); hi = Math.max.apply(null, CASH); if (hi === lo){ hi += 1; lo -= 1; }
  buildSpark(); restDay();
  $(".dB-hero .big").setAttribute("aria-label", money(B.cash) + " baht");
  $("#b-spark").setAttribute("aria-label", "Cash over the last 30 days, from " + baht(CASH[0]) + " to " + baht(TOTAL));
  var F = B.fin.mtd, tiles = [[".mini.t1", "Revenue", F.rev, F.dIn, "vs last month"], [".mini.t2", "Expenses", F.exp, F.dOut, "vs last month"], [".mini.t3", "Profit", F.rev - F.exp, F.d, F.rev ? ((F.rev - F.exp) / F.rev * 100).toFixed(1) + "% margin" : ""]];
  tiles.forEach(function(x){
    var b = $(x[0]); $(".n", b).textContent = baht(x[2]); b.setAttribute("aria-label", x[1] + ", " + money(x[2]) + " baht. Open Money");
    var d = $(".d", b); d.textContent = ""; if (x[3] != null){ d.insertAdjacentHTML("beforeend", '<svg class="i"' + (x[3] < 0 ? ' style="transform:scaleY(-1)"' : "") + '><use href="#i-trend"/></svg>'); d.appendChild(document.createTextNode(pctTxt(x[3]))); }
    d.appendChild(el("em", "", x[3] == null && x[0] !== ".mini.t3" ? "this month" : x[4])); d.classList.toggle("down", x[3] != null && x[3] < 0);
  });
  $(".snapB .sech span").textContent = MONTH[day(B.asOf).getMonth()] + " so far";
}

/* ── money lists ── */
function paintLists(u){
  var L = $$("#b-money .listB"), t = today();
  function fill(sec, title, items, empty, addLabel, addFn){
    sec.textContent = "";
    var tot = items.reduce(function(s, x){ return s + x.amt; }, 0), late = items.filter(function(x){ return x.due < t; }).length;
    var h = el("div", "cardh"); h.appendChild(el("h2", "", title)); h.appendChild(el("span", "tot num", baht(tot)));
    var sub = el("div", "sub", items.length + (items.length === 1 ? " open" : " open")); if (late){ sub.appendChild(document.createTextNode(" · ")); sub.appendChild(el("span", "bad", late + " overdue")); }
    h.appendChild(sub); sec.appendChild(h);
    if (!items.length) sec.appendChild(el("p", "st-p lpad", empty));
    items.forEach(function(x){
      var r = el("div", "row"), rt = el("button", "rt rtb"); rt.type = "button"; rt.addEventListener("click", x.open);
      rt.appendChild(el("div", "t", x.name)); var m = el("div", "m"); m.appendChild(el("span", x.due < t ? "bad" : "", lateTxt(x.due))); var ma = el("span", "ma", " · "); ma.appendChild(el("span", "num", baht(x.amt))); m.appendChild(ma); rt.appendChild(m);
      r.appendChild(rt); r.appendChild(el("span", "amt num", baht(x.amt))); r.appendChild(btn("pill soft act", x.btn, x.act)); sec.appendChild(r);
    });
    var add = btn("alt lpad", "", addFn); add.innerHTML = "<u>" + addLabel + "</u>"; sec.appendChild(add);
  }
  fill(L[0], "Owed to you", (u.invoices || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: invTotal(v), btn: v.due < t ? "Remind" : "View", act: function(){ if (v.due < t) openRemind(v); else openInvoice(v); }, open: function(){ openInvoice(v); } };
  }), "No unpaid invoices. Make one and I keep track of it.", "Create an invoice", function(){ newInvoice(); });
  fill(L[1], "You owe", (u.bills || []).filter(function(v){ return !v.paid; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; }).map(function(v){
    return { name: v.to, due: v.due, amt: v.amount, btn: "Pay", act: function(){ openBill(v); }, open: function(){ openBill(v); } };
  }), "No bills waiting. Add one and I remind you before it is due.", "Add a bill", function(){ newBill(); });
}

/* ── review pack ── */
function paintPack(u){
  var B = books(u), p = B && B.pack, s = $("#b-sheet"); if (!p) return;
  var all = (u.invoices || []).filter(function(v){ return !v.paid && v.due < today(); }).reduce(function(a, v){ return a + invTotal(v); }, 0);
  var miss = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; }).length;
  $("#b-sh-t").textContent = p.name + ", on one page"; $(".shB-sub", s).textContent = coName(u) + " · 1 to " + day(p.to).getDate() + " " + p.name;
  var dd = $$(".shB-n dd", s); dd[0].textContent = baht(p.inc); dd[1].textContent = baht(p.exp); dd[2].textContent = baht(p.kept);
  var li = $$(".shB-l li b", s); li[0].textContent = p.inc ? (p.kept / p.inc * 100).toFixed(1) + "%" : "–"; li[1].textContent = baht(p.tax[0] + p.tax[1]); li[2].textContent = baht(all); li[3].textContent = String(miss);
  $$(".shB-l li span", s)[1].textContent = "Tax to set aside (estimate)";
  $(".shB-ok span", s).textContent = "I've reviewed " + p.name + " and it looks right.";
}
function openSheet(){ var u = me(); paintPack(u); var s = $("#b-sheet"); $("#b-agree").checked = false; $("#b-approve").disabled = true; s.hidden = false; try { $("#b-shx").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeSheet(){ $("#b-sheet").hidden = true; }
function approvePack(){ var u = me(), B = books(u); if (!B || !B.pack) return; u.done["rev:" + B.pack.key] = { at: Date.now() }; save(); closeSheet(); collapse($("#b-rev")); setTimeout(function(){ setCount(); }, 400); if (tab === "brief") renderBrief(); toast(B.pack.name + " is signed off"); }


/* ── invoices ── */
function nextInvNo(u){ var y = new Date().getFullYear(), n = (u.invoices || []).reduce(function(m, v){ var x = String(v.id).match(/(\d+)$/); return x ? Math.max(m, +x[1]) : m; }, 0) + 1; return "INV-" + y + "-" + ("00" + n).slice(-3); }
function newInvoice(pre){
  var u = me(), d = { to: (pre && pre.to) || "", email: "", items: [["", "1", ""]], vat: u.setup.vat !== "No", days: "30" };
  var b = openGS("New invoice", "Create an invoice", "I number it, add VAT if you charge it, and remind you when it is late.");
  var err = el("div", "ferrB"), tot = el("dl", "shB-n"), lines = el("div", "inv-lines");
  function sums(){ var s = d.items.reduce(function(a, it){ return a + (num(it[1]) || 0) * (num(it[2]) || 0); }, 0), v = d.vat ? s * 0.07 : 0; return [s, v, s + v]; }
  function paintTot(){ var s = sums(); tot.innerHTML = ""; [["Subtotal", s[0]], [d.vat ? "VAT 7%" : "No VAT", s[1]], ["Total", s[2]]].forEach(function(x){ var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "num", baht(x[1]))); tot.appendChild(w); }); }
  function paintLines(){
    lines.textContent = "";
    d.items.forEach(function(it, i){
      var r = el("div", "inv-line");
      r.appendChild(fld(i ? "" : "What for", it[0], { ph: "Catering, 50 guests", on: function(v){ it[0] = v; } }));
      r.appendChild(fld(i ? "" : "Qty", it[1], { mode: "decimal", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); it[1] = inp.value; paintTot(); } }));
      r.appendChild(fld(i ? "" : "Price each", it[2], { prefix: "฿", mode: "decimal", ph: "0", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); it[2] = inp.value; paintTot(); } }));
      if (d.items.length > 1){ var x = el("button", "cb-btn rm"); x.type = "button"; x.setAttribute("aria-label", "Remove this line"); x.innerHTML = '<svg class="i"><use href="#i-x"/></svg>'; x.addEventListener("click", function(){ d.items.splice(i, 1); paintLines(); paintTot(); }); r.appendChild(x); }
      lines.appendChild(r);
    });
  }
  var g = el("div", "fgrid");
  g.appendChild(fld("Customer", d.to, { ph: "Company or person", on: function(v){ d.to = v; err.textContent = ""; } }));
  g.appendChild(fld("Customer email (optional)", d.email, { type: "email", ph: "For sending it", on: function(v){ d.email = v.trim(); } }));
  b.appendChild(g); paintLines(); b.appendChild(lines);
  var addL = btn("alt", "", function(){ d.items.push(["", "1", ""]); paintLines(); paintTot(); }); addL.innerHTML = "<u>Add a line</u>"; b.appendChild(addL);
  var r1 = el("div", "frow"); r1.appendChild(el("b", "", "Charge VAT (7%)")); r1.appendChild(seg(["Yes", "No"], d.vat ? "Yes" : "No", function(v){ d.vat = v === "Yes"; paintTot(); })); b.appendChild(r1);
  var r2 = el("div", "frow"); r2.appendChild(el("b", "", "Payment due in")); r2.appendChild(seg(["7 days", "15 days", "30 days"], d.days + " days", function(v){ d.days = v.split(" ")[0]; })); b.appendChild(r2);
  paintTot(); b.appendChild(tot); b.appendChild(err);
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), btn("pill acc", "Create invoice", function(){
    var items = d.items.filter(function(it){ return it[0].trim() || num(it[2]); });
    if (!d.to.trim()) return (err.textContent = "Add who the invoice is for.");
    if (!items.length || items.some(function(it){ return !it[0].trim() || !(num(it[1]) > 0) || !(num(it[2]) > 0); })) return (err.textContent = "Each line needs a description, a quantity and a price.");
    var v = { id: nextInvNo(u), to: d.to.trim(), email: d.email, issued: today(), due: addDays(today(), +d.days), items: items.map(function(it){ return [it[0].trim(), num(it[1]), num(it[2])]; }), vat: d.vat, paid: "" };
    u.invoices = u.invoices || []; u.invoices.push(v); save(); refresh(); openInvoice(v); toast("Invoice " + v.id + " created");
  })));
}
function openInvoice(v){
  var u = me(), tot = invTotal(v), sub = Math.round(tot / (v.vat ? 1.07 : 1) * 100) / 100;
  var b = openGS("Invoice " + v.id, v.to, "Issued " + niceY(v.issued) + " · due " + niceY(v.due));
  var n = el("dl", "shB-n"); [["Subtotal", sub], [v.vat ? "VAT 7%" : "No VAT", tot - sub], ["Total", tot]].forEach(function(x){ var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "num", baht(x[1]))); n.appendChild(w); }); b.appendChild(n);
  var ul = el("ul", "shB-l"); v.items.forEach(function(it){ var li = el("li"); li.appendChild(el("span", "", it[0] + (it[1] !== 1 ? " × " + it[1] : ""))); li.appendChild(el("b", "num", baht(it[1] * it[2]))); ul.appendChild(li); }); b.appendChild(ul);
  b.appendChild(el("p", "st-p" + (v.paid ? " okt" : v.due < today() ? " badt" : ""), v.paid ? "Paid on " + niceY(v.paid) + (v.via === "statement" ? ". I found the payment in your bank statement." : ".") : lateTxt(v.due) + (v.reminded ? ". Reminder sent " + niceY(v.reminded) + "." : ".")));
  var pr = btn("pill soft", "Printable invoice", function(){ printInvoice(v); }, "i-doc");
  var sec = v.paid ? btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; save(); refresh(); openInvoice(v); })
    : btn("pill acc", "Mark as paid", function(){ v.paid = today(); save(); refresh(); openInvoice(v); toast("Marked as paid"); });
  b.appendChild(foot(pr, sec));
  if (!v.paid){ var rm = btn("pill soft wide", v.due < today() ? "Send a reminder" : "Send it to the customer", function(){ openRemind(v, v.due >= today()); }, "i-chat"); b.appendChild(rm); }
  var del = btn("alt danger", "Delete this invoice", function(){ if (del.getAttribute("data-arm")){ u.invoices = u.invoices.filter(function(x){ return x !== v; }); save(); refresh(); closeGS(); toast("Invoice deleted"); } else { del.setAttribute("data-arm", "1"); del.textContent = "Tap again to delete"; } });
  b.appendChild(del);
}
function printInvoice(v){
  var u = me(), tot = invTotal(v), sub = Math.round(tot / (v.vat ? 1.07 : 1) * 100) / 100, c = u.company || {};
  var rows = v.items.map(function(it){ return "<tr><td>" + esc(it[0]) + "</td><td class=r>" + esc(it[1]) + "</td><td class=r>" + baht(it[2]) + "</td><td class=r>" + baht(it[1] * it[2]) + "</td></tr>"; }).join("");
  var h = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(v.id) + "</title><style>" +
    "body{font:15px/1.5 system-ui,-apple-system,'Segoe UI',sans-serif;color:#0F1514;margin:0;background:#F4F5F5}main{max-width:760px;margin:24px auto;background:#fff;border-radius:18px;padding:40px}" +
    "h1{font-size:30px;letter-spacing:-.03em;margin:0}.top{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}.mute{color:#667270}table{width:100%;border-collapse:collapse;margin:28px 0}" +
    "th,td{text-align:left;padding:10px 6px;border-bottom:1px solid #E2E6E5}th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#667270}.r{text-align:right}.tot td{border:0;padding:6px}.tot .big td{font-size:19px;font-weight:700}" +
    ".bar{display:flex;gap:10px;justify-content:flex-end;max-width:760px;margin:24px auto 0}button{border:0;border-radius:99px;padding:11px 18px;font:700 14px system-ui;background:#0FBFB6;color:#04201D;cursor:pointer}" +
    ".note{font-size:12.5px;color:#667270;margin-top:28px}@media print{body{background:#fff}main{margin:0;padding:0}.bar{display:none}}</style></head><body>" +
    '<div class="bar"><button onclick="print()">Print or save as PDF</button></div><main><div class="top"><div><h1>' + (v.vat ? "Tax invoice" : "Invoice") + '</h1><div class="mute">' + esc(v.id) + "</div></div><div><b>" + esc(coName(u)) + "</b><br>" +
    (c.addr ? esc(c.addr) + "<br>" : "") + (c.taxid ? "Tax ID " + esc(c.taxid) : "") + "</div></div>" +
    '<div class="top" style="margin-top:26px"><div><div class="mute">Bill to</div><b>' + esc(v.to) + "</b>" + (v.email ? "<br>" + esc(v.email) : "") + '</div><div><div class="mute">Issued</div>' + niceY(v.issued) + '<div class="mute" style="margin-top:6px">Due</div>' + niceY(v.due) + "</div></div>" +
    "<table><tr><th>Description</th><th class=r>Qty</th><th class=r>Price</th><th class=r>Amount</th></tr>" + rows + "</table>" +
    '<table class="tot"><tr><td class=r>Subtotal</td><td class=r style="width:160px">' + baht(sub) + "</td></tr><tr><td class=r>" + (v.vat ? "VAT 7%" : "No VAT") + "</td><td class=r>" + baht(tot - sub) + '</td></tr><tr class="big"><td class=r>Total</td><td class=r>' + baht(tot) + "</td></tr></table>" +
    (v.paid ? "<p><b>Paid on " + niceY(v.paid) + ".</b></p>" : "") + '<p class="note">Made with ThuraGirl (test build).</p></main></body></html>';
  var url = URL.createObjectURL(new Blob([h], { type: "text/html" })), w = window.open(url, "_blank");
  if (!w){ var a = document.createElement("a"); a.href = url; a.download = v.id + ".html"; document.body.appendChild(a); a.click(); a.remove(); toast("Saved the invoice as a file"); }
  setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
}

/* ── reminders: written for the owner to send from their own email or chat ── */
function openRemind(v, initial){
  var u = me(), tot = invTotal(v), sign = "\n" + (u.name || "") + "\n" + coName(u);
  var msg = initial ? "Hello " + v.to + ",\n\nPlease find invoice " + v.id + " for " + baht(tot) + ", due on " + niceY(v.due) + ".\n\nThank you," + sign
    : "Hello " + v.to + ",\n\nA friendly reminder that invoice " + v.id + " for " + baht(tot) + " was due on " + niceY(v.due) + ". If you have already paid, thank you, and please ignore this message.\n\nKind regards," + sign;
  var b = openGS(initial ? "Send invoice" : "Reminder", v.to, "Invoice " + v.id + " · " + baht(tot) + " · " + lateTxt(v.due));
  var em = fld("Send to", v.email, { type: "email", ph: "customer@example.com", on: function(x){ v.email = x.trim(); save(); } }); b.appendChild(em);
  var ta = fld("Message", msg, { area: 1, wide: 1 }); $("textarea", ta).rows = 8; b.appendChild(ta);
  function done(how){ if (!initial){ v.reminded = today(); } else v.sent = today(); save(); refresh(); closeGS(); toast(how); }
  var mail = btn("pill acc", "Email it", function(){
    var t = $("textarea", ta).value; location.href = "mailto:" + encodeURIComponent(v.email || "") + "?subject=" + encodeURIComponent((initial ? "Invoice " : "Reminder: invoice ") + v.id + " from " + coName(u)) + "&body=" + encodeURIComponent(t);
    done("Opened your email app");
  }, "i-chat");
  var copy = btn("pill soft", "Copy message", function(){
    var t = $("textarea", ta).value;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ done("Copied. Paste it into LINE or email."); }, function(){ $("textarea", ta).select(); toast("Select the text and copy it"); });
  });
  b.appendChild(foot(copy, mail));
  if (navigator.share){ b.appendChild(btn("pill soft wide", "Share to LINE or another app", function(){ navigator.share({ title: "Invoice " + v.id, text: $("textarea", ta).value }).then(function(){ done("Shared"); }, function(){}); })); }
  b.appendChild(el("p", "tnote", "In the full app I send this for you. Here it goes out from your own email or chat app."));
}

/* ── bills and paying them ── */
function newBill(pre){
  var u = me(), d = { to: "", amount: "", due: today(), pp: "", note: "" };
  var b = openGS("Pay", "Pay someone", "Add the bill. With a PromptPay ID I make a QR code you can scan in any Thai banking app.");
  var err = el("div", "ferrB"), g = el("div", "fgrid");
  g.appendChild(fld("Pay to", d.to, { ph: "Supplier or person", on: function(v){ d.to = v; err.textContent = ""; } }));
  g.appendChild(fld("Amount", d.amount, { prefix: "฿", mode: "decimal", ph: "0", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); d.amount = inp.value; } }));
  g.appendChild(fld("Due", d.due, { type: "date", required: 1, quick: [["Today", 0], ["In 7 days", 7], ["In 15 days", 15], ["In 30 days", 30]], on: function(v){ d.due = v; } }));
  g.appendChild(fld("PromptPay ID (optional)", d.pp, { mode: "numeric", max: 13, ph: "Phone or tax ID", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); d.pp = inp.value; return d.pp && !(d.pp.length === 10 || d.pp.length === 13) ? "A 10-digit phone number or a 13-digit ID" : ""; } }));
  g.appendChild(fld("Note (optional)", d.note, { wide: 1, ph: "Invoice number, what it is for", on: function(v){ d.note = v; } }));
  b.appendChild(g); b.appendChild(err);
  b.appendChild(foot(btn("pill soft", "Cancel", closeGS), btn("pill acc", "Save bill", function(){
    if (!d.to.trim()) return (err.textContent = "Add who you are paying.");
    if (!(num(d.amount) > 0)) return (err.textContent = "Add the amount.");
    if (!d.due) return (err.textContent = "Add the due date.");
    if (d.pp && !(d.pp.length === 10 || d.pp.length === 13)) return (err.textContent = "Check the PromptPay ID.");
    var v = { id: "b" + Date.now().toString(36), to: d.to.trim(), amount: num(d.amount), due: d.due, pp: d.pp, note: d.note.trim(), paid: "" };
    u.bills = u.bills || []; u.bills.push(v); save(); refresh(); openBill(v); toast("Bill saved");
  })));
}
function openBill(v){
  var u = me(), b = openGS("Bill", v.to, baht(v.amount) + " · " + (v.paid ? "paid " + niceY(v.paid) : lateTxt(v.due)) + (v.note ? " · " + v.note : ""));
  var qr = el("div", "qrbox");
  function paintQr(){
    qr.textContent = "";
    if (!v.pp){ qr.appendChild(el("p", "st-p", "Add the supplier's PromptPay ID and I make a QR code with the amount filled in.")); return; }
    var pl = promptPay(v.pp, v.amount); if (!pl){ qr.appendChild(el("p", "ferrB", "That PromptPay ID does not look right.")); return; }
    var box = el("div", "qr"); box.appendChild(el("span", "st-p", "Making the code…")); qr.appendChild(box);
    qrSvg(pl).then(function(svg){ box.innerHTML = svg; }, function(){ box.textContent = "The QR code could not load. Check your connection."; });
    qr.appendChild(el("p", "st-p", "Scan with any Thai banking app. PromptPay " + v.pp + ", " + baht(v.amount) + "."));
  }
  if (!v.paid){
    b.appendChild(fld("PromptPay ID", v.pp, { mode: "numeric", max: 13, ph: "Phone or tax ID", on: function(x, inp){ inp.value = x.replace(/\D/g, ""); if (inp.value.length === 10 || inp.value.length === 13){ v.pp = inp.value; save(); paintQr(); return ""; } if (!inp.value){ v.pp = ""; save(); paintQr(); } return inp.value ? "A 10-digit phone number or a 13-digit ID" : ""; } }));
    paintQr(); b.appendChild(qr);
    b.appendChild(foot(btn("pill soft", "Close", closeGS), btn("pill acc", "Mark as paid", function(){ v.paid = today(); save(); refresh(); closeGS(); toast(v.to + " marked as paid"); })));
  } else {
    b.appendChild(el("p", "st-p okt", "Paid on " + niceY(v.paid) + (v.via === "statement" ? ". I found it in your bank statement." : ".")));
    b.appendChild(foot(btn("pill soft", "Mark as unpaid", function(){ v.paid = ""; v.via = ""; save(); refresh(); openBill(v); })));
  }
  var del = btn("alt danger", "Delete this bill", function(){ if (del.getAttribute("data-arm")){ u.bills = u.bills.filter(function(x){ return x !== v; }); save(); refresh(); closeGS(); toast("Bill deleted"); } else { del.setAttribute("data-arm", "1"); del.textContent = "Tap again to delete"; } });
  b.appendChild(del);
}

/* ── receipts and other files dropped into the chat ── */
function fileReceipt(f){
  var u = me(), meta = { name: f.name, size: f.size, at: Date.now() };
  var open = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; })[0];
  u.rcpt = u.rcpt || {};
  if (open){ u.rcpt[open.k.slice(3)] = meta; save(); refresh(); return "Got it. I filed " + f.name + " as the receipt for " + open.m + "."; }
  u.rcpt["file:" + Date.now()] = meta; save(); refresh(); return "Got it. I saved " + f.name + " with your receipts.";
}

/* ── ThuraGirl answers from the books ── */
function span(u, a, b){
  var o = { inc: 0, exp: 0, cats: {}, n: 0 };
  (u.tx || []).forEach(function(x){ if (x.d < a || x.d > b) return; o.n++; if (x.a > 0) o.inc += x.a; else o.exp -= x.a; var c = cat(x.t, x.a); o.cats[c] = (o.cats[c] || 0) + Math.abs(x.a); });
  o.kept = o.inc - o.exp; return o;
}
function whichMonth(t, asOf){
  var A = day(asOf), y = A.getFullYear(), m = -1;
  if (/last month|previous month|เดือนที่แล้ว|เดือนก่อน/.test(t)) m = A.getMonth() - 1;
  else if (/this month|เดือนนี้/.test(t)) m = A.getMonth();
  else MONTH.forEach(function(n, i){ if (new RegExp("\\b(" + n.toLowerCase() + "|" + MON3[i] + ")\\b").test(t)) m = i; });
  if (m < 0) return null;
  if (m > A.getMonth()) y -= 1; if (m < 0){ m += 12; y -= 1; }
  var a = iso(new Date(y, m, 1)), b = iso(new Date(y, m + 1, 0)); if (b > asOf) b = asOf;
  return { a: a, b: b, name: MONTH[m], partial: b === asOf && day(asOf).getDate() < new Date(y, m + 1, 0).getDate() };
}
var CATWORDS = [[/wage|salar|payroll|staff/, "Wages"], [/rent|landlord/, "Rent"], [/marketing|ads?\b|advert|facebook/, "Marketing"], [/stock|ingredient|supplies|makro|food cost|supplier/, "Stock and supplies"],
  [/utilit|electric|water|internet|power/, "Utilities"], [/tax|vat|sso|social security/, "Tax and social security"], [/fee|bank charge/, "Bank fees"]];
function brain(q){
  var u = me(), t = q.toLowerCase(), B = books(u), T = today();
  if (/^(hi|hello|hey|สวัสดี)/.test(t)) return "Hello " + first(u) + ". Ask me about your cash, a month, who owes you, your bills or where the money goes.";
  if (/(create|make|new|send|write|ทำ|สร้าง).*(invoice|bill to|ใบแจ้งหนี้)|^invoice/.test(t)){ setTimeout(function(){ newInvoice(); }, 300); return "Opening a new invoice for you."; }
  if (/upload|statement|import/.test(t) && !/p&l|profit/.test(t)){ setTimeout(function(){ openUpload(); }, 300); return "Opening the statement upload. CSV and Excel files work best."; }
  if (!B) return "I don't have any numbers yet. Upload a bank statement, or try the sample, and I can answer that.";
  var F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()];
  var openInv = (u.invoices || []).filter(function(v){ return !v.paid; }), lateInv = openInv.filter(function(v){ return v.due < T; });
  var openBills = (u.bills || []).filter(function(v){ return !v.paid; }), lateBills = openBills.filter(function(v){ return v.due < T; });
  if (/^(pay|i want to pay|make a payment)/.test(t)){ setTimeout(function(){ newBill(); }, 300); return "Opening a new payment. Add the PromptPay ID and I make a QR code."; }
  if (/who owes|owes me|owed to me|receivable|unpaid invoice|outstanding invoice/.test(t)){
    if (!openInv.length) return "Nobody owes you anything right now. Every invoice is paid.";
    return openInv.length + (openInv.length === 1 ? " invoice is" : " invoices are") + " open, " + baht(openInv.reduce(function(s, v){ return s + invTotal(v); }, 0)) + " in total." +
      (lateInv.length ? " Late: " + lateInv.map(function(v){ return v.to + " (" + baht(invTotal(v)) + ", " + lateTxt(v.due) + ")"; }).join(", ") + ". Open one in Money and tap Remind." : " None are late yet.");
  }
  if (/overdue|late|behind/.test(t)){
    var L = lateInv.map(function(v){ return "invoice #" + v.id + " from " + v.to + " (" + baht(invTotal(v)) + ", " + lateTxt(v.due) + ")"; }).concat(lateBills.map(function(v){ return "your " + v.to + " bill (" + baht(v.amount) + ", " + lateTxt(v.due) + ")"; }));
    return L.length ? (L.length === 1 ? "One thing is overdue: " : L.length + " things are overdue: ") + L.join("; ") + "." : "Nothing is overdue. Well done.";
  }
  if (/bill|i owe|do i owe|payable|due soon|upcoming/.test(t)){
    if (!openBills.length) return "No bills are waiting. Add one with Pay and I remind you before it is due.";
    return "You have " + openBills.length + (openBills.length === 1 ? " bill" : " bills") + " to pay, " + baht(openBills.reduce(function(s, v){ return s + v.amount; }, 0)) + " in total. Next: " +
      openBills.sort(function(a, b){ return a.due < b.due ? -1 : 1; }).slice(0, 3).map(function(v){ return v.to + " " + baht(v.amount) + " (" + lateTxt(v.due).toLowerCase() + ")"; }).join(", ") + ".";
  }
  if (/vat|tax|set aside|pp\.?30/.test(t)){
    var x = F.tax; return "For " + mName + " so far I would set aside " + baht(x[0] + x[1] + x[2]) + ": VAT " + baht(x[0]) + (u.setup.vat === "No" ? " (you said you are not VAT registered)" : "") + ", withholding " + baht(x[1]) + ", and " + baht(x[2]) + " towards company tax. These are estimates from your statements, not a filing.";
  }
  var cw = CATWORDS.filter(function(c){ return c[0].test(t); })[0], wm = whichMonth(t, B.asOf);
  if (cw && /how much|spend|spent|cost|pay|paid|on /.test(t) || cw && !/profit|p&l/.test(t)){
    var r = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s = span(u, r.a, r.b), v = s.cats[cw[1]] || 0;
    return v ? cw[1] + " in " + r.name + ": " + baht(v) + ", " + (s.exp ? Math.round(v / s.exp * 100) : 0) + "% of everything that went out." : "I don't see any " + cw[1].toLowerCase() + " in " + r.name + ".";
  }
  if (/where.*(go|went)|spend|spent|expens|cost|money out/.test(t)){
    var r2 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s2 = span(u, r2.a, r2.b), top = Object.keys(s2.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s2.cats[b] - s2.cats[a]; });
    return baht(s2.exp) + " went out in " + r2.name + ". The biggest: " + top.slice(0, 4).map(function(c){ return c.toLowerCase() + " " + baht(s2.cats[c]) + " (" + Math.round(s2.cats[c] / s2.exp * 100) + "%)"; }).join(", ") + ".";
  }
  if (/come from|revenue|sales|income|earn|money in|customers?/.test(t)){
    var r3 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s3 = span(u, r3.a, r3.b), tops = Object.keys(s3.cats).filter(function(c){ return INC.some(function(e){ return e[1] === c; }) || c === "Other income"; }).sort(function(a, b){ return s3.cats[b] - s3.cats[a]; });
    return baht(s3.inc) + " came in during " + r3.name + ": " + tops.slice(0, 4).map(function(c){ return c.toLowerCase() + " " + baht(s3.cats[c]); }).join(", ") + ".";
  }
  if (/p&l|profit and loss|income statement|full p/.test(t)){
    var r4 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" }, s4 = span(u, r4.a, r4.b), lines = ["Profit and loss, " + r4.name + " (from your bank lines)", "Money in " + baht(s4.inc)];
    Object.keys(s4.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s4.cats[b] - s4.cats[a]; }).forEach(function(c){ lines.push("  " + c + " " + baht(s4.cats[c])); });
    lines.push("Money out " + baht(s4.exp)); lines.push((s4.kept >= 0 ? "Kept " : "Lost ") + baht(Math.abs(s4.kept)) + (s4.inc ? ", a " + (s4.kept / s4.inc * 100).toFixed(1) + "% margin" : ""));
    return lines.join("\n");
  }
  if (wm || /how was|how did|profit|month|quarter|year|doing|perform/.test(t)){
    var r5 = wm || { a: B.fin.mtd.from, b: B.asOf, name: mName + " so far" };
    if (/quarter/.test(t)){ var Q = B.fin.qtd; return "This quarter so far: " + baht(Q.rev) + " in, " + baht(Q.exp) + " out, " + baht(Q.rev - Q.exp) + " kept" + (Q.d != null ? ", " + (Q.d >= 0 ? "up " : "down ") + pctTxt(Q.d) + " on the same point last quarter." : "."); }
    if (/year/.test(t)){ var Y = B.fin.ytd; return "This year so far (since your statements start on " + nice(B.first) + "): " + baht(Y.rev) + " in, " + baht(Y.exp) + " out, " + baht(Y.rev - Y.exp) + " kept."; }
    var s5 = span(u, r5.a, r5.b); if (!s5.n) return "I don't have statements for " + r5.name + ". They start on " + niceY(B.first) + ".";
    var big = Object.keys(s5.cats).filter(function(c){ return EXP.some(function(e){ return e[1] === c; }) || c === "Other costs"; }).sort(function(a, b){ return s5.cats[b] - s5.cats[a]; })[0];
    return r5.name + (r5.partial ? "" : "") + ": " + baht(s5.inc) + " in and " + baht(s5.exp) + " out. You " + (s5.kept >= 0 ? "kept " + baht(s5.kept) : "spent " + baht(-s5.kept) + " more than came in") + (s5.inc ? ", a " + (s5.kept / s5.inc * 100).toFixed(1) + "% margin" : "") + "." + (big ? " The biggest cost was " + big.toLowerCase() + " at " + baht(s5.cats[big]) + "." : "");
  }
  if (/cash|bank|balance|money|how much do i have/.test(t)){
    var low = B.series.reduce(function(m, s){ return s[1] < m[1] ? s : m; }, B.series[0]);
    return "Cash is " + baht(B.cash) + " across " + u.banks.length + (u.banks.length === 1 ? " account" : " accounts") + ", as of " + nice(B.asOf) + "." + (B.cashD != null ? " That is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(B.cashD) + " since the start of " + mName + "." : "") + " The lowest point in the last 30 days was " + baht(low[1]) + " on " + nice(low[0]) + ".";
  }
  if (/receipt/.test(t)){ var n = Object.keys(u.rcpt || {}).length, miss = tasks(u).filter(function(x){ return x.k.indexOf("rc:") === 0; }).length; return n + (n === 1 ? " receipt is" : " receipts are") + " filed." + (miss ? " " + miss + " large payments still need one. Tap + to add a photo." : ""); }
  if (/help|what can you|how do/.test(t)) return "I read your bank statements and keep your books. Ask me things like \"How was " + (B.pack ? B.pack.name : mName) + "?\", \"Where did the money go?\", \"Who owes me money?\", \"How much did I spend on wages?\" or \"Show the full P&L\". I can also make an invoice or a payment.";
  return "I'm not sure about that one yet. In this test build I answer from your statements, invoices and bills. Try \"How's my cash?\", \"What's overdue?\" or \"Where did the money go?\"";
}

/* ── chat: send, suggestions, + and the mic ── */
var chat = { timer: 0, rec: null, on: false };
function ask(q){
  q = (q || "").trim(); if (!q) return;
  if (chat.flow){ $("#b-in").value = ""; $("#b-send").disabled = true; return flowAnswer(q); }
  var inp = $("#b-in"), pop = $("#b-pop"); inp.value = ""; $("#b-send").disabled = true; $("#b-sug").hidden = true; pop.hidden = false; $("#b-me").textContent = q;
  var r = $("#b-reply"); r.innerHTML = '<span class="dotsT" aria-label="ThuraGirl is typing"><i></i><i></i><i></i></span>';
  clearTimeout(chat.timer); chat.timer = setTimeout(function(){ r.textContent = brain(q); }, calm ? 0 : 650);
}
function say(me2, reply){ var pop = $("#b-pop"); pop.hidden = false; $("#b-sug").hidden = true; $("#b-me").textContent = me2; $("#b-reply").textContent = reply; }
function chips(){
  var u = me(), B = books(u), last = B && B.pack ? B.pack.name : "this month";
  return tab === "money" ? ["Who owes me money?", "Where did the money go?", "Show the full P&L"] : ["What's overdue?", "How was " + last + "?", "How's my cash?"];
}
function micToggle(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = $("#b-mic"), inp = $("#b-in");
  if (!SR){ toast("Voice input doesn't work in this browser. Try Chrome, Edge or Safari."); return; }
  if (chat.on && chat.rec){ chat.rec.stop(); return; }
  var r = new SR(), got = "";
  r.lang = /^th/i.test(navigator.language || "") ? "th-TH" : "en-US"; r.interimResults = true; r.continuous = false;
  r.onstart = function(){ chat.on = true; mic.classList.add("rec"); mic.setAttribute("aria-pressed", "true"); inp.placeholder = "Listening…"; };
  r.onresult = function(ev){ var s = ""; for (var i = 0; i < ev.results.length; i++) s += ev.results[i][0].transcript; inp.value = s; $("#b-send").disabled = !s.trim(); if (ev.results[ev.results.length - 1].isFinal) got = s; };
  r.onerror = function(ev){ if (ev.error === "not-allowed" || ev.error === "service-not-allowed") toast("Microphone access is blocked. Allow it for this site to talk to me."); else if (ev.error === "no-speech") toast("I didn't hear anything. Tap the mic and try again."); else if (ev.error !== "aborted") toast("Voice input stopped: " + ev.error); };
  r.onend = function(){ chat.on = false; mic.classList.remove("rec"); mic.setAttribute("aria-pressed", "false"); inp.placeholder = "Ask ThuraGirl"; if (got.trim()) ask(got); };
  chat.rec = r; try { r.start(); } catch (e) { toast("Voice input could not start."); }
}
function chatFile(f){ anyUpload(f); }

/* ── settings: your data ── */
var dataArmed = false;
function dataCard(u, root){
  var c = card("Your data");
  c.appendChild(el("p", "st-p", u.tx && u.tx.length ? u.tx.length + " bank lines from " + u.banks.length + (u.banks.length === 1 ? " account" : " accounts") + ", " + (u.invoices || []).length + " invoices, " + (u.bills || []).length + " bills and " + Object.keys(u.rcpt || {}).length + " receipts are saved in this browser." : "Nothing is loaded yet. Upload a statement or try the sample."));
  var r = el("div", "chips");
  r.appendChild(btn("pill soft act", "Download a copy", function(){
    var copy = JSON.parse(JSON.stringify(u)); delete copy.salt; delete copy.hash;
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" })); a.download = "thuragirl-" + today() + ".json"; document.body.appendChild(a); a.click(); a.remove();
  }));
  if (!u.tx || !u.tx.length) r.appendChild(btn("pill soft act", "Load the sample", function(){ useSample(); }));
  else r.appendChild(btn("pill soft act danger", dataArmed ? "Tap again to clear" : "Clear statements and invoices", function(){
    if (!dataArmed){ dataArmed = true; renderSettings(); return; }
    dataArmed = false; u.tx = []; u.banks = []; u.invoices = []; u.bills = []; u.rcpt = {}; u.done = {}; u.hasData = false; u.matched = 0; u.sample = false; save(); BK_CACHE.key = ""; renderSettings(); toast("Cleared");
  }));
  c.appendChild(r); root.appendChild(c);
}
/* ── extra line icons, same 1.5px stroke as the sprite ── */
(function(){
  var s = $("#i-x"); if (!s || $("#i-cal")) return;
  s.parentNode.insertAdjacentHTML("beforeend",
    '<symbol id="i-cal" viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></symbol>' +
    '<symbol id="i-face" viewBox="0 0 24 24"><path d="M4 8.5V6.5A2.5 2.5 0 0 1 6.5 4h2M15.5 4h2A2.5 2.5 0 0 1 20 6.5v2M20 15.5v2a2.5 2.5 0 0 1-2.5 2.5h-2M8.5 20h-2A2.5 2.5 0 0 1 4 17.5v-2"/><path d="M9 9.5v1M15 9.5v1M12 9.5v3.5h-1M9.5 16a3.5 3.5 0 0 0 5 0"/></symbol>' +
    '<symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.5"/><path d="M3 19.5a6 6 0 0 1 12 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6 6 0 0 1 3 5.3"/></symbol>' +
    '<symbol id="i-folder" viewBox="0 0 24 24"><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h3.5l2 2.5H18a2.5 2.5 0 0 1 2.5 2.5v7.5A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z"/></symbol>' +
    '<symbol id="i-bell" viewBox="0 0 24 24"><path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></symbol>');
})();

/* ── a calendar that replaces the browser's date box ── */
var DP_WD = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
function dateUI(inp, o){
  inp.type = "text"; inp.hidden = true; inp.tabIndex = -1;
  var box = inp.parentNode, lab = box.parentNode, b = el("button", "dp-btn"), pop = null;
  b.type = "button"; b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false");
  function show(){ b.innerHTML = '<svg class="i"><use href="#i-cal"/></svg>'; b.appendChild(el("span", inp.value ? "" : "ph", inp.value ? niceY(inp.value) : (o.ph || "Choose a date"))); }
  function close(){ if (!pop) return; pop.remove(); pop = null; document.removeEventListener("mousedown", outside, true); document.removeEventListener("keydown", esc2, true); b.setAttribute("aria-expanded", "false"); }
  function outside(ev){ if (pop && !pop.contains(ev.target) && !b.contains(ev.target)) close(); }
  function esc2(ev){ if (ev.key === "Escape"){ ev.stopPropagation(); close(); b.focus(); } }
  function set(v){ inp.value = v; inp.dispatchEvent(new Event("input")); inp.dispatchEvent(new Event("change")); show(); close(); try { b.focus({ preventScroll: true }); } catch (e) {} }
  function ok(v){ return !(o.maxDate && v > o.maxDate) && !(o.minDate && v < o.minDate); }
  function open(){
    var t = today(), start = inp.value || (o.maxDate && o.maxDate < t ? (o.startYearsBack ? iso(new Date(day(t).getFullYear() - o.startYearsBack, 0, 1)) : o.maxDate) : t), view = day(start);
    var vy = view.getFullYear(), vm = view.getMonth();
    pop = el("div", "dp"); pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Choose a date");
    function paint(focusSel){
      pop.textContent = "";
      var h = el("div", "dp-h"), prev = btn("cb-btn dp-nav", "", function(){ vm--; if (vm < 0){ vm = 11; vy--; } paint(); }, "i-chevl"), next = btn("cb-btn dp-nav", "", function(){ vm++; if (vm > 11){ vm = 0; vy++; } paint(); }, "i-chevr");
      prev.setAttribute("aria-label", "Previous month"); next.setAttribute("aria-label", "Next month");
      var ms = el("select", "dp-sel"), ys = el("select", "dp-sel"), ty = day(t).getFullYear();
      MONTH.forEach(function(m, i){ var op = el("option", "", m); op.value = i; ms.appendChild(op); }); ms.value = vm; ms.setAttribute("aria-label", "Month");
      var y0 = o.maxDate && o.maxDate <= t ? ty - 100 : ty - 5, y1 = o.maxDate && o.maxDate <= t ? ty : ty + 5;
      for (var y = y1; y >= y0; y--){ var oy = el("option", "", String(y)); oy.value = y; ys.appendChild(oy); } ys.value = vy; ys.setAttribute("aria-label", "Year");
      ms.addEventListener("change", function(){ vm = +ms.value; paint(); }); ys.addEventListener("change", function(){ vy = +ys.value; paint(); });
      h.appendChild(prev); var mid = el("div", "dp-my"); mid.appendChild(ms); mid.appendChild(ys); h.appendChild(mid); h.appendChild(next); pop.appendChild(h);
      if (o.quick){
        var q = el("div", "dp-q");
        o.quick.forEach(function(x){ var v = addDays(o.from ? o.from() : t, x[1]); q.appendChild(btn("dp-chip" + (inp.value === v ? " on" : ""), x[0], function(){ set(v); })); });
        pop.appendChild(q);
      }
      var g = el("div", "dp-g"); g.setAttribute("role", "grid");
      DP_WD.forEach(function(w){ g.appendChild(el("span", "dp-wd", w)); });
      var f = new Date(vy, vm, 1), lead = (f.getDay() + 6) % 7, n = new Date(vy, vm + 1, 0).getDate(), selBtn = null;
      for (var i = 0; i < lead; i++) g.appendChild(el("span"));
      for (var d = 1; d <= n; d++){
        (function(v, dd){
          var c = el("button", "dp-d" + (v === t ? " now" : "") + (v === inp.value ? " on" : ""), String(dd)); c.type = "button";
          c.setAttribute("aria-label", niceY(v)); if (v === inp.value) c.setAttribute("aria-current", "date");
          if (!ok(v)) c.disabled = true; else c.addEventListener("click", function(){ set(v); });
          c.addEventListener("keydown", function(ev){
            var m = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key]; if (!m) return; ev.preventDefault();
            var nv = addDays(v, m), nd = day(nv); if (nd.getMonth() !== vm){ vm = nd.getMonth(); vy = nd.getFullYear(); paint(nv); } else { var x = $('[aria-label="' + niceY(nv) + '"]', pop); if (x) x.focus(); }
          });
          if (v === (focusSel || inp.value || t)) selBtn = c;
          g.appendChild(c);
        })(iso(new Date(vy, vm, d)), d);
      }
      pop.appendChild(g);
      var ft = el("div", "dp-f");
      if (ok(t)) ft.appendChild(btn("lnk", "Today", function(){ set(t); }));
      if (inp.value && !o.required) ft.appendChild(btn("lnk", "Clear", function(){ set(""); }));
      pop.appendChild(ft);
      if (focusSel !== false) setTimeout(function(){ try { (selBtn || $(".dp-d:not([disabled])", pop)).focus({ preventScroll: true }); } catch (e) {} }, 0);
    }
    lab.appendChild(pop); paint();
    b.setAttribute("aria-expanded", "true");
    document.addEventListener("mousedown", outside, true); document.addEventListener("keydown", esc2, true);
    try { pop.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }
  b.addEventListener("click", function(ev){ ev.preventDefault(); if (pop) close(); else open(); });
  box.appendChild(b); show();
  inp._dpShow = show;
}

/* ── passkeys: Face ID, Touch ID, Windows Hello or a phone ── */
function pkOk(){ return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create) && window.isSecureContext; }
function b64u(buf){ var s = "", a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function rnd(n){ var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
function pkName(){ var ua = navigator.userAgent; return /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Mac/.test(ua) ? "Mac" : /Android/.test(ua) ? "Android phone" : /Windows/.test(ua) ? "Windows PC" : "This device"; }
function pkCreate(u, done){
  if (!pkOk()) return toast("This browser can't make passkeys.");
  var uid = u.pkUser || b64u(rnd(16)); u.pkUser = uid;
  var raw = Uint8Array.from(atob(uid.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - uid.length % 4) % 4)), function(c){ return c.charCodeAt(0); });
  navigator.credentials.create({ publicKey: {
    challenge: rnd(32), rp: { name: "ThuraGirl" }, user: { id: raw, name: u.email, displayName: u.name || u.email },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
    authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "required" }, timeout: 60000, attestation: "none"
  } }).then(function(c){
    if (!c) return;
    u.passkeys = (u.passkeys || []).concat([{ id: b64u(c.rawId), at: Date.now(), on: pkName() }]); save();
    toast("Passkey added. Next time, sign in with " + (/iPhone|iPad|Mac/.test(pkName()) ? "Face ID or Touch ID" : "your device") + "."); if (done) done();
  }).catch(function(e){ if (e && e.name !== "NotAllowedError" && e.name !== "AbortError") toast("The passkey was not added: " + (e.message || e.name)); });
}
function pkSignIn(err){
  if (!pkOk()) return;
  navigator.credentials.get({ publicKey: { challenge: rnd(32), userVerification: "required", timeout: 60000 } }).then(function(c){
    if (!c) return;
    var id = b64u(c.rawId), acc = null;
    Object.keys(db.users).forEach(function(k){ if ((db.users[k].passkeys || []).some(function(p){ return p.id === id; })) acc = db.users[k]; });
    if (!acc){ err.textContent = "That passkey isn't linked to an account in this browser."; return; }
    (acc.passkeys || []).forEach(function(p){ if (p.id === id) p.used = Date.now(); });
    db.session = acc.email; acc.justIn = true; save(); suStep = acc.onboarded ? 0 : 1; go("");
  }).catch(function(e){ if (e && e.name !== "NotAllowedError" && e.name !== "AbortError") err.textContent = "Passkey sign-in didn't work: " + (e.message || e.name); });
}
function pkButton(err){
  var b = btn("su-pk", "Sign in with Face ID or a passkey", function(){ err.textContent = ""; pkSignIn(err); }, "i-face");
  return b;
}
function securityCard(u, root){
  var c = card("Sign-in and security");
  var row = el("div", "ob-row"); row.appendChild(el("span", "ob-av ic", "")); $(".ob-av", row).innerHTML = '<svg class="i"><use href="#i-face"/></svg>';
  var tx = el("div", "tx"); tx.appendChild(el("b", "", "Passkey (recommended)"));
  var pk = u.passkeys || [];
  tx.appendChild(el("span", "", !pkOk() ? "This browser can't make passkeys. Try Safari or Chrome on your phone or computer." : pk.length ? "On " + pk.map(function(p){ return p.on; }).join(", ") + ". Sign in with Face ID, Touch ID or your screen lock." : "Sign in with Face ID or Touch ID instead of a password."));
  row.appendChild(tx);
  if (pkOk()) row.appendChild(btn("pill soft act", pk.length ? "Add another" : "Add passkey", function(){ pkCreate(u, function(){ renderSettings(); }); }));
  var rows = el("div", "ob-rows"); rows.appendChild(row);
  pk.forEach(function(p, i){
    var r = el("div", "ob-row sub"), t2 = el("div", "tx"); t2.appendChild(el("b", "", p.on)); t2.appendChild(el("span", "", "Added " + ago(p.at, true) + (p.used ? " · last used " + ago(p.used, true) : ""))); r.appendChild(t2);
    var x = btn("pill soft act", p.arm ? "Tap again to remove" : "Remove", function(){ if (!p.arm){ p.arm = 1; renderSettings(); return; } pk.splice(i, 1); save(); renderSettings(); toast("Passkey removed from your account. Also delete it from your device's password settings."); });
    r.appendChild(x); rows.appendChild(r); delete p.arm;
  });
  c.appendChild(rows);
  var pw = el("details", "pwd"), sm = el("summary", "", "Change password"); pw.appendChild(sm);
  var g = el("div", "fgrid"), v = { cur: "", a: "", b: "" };
  g.appendChild(fld("Current password", "", { wide: 1, on: function(x, inp){ inp.type = "password"; v.cur = x; } }));
  g.appendChild(fld("New password", "", { on: function(x, inp){ inp.type = "password"; v.a = x; return x && x.length < 8 ? "At least 8 characters" : ""; } }));
  g.appendChild(fld("Type it again", "", { on: function(x, inp){ inp.type = "password"; v.b = x; return x && x !== v.a ? "Doesn't match" : ""; } }));
  $$("input", g).forEach(function(i){ i.type = "password"; i.autocomplete = "new-password"; });
  pw.appendChild(g);
  var er = el("div", "ferrB"); pw.appendChild(er);
  pw.appendChild(btn("pill acc", "Update password", function(){
    er.textContent = "";
    if (!v.cur || !v.a || !v.b) return er.textContent = "Fill in all three.";
    if (v.a.length < 8) return er.textContent = "The new password needs 8 or more characters.";
    if (v.a !== v.b) return er.textContent = "The new passwords don't match.";
    digest(u.salt + v.cur).then(function(h){
      if (h !== u.hash){ er.textContent = "The current password isn't right."; return; }
      var s = salt(); digest(s + v.a).then(function(h2){ u.salt = s; u.hash = h2; save(); toast("Password updated"); renderSettings(); });
    });
  }));
  c.appendChild(pw);
  c.appendChild(el("p", "tnote", "Test build: the passkey is made on your device for real, but sign-in is checked in this browser only. The live app checks it on ThuraGirl's server."));
  root.appendChild(c);
}

/* ── apps to connect ── */
var APPS = [
  ["Banks", "Your money in and out", [["kbank", "KB", "K-Bank"], ["scb", "SC", "SCB"], ["bbl", "BB", "Bangkok Bank"], ["bay", "KS", "Krungsri"], ["ktb", "KT", "Krungthai"], ["ttb", "TT", "ttb"]]],
  ["Accounting", "Books you already keep", [["flow", "FA", "FlowAccount"], ["peak", "PK", "PEAK"], ["xero", "XE", "Xero"]]],
  ["Point of sale", "Card, cash and QR sales", [["loyverse", "LV", "Loyverse POS"], ["ocha", "OC", "Ocha"], ["foodstory", "FS", "FoodStory"], ["wongnai", "WN", "Wongnai POS"]]],
  ["Delivery and marketplaces", "Payouts and fees", [["grab", "GF", "GrabFood"], ["lineman", "LM", "LINE MAN"], ["shopee", "SH", "Shopee"], ["lazada", "LZ", "Lazada"], ["tiktok", "TS", "TikTok Shop"]]],
  ["Messaging", "Send receipts from chat", [["line", "LN", "LINE"]]]
];
var BANKMAP = { kbank: "K-Bank", scb: "SCB", bbl: "Bangkok Bank", bay: "Krungsri", ktb: "Krungthai", ttb: "ttb" };
function hasBank(u, id){ return (u.banks || []).some(function(b){ return b.bank === BANKMAP[id]; }); }
function connCount(u){ return Object.keys(u.setup.conn || {}).length + (u.banks || []).length; }
function gated(u){ return u.path === "new" && !(u.reg && u.reg.submitted); }
function connList(u, again, compact){
  var w = el("div", "apps");
  APPS.forEach(function(g, gi){
    if (gated(u) && gi === 0) return;
    var sec = el("div", "apps-g"), h = el("div", "apps-h"); h.appendChild(el("b", "", g[0])); h.appendChild(el("span", "", g[1])); sec.appendChild(h);
    var list = el("div", "apps-l");
    g[2].forEach(function(a){
      var bank = !!BANKMAP[a[0]], on = bank ? hasBank(u, a[0]) : !!u.setup.conn[a[0]];
      var b = el("button", "app" + (on ? " on" : "")); b.type = "button"; b.setAttribute("aria-pressed", String(on));
      b.appendChild(el("span", "ob-av", a[1])); var t = el("span", "tx"); t.appendChild(el("b", "", a[2])); t.appendChild(el("small", "", on ? (bank ? "Statement in" : "Connected") : bank ? "Upload a statement" : "Connect")); b.appendChild(t);
      if (on) b.insertAdjacentHTML("beforeend", '<svg class="i ck"><use href="#i-check"/></svg>');
      b.addEventListener("click", function(){
        if (bank){ closeGS(); var have = (u.banks || []).filter(function(x){ return x.bank === BANKMAP[a[0]]; })[0]; openUpload(have || { bank: BANKMAP[a[0]], acct: "" }); return; }
        if (on) delete u.setup.conn[a[0]]; else u.setup.conn[a[0]] = Date.now(); save(); if (again) again();
        if (!on) toast(a[2] + " connected (test). I start reading it once the live link is on.");
      });
      list.appendChild(b);
    });
    sec.appendChild(list); w.appendChild(sec);
  });
  if (!compact) w.appendChild(el("p", "tnote", "Banks: live feeds need each bank's approval, so for now upload a CSV or Excel statement from your banking app. Other apps: tapping Connect marks them in this test build. The live link is set up on ThuraGirl's server."));
  return w;
}
function openConnect(firstTime){
  var u = me(), b = openGS(firstTime ? (Date.now() - (u.created || 0) < 36e5 ? "One more thing" : "Welcome back") : "Connections", firstTime ? "Connect your apps, " + first(u) : "Connect your apps", "The more I can read, the less you type. Pick the ones you use.");
  if (firstTime && pkOk() && !(u.passkeys || []).length){
    var r = el("div", "ob-row pkoffer"); r.appendChild(el("span", "ob-av ic")); $(".ob-av", r).innerHTML = '<svg class="i"><use href="#i-face"/></svg>';
    var t = el("div", "tx"); t.appendChild(el("b", "", "Sign in faster next time")); t.appendChild(el("span", "", "Use Face ID or Touch ID instead of your password.")); r.appendChild(t);
    r.appendChild(btn("pill soft act", "Turn on", function(){ pkCreate(u, function(){ r.remove(); }); })); b.appendChild(r);
  }
  var holder = el("div"); b.appendChild(holder);
  var paint = function(){ holder.textContent = ""; holder.appendChild(connList(u, paint)); };
  paint();
  var later = btn("pill soft", "Not now", function(){ closeGS(); });
  var done = btn("pill acc", "Done", function(){ closeGS(); refresh(); });
  b.appendChild(foot(later, done));
  if (firstTime){
    var na = el("label", "shB-ok"), cb = el("input"); cb.type = "checkbox"; cb.checked = !!u.noConnAsk; cb.addEventListener("change", function(){ u.noConnAsk = cb.checked; save(); });
    na.appendChild(cb); na.appendChild(el("span", "", "Don't ask me when I sign in")); b.appendChild(na);
  }
}
function maybeConnect(u){
  if (!u.justIn) return;
  delete u.justIn; save();
  if (gated(u) || u.noConnAsk) return;
  if (Object.keys(u.setup.conn || {}).length >= 2 && (u.banks || []).length) return;
  setTimeout(function(){ openConnect(true); }, calm ? 0 : 450);
}

/* ── the empty dashboard: first visit, and the new-company lock ── */
function paintEmpty(u){
  var lock = gated(u), e = $("#b-home .emptyB"); if (!e) return;
  var h = $("h1", e), p = $("p", e);
  if (lock){
    h.textContent = "First, your company.";
    p.textContent = "Bank statements and your dashboard open once the company is registered. Finish the registration and I take it to DBD for you.";
  } else {
    h.textContent = (u.banks || []).length ? "Almost there." : "Welcome, " + first(u) + ".";
    p.textContent = "Connect your bank or upload a statement, and I build your dashboard from it: your cash, money in and out, and what needs you.";
  }
  $$(".js-upload, .js-sample, .js-reg, .js-conn", e).forEach(function(x){ x.hidden = true; });
  var bar = $(".upbar", e) || e;
  var reg = $(".js-reg", e); if (!reg){ reg = btn("pill acc js-reg", "Continue registration", function(){ go("register"); }); bar.appendChild(reg); }
  var cn = $(".js-conn", e); if (!cn){ cn = btn("pill soft js-conn", "Connect apps", function(){ openConnect(false); }, "i-link"); bar.appendChild(cn); }
  reg.hidden = !lock;
  $$(".js-upload, .js-sample", e).forEach(function(x){ x.hidden = lock; });
  cn.hidden = lock;
  $$(".emptyP").forEach(function(ep){
    var hh = $("h1", ep), pp = $("p", ep);
    if (lock){ hh.textContent = "Not yet."; pp.textContent = "This fills in after your company is registered and its bank account has a statement."; }
    $$(".js-upload, .js-sample", ep).forEach(function(x){ x.hidden = lock; });
    var r2 = $(".js-reg", ep); if (lock && !r2){ r2 = btn("pill acc js-reg", "Continue registration", function(){ go("register"); }); ep.appendChild(r2); } if (r2) r2.hidden = !lock;
  });
}

/* ── payroll ── */
var SSO_CAP = 17500;
function ssoOf(pay){ return Math.round(Math.min(Math.max(pay, 1650), SSO_CAP) * 0.05); }
function pnd1Of(pay){
  var yr = pay * 12, net = Math.max(0, yr - Math.min(yr * 0.5, 100000) - 60000 - Math.min(ssoOf(pay) * 12, 10500)), tax = 0, lo = 0;
  [[150000, 0], [300000, .05], [500000, .1], [750000, .15], [1000000, .2], [2000000, .25], [5000000, .3], [1e15, .35]].forEach(function(b){ if (net > lo) tax += (Math.min(net, b[0]) - lo) * b[1]; lo = b[0]; });
  return Math.round(tax / 12);
}
function payRun(u){
  var r = { gross: 0, sso: 0, tax: 0, net: 0, rows: [] };
  (u.team || []).forEach(function(p){ var s = u.setup.sso === "No" ? 0 : ssoOf(p.pay), t = pnd1Of(p.pay); r.rows.push({ p: p, sso: s, tax: t, net: p.pay - s - t }); r.gross += p.pay; r.sso += s; r.tax += t; r.net += p.pay - s - t; });
  return r;
}
function payKey(){ return today().slice(0, 7); }
function payDay(){ var t = day(today()); return iso(new Date(t.getFullYear(), t.getMonth(), 25)); }
function openPayroll(){
  var u = me(), R = payRun(u), m = MONTH[day(today()).getMonth()], k = "pay:" + payKey(), done = u.done[k];
  var b = openGS("Payroll", m + " payroll", (u.team || []).length + " people · paid on " + nice(payDay()));
  var tb = el("div", "ptab"), hd = el("div", "ptr ph"); ["Person", "Salary", "SSO", "Tax", "Pay"].forEach(function(x){ hd.appendChild(el("span", "", x)); }); tb.appendChild(hd);
  R.rows.forEach(function(r){ var x = el("div", "ptr"), n = el("span", "pn"); n.appendChild(el("b", "", r.p.name)); n.appendChild(el("small", "", r.p.role)); x.appendChild(n); [r.p.pay, r.sso, r.tax, r.net].forEach(function(v){ x.appendChild(el("span", "num", baht(v))); }); tb.appendChild(x); });
  var tot = el("div", "ptr pt"); tot.appendChild(el("span", "", "Total")); [R.gross, R.sso, R.tax, R.net].forEach(function(v){ tot.appendChild(el("span", "num", baht(v))); }); tb.appendChild(tot);
  b.appendChild(tb);
  b.appendChild(el("p", "tnote", "SSO is 5% of salary up to ฿" + money(SSO_CAP) + " a month (max ฿875), and you add the same again as the employer. Tax is a monthly PND.1 estimate with the standard allowances. ThuraGirl's accountant checks each person's real allowances in the live app."));
  if (done){ b.appendChild(el("p", "okt", "Approved " + ago(done, true) + ".")); b.appendChild(foot(btn("pill acc", "Close", closeGS))); return; }
  var ok = el("label", "shB-ok"), cb = el("input"); cb.type = "checkbox"; ok.appendChild(cb); ok.appendChild(el("span", "", "Pay " + baht(R.net) + " to " + R.rows.length + " people on " + nice(payDay()) + "."));
  b.appendChild(ok);
  var go2 = btn("pill acc", "Approve payroll", function(){ u.done[k] = Date.now(); save(); closeGS(); refresh(); toast(m + " payroll approved. In this test build no money moves."); }); go2.disabled = true;
  cb.addEventListener("change", function(){ go2.disabled = !cb.checked; });
  b.appendChild(foot(btn("pill soft", "Not yet", closeGS), go2));
}
function teamCard(u, root){
  var c = card("Team and payroll"), R = payRun(u);
  c.appendChild(el("p", "st-p", (u.team || []).length ? R.rows.length + " people · " + baht(R.gross) + " a month before SSO and tax." : "Add the people you pay each month. I work out SSO and withholding tax, and ask you to approve payroll before the 25th."));
  var rows = el("div", "ob-rows");
  (u.team || []).forEach(function(p, i){
    var r = el("div", "ob-row"); r.appendChild(el("span", "ob-av", initials(p.name)));
    var t = el("div", "tx"); t.appendChild(el("b", "", p.name)); t.appendChild(el("span", "", p.role + " · " + baht(p.pay) + " a month")); r.appendChild(t);
    r.appendChild(btn("pill soft act", "Edit", function(){ editPerson(u, p, i); })); rows.appendChild(r);
  });
  c.appendChild(rows);
  var ch = el("div", "chips");
  ch.appendChild(btn("pill soft act", "Add a person", function(){ editPerson(u, null, -1); }, "i-plus"));
  if ((u.team || []).length) ch.appendChild(btn("pill soft act", "See this month's payroll", openPayroll));
  c.appendChild(ch); root.appendChild(c);
}
function editPerson(u, p, i){
  var d = p ? { name: p.name, role: p.role, pay: String(p.pay) } : { name: "", role: "", pay: "" };
  var b = openGS("Team", p ? p.name : "Add a person", ""), g = el("div", "fgrid"), go2;
  var sync = function(){ go2.disabled = !(d.name.trim() && num(d.pay) > 0); };
  g.appendChild(fld("Full name", d.name, { wide: 1, on: function(v){ d.name = v; sync(); } }));
  g.appendChild(fld("Job", d.role, { ph: "Head chef", on: function(v){ d.role = v; } }));
  g.appendChild(fld("Monthly salary", d.pay, { prefix: "฿", mode: "decimal", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); d.pay = inp.value; sync(); } }));
  b.appendChild(g);
  var left = p ? btn("pill soft danger", "Remove", function(){ u.team.splice(i, 1); save(); closeGS(); renderSettings(); }) : btn("pill soft", "Cancel", closeGS);
  go2 = btn("pill acc", p ? "Save" : "Add", function(){ var x = { name: d.name.trim(), role: d.role.trim() || "Staff", pay: Math.round(num(d.pay)) }; u.team = u.team || []; if (p) u.team[i] = x; else u.team.push(x); save(); closeGS(); renderSettings(); toast(p ? "Saved" : x.name + " added"); });
  b.appendChild(foot(left, go2)); sync();
}

/* ── monthly tax forms ── */
function taxPack(u, B){
  var p = B.pack; if (!p) return null;
  var R = payRun(u), d = day(p.to), nm = new Date(d.getFullYear(), d.getMonth() + 1, 1), ym = iso(nm).slice(0, 8);
  var f = [];
  if (u.setup.vat !== "No") f.push(["VAT", "PP.30", p.tax[0], ym + "23"]);
  if (p.tax[1]) f.push(["Withholding tax on rent and services", "PND.3 / PND.53", p.tax[1], ym + "15"]);
  if ((u.team || []).length){ f.push(["Salary tax withheld", "PND.1", R.tax, ym + "15"]); if (u.setup.sso !== "No") f.push(["Social security, you and your staff", "SSO 1-10", R.sso * 2, ym + "15"]); }
  return { key: p.key, name: p.name, forms: f, total: f.reduce(function(s, x){ return s + x[2]; }, 0), due: f.reduce(function(m, x){ return x[3] < m ? x[3] : m; }, "9999") };
}
function openTax(){
  var u = me(), B = books(u), T = B && taxPack(u, B); if (!T) return;
  var k = "tax:" + T.key, done = u.done[k];
  var b = openGS("Taxes", T.name + " tax forms", "Prepared from your statements and payroll");
  var ul = el("div", "ptab tx3");
  T.forms.forEach(function(f){ var r = el("div", "ptr"), n = el("span", "pn"); n.appendChild(el("b", "", f[1])); n.appendChild(el("small", "", f[0])); r.appendChild(n); r.appendChild(el("span", f[3] < today() && !done ? "bad" : "", "File by " + nice(f[3]))); r.appendChild(el("span", "num", baht(f[2]))); ul.appendChild(r); });
  var tot = el("div", "ptr pt"); tot.appendChild(el("span", "", "To pay")); tot.appendChild(el("span", "")); tot.appendChild(el("span", "num", baht(T.total))); ul.appendChild(tot);
  b.appendChild(ul);
  b.appendChild(el("p", "tnote", "These are estimates from your bank lines. In the live app ThuraGirl's accountant checks them against your receipts before anything is filed."));
  if (done){ b.appendChild(el("p", "okt", "Approved " + ago(done, true) + ".")); b.appendChild(foot(btn("pill acc", "Close", closeGS))); return; }
  var ok = el("label", "shB-ok"), cb = el("input"); cb.type = "checkbox"; ok.appendChild(cb); ok.appendChild(el("span", "", "File these for " + T.name + " and pay " + baht(T.total) + ".")); b.appendChild(ok);
  var go2 = btn("pill acc", "Approve and file", function(){ u.done[k] = Date.now(); save(); closeGS(); refresh(); toast(T.name + " taxes approved. In this test build nothing is sent to the Revenue Department."); }); go2.disabled = true;
  cb.addEventListener("change", function(){ go2.disabled = !cb.checked; });
  b.appendChild(foot(btn("pill soft", "Ask a question", function(){ closeGS(); ask("How much VAT should I set aside?"); }), go2));
}
function moreTasks(u, B, out){
  var T = taxPack(u, B), t = today();
  if (T && T.forms.length && !u.done["tax:" + T.key]){
    out.push({ k: "tax:" + T.key, ic: "i-doc", t: T.name + " tax forms are ready", m: T.forms.map(function(f){ return f[1]; }).join(", "), amt: T.total, late: { txt: T.due < t ? lateTxt(T.due) : "File by " + nice(T.due), cls: T.due < t ? "bad" : diffDays(T.due, t) <= 3 ? "warn" : "" }, btn: "Approve", rank: T.due < t ? 2 : 3, fn: openTax,
      story: { h: "Your " + T.name + " taxes are ready to file", p: T.forms.map(function(f){ return f[1] + " " + baht(f[2]); }).join(", ") + ". Approve and I file them before " + nice(T.due) + "." } });
  }
  if (u.records && u.records.src === "dbd" && !u.records.ok) out.push({ k: "recs", ic: "i-doc", t: "Check your company records", m: u.records.miss ? "DBD didn't find them. Add them in Settings" : "Directors and shareholders from DBD", late: { txt: "Takes a minute", cls: "" }, btn: "Check", rank: 5, fn: function(){ setTab = "company"; go("settings"); } });
  if ((u.team || []).length && day(t).getDate() >= 18 && !u.done["pay:" + payKey()]){
    var R = payRun(u), pd = payDay();
    out.push({ k: "pay:" + payKey(), ic: "i-users", t: MONTH[day(t).getMonth()] + " payroll is ready", m: R.rows.length + " people", amt: R.net, late: { txt: pd < t ? lateTxt(pd) : pd === t ? "Pay day is today" : "Pay day " + nice(pd), cls: pd <= t ? "warn" : "" }, btn: "Approve", rank: pd <= t ? 2 : 3, fn: openPayroll,
      story: { h: "Payroll is ready for your yes", p: baht(R.net) + " to " + R.rows.length + " people on " + nice(pd) + ", after SSO and tax." } });
  }
}

/* ── settings extras: notifications, team access, files ── */
function notifCard(u, root){
  var c = card("Notifications"); u.notif = u.notif || { tax: 1, pay: 1, late: 1, week: 1, ch: "LINE" };
  var rows = el("div", "ob-rows");
  [["tax", "Tax filing reminders", "3 days and 1 day before every deadline"], ["pay", "Payroll approvals", "When the month's payroll is ready"], ["late", "Overdue invoices and bills", "One daily summary of what's late"], ["week", "Weekly money digest", "Monday morning: cash in, cash out, what to watch"]].forEach(function(x){
    rows.appendChild(qrow(x[1], x[2], ["On", "Off"], u.notif[x[0]] ? "On" : "Off", function(v){ u.notif[x[0]] = v === "On" ? 1 : 0; save(); }));
  });
  rows.appendChild(qrow("Send them by", "", ["LINE", "Email", "Both"], u.notif.ch, function(v){ u.notif.ch = v; save(); }));
  c.appendChild(rows); c.appendChild(el("p", "tnote", "Test build: choices are saved, but nothing is sent yet."));
  root.appendChild(c);
}
var ROLES = [["Admin", "Everything except billing and deleting the company"], ["Bookkeeper", "Books, invoices, bills and uploads"], ["Viewer", "Can look, can't change anything"]];
function accessCard(u, root){
  var c = card("People with access"), rows = el("div", "ob-rows");
  var me1 = el("div", "ob-row"); me1.appendChild(el("span", "ob-av", initials(u.name || u.email))); var t = el("div", "tx"); t.appendChild(el("b", "", (u.name || u.email) + " (you)")); t.appendChild(el("span", "", "Owner")); me1.appendChild(t); rows.appendChild(me1);
  (u.invites || []).forEach(function(v, i){
    var r = el("div", "ob-row"); r.appendChild(el("span", "ob-av", initials(v.email))); var tx = el("div", "tx"); tx.appendChild(el("b", "", v.email)); tx.appendChild(el("span", "", v.role + " · invited " + ago(v.at, true))); r.appendChild(tx);
    r.appendChild(btn("pill soft act", "Remove", function(){ u.invites.splice(i, 1); save(); renderSettings(); })); rows.appendChild(r);
  });
  c.appendChild(rows);
  var d = { email: "", role: "Bookkeeper" }, g = el("div", "fgrid"), add;
  g.appendChild(fld("Email", "", { ph: "name@company.co.th", on: function(v){ d.email = v.trim(); add.disabled = !/^\S+@\S+\.\S+$/.test(d.email); } }));
  g.appendChild(fld("Role", d.role, { options: ROLES.map(function(r){ return [r[0], r[0] + ": " + r[1]]; }), on: function(v){ d.role = v; } }));
  c.appendChild(g);
  add = btn("pill soft act", "Invite", function(){ var e = d.email.toLowerCase(); if (e === u.email || (u.invites || []).some(function(v){ return v.email === e; })) return toast("They're already on the list."); u.invites = (u.invites || []).concat([{ email: e, role: d.role, at: Date.now() }]); save(); renderSettings(); toast("Invite saved. In the live app they get an email."); }); add.disabled = true; add.style.justifySelf = "start";
  c.appendChild(add); root.appendChild(c);
}
function filesCard(u, root){
  var c = card("Files"), F = [];
  (u.invoices || []).forEach(function(v){ F.push(["Invoices", v.id + ".pdf", v.issued, function(){ openInvoice(v); }]); });
  Object.keys(u.rcpt || {}).forEach(function(k){ var r = u.rcpt[k]; F.push(["Receipts", r.name, r.at ? iso(new Date(r.at)) : "", null]); });
  (u.banks || []).forEach(function(b){ F.push(["Bank statements", b.bank + " ···· " + b.acct.slice(-4) + (b.file ? " · " + b.file : ""), b.at ? iso(new Date(b.at)) : "", function(){ openUpload(b); }]); });
  (u.requests || []).filter(function(r){ return r.file; }).forEach(function(r){ F.push(["Sent to your accountant", r.file.name, r.done ? iso(new Date(r.done)) : "", null]); });
  if (u.setup.verify) F.push(["Company", u.setup.verify.name, "", null]);
  (u.docs || []).forEach(function(x){ F.push([x.kind || "Other", x.name, iso(new Date(x.at)), null]); });
  (u.bills || []).filter(function(v){ return v.file; }).forEach(function(v){ F.push(["Bills", v.file.name + " · " + v.to, iso(new Date(v.file.at)), function(){ openBill(v); }]); });
  Object.keys((u.reg && u.reg.files) || {}).forEach(function(k){ F.push(["Company", u.reg.files[k].name, "", null]); });
  var groups = {}; F.forEach(function(f){ (groups[f[0]] = groups[f[0]] || []).push(f); });
  if (!F.length) c.appendChild(el("p", "st-p", "Invoices you make, receipts you send and statements you upload all land here."));
  var cur = u.filesTab && groups[u.filesTab] ? u.filesTab : Object.keys(groups)[0];
  if (F.length){
    var ch = el("div", "chips");
    Object.keys(groups).forEach(function(g){ var x = el("button", "", g + " " + groups[g].length); x.type = "button"; x.setAttribute("aria-pressed", String(g === cur)); x.addEventListener("click", function(){ u.filesTab = g; renderSettings(); }); ch.appendChild(x); });
    c.appendChild(ch);
    var list = el("div", "ob-rows");
    groups[cur].sort(function(a, b){ return a[2] < b[2] ? 1 : -1; }).slice(0, 12).forEach(function(f){
      var r = el("div", "docrow"), tx = el("div", "tx"); tx.appendChild(el("b", "", f[1])); tx.appendChild(el("span", "", f[2] ? niceY(f[2]) : "Kept")); r.appendChild(tx);
      if (f[3]) r.appendChild(btn("pill soft act", "Open", f[3])); list.appendChild(r);
    });
    c.appendChild(list);
  }
  c.appendChild(el("p", "tnote", "Test build: only the name and size of each file are kept, in this browser. The live app stores them in your company vault."));
  root.appendChild(c);
}

/* ── customers and suppliers, from invoices, bills and bank lines ── */
function paintContacts(u){
  var host = $("#m-contacts"), anchor = $$("#b-money .listB")[1];
  if (!host && anchor){ host = el("section", "card listB"); host.id = "m-contacts"; host.setAttribute("aria-label", "Customers and suppliers"); anchor.parentNode.insertBefore(host, anchor.nextSibling); }
  if (!host) return;
  host.textContent = "";
  var C = {}, t = today();
  function add(name, kind, amt, open){ var k = name.trim().toLowerCase(); var c = C[k] = C[k] || { name: name.trim(), kind: kind, n: 0, total: 0, open: 0 }; c.n++; c.total += amt; c.open += open; }
  (u.invoices || []).forEach(function(v){ add(v.to, "Customer", invTotal(v), v.paid ? 0 : invTotal(v)); });
  (u.bills || []).forEach(function(v){ add(v.to, "Supplier", v.amount, v.paid ? 0 : v.amount); });
  var list = Object.keys(C).map(function(k){ return C[k]; }), tab = u.ctab || "Customer";
  var h = el("div", "cardh"); h.appendChild(el("h2", "", "Customers and suppliers")); host.appendChild(h);
  var ch = el("div", "chips lpad");
  ["Customer", "Supplier"].forEach(function(k){ var x = el("button", "", k === "Customer" ? "Customers" : "Suppliers"); x.type = "button"; x.setAttribute("aria-pressed", String(tab === k)); x.addEventListener("click", function(){ u.ctab = k; save(); paintContacts(u); }); ch.appendChild(x); });
  host.appendChild(ch);
  var rows = list.filter(function(c){ return c.kind === tab; }).sort(function(a, b){ return b.total - a.total; });
  if (!rows.length) host.appendChild(el("p", "st-p lpad", tab === "Customer" ? "Customers appear here when you make an invoice." : "Suppliers appear here when you add a bill."));
  rows.forEach(function(c){
    var r = el("div", "row"), rt = el("div", "rt"); rt.appendChild(el("div", "t", c.name));
    var m = el("div", "m", c.n + (tab === "Customer" ? (c.n === 1 ? " invoice" : " invoices") : (c.n === 1 ? " bill" : " bills")) + (c.open ? " · " + baht(c.open) + " open" : " · all settled")); rt.appendChild(m);
    r.appendChild(rt); r.appendChild(el("span", "amt num", baht(c.total))); host.appendChild(r);
  });
}
/* ── morning brief ── */
function catsBetween(u, a, b){ var o = {}; (u.tx || []).forEach(function(x){ if (x.d < a || x.d > b || x.a >= 0) return; var c = cat(x.t, x.a); o[c] = (o[c] || 0) - x.a; }); return o; }
function sparkSvg(vals, w, h){
  var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi === lo){ hi++; lo--; }
  var pts = vals.map(function(v, i){ return (i / (vals.length - 1) * w).toFixed(1) + "," + (h - 3 - (v - lo) / (hi - lo) * (h - 6)).toFixed(1); });
  return '<svg class="br-spk" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + pts.join(" ") + '"/><circle cx="' + pts[pts.length - 1].split(",")[0] + '" cy="' + pts[pts.length - 1].split(",")[1] + '" r="2.6"/></svg>';
}
function noticed(u, B){
  var F = B.fin.mtd, out = [], A = day(B.asOf), pa = iso(new Date(A.getFullYear(), A.getMonth() - 1, 1)), pb = iso(new Date(A.getFullYear(), A.getMonth() - 1, Math.min(A.getDate(), new Date(A.getFullYear(), A.getMonth(), 0).getDate())));
  if (pa >= B.first){
    var cur = catsBetween(u, F.from, B.asOf), prev = catsBetween(u, pa, pb), best = null;
    Object.keys(cur).forEach(function(c){ var p = prev[c] || 0, d = cur[c] - p; if (p > 5000 && Math.abs(d) > 4000 && (!best || Math.abs(d) > Math.abs(best.d))) best = { c: c, d: d, p: p, v: cur[c] }; });
    if (best) out.push(cap(best.c) + " is " + (best.d > 0 ? "up " : "down ") + pctTxt(Math.abs(best.d) / best.p * 100) + " on the same days last month: " + baht(best.v) + " against " + baht(best.p) + ".");
  }
  var since = addDays(B.asOf, -27), byWd = [0, 0, 0, 0, 0, 0, 0], days = {};
  (u.tx || []).forEach(function(x){ if (x.d < since || x.a <= 0) return; byWd[day(x.d).getDay()] += x.a; days[x.d] = 1; });
  var top = byWd.indexOf(Math.max.apply(null, byWd)), WD = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
  if (Object.keys(days).length >= 14 && byWd[top] > 0) out.push(WD[top] + " bring in the most: about " + baht(Math.round(byWd[top] / 4 / 100) * 100) + " each over the last four weeks.");
  var spent = 0; (u.tx || []).forEach(function(x){ if (x.d > addDays(B.asOf, -90) && x.a < 0) spent -= x.a; });
  var mo = spent / 3; if (mo > 0 && B.cash > 0) out.push("Your cash covers about " + (B.cash / mo).toFixed(1) + " months of spending at the pace of the last three months.");
  return out.slice(0, 3);
}
function cap(s){ s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
function weekAhead(u, B){
  var t = today(), end = addDays(t, 6), ev = [];
  (u.bills || []).forEach(function(v){ if (!v.paid && v.due >= t && v.due <= end) ev.push([v.due, v.to, baht(v.amount), "out"]); });
  (u.invoices || []).forEach(function(v){ if (!v.paid && v.due >= t && v.due <= end) ev.push([v.due, v.to + " pays you", baht(invTotal(v)), "in"]); });
  if ((u.team || []).length && !u.done["pay:" + payKey()]){ var pd = payDay(); if (pd >= t && pd <= end) ev.push([pd, "Payroll", baht(payRun(u).net), "out"]); }
  var T = taxPack(u, B); if (T && !u.done["tax:" + T.key]) T.forms.forEach(function(f){ if (f[3] >= t && f[3] <= end) ev.push([f[3], "File " + f[1], baht(f[2]), "out"]); });
  return ev;
}
function renderBrief(){
  var u = me(), B = books(u), pg = $("#b-brief"); if (!B) return;
  $$("#b-brief > :not(.emptyP)").forEach(function(n){ n.remove(); });
  var now = new Date(), T = tasks(u), p = B.pack, F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()], hr = now.getHours();
  var stories = [];
  if (p && !u.done["rev:" + p.key]) stories.push({ h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept. Tick the box and I lock the month.", btn: "Review", acc: 1, fn: openSheet });
  T.filter(function(x){ return x.story && x.rank <= 3; }).forEach(function(x){ stories.push({ h: x.story.h, p: x.story.p, btn: x.btn, fn: x.fn, k: x.k }); });
  var top = stories.slice(0, 3), rest = T.filter(function(x){ return !top.some(function(s){ return s.k === x.k; }); });

  var mast = el("div", "br-mast"); mast.appendChild(el("b", "", "The Morning Brief")); mast.appendChild(el("span", "", now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })));
  mast.appendChild(el("span", "br-rt", coName(u))); pg.appendChild(mast);

  var hd = el("header", "br-head"), h1 = el("h1"); h1.id = "br-h1";
  h1.appendChild(el("span", "l1", B.cashD == null ? "Cash is " + baht(B.cash) + "." : "Cash is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(Math.abs(B.cashD)) + "."));
  if (top.length){ h1.appendChild(el("em", "", ["", "One thing", "Two things", "Three things"][top.length])); h1.appendChild(document.createTextNode(" need" + (top.length === 1 ? "s" : "") + " your yes.")); }
  else h1.appendChild(el("em", "", "Nothing needs you today."));
  hd.appendChild(h1);
  var names = (u.banks || []).map(function(b){ return b.bank; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
  var lede = el("p", "br-lede"); lede.innerHTML = (hr < 12 ? "Good morning, " : hr < 18 ? "Good afternoon, " : "Good evening, ") + esc(first(u)) + ". You have <b class=\"num\">" + baht(B.cash) + "</b> " + (names.length ? "across " + esc(names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]) : "in the bank") + ", as of " + esc(nice(B.asOf)) + ". " +
    esc(mName) + " has brought in <b class=\"num\">" + baht(F.rev) + "</b> so far, and you have " + (F.rev >= F.exp ? "kept <b class=\"num\">" + baht(F.rev - F.exp) + "</b> of it." : "spent <b class=\"num\">" + baht(F.exp - F.rev) + "</b> more than came in.");
  hd.appendChild(lede); pg.appendChild(hd);

  // the numbers, in one strip
  var figs = el("div", "br-figs"), cashF = el("button", "br-fig wide"); cashF.type = "button"; cashF.addEventListener("click", function(){ go(""); });
  cashF.appendChild(el("span", "k", "Cash, last 30 days")); var cv = el("b", "num", baht(B.cash)); cashF.appendChild(cv); cashF.insertAdjacentHTML("beforeend", sparkSvg(B.series.map(function(s){ return s[1]; }), 160, 38));
  cashF.appendChild(el("small", "", B.cashD == null ? "As of " + nice(B.asOf) : (B.cashD >= 0 ? "Up " : "Down ") + pctTxt(Math.abs(B.cashD)) + " since 1 " + mName));
  figs.appendChild(cashF);
  [["Money in", F.rev, F.dIn, true], ["Money out", F.exp, F.dOut, false], ["Kept", F.rev - F.exp, F.d, true]].forEach(function(x){
    var f = el("button", "br-fig"); f.type = "button"; f.addEventListener("click", function(){ go("money"); });
    f.appendChild(el("span", "k", x[0])); f.appendChild(el("b", "num", baht(x[1])));
    var good = x[2] != null && (x[2] >= 0) === x[3];
    f.appendChild(el("small", good ? "up" : "", x[2] == null ? mName + " so far" : (x[2] >= 0 ? "Up " : "Down ") + pctTxt(Math.abs(x[2])) + " on last month"));
    figs.appendChild(f);
  });
  pg.appendChild(figs);

  var grid = el("div", "br-grid"), main = el("div", "br-main"), side = el("aside", "br-side");
  main.appendChild(el("div", "br-sec", top.length ? "Needs your yes" : "All clear"));
  if (!top.length) main.appendChild(el("p", "br-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var a = el("article", "story"); a.appendChild(el("span", "no", String(i + 1))); a.appendChild(el("h3", "", s.h)); a.appendChild(el("p", "todo", s.p));
    a.appendChild(btn("pill " + (s.acc || i === 0 ? "acc" : "soft act"), s.btn, s.fn)); main.appendChild(a);
  });

  // the week ahead
  var ev = weekAhead(u, B), wk = el("div", "br-week"), t = today();
  main.appendChild(el("div", "br-sec br-gap", "The week ahead"));
  for (var i = 0; i < 7; i++){
    var d = addDays(t, i), dd = day(d), col = el("div", "br-day" + (i === 0 ? " now" : "") + ((dd.getDay() === 0 || dd.getDay() === 6) ? " we" : ""));
    var dh = el("div", "dh"); dh.appendChild(el("span", "", i === 0 ? "Today" : dd.toLocaleDateString("en-GB", { weekday: "short" }))); dh.appendChild(el("b", "num", String(dd.getDate()))); col.appendChild(dh);
    ev.filter(function(e){ return e[0] === d; }).forEach(function(e){ var it = el("div", "ev " + e[3]); it.appendChild(el("span", "", e[1])); it.appendChild(el("b", "num", e[2])); col.appendChild(it); });
    wk.appendChild(col);
  }
  main.appendChild(wk);
  if (!ev.length) main.appendChild(el("p", "br-calm sm", "No bills, invoices or filings fall due in the next seven days."));

  if (rest.length){
    main.appendChild(el("div", "br-sec br-gap", "Can wait"));
    rest.slice(0, 4).forEach(function(x){ var r = el("div", "row"), rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t)); rt.appendChild(el("div", "m", x.late.txt + (x.amt ? " · " + baht(x.amt) : ""))); r.appendChild(rt); r.appendChild(btn("pill soft act", x.btn, x.fn)); main.appendChild(r); });
  }

  var ns = noticed(u, B);
  if (ns.length){
    side.appendChild(el("div", "br-sec", "What I noticed")); var nl = el("ol", "br-note");
    ns.forEach(function(s){ nl.appendChild(el("li", "", s)); }); side.appendChild(nl);
  }
  side.appendChild(el("div", "br-sec" + (ns.length ? " br-gap" : ""), "Done for you"));
  var dn = el("ul", "br-done"), rc = Object.keys(u.rcpt || {}).length, items = [B.n + " bank lines read and sorted into " + F.expMix.length + " kinds of cost"]; if (u.matched) items.push(u.matched + " payments matched to invoices and bills");
  if (rc) items.push(rc + (rc === 1 ? " receipt" : " receipts") + " filed");
  var TP = taxPack(u, B); if (TP && u.done["tax:" + TP.key]) items.push(TP.name + " tax forms approved");
  if (p && u.done["rev:" + p.key]) items.push(p.name + " books signed off");
  items.forEach(function(tx){ var li = el("li"); li.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; li.appendChild(document.createTextNode(tx)); dn.appendChild(li); });
  side.appendChild(dn);

  var mix = F.expMix.slice(0, 4), mx = mix.length ? mix[0][1] : 0;
  if (mix.length){
    var lk = el("div", "br-sec br-gap br-lk"); lk.appendChild(el("span", "", "Where it went")); var sm = btn("lnk", "See money", function(){ go("money"); }); sm.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); lk.appendChild(sm); side.appendChild(lk);
    var bars = el("ul", "br-bars");
    mix.forEach(function(m){ var li = el("li"), top2 = el("div", "bt"); top2.appendChild(el("span", "", cap(m[0]))); top2.appendChild(el("b", "num", baht(m[1]))); li.appendChild(top2); var bar = el("i"); bar.style.width = Math.max(4, m[1] / mx * 100) + "%"; li.appendChild(bar); bars.appendChild(li); });
    side.appendChild(bars);
  }
  grid.appendChild(main); grid.appendChild(side); pg.appendChild(grid);
  var end = el("p", "br-end", "That is everything for today. Ask me anything below."); pg.appendChild(end);
}
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
  tgSays(said || "", q.ask(), opts.concat([cancel]));
}
function flowAnswer(text, shown){
  var f = chat.flow, q = f && f.steps[f.i]; if (!q) return;
  var err = q.take(String(text).trim(), f.d);
  if (err){ tgSays(shown || text, err, (q.opts ? q.opts() : []).map(function(x){ return { l: x[0], fn: function(){ flowAnswer(x[1] != null ? x[1] : x[0], x[0]); } }; }).concat([{ l: "Cancel", fn: function(){ endFlow("Okay, I dropped it."); } }])); return; }
  f.i++; while (f.steps[f.i] && f.steps[f.i].skip && f.steps[f.i].skip(f.d)) f.i++;
  flowStep(f, shown || text);
}
function startInvoiceFlow(file){
  var u = me(), vatOn = u.setup.vat !== "No";
  if (gated(u)) return tgSays("", "Invoices open once the company is registered. Finish the registration first and I'll be ready.", [{ l: "Continue registration", acc: 1, fn: function(){ endFlow(); go("register"); } }]);
  chat.flow = { d: { file: file || null }, i: 0, steps: [
    { ask: function(){ return file ? "Which customer is this invoice for?" : "Let's make an invoice. Who is it for?"; }, opts: function(){ return people(u.invoices || []).map(function(n){ return [n]; }); },
      take: function(t, d){ if (t.length < 2) return "Type the customer's name, please."; d.to = t; } },
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
    { ask: function(){ return file ? "Got the bill. Who is it from?" : "Who do you need to pay?"; }, opts: function(){ return people(u.bills || []).map(function(n){ return [n]; }); },
      take: function(t, d){ if (t.length < 2) return "Type who you're paying, please."; d.to = t; } },
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
var setTab = "account", STABS = [["account", "Account"], ["company", "Company"], ["team", "Team"], ["apps", "Apps"], ["files", "Files"], ["security", "Security"], ["billing", "Plan"]];
function renderSettings(){
  var u = me(), root = $("#b-settings"); root.textContent = ""; root.classList.remove("in");
  var h = el("div", "pgh"); h.appendChild(el("h1", "", "Settings")); h.appendChild(el("p", "", "Changes save as you type.")); root.appendChild(h);
  var nav = el("div", "chips stabs"); nav.setAttribute("role", "tablist");
  STABS.forEach(function(t){ var b = el("button", "", t[1]); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(setTab === t[0])); b.setAttribute("aria-pressed", String(setTab === t[0])); b.addEventListener("click", function(){ setTab = t[0]; renderSettings(); }); nav.appendChild(b); });
  root.appendChild(nav);
  var T = setTab;
  if (T === "account"){ profileCard(u, root); notifCard(u, root); appearanceCard(u, root); accountCard(u, root); }
  else if (T === "company"){ companyCard(u, root); recordsCard(u, root); }
  else if (T === "team"){ teamCard(u, root); accessCard(u, root); }
  else if (T === "apps"){ var cn = card("Connected apps"); cn.appendChild(connList(u, function(){ renderSettings(); })); root.appendChild(cn); if (!gated(u)) banksCard(u, root); }
  else if (T === "files"){ filesCard(u, root); if (!gated(u)) dataCard(u, root); }
  else if (T === "security"){ securityCard(u, root); tfaCard(u, root); }
  else if (T === "billing") billingCard(u, root);
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

/* ── Thai words for every screen. Exact English → Thai; patterns with numbers live in app85. ── */
var TH = {
  "Send them by": "ส่งทาง", "Set capital first": "ตั้งทุนก่อน", "Registered already, or one I register for you": "จดทะเบียนแล้ว หรือให้หนูจดให้",

  ". You have": " คุณมี", "Add the name and address exactly as registered.": "ใส่ชื่อและที่อยู่ให้ตรงกับที่จดทะเบียน", "Card, cash and QR sales": "ยอดขายบัตร เงินสด และ QR", "Done for now": "พอแค่นี้ก่อน", "Everything else": "อื่น ๆ ทั้งหมด",
  "For sending it": "สำหรับส่ง", "Send to": "ส่งถึง", "vs last month": "เทียบเดือนก่อน", "Tick the box and I lock the month.": "ติ๊กช่องแล้วหนูจะปิดเดือนให้",
  "Operate restaurants and sell food and drinks": "ประกอบกิจการร้านอาหารและจำหน่ายอาหารและเครื่องดื่ม", "Provide catering and event food services": "ให้บริการจัดเลี้ยงและอาหารสำหรับงานอีเวนต์",

  "Screens switch straight away. ThuraGirl answers in the language you write in.": "หน้าจอเปลี่ยนทันที ThuraGirl ตอบเป็นภาษาที่คุณพิมพ์มา",
  "Everything saves as you go.": "บันทึกให้อัตโนมัติ", "Not registered yet.": "ยังไม่ได้จดทะเบียน", "Shareholders": "ผู้ถือหุ้น", "Invoices": "ใบแจ้งหนี้", "Bills": "บิล", "Receipts": "ใบเสร็จ", "Statements": "รายการเดินบัญชี",
  "A clear phone photo is fine; PDF or image, up to 10 MB each.": "ถ่ายด้วยมือถือให้ชัดก็พอ PDF หรือรูปภาพ ไม่เกินไฟล์ละ 10 MB", "The list follows the people and capital you entered.": "รายการนี้ปรับตามบุคคลและทุนที่คุณกรอก",
  "Pick a plan whenever you're ready; nothing is charged until the trial ends.": "เลือกแพ็กเกจเมื่อพร้อม ไม่มีการเรียกเก็บเงินจนกว่าช่วงทดลองจะจบ", "uploaded just now": "อัปโหลดเมื่อสักครู่",
  "Due today": "ครบกำหนดวันนี้", "Due today.": "ครบกำหนดวันนี้", "Your month on one page.": "เดือนของคุณในหน้าเดียว", "Monthly Review Pack": "สรุปประจำเดือน", "Ready to send": "พร้อมส่ง", "Credit account": "เครดิต",
  "These are estimates from your statements, not a filing.": "เป็นตัวเลขประมาณจากรายการเดินบัญชี ยังไม่ใช่การยื่นแบบ", "Open one in Money and tap Remind.": "เปิดในหน้าการเงินแล้วกดทวง",
  "Sample statement loaded.": "โหลดรายการเดินบัญชีตัวอย่างแล้ว", "Cash is up": "เงินสดเพิ่มขึ้น", "Your companies": "บริษัทของคุณ",
  "Have a look around.": "ลองดูรอบ ๆ ได้เลย", "Registering the company is five short parts, whenever you are ready.": "การจดทะเบียนบริษัทมีห้าส่วนสั้น ๆ พร้อมเมื่อไหร่ก็เริ่มได้",
  "Please add your name": "กรุณาใส่ชื่อ", "At least 2 characters": "อย่างน้อย 2 ตัวอักษร", "At least 5 characters": "อย่างน้อย 5 ตัวอักษร", "Exactly 13 digits": "ต้องมี 13 หลักพอดี", "This company is already on ThuraGirl": "บริษัทนี้อยู่ใน ThuraGirl แล้ว",
  "Type the customer's name, please.": "พิมพ์ชื่อลูกค้าด้วยนะ", "A short description, please.": "ขอคำอธิบายสั้น ๆ หน่อย", "I need an amount, like 25,000 or 25k.": "ขอจำนวนเงิน เช่น 25,000 หรือ 25k", "Yes or no?": "ใช่หรือไม่",
  "Tell me a number of days, like 15.": "บอกจำนวนวัน เช่น 15", "Creating it.": "กำลังสร้าง", "Tap Create invoice, or Use the full form to add more lines.": "กดสร้างใบแจ้งหนี้ หรือใช้แบบฟอร์มเต็มเพื่อเพิ่มรายการ",
  "Which customer is this invoice for?": "ใบแจ้งหนี้นี้ออกให้ลูกค้าคนไหน", "Got the bill. Who is it from?": "ได้บิลแล้ว บิลจากใคร", "Type who you're paying, please.": "พิมพ์ชื่อคนที่จะจ่ายด้วยนะ", "How much?": "เท่าไหร่",
  "I need an amount, like 12,500.": "ขอจำนวนเงิน เช่น 12,500", "When is it due?": "ครบกำหนดเมื่อไหร่", "Tell me when, like today or in 7 days.": "บอกวันครบกำหนด เช่น วันนี้ หรือภายใน 7 วัน",
  "Do you have their PromptPay ID? A phone number or a 13-digit ID. I turn it into a QR code you can scan.": "มีพร้อมเพย์ของเขาไหม เบอร์โทรหรือเลข 13 หลัก หนูจะทำเป็น QR ให้สแกนจ่าย", "Skip": "ข้าม",
  "A 10-digit phone number or a 13-digit ID, or tap Skip.": "เบอร์โทร 10 หลัก หรือเลข 13 หลัก หรือกดข้าม", "Saving it.": "กำลังบันทึก", "Tap Save bill, or Use the full form.": "กดบันทึกบิล หรือใช้แบบฟอร์มเต็ม",
  "Invoices open once the company is registered. Finish the registration first and I'll be ready.": "ใบแจ้งหนี้จะเปิดใช้ได้เมื่อจดทะเบียนบริษัทแล้ว กรอกการจดทะเบียนให้เสร็จก่อนนะ", "Bank statements open once the company is registered.": "รายการเดินบัญชีจะเปิดใช้ได้เมื่อจดทะเบียนบริษัทแล้ว",
  "Thanks. What is it?": "ขอบคุณ ไฟล์นี้คืออะไร", "A receipt": "ใบเสร็จ", "I can read photos, PDFs, and CSV or Excel statements. That file type doesn't work here.": "หนูอ่านได้ทั้งรูปภาพ PDF และรายการเดินบัญชี CSV หรือ Excel ไฟล์ประเภทนี้ใช้ไม่ได้",
  "Leave out บริษัท and จำกัด. I add them for you.": "ไม่ต้องใส่ บริษัท และ จำกัด หนูเติมให้เอง", "DBD needs the name in Thai letters. Write how it sounds in Thai, like แบงค็อก ไบท์ส. The English name goes below.": "DBD ต้องการชื่อเป็นตัวอักษรไทย เขียนตามเสียงอ่าน เช่น แบงค็อก ไบท์ส ส่วนชื่ออังกฤษใส่ด้านล่าง",
  // shell and navigation
  "Home": "หน้าหลัก", "Money": "การเงิน", "Morning brief": "สรุปยามเช้า", "The Morning Brief": "สรุปยามเช้า", "Settings": "ตั้งค่า", "Back": "กลับ", "Back to Home": "กลับหน้าหลัก",
  "Ask ThuraGirl": "ถาม ThuraGirl", "Speak": "พูด", "Send": "ส่ง", "Upload": "อัปโหลด", "Invoice": "ใบแจ้งหนี้", "Pay": "จ่าย", "Close": "ปิด", "Close reply": "ปิดคำตอบ",
  "Dismiss": "ปิด", "Cancel": "ยกเลิก", "Continue": "ต่อไป", "Done": "เสร็จแล้ว", "Edit": "แก้ไข", "Remove": "ลบ", "Add": "เพิ่ม", "Open": "เปิด", "View": "ดู", "Review": "ตรวจดู",
  "Approve": "อนุมัติ", "Yes": "ใช่", "No": "ไม่", "Both": "ทั้งสองแบบ", "On": "เปิด", "Off": "ปิด", "Not now": "ไว้ทีหลัง", "Got it": "เข้าใจแล้ว", "Optional": "ไม่บังคับ",
  "Update": "อัปเดต", "Connect": "เชื่อมต่อ", "Invite": "เชิญ", "Remind": "ทวง", "Register": "จดทะเบียน", "Set up": "ตั้งค่า", "Set it up": "ตั้งค่าเลย", "Turn on": "เปิดใช้", "Verify now": "ยืนยันตอนนี้",
  "Today": "วันนี้", "just now": "เมื่อสักครู่", "Saved": "บันทึกแล้ว", "Copied": "คัดลอกแล้ว", "Cleared": "ล้างแล้ว", "Not set": "ยังไม่ได้ตั้ง", "Not yet": "ยังไม่", "Not yet.": "ยังไม่มี",
  "Month": "เดือน", "Quarter": "ไตรมาส", "Year": "ปี", "This month": "เดือนนี้", "Period": "ช่วงเวลา", "Status": "สถานะ", "Total": "รวม", "Subtotal": "รวมก่อน VAT", "Amount": "จำนวนเงิน", "Due": "ครบกำหนด",
  "In": "เข้า", "Out": "ออก", "Kept": "เหลือ", "Profit": "กำไร", "Revenue": "รายได้", "Expenses": "ค่าใช้จ่าย", "Wages": "ค่าจ้าง", "Rent": "ค่าเช่า", "Utilities": "ค่าน้ำค่าไฟ", "Marketing": "การตลาด",
  "Stock and supplies": "สินค้าและวัตถุดิบ", "Other costs": "ค่าใช้จ่ายอื่น", "Tax and social security": "ภาษีและประกันสังคม", "Card sales": "ยอดขายบัตร", "QR payments": "รับชำระผ่าน QR", "Transfers from customers": "เงินโอนจากลูกค้า",
  "Delivery and marketplaces": "เดลิเวอรีและมาร์เก็ตเพลส", "Supplier payments": "จ่ายซัพพลายเออร์", "Payouts and fees": "เงินโอนเข้าและค่าธรรมเนียม", "Payroll": "เงินเดือน",
  "Mon": "จ.", "Tue": "อ.", "Wed": "พ.", "Thu": "พฤ.", "Fri": "ศ.", "Sat": "ส.", "Sun": "อา.",
  "Jan": "ม.ค.", "Feb": "ก.พ.", "Mar": "มี.ค.", "Apr": "เม.ย.", "May": "พ.ค.", "Jun": "มิ.ย.", "Jul": "ก.ค.", "Aug": "ส.ค.", "Sep": "ก.ย.", "Oct": "ต.ค.", "Nov": "พ.ย.", "Dec": "ธ.ค.",
  "English": "English", "Thai": "ไทย", "Foreign": "ต่างชาติ", "thuragirl": "thuragirl",

  // home
  "Needs you": "รอคุณอยู่", "Needs your yes": "รอคุณกดยืนยัน", "Tasks that need you": "งานที่รอคุณ", "Coming up": "เร็ว ๆ นี้", "You're all caught up": "เคลียร์ครบแล้ว",
  "Nothing else needs you today.": "วันนี้ไม่มีอะไรรอคุณแล้ว", "Nothing needs you yet": "ยังไม่มีอะไรรอคุณ", "That is everything for today. Ask me anything below.": "วันนี้มีแค่นี้ ถามหนูได้ทุกเรื่องด้านล่างเลย",
  "Cash on hand": "เงินสดคงเหลือ", "in the bank": "ในบัญชีธนาคาร", "Cash, last 30 days": "เงินสด 30 วันล่าสุด", "Money in": "เงินเข้า", "Money out": "เงินออก", "Money in and out": "เงินเข้าและออก", "Your money in and out": "เงินเข้าออกของคุณ",
  "Profit this month": "กำไรเดือนนี้", "Profit this quarter": "กำไรไตรมาสนี้", "Profit this year": "กำไรปีนี้", "Profit margin": "อัตรากำไร", "Owed to you": "ลูกค้าค้างจ่าย", "You owe": "คุณค้างจ่าย",
  "Set aside for taxes": "กันไว้จ่ายภาษี", "Tax to set aside (estimate)": "ภาษีที่ควรกันไว้ (ประมาณ)", "See money": "ดูการเงิน", "Upload a statement": "อัปโหลดรายการเดินบัญชี", "Upload a file": "อัปโหลดไฟล์",
  "Add a statement or receipt": "เพิ่มรายการเดินบัญชีหรือใบเสร็จ", "Try it with sample data": "ลองด้วยข้อมูลตัวอย่าง", "Show the sample tasks again": "แสดงงานตัวอย่างอีกครั้ง",
  "Finish setting up": "ตั้งค่าให้เสร็จ", "Finish setup": "ตั้งค่าให้เสร็จ", "Finish setting up your company": "ตั้งค่าบริษัทให้เสร็จ", "Setup": "ตั้งค่า", "Three things": "สามเรื่อง",
  "Three quick things. They also live in Settings, so there is no rush.": "สามเรื่องสั้น ๆ อยู่ในหน้าตั้งค่าด้วย ไม่ต้องรีบ",
  "Connect your bank or upload a statement, and I build your dashboard from it: your cash, money in and out, and what needs you.": "เชื่อมบัญชีธนาคารหรืออัปโหลดรายการเดินบัญชี แล้วหนูจะสร้างแดชบอร์ดให้ ทั้งเงินสด เงินเข้าออก และเรื่องที่รอคุณ",
  "Money fills in once you upload a bank statement.": "หน้าการเงินจะขึ้นเมื่อคุณอัปโหลดรายการเดินบัญชี", "Upload a bank statement and I will find what does.": "อัปโหลดรายการเดินบัญชี แล้วหนูจะหาให้ว่ามีอะไรบ้าง",
  "Nothing to show yet.": "ยังไม่มีอะไรให้ดู", "This fills in after your company is registered and its bank account has a statement.": "ส่วนนี้จะขึ้นหลังจดทะเบียนบริษัทและบัญชีธนาคารของบริษัทมีรายการเดินบัญชีแล้ว",
  "Bank statements and your dashboard open once the company is registered. Finish the registration and I take it to DBD for you.": "รายการเดินบัญชีและแดชบอร์ดจะเปิดใช้ได้เมื่อจดทะเบียนบริษัทแล้ว กรอกการจดทะเบียนให้ครบ แล้วหนูจะยื่นกับ DBD ให้",
  "Have a look around. Registering the company is five short parts, whenever you are ready.": "ลองดูรอบ ๆ ได้เลย การจดทะเบียนบริษัทมีห้าส่วนสั้น ๆ พร้อมเมื่อไหร่ก็เริ่มได้",
  "Welcome to ThuraGirl.": "ยินดีต้อนรับสู่ ThuraGirl", "Welcome back.": "ยินดีต้อนรับกลับมา", "Good morning,": "สวัสดีตอนเช้า", "Good afternoon,": "สวัสดีตอนบ่าย", "Good evening,": "สวัสดีตอนเย็น",
  "Sample statement loaded. 680 transactions read.": "โหลดรายการเดินบัญชีตัวอย่างแล้ว อ่านไป 680 รายการ",
  "Bank statement": "รายการเดินบัญชี", "Bank statements": "รายการเดินบัญชี", "Banks": "ธนาคาร", "Add another bank": "เพิ่มธนาคาร", "Statement in": "รับรายการเดินบัญชีแล้ว",
  "Show K-Bank account number": "แสดงเลขบัญชีกสิกรไทย", "Pay day is today": "วันนี้วันจ่ายเงินเดือน",

  // upload sheet
  "CSV, Excel or PDF from your bank, up to 10 MB.": "ไฟล์ CSV, Excel หรือ PDF จากธนาคาร ไม่เกิน 10 MB", "Take a photo": "ถ่ายรูป", "Use your camera": "ใช้กล้อง", "PDF, JPG or PNG": "PDF, JPG หรือ PNG",

  // chat and guided flows
  "How's my cash?": "เงินสดเป็นยังไงบ้าง", "What's overdue?": "มีอะไรเลยกำหนดบ้าง", "Where did the money go?": "เงินไปไหนหมด", "Who owes me money?": "ใครค้างเงินเราบ้าง",
  "Show the full P&L": "ดูงบกำไรขาดทุนทั้งหมด", "What bills do I have?": "มีบิลอะไรต้องจ่ายบ้าง", "How much VAT should I set aside?": "ควรกัน VAT ไว้เท่าไหร่", "How was this month?": "เดือนนี้เป็นยังไง",
  "Ask ThuraGirl for the full profit and loss": "ขอดูงบกำไรขาดทุนทั้งหมดจาก ThuraGirl",
  "I'm not sure about that one yet. In this test build I answer from your statements, invoices and bills. Try \"How's my cash?\", \"What's overdue?\" or \"Where did the money go?\"": "เรื่องนี้หนูยังตอบไม่ได้ ในเวอร์ชันทดสอบนี้หนูตอบจากรายการเดินบัญชี ใบแจ้งหนี้ และบิลของคุณ ลองถาม \"เงินสดเป็นยังไงบ้าง\" \"มีอะไรเลยกำหนดบ้าง\" หรือ \"เงินไปไหนหมด\"",
  "Let's make an invoice. Who is it for?": "มาออกใบแจ้งหนี้กัน ออกให้ใคร", "What is it for? One line is enough, like \"Catering for 80 guests\".": "ค่าอะไร เขียนบรรทัดเดียวพอ เช่น \"จัดเลี้ยง 80 ท่าน\"",
  "How much, before VAT?": "เท่าไหร่ (ก่อน VAT)", "Add 7% VAT on top?": "บวก VAT 7% ไหม", "Yes, add VAT": "ใช่ บวก VAT", "No VAT": "ไม่มี VAT", "When should they pay?": "ให้จ่ายเมื่อไหร่",
  "In 7 days": "ภายใน 7 วัน", "In 15 days": "ภายใน 15 วัน", "In 30 days": "ภายใน 30 วัน", "Use the full form": "ใช้แบบฟอร์มเต็ม", "Create invoice": "สร้างใบแจ้งหนี้", "Create an invoice": "สร้างใบแจ้งหนี้",
  "Who do you need to pay?": "ต้องจ่ายใคร", "Okay, I dropped it.": "โอเค ยกเลิกแล้ว", "Copy message": "คัดลอกข้อความ", "Message": "ข้อความ", "Email it": "ส่งอีเมล",
  "In the full app I send this for you. Here it goes out from your own email or chat app.": "ในแอปตัวจริงหนูจะส่งให้เอง ตอนนี้จะส่งผ่านอีเมลหรือแอปแชตของคุณ",
  "Reminder sent. I will tell you the moment they pay.": "ส่งข้อความทวงแล้ว ลูกค้าจ่ายเมื่อไหร่หนูจะบอกทันที",

  // invoices, bills, money tab
  "New invoice": "ใบแจ้งหนี้ใหม่", "Customer": "ลูกค้า", "Customer email (optional)": "อีเมลลูกค้า (ไม่บังคับ)", "What for": "ค่าอะไร", "Qty": "จำนวน", "Price each": "ราคาต่อหน่วย", "Add a line": "เพิ่มรายการ",
  "Charge VAT (7%)": "คิด VAT (7%)", "VAT 7%": "VAT 7%", "Payment due in": "ครบกำหนดชำระใน", "15 days": "15 วัน", "30 days": "30 วัน", "7 days": "7 วัน", "Printable invoice": "ใบแจ้งหนี้สำหรับพิมพ์",
  "I number it, add VAT if you charge it, and remind you when it is late.": "หนูใส่เลขที่ให้ บวก VAT ถ้าคุณคิด และเตือนเมื่อเลยกำหนด",
  "Add a bill": "เพิ่มบิล", "Bill": "บิล", "Pay to": "จ่ายให้", "Supplier or person": "ซัพพลายเออร์หรือบุคคล", "Save bill": "บันทึกบิล", "Pay someone": "จ่ายเงิน", "Mark as paid": "ทำเครื่องหมายว่าจ่ายแล้ว",
  "PromptPay ID": "พร้อมเพย์", "PromptPay ID (optional)": "พร้อมเพย์ (ไม่บังคับ)", "PromptPay QR code": "QR พร้อมเพย์", "Phone or tax ID": "เบอร์โทรหรือเลขผู้เสียภาษี", "Note (optional)": "หมายเหตุ (ไม่บังคับ)",
  "Add the bill. With a PromptPay ID I make a QR code you can scan in any Thai banking app.": "เพิ่มบิล ถ้ามีพร้อมเพย์ หนูจะทำ QR ให้สแกนจ่ายได้จากแอปธนาคารไทยทุกแอป",
  "Add the supplier's PromptPay ID and I make a QR code with the amount filled in.": "ใส่พร้อมเพย์ของซัพพลายเออร์ แล้วหนูจะทำ QR พร้อมยอดเงินให้",
  "Delete this bill": "ลบบิลนี้", "Delete this invoice": "ลบใบแจ้งหนี้นี้", "Send a reminder": "ส่งข้อความทวง", "Send reminder": "ส่งข้อความทวง", "Send it to the customer": "ส่งให้ลูกค้า", "Reminder": "ข้อความทวง",
  "Choose a date": "เลือกวันที่", "Overdue invoices": "ใบแจ้งหนี้เลยกำหนด", "Overdue invoices and bills": "ใบแจ้งหนี้และบิลที่เลยกำหนด",
  "Customers": "ลูกค้า", "Suppliers": "ซัพพลายเออร์", "Customers and suppliers": "ลูกค้าและซัพพลายเออร์", "Company or person": "บริษัทหรือบุคคล",
  "Where it comes from": "เงินมาจากไหน", "Where it goes": "เงินไปไหน", "Where it went": "เงินไปไหน", "Receipts still missing": "ใบเสร็จที่ยังขาด", "Missing Makro receipt": "ขาดใบเสร็จแม็คโคร",
  "Send receipts from chat": "ส่งใบเสร็จทางแชต", "Filed. The receipts are in your files.": "จัดเก็บแล้ว ใบเสร็จอยู่ในไฟล์ของคุณ", "Download a copy": "ดาวน์โหลดสำเนา",

  // brief
  "No brief yet.": "ยังไม่มีสรุป", "Your morning brief starts the day after I have a bank statement to read.": "สรุปยามเช้าจะเริ่มในวันถัดไปหลังหนูได้อ่านรายการเดินบัญชี",
  "By ThuraGirl, your bookkeeper": "โดย ThuraGirl นักบัญชีของคุณ", "The week ahead": "สัปดาห์หน้า", "Can wait": "รอได้", "What I noticed": "สิ่งที่หนูสังเกตเห็น", "Done for you": "ทำให้แล้ว",
  "It is all on one page:": "ทุกอย่างอยู่ในหน้าเดียว:", "The package comes to": "ยอดรวมทั้งชุด", "need your yes.": "รอคุณกดยืนยัน", "and it was due yesterday. One yes files all of it.": "และครบกำหนดเมื่อวาน กดยืนยันครั้งเดียวยื่นได้ทั้งหมด",
  "kept. Tick the box and I lock the month.": "เหลือเก็บ ติ๊กช่องแล้วหนูจะปิดเดือนให้", "so far, and you have kept": "แล้ว และคุณเหลือเก็บ", "of it.": "", "in,": "เข้า", "out,": "ออก", "and the": "และ",
  "Approve and file": "อนุมัติและยื่น", "Approve payroll": "อนุมัติเงินเดือน", "Filings submitted for you": "ยื่นแบบให้แล้ว", "Monday morning: cash in, cash out, what to watch": "เช้าวันจันทร์: เงินเข้า เงินออก เรื่องที่ต้องจับตา",
  "Your cash covers about 1.6 months of spending at the pace of the last three months.": "เงินสดของคุณพอใช้จ่ายได้ราว 1.6 เดือน ตามอัตราใช้จ่ายสามเดือนที่ผ่านมา",

  // tax and payroll
  "Tax": "ภาษี", "Tax to file": "ภาษีที่ต้องยื่น", "VAT (PP.30)": "VAT (ภ.พ.30)", "Withholding (PND.3)": "หัก ณ ที่จ่าย (ภ.ง.ด.3)", "Social security (SSO)": "ประกันสังคม (สปส.)", "SSO": "ประกันสังคม",
  "Monthly VAT, net payable": "VAT รายเดือน ยอดชำระสุทธิ", "Monthly VAT, net payable (estimate)": "VAT รายเดือน ยอดชำระสุทธิ (ประมาณ)", "Company tax estimate": "ประมาณการภาษีนิติบุคคล", "End-of-year liability": "ภาระภาษีปลายปี",
  "Your employees are enrolled": "ลูกจ้างของคุณขึ้นทะเบียนแล้ว", "VAT and social security": "VAT และประกันสังคม", "VAT registered": "จดทะเบียน VAT", "You charge 7% VAT and file PP.30": "คุณเก็บ VAT 7% และยื่น ภ.พ.30",
  "Team and payroll": "ทีมและเงินเดือน", "Add a person": "เพิ่มคน", "New person": "คนใหม่", "Remove this person": "ลบคนนี้", "Monthly salary": "เงินเดือน", "Salary": "เงินเดือน", "Job": "ตำแหน่ง",
  "See this month's payroll": "ดูเงินเดือนเดือนนี้", "Add the people you pay each month. I work out SSO and withholding tax, and ask you to approve payroll before the 25th.": "เพิ่มคนที่คุณจ่ายเงินทุกเดือน หนูคำนวณประกันสังคมและภาษีหัก ณ ที่จ่าย แล้วให้คุณอนุมัติเงินเดือนก่อนวันที่ 25",
  "SSO is 5% of salary up to ฿17,500 a month (max ฿875), and you add the same again as the employer. Tax is a monthly PND.1 estimate with the standard allowances. ThuraGirl's accountant checks each person's real allowances in the live app.": "ประกันสังคม 5% ของเงินเดือน คิดสูงสุดที่ ฿17,500 ต่อเดือน (ไม่เกิน ฿875) และนายจ้างสมทบเท่ากัน ภาษีเป็นประมาณการ ภ.ง.ด.1 รายเดือนตามค่าลดหย่อนมาตรฐาน ในแอปตัวจริงนักบัญชีของ ThuraGirl จะตรวจค่าลดหย่อนจริงของแต่ละคน",
  "Head chef": "หัวหน้าเชฟ", "Sous chef": "ซูเชฟ", "Server": "พนักงานเสิร์ฟ", "Bookkeeper": "พนักงานบัญชี", "Operations manager": "ผู้จัดการฝ่ายปฏิบัติการ", "Front of house lead": "หัวหน้าหน้าร้าน",
  "Payroll approvals": "อนุมัติเงินเดือน", "When the month's payroll is ready": "เมื่อเงินเดือนของเดือนพร้อม",

  // settings
  "Account": "บัญชีผู้ใช้", "Company": "บริษัท", "Team": "ทีม", "Apps": "แอป", "Files": "ไฟล์", "Security": "ความปลอดภัย", "Plan": "แพ็กเกจ",
  "Your profile": "โปรไฟล์ของคุณ", "Your name": "ชื่อของคุณ", "What I call you": "ชื่อที่ให้หนูเรียก", "Email": "อีเมล", "Phone": "โทรศัพท์", "Language": "ภาษา", "Time zone": "เขตเวลา",
  "Appearance": "การแสดงผล", "Theme": "ธีม", "Auto": "อัตโนมัติ", "Day": "กลางวัน", "Night": "กลางคืน", "Changes save as you type.": "บันทึกให้อัตโนมัติขณะพิมพ์",
  "Notifications": "การแจ้งเตือน", "Tax filing reminders": "เตือนยื่นภาษี", "3 days and 1 day before every deadline": "ก่อนครบกำหนด 3 วันและ 1 วัน", "Overdue 1 day": "เลยกำหนด 1 วัน",
  "One daily summary of what's late": "สรุปรายวันว่ามีอะไรเลยกำหนด", "Weekly money digest": "สรุปการเงินรายสัปดาห์", "Test build: choices are saved, but nothing is sent yet.": "เวอร์ชันทดสอบ: บันทึกตัวเลือกแล้ว แต่ยังไม่มีการส่งจริง",
  "Your data": "ข้อมูลของคุณ", "Erase this test account": "ลบบัญชีทดสอบนี้", "Sign out": "ออกจากระบบ", "You can erase the account and everything in it from Settings at any time.": "คุณลบบัญชีและข้อมูลทั้งหมดได้จากหน้าตั้งค่าทุกเมื่อ",
  "680 bank lines from 1 account, 4 invoices, 4 bills and 0 receipts are saved in this browser.": "รายการเดินบัญชี 680 รายการจาก 1 บัญชี ใบแจ้งหนี้ 4 ใบ บิล 4 ใบ และใบเสร็จ 0 ใบ บันทึกอยู่ในเบราว์เซอร์นี้",
  "Company records": "ข้อมูลบริษัท", "Registered company name": "ชื่อบริษัทที่จดทะเบียน", "Registered address": "ที่อยู่ที่จดทะเบียน", "Registered capital": "ทุนจดทะเบียน", "Tax ID": "เลขประจำตัวผู้เสียภาษี",
  "Business type": "ประเภทธุรกิจ", "Directors": "กรรมการ", "Director": "กรรมการ", "Director:": "กรรมการ:", "Shareholder": "ผู้ถือหุ้น", "Shareholder:": "ผู้ถือหุ้น:", "Shares": "หุ้น", "Shares held": "จำนวนหุ้นที่ถือ",
  "Who can sign": "ผู้มีอำนาจลงนาม", "Who can sign for the company": "ผู้มีอำนาจลงนามแทนบริษัท", "These are right": "ข้อมูลถูกต้อง", "Pull from DBD again": "ดึงข้อมูลจาก DBD อีกครั้ง",
  "From DBD just now. Check each line, fix anything out of date, then confirm.": "ดึงจาก DBD เมื่อสักครู่ ตรวจทีละบรรทัด แก้ส่วนที่ไม่เป็นปัจจุบัน แล้วกดยืนยัน",
  "From your registration. Change them in the registration.": "มาจากการจดทะเบียนของคุณ แก้ไขได้ในหน้าจดทะเบียน",
  "Company verification": "ยืนยันตัวตนบริษัท", "Verify your company": "ยืนยันตัวตนบริษัท", "Secure verification": "ยืนยันอย่างปลอดภัย", "Company certificate": "หนังสือรับรองบริษัท",
  "One photo or PDF of your company certificate, up to 10 MB.": "รูปถ่ายหรือ PDF ของหนังสือรับรองบริษัท หนึ่งไฟล์ ไม่เกิน 10 MB",
  "One PDF or image, up to 10 MB. Make sure the company name and tax ID are readable.": "PDF หรือรูปภาพหนึ่งไฟล์ ไม่เกิน 10 MB ชื่อบริษัทและเลขผู้เสียภาษีต้องอ่านออก",
  "In the live app a verification partner handles this step. In this test build the file never leaves your browser.": "ในแอปตัวจริง พาร์ตเนอร์ยืนยันตัวตนจะดูแลขั้นตอนนี้ ในเวอร์ชันทดสอบ ไฟล์จะไม่ออกจากเบราว์เซอร์ของคุณ",
  "People with access": "ผู้มีสิทธิ์เข้าถึง", "Owner": "เจ้าของ", "Role": "บทบาท", "Roles": "บทบาท", "No role yet": "ยังไม่มีบทบาท",
  "Admin: Everything except billing and deleting the company": "ผู้ดูแล: ทำได้ทุกอย่าง ยกเว้นเรื่องค่าบริการและลบบริษัท", "Bookkeeper: Books, invoices, bills and uploads": "พนักงานบัญชี: บัญชี ใบแจ้งหนี้ บิล และการอัปโหลด",
  "Viewer: Can look, can't change anything": "ผู้ดู: ดูได้ แต่แก้ไขไม่ได้", "Accounting": "บัญชี", "Point of sale": "ระบบขายหน้าร้าน", "Messaging": "แชต", "Books you already keep": "โปรแกรมบัญชีที่ใช้อยู่",
  "Connected apps": "แอปที่เชื่อมต่อ", "Connect apps": "เชื่อมต่อแอป", "Connect your accounts": "เชื่อมต่อบัญชีของคุณ", "The more I can read, the less you type. Pick the ones you use.": "ยิ่งหนูอ่านได้มาก คุณยิ่งพิมพ์น้อย เลือกแอปที่คุณใช้",
  "Banks: live feeds need each bank's approval, so for now upload a CSV or Excel statement from your banking app. Other apps: tapping Connect marks them in this test build. The live link is set up on ThuraGirl's server.": "ธนาคาร: การดึงข้อมูลอัตโนมัติต้องได้รับอนุมัติจากแต่ละธนาคาร ตอนนี้ให้อัปโหลดรายการเดินบัญชี CSV หรือ Excel จากแอปธนาคารไปก่อน แอปอื่น: ในเวอร์ชันทดสอบ การกดเชื่อมต่อจะทำเครื่องหมายไว้ การเชื่อมจริงตั้งค่าบนเซิร์ฟเวอร์ของ ThuraGirl",
  "Don't ask me when I sign in": "ไม่ต้องถามตอนเข้าสู่ระบบ", "Active": "ใช้งานอยู่", "Documents": "เอกสาร", "Invoices you make, receipts you send and statements you upload all land here.": "ใบแจ้งหนี้ที่คุณออก ใบเสร็จที่ส่ง และรายการเดินบัญชีที่อัปโหลด จะมาอยู่ที่นี่ทั้งหมด",
  "Test build: only the name and size of each file are kept, in this browser. The live app stores them in your company vault.": "เวอร์ชันทดสอบ: เก็บเฉพาะชื่อและขนาดไฟล์ไว้ในเบราว์เซอร์นี้ แอปตัวจริงจะเก็บไฟล์ไว้ในคลังเอกสารของบริษัท",
  "Tax invoices for each payment appear here.": "ใบกำกับภาษีของแต่ละการชำระจะแสดงที่นี่",
  "Sign-in and security": "การเข้าสู่ระบบและความปลอดภัย", "Passkey (recommended)": "พาสคีย์ (แนะนำ)", "Add passkey": "เพิ่มพาสคีย์", "Use Face ID or Touch ID instead of your password.": "ใช้ Face ID หรือ Touch ID แทนรหัสผ่าน",
  "Test build: the passkey is made on your device for real, but sign-in is checked in this browser only. The live app checks it on ThuraGirl's server.": "เวอร์ชันทดสอบ: สร้างพาสคีย์บนเครื่องของคุณจริง แต่ตรวจการเข้าสู่ระบบในเบราว์เซอร์นี้เท่านั้น แอปตัวจริงตรวจบนเซิร์ฟเวอร์ของ ThuraGirl",
  "Two-step sign-in": "ยืนยันตัวตนสองขั้นตอน", "After your password, I also ask for a 6-digit code from an app like Google Authenticator, Microsoft Authenticator or 1Password.": "หลังใส่รหัสผ่าน หนูจะขอรหัส 6 หลักจากแอปอย่าง Google Authenticator, Microsoft Authenticator หรือ 1Password ด้วย",
  "Scan this in your authenticator app": "สแกนด้วยแอปยืนยันตัวตน", "Or type the key by hand.": "หรือพิมพ์คีย์เอง", "6-digit code from the app": "รหัส 6 หลักจากแอป", "Change password": "เปลี่ยนรหัสผ่าน",
  "Current password": "รหัสผ่านปัจจุบัน", "New password": "รหัสผ่านใหม่", "Type it again": "พิมพ์อีกครั้ง", "Update password": "อัปเดตรหัสผ่าน", "Your password is stored only as a salted hash.": "รหัสผ่านของคุณถูกเก็บเป็นค่าแฮชแบบ salt เท่านั้น",
  "Your plan": "แพ็กเกจของคุณ", "Standard": "Standard", "Pro": "Pro", "Most popular": "ยอดนิยม", "Choose Standard": "เลือก Standard", "Choose Pro": "เลือก Pro", "Switch to Pro": "เปลี่ยนเป็น Pro", "a month": "ต่อเดือน",
  "Bookkeeping, up to 150 documents a month": "ทำบัญชี สูงสุด 150 เอกสารต่อเดือน", "VAT, withholding and SSO prepared every month": "เตรียม VAT ภาษีหัก ณ ที่จ่าย และประกันสังคมทุกเดือน", "Chat and LINE, unlimited": "แชตและ LINE ไม่จำกัด",
  "Year-end closing with the auditor": "ปิดงบสิ้นปีกับผู้สอบบัญชี", "Everything in Standard, unlimited documents": "ทุกอย่างใน Standard เอกสารไม่จำกัด", "Payroll and more than one company": "เงินเดือน และดูแลได้มากกว่าหนึ่งบริษัท",
  "Company registration included": "รวมบริการจดทะเบียนบริษัท", "Prices are launch prices in baht, VAT included. Early customers keep them.": "ราคาเปิดตัวเป็นเงินบาท รวม VAT แล้ว ลูกค้ากลุ่มแรกได้ราคานี้ตลอด",
  "Payment and receipts": "การชำระเงินและใบเสร็จ", "Pay by card or PromptPay through Beam, our payment partner. Card details are typed on Beam's page, never in ThuraGirl.": "จ่ายด้วยบัตรหรือพร้อมเพย์ผ่าน Beam พาร์ตเนอร์รับชำระเงินของเรา ข้อมูลบัตรกรอกบนหน้าของ Beam ไม่ผ่าน ThuraGirl",
  "Continue to payment": "ไปที่การชำระเงิน", "Next you go to Beam's secure checkout to pay by card or PromptPay. Your plan starts as soon as Beam confirms the payment, and renews every month until you cancel.": "ขั้นต่อไปคุณจะไปหน้าชำระเงินที่ปลอดภัยของ Beam จ่ายด้วยบัตรหรือพร้อมเพย์ แพ็กเกจเริ่มทันทีที่ Beam ยืนยันการชำระ และต่ออายุทุกเดือนจนกว่าคุณจะยกเลิก",
  "Test build: Beam checkout is not connected yet, so this only records your choice.": "เวอร์ชันทดสอบ: ยังไม่ได้เชื่อมหน้าชำระเงิน Beam ตอนนี้จึงบันทึกแค่ตัวเลือกของคุณ",
  "Sign in faster next time": "ครั้งหน้าเข้าสู่ระบบได้เร็วขึ้น", "Sign in with Face ID or Touch ID instead of a password.": "เข้าสู่ระบบด้วย Face ID หรือ Touch ID แทนรหัสผ่าน",

  // company menu (app85)
  "Your companies": "บริษัทของคุณ", "Add a company": "เพิ่มบริษัท", "Current": "ใช้อยู่", "Switch company": "เปลี่ยนบริษัท", "All settings": "ตั้งค่าทั้งหมด",
  "Add another company to the same sign-in. Each one keeps its own books, bank statements and tasks.": "เพิ่มบริษัทอื่นในบัญชีเดียวกัน แต่ละบริษัทแยกบัญชี รายการเดินบัญชี และงานของตัวเอง",
  "Back to my company": "กลับไปบริษัทเดิม", "Screens switch to Thai straight away. ThuraGirl answers in the language you write in.": "หน้าจอเปลี่ยนเป็นภาษาไทยทันที ThuraGirl ตอบเป็นภาษาที่คุณพิมพ์มา",

  // sign up and sign in
  "Create an account": "สร้างบัญชี", "Create account": "สร้างบัญชี", "Sign in": "เข้าสู่ระบบ", "Already have an account?": "มีบัญชีอยู่แล้ว?", "New here?": "เพิ่งเคยมา?", "Let's get you in.": "มาเริ่มกันเลย",
  "Sign in to pick up where you left off.": "เข้าสู่ระบบเพื่อทำต่อจากที่ค้างไว้", "Full name": "ชื่อ-นามสกุล", "Password": "รหัสผ่าน", "Create a password": "ตั้งรหัสผ่าน", "Show password": "แสดงรหัสผ่าน",
  "At least 8 characters": "อย่างน้อย 8 ตัวอักษร", "✓ 8 or more characters": "✓ 8 ตัวอักษรขึ้นไป", "I accept the": "ฉันยอมรับ", "Terms": "ข้อกำหนด", "PDPA privacy notice": "ประกาศความเป็นส่วนตัวตาม PDPA",
  "Terms and PDPA notice": "ข้อกำหนดและประกาศ PDPA", "Before launch": "ก่อนเปิดตัว", "The full Terms of Service and the PDPA privacy notice will be published here before ThuraGirl opens to customers.": "ข้อกำหนดการใช้บริการฉบับเต็มและประกาศความเป็นส่วนตัวตาม PDPA จะเผยแพร่ที่นี่ก่อน ThuraGirl เปิดให้บริการ",
  "Test build: your details stay in this browser and are not sent anywhere. Please use a made-up password.": "เวอร์ชันทดสอบ: ข้อมูลของคุณอยู่ในเบราว์เซอร์นี้และไม่ถูกส่งไปไหน กรุณาใช้รหัสผ่านสมมติ",
  "Test build: this account lives only in this browser. Signing in on another device will not find it.": "เวอร์ชันทดสอบ: บัญชีนี้อยู่ในเบราว์เซอร์นี้เท่านั้น เข้าสู่ระบบจากเครื่องอื่นจะไม่พบ",
  "In this test build your details stay in this browser. Nothing is sent to a server.": "ในเวอร์ชันทดสอบนี้ ข้อมูลของคุณอยู่ในเบราว์เซอร์นี้ ไม่มีการส่งไปยังเซิร์ฟเวอร์",
  "It takes about a minute. Everything else can wait until you are inside.": "ใช้เวลาประมาณหนึ่งนาที เรื่องอื่นไว้ทำหลังเข้าแอปได้",
  "Sign in with Face ID or a passkey": "เข้าสู่ระบบด้วย Face ID หรือพาสคีย์", "Almost there.": "ใกล้เสร็จแล้ว", "One more thing": "อีกเรื่องเดียว",
  "First, your company.": "เริ่มจากบริษัทของคุณ", "Yes, it is registered": "ใช่ จดทะเบียนแล้ว", "Not registered yet": "ยังไม่ได้จดทะเบียน", "Either way, I handle the paperwork.": "ทางไหนก็ได้ หนูจัดการเอกสารให้",
  "I set it up from your 13-digit tax ID.": "หนูตั้งค่าให้จากเลขผู้เสียภาษี 13 หลัก", "I register one for you with DBD. It is included in every plan.": "หนูจดทะเบียนกับ DBD ให้ รวมอยู่ในทุกแพ็กเกจ",
  "What is the company tax ID?": "เลขผู้เสียภาษีของบริษัทคืออะไร", "The 13 digits on your company certificate.": "เลข 13 หลักบนหนังสือรับรองบริษัท", "13-digit tax ID": "เลขผู้เสียภาษี 13 หลัก", "✓ 13 digits": "✓ ครบ 13 หลัก",
  "No tax ID to hand?": "ไม่มีเลขผู้เสียภาษีอยู่ตรงนี้?", "Use the demo company": "ใช้บริษัทตัวอย่าง", "Demo company found. Fix anything that is out of date.": "พบบริษัทตัวอย่าง แก้ส่วนที่ไม่เป็นปัจจุบันได้เลย",
  "Last one. What kind of business?": "ข้อสุดท้าย ธุรกิจของคุณเป็นแบบไหน", "So I can pick the right tax forms, accounts and vendor categories for you.": "หนูจะได้เลือกแบบภาษี ผังบัญชี และหมวดผู้ขายให้ถูก",
  "Restaurant": "ร้านอาหาร", "Retail / Shopfront": "ร้านค้าปลีก / หน้าร้าน", "Online / E-commerce": "ออนไลน์ / อีคอมเมิร์ซ", "Cafe / Bakery": "คาเฟ่ / เบเกอรี่", "Beauty / Salon": "ความงาม / ซาลอน",
  "Services / Agency": "บริการ / เอเจนซี่", "Manufacturing": "การผลิต", "Other": "อื่น ๆ", "Four quick questions": "สี่คำถามสั้น ๆ", "Always needed": "ต้องมีเสมอ",
  "Take me in": "พาเข้าไปเลย", "Welcome back.": "ยินดีต้อนรับกลับมา",
  "Is any shareholder or director not Thai?": "มีผู้ถือหุ้นหรือกรรมการที่ไม่ใช่คนไทยไหม", "Do all founders have a Thai ID that works for online identity checks?": "ผู้ก่อการทุกคนมีบัตรประชาชนที่ใช้ยืนยันตัวตนออนไลน์ได้ไหม",
  "Are the premises rented or owned?": "สถานที่ตั้งเช่าหรือเป็นเจ้าของ", "Rented": "เช่า", "Owned": "เป็นเจ้าของ", "Does the business need a specific licence?": "ธุรกิจต้องมีใบอนุญาตเฉพาะไหม",
  "They tell me which papers DBD will ask for. You add the papers later, from inside the app.": "คำตอบช่วยให้หนูรู้ว่า DBD จะขอเอกสารอะไร คุณค่อยเพิ่มเอกสารภายหลังในแอปได้",
  "Charge VAT": "เก็บ VAT", "Have employees (SSO)": "มีลูกจ้าง (ประกันสังคม)",

  // registration
  "Register your company": "จดทะเบียนบริษัท", "Continue registration": "จดทะเบียนต่อ", "New company": "บริษัทใหม่", "Registered": "จดทะเบียนแล้ว",
  "Five short parts, in any order. Most people finish in about 15 minutes. Everything saves as you go.": "ห้าส่วนสั้น ๆ ทำส่วนไหนก่อนก็ได้ ส่วนใหญ่เสร็จในราว 15 นาที บันทึกให้อัตโนมัติ",
  "Name and purpose": "ชื่อและวัตถุประสงค์", "Capital and shares": "ทุนและหุ้น", "People": "บุคคล", "Office and running the company": "สำนักงานและการบริหาร",
  "What happens after you submit": "หลังส่งแล้วจะเกิดอะไรขึ้น", "Submit for registration": "ส่งจดทะเบียน", "Still needed": "ยังขาด",
  "I check everything and reserve the name with DBD. A name holds for 30 days.": "หนูตรวจทุกอย่างและจองชื่อกับ DBD ชื่อที่จองมีอายุ 30 วัน",
  "Everyone named confirms, online with a Thai ID or on paper.": "ทุกคนที่มีชื่อยืนยัน ออนไลน์ด้วยบัตรประชาชนหรือบนกระดาษ",
  "DBD registers the company, usually in 1 to 3 working days. The company tax ID is the registration number.": "DBD จดทะเบียนบริษัท ปกติใช้เวลา 1 ถึง 3 วันทำการ เลขทะเบียนบริษัทคือเลขผู้เสียภาษี",
  "You open the company bank account with the certificate, and upload its first statement here.": "คุณเปิดบัญชีธนาคารของบริษัทด้วยหนังสือรับรอง แล้วอัปโหลดรายการเดินบัญชีแรกที่นี่",
  "Give up to three names in Thai, best first. If DBD says the first is taken, I try the next one.": "ตั้งชื่อภาษาไทยได้สูงสุดสามชื่อ เรียงจากที่ชอบที่สุด ถ้าชื่อแรกมีคนใช้แล้ว หนูจะลองชื่อถัดไป",
  "First choice": "ชื่อแรก", "Second choice (optional)": "ชื่อที่สอง (ไม่บังคับ)", "Third choice (optional)": "ชื่อที่สาม (ไม่บังคับ)", "Another name, in case": "ชื่อสำรอง", "English name (optional)": "ชื่อภาษาอังกฤษ (ไม่บังคับ)",
  "Co., Ltd.": "จำกัด", "What the company will do": "วัตถุประสงค์ของบริษัท", "Objectives": "วัตถุประสงค์", "One per line": "บรรทัดละหนึ่งข้อ",
  "Tap your kind of business to start from the usual wording, then edit. One line per activity, up to 30. Wider is fine; you can do less than you list, never more.": "แตะประเภทธุรกิจเพื่อเริ่มจากข้อความที่ใช้กันทั่วไป แล้วแก้ไขได้ บรรทัดละหนึ่งกิจกรรม สูงสุด 30 ข้อ เขียนกว้างไว้ได้ ทำน้อยกว่าที่เขียนได้ แต่ทำเกินไม่ได้",
  "When the financial year ends": "วันสิ้นรอบปีบัญชี", "Year ends on": "สิ้นปีบัญชีวันที่", "Most companies use 31 December. Your first year can be shorter than 12 months.": "บริษัทส่วนใหญ่ใช้ 31 ธันวาคม ปีแรกสั้นกว่า 12 เดือนได้",
  "Capital is what the owners promise to put in. It is not a fee. ฿1,000,000 is the most common, and only a quarter of it has to be paid in at the start.": "ทุนคือเงินที่เจ้าของสัญญาว่าจะลงในบริษัท ไม่ใช่ค่าธรรมเนียม ที่นิยมที่สุดคือ ฿1,000,000 และชำระตอนเริ่มแค่หนึ่งในสี่",
  "฿1,000,000 (most common)": "฿1,000,000 (นิยมที่สุด)", "Par value per share (at least ฿5)": "มูลค่าหุ้นละ (อย่างน้อย ฿5)", "The par value must divide the capital evenly.": "มูลค่าหุ้นต้องหารทุนได้ลงตัว",
  "How much is paid in now": "ชำระค่าหุ้นตอนนี้เท่าไหร่", "A quarter (the minimum)": "หนึ่งในสี่ (ขั้นต่ำ)", "All of it": "ทั้งหมด", "Paid-up per share (at least 25% of par)": "ชำระต่อหุ้น (อย่างน้อย 25% ของมูลค่า)",
  "The founders pay in ฿250,000 now, into the company bank account once it is open.": "ผู้ก่อการชำระ ฿250,000 ตอนนี้ เข้าบัญชีธนาคารของบริษัทเมื่อเปิดบัญชีแล้ว",
  "Government fees for this capital: about ฿5,500 (memorandum and registration). ThuraGirl's fee is separate.": "ค่าธรรมเนียมราชการสำหรับทุนนี้: ประมาณ ฿5,500 (หนังสือบริคณห์สนธิและจดทะเบียน) ค่าบริการ ThuraGirl แยกต่างหาก",
  "Shares given out": "หุ้นที่จัดสรรแล้ว", "0 shares": "0 หุ้น",
  "Add everyone involved. One person can hold several roles.": "เพิ่มทุกคนที่เกี่ยวข้อง หนึ่งคนมีได้หลายบทบาท", "Add me": "เพิ่มตัวฉัน", "Add a director": "เพิ่มกรรมการ", "Add a shareholder": "เพิ่มผู้ถือหุ้น",
  "Founder": "ผู้ก่อการ", "Founder:": "ผู้ก่อการ:", "Founders": "ผู้ก่อการ", "Founder, Director": "ผู้ก่อการ, กรรมการ",
  "signs the memorandum and must hold at least 1 share. You need 2 or more.": "ลงนามในหนังสือบริคณห์สนธิและต้องถืออย่างน้อย 1 หุ้น ต้องมีตั้งแต่ 2 คนขึ้นไป",
  "runs the company and signs for it. You need 1 or more.": "บริหารบริษัทและลงนามแทนบริษัท ต้องมีตั้งแต่ 1 คนขึ้นไป", "owns shares but has no say in day-to-day running.": "ถือหุ้นแต่ไม่ได้บริหารงานประจำวัน",
  "First name": "ชื่อ", "Last name": "นามสกุล", "Nationality": "สัญชาติ", "Birth date": "วันเกิด", "Occupation": "อาชีพ", "National ID (13 digits)": "เลขบัตรประชาชน (13 หลัก)", "On the front of the ID card": "อยู่ด้านหน้าบัตรประชาชน",
  "Home address, as on the ID card or passport": "ที่อยู่ตามบัตรประชาชนหรือหนังสือเดินทาง", "House number, street, subdistrict, district, province, postcode": "บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์",
  "Choose a person": "เลือกบุคคล", "Person": "บุคคล", "Applicant (must be a founder and a director)": "ผู้ขอจดทะเบียน (ต้องเป็นผู้ก่อการและกรรมการ)",
  "The registered office is where DBD and the Revenue Department send letters. A rented shop, an office or your home all work, with the owner's consent.": "สำนักงานที่จดทะเบียนคือที่ที่ DBD และกรมสรรพากรส่งจดหมายไป จะเป็นร้านที่เช่า สำนักงาน หรือบ้านก็ได้ ถ้าเจ้าของยินยอม",
  "House number and street": "บ้านเลขที่และถนน", "Subdistrict": "ตำบล/แขวง", "District": "อำเภอ/เขต", "Province": "จังหวัด", "Postcode": "รหัสไปรษณีย์",
  "Who owns the place": "เจ้าของสถานที่", "Landlord's name, or yours if you own it": "ชื่อผู้ให้เช่า หรือชื่อคุณถ้าเป็นเจ้าของ",
  "Any one director": "กรรมการคนใดคนหนึ่ง", "Two directors jointly": "กรรมการสองคนร่วมกัน", "Named directors": "กรรมการที่ระบุชื่อ",
  "Simplest: any director can sign alone. Most small companies choose this.": "ง่ายที่สุด: กรรมการคนใดลงนามคนเดียวได้ บริษัทเล็กส่วนใหญ่เลือกแบบนี้", "Only the directors you pick can sign.": "เฉพาะกรรมการที่คุณเลือกเท่านั้นที่ลงนามได้",
  "Any one director signs and affixes the company seal": "กรรมการคนใดคนหนึ่งลงนามและประทับตราบริษัท", "Company seal": "ตราบริษัท", "Optional. Without a seal, the directors' signatures are enough.": "ไม่บังคับ ถ้าไม่มีตรา ลายมือชื่อกรรมการก็พอ",
  "First meeting date": "วันประชุมจัดตั้งบริษัท", "Chair of the first meeting": "ประธานที่ประชุมจัดตั้ง",
  "The first meeting is when the founders agree the rules and appoint the directors. It can be the same day you submit. The applicant files the papers and is usually you.": "การประชุมจัดตั้งคือตอนที่ผู้ก่อการตกลงข้อบังคับและแต่งตั้งกรรมการ เป็นวันเดียวกับที่ส่งได้ ผู้ขอจดทะเบียนเป็นคนยื่นเอกสาร ซึ่งปกติคือคุณ",
  "Auditor: ThuraGirl appoints a licensed auditor for you. Nothing to fill in here.": "ผู้สอบบัญชี: ThuraGirl แต่งตั้งผู้สอบบัญชีรับอนุญาตให้ ไม่ต้องกรอกอะไรตรงนี้",
  "ID card copy": "สำเนาบัตรประชาชน", "Signed consent letter to use the premises": "หนังสือยินยอมให้ใช้สถานที่ที่ลงนามแล้ว", "Title document for the premises": "เอกสารสิทธิ์ของสถานที่", "Upload": "อัปโหลด",
  "· A first-choice company name": "· ชื่อบริษัทลำดับแรก", "· At least 1 director": "· กรรมการอย่างน้อย 1 คน", "· At least one named director who can sign": "· กรรมการที่ระบุชื่อและลงนามได้อย่างน้อย 1 คน",
  "· At least one objective": "· วัตถุประสงค์อย่างน้อย 1 ข้อ", "· First meeting date": "· วันประชุมจัดตั้ง", "· Full office address": "· ที่อยู่สำนักงานครบถ้วน", "· Paid-up amount per share": "· ยอดชำระต่อหุ้น",
  "· Par value of at least ฿5 per share": "· มูลค่าหุ้นอย่างน้อย ฿5", "· Registered capital": "· ทุนจดทะเบียน", "· The applicant": "· ผู้ขอจดทะเบียน", "· Whether there is a company seal": "· มีตราบริษัทหรือไม่",
  "· Who can sign for the company": "· ผู้มีอำนาจลงนาม", "· Who chaired the meeting": "· ประธานที่ประชุม", "· Who owns the premises": "· เจ้าของสถานที่", "· 5-digit postcode": "· รหัสไปรษณีย์ 5 หลัก",
  "· Signed consent letter to use the premises": "· หนังสือยินยอมให้ใช้สถานที่", "· Title document for the premises": "· เอกสารสิทธิ์ของสถานที่",
  "Operate restaurants and sell food and drinks\nProvide catering and event food services": "ประกอบกิจการร้านอาหารและจำหน่ายอาหารและเครื่องดื่ม\nให้บริการจัดเลี้ยงและอาหารสำหรับงานอีเวนต์",

  // auth top / misc placeholders
  "name@company.co.th": "name@company.co.th", "customer@example.com": "customer@example.com", "Invoice number, what it is for": "เลขที่ใบแจ้งหนี้ ค่าอะไร",
  "Bangkok Bank": "ธนาคารกรุงเทพ", "Krungsri": "กรุงศรี", "Krungthai": "กรุงไทย", "Lotus Wholesale": "Lotus Wholesale",
  "MEA (electricity)": "กฟน. (ค่าไฟ)", "PTT (electricity)": "PTT (ค่าไฟ)", "Electricity, PTT": "ค่าไฟ, PTT", "Rent, Watthana Property": "ค่าเช่า, Watthana Property",
  "Catering": "จัดเลี้ยง", "Catering, 50 guests": "จัดเลี้ยง 50 ท่าน", "Catering, staff party": "จัดเลี้ยงงานเลี้ยงพนักงาน", "Thai Beverage Co": "Thai Beverage Co"
};

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
  [/^(Revenue|Expenses|Profit|Money in|Money out), ([\d,.-]+) baht\. Open Money$/, function(m){ return T(m[1]) + " " + m[2] + " บาท เปิดหน้าการเงิน"; }],
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

/* ── start ── */
buildSpark();
route();
})();
