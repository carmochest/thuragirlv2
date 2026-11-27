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
  ["Accounting", "Books you already keep", [["flow", "FA", "FlowAccount"], ["peak", "PK", "PEAK"]]],
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
        if (on) delete u.setup.conn[a[0]]; else { u.setup.conn[a[0]] = Date.now(); if (gi === 1) delete u.setup.conn.tgbooks; } save(); if (again) again(); var gsd = $("#gs"); if (gsd && !gsd.hidden) gsd.setAttribute("data-dirty", "1"); paintSync(u);
        if (!on) toast(a[2] + " connected (test). I start reading it once the live link is on.");
      });
      list.appendChild(b);
    });
    if (gi === 1){
      /* no accounting software: ThuraGirl keeps the books instead of syncing */
      var tgOn = !!u.setup.conn.tgbooks, tb = el("button", "app tgb" + (tgOn ? " on" : "")); tb.type = "button"; tb.setAttribute("aria-pressed", String(tgOn));
      tb.innerHTML = '<span class="ob-av ic"><svg class="i"><use href="#i-doc"/></svg></span>';
      var tt = el("span", "tx"); tt.appendChild(el("b", "", tgOn ? "ThuraGirl keeps your books" : "No accounting software?")); tt.appendChild(el("small", "", tgOn ? "Nothing to sync. I do it for you." : "Let ThuraGirl keep your books instead")); tb.appendChild(tt);
      if (tgOn) tb.insertAdjacentHTML("beforeend", '<svg class="i ck"><use href="#i-check"/></svg>');
      tb.addEventListener("click", function(){
        if (tgOn) delete u.setup.conn.tgbooks; else { u.setup.conn.tgbooks = Date.now(); ["flow", "peak"].forEach(function(k){ delete u.setup.conn[k]; }); }
        save(); if (again) again(); var gsd2 = $("#gs"); if (gsd2 && !gsd2.hidden) gsd2.setAttribute("data-dirty", "1"); paintSync(u);
        if (!tgOn) toast(L("Done. I keep your books, so there is nothing to sync.", "เรียบร้อย หนูดูแลบัญชีให้เอง ไม่ต้องเชื่อมต่อโปรแกรมใด"));
      });
      list.appendChild(tb);
    }
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
    var r = el("div", "ob-row tm"); r.appendChild(el("span", "ob-av", initials(p.name)));
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
  if (u.notif.ch === "LINE" || u.notif.ch === "Email" || u.notif.ch === "Both") u.notif.ch2 = u.notif.ch2 || u.notif.ch;
  var push = el("div", "nt-push"); push.innerHTML = '<i><svg class="i"><use href="#i-bell"/></svg></i>'; var pt = el("div", "tx"); pt.appendChild(el("b", "", "App notifications are always on")); pt.appendChild(el("span", "", "Everything below pops up on your phone first. Turn any of it off here.")); push.appendChild(pt); c.appendChild(push);
  var rows = el("div", "ob-rows");
  [["tax", "Tax filing reminders", "3 days and 1 day before every deadline"], ["pay", "Payroll approvals", "When the month's payroll is ready"], ["late", "Overdue invoices and bills", "One daily summary of what's late"], ["week", "Weekly money digest", "Monday morning: cash in, cash out, what to watch"]].forEach(function(x){
    rows.appendChild(qrow(x[1], x[2], ["On", "Off"], u.notif[x[0]] ? "On" : "Off", function(v){ u.notif[x[0]] = v === "On" ? 1 : 0; save(); }));
  });
  rows.appendChild(qrow("Also send a copy by", "On top of the app notification", ["LINE", "Email", "Both", "None"], u.notif.ch2 || "None", function(v){ u.notif.ch2 = v; u.notif.ch = v; save(); }));
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
  if (!host && anchor){ host = el("section", "card listB ctB"); host.id = "m-contacts"; host.setAttribute("aria-label", "Customers and suppliers"); anchor.parentNode.insertBefore(host, anchor.nextSibling); }
  if (!host) return;
  host.textContent = ""; host.classList.add("ctB");
  var C = {};
  function add(name, kind, amt, open, v){ var k = kind + ":" + name.trim().toLowerCase(); var c = C[k] = C[k] || { name: name.trim(), kind: kind, n: 0, total: 0, open: 0, docs: [] }; c.n++; c.total += amt; c.open += open; c.docs.push(v); }
  (u.invoices || []).forEach(function(v){ add(v.to, "Customer", invTotal(v), v.paid ? 0 : invTotal(v), v); });
  (u.bills || []).forEach(function(v){ add(v.to, "Supplier", v.amount, v.paid ? 0 : v.amount, v); });
  var list = Object.keys(C).map(function(k){ return C[k]; }), tab = u.ctab || "Customer";
  var nC = list.filter(function(c){ return c.kind === "Customer"; }).length, nS = list.length - nC, isOpen = !!u.cOpen;
  var hb = el("button", "ct-head"); hb.type = "button"; hb.setAttribute("aria-expanded", String(isOpen));
  var ht = el("div", "ct-ht"); ht.appendChild(el("h2", "", "Customers and suppliers"));
  ht.appendChild(el("div", "sub", nC + (nC === 1 ? " customer" : " customers") + " · " + nS + (nS === 1 ? " supplier" : " suppliers")));
  hb.appendChild(ht); hb.insertAdjacentHTML("beforeend", '<svg class="i ct-chev"><use href="#i-chev"/></svg>');
  hb.addEventListener("click", function(){ u.cOpen = !isOpen; save(); paintContacts(u); });
  host.appendChild(hb); host.classList.toggle("open", isOpen);
  if (!isOpen) return;
  var ch = el("div", "chips lpad");
  [["Customer", "Customers", nC], ["Supplier", "Suppliers", nS]].forEach(function(k){ var x = el("button", "", k[1] + " " + k[2]); x.type = "button"; x.setAttribute("aria-pressed", String(tab === k[0])); x.addEventListener("click", function(){ u.ctab = k[0]; save(); paintContacts(u); }); ch.appendChild(x); });
  host.appendChild(ch);
  var rows = list.filter(function(c){ return c.kind === tab; }).sort(function(a, b){ return b.total - a.total; });
  if (!rows.length) host.appendChild(el("p", "st-p lpad", tab === "Customer" ? "Customers appear here when you make an invoice." : "Suppliers appear here when you add a bill."));
  var fk = "fold:c" + tab, open = !!FOLD[fk], cut = 5, needle = (CQ[tab] || "").trim().toLowerCase();
  if (rows.length > cut){
    var q = el("input", "csearch"); q.type = "search"; q.placeholder = tab === "Customer" ? "Find a customer" : "Find a supplier"; q.setAttribute("aria-label", q.placeholder); q.value = CQ[tab] || "";
    q.addEventListener("input", function(){ CQ[tab] = q.value; var pos = q.selectionStart; paintContacts(u); var n = $("#m-contacts .csearch"); if (n){ n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} } });
    var qw = el("div", "lpad"); qw.appendChild(q); host.appendChild(qw);
    if (needle){ rows = rows.filter(function(c){ return c.name.toLowerCase().indexOf(needle) >= 0; }); open = true; if (!rows.length) host.appendChild(el("p", "st-p lpad", "No one by that name yet.")); }
  }
  var all = rows.length;
  if (!open) rows = rows.slice(0, cut);
  rows.forEach(function(c){
    var r = el("div", "row"), rt = el("button", "rt rtb"); rt.type = "button"; rt.addEventListener("click", function(){ openContact(c); });
    rt.appendChild(el("div", "t", c.name));
    rt.appendChild(el("div", "m", c.n + (tab === "Customer" ? (c.n === 1 ? " invoice" : " invoices") : (c.n === 1 ? " bill" : " bills")) + (c.open ? " · " + baht(c.open) + " open" : " · all settled")));
    r.appendChild(rt); r.appendChild(el("span", "amt num", baht(c.total))); host.appendChild(r);
  });
  if (all > cut && !needle) host.appendChild(foldBtn(open, all, function(){ FOLD[fk] = !open; paintContacts(u); }));
}
function openContact(c){
  var cust = c.kind === "Customer", b = openGS(cust ? "Customer" : "Supplier", c.name, c.n + (cust ? (c.n === 1 ? " invoice" : " invoices") : (c.n === 1 ? " bill" : " bills")) + " · " + baht(c.total) + " in total");
  var n = el("dl", "shB-n"); [["Total", c.total], ["Open", c.open], ["Settled", c.total - c.open]].forEach(function(x){ var w = el("div"); w.appendChild(el("dt", "", x[0])); w.appendChild(el("dd", "num", baht(x[1]))); n.appendChild(w); }); b.appendChild(n);
  var rows = el("div", "ob-rows");
  c.docs.slice().sort(function(a, z){ return (a.due || "") < (z.due || "") ? 1 : -1; }).forEach(function(v){
    var amt = cust ? invTotal(v) : v.amount, r = el("div", "docrow"), tx = el("div", "tx");
    tx.appendChild(el("b", "", cust ? "Invoice " + v.id : (v.note || "Bill")));
    tx.appendChild(el("span", v.paid ? "" : v.due < today() ? "bad" : "", v.paid ? "Paid " + niceY(v.paid) : lateTxt(v.due)));
    r.appendChild(tx); r.appendChild(el("b", "num", baht(amt)));
    r.appendChild(btn("pill soft act", "View", function(){ if (cust) openInvoice(v); else openBill(v); }));
    rows.appendChild(r);
  });
  b.appendChild(rows);
  b.appendChild(foot(btn("pill soft", "Close", closeGS), btn("pill acc", cust ? "New invoice" : "New bill", function(){ closeGS(); if (cust) startInvoiceFlow(); else startPayFlow(); })));
}
var CQ = {};
