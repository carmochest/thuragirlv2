/* ── the brief through the day: fresh each morning, tucks into Home once read, turns into "Today so far" and then a "Day wrap", and resets overnight ── */
function briefHour(){ var m = location.search.match(/[?&]hour=(\d{1,2})/); return m ? +m[1] : new Date().getHours(); }
function briefPhase(){ var h = briefHour(); return h < 12 ? "morning" : h < 17 ? "midday" : "evening"; }
function briefName(ph){ return ph === "morning" ? L("The Morning Brief", "สรุปยามเช้า") : ph === "midday" ? L("Today so far", "วันนี้ถึงตอนนี้") : L("Day wrap", "สรุปท้ายวัน"); }
/* today's brief record. On a new day yesterday's is filed under Past briefs (last 14 kept) and a fresh one starts unread */
function briefDay(u){
  var d = today(), b = u.brief;
  if (!b || b.day !== d){
    if (b && b.sum){ u.briefs = [b].concat((u.briefs || []).filter(function(x){ return x.day !== b.day; })).slice(0, 14); }
    b = u.brief = { day: d, seen: 0, keys: null, sum: null };
    save();
  }
  return b;
}
function briefSeenToday(u){ var b = u.brief; return !!(b && b.day === today() && b.seen); }
/* first look of the day fixes the morning list; later views count what got done since */
function briefProgress(u, top){
  var b = briefDay(u);
  if (!b.keys){ b.keys = top.map(function(t){ return t.k; }); b.heads = {}; top.forEach(function(t){ b.heads[t.k] = t.h; }); save(); }
  return briefLive(u);
}
/* progress against this morning's list, worked out live so the Home strip is right without reopening the brief */
function briefLive(u){
  var b = briefDay(u); if (!b.keys) return null;
  var TK = tasks(u), B = books(u), p = B && B.pack;
  function isDone(k){ return k === "rev" ? !!(p && u.done["rev:" + p.key]) || !p : !TK.some(function(x){ return x.k === k; }); }
  var items = b.keys.map(function(k){ return { h: (b.heads || {})[k] || "", d: isDone(k) }; }).filter(function(x){ return x.h; });
  var done = b.keys.filter(isDone).length;
  return { done: done, total: b.keys.length, left: b.keys.length - done, items: items };
}
function briefSave(u, sum){ var b = briefDay(u); b.sum = sum; save(); }

/* the slim strip on Home: an invitation before it's read, the day's numbers after */
function briefStrip(u){
  var home = $("#b-home"), s = $("#b-tbrief"); if (!home) return;
  var B = u.hasData && books(u); if (!B || gated(u)){ if (s) s.remove(); return; }
  var b = briefDay(u), ph = briefPhase(), seen = !!b.seen, sum = briefLive(u) || b.sum || {};
  /* once everything on today's list is done, the strip says so once and then leaves Home. The Brief button still opens it */
  var allDone = seen && (!sum.total || !sum.left);
  if (allDone && b.doneShown){ if (s) s.remove(); return; }
  if (!s){ s = el("button", "tbrief"); s.type = "button"; s.id = "b-tbrief"; s.addEventListener("click", function(){ go("brief"); }); var w = $("#b-wel"); w.parentNode.insertBefore(s, w.nextSibling); }
  s.setAttribute("data-noi18n", ""); s.classList.toggle("fresh", !seen); s.textContent = "";
  var now = new Date(), th = lang() === "th";
  var dt = el("span", "tb-dt"); dt.appendChild(el("small", "", th ? now.toLocaleDateString("th-TH", { weekday: "short" }) : now.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase())); dt.appendChild(el("b", "num", String(now.getDate()))); s.appendChild(dt);
  var tx = el("span", "tb-tx");
  if (allDone){
    s.classList.add("alldone");
    tx.appendChild(el("b", "", sum.total ? L("All done for today", "วันนี้เรียบร้อยหมดแล้ว") : L("Nothing needs you today", "วันนี้ไม่มีอะไรต้องทำ")));
    tx.appendChild(el("small", "", L("Your brief stays under Brief", "ดูสรุปได้ที่ปุ่มสรุป")));
    b.doneShown = Date.now(); save();
    setTimeout(function(){ s.classList.add("gone"); setTimeout(function(){ if (s.parentNode) s.remove(); }, calm ? 0 : 480); }, 2600);
  } else if (!seen){
    tx.appendChild(el("b", "", ph === "morning" ? L("Your Morning Brief is ready", "สรุปยามเช้าพร้อมแล้ว") : ph === "midday" ? L("Your brief, so far today", "สรุปของวันนี้ถึงตอนนี้") : L("Your day wrap is ready", "สรุปท้ายวันพร้อมแล้ว")));
    tx.appendChild(el("small", "", L("Two minutes, the day at a glance", "สองนาที เห็นภาพรวมของวัน")));
  } else {
    tx.appendChild(el("b", "", briefName(ph)));
    var bits = [];
    if (sum.total) bits.push(ph === "evening" ? L(sum.done + " of " + sum.total + " done", "ทำแล้ว " + sum.done + " จาก " + sum.total) : sum.left ? L(sum.left + " still need you", "รอคุณอีก " + sum.left) : L("All done", "เรียบร้อยหมดแล้ว"));
    else bits.push(L("Nothing urgent", "ไม่มีเรื่องด่วน"));
    bits.push(L("Cash ", "เงินสด ") + baht(B.cash));
    tx.appendChild(el("small", "num", bits.join(" · ")));
  }
  s.appendChild(tx);
  if (allDone){ var ok = el("i", "tb-ring ok"); ok.style.setProperty("--p", 100); ok.innerHTML = '<em><svg class="i"><use href="#i-check"/></svg></em>'; s.appendChild(ok); }
  else if (seen && sum.total){ var ring = el("i", "tb-ring"); ring.style.setProperty("--p", Math.round(sum.done / sum.total * 100)); ring.appendChild(el("em", "num", sum.done + "/" + sum.total)); s.appendChild(ring); }
  s.insertAdjacentHTML("beforeend", '<svg class="i tb-go"><use href="#i-chevr"/></svg>');
  s.setAttribute("aria-label", tx.textContent);
}
/* coming back from the brief, the page folds itself into the strip */
function briefTuck(){ var s = $("#b-tbrief"); if (!s || calm) return; s.classList.remove("tuck"); void s.offsetWidth; s.classList.add("tuck"); }

