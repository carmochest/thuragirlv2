/* ── get started: keep nudging new users to sync, because syncing is what fills the app ── */
var BOOKS_K = ["flow", "peak", "tgbooks"], SALES_K = ["loyverse", "ocha", "foodstory", "wongnai", "grab", "lineman", "shopee", "lazada", "tiktok"];
function syncSteps(u){
  var c = u.setup.conn || {}, has = function(ks){ return ks.some(function(k){ return !!c[k]; }); };
  return [
    { k: "bank", on: !!(u.banks || []).length, ic: "i-pay", t: L("Connect your bank", "เชื่อมต่อบัญชีธนาคาร"), m: L("Your cash, money in and out", "เงินสด เงินเข้าและออก"), b: L("Connect", "เชื่อมต่อ"), fn: function(){ openUpload(); } },
    { k: "books", on: has(BOOKS_K), ic: "i-doc", t: L("Sync your books", "ซิงก์บัญชี"), m: L("Your accounting app, or let ThuraGirl keep them", "โปรแกรมบัญชีของคุณ หรือให้ ThuraGirl ทำให้"), b: L("Choose", "เลือก"), fn: function(){ openConnect(false); } },
    { k: "sales", on: has(SALES_K), ic: "i-receipt", t: L("Add your sales apps", "เพิ่มแอปขาย"), m: L("POS and delivery. Optional", "POS และเดลิเวอรี ไม่บังคับ"), b: L("Add", "เพิ่ม"), fn: function(){ openConnect(false); } }
  ];
}
function syncDone(u){ var s = syncSteps(u); return s[0].on && s[1].on; }
function syncCard(u){
  var S = syncSteps(u), n = S.filter(function(x){ return x.on; }).length, c = el("section", "gsB"); c.setAttribute("data-noi18n", "");
  var old = Date.now() - (u.created || Date.now()) > 864e5;
  var h = el("div", "gsB-h"), tx = el("div", "tx");
  tx.appendChild(el("span", "gsB-k", (old ? L("Reminder", "เตือนความจำ") + " · " : "") + L("Get started · " + n + " of 3", "เริ่มต้นใช้งาน · " + n + " จาก 3")));
  tx.appendChild(el("b", "", S[0].on ? L("Now sync your books", "ต่อไป ซิงก์บัญชี") : L("Connect your bank to get started", "เชื่อมต่อธนาคารเพื่อเริ่มต้น")));
  tx.appendChild(el("span", "gsB-m", L("Syncing is what fills your dashboard, brief and tax forms.", "การซิงก์ทำให้แดชบอร์ด สรุปเช้า และแบบภาษีมีข้อมูล")));
  h.appendChild(tx); c.appendChild(h);
  var bar = el("div", "gsB-bar"), fill = el("i"); fill.style.width = Math.round(n / 3 * 100) + "%"; bar.appendChild(fill); c.appendChild(bar);
  var ul = el("div", "gsB-l");
  S.forEach(function(x, i){
    var r = el("div", "gsB-r" + (x.on ? " on" : ""));
    r.innerHTML = '<i class="gsB-n">' + (x.on ? '<svg class="i"><use href="#i-check"/></svg>' : '<svg class="i"><use href="#' + x.ic + '"/></svg>') + "</i>";
    var t = el("div", "tx"); t.appendChild(el("b", "", x.t)); t.appendChild(el("span", "", x.on ? L("Done", "เรียบร้อย") : x.m)); r.appendChild(t);
    if (!x.on) r.appendChild(btn("pill " + (i === S.indexOf(S.filter(function(y){ return !y.on; })[0]) ? "acc" : "soft") + " act", x.b, x.fn));
    ul.appendChild(r);
  });
  c.appendChild(ul);
  return c;
}
function paintSync(u){
  u = u || me(); if (!u) return;
  $$(".gsB").forEach(function(n){ n.remove(); });
  if (gated(u) || syncDone(u)) return;
  var home = $("#b-home"), wel = $("#b-wel");
  if (home) home.insertBefore(syncCard(u), wel ? wel.nextSibling : home.firstChild);
  ["#b-brief", "#b-money"].forEach(function(id){
    var pg = $(id); if (!pg) return;
    var ep = $(".emptyP", pg);
    // no data yet: the card sits inside the empty state, under its line, in place of the upload button
    if (!u.hasData && ep){ var pp = $("p", ep); ep.insertBefore(syncCard(u), pp ? pp.nextSibling : ep.firstChild); $$(".js-upload", ep).forEach(function(x){ x.hidden = true; }); }
    else pg.insertBefore(syncCard(u), pg.firstChild);
  });
  // a gentle reminder, once a day, from the day after sign-up
  var dk = iso(new Date());
  if (Date.now() - (u.created || Date.now()) > 864e5 && u.syncNag !== dk){ u.syncNag = dk; save(); setTimeout(function(){ toast(L("Reminder: connect your bank and I can start on your books.", "เตือนความจำ: เชื่อมต่อธนาคาร แล้วหนูจะเริ่มทำบัญชีให้")); }, 1200); }
}
