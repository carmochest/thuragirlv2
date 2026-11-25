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
  if (u && suStep >= suSteps(u).length){ u.onboarded = true; u.welcome = true; save(); suStep = 0; suMoved = false; go(""); return; }
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
        db.session = acc.email; save(); suStep = acc.onboarded ? 0 : 1; go("");
      });
    };
    form.appendChild(nextBtn("Sign in"));
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
  if (tab === "money"){ renderMoney(); paintLists(u); }
  if (tab === "brief") renderBrief();
  if (tab === "settings") renderSettings();
  if (tab === "register") renderRegister();
  var cs = chips(); $$("#b-sug button").forEach(function(b, i){ b.textContent = cs[i]; });
  var key = db.session + ":" + tab + ":" + (u.hasData ? 1 : 0);
  if (key !== lastKey){ closeAll(); play(); window.scrollTo(0, 0); }
  lastKey = key;
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
  paintSetup(); paintBanks(); paintHero(u); paintNeeds(u); setCount();
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
var CONNS = [["kbank", "KB", "K-Bank", "Bank feed"], ["tiktok", "TT", "TikTok Shop", "Marketplace sales"], ["flow", "FA", "FlowAccount", "Accounting"]];
function connRows(u, again){
  var r = el("div", "ob-rows");
  CONNS.forEach(function(c){
    var row = el("div", "ob-row"); row.appendChild(el("span", "ob-av", c[1]));
    var tx = el("div", "tx"); tx.appendChild(el("b", "", c[2])); tx.appendChild(el("span", "", c[3])); row.appendChild(tx);
    var x = el("button", "pill soft act" + (u.setup.conn[c[0]] ? " ok" : "")); x.type = "button"; x.innerHTML = u.setup.conn[c[0]] ? CHECK + "Linked" : "Connect";
    x.addEventListener("click", function(){ if (u.setup.conn[c[0]]) delete u.setup.conn[c[0]]; else u.setup.conn[c[0]] = 1; save(); again(); });
    row.appendChild(x); r.appendChild(row);
  });
  return r;
}
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
function renderSettings(){
  var u = me(), root = $("#b-settings"), again = function(){ renderSettings(); paintSetup(); setCount(); }; root.textContent = ""; root.classList.remove("in");
  var h = el("div", "pgh"); h.appendChild(el("h1", "", "Settings")); h.appendChild(el("p", "", "Update anything here whenever you like. Changes save as you type.")); root.appendChild(h);

  var you = card("You"), g1 = el("div", "fgrid");
  g1.appendChild(fld("Your name", u.name, { saved: 1, on: function(v){ if (!v.trim()) return "Please add your name"; u.name = v.trim(); save(); return ""; } }));
  g1.appendChild(fld("Email", u.email, { ro: 1 })); you.appendChild(g1); root.appendChild(you);

  var co = card("Company");
  if (u.path === "new"){
    co.appendChild(el("p", "st-p", u.reg.submitted ? "Your registration has been submitted." : "Not registered yet. " + (regLeft(u) ? regLeft(u) + " of 5 parts still need you." : "Everything is ready to submit.")));
    var rb = el("button", "pill soft act", u.reg.submitted ? "View registration" : "Continue registration"); rb.type = "button"; rb.style.justifySelf = "start"; rb.addEventListener("click", function(){ go("register"); }); co.appendChild(rb);
  } else {
    var g2 = el("div", "fgrid"), c = u.company;
    g2.appendChild(fld("Registered company name", c.name, { saved: 1, on: function(v){ if (v.trim().length < 2) return "At least 2 characters"; c.name = v.trim(); save(); $("#b-co-n").textContent = coName(u); $("#b-co-i").textContent = initials(coName(u)); return ""; } }));
    g2.appendChild(fld("Tax ID", c.taxid, { saved: 1, mode: "numeric", max: 13, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); if (inp.value.length !== 13) return "Exactly 13 digits"; if (taxTaken(inp.value, u)) return "This company is already on ThuraGirl"; c.taxid = inp.value; save(); return ""; } }));
    g2.appendChild(fld("Registered address", c.addr, { saved: 1, wide: 1, on: function(v){ if (v.trim().length < 5) return "At least 5 characters"; c.addr = v.trim(); save(); return ""; } }));
    g2.appendChild(fld("Business type", c.type, { saved: 1, options: TYPES.map(function(t){ return [t[0], t[0]]; }), on: function(v){ c.type = v; save(); return ""; } }));
    co.appendChild(g2); co.appendChild(vatRows(u, function(){ again(); toast("Saved"); })); root.appendChild(co);
    var cn = card("Connections"); cn.appendChild(connRows(u, function(){ again(); toast("Saved"); })); root.appendChild(cn);
    co = card("Company verification"); var vb = verifyBlock(u, again); while (vb.firstChild) co.appendChild(vb.firstChild);
  }
  root.appendChild(co);

  var bk = card("Bank statements");
  if (!u.banks.length) bk.appendChild(el("p", "st-p", "No statements yet. Upload one and I build your dashboard from it."));
  u.banks.forEach(function(b){
    var r = el("div", "docrow"), tx = el("div", "tx"); tx.appendChild(el("b", "", b.bank + " ···· " + b.acct.slice(-4))); tx.appendChild(el("span", "", "Synced " + ago(b.at, true))); r.appendChild(tx);
    var x = el("button", "pill soft act", "Upload"); x.type = "button"; x.addEventListener("click", function(){ openUpload(b); }); r.appendChild(x); bk.appendChild(r);
  });
  var ub = el("button", "pill soft act", u.banks.length ? "Add another bank" : "Upload a statement"); ub.type = "button"; ub.style.justifySelf = "start"; ub.addEventListener("click", function(){ openUpload(); }); bk.appendChild(ub);
  root.appendChild(bk);

  dataCard(u, root);

  var ap = card("Appearance"), row = el("div", "frow"); row.appendChild(el("b", "", "Theme"));
  var labels = { auto: "Auto", day: "Day", night: "Night" }, sg = seg(["Auto", "Day", "Night"], labels[u.theme || "auto"], function(v){ u.theme = v.toLowerCase(); save(); applyTheme(); });
  sg.classList.add("on-soft"); row.appendChild(sg); ap.appendChild(row); root.appendChild(ap);

  var ac = card("Account"), r2 = el("div", "chips");
  var so = el("button", "pill soft act", "Sign out"); so.type = "button"; so.addEventListener("click", function(){ db.session = ""; save(); suStep = 0; toAuth("login"); });
  var er = el("button", "pill soft act danger", eraseArmed ? "Tap again to erase everything" : "Erase this test account"); er.type = "button";
  er.addEventListener("click", function(){ if (!eraseArmed){ eraseArmed = true; renderSettings(); return; } eraseArmed = false; delete db.users[u.email]; db.session = ""; save(); suStep = 0; toAuth(""); });
  r2.appendChild(so); r2.appendChild(er); ac.appendChild(r2);
  ac.appendChild(el("p", "tnote", "Test build: this account lives only in this browser. Signing in on another device will not find it."));
  root.appendChild(ac);
}

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
  if (p.nat === "th" && !/^\d{13}$/.test(p.nid)) m.push("13-digit national ID");
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
  if (!r.names[0].trim()) o.basics.push("A first-choice company name");
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
  h.appendChild(el("p", "", "Five short parts, in any order. Everything saves as you go, and I remind you about whatever is left.")); root.appendChild(h);
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
        ["First choice", "Second choice (optional)", "Third choice (optional)"].forEach(function(lab, j){ nw.appendChild(fld(lab, r.names[j], { prefix: "บริษัท", suffix: "จำกัด", ph: "Company name", on: function(v){ r.names[j] = v; keep(); } })); });
        b.appendChild(nw);
        b.appendChild(fld("Objectives, one per line (up to 30)", r.objectives, { area: 1, ph: "Run a restaurant\nCater events", on: function(v){ r.objectives = v; keep(); } }));
        b.appendChild(fld("Fiscal year ends", r.fy, { options: MONTHS.map(function(m, j){ return [String(j + 1), m]; }), on: function(v){ r.fy = v; keep(); } }));
      } else if (k === "capital"){
        var g = el("div", "fgrid"), digits = function(set){ return function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); set(inp.value); keep(); }; };
        g.appendChild(fld("Registered capital", r.capital, { prefix: "฿", mode: "numeric", ph: "1000000", on: digits(function(v){ r.capital = v; }) }));
        g.appendChild(fld("Par value per share (at least ฿5)", r.par, { prefix: "฿", mode: "numeric", ph: "100", on: digits(function(v){ r.par = v; }) }));
        g.appendChild(fld("Paid-up per share (at least 25% of par)", r.paid, { prefix: "฿", mode: "numeric", ph: "25", on: digits(function(v){ r.paid = v; }) }));
        b.appendChild(g); var sh = el("p", "fhint"); sh.id = "reg-shares"; b.appendChild(sh);
      } else if (k === "people"){
        b.appendChild(el("p", "st-p", "Add everyone involved: at least 2 founders and 1 director. One person can hold several roles."));
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
            if (p.nat === "th") pg2.appendChild(fld("National ID (13 digits)", p.nid, { mode: "numeric", max: 13, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); p.nid = inp.value; keep(); } }));
            if (p.nat === "fo"){ pg2.appendChild(fld("Passport number", p.passport, { on: function(v){ p.passport = v; keep(); } })); pg2.appendChild(fld("Country", p.country, { on: function(v){ p.country = v; keep(); } })); }
            pg2.appendChild(fld("Birth date", p.dob, { type: "date", maxDate: today(), on: function(v){ p.dob = v; keep(); } }));
            if (p.roles.p) pg2.appendChild(fld("Occupation", p.occ, { on: function(v){ p.occ = v; keep(); } }));
            if (holder(p)) pg2.appendChild(fld("Shares held", p.shares, { mode: "numeric", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); p.shares = inp.value; keep(); } }));
            pg2.appendChild(fld("Complete address", p.addr, { wide: 1, on: function(v){ p.addr = v; keep(); } }));
            pc.appendChild(pg2);
            var rm = el("button", "alt danger", "Remove this person"); rm.type = "button"; rm.addEventListener("click", function(){ r.people = r.people.filter(function(x){ return x !== p; }); regEdit = ""; redo(); }); pc.appendChild(rm);
          }
          b.appendChild(pc);
        });
        var addP = el("button", "pill soft act", "Add a person"); addP.type = "button"; addP.style.justifySelf = "start";
        addP.addEventListener("click", function(){ var id = "p" + Date.now().toString(36); r.people.push({ id: id, first: "", last: "", roles: { p: false, d: false, s: false }, nat: "", country: "", dob: "", addr: "", occ: "", nid: "", passport: "", shares: "" }); regEdit = id; redo(); });
        b.appendChild(addP);
      } else if (k === "office"){
        var of = r.office, og = el("div", "fgrid"), who = [["", "Choose a person"]].concat(r.people.map(function(p){ return [p.id, pname(p)]; }));
        og.appendChild(fld("House number and street", of.no, { wide: 1, on: function(v){ of.no = v; keep(); } }));
        og.appendChild(fld("Subdistrict", of.sub, { on: function(v){ of.sub = v; keep(); } }));
        og.appendChild(fld("District", of.dist, { on: function(v){ of.dist = v; keep(); } }));
        og.appendChild(fld("Province", of.prov, { on: function(v){ of.prov = v; keep(); } }));
        og.appendChild(fld("Postcode", of.zip, { mode: "numeric", max: 5, on: function(v, inp){ inp.value = v.replace(/\D/g, ""); of.zip = inp.value; keep(); } }));
        og.appendChild(fld("Premises owner", r.owner, { wide: 1, ph: "Name of the owner or landlord", on: function(v){ r.owner = v; keep(); } }));
        og.appendChild(fld("Applicant (must be a founder and a director)", r.applicant, { options: who, on: function(v){ r.applicant = v; keep(); } }));
        og.appendChild(fld("Chair of the first meeting", r.chair, { options: who, on: function(v){ r.chair = v; keep(); } }));
        og.appendChild(fld("First meeting date", r.meeting, { type: "date", maxDate: today(), on: function(v){ r.meeting = v; keep(); } }));
        b.appendChild(og);
        var sr = el("div", "frow"); sr.appendChild(el("b", "", "Who can sign for the company")); sr.appendChild(seg(["Any one director", "Two directors jointly", "Named directors"], r.signing, function(v){ r.signing = v; redo(); })); b.appendChild(sr);
        if (r.signing === "Named directors"){
          var dc = el("div", "chips"), dirs = r.people.filter(function(p){ return p.roles.d; });
          if (!dirs.length) b.appendChild(el("p", "st-p", "Add a director in People first."));
          dirs.forEach(function(p){ var x = el("button", "", pname(p)); x.type = "button"; x.setAttribute("aria-pressed", String(r.signers.indexOf(p.id) >= 0)); x.addEventListener("click", function(){ var i = r.signers.indexOf(p.id); if (i >= 0) r.signers.splice(i, 1); else r.signers.push(p.id); redo(); }); dc.appendChild(x); });
          b.appendChild(dc);
        }
        var sl = el("div", "frow"); sl.appendChild(el("b", "", "Company seal")); sl.appendChild(seg(["Yes", "No"], r.seal, function(v){ r.seal = v; keep(); })); b.appendChild(sl);
        b.appendChild(el("p", "st-p", "Auditor: ThuraGirl appoints a licensed auditor for you. Nothing to fill in here."));
      } else {
        b.appendChild(el("p", "st-p", "One PDF or image each, up to 10 MB. The list follows the people and capital you entered."));
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
$$("#app .js-invoice").forEach(function(b){ b.addEventListener("click", function(){ newInvoice(); }); });
$$("#app .js-pay").forEach(function(b){ b.addEventListener("click", function(){ newBill(); }); });
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
function tasks(u){
  var B = books(u), t = today(), out = [];
  if (!B) return out;
  (u.requests || []).filter(function(r){ return !r.file; }).forEach(function(r){
    out.push({ k: "req:" + r.id, ic: "i-doc", t: "Your accountant asked for a document", m: r.doc, late: { txt: "Requested " + ago(r.at, true), cls: "warn" }, btn: "Upload", rank: 1,
      fn: function(){ openKyc(r.form, r.doc + ". One PDF or image, up to 10 MB.", function(meta){ r.file = meta; r.done = Date.now(); save(); refresh(); toast("Sent to your accountant"); }); },
      story: { h: "Your accountant needs one more document", p: r.doc + ", for " + r.form + "." } });
  });
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
      out.push({ k: "rc:" + txid(x), ic: "i-receipt", t: "Missing receipt", m: x.t + ", " + nice(x.d), amt: -x.a, late: { txt: "Left your account on " + nice(x.d), cls: "" }, btn: "Upload", rank: 5,
        fn: function(){ openKyc("Receipt", x.t + " · " + baht(-x.a) + ". A photo or PDF of the receipt or tax invoice.", function(meta){ u.rcpt = u.rcpt || {}; u.rcpt[txid(x)] = meta; save(); refresh(); toast("Receipt filed"); }); },
        story: { h: "A receipt is missing", p: baht(-x.a) + " to " + x.t + " on " + nice(x.d) + ". Snap the receipt and I file it." } });
    });
  (u.banks || []).filter(function(b){ return Date.now() - b.at > 7 * 864e5; }).forEach(function(b){
    out.push({ k: "bk:" + b.bank + b.acct, ic: "i-up", t: b.bank + " statement is getting old", m: "Last uploaded " + ago(b.at, true), late: { txt: "Uploaded " + ago(b.at, true), cls: "warn" }, btn: "Upload", rank: 6, fn: function(){ openUpload(b); } });
  });
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
    d.appendChild(el("em", "", x[3] == null && x[0] !== ".mini.t3" ? "this month" : x[4]));
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

