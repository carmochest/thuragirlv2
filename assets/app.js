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
  if (tab === "money") renderMoney();
  if (tab === "brief") syncBrief();
  if (tab === "settings") renderSettings();
  if (tab === "register") renderRegister();
  var chips = tab === "money" ? ["Who owes me money?", "Where did the money go?", "Show the full P&L"] : ["What's overdue?", "How was April?", "How's my cash?"];
  $$("#b-sug button").forEach(function(b, i){ b.textContent = chips[i]; });
  var key = db.session + ":" + tab + ":" + (u.hasData ? 1 : 0);
  if (key !== lastKey){ closeAll(); play(); window.scrollTo(0, 0); }
  lastKey = key;
}
function play(){
  var u = me(), pg = $("#b-" + tab);
  if (!calm){ pg.classList.remove("in"); void pg.offsetWidth; pg.classList.add("in"); }
  if (!u.hasData) return;
  if (tab === "money") countUp($("#m-val"), FIN[per].rev - FIN[per].exp, 700);
  if (tab === "home"){ restDay(); countUp($("#b-val"), TOTAL, 900); }
}

/* ── home: cash line ── */
var CASH = [1731500,1738200,1744900,1741300,1752600,1761000,1757400,1722800,1729500,1741100,1750700,1763900,1771200,1768000,1779400,
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
  $("#b-dtxt").textContent = ago === 0 ? "Today" : ago === 1 ? "Yesterday" : ago + " days ago";
  $("#b-delta").classList.add("scrub"); $("#b-spark").classList.add("on"); mark(i);
}
function restDay(){ $("#b-val").textContent = money(TOTAL); $("#b-dtxt").textContent = "6.4% this month"; $("#b-delta").classList.remove("scrub"); $("#b-spark").classList.remove("on"); mark(N - 1); }
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
    meta.appendChild(el("span", "syn" + (isStale(b.at) ? " stale" : ""), "Synced " + ago(b.at, true))); row.appendChild(meta);
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
  $("#b-reset").hidden = !u.hasData;
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
  $$(".needB .tk[data-k]").forEach(function(n){
    n.classList.remove("gone", "going"); n.style.height = ""; n.hidden = !!u.done[n.getAttribute("data-k")];
    var b = $(".act", n); if (b){ b.classList.remove("ok"); b.textContent = b.getAttribute("data-label"); }
  });
  paintSetup(); paintBanks(); setCount();
}
function openSetupTask(){ var u = me(); if (u.path === "new") go("register"); else openSetup(); }

