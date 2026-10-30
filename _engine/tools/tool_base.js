/* shared by the lesson tools: the Useful language box, shuffling, small helpers */
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = { get(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const params = new URLSearchParams(location.search);
/* **box phrase** in a speaking task or a follow-up = shown like the box phrases in the examples (checklist 8.07) */
const boxMarks = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="bx">$1</b>');
const calm = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
/* a small burst of confetti from an element (the end of a deck): brand colours, falls and fades in about a second; none with reduced motion */
function confetti(from){
  if(calm() || !from) return;
  const r = from.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const css = getComputedStyle(document.documentElement), col = ["--instr", "--date-bg", "--hl", "--ok", "--label"].map(v => css.getPropertyValue(v).trim() || "#0693E3");
  for(let i = 0; i < 46; i++){
    const p = document.createElement("i"), a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 170, w = 6 + Math.random() * 6;
    p.className = "confetti"; p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${w}px;height:${w * .45}px;background:${col[i % col.length]};border-radius:2px;pointer-events:none;z-index:50`;
    document.body.appendChild(p);
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * .6 - 60, spin = (Math.random() - .5) * 720;
    p.animate([{transform: "translate(-50%, -50%) rotate(0)", opacity: 1},
               {transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin / 2}deg)`, opacity: 1, offset: .45},
               {transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy + 160}px)) rotate(${spin}deg)`, opacity: 0}],
              {duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.7,.4,1)"}).onfinish = () => p.remove();
  }
}
/* a small "pop" on whatever was just tapped (tactile feedback) */
const pop = el => { if(!el || calm()) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); };

/* "If you're done": speaking tasks for fast finishers, one at a time (her rule, 27.10: a page can't be changed during the lesson,
   so every tool ends with plenty of talk, and after it the task starts over — it never runs out) */
/* where a group is in a run of tasks (speaking tasks, follow-ups). It counts which tasks they have SEEN, not positions, so that
   when Olya moves or removes tasks during the lesson (live version) no group skips anything (her catch, 28.10: on slides she could
   say "go back to slide 74"; here nobody could). Next = the next unseen task after this one in the current order, then any unseen
   one they jumped over; Previous = back the way they came; the end buttons come only when everything has been seen. */
const newCursor = () => ({key: null, seen: new Set(), hist: [], move: 0, go: null});
function cursorPick(cur, list){
  const has = k => list.some(x => x.k === k), unseen = x => !cur.seen.has(x.k) && x.k !== cur.key && !x.hidden;
  let key = cur.key;
  if(cur.go != null && has(cur.go)){ if(has(key)) cur.hist.push(key); key = cur.go; }
  else if(cur.move > 0){ const at = list.findIndex(x => x.k === key), nx = list.slice(at + 1).find(unseen) || list.find(unseen);
    if(nx){ if(has(key)) cur.hist.push(key); key = nx.k; } }
  else if(cur.move < 0){ while(cur.hist.length){ const pk = cur.hist.pop(); if(has(pk)){ key = pk; break; } } }
  if(key == null || !has(key)){ const nx = list.find(x => !cur.seen.has(x.k)) || list[0]; key = nx.k; }
  cur.key = key; cur.move = 0; cur.go = null; cur.seen.add(key);
  return {i: list.findIndex(x => x.k === key), more: list.some(x => !cur.seen.has(x.k) && !x.hidden), back: cur.hist.some(has)};
}
let spkCur = newCursor(), spkView = [];
const spkReset = () => { spkCur = newCursor(); };
/* the dots under a run of tasks: each one is a button that opens that task */
const dotsHTML = (n, i, attr, what, list, base, seen) => { const drag = list && base && liveTeacher();
  return `<span class="speak-dots ${drag ? "draggable" : ""}" ${drag ? `data-drag="${base}"` : ""}>${Array.from({length: n}, (_, k) =>
  `<button class="${k === i ? "on" : (seen && list ? seen.has(list[k].k) : k < i) ? "was" : ""} ${list && list[k].hidden ? "hid" : ""}" ${attr}="${k}" aria-label="${what} ${k + 1}" ${k === i ? `aria-current="step"` : ""}${drag ? ` data-k="${list[k].k}" title="${esc(String(list[k].t).replace(/\*\*/g, "").slice(0, 90))} — drag to move"` : ""}></button>`).join("")}</span>`; };
function speakHTML(list, endButtons, label = "Speaking", base = "speaking"){
  list = (list || []).map((x, k) => typeof x === "string" ? {k, t: x} : x);
  if(!list.length) return "";
  const {i, more, back} = cursorPick(spkCur, list), last = !more; spkView = list; liveViews[base] = list;
  return `<section class="speak" aria-live="polite"><div class="speak-top"><span class="speak-h">💬 ${esc(label)}</span>
      ${dotsHTML(list.length, i, "data-speak-go", "Question", list, base, spkCur.seen)}</div>
    <div class="live-host ${liveDim(base + "." + list[i].k)}" data-live-host><p class="speak-task">${boxMarks(list[i].t)}</p>${liveTools(base + "." + list[i].k, {last: true})}</div>
    <div class="row-actions">${back ? `<button class="btn" data-speak-prev>← Previous question</button>` : ""}${last ? endButtons : `<button class="btn primary" data-speak-next>Next question →</button>`}</div></section>`;
}
function wireSpeak(root, rerender){
  const show = () => { rerender(); const t = document.querySelector(".speak"); if(t) pop(t); };
  root.querySelectorAll("[data-speak-next]").forEach(b => b.addEventListener("click", () => { spkCur.move = 1; show(); }));
  root.querySelectorAll("[data-speak-prev]").forEach(b => b.addEventListener("click", () => { spkCur.move = -1; show(); }));
  root.querySelectorAll("[data-speak-go]").forEach(b => b.addEventListener("click", () => { const k = +b.dataset.speakGo; spkCur.go = spkView[k] ? spkView[k].k : null; show(); }));
  wireDrag(root);
}

/* the stages of the task (her rule, 27.10: every tool has stages — at least the practice and the speaking —
   and a group can move between them at any time without clicking through) */
const stagesHTML = (list, cur) => `<nav class="stages" aria-label="Stages">${list.map(([id, label], i) =>
  `${i ? `<span class="stage-arrow" aria-hidden="true">→</span>` : ""}<button class="stage-btn" data-stage="${id}" ${id === cur ? `aria-current="step"` : ""}>${label}</button>`).join("")}</nav>`;

/* 📋 everything on one screen, folded: to show a card or an example again later in the lesson */
let allOpen = false;
const allHTML = (title, inner) => `<details class="all" ${allOpen ? "open" : ""}><summary>📋 ${esc(title)}</summary><div class="all-in">${inner}</div></details>`;
function wireAll(root){ root.querySelectorAll("details.all").forEach(d => d.addEventListener("toggle", () => { allOpen = d.open; })); }

/* the box: tap a phrase when you've said it (it lights up green); "clickable:false" = a plain list.
   A line may carry a short Russian gloss after " – " (as on her slides: grey italics) and **bold** key words. */
const phHTML = t => { const k = t.indexOf(" – "), en = k < 0 ? t : t.slice(0, k), ru = k < 0 ? "" : t.slice(k + 3);
  return boxMarks(en) + (ru ? ` <span class="gloss">– ${esc(ru)}</span>` : ""); };
const usedPhrases = new Set();
function boxHTML(box, {clickable = true, collapsible = false, open = true} = {}){
  const items = box.map((g, gi) => `<h4>${esc(g.h)}</h4>` + g.items.map((t, ti) => clickable
      ? `<button class="ph ${usedPhrases.has(gi + "." + ti) ? "used" : ""}" data-ph="${gi}.${ti}" aria-pressed="${usedPhrases.has(gi + "." + ti)}">${phHTML(t)}</button>`
      : `<p class="ph">${phHTML(t)}</p>`).join("")).join("");
  return `<aside class="box ${clickable ? "" : "static"}" aria-label="Useful language">
    <div class="box-top"><img class="sticker" src="${STICKER}" alt="Useful language">${collapsible ? `<button class="linkish" data-box-toggle>Hide</button>` : ""}</div>
    ${open ? items : ""}</aside>`;
}
function wireBox(root, rerender){
  root.querySelectorAll("[data-ph]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.ph; usedPhrases.has(k) ? usedPhrases.delete(k) : usedPhrases.add(k);
    b.classList.toggle("used", usedPhrases.has(k)); b.setAttribute("aria-pressed", usedPhrases.has(k)); if(usedPhrases.has(k)) pop(b);
  }));
}

/* ---------- live version (tools 7, her wish 28.10): Olya removes, moves or corrects items during a lesson ----------
   Only on the "-live" pages (LIVE_ON). The page as built is the default; her changes come from her table
   (sheet "Live", one row per page) when the page opens and every 30 s, and are applied at the group's next tap,
   so nothing changes under their eyes. If the table doesn't answer, the page simply shows what it was built with.
   Her own code on this site (typed on any homework page) turns on the edit buttons: ✏️ correct, ⤓ to the end, Hide / Show.
   Hide, not delete (her wish, 28.10): a hidden item stays on HER screen, greyed, so she can correct it and show it again. */
let LV = {hide: [], last: [], text: {}, order: {}}, livePending = null, liveRerender = () => {}, liveBusy = false, liveMsg = "";
const liveCacheKey = "tool-live-" + PAGE_ID;
const liveSame = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const liveNorm = v => ({hide: (v && v.hide) || [], last: (v && v.last) || [], text: (v && v.text) || {}, order: (v && v.order) || {}});
if(LIVE_ON){ const c = store.get(liveCacheKey); if(c) LV = liveNorm(c); }
/* permanent numbers (tools 13, her decision 30.10): her table keeps live changes by an item's permanent number (D._pids, from the build's
   register), not by its place in the data, so a rebuild that inserts or moves items never moves her ✏️ / Hide / order onto another item.
   The page works with places; these turn a path into its stored form and back ("cards.4.1" ↔ "cards.<number>.1"). No numbers → the same. */
const PIDS = (typeof D !== "undefined" && D && D._pids) || {};
const PID_KEYS = Object.keys(PIDS).sort((a, b) => b.length - a.length);
const pidOf = (base, k) => PIDS[base] && PIDS[base][k] != null ? PIDS[base][k] : k;
const idxOf = (base, pid) => PIDS[base] ? PIDS[base].indexOf(+pid) : +pid;
function pathMap(path, fn){
  path = String(path); const key = PID_KEYS.find(k => path.startsWith(k + "."));
  if(!key) return path;
  const rest = path.slice(key.length + 1), seg = rest.split(".")[0]; if(!/^\d+$/.test(seg)) return path;
  const n = fn(key, +seg); return n == null || n < 0 ? null : key + "." + n + rest.slice(seg.length);
}
const toStore = path => pathMap(path, pidOf);
const fromStore = path => pathMap(path, idxOf);
const liveTeacher = () => { if(!LIVE_ON) return false; try{ return localStorage.getItem("hw-role") === "teacher" && !!localStorage.getItem("hw-code"); }catch(e){ return false; } };
const pathGet = (o, path) => String(path).split(".").reduce((x, k) => x == null ? x : x[k], o);
const liveText = (path, dflt) => { const p = toStore(path); return Object.prototype.hasOwnProperty.call(LV.text, p) ? LV.text[p] : dflt; };
const liveHidden = path => LV.hide.includes(toStore(path));
/* a list as the groups see it now: in the order she dragged it into, removed ones out, corrected texts in
   (an item she brought back after ordering goes to the end) */
function liveList(arr, base){
  const mine = liveTeacher();   /* her screen keeps the hidden ones (greyed), the groups' screens leave them out */
  let items = (arr || []).map((t, k) => ({k, t: typeof t === "string" ? liveText(base + "." + k, t) : t, hidden: liveHidden(base + "." + k)})).filter(x => mine || !x.hidden);
  const ord = Array.isArray(LV.order[base]) ? LV.order[base].map(p => idxOf(base, p)).filter(k => k > -1) : null;   /* stored by permanent number */
  if(ord) items = ord.map(k => items.find(x => x.k === k)).filter(Boolean).concat(items.filter(x => !ord.includes(x.k)));
  const lastKs = LV.last.filter(p => p.startsWith(base + ".") && /^\d+$/.test(p.slice(base.length + 1))).map(p => idxOf(base, +p.slice(base.length + 1))).filter(k => k > -1);
  return items.filter(x => !lastKs.includes(x.k)).concat(lastKs.map(k => items.find(x => x.k === k)).filter(Boolean));
}
/* "⤓ to the end" and dragging a dot both send the whole new order of that list */
const liveViews = {};
function liveMoveTo(base, key, to){
  const keys = (liveViews[base] || []).map(x => x.k), from = keys.indexOf(key); if(from < 0) return;
  keys.splice(from, 1); keys.splice(Math.max(0, Math.min(to, keys.length)), 0, key);
  return liveOp("order", base, JSON.stringify(keys.map(k => pidOf(base, k))));
}
async function livePost(body){
  try{ const r = await fetch(LIVE_URL, {method: "POST", body: JSON.stringify(body), headers: {"Content-Type": "text/plain;charset=utf-8"}}); return await r.json(); }
  catch(e){ return {ok: false, error: "offline"}; }
}
/* new changes wait for the group's next tap (render calls liveApply first); hers apply at once */
function liveApply(){ if(!livePending) return false; LV = livePending; livePending = null; if(typeof liveAdjust === "function") liveAdjust(); return true; }
async function liveFetch(first){
  if(!LIVE_ON || !LIVE_URL) return;
  const res = await livePost({action: "live", tool: PAGE_ID});
  if(!res.ok || !res.live) return;
  const v = liveNorm(res.live); store.set(liveCacheKey, v);
  if(liveSame(v, LV)) { livePending = null; return; }
  livePending = v; if(first || liveTeacher()){ liveApply(); if(first && typeof liveFresh === "function") liveFresh(); liveRerender(); }
}
if(LIVE_ON){ setTimeout(() => liveFetch(true), 50); setInterval(() => liveFetch(false), 30000); }
async function liveOp(kind, path, text){
  if(liveBusy) return; liveBusy = true; liveMsg = "saving…"; liveStatus();
  const res = await livePost({action: "liveOp", code: localStorage.getItem("hw-code") || "", tool: PAGE_ID, op: {kind, path: kind === "order" || kind === "reset" ? path : toStore(path), text}});
  liveBusy = false;
  /* on her own screen, removing or moving the task she's looking at shows what takes its place */
  /* hiding the task she's on: she stays on it (greyed) to correct it and show it again */
  if(res.ok && res.live){ LV = liveNorm(res.live); livePending = null; store.set(liveCacheKey, LV); if(typeof liveAdjust === "function") liveAdjust(); liveMsg = "saved ✓ — the groups get it when they move on"; liveRerender(); }
  else { liveMsg = res.error === "offline" ? "not saved: no connection" : res.error === "unknown-code" ? "not saved: your code isn't in the table" : "not saved: " + (res.error || "error"); liveStatus(); }
}
const liveStatus = () => { const s = document.getElementById("live-status"); if(s) s.textContent = liveMsg; };
/* her buttons next to an item; "fields" = several texts edited together (a card: sentence, answer, key word) */
/* dragging a dot (her screen only): the task moves to where the dot is dropped; a plain tap still opens the task */
function wireDrag(root){
  if(!liveTeacher()) return;
  root.querySelectorAll(".speak-dots[data-drag]").forEach(row => {
    const base = row.dataset.drag, dots = [...row.querySelectorAll("button[data-k]")];
    dots.forEach(dot => dot.addEventListener("pointerdown", e => {
      if(e.button !== 0) return;
      const x0 = e.clientX, key = +dot.dataset.k, centers = dots.map(d => { const r = d.getBoundingClientRect(); return r.left + r.width / 2; });
      let moved = false, to = dots.indexOf(dot);
      const move = ev => { const dx = ev.clientX - x0; if(!moved && Math.abs(dx) < 5) return; moved = true;
        dot.classList.add("dragging"); dot.style.transform = `translateX(${dx}px)`;
        to = centers.reduce((best, c, j) => Math.abs(ev.clientX - c) < Math.abs(ev.clientX - centers[best]) ? j : best, 0);
        dots.forEach((d, j) => d.classList.toggle("drop-here", j === to && d !== dot)); };
      const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up);
        if(!moved) return;
        dot.addEventListener("click", ev => { ev.stopImmediatePropagation(); ev.preventDefault(); }, {capture: true, once: true});
        liveMoveTo(base, key, to); };
      addEventListener("pointermove", move); addEventListener("pointerup", up);
    }));
  });
}
const liveTools = (path, {last = false, edit = true, fields = ""} = {}) => !(liveTeacher() && path) ? "" : liveHidden(path)
  ? `<span class="live-tools"><span class="live-hidden-tag">Hidden from the groups</span>${edit ? `<button class="live-b" data-live-edit="${fields || path}" title="Correct the text" aria-label="Correct the text">✏️</button>` : ""}<button class="live-b live-show" data-live-unhide="${path}" title="Show it to the groups again">Show</button></span>`
  : `<span class="live-tools">${edit ? `<button class="live-b" data-live-edit="${fields || path}" title="Correct the text" aria-label="Correct the text">✏️</button>` : ""}${last ? `<button class="live-b" data-live-last="${path}" title="Move to the end" aria-label="Move to the end">⤓</button>` : ""}<button class="live-b" data-live-hide="${path}" title="Hide it from the groups for now — you can correct it and show it again" aria-label="Hide from the groups">Hide</button></span>`;
/* her screen: a hidden item stays, greyed (class for its box) */
const liveDim = path => liveTeacher() && liveHidden(path) ? "is-hidden" : "";
/* the bar on top of her screen: what she has hidden (tap to show it again), Reset */
function liveBarHTML(labelOf){
  if(!liveTeacher()) return "";
  const removed = LV.hide.map(fromStore).filter(Boolean).map(p => `<button class="live-chip" data-live-unhide="${p}" title="Show it to the groups again">👁 ${esc((labelOf(p) || p).slice(0, 38))}${(labelOf(p) || p).length > 38 ? "…" : ""}</button>`).join("");
  const n = LV.hide.length + LV.last.length + Object.keys(LV.text).length + Object.keys(LV.order).length;
  liveLabelOf = labelOf;
  return `<div class="live-bar"><b>👩‍🏫 Live</b><span id="live-status">${esc(liveMsg || (n ? `${n} change${n === 1 ? "" : "s"} — the groups get them when they move on` : "✏️ correct · ⤓ to the end · Hide / Show — the groups get it when they move on"))}</span>
    ${removed ? `<span class="live-removed">Hidden: ${removed}</span>` : ""}${n ? `<button class="live-chip" data-live-copy title="For the lesson debrief: what you changed live, to put into the slides and the page">📋 My changes</button><button class="live-reset" data-live-reset>Reset all</button>` : ""}</div>`;
}
/* 📋 My changes (her wish 30.10 07:36): after the lesson, the debrief puts them into her slides and the page; plain words, the item's own text */
let liveLabelOf = p => p;
function liveChangesText(){
  const lab = p => { const t = String(liveLabelOf(p) || p).replace(/\*\*|\(\(|\)\)/g, ""); return t.length > 90 ? t.slice(0, 90) + "…" : t; }, out = [];
  LV.hide.map(fromStore).filter(Boolean).forEach(p => out.push(`Hidden: ${lab(p)}`));
  Object.keys(LV.text).forEach(sp => { const p = fromStore(sp); if(!p) return; const old = pathGet(D, p);
    out.push(`Corrected: ${typeof old === "string" ? `"${old.replace(/\*\*/g, "")}"` : lab(p)} → "${LV.text[sp]}"`); });
  Object.keys(LV.order).forEach(base => { const keys = (LV.order[base] || []).map(x => idxOf(base, x)).filter(k => k > -1);
    out.push(`New order (${base}): ${keys.map((k, i) => `${i + 1}. ${lab(base + "." + k)}`).join(" · ")}`); });
  LV.last.map(fromStore).filter(Boolean).forEach(p => out.push(`Moved to the end: ${lab(p)}`));
  return out.length ? [`${document.title} — what I changed live (${PAGE_ID}${LIVE_ON ? "-live" : ""})`].concat(out).join("\n") : "";
}
function wireLive(root, current){
  if(!liveTeacher()) return;
  root.querySelectorAll("[data-live-hide]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); liveOp("hide", b.dataset.liveHide); }));
  root.querySelectorAll("[data-live-unhide]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); liveOp("unhide", b.dataset.liveUnhide); }));
  root.querySelectorAll("[data-live-last]").forEach(b => b.addEventListener("click", e => { e.stopPropagation();
    const p = b.dataset.liveLast, base = p.slice(0, p.lastIndexOf(".")), key = +p.slice(p.lastIndexOf(".") + 1);
    if(p === "speaking." + spkCur.key) spkCur.move = 1; if(typeof liveCursorHook === "function") liveCursorHook(p);   /* she sees what takes its place */
    liveMoveTo(base, key, Infinity); }));
  root.querySelectorAll("[data-live-copy]").forEach(b => b.addEventListener("click", async e => { e.stopPropagation(); const t = liveChangesText(); let ok = false;
    try{ await navigator.clipboard.writeText(t); ok = true; }catch(err){ const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try{ ok = document.execCommand("copy"); }catch(x){} ta.remove(); }
    b.textContent = ok ? "Copied ✓" : "Couldn't copy"; setTimeout(() => { b.textContent = "📋 My changes"; }, 2000); }));
  root.querySelectorAll("[data-live-reset]").forEach(b => b.addEventListener("click", e => { e.stopPropagation();
    if(b.dataset.sure){ liveOp("reset", ""); } else { b.dataset.sure = "1"; b.textContent = "Sure? Tap again"; } }));
  root.querySelectorAll("[data-live-edit]").forEach(b => b.addEventListener("click", e => { e.stopPropagation();
    const paths = b.dataset.liveEdit.split("|"), labels = ["", "Answer", "Key word"], host = b.closest("[data-live-host]") || b.parentElement.parentElement;
    const form = document.createElement("div"); form.className = "live-edit";
    form.innerHTML = paths.map((p, i) => `<label>${paths.length > 1 ? `<span>${i ? labels[i] : "Sentence"}</span>` : ""}<textarea data-p="${p}" rows="${paths.length > 1 ? 2 : 3}">${esc(liveText(p, current(p)))}</textarea></label>`).join("")
      + `<div class="row-actions"><button class="btn primary slim" data-live-save>Save for the groups</button><button class="btn slim" data-live-cancel>Cancel</button></div>`;
    host.replaceWith(form); const t = form.querySelector("textarea"); if(t){ t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
    form.addEventListener("click", ev => ev.stopPropagation());
    form.querySelector("[data-live-cancel]").addEventListener("click", () => liveRerender());
    form.querySelector("[data-live-save]").addEventListener("click", async () => {
      for(const ta of form.querySelectorAll("textarea")){ const p = ta.dataset.p, v = ta.value.trim(); if(v !== liveText(p, current(p))) await liveOp("text", p, v); }
      liveRerender(); });
  }));
}