/* ── morning brief ── */
function renderBrief(){
  var u = me(), B = books(u), pg = $("#b-brief"); if (!B) return;
  $$("#b-brief > :not(.emptyP)").forEach(function(n){ n.remove(); });
  var now = new Date(), T = tasks(u), p = B.pack, F = B.fin.mtd, mName = MONTH[day(B.asOf).getMonth()];
  var stories = [];
  if (p && !u.done["rev:" + p.key]) stories.push({ h: "Your " + p.name + " books are ready to sign off", p: "It is all on one page: " + baht(p.inc) + " in, " + baht(p.exp) + " out, " + baht(p.kept) + " kept. Tick the box and I lock the month.", btn: "Review", acc: 1, fn: openSheet });
  T.filter(function(x){ return x.story && x.rank <= 2; }).forEach(function(x){ stories.push({ h: x.story.h, p: x.story.p, btn: x.btn, fn: x.fn }); });
  var top = stories.slice(0, 3), rest = T.filter(function(x){ return !top.some(function(s){ return s.fn === x.fn; }); });
  var mast = el("div", "br-mast"); mast.appendChild(el("b", "", "The Morning Brief")); mast.appendChild(el("span", "", now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))); mast.appendChild(el("span", "br-rt", "1 min read")); pg.appendChild(mast);
  var hd = el("header", "br-head"), h1 = el("h1"); h1.id = "br-h1";
  h1.appendChild(el("span", "l1", B.cashD == null ? "Cash is " + baht(B.cash) + "." : "Cash is " + (B.cashD >= 0 ? "up " : "down ") + pctTxt(B.cashD) + "."));
  if (top.length){ h1.appendChild(el("em", "", ["", "One thing", "Two things", "Three things"][top.length])); h1.appendChild(document.createTextNode(" need" + (top.length === 1 ? "s" : "") + " your yes.")); }
  else h1.appendChild(el("em", "", "Nothing needs you today."));
  hd.appendChild(h1);
  var names = u.banks.map(function(b){ return b.bank; }).filter(function(v, i, a){ return a.indexOf(v) === i; });
  var lede = el("p", "br-lede"); lede.innerHTML = "Good morning, " + esc(first(u)) + ". You have <b class=\"num\">" + baht(B.cash) + "</b> " + (names.length ? "across " + esc(names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]) : "in the bank") + ". " +
    esc(mName) + " has brought in <b class=\"num\">" + baht(F.rev) + "</b> so far, and you have " + (F.rev >= F.exp ? "kept <b class=\"num\">" + baht(F.rev - F.exp) + "</b> of it." : "spent <b class=\"num\">" + baht(F.exp - F.rev) + "</b> more than came in.");
  hd.appendChild(lede); var by = el("div", "br-by"); by.appendChild(el("span", "", "By ThuraGirl, your bookkeeper")); hd.appendChild(by); pg.appendChild(hd);
  var grid = el("div", "br-grid"), main = el("div", "br-main"), side = el("aside", "br-side");
  main.appendChild(el("div", "br-sec", top.length ? "Needs your yes" : "All clear"));
  if (!top.length) main.appendChild(el("p", "br-calm", "Nothing is late and nothing needs signing. I will tell you here when something does."));
  top.forEach(function(s, i){
    var a = el("article", "story"); a.appendChild(el("span", "no", String(i + 1))); a.appendChild(el("h3", "", s.h)); a.appendChild(el("p", "todo", s.p));
    a.appendChild(btn("pill " + (s.acc ? "acc" : "soft act"), s.btn, s.fn)); main.appendChild(a);
  });
  if (rest.length){ main.appendChild(el("div", "br-sec br-gap", "Can wait")); rest.slice(0, 4).forEach(function(x){ var r = el("div", "row"), rt = el("div", "rt"); rt.appendChild(el("div", "t", x.t)); rt.appendChild(el("div", "m", x.late.txt + (x.amt ? " · " + baht(x.amt) : ""))); r.appendChild(rt); r.appendChild(btn("pill soft act", x.btn, x.fn)); main.appendChild(r); }); }
  var old = u.banks.filter(function(b){ return isStale(b.at); })[0], br = el("div", "row"), brt = el("div", "rt");
  brt.appendChild(el("div", "t", old ? old.bank + " statement is getting old" : "Bank statements are up to date")); brt.appendChild(el("div", "m", u.banks.map(function(b){ return b.bank + " up to " + nice(b.to || B.asOf); }).join(" · ")));
  br.appendChild(brt); br.appendChild(btn("pill soft", "Update", function(){ openUpload(old || u.banks[0]); })); main.appendChild(br);
  side.appendChild(el("div", "br-sec", "Done for you"));
  var dn = el("ul", "br-done"), rc = Object.keys(u.rcpt || {}).length;
  [B.n + " bank lines read and sorted into " + Object.keys(F.cats).length + " categories this month", (u.matched || 0) + " payments matched to invoices and bills", rc + (rc === 1 ? " receipt" : " receipts") + " filed"].forEach(function(t){ var li = el("li"); li.innerHTML = '<svg class="i"><use href="#i-check"/></svg>'; li.appendChild(document.createTextNode(t)); dn.appendChild(li); });
  side.appendChild(dn);
  var lk = el("div", "br-sec br-gap br-lk"); lk.appendChild(el("span", "", mName + " so far")); var sm = btn("lnk", "See money", function(){ go("money"); }); sm.insertAdjacentHTML("beforeend", '<svg class="i"><use href="#i-chevr"/></svg>'); lk.appendChild(sm); side.appendChild(lk);
  var nums = el("ul", "br-nums");
  [["Money in", F.rev, F.dIn, true], ["Money out", F.exp, F.dOut, false], ["Kept", F.rev - F.exp, F.d, true]].forEach(function(x){ var li = el("li"); li.appendChild(el("span", "", x[0])); li.appendChild(el("b", "num", baht(x[1]))); li.appendChild(el("em", "num" + (x[2] != null && (x[2] >= 0) === x[3] ? " up" : ""), x[2] == null ? "" : (x[2] >= 0 ? "+" : "−") + pctTxt(x[2]))); nums.appendChild(li); });
  side.appendChild(nums);
  var up = (u.bills || []).filter(function(v){ return !v.paid && diffDays(v.due, today()) <= 14; }).sort(function(a, b){ return a.due < b.due ? -1 : 1; });
  if (up.length){
    side.appendChild(el("div", "br-sec br-gap", "Coming up")); var ul = el("ul", "br-nums br-up");
    up.slice(0, 4).forEach(function(v){ var li = el("li"), s = el("span", "", v.to); s.appendChild(el("small", v.due < today() ? "bad" : "", lateTxt(v.due))); li.appendChild(s); li.appendChild(el("b", "num", baht(v.amount))); ul.appendChild(li); });
    side.appendChild(ul);
  }
  grid.appendChild(main); grid.appendChild(side); pg.appendChild(grid);
  pg.appendChild(el("p", "br-end", "That is everything for today. Ask me anything below."));
}

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
  g.appendChild(fld("Due", d.due, { type: "date", on: function(v){ d.due = v; } }));
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
function chatFile(f){
  var ext = (f.name.split(".").pop() || "").toLowerCase();
  if (["csv", "xlsx", "xls"].indexOf(ext) >= 0){ openUpload(); takeFile(f); return; }
  if (f.size > MAX){ say(f.name, "That file is " + size(f.size) + ". The limit is 10 MB."); return; }
  if (!(/^image\//.test(f.type) || ext === "pdf")){ say(f.name, "I can take bank statements (CSV or Excel) and receipts (photo or PDF). That file type doesn't work here."); return; }
  if (!me().hasData){ say(f.name, "Thanks. Upload a bank statement first, and I can match receipts like this one to your payments."); return; }
  say(f.name, fileReceipt(f));
}

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

/* ── start ── */
buildSpark();
route();
})();