/* ── review pack ── */
function openSheet(){ var s = $("#b-sheet"); $("#b-agree").checked = false; $("#b-approve").disabled = true; s.hidden = false; try { $("#b-shx").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {} }
function closeSheet(){ $("#b-sheet").hidden = true; }

/* ── upload a bank statement ── */
var BANKS = ["K-Bank", "SCB", "Bangkok Bank", "Krungsri", "Krungthai", "ttb", "Other"], up = { file: null, bank: "", acct: "", err: "" };
function readCsv(text){
  var rows = text.split(/\r?\n/).filter(function(l){ return l.trim(); }), out = { rows: Math.max(0, rows.length - 1), bal: NaN };
  if (rows.length > 1){ var h = rows[0].toLowerCase().split(","), bi = h.indexOf("balance"), di = h.indexOf("date"), best = "";
    if (bi >= 0) rows.slice(1).forEach(function(r){ var c = r.split(","), d = di >= 0 ? c[di] : ""; if (d >= best){ best = d; out.bal = num(c[bi]); } }); }
  return out;
}
function takeFile(f){
  up.err = "";
  var ext = (f.name.split(".").pop() || "").toLowerCase();
  if (["csv", "xlsx", "xls", "pdf"].indexOf(ext) < 0) up.err = "That file type doesn't work here. Use CSV, Excel or PDF.";
  else if (f.size > MAX) up.err = "That file is " + size(f.size) + ". The limit is 10 MB.";
  if (up.err){ up.file = null; renderUpload(); return; }
  up.file = { name: f.name, size: f.size, rows: 0, bal: NaN }; renderUpload();
  if (ext === "csv" && window.FileReader){ var fr = new FileReader(); fr.onload = function(){ var r = readCsv(String(fr.result)); if (up.file){ up.file.rows = r.rows; up.file.bal = r.bal; renderUpload(); } }; fr.readAsText(f); }
}
function renderUpload(){
  var body = $("#up-body"); body.textContent = "";
  var drop = el("button", "drop" + (up.file ? " has" : "")); drop.type = "button";
  if (up.file){
    var extra = up.file.rows ? up.file.rows + " transactions" + (isFinite(up.file.bal) ? ", latest balance " + baht(up.file.bal) : "") : size(up.file.size);
    drop.innerHTML = '<svg class="i"><use href="#i-doc"/></svg>'; drop.appendChild(el("span", "", up.file.name)); drop.appendChild(el("small", "", extra + " · tap to change"));
  } else { drop.innerHTML = '<svg class="i"><use href="#i-up"/></svg><span>Choose a file or drop it here</span><small>CSV, Excel or PDF, up to 10 MB</small>'; }
  drop.addEventListener("click", function(){ $("#up-file").click(); });
  drop.addEventListener("dragover", function(ev){ ev.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", function(){ drop.classList.remove("over"); });
  drop.addEventListener("drop", function(ev){ ev.preventDefault(); var f = ev.dataTransfer && ev.dataTransfer.files[0]; if (f) takeFile(f); });
  body.appendChild(drop);
  var g = el("div", "fgrid"), okBtn;
  var sync = function(){ if (okBtn) okBtn.disabled = !(up.file && up.bank && /^\d{4,15}$/.test(up.acct)); };
  g.appendChild(fld("Bank", up.bank, { options: [["", "Choose a bank"]].concat(BANKS.map(function(b){ return [b, b]; })), on: function(v){ up.bank = v; sync(); } }));
  g.appendChild(fld("Account number", up.acct, { mode: "numeric", max: 15, ph: "Digits only", on: function(v, inp){ inp.value = v.replace(/\D/g, ""); up.acct = inp.value; sync(); return up.acct && up.acct.length < 4 ? "At least the last 4 digits" : ""; } }));
  body.appendChild(g);
  var er = el("div", "ferrB", up.err); body.appendChild(er);
  var f = el("div", "shB-f"), samp = el("button", "pill soft", "Use the sample"); samp.type = "button";
  samp.addEventListener("click", function(){
    up = { file: { name: "sample-kbank-statement.csv", size: 612, rows: 8, bal: 1842300 }, bank: "K-Bank", acct: "0483511234", err: "" }; renderUpload();
    try { fetch("../assets/sample-kbank-statement.csv").then(function(r){ return r.ok ? r.text() : ""; }).then(function(t){ if (t && up.file && up.file.name === "sample-kbank-statement.csv"){ var r = readCsv(t); up.file.rows = r.rows; up.file.bal = r.bal; up.file.size = t.length; renderUpload(); } }).catch(function(){}); } catch (e) {}
  });
  okBtn = el("button", "pill acc", "Upload"); okBtn.type = "button";
  okBtn.addEventListener("click", function(){
    var u = me(), ex = u.banks.filter(function(b){ return b.bank === up.bank && b.acct === up.acct; })[0];
    if (ex) ex.at = Date.now(); else u.banks.push({ bank: up.bank, acct: up.acct, at: Date.now() });
    u.stmt = { name: up.file.name, rows: up.file.rows }; u.hasData = true; save();
    var msg = "Statement added" + (up.file.rows ? ". " + up.file.rows + " transactions read." : ".");
    $("#up-sheet").hidden = true; up = { file: null, bank: "", acct: "", err: "" }; lastKey = ""; if (tab !== "home") go(""); else showTab(); toast(msg);
  });
  f.appendChild(samp); f.appendChild(okBtn); body.appendChild(f); sync();
}
function openUpload(b){
  up = { file: null, bank: b ? b.bank : "", acct: b ? b.acct : "", err: "" }; renderUpload();
  var s = $("#up-sheet"); s.hidden = false; try { $("#up-x").focus({ preventScroll: true }); $(".shB-card", s).scrollIntoView({ block: "nearest" }); } catch (e) {}
}

/* ── money ── */
var FIN = {
  mtd: { lab: "Profit this month", vs: "vs last month", d: 38.4, rev: 854200, exp: 612400, flow: [["Wk 1",192000,148000],["Wk 2",216000,162000],["Wk 3",224000,158000],["Wk 4",222200,144400]],
    revMix: [["Dine-in",524000],["Delivery",198000],["Catering",132200]], expMix: [["Ingredients",248000],["Wages",212000],["Rent",72000],["Utilities",38400],["Marketing",22000],["Other",20000]], tax: [24850,2550,48360] },
  qtd: { lab: "Profit this quarter", vs: "vs last quarter", d: 22.4, rev: 2412800, exp: 1818200, flow: [["Mar",742000,568000],["Apr",816600,637800],["May",854200,612400]],
    revMix: [["Dine-in",1488000],["Delivery",562000],["Catering",362800]], expMix: [["Ingredients",720000],["Wages",612000],["Rent",216000],["Utilities",112000],["Marketing",68000],["Other",90200]], tax: [68420,7240,118920] },
  ytd: { lab: "Profit this year", vs: "vs last year", d: 42.6, rev: 4128400, exp: 3094200, flow: [["Jan",612000,478000],["Feb",691800,522400],["Mar",742000,568000],["Apr",816600,637800],["May",854200,612400]],
    revMix: [["Dine-in",2548000],["Delivery",962000],["Catering",618400]], expMix: [["Ingredients",1224000],["Wages",1042000],["Rent",360000],["Utilities",188000],["Marketing",112000],["Other",168200]], tax: [112400,14820,206840] }
}, per = "mtd";
function tickL(n){ return n === 0 ? "0" : n >= 1e6 ? (n / 1e6) + "M" : (n / 1e3) + "K"; }
function niceStep(max){ var pow = Math.pow(10, Math.floor(Math.log(max) / Math.LN10)), c = [1, 2, 5, 10]; for (var i = 0; i < c.length; i++) if (max / (c[i] * pow) <= 4) return c[i] * pow; return 10 * pow; }
function mix(root, rows, cls){
  root.textContent = ""; var total = rows.reduce(function(a, r){ return a + r[1]; }, 0), top = Math.max.apply(null, rows.map(function(r){ return r[1]; }));
  rows.forEach(function(r){ var d = el("div", "mx"); d.appendChild(el("span", "mx-n", r[0])); d.appendChild(el("span", "mx-v num", baht(r[1]))); d.appendChild(el("span", "mx-p num", Math.round(r[1] / total * 100) + "%")); var bar = el("i", "mx-b" + cls); bar.style.width = (r[1] / top * 100) + "%"; d.appendChild(bar); root.appendChild(d); });
}
function renderMoney(){
  var F = FIN[per], profit = F.rev - F.exp;
  $("#m-lab").textContent = F.lab; $("#m-val").textContent = money(profit); $("#m-dtxt").textContent = F.d + "% " + F.vs; $("#m-mg").textContent = (profit / F.rev * 100).toFixed(1) + "% margin";
  $("#m-in").textContent = baht(F.rev); $("#m-out").textContent = baht(F.exp);
  var top = Math.max.apply(null, F.flow.map(function(r){ return Math.max(r[1], r[2]); })), step = niceStep(top), max = Math.ceil(top / step) * step;
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
  $("#m-vat").textContent = baht(F.tax[0]); $("#m-wht").textContent = baht(F.tax[1]); $("#m-corp").textContent = baht(F.tax[2]); $("#m-tax").textContent = baht(F.tax[0] + F.tax[1] + F.tax[2]);
}

/* ── morning brief ── */
var BK = { rev: "rev", "0": "t0", "1": "t1", "2": "t2", "3": "t3" };
function syncBrief(){
  var u = me(), open = 0;
  $$("#b-brief [data-act]").forEach(function(b){
    var d = !!u.done[BK[b.getAttribute("data-act")]], item = b.parentNode;
    item.classList.toggle("done", d); b.classList.toggle("ok", d); b.innerHTML = d ? CHECK + b.getAttribute("data-ok") : b.getAttribute("data-label");
    if (!d && item.classList.contains("story")) open += 1;
  });
  var word = ["", "One thing needs", "Two things need", "Three things need"][open], h = $("#br-h1");
  h.textContent = ""; h.appendChild(el("span", "l1", "Cash is up 6.4%."));
  if (open){ var parts = word.split(" "), verb = parts.pop(); h.appendChild(el("em", "", parts.join(" "))); h.appendChild(document.createTextNode(" " + verb + " your yes.")); }
  else h.appendChild(el("em", "", "Nothing needs you today."));
  $("#br-name").textContent = first(u);
  var names = u.banks.map(function(b){ return b.bank; });
  $("#br-banks").textContent = names.length ? "across " + (names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names[0]) : "in the bank";
  var old = u.banks.filter(function(b){ return isStale(b.at); })[0];
  $("#br-bank-t").textContent = old ? old.bank + " statement is getting old" : "Bank statements are up to date";
  $("#br-bank-m").textContent = u.banks.map(function(b){ return b.bank + " synced " + ago(b.at, true); }).join(" · ");
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
  if (!r.auditor.name.trim() || !r.auditor.lic.trim() || !(num(r.auditor.fee) > 0)) o.office.push("Auditor name, licence number and fee");
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
        var ag = el("div", "fgrid");
        ag.appendChild(fld("Auditor name", r.auditor.name, { on: function(v){ r.auditor.name = v; keep(); } }));
        ag.appendChild(fld("Auditor licence number", r.auditor.lic, { on: function(v){ r.auditor.lic = v; keep(); } }));
        ag.appendChild(fld("Auditor fee", r.auditor.fee, { prefix: "฿", mode: "numeric", on: function(v, inp){ inp.value = v.replace(/[^\d.]/g, ""); r.auditor.fee = inp.value; keep(); } }));
        b.appendChild(ag);
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
$$("#app .js-soon").forEach(function(b){ b.addEventListener("click", function(){ toast("Invoices and payments are not part of this test build."); }); });
$$(".needB .act").forEach(function(b){
  b.setAttribute("data-label", b.textContent);
  b.addEventListener("click", function(){
    var row = b.parentNode, u = me(); if (b.classList.contains("ok")) return;
    b.classList.add("ok"); b.innerHTML = CHECK + "Done"; u.done[row.getAttribute("data-k")] = true; save(); row.classList.add("going"); setCount();
    setTimeout(function(){ collapse(row); }, calm ? 0 : 650);
  });
});
$("#b-reset").addEventListener("click", function(){ me().done = {}; save(); paintHome(); });
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
["#b-sheet", "#b-setup", "#up-sheet", "#kyc"].forEach(function(s){ var n = $(s); n.addEventListener("click", function(ev){ if (ev.target === n){ if (s === "#kyc") closeKyc(); else n.hidden = true; } }); });
document.addEventListener("keydown", function(ev){
  if (ev.key !== "Escape") return;
  if (!$("#kyc").hidden) return closeKyc();
  ["#up-sheet", "#b-setup", "#b-sheet"].forEach(function(s){ $(s).hidden = true; });
});
// review pack
$("#b-review").addEventListener("click", openSheet);
$("#b-shx").addEventListener("click", closeSheet);
$("#b-agree").addEventListener("change", function(){ $("#b-approve").disabled = !this.checked; });
$("#b-approve").addEventListener("click", function(){ var u = me(), row = $("#b-rev"); closeSheet(); u.done.rev = true; save(); row.classList.add("going"); setCount(); collapse(row); syncBrief(); });
$("#b-shask").addEventListener("click", function(){ closeSheet(); var i = $("#b-in"); i.value = "About the April pack: "; $("#b-send").disabled = false; try { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} });
// money
$$("#m-per button").forEach(function(b){ b.addEventListener("click", function(){ per = b.getAttribute("data-per"); $$("#m-per button").forEach(function(x){ var a = x === b; x.classList.toggle("on", a); x.setAttribute("aria-pressed", String(a)); }); renderMoney(); countUp($("#m-val"), FIN[per].rev - FIN[per].exp, 500); }); });
$$("#b-money .act").forEach(function(b){ b.addEventListener("click", function(){ if (b.classList.contains("ok")) return; b.classList.add("ok"); b.innerHTML = CHECK + b.getAttribute("data-ok"); }); });
// brief
$$("#b-brief [data-act]").forEach(function(b){
  b.addEventListener("click", function(){
    var k = b.getAttribute("data-act"), u = me(); if (u.done[BK[k]]) return;
    if (k === "rev") return openSheet();
    u.done[BK[k]] = true; save(); syncBrief();
  });
});
$("#br-bank").addEventListener("click", function(){ go(""); setTimeout(function(){ if ($("#b-bkbar").getAttribute("aria-expanded") !== "true") $("#b-bkbar").click(); }, 60); });
// chat
(function(){
  var inp = $("#b-in"), send = $("#b-send"), sug = $("#b-sug"), pop = $("#b-pop"), timer = 0;
  function answer(t){
    t = t.toLowerCase();
    if (!me().hasData) return "I don't have any numbers yet. Upload a bank statement and I can answer that.";
    if (/p&l|profit and loss|statement/.test(t)) return "This month so far: ฿854,200 came in. Ingredients ฿248,000, wages ฿212,000, rent ฿72,000 and ฿80,400 of other costs leave ฿241,800, a 28.3% margin. In the full app the statement opens here.";
    if (/who owes|owes me|owed|receiv/.test(t)) return "Four invoices are open, ฿322,700 in total. Two are late: Bangkok Hotel Group (฿88,500, 45 days) and Lotus Wholesale (฿64,200, 9 days). Tap Remind and I will chase them.";
    if (/where|spend|spent|expens|cost/.test(t)) return "Ingredients are the biggest cost this month at ฿248,000 (40%), then wages at ฿212,000 (35%) and rent at ฿72,000 (12%). Utilities, marketing and other add ฿80,400.";
    if (/overdue|late|unpaid|owe/.test(t)) return "Two things are overdue: invoice #INV-2026-038 (฿88,500, 45 days late) and the April tax package (฿14,200, 1 day). Approve them in the list and I will send the reminder and file the package.";
    if (/april|month|profit|pack|review/.test(t)) return "April closed with ฿816,600 in and ฿637,800 out. You kept ฿178,800, a 21.9% margin. The Review Pack has it all on one page.";
    if (/cash|bank|balance|money/.test(t)) return "Cash is ฿1,842,300, up 6.4% this month. Open the bank line under the balance to see when each account last synced.";
    return "This is a test build, so I can only answer the sample questions here. In the full app you can ask me anything about your books.";
  }
  function ask(t){
    t = (t || "").trim(); if (!t) return;
    inp.value = ""; send.disabled = true; sug.hidden = true; pop.hidden = false; $("#b-me").textContent = t;
    var r = $("#b-reply"); r.innerHTML = '<span class="dotsT" aria-label="ThuraGirl is typing"><i></i><i></i><i></i></span>';
    clearTimeout(timer); timer = setTimeout(function(){ r.textContent = answer(t); }, calm ? 0 : 800);
  }
  inp.addEventListener("focus", function(){ if (!inp.value && pop.hidden) sug.hidden = false; });
  inp.addEventListener("blur", function(){ setTimeout(function(){ sug.hidden = true; }, 150); });
  inp.addEventListener("input", function(){ send.disabled = !inp.value.trim(); sug.hidden = !!inp.value || !pop.hidden; });
  $$("button", sug).forEach(function(b){ b.addEventListener("mousedown", function(ev){ ev.preventDefault(); }); b.addEventListener("click", function(){ ask(b.textContent); }); });
  $("#b-chat").addEventListener("submit", function(ev){ ev.preventDefault(); ask(inp.value); });
  $("#b-popx").addEventListener("click", function(){ clearTimeout(timer); pop.hidden = true; });
  $("#m-pl").addEventListener("click", function(){ ask("Show the full P&L"); });
})();

buildSpark();
route();
})();
