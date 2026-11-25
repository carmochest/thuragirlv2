
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
