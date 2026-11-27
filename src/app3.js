
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
$$("#app .js-pay").forEach(function(b){ b.addEventListener("click", function(){ payPick(); }); });
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
  var open1 = ["#up-sheet", "#b-setup", "#b-sheet"].some(function(s){ return !$(s).hidden; }); ["#up-sheet", "#b-setup", "#b-sheet"].forEach(function(s){ $(s).hidden = true; });
  if (!open1 && !$("#b-pop").hidden) $("#b-popx").click();
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
  var mic = $('#b-chat [aria-label="Speak"]'); mic.id = "b-mic"; mic.setAttribute("aria-pressed", "false"); mic.addEventListener("click", micToggle);
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) mic.hidden = true;
  var plus = $('#b-chat [aria-label="Upload a file"]'), fi = el("input"); fi.type = "file"; fi.hidden = true; fi.accept = ".csv,.xlsx,.xls,.pdf,text/csv,text/comma-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,image/*,.heic,.heif"; fi.id = "b-chatfile";
  plus.setAttribute("aria-label", "Add a statement or receipt"); plus.title = "Add a statement or receipt";
  $("#b-chat").appendChild(fi); plus.addEventListener("click", function(){ fi.click(); });
  fi.addEventListener("change", function(){ var f = fi.files && fi.files[0]; fi.value = ""; if (f) chatFile(f); });
})();

