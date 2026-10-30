/* ---------- lesson work (tools 13, 30.10, her wishes 02:51–04:00): on a -live page Olya sees what each group types, where each room is
   and who sits there, and sends quick notes; shared by chat-scenes and the revision pages ----------
   Groups' side: what they type goes to her table while they type (2.5 s after they stop, at least every 8 s) and on Send; her notes come
   back to this device (every 10 s while they type, else every 30 s) and show where they belong; "move on to …" and 📢 messages show as a
   strip with two answers (her rule 04:00: a group can always say Not yet). A random device id is kept on the device; the name goes along
   only if a student's code is saved there (else anonymous). Her own screen never sends anything: it has the 📥 Groups view.
   The page sets the hooks in LW (below) before render(). */
const LW = {
  tools: [],                 /* her Groups view: [{id, title, chat: i => label}] — this page first, then pages shown inside it */
  current: () => null,       /* groups: the chat they are typing in now (polls faster), or null */
  onNotes: () => {},         /* groups: her notes changed → repaint them */
  onGo: () => {},            /* groups: they tapped Go → on her "move on to …" (the note's text is the stage) */
  stages: [],                /* her "move on to …" choices: [[id, label]] (revision pages) */
  board: null,               /* {id, cell}: the Jeopardy board's page and this field's cell (rooms opened / closed) */
  groupsView: () => false    /* her 📥 Groups view is on screen */
};
const SHARE = LIVE_ON && !!LIVE_URL;
const sharing = () => SHARE && !liveTeacher();
const DEV = (() => { const ok = d => /^[a-z0-9]{12,40}$/.test(d || ""), make = () => Array.from({length: 16}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
  try{ let d = localStorage.getItem("tool-dev"); if(!ok(d)){ d = make(); localStorage.setItem("tool-dev", d); } return d; }catch(e){ return make(); } })();
const studentCode = () => { try{ return localStorage.getItem("hw-role") === "teacher" ? "" : (localStorage.getItem("hw-code") || ""); }catch(e){ return ""; } };
const NKEY = "tool-notes-" + PAGE_ID;
let NOTES = store.get(NKEY) || [];                         /* her notes to this device: [{id, chat, q, k, c, ts}] */
const shown = new Set(store.get(NKEY + "-shown") || []), told = new Set(store.get(NKEY + "-told") || []), fresh = new Set();
const answered = new Set(store.get(NKEY + "-answered") || []);
let pend = {}, shareT = null, shareFirst = 0, shareBusy = false, posted = !!store.get(NKEY + "-posted");
const markPosted = () => { if(!posted){ posted = true; store.set(NKEY + "-posted", true); } };
function shareDraft(i, text, sent){
  if(!sharing()) return;
  pend[i] = {chat: i, text: text, sent: !!sent};
  const now = Date.now(); if(!shareT) shareFirst = now; clearTimeout(shareT);
  shareT = setTimeout(shareFlush, sent ? 0 : Math.max(0, Math.min(2500, shareFirst + 8000 - now)));
}
async function shareFlush(){
  shareT = null; if(shareBusy){ shareT = setTimeout(shareFlush, 700); return; }
  const list = Object.values(pend); pend = {}; if(!list.length) return; shareBusy = true;
  for(const body of list){
    const res = await livePost(Object.assign({action: "toolPost", tool: PAGE_ID, dev: DEV, code: studentCode()}, body));
    if(res.ok){ markPosted(); notesIn(res.notes); }
    else if(["offline", "busy", "server"].includes(res.error) && !pend[body.chat]){ pend[body.chat] = body; if(!shareT) shareT = setTimeout(shareFlush, 10000); }   /* no connection: try again */
  }
  shareBusy = false;
}
function notesIn(list){
  if(!Array.isArray(list)) return;
  const had = new Set(NOTES.map(n => n.id)); list.forEach(n => { if(!had.has(n.id)) fresh.add(n.id); });
  NOTES = list; store.set(NKEY, NOTES); LW.onNotes(); paintStrip();
}
let pollN = 0;
async function notesPoll(){
  if(!sharing() || !posted || document.hidden) return;
  if(LW.current() == null && (pollN++ % 3)) return;     /* while they type: every 10 s; otherwise every 30 s */
  const seen = [...shown].filter(id => !told.has(id)).slice(0, 50);
  const res = await livePost(Object.assign({action: "toolNotes", tool: PAGE_ID, dev: DEV}, seen.length ? {seen} : {}));
  if(!res.ok) return; seen.forEach(id => told.add(id)); store.set(NKEY + "-told", [...told]); notesIn(res.notes);
}
if(SHARE){ setTimeout(notesPoll, 1500); setInterval(notesPoll, 10000); }
const seenNote = id => { if(!shown.has(id)){ shown.add(id); store.set(NKEY + "-shown", [...shown]); } fresh.delete(id); };
const notesOf = i => NOTES.filter(n => n.chat === i && n.k !== "go" && n.k !== "say").sort((a, b) => a.ts - b.ts);
/* a note in her feedback marks: ✓ Good (green), ✗ Change (struck), ✎ Correction (struck → blue on yellow), 💬 Comment */
const markLine = n => n.k === "good" ? `<span class="m-good">${esc(n.q)}</span> ✓ Good!`
  : n.k === "change" ? `<span class="m-del">${esc(n.q)}</span> ✗ Change this`
  : n.k === "fix" ? `<span class="m-del">${esc(n.q)}</span> → <span class="m-ins">${esc(n.c)}</span>`
  : n.k === "go" ? `⏩ move on to ${esc(n.c)}` : n.k === "say" ? `📢 ${esc(n.c)}`
  : `${n.q ? `<span class="q">“${esc(n.q)}”</span> — ` : ""}${esc(n.c)}`;
const noteHTML = n => `<div class="t-note ${fresh.has(n.id) ? "new" : ""}" data-note="${esc(n.id)}"><span class="who">👩‍🏫 Olya:</span> ${markLine(n)}</div>`;

/* "move on to …" and 📢: a strip on top until they answer (Go → / Not yet, or OK); the answer goes to her card */
function stripHTML(){
  if(!sharing()) return "";
  const open = NOTES.filter(n => (n.k === "go" || n.k === "say") && !answered.has(n.id)).sort((a, b) => b.ts - a.ts)[0];
  if(!open) return "";
  return open.k === "go"
    ? `<div class="lw-strip" data-strip="${esc(open.id)}"><span>👩‍🏫 <b>Olya suggests:</b> move on to ${esc(open.c)}</span><span class="grow"></span><button class="btn slim primary" data-strip-go>Go →</button><button class="btn slim" data-strip-later>Not yet</button></div>`
    : `<div class="lw-strip" data-strip="${esc(open.id)}"><span>📢 <b>Olya:</b> ${esc(open.c)}</span><span class="grow"></span><button class="btn slim primary" data-strip-ok>OK</button></div>`;
}
function paintStrip(){
  if(!sharing()) return;
  let el = document.getElementById("lw-strip-host");
  if(!el){ el = document.createElement("div"); el.id = "lw-strip-host"; el.setAttribute("aria-live", "polite"); document.body.prepend(el); }
  const h = stripHTML(); if(el.dataset.h === h) return; el.dataset.h = h; el.innerHTML = h;
  const s = el.querySelector("[data-strip]"); if(!s) return; const id = s.dataset.strip, n = NOTES.find(x => x.id === id);
  seenNote(id);
  const answer = v => { answered.add(id); store.set(NKEY + "-answered", [...answered]); lwSignal("reply", id, v); paintStrip(); };
  s.querySelectorAll("[data-strip-go]").forEach(b => b.addEventListener("click", () => { answer("go"); LW.onGo(n.c); }));
  s.querySelectorAll("[data-strip-later]").forEach(b => b.addEventListener("click", () => answer("later")));
  s.querySelectorAll("[data-strip-ok]").forEach(b => b.addEventListener("click", () => answer("ok")));
}
if(SHARE) setTimeout(paintStrip, 0);

/* where the group is (revision pages): sent when the stage changes, and every minute while the page is open (so "3 of 4 screens here") */
let whereNow = "", whereT = null;
async function lwWhere(at){
  if(!sharing()) return; if(at != null) whereNow = at; if(!whereNow) return;
  const res = await livePost({action: "toolWhere", tool: PAGE_ID, dev: DEV, at: whereNow, code: studentCode()});
  if(res.ok) markPosted();
  clearTimeout(whereT); whereT = setTimeout(() => { if(!document.hidden) lwWhere(); else whereT = setTimeout(lwWhere, 60000); }, 60000);
}
/* one tap of the group: ✓/≈/✗ after "Show the answer", 🔖 on a gap, a box phrase, the answer to her strip */
function lwSignal(kind, item, value){
  if(!sharing()) return;
  livePost({action: "toolSignal", tool: PAGE_ID, dev: DEV, kind, item: String(item), value: String(value)}).then(r => { if(r.ok) markPosted(); });
}
/* the cards: card number → times back into the deck, the cards they got; never reset (a page is made for one group) */
const DKEY = "tool-deckstats-" + PAGE_ID;
let DS = (() => { const v = store.get(DKEY); return v && v.again && Array.isArray(v.got) ? v : {again: {}, got: []}; })(), dsT = null;
function lwDeck(i, ok){
  if(!sharing()) return;
  if(ok){ if(!DS.got.includes(i)) DS.got.push(i); } else DS.again[i] = (DS.again[i] || 0) + 1;
  store.set(DKEY, DS); clearTimeout(dsT); dsT = setTimeout(deckSend, 2000);
}
async function deckSend(){
  dsT = null; const res = await livePost({action: "toolDeck", tool: PAGE_ID, dev: DEV, code: studentCode(), again: DS.again, got: DS.got});
  if(res.ok) markPosted(); else if(["offline", "busy", "server"].includes(res.error)) dsT = setTimeout(deckSend, 10000);
}

/* ---------- her screen: 📥 Groups — one card per screen: Group 1 — Anna + Boris · where · minutes; what they type; her marks ---------- */
const QUICK = (typeof D !== "undefined" && D.quickNotes) || ["🤔 Think again", "🔍 Check the verb form", "📖 Check the word", "🎩 Too formal?", "🧢 Too informal?", "👍 Nice!"];
const SINCE_KEY = "tool-work-since-" + PAGE_ID;
let GW = {rows: [], rooms: [], signals: [], decks: [], students: [], board: null, at: 0, skew: 0, err: "", loaded: false}, gwBusy = false, gwTick = 0, selAt = 0, rosterOpen = null, rosterPick = null;
const gwNow = () => Date.now() + GW.skew;
const gwSince = () => Number(store.get(SINCE_KEY)) || 0;
/* this lesson only (her wish 07:46: what matters is the moment): screens and texts from more than 3 hours ago are folded away
   ("Earlier lessons"); 🧹 Start fresh hides her own test from this morning too. The decks' counts are not cut: they add up (her decision 03:33). */
const RECENT = 3 * 3600000;
const gwCut = () => GW.showOld ? gwSince() : Math.max(gwSince(), gwNow() - RECENT);
const gwRows = () => GW.rows.filter(r => r.ts >= gwCut());
/* her 15:35: a test screen left open since the morning kept "Rooms opened 08:51" — after her 🧹 Start fresh only screens that came after it count */
const gwRooms = () => GW.rooms.filter(r => r.ts >= gwCut() && (GW.showOld || (r.first || r.ts) >= gwSince()));
const toolOf = id => LW.tools.find(t => t.id === id) || {id, title: id, chat: i => `Chat ${i + 1}`};
const chatName = (tool, i) => toolOf(tool).chat(i);
function gwDevices(){
  const by = {}, get = dev => by[dev] = by[dev] || {dev, rows: [], first: Infinity, name: "", room: null};
  gwRows().forEach(r => { const d = get(r.dev); d.rows.push(r); d.first = Math.min(d.first, r.started || r.ts); if(r.name) d.name = r.name; });
  gwRooms().forEach(r => { const d = get(r.dev); d.room = r; d.first = Math.min(d.first, r.first || r.ts); if(r.name) d.name = r.name; });
  const list = Object.values(by).sort((a, b) => a.first - b.first);
  list.forEach((d, k) => { d.n = k + 1; d.rows.sort((a, b) => b.ts - a.ts); d.cur = d.rows[0] || null;
    d.people = d.room && d.room.names && d.room.names.length ? d.room.names : d.name ? [d.name] : [];
    d.label = `Group ${d.n}` + (d.people.length ? ` — ${d.people.join(" + ")}` : ""); d.short = `Group ${d.n}`; });
  return list;
}
const ago = ts => { const s = Math.max(0, Math.round((gwNow() - ts) / 1000)); return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : new Date(ts).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", hour12: false}); };
const hm = ts => new Date(ts).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", hour12: false});
const typingNow = r => !!r && r.status === "typing" && gwNow() - r.ts < 60000;
const statusText = r => r.status === "sent" ? `✓ sent ${ago(r.ts)}` : typingNow(r) ? `✍️ typing… ${ago(r.ts)}` : `✍️ draft · ${ago(r.ts)}`;
const hereNow = room => room && gwNow() - room.ts < 150000;
/* her quoted words marked in their text (the ones she sent: her marks; the one she is pointing at now: yellow with a frame) */
function markedText(r, pick){
  const t = r.text || ""; if(!t.trim()) return `<span class="none">(empty)</span>`;
  const spans = []; const add = (q, cls, after) => { if(!q) return; const at = t.indexOf(q); if(at > -1 && !spans.some(x => at < x.b && at + q.length > x.a)) spans.push({a: at, b: at + q.length, cls, after}); };
  add(pick, "m-pick"); (r.notes || []).slice().reverse().forEach(n => add(n.q, n.k === "good" ? "m-good" : n.k === "change" || n.k === "fix" ? "m-del" : "m-note", n.k === "fix" ? n.c : ""));
  spans.sort((x, y) => x.a - y.a); let out = "", k = 0;
  spans.forEach(x => { out += esc(t.slice(k, x.a)) + `<span class="${x.cls}">${esc(t.slice(x.a, x.b))}</span>${x.after ? ` <span class="m-ins">${esc(x.after)}</span>` : ""}`; k = x.b; });
  return out + esc(t.slice(k));
}
const replyOf = (dev, id) => { const s = GW.signals.find(x => x.dev === dev && x.kind === "reply" && x.item === id); return s ? s.value : ""; };
const gwNotesHTML = (r, dev) => (r.notes || []).filter(n => n.k !== "go" && n.k !== "say").map(n => `<div>${n.k === "note" || !n.k ? "💬 " : ""}${markLine(n)} <span class="sn">${n.seen ? "· ✓ seen" : "· not seen yet"}</span></div>`).join("");
/* her "move on" / 📢 to this screen, with the group's answer */
function gwNudgesHTML(d){
  const last = (GW.notes || []).filter(n => n.dev === d.dev && (n.k === "go" || n.k === "say")).sort((a, b) => b.ts - a.ts)[0]; if(!last) return "";
  const v = replyOf(d.dev, last.id), st = v === "go" ? "✓ went" : v === "later" ? "⏸ not yet" : v === "ok" ? "✓ OK" : "⏳ waiting";
  return `<div class="gw-nudge">${last.k === "go" ? `⏩ ${esc(last.c)}` : `📢 ${esc(last.c)}`} · ${hm(last.ts)} · <b>${st}</b></div>`;
}
const gwEarlierHTML = d => { const old = d.rows.slice(1).sort((a, b) => a.chat - b.chat); return old.length ? `<summary>Earlier (${old.length})</summary>${old.map(r => `<p><span class="ch">${esc(chatName(r.tool, r.chat))}</span>${esc(r.text)}${r.status === "typing" ? " ✍️" : ""}${(r.notes || []).filter(n => n.k !== "go" && n.k !== "say").map(n => `<br>${markLine(n)}`).join("")}</p>`).join("")}` : ""; };
function gwWhoHTML(d, row){
  const room = d.room, mins = room && room.since ? Math.max(0, Math.round((gwNow() - room.since) / 60000)) : 0;
  const where = room && room.at ? `<span class="wh ${mins >= 8 ? "long" : ""}">${esc(room.at)} · ${mins} min</span>` : "";
  const away = room && !hereNow(room) ? `<span class="away">· not on this page now</span>` : "";
  return `<span class="nm">${esc(d.label)}</span><button class="gw-ppl" data-roster aria-expanded="${rosterOpen === d.dev}" title="Who is in this room: tap names">👥 ${d.people.length ? "Names" : "Who is it? Add names"}</button>${where}${away}
    ${row ? `<span class="ch">${esc(chatName(row.tool, row.chat))}</span><span class="stt">${statusText(row)}${row !== d.cur ? ` · now on ${esc(chatName(d.cur.tool, d.cur.chat))}` : ""}</span>` : ""}`;
}
/* who is in this room: tap a name to put them here (from another room: kept as a move with the time), tap again to take them out */
function rosterHTML(d, devs){
  if(rosterOpen !== d.dev) return "";
  const at = {}; devs.forEach(x => x.people.forEach(n => { at[n] = x; }));
  const names = [...new Set((GW.students || []).concat(devs.flatMap(x => x.people)))];
  return `<div class="gw-roster">${names.map(n => { const x = at[n], here = x && x.dev === d.dev;
    return `<button class="rn ${here ? "here" : x ? "else" : ""}" data-rn="${esc(n)}">${esc(n)}${x && !here ? ` <small>${esc(x.short)}</small>` : ""}</button>`; }).join("") || `<span class="sn">No names yet: her table's Students tab (Group ${esc(String(PAGE_ID).split("-")[0].toUpperCase())}).</span>`}</div>`;
}
function gwCardHTML(d){
  return `<article class="gw-card" data-dev="${esc(d.dev)}" ${d.cur ? `data-tool="${esc(d.cur.tool)}" data-chat="${d.cur.chat}"` : ""}>
    <div class="gw-who" data-who></div>
    <div data-roster-box></div>
    <div class="gw-nudges" data-nudge></div>
    <div class="gw-text" data-text></div>
    <div class="gw-notes" data-notes></div>
    <div class="gw-pick" data-pick></div>
    <div class="gw-tools"><button class="tool good" data-mk="good">✓ Good</button><button class="tool del" data-mk="change">✗ Change</button><button class="tool ins" data-mk="fix">✎ Correction</button><button class="tool cmt" data-mk="note">💬 Comment</button>${LW.stages.length ? `<select class="gw-go" data-go aria-label="Suggest they move on"><option value="">⏩ Move on to…</option>${LW.stages.map(([id, l]) => `<option value="${esc(l)}">${esc(l)}</option>`).join("")}</select>` : ""}</div>
    <div class="gw-quick">${QUICK.map(q => `<button data-quick="${esc(q)}">${esc(q)}</button>`).join("")}</div>
    <form class="gw-own" data-own><input maxlength="300" placeholder="Or type your note to this group…" aria-label="Your note to this group"><button class="btn slim primary">Send</button></form>
    <div class="gw-said" data-said></div>
    <details class="gw-earlier" data-earlier></details></article>`;
}
/* ---------- 👥 under a chat on the task page (her wish 30.10 09:23: the task and the groups' work on one page) ----------
   Her view only: every group's text for this chat, live (every 10 s), with the same ✓ Good, ✗ Change, ✎ Correction, 💬 as in 📥 Groups.
   📥 Groups stays as it is (all the pages at once, who works with whom): the two show the same work. */
const pcHTML = (tool, chat) => liveTeacher() && SHARE && !EMBED ? `<section class="pc" data-pc="${esc(tool)}|${chat}"><div class="pc-top"><b>👥 The groups on this chat</b><span class="pc-meta"></span></div><div class="pc-grid"></div></section>` : "";
function pcCardHTML(d, tool, chat){
  return gwCardHTML(d).replace('<article class="gw-card"', '<article class="gw-card pc-card"').replace(/data-tool="[^"]*" data-chat="[^"]*"/, "").replace('data-dev="' + esc(d.dev) + '"', `data-dev="${esc(d.dev)}" data-tool="${esc(tool)}" data-chat="${chat}"`);
}
function pcPaint(){
  document.querySelectorAll(".pc[data-pc]").forEach(pc => {
    const [tool, chat] = pc.dataset.pc.split("|"), list = gwDevices().map(d => ({d, r: d.rows.find(r => r.tool === tool && String(r.chat) === chat)})).filter(x => x.r);
    const meta = pc.querySelector(".pc-meta"), mt = GW.err ? gwMetaText() : !GW.loaded ? "loading…" : `${list.length} group${list.length === 1 ? "" : "s"} · updated ${hm(GW.at)} · select words, then ✓ ✗ ✎ 💬`;
    if(meta.innerHTML !== mt) meta.innerHTML = mt;
    const grid = pc.querySelector(".pc-grid"), want = new Set(list.map(x => x.d.dev));
    grid.querySelectorAll(".gw-card").forEach(c => { if(!want.has(c.dataset.dev)) c.remove(); });
    const empty = grid.querySelector(".gw-empty");
    if(!list.length){ if(!empty) grid.innerHTML = `<div class="gw-empty">Nothing from the groups on this chat yet.</div>`; return; }
    if(empty) empty.remove();
    list.forEach(({d, r}) => {
      let c = grid.querySelector(`.gw-card[data-dev="${d.dev}"]`);
      if(!c){ grid.insertAdjacentHTML("beforeend", pcCardHTML(d, tool, chat)); c = grid.lastElementChild; wireCard(c); }
      c.classList.toggle("sent", r.status === "sent"); c.classList.toggle("typing", typingNow(r));
      const set = (sel, h) => { const el = c.querySelector(sel); if(el.dataset.h !== h){ el.innerHTML = h; el.dataset.h = h; } };
      set("[data-who]", gwWhoHTML(d, r));
      const rb = c.querySelector("[data-roster-box]"), rh = rosterHTML(d, gwDevices()); if(rb.dataset.h !== rh){ rb.innerHTML = rh; rb.dataset.h = rh; wireRoster(rb, d); }
      set("[data-nudge]", gwNudgesHTML(d));
      const tx = c.querySelector("[data-text]"), sel = getSelection(), inside = sel && sel.rangeCount && !sel.isCollapsed && tx.contains(sel.anchorNode) && Date.now() - selAt < 8000;
      if(!inside){ const h = markedText(r, c.dataset.quote || ""); if(tx.innerHTML !== h) tx.innerHTML = h; }
      set("[data-notes]", gwNotesHTML(r, d.dev));
    });
  });
}
/* the task page re-renders on her taps: the panel (a half-typed note, picked words) is kept and put back */
function pcStash(){ const m = {}; document.querySelectorAll(".pc[data-pc]").forEach(pc => { m[pc.dataset.pc] = pc; }); return m; }
function pcRestore(m){ document.querySelectorAll(".pc[data-pc]").forEach(pc => { const old = m[pc.dataset.pc]; if(old && old !== pc) pc.replaceWith(old); }); pcPaint(); }
function groupsHTML(){
  return `<section class="gw ${S && S.enter ? "enter" : ""}"><div class="gw-rooms" id="gw-rooms"></div><div class="gw-top"><b>📥 What the groups are doing</b><span class="gw-meta" id="gw-meta"></span><span class="grow"></span>
    ${LW.stages.length ? `<button class="btn slim" data-say-all>📢 To all rooms</button>` : ""}<button class="btn slim" data-gw-copy="names">📋 Copy all</button><button class="btn slim" data-gw-copy="">📋 Without names</button><button class="btn slim" data-gw-fresh>🧹 Start fresh</button></div>
    <div class="gw-sayall" id="gw-sayall" hidden><input maxlength="200" placeholder="A message to every room, e.g. 2 minutes left!" aria-label="Message to all rooms"><button class="btn slim primary" data-say-send>Send to all</button>
      ${["⏰ 2 minutes left!", "🙌 Finish this card, then come back to the main room."].map(t => `<button class="chipq" data-say-quick="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <div class="gw-grid" id="gw-grid"></div><div class="gw-history" id="gw-history"></div></section>`;
}
function gwMetaText(){
  if(GW.err === "old-script") return "⚠️ Your table doesn't know this yet: in Apps Script, Deploy → Manage deployments → ✏️ → Version: New version → Deploy.";
  if(GW.err) return "⚠️ not updated: " + (GW.err === "offline" ? "no connection" : GW.err) + " — trying again in 10 s";
  if(!GW.loaded) return "loading…";
  const hid = GW.rows.length - GW.rows.filter(r => r.ts >= Math.max(gwSince(), gwNow() - RECENT)).length;
  return `updated ${new Date(GW.at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false})} · every 10 s · select words in a text, then ✓ Good, ✗ Change, ✎ Correction or a note${GW.showOld ? ` <button class="btn slim" data-gw-all>Only this lesson</button>` : hid ? ` · ${hid} from earlier hidden <button class="btn slim" data-gw-all>Show earlier</button>` : ""}`;
}
/* "Rooms opened 18:42 · 3 of 4 screens here": the first group's screen on this page opens the rooms (her own device never counts);
   her ✓ Done on the board, or ▶ Now on another field, closes them */
function roomsSpan(){
  const rs = gwRooms().filter(r => r.first); if(!rs.length) return null;
  const open = Math.max(Math.min(...rs.map(r => r.first)), gwSince()); let close = null;
  const b = GW.board, cell = LW.board && LW.board.cell;
  if(b && cell){ const done = Number((b.text || {})["done." + cell]) || 0, nw = String((b.text || {}).now || "").split("|");
    if(done && done > open) close = done; else if(nw[0] && nw[0] !== cell && Number(nw[1]) > open) close = Number(nw[1]); }
  return {open, close, here: rs.filter(hereNow).length, all: rs.length};
}
function roomsHTML(){
  const s = roomsSpan(); if(!s || s.close) return "";   /* only while the rooms are open (her wish 07:46); the times stay in 📸 Who worked where */
  return s.close ? `🚪 Rooms: ${hm(s.open)}–${hm(s.close)} · ${Math.round((s.close - s.open) / 60000)} min · ${s.all} screen${s.all === 1 ? "" : "s"}`
    : `🚪 Rooms opened ${hm(s.open)} · ${Math.round((gwNow() - s.open) / 60000)} min · ${s.here} of ${s.all} screen${s.all === 1 ? "" : "s"} here`;
}
/* 📸 Who worked where (bottom): this activity's groups and the moves, for the snapshot */
function historyHTML(devs){
  const s = roomsSpan(); if(!s || !devs.length) return "";
  const moves = devs.flatMap(d => (d.room && d.room.moves) || []);
  return `<details class="gw-hist"><summary>📸 Who worked where</summary><p><b>${hm(s.open)}${s.close ? "–" + hm(s.close) : ""} · ${esc(D.title)}:</b> ${devs.map(d => esc(d.label)).join(" · ")}</p>${moves.length ? `<p class="mv">${moves.map(esc).join(" · ")}</p>` : ""}</details>`;
}
/* the cards are patched, not rebuilt: her half-typed note, the words she picked and an open fold stay as they are */
function gwPaint(){
  const devs = gwDevices(), n = devs.filter(d => typingNow(d.cur)).length;
  const tab = document.querySelector('.stage-btn[data-stage="groups"]'); if(tab){ let b = tab.querySelector(".gw-n"); if(n){ if(!b){ b = document.createElement("span"); b.className = "gw-n"; tab.appendChild(b); } b.textContent = n; } else if(b) b.remove(); }
  pcPaint();
  if(!LW.groupsView()) return;
  const meta = document.getElementById("gw-meta"); if(meta){ meta.innerHTML = gwMetaText(); const all = meta.querySelector("[data-gw-all]"); if(all) all.addEventListener("click", () => { if(!GW.showOld && gwSince() > gwNow() - RECENT) store.set(SINCE_KEY, 0); GW.showOld = !GW.showOld; gwRebuild(); }); }
  const rooms = document.getElementById("gw-rooms"); if(rooms){ const h = roomsHTML(); if(rooms.innerHTML !== h) rooms.innerHTML = h; rooms.hidden = !h; }
  const grid = document.getElementById("gw-grid"); if(!grid) return;
  if(!devs.length){ grid.innerHTML = `<div class="gw-empty">${GW.loaded ? "Nothing yet. When a group opens this -live page, its card appears here (every 10 s)." : "Loading…"}</div>`; return; }
  const empty = grid.querySelector(".gw-empty"); if(empty) empty.remove();
  const want = new Set(devs.map(d => d.dev));
  grid.querySelectorAll(".gw-card").forEach(c => { if(!want.has(c.dataset.dev)) c.remove(); });
  devs.forEach(d => {
    let c = grid.querySelector(`.gw-card[data-dev="${d.dev}"]`);
    if(!c){ grid.insertAdjacentHTML("beforeend", gwCardHTML(d)); c = grid.lastElementChild; wireCard(c); }
    if(!c.dataset.target && d.cur){ c.dataset.tool = d.cur.tool; c.dataset.chat = d.cur.chat; }
    const row = c.dataset.target ? (d.rows.find(r => r.tool + "|" + r.chat === c.dataset.target) || d.cur) : d.cur;
    c.classList.toggle("sent", !!row && row.status === "sent"); c.classList.toggle("typing", typingNow(row)); c.classList.toggle("notext", !row);
    const set = (sel, h) => { const el = c.querySelector(sel); if(el.dataset.h !== h){ el.innerHTML = h; el.dataset.h = h; return el; } return null; };
    set("[data-who]", gwWhoHTML(d, row));
    const rb = set("[data-roster-box]", rosterHTML(d, devs)); if(rb) wireRoster(rb, d);
    set("[data-nudge]", gwNudgesHTML(d));
    const tx = c.querySelector("[data-text]"), sel = getSelection(), inside = sel && sel.rangeCount && !sel.isCollapsed && tx.contains(sel.anchorNode) && Date.now() - selAt < 8000;   /* their new text waits while she is selecting */
    if(!inside){ const h = row ? markedText(row, c.dataset.quote || "") : `<span class="none">(nothing typed yet)</span>`; if(tx.innerHTML !== h) tx.innerHTML = h; }
    set("[data-notes]", row ? gwNotesHTML(row, d.dev) : "");
    const ea = c.querySelector("[data-earlier]"), eh = gwEarlierHTML(d); if(ea.dataset.h !== eh){ const open = ea.open; ea.innerHTML = eh; ea.open = open; ea.dataset.h = eh; }
  });
  const hist = document.getElementById("gw-history"); if(hist){ const h = historyHTML(devs); if(hist.dataset.h !== h){ const open = hist.querySelector("details") && hist.querySelector("details").open; hist.innerHTML = h; hist.dataset.h = h; const dd = hist.querySelector("details"); if(dd && open) dd.open = true; } }
}
function gwRebuild(){ const g = document.getElementById("gw-grid"); if(g) g.innerHTML = ""; gwPaint(); }
async function gwFetch(){
  if(!liveTeacher() || gwBusy || !LW.tools.length) return; gwBusy = true;
  const code = localStorage.getItem("hw-code") || "", rows = []; let err = "", main = null;
  for(const t of LW.tools){
    const res = await livePost({action: "toolList", tool: t.id, code});
    if(res.ok && Array.isArray(res.rows)){ res.rows.forEach(r => { r.tool = t.id; rows.push(r); }); if(t.id === PAGE_ID) main = res; GW.skew = (Number(res.now) || Date.now()) - Date.now(); }
    else { err = res.error === "no-page" ? "old-script" : (res.error || "error"); break; }
  }
  if(LW.board && !err){ const b = await livePost({action: "live", tool: LW.board.id}); if(b.ok && b.live) GW.board = b.live; }
  gwBusy = false;
  if(!err){ GW.rows = rows; GW.rooms = (main && main.rooms) || []; GW.signals = (main && main.signals) || []; GW.decks = (main && main.decks) || []; GW.students = (main && main.students) || [];
    GW.notes = (main && main.notes) || []; GW.at = Date.now(); GW.err = ""; GW.loaded = true; if(typeof onGroupData === "function") onGroupData(); }
  else GW.err = err;
  gwPaint();
}
if(liveTeacher()){ setTimeout(gwFetch, 300); setInterval(() => { if(document.hidden) return; if(LW.groupsView() || document.querySelector(".pc") || !(gwTick++ % 3)) gwFetch(); }, 10000); }
/* she selects words in a group's text: they stay picked until she sends a note or taps ✕ */
document.addEventListener("selectionchange", () => {
  if(!liveTeacher()) return;   /* in 📥 Groups and in 👥 under a chat */
  const sel = getSelection(); if(!sel || sel.isCollapsed || !sel.rangeCount) return;
  const tx = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement).closest(".gw-text"); if(!tx || !tx.contains(sel.focusNode)) return;
  const q = sel.toString().replace(/\s+/g, " ").trim().slice(0, 160); if(!q) return;
  const c = tx.closest(".gw-card"); c.dataset.quote = q; selAt = Date.now(); if(!c.dataset.target) c.dataset.target = c.dataset.tool + "|" + c.dataset.chat; pickLine(c);
});
function pickLine(c){
  const p = c.querySelector("[data-pick]");
  p.innerHTML = c.dataset.quote ? `Words: <b>“${esc(c.dataset.quote)}”</b> <button data-unpick aria-label="Don't point at these words">✕</button> — ✓ Good, ✗ Change, ✎ Correction or a note:` : "";
  const x = p.querySelector("[data-unpick]"); if(x) x.addEventListener("click", () => { delete c.dataset.quote; setMode(c, "note"); if(!c.querySelector("[data-own] input").value) delete c.dataset.target; pickLine(c); gwPaint(); });
}
/* ✎ Correction: the box takes the picked words to type the right version (blue on yellow, as on the feedback page) */
function setMode(c, m){
  const inp = c.querySelector("[data-own] input"), btn = c.querySelector("[data-own] button");
  c.dataset.mode = m; c.classList.toggle("fixing", m === "fix");
  inp.placeholder = m === "fix" ? "Type the correct words…" : "Or type your note to this group…"; btn.textContent = m === "fix" ? "Send correction" : "Send";
  if(m !== "fix" && inp.dataset.fixed){ inp.value = ""; delete inp.dataset.fixed; }
}
function toolMark(c, k){
  const inp = c.querySelector("[data-own] input");
  if(k === "note"){ setMode(c, "note"); inp.focus(); return; }
  if(!c.dataset.quote){ const p = c.querySelector("[data-pick]"); p.textContent = "Select words in their text first ↑"; setTimeout(() => pickLine(c), 2500); return; }
  if(k === "fix"){ if(!c.dataset.target) c.dataset.target = c.dataset.tool + "|" + c.dataset.chat; setMode(c, "fix"); inp.value = c.dataset.quote; inp.dataset.fixed = "1"; inp.focus(); inp.select(); return; }
  sendNote(c, "", k);
}
function wireCard(c){
  const own = c.querySelector("[data-own]"), inp = own.querySelector("input");
  c.querySelectorAll("[data-mk]").forEach(b => { b.addEventListener("mousedown", e => e.preventDefault()); b.addEventListener("click", () => toolMark(c, b.dataset.mk)); });
  inp.addEventListener("keydown", e => { if(e.key === "Escape" && c.dataset.mode === "fix"){ setMode(c, "note"); inp.blur(); } });
  inp.addEventListener("focus", () => { if(!c.dataset.target && c.dataset.tool) c.dataset.target = c.dataset.tool + "|" + c.dataset.chat; });
  inp.addEventListener("blur", () => { if(!inp.value.trim() && !c.dataset.quote) delete c.dataset.target; });
  c.querySelectorAll("[data-quick]").forEach(b => { b.addEventListener("mousedown", e => e.preventDefault()); b.addEventListener("click", () => sendNote(c, b.dataset.quick)); });
  own.addEventListener("submit", e => { e.preventDefault(); if(inp.value.trim()) sendNote(c, inp.value.trim(), c.dataset.mode === "fix" ? "fix" : "note"); });
  c.addEventListener("click", e => { if(!e.target.closest("[data-roster]")) return; rosterOpen = rosterOpen === c.dataset.dev ? null : c.dataset.dev; gwPaint(); });
  const go = c.querySelector("[data-go]"); if(go) go.addEventListener("change", () => { if(go.value) sendNote(c, go.value, "go", {noTarget: true}); go.value = ""; });
}
function wireRoster(box, d){
  box.querySelectorAll("[data-rn]").forEach(b => b.addEventListener("click", async () => {
    const name = b.dataset.rn, devs = gwDevices(), from = devs.find(x => x.people.includes(name)), to = devs.find(x => x.dev === d.dev);
    const code = localStorage.getItem("hw-code") || "", t = hm(gwNow());
    if(from && from.dev !== to.dev) await livePost({action: "toolRoster", tool: PAGE_ID, code, dev: from.dev, names: from.people.filter(x => x !== name)});
    const here = to.people.includes(name), names = here ? to.people.filter(x => x !== name) : to.people.concat([name]);
    const move = here ? `${t} ${name} left ${to.short}` : from && from.dev !== to.dev ? `${t} ${name}: ${from.short} → ${to.short}` : `${t} ${name} → ${to.short}`;
    const res = await livePost({action: "toolRoster", tool: PAGE_ID, code, dev: to.dev, names, move});
    if(res.ok && Array.isArray(res.rooms)){ GW.rooms = res.rooms; GW.at = Date.now(); } gwPaint(); }));
}
async function sendNote(c, note, mark = "note", opts = {}){
  const said = c.querySelector("[data-said]"), [tool, chat] = opts.noTarget ? [PAGE_ID, 0] : String(c.dataset.target || (c.dataset.tool + "|" + c.dataset.chat)).split("|");
  if(!opts.noTarget && (!tool || tool === "undefined")){ said.textContent = "nothing typed yet — your note needs their text"; return; }
  said.textContent = "sending…";
  const res = await livePost({action: "toolNote", tool, code: localStorage.getItem("hw-code") || "", dev: c.dataset.dev, chat: +chat || 0, quote: opts.noTarget ? "" : (c.dataset.quote || ""), note, mark});
  if(res.ok && Array.isArray(res.rows)){
    const sel = getSelection(); if(sel && sel.rangeCount && c.contains(sel.anchorNode)) sel.removeAllRanges();
    if(tool === PAGE_ID || !opts.noTarget){ res.rows.forEach(r => r.tool = tool); GW.rows = GW.rows.filter(r => r.tool !== tool).concat(res.rows); }
    if(tool === PAGE_ID && Array.isArray(res.notes)) GW.notes = res.notes;
    GW.at = Date.now(); delete c.dataset.quote; delete c.dataset.target; c.querySelector("[data-own] input").value = ""; setMode(c, "note"); pickLine(c);
    said.textContent = mark === "go" ? `✓ suggested: ${note} — they can say Not yet` : mark === "say" ? "✓ sent" : `✓ sent to them (${chatName(tool, +chat)}) — they see it within ~10 s`;
    setTimeout(() => { if(said.textContent.startsWith("✓")) said.textContent = ""; }, 6000); gwPaint(); gwFetch();
  } else said.textContent = "not sent: " + (res.error === "offline" ? "no connection" : res.error === "no-page" || res.error === "bad-input" ? "redeploy the script (New version)" : res.error === "no-words" ? "select words in their text first" : res.error || "error");
}
/* 📋 Copy all: every chat, each group's text (drafts marked), her notes under them; "Without names": Group 1, 2, 3… */
function gwCopyText(names){
  const devs = gwDevices(), lab = d => names && d.people.length ? d.label : d.short, out = [`${D.title} — what the groups wrote`];
  LW.tools.forEach(t => {
    const chats = [...new Set(gwRows().filter(r => r.tool === t.id).map(r => r.chat))].sort((a, b) => a - b);
    chats.forEach(i => {
      const rows = devs.map(d => ({d, r: d.rows.find(r => r.tool === t.id && r.chat === i)})).filter(x => x.r && (x.r.text || "").trim()); if(!rows.length) return;
      out.push("", t.chat(i));
      rows.forEach(({d, r}) => { out.push(`${lab(d)}${r.status === "sent" ? "" : " (draft)"}: ${r.text.replace(/\s*\n\s*/g, " ")}`);
        (r.notes || []).filter(n => n.k !== "go" && n.k !== "say").forEach(n => out.push("   " + (n.k === "good" ? `✓ “${n.q}”` : n.k === "change" ? `✗ “${n.q}”` : n.k === "fix" ? `✎ “${n.q}” → ${n.c}` : `💬 ${n.q ? `“${n.q}” — ` : ""}${n.c}`))); });
    });
  });
  return out.length > 1 ? out.join("\n") : "";
}
async function copyText(t){
  try{ await navigator.clipboard.writeText(t); return true; }catch(e){}
  const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
  let ok = false; try{ ok = document.execCommand("copy"); }catch(e){} ta.remove(); return ok;
}
function wireGroups(root){
  root.querySelectorAll("[data-gw-copy]").forEach(b => b.addEventListener("click", async () => {
    const t = gwCopyText(!!b.dataset.gwCopy), was = b.dataset.label || b.textContent; b.dataset.label = was;
    b.textContent = !t ? "Nothing to copy yet" : (await copyText(t)) ? "Copied ✓" : "Couldn't copy"; setTimeout(() => { b.textContent = was; }, 2200); }));
  root.querySelectorAll("[data-gw-fresh]").forEach(b => b.addEventListener("click", () => {
    if(!b.dataset.sure){ b.dataset.sure = "1"; b.textContent = "Hide what's here now? Tap again"; return; }
    store.set(SINCE_KEY, gwNow()); if(LW.onFresh) LW.onFresh(); delete b.dataset.sure; b.textContent = "🧹 Start fresh"; gwRebuild(); }));   /* her 15:31: her own test answers on this page go too */
  /* 📢 to all rooms: the same strip on every screen of this page, with OK */
  const box = root.querySelector("#gw-sayall");
  root.querySelectorAll("[data-say-all]").forEach(b => b.addEventListener("click", () => { box.hidden = !box.hidden; if(!box.hidden) box.querySelector("input").focus(); }));
  const sayAll = async t => { t = String(t || "").trim(); if(!t) return; const devs = gwDevices().filter(d => !d.room || hereNow(d.room)), code = localStorage.getItem("hw-code") || "";
    for(const d of devs) await livePost({action: "toolNote", tool: PAGE_ID, code, dev: d.dev, chat: 0, note: t, mark: "say"});
    box.querySelector("input").value = ""; box.hidden = true; gwFetch(); };
  root.querySelectorAll("[data-say-send]").forEach(b => b.addEventListener("click", () => sayAll(box.querySelector("input").value)));
  root.querySelectorAll("[data-say-quick]").forEach(b => b.addEventListener("click", () => sayAll(b.dataset.sayQuick)));
  if(box) box.querySelector("input").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); sayAll(e.target.value); } });
  gwPaint();
}