/* yesterday and before: a row of dates, tap one to see that day's list and numbers. Read-only */
function pastBriefs(u, wrap){
  var list = (u.briefs || []).filter(function(b){ return b.sum; }); if (!list.length) return;
  var th = lang() === "th", sec = el("section", "mb-sec mb-past"), hd = el("div", "mb-sh");
  hd.appendChild(el("span", "mb-kick", L("The last " + list.length + (list.length === 1 ? " day" : " days"), "ย้อนหลัง " + list.length + " วัน"))); hd.appendChild(el("h2", "", L("Past briefs", "สรุปย้อนหลัง"))); sec.appendChild(hd);
  var dates = el("div", "mb-pdates"), panel = el("div", "mb-pday");
  function lbl(d, long){ return th ? (long ? d.toLocaleDateString("th-TH", { weekday: "long" }) + " " : "") + d.getDate() + " " + mth(MONTH[d.getMonth()]) : (long ? d.toLocaleDateString("en-GB", { weekday: "long" }) + " " : "") + d.getDate() + " " + MONTH[d.getMonth()].slice(0, 3); }
  function show(ix){
    $$("button", dates).forEach(function(x, j){ x.setAttribute("aria-pressed", String(j === ix)); });
    var b = list[ix], sm = b.sum, d = day(b.day); panel.textContent = "";
    var top = el("div", "mb-pdh"); top.appendChild(el("b", "", lbl(d, true)));
    top.appendChild(el("span", "num", sm.total ? L(sm.done + " of " + sm.total + " done", "ทำแล้ว " + sm.done + " จาก " + sm.total) : L("Nothing urgent", "ไม่มีเรื่องด่วน"))); panel.appendChild(top);
    if (sm.total){ var pr = el("div", "mb-prog"); pr.style.setProperty("--p", Math.round(sm.done / sm.total * 100)); pr.appendChild(el("i")); panel.appendChild(pr); }
    (sm.items || []).forEach(function(it){ var r = el("div", "mb-pit" + (it.d ? " d" : "")); r.innerHTML = '<svg class="i"><use href="#' + (it.d ? "i-check" : "i-clock") + '"/></svg>'; r.appendChild(el("span", "", T_(it.h))); r.appendChild(el("small", "", it.d ? L("Done", "เสร็จแล้ว") : L("Carried over", "ยกไปวันถัดไป"))); panel.appendChild(r); });
    var nums = el("div", "mb-pnum");
    [[L("Cash", "เงินสด"), sm.cash], [L("In this month", "รับเดือนนี้"), sm.inc], [L("Out this month", "จ่ายเดือนนี้"), sm.exp]].forEach(function(x){ if (x[1] == null) return; var c = el("div"); c.appendChild(el("small", "", x[0])); c.appendChild(el("b", "num", baht(x[1] || 0))); nums.appendChild(c); });
    panel.appendChild(nums);
  }
  list.forEach(function(b, ix){
    var d = day(b.day), bt = el("button", "mb-pd"); bt.type = "button";
    bt.appendChild(el("small", "", th ? d.toLocaleDateString("th-TH", { weekday: "short" }) : d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase()));
    bt.appendChild(el("b", "num", String(d.getDate())));
    var sm = b.sum; bt.appendChild(el("i", "mb-pdot" + (sm.total && sm.done < sm.total ? " part" : "")));
    bt.setAttribute("aria-label", lbl(d, true)); bt.addEventListener("click", function(){ show(ix); }); dates.appendChild(bt);
  });
  sec.appendChild(dates); sec.appendChild(panel); show(0);
  sec.setAttribute("data-noi18n", ""); wrap.appendChild(sec);
}
/* the demo comes with a few past days, so Past briefs has something to show */
function demoBriefs(u){
  if (u.briefs && u.briefs.length) return;
  var B = books(u); if (!B) return;
  var TK = tasks(u), heads = TK.slice(0, 3).map(function(x){ return x.story ? x.story.h : x.t; }); if (!heads.length) return;
  var pat = [[1, 1, 1], [1, 0, 1], [1, 1, 0], [1, 1, 1]];
  u.briefs = pat.map(function(dn, ix){
    var items = heads.map(function(h, j){ return { h: h, d: !!dn[j] }; }), done = items.filter(function(x){ return x.d; }).length;
    return { day: addDays(today(), -(ix + 1)), seen: 1, keys: [], sum: { cash: Math.round(B.cash - (ix + 1) * 8150), inc: Math.round(B.fin.mtd.rev * (1 - (ix + 1) * 0.06)), exp: Math.round(B.fin.mtd.exp * (1 - (ix + 1) * 0.05)), done: done, total: items.length, left: items.length - done, items: items } };
  });
}
