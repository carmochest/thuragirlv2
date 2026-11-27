/* ── the brief through the day: fresh each morning, tucks into Home once read, turns into "Today so far" and then a "Day wrap", and resets overnight ── */
function briefHour(){ var m = location.search.match(/[?&]hour=(\d{1,2})/); return m ? +m[1] : new Date().getHours(); }
function briefPhase(){ var h = briefHour(); return h < 12 ? "morning" : h < 17 ? "midday" : "evening"; }
function briefName(ph){ return ph === "morning" ? L("The Morning Brief", "สรุปยามเช้า") : ph === "midday" ? L("Today so far", "วันนี้ถึงตอนนี้") : L("Day wrap", "สรุปท้ายวัน"); }
/* today's brief record. On a new day yesterday's is filed under Past briefs (last 14 kept) and a fresh one starts unread */
function briefDay(u){
  var d = today(), b = u.brief;
  if (!b || b.day !== d){
    if (b && b.sum){ u.briefs = [b].concat(u.briefs || []).slice(0, 14); }
    b = u.brief = { day: d, seen: 0, keys: null, sum: null };
    save();
  }
  return b;
}
function briefSeenToday(u){ var b = u.brief; return !!(b && b.day === today() && b.seen); }
/* first look of the day fixes the morning list; later views count what got done since */
function briefProgress(u, top){
  var b = briefDay(u);
  if (!b.keys){ b.keys = top.map(function(t){ return t.k; }); save(); }
  return briefLive(u);
}
/* progress against this morning's list, worked out live so the Home strip is right without reopening the brief */
function briefLive(u){
  var b = briefDay(u); if (!b.keys) return null;
  var TK = tasks(u), B = books(u), p = B && B.pack;
  var done = b.keys.filter(function(k){ return k === "rev" ? !!(p && u.done["rev:" + p.key]) || !p : !TK.some(function(x){ return x.k === k; }); }).length;
  return { done: done, total: b.keys.length, left: b.keys.length - done };
}
function briefSave(u, sum){ var b = briefDay(u); b.sum = sum; save(); }

/* the slim strip on Home: an invitation before it's read, the day's numbers after */
function briefStrip(u){
  var home = $("#b-home"), s = $("#b-tbrief"); if (!home) return;
  var B = u.hasData && books(u); if (!B || gated(u)){ if (s) s.remove(); return; }
  var b = briefDay(u), ph = briefPhase(), seen = !!b.seen, sum = briefLive(u) || b.sum || {};
  if (!s){ s = el("button", "tbrief"); s.type = "button"; s.id = "b-tbrief"; s.addEventListener("click", function(){ go("brief"); }); var w = $("#b-wel"); w.parentNode.insertBefore(s, w.nextSibling); }
  s.setAttribute("data-noi18n", ""); s.classList.toggle("fresh", !seen); s.textContent = "";
  var now = new Date(), th = lang() === "th";
  var dt = el("span", "tb-dt"); dt.appendChild(el("small", "", th ? now.toLocaleDateString("th-TH", { weekday: "short" }) : now.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase())); dt.appendChild(el("b", "num", String(now.getDate()))); s.appendChild(dt);
  var tx = el("span", "tb-tx");
  if (!seen){
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
  if (seen && sum.total){ var ring = el("i", "tb-ring"); ring.style.setProperty("--p", Math.round(sum.done / sum.total * 100)); ring.appendChild(el("em", "num", sum.done + "/" + sum.total)); s.appendChild(ring); }
  s.insertAdjacentHTML("beforeend", '<svg class="i tb-go"><use href="#i-chevr"/></svg>');
  s.setAttribute("aria-label", tx.textContent);
}
/* coming back from the brief, the page folds itself into the strip */
function briefTuck(){ var s = $("#b-tbrief"); if (!s || calm) return; s.classList.remove("tuck"); void s.offsetWidth; s.classList.add("tuck"); }

/* yesterday and before, short and read-only */
function pastBriefs(u, wrap){
  var list = (u.briefs || []).filter(function(b){ return b.sum; }); if (!list.length) return;
  var sec = el("details", "mb-past"); sec.appendChild(el("summary", "", L("Past briefs", "สรุปย้อนหลัง")));
  list.forEach(function(b){
    var d = day(b.day), th = lang() === "th", row = el("div", "mb-pr"), sm = b.sum;
    row.appendChild(el("b", "num", th ? d.getDate() + " " + mth(MONTH[d.getMonth()]) : d.getDate() + " " + MONTH[d.getMonth()].slice(0, 3)));
    row.appendChild(el("span", "", sm.total ? L(sm.done + " of " + sm.total + " done", "ทำแล้ว " + sm.done + " จาก " + sm.total) : L("Nothing urgent", "ไม่มีเรื่องด่วน")));
    row.appendChild(el("span", "num", L("Cash ", "เงินสด ") + baht(sm.cash || 0)));
    sec.appendChild(row);
  });
  sec.setAttribute("data-noi18n", ""); wrap.appendChild(sec);
}
