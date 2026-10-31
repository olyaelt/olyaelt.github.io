/* ---------- game pieces (tools 14, her wish 30.10 21:32): a coin, a spinning wheel, a deck of cards ----------
   The same calm motion as the die (her design rule 8): one smooth movement that slows down and stops — no bounce, no jerk at the end,
   reduced motion respected; the flat look of her slides (dark outline, solid offset shadow). Self-contained: the pages call
   gCoinHTML / gToss, gWheel, gDeck. */
const gCalm = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const gEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const gEaseOut = (t, p = 3) => 1 - Math.pow(1 - t, p);
function gAnimate(ms, step, done){
  if(gCalm()){ step(1); if(done) done(); return; }
  const t0 = performance.now(); const f = now => { const t = Math.min(1, (now - t0) / ms); step(t); if(t < 1) requestAnimationFrame(f); else if(done) done(); };
  requestAnimationFrame(f);
}

/* ---------- 🪙 the coin: a real two-sided coin with a rim; tossed up, it turns over and over, slows down and lands softly ---------- */
const G_HEAD = `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="14.5" r="7.2"/><path d="M6.8 34.5c0-7.6 5.9-12 13.2-12s13.2 4.4 13.2 12z"/></svg>`;
function gCoinHTML(face, cls = ""){
  const rot = face === 2 ? 180 : 0;
  return `<span class="gcoin ${cls}" data-face="${face || 0}" data-rot="${rot}" role="img" aria-label="${face === 1 ? "heads" : face === 2 ? "tails" : "a coin"}">
    <span class="gc-body" style="transform:rotateX(${rot}deg)">${Array.from({length: 7}, (_, i) => `<i class="gc-rim" style="transform:translateZ(${((i - 3) * 1.1).toFixed(1)}px)"></i>`).join("")}
      <b class="gc-face gc-heads">${G_HEAD}</b><b class="gc-face gc-tails"><span>1</span></b>${face ? "" : `<b class="gc-face gc-blank"><span>?</span></b>`}</span><i class="gc-shadow"></i></span>`;
}
function gToss(el, final, done){
  const body = el.querySelector(".gc-body"), sh = el.querySelector(".gc-shadow"), blank = el.querySelector(".gc-blank");
  if(blank) blank.remove();
  const start = Number(el.dataset.rot) || 0, target = final === 2 ? 180 : 0, delta = ((target - start) % 360 + 360) % 360;
  const end = start + 360 * 5 + delta, H = el.offsetHeight * .85;
  el.classList.add("tossing");
  gAnimate(1750, t => {
    const u = gEaseOut(t, 2), up = Math.sin(Math.PI * u), r = start + (end - start) * gEaseOut(t, 3);
    body.style.transform = `translateY(${(-H * up).toFixed(1)}px) scale(${(1 + .28 * up).toFixed(3)}) rotateX(${r.toFixed(1)}deg)`;
    if(sh) sh.style.transform = `scale(${(1 - .45 * up).toFixed(3)})`, sh.style.opacity = (.32 - .2 * up).toFixed(2);
  }, () => {
    const rest = end % 360; body.style.transform = `rotateX(${rest}deg)`; if(sh){ sh.style.transform = ""; sh.style.opacity = ""; }
    el.dataset.rot = rest; el.dataset.face = final; el.setAttribute("aria-label", final === 1 ? "heads" : "tails"); el.classList.remove("tossing");
    if(done) done();
  });
}

/* ---------- 🎡 the wheel: tap it, it spins and slows down to a stop; the pointer ticks over each sector; what came up can leave the
   wheel (the other sectors grow), "Put them all back" ---------- */
const G_COLORS = [["#0693E3", "#FFFFFF"], ["#FFD34D", "#1D1D1B"], ["#FF9900", "#1D1D1B"], ["#7BDCB5", "#1D1D1B"], ["#F78DA7", "#1D1D1B"], ["#8ED1FC", "#1D1D1B"], ["#9B51E0", "#FFFFFF"], ["#FCB900", "#1D1D1B"]];
function gWheel(host, items, {remove = true, onPick = null, label = "Spin"} = {}){
  const W = {items: items.map((x, i) => typeof x === "string" ? {t: x, i} : Object.assign({i}, x)), w: items.map(() => 1), angle: 0, busy: false, picked: -1};
  host.innerHTML = `<div class="gwheel"><div class="gw-pointer" aria-hidden="true"></div><button class="gw-disc" aria-label="${gEsc(label)} the wheel"><svg viewBox="-112 -112 224 224"><circle class="gw-under" r="104" cx="3" cy="5"/><g class="gw-rot"></g><circle class="gw-hub" r="17"/><text class="gw-hubt" text-anchor="middle" dy="4">${gEsc(label).toUpperCase()}</text></svg></button></div>`;
  const rot = host.querySelector(".gw-rot"), ptr = host.querySelector(".gw-pointer"), disc = host.querySelector(".gw-disc");
  const pt = (r, a) => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
  const spans = () => { const tot = W.w.reduce((a, b) => a + b, 0) || 1; let a = 0; return W.w.map(w => { const s = a; a += 360 * w / tot; return [s, a]; }); };
  function draw(){
    const sp = spans(), n = W.w.filter(w => w > .5).length || 1, fs = n > 10 ? 8 : n > 7 ? 9.5 : 11;
    rot.setAttribute("transform", `rotate(${W.angle.toFixed(2)})`);
    rot.innerHTML = W.items.map((it, k) => { const [s, e] = sp[k]; if(e - s < .05) return "";
      const [x1, y1] = pt(100, s), [x2, y2] = pt(100, e), big = e - s > 180 ? 1 : 0, [bg, ink] = G_COLORS[it.i % G_COLORS.length], m = (s + e) / 2;
      const path = e - s >= 359.9 ? `<circle r="100" fill="${bg}" class="gw-sec"/>` : `<path class="gw-sec ${k === W.picked ? "on" : ""}" d="M0 0L${x1.toFixed(2)} ${y1.toFixed(2)}A100 100 0 ${big} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}Z" fill="${bg}"/>`;
      const txt = String(it.short || it.t).replace(/\*\*/g, ""), short = txt.length > 22 ? txt.slice(0, 21) + "…" : txt;
      const f = Math.max(6.5, Math.min(fs, 66 / (short.length * .55))), right = m <= 180;   /* fits between the hub and the rim; never upside down */
      const tf = right ? `rotate(${(m - 90).toFixed(2)}) translate(93 ${(f / 3).toFixed(2)})` : `rotate(${(m + 90).toFixed(2)}) translate(-93 ${(f / 3).toFixed(2)})`;
      return path + (W.w[k] > .35 ? `<text class="gw-lbl" fill="${ink}" font-size="${f.toFixed(1)}" text-anchor="${right ? "end" : "start"}" transform="${tf}" opacity="${Math.min(1, W.w[k]).toFixed(2)}">${gEsc(short)}</text>` : ""); }).join("");
  }
  function under(){ const a = ((-W.angle) % 360 + 360) % 360; return spans().findIndex(([s, e]) => a >= s && a < e); }
  function spin(){
    if(W.busy) return; const live = W.items.map((_, k) => k).filter(k => W.w[k] > .5); if(!live.length) return;
    W.busy = true; disc.disabled = true;
    const go = () => {
      const left = W.items.map((_, k) => k).filter(k => W.w[k] > .5), k = left[Math.floor(Math.random() * left.length)], [s, e] = spans()[k];
      const aim = s + (e - s) * (.2 + .6 * Math.random()), a0 = W.angle;
      let a1 = -aim; while(a1 < a0 + 360 * 4) a1 += 360;   /* 4–5 whole turns, clockwise */
      let last = under();
      W.picked = -1;
      gAnimate(4600, t => { W.angle = a0 + (a1 - a0) * gEaseOut(t, 4); draw(); const u = under(); if(u !== last){ last = u; ptr.classList.remove("tick"); void ptr.offsetWidth; ptr.classList.add("tick"); } },
        () => { W.angle = a1 % 360; W.picked = k; draw(); W.busy = false; disc.disabled = false; host.querySelector(".gwheel").classList.add("landed"); if(onPick) onPick(W.items[k], k); });
    };
    host.querySelector(".gwheel").classList.remove("landed");
    if(remove && W.picked > -1){ const k = W.picked, w0 = W.w[k]; W.picked = -1;
      gAnimate(450, t => { W.w[k] = w0 * (1 - gEaseOut(t, 2)); draw(); }, () => { W.w[k] = 0; draw(); setTimeout(go, gCalm() ? 0 : 120); }); }
    else go();
  }
  W.spin = spin;
  W.left = () => W.w.filter((w, k) => w > .5 && k !== W.picked).length;
  W.reset = () => { gAnimate(450, t => { W.w = W.w.map(w => w + (1 - w) * gEaseOut(t, 2)); draw(); }, () => { W.w = W.items.map(() => 1); W.picked = -1; draw(); }); };
  disc.addEventListener("click", spin);
  draw();
  return W;
}

/* ---------- 🃏 a deck: the pile, a card face up; gDeckFly brings the top card out of the pile into the slot and turns it over.
   The page keeps the order (its state survives a re-render); gDeck is a small self-running deck for the preview ---------- */
function gShuffle(a){ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const gPileHTML = (left, label = "Draw a card", cls = "") => `<button class="gd-pile ${cls} ${left ? "" : "empty"}" data-gpile aria-label="${gEsc(label)}">${[1, 2, 3].map(k => `<i style="visibility:${left > k ? "visible" : "hidden"}"></i>`).join("")}<span class="gd-back"></span><span class="gd-left">${left ? `${left} left` : "Shuffle"}</span></button>`;
const gCardHTML = (faceHTML, cls = "") => `<div class="gd-card up ${cls}"><div class="gd-in" style="transform:rotateY(180deg)"><div class="gd-b"></div><div class="gd-f">${faceHTML}</div></div></div>`;
function gDeckFly(pile, slot, faceHTML, done){
  const old = slot.querySelector(".gd-card"); if(old){ old.classList.add("gone"); setTimeout(() => old.remove(), gCalm() ? 0 : 380); }
  const card = document.createElement("div"); card.className = "gd-card"; card.innerHTML = `<div class="gd-in"><div class="gd-b"></div><div class="gd-f">${faceHTML}</div></div>`;
  slot.appendChild(card);
  const a = pile.getBoundingClientRect(), b = card.getBoundingClientRect(), dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
  const inner = card.querySelector(".gd-in"), s0 = Math.min(1, a.width / Math.max(1, b.width));
  gAnimate(820, t => { const m = gEaseOut(t, 3), f = gEaseOut(Math.max(0, (t - .15) / .85), 3), lift = Math.sin(Math.PI * m) * 18;
    card.style.transform = `translate(${(dx * (1 - m)).toFixed(1)}px, ${(dy * (1 - m) - lift).toFixed(1)}px) scale(${(s0 + (1 - s0) * m).toFixed(3)})`;
    inner.style.transform = `rotateY(${(180 * f).toFixed(1)}deg)`; }, () => { card.style.transform = ""; inner.style.transform = "rotateY(180deg)"; card.classList.add("up"); if(done) done(); });
}
function gDeck(host, cards, {face = c => gEsc(c), onDraw = null, label = "Draw a card"} = {}){
  const D = {order: gShuffle(cards.map((_, i) => i)), at: -1, busy: false};
  const left = () => D.order.length - D.at - 1;
  host.innerHTML = `<div class="gdeck">${gPileHTML(left(), label)}<div class="gd-slot"></div></div>`;
  const slot = host.querySelector(".gd-slot");
  const repile = () => { host.querySelector(".gd-pile").outerHTML = gPileHTML(left(), label); host.querySelector(".gd-pile").addEventListener("click", draw); };
  function draw(){
    if(D.busy) return;
    if(!left()){ D.order = gShuffle(cards.map((_, i) => i)); D.at = -1; slot.innerHTML = ""; repile(); return; }
    D.busy = true; D.at++; const c = cards[D.order[D.at]]; repile();
    gDeckFly(host.querySelector(".gd-pile"), slot, face(c), () => { D.busy = false; if(onDraw) onDraw(c, D.order[D.at]); });
  }
  D.draw = draw; D.left = left;
  host.querySelector(".gd-pile").addEventListener("click", draw);
  return D;
}

/* ---------- 🎲 the die (the council's look and motion: a calm tumble that slows down; the faces stop changing half-way, then it settles upright) ---------- */
const G_PIPS = {1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]};
const gDieHTML = (n, cls = "") => `<span class="gdie ${cls} ${n ? "" : "blank"}" role="img" aria-label="${n || "a die"}">${Array.from({length: 9}, (_, k) => `<i class="${n && G_PIPS[n].includes(k + 1) ? "p" : ""}"></i>`).join("")}</span>`;
function gRoll(el, final, done){
  const set = n => { el.querySelectorAll("i").forEach((p, j) => p.classList.toggle("p", G_PIPS[n].includes(j + 1))); el.setAttribute("aria-label", n); };
  el.classList.remove("blank"); let last = 0, prev = 0;
  gAnimate(1500, t => {
    const e = gEaseOut(t, 3), hop = Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t);
    el.style.transform = `translate(${(Math.sin(t * 9) * 6 * (1 - t)).toFixed(1)}px, ${(-26 * hop).toFixed(1)}px) rotate(${(-720 * e).toFixed(1)}deg)`;
    const step = Math.floor(e * 10); if(t < .55 && step !== last){ last = step; let f; do f = 1 + Math.floor(Math.random() * 6); while(f === prev || f === final); prev = f; set(f); }
    else if(t >= .55 && prev !== final){ prev = final; set(final); }
  }, () => { el.style.transform = ""; set(final); if(done) done(); });
}

/* ---------- ⭕ tic-tac-toe (her 21:48): tap a square, it turns over and shows a task; do it → the square is yours (✓) or not this time (✗);
   three in a row (3×3) or four in a row (4×4) wins; the turn passes either way ---------- */
function gTicTacToe(host, tasks, {size = 3, win = 3, marks = ["X", "O"], answer = t => t.a || "", prompt = t => gEsc(t.q || t)} = {}){
  const T = {cells: gShuffle(tasks).slice(0, size * size).map(t => ({t, m: null})), turn: 0, open: -1, shown: false, over: null};
  const lines = (() => { const L = [], ok = (r, c) => r >= 0 && c >= 0 && r < size && c < size;
    for(let r = 0; r < size; r++) for(let c = 0; c < size; c++) [[0, 1], [1, 0], [1, 1], [1, -1]].forEach(([dr, dc]) => { const l = []; for(let k = 0; k < win; k++){ if(!ok(r + dr * k, c + dc * k)) return; l.push((r + dr * k) * size + c + dc * k); } L.push(l); });
    return L; })();
  const markSVG = m => m === marks[0] ? `<svg viewBox="0 0 40 40" class="gt-x"><path d="M9 9L31 31M31 9L9 31"/></svg>` : `<svg viewBox="0 0 40 40" class="gt-o"><circle cx="20" cy="20" r="12"/></svg>`;
  function render(fresh){
    const winLine = T.over && T.over.line, cur = marks[T.turn], o = T.open > -1 ? T.cells[T.open] : null;
    host.innerHTML = `<div class="gttt">
      <div class="gt-board" style="--n:${size}">${T.cells.map((c, k) => `<button class="gt-cell ${c.m ? "taken m" + marks.indexOf(c.m) : ""} ${k === T.open ? "open" : ""} ${winLine && winLine.includes(k) ? "win" : ""} ${fresh === k ? "fresh" : ""}" data-gt="${k}" ${c.m || T.over || (T.open > -1 && k !== T.open) ? "disabled" : ""} aria-label="Square ${k + 1}${c.m ? ": " + c.m : ""}">
        <span class="gt-in"><span class="gt-back">${k + 1}</span><span class="gt-front">${c.m ? markSVG(c.m) : "?"}</span></span></button>`).join("")}</div>
      <div class="gt-side">${T.over ? `<p class="gt-turn big">${T.over.who ? `${markSVG(T.over.who)} wins! 🎉` : "It's a draw!"}</p><button class="btn primary" data-gt-again>Play again</button>`
        : `<p class="gt-turn">${markSVG(cur)} <b>${gEsc(cur)}'s turn</b>${o ? "" : " — choose a square"}</p>
        ${o ? `<div class="gt-task${T.shown ? " shown" : ""}"><p class="gt-q">${prompt(o.t)}</p>${T.shown && answer(o.t) ? `<p class="gt-a">${answer(o.t)}</p>` : ""}
          <div class="gt-acts">${answer(o.t) && !T.shown ? `<button class="btn" data-gt-show>Show the answer</button>` : ""}<button class="btn ok" data-gt-yes>✓ ${gEsc(cur)} takes it</button><button class="btn again" data-gt-no>✗ Not this time</button></div></div>` : ""}`}</div></div>`;
    host.querySelectorAll("[data-gt]").forEach(b => b.addEventListener("click", () => { if(T.open > -1) return; T.open = +b.dataset.gt; T.shown = false; render(); }));
    const on = (q, f) => { const b = host.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-gt-show]", () => { T.shown = true; render(); });
    on("[data-gt-yes]", () => { const k = T.open; T.cells[k].m = marks[T.turn]; T.open = -1; const l = lines.find(l => l.every(i => T.cells[i].m === marks[T.turn]));
      if(l) T.over = {who: marks[T.turn], line: l}; else if(T.cells.every(c => c.m)) T.over = {who: null}; else T.turn = 1 - T.turn; render(k); });
    on("[data-gt-no]", () => { T.open = -1; T.turn = 1 - T.turn; render(); });
    on("[data-gt-again]", () => { T.cells = gShuffle(tasks).slice(0, size * size).map(t => ({t, m: null})); T.turn = 0; T.open = -1; T.over = null; render(); });
  }
  render(); return T;
}

/* ---------- 🐍🪜 snakes and ladders (her 21:48, for revision): 30 squares, turns for 2–3 players; roll the die, the pawn hops square by
   square, a ladder takes it up, a snake down; then a task card from the pile; the first to reach the last square wins ---------- */
function gSnakes(host, tasks, {cols = 6, rows = 5, ladders = [[3, 12], [8, 19], [17, 28]], snakes = [[14, 5], [22, 11], [27, 16]], players = ["Blue", "Orange"], prompt = t => gEsc(t.q || t), answer = t => t.a || ""} = {}){
  const N = cols * rows, S = 100, COLS = ["#0693E3", "#FF9900", "#9B51E0"];
  const cen = k => { const r = Math.floor((k - 1) / cols), i = (k - 1) % cols, c = r % 2 ? cols - 1 - i : i; return [c * S + S / 2, (rows - 1 - r) * S + S / 2]; };
  const G = {pos: players.map(() => 1), turn: 0, busy: false, deck: gShuffle(tasks), at: -1, task: null, shown: false, winner: null, msg: ""};
  const ladderSVG = ([a, b], k) => { const [x1, y1] = cen(a), [x2, y2] = cen(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * 11, ny = dx / L * 11, rungs = Math.floor(L / 22);
    const col = ["#0693E3", "#FF9900", "#9B51E0"][k % 3];
    return `<g class="gs-ladder">${[1, -1].map(s => `<line x1="${x1 + s * nx}" y1="${y1 + s * ny}" x2="${x2 + s * nx}" y2="${y2 + s * ny}" class="gs-rail" stroke="${col}"/>`).join("")}${Array.from({length: rungs}, (_, i) => { const f = (i + .5) / rungs, x = x1 + dx * f, y = y1 + dy * f; return `<line x1="${x + nx}" y1="${y + ny}" x2="${x - nx}" y2="${y - ny}" class="gs-rung" stroke="${col}"/>`; }).join("")}</g>`; };
  const snakePath = ([h, t]) => { const [x1, y1] = cen(h), [x2, y2] = cen(t), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, w = 26;
    return `M${x1} ${y1} C${x1 + dx * .25 + nx * w} ${y1 + dy * .25 + ny * w} ${x1 + dx * .5 - nx * w} ${y1 + dy * .5 - ny * w} ${x1 + dx * .62} ${y1 + dy * .62} S${x1 + dx * .9 + nx * w} ${y1 + dy * .9 + ny * w} ${x2} ${y2}`; };
  const snakeSVG = (s, k) => { const [x1, y1] = cen(s[0]), col = ["#E8493F", "#7BC043", "#F78DA7"][k % 3], d = snakePath(s);
    return `<g class="gs-snake"><path d="${d}" class="gs-sbody-o"/><path d="${d}" class="gs-sbody" stroke="${col}" data-snake="${k}"/><circle cx="${x1}" cy="${y1}" r="13" fill="${col}" class="gs-shead"/><circle cx="${x1 - 5}" cy="${y1 - 3}" r="3.2" fill="#FFF"/><circle cx="${x1 + 5}" cy="${y1 - 3}" r="3.2" fill="#FFF"/><circle cx="${x1 - 5}" cy="${y1 - 3}" r="1.5" fill="#1D1D1B"/><circle cx="${x1 + 5}" cy="${y1 - 3}" r="1.5" fill="#1D1D1B"/></g>`; };
  const squares = Array.from({length: N}, (_, i) => { const k = i + 1, [x, y] = cen(k), c = ["#8BD17C", "#B7E4A0"][(Math.floor((k - 1) / cols) + k) % 2];
    return `<rect x="${x - S / 2 + 2}" y="${y - S / 2 + 2}" width="${S - 4}" height="${S - 4}" rx="10" fill="${k === N ? "#FFD34D" : c}" class="gs-sq"/><text x="${x - S / 2 + 12}" y="${y - S / 2 + 26}" class="gs-n">${k}</text>${k === N ? `<text x="${x}" y="${y + 18}" text-anchor="middle" font-size="40">🏆</text>` : ""}`; }).join("");
  host.innerHTML = `<div class="gsnl"><svg class="gs-board" viewBox="-6 -6 ${cols * S + 12} ${rows * S + 12}"><rect x="-4" y="-4" width="${cols * S + 8}" height="${rows * S + 8}" rx="16" class="gs-frame"/>${squares}${ladders.map(ladderSVG).join("")}${snakes.map(snakeSVG).join("")}<g class="gs-pawns">${players.map((p, i) => `<g class="gs-pawn" data-p="${i}"><circle r="15" fill="${COLS[i]}"/><circle r="5" cy="-4" fill="#FFFFFF" opacity=".55"/></g>`).join("")}</g></svg>
    <div class="gs-side"></div></div>`;
  const svg = host.querySelector(".gs-board"), side = host.querySelector(".gs-side");
  const place = (i, x, y) => { const off = [[-14, 10], [14, 10], [0, -12]][i] || [0, 0]; svg.querySelector(`[data-p="${i}"]`).setAttribute("transform", `translate(${(x + off[0]).toFixed(1)} ${(y + off[1]).toFixed(1)})`); };
  players.forEach((_, i) => place(i, ...cen(1)));
  function panel(){
    const p = G.turn, me = `<span class="gs-dot" style="background:${COLS[p]}"></span>`;
    side.innerHTML = G.winner != null ? `<p class="gt-turn big"><span class="gs-dot" style="background:${COLS[G.winner]}"></span> ${gEsc(players[G.winner])} wins! 🎉</p><button class="btn primary" data-gs-again>Play again</button>`
      : `<p class="gt-turn">${me} <b>${gEsc(players[p])}'s turn</b></p>${G.msg ? `<p class="gs-msg">${G.msg}</p>` : ""}
      ${G.task ? `<div class="gt-task${G.shown ? " shown" : ""}"><p class="gt-q">${prompt(G.task)}</p>${G.shown && answer(G.task) ? `<p class="gt-a">${answer(G.task)}</p>` : ""}<div class="gt-acts">${answer(G.task) && !G.shown ? `<button class="btn" data-gs-show>Show the answer</button>` : ""}<button class="btn ok" data-gs-yes>✓ Got it${G.ladder ? " — up the ladder!" : ""}</button><button class="btn again" data-gs-no>✗ Not quite — back to ${G.from}</button></div></div>`
        : `<button class="gs-diebtn" data-gs-roll aria-label="Roll the die" ${G.busy ? "disabled" : ""}>${gDieHTML(G.lastRoll || 0)}</button><p class="gs-hint">Tap the die</p>`}`;
    const on = (q, f) => { const b = side.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-gs-roll]", roll); on("[data-gs-show]", () => { G.shown = true; panel(); });
    const endTurn = () => { G.busy = false; G.task = null; G.ladder = null; if(G.pos[p] >= N){ G.winner = p; panel(); return; } G.turn = (G.turn + 1) % players.length; panel(); };
    on("[data-gs-yes]", () => { if(G.busy) return; G.busy = true; G.msg = G.ladder ? "🪜 A ladder — up you go!" : ""; const lad = G.ladder; G.task = null; panel();
      if(lad){ const [x1, y1] = cen(lad[0]), [x2, y2] = cen(lad[1]), tmp = document.createElementNS("http://www.w3.org/2000/svg", "path"); tmp.setAttribute("d", `M${x1} ${y1}L${x2} ${y2}`); slide(p, tmp, lad[1], endTurn); } else endTurn(); });
    on("[data-gs-no]", () => { if(G.busy) return; G.busy = true; G.msg = ""; G.task = null; G.ladder = null; panel(); hop(p, G.pos[p], G.from, endTurn); });
    on("[data-gs-again]", () => { G.pos = players.map(() => 1); G.turn = 0; G.winner = null; G.task = null; G.msg = ""; players.forEach((_, i) => place(i, ...cen(1))); panel(); });
  }
  function hop(i, from, to, done){
    if(from === to){ done(); return; }
    const next = from + (to > from ? 1 : -1), [x1, y1] = cen(from), [x2, y2] = cen(next);
    gAnimate(gCalm() ? 0 : 230, t => { const e = gEaseOut(t, 2); place(i, x1 + (x2 - x1) * e, y1 + (y2 - y1) * e - Math.sin(Math.PI * t) * 26); }, () => { G.pos[i] = next; hop(i, next, to, done); });
  }
  function slide(i, path, to, done){
    const L = path.getTotalLength();
    gAnimate(1100, t => { const e = 1 - Math.pow(1 - t, 2) * (1 - t) ; const p = path.getPointAtLength(L * Math.min(1, e)); place(i, p.x, p.y); }, () => { G.pos[i] = to; place(i, ...cen(to)); done(); });
  }
  function roll(){
    if(G.busy) return; G.busy = true; const p = G.turn, n = 1 + Math.floor(Math.random() * 6); G.lastRoll = n; G.msg = ""; G.from = G.pos[p];
    const die = side.querySelector(".gdie"); side.querySelector("[data-gs-roll]").disabled = true;
    gRoll(die, n, () => setTimeout(() => {
      const to = Math.min(N, G.pos[p] + n);
      hop(p, G.pos[p], to, () => {
        /* her rules (eltgeek, 2015): a snake's head — down to its tail, no task; any other square — a task card: right → the move stands
           (at a ladder's foot: up the ladder), wrong → back to the square where the turn started */
        const lad = ladders.find(l => l[0] === to), sn = snakes.findIndex(s => s[0] === to);
        if(sn > -1){ G.msg = "🐍 A snake — down you go!"; slide(p, svg.querySelector(`[data-snake="${sn}"]`), snakes[sn][1], () => { G.busy = false; G.turn = (G.turn + 1) % players.length; panel(); }); return; }
        G.at = (G.at + 1) % G.deck.length; if(G.at === 0) G.deck = gShuffle(tasks); G.task = G.deck[G.at]; G.shown = false; G.ladder = lad || null; G.msg = lad ? "🪜 A ladder! Get it right to climb it." : ""; G.busy = false; panel();
      });
    }, gCalm() ? 0 : 250));
  }
  panel(); return G;
}

/* ---------- ⏱ the timer (her 30.10 22:30: for games like Memo — "not to put pressure on them, it's fun"): a ring that empties
   smoothly; Start / Pause / ↺; 30 s · 1 min · 2 min; at the end a calm pulse and "Time's up", no sound ---------- */
function gTimer(host, {seconds = 30, choices = [30, 60, 120], onEnd = null, autostart = false, compact = false} = {}){
  const T = {total: seconds, left: seconds * 1000, run: false, t0: 0, raf: 0};
  const fmt = ms => { const s = Math.ceil(ms / 1000); return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s); };
  host.innerHTML = `<div class="gtimer ${compact ? "compact" : ""}"><svg viewBox="0 0 100 100" class="gti-ring"><circle cx="50" cy="50" r="44" class="gti-track"/><circle cx="50" cy="50" r="44" class="gti-bar" pathLength="100"/></svg>
    <span class="gti-num" aria-live="polite"></span>${compact ? "" : `<div class="gti-acts"><button class="btn primary" data-ti-go>▶ Start</button><button class="btn" data-ti-reset>↺</button>${choices.length > 1 ? `<span class="gti-ch">${choices.map(c => `<button data-ti-set="${c}" class="${c === seconds ? "on" : ""}">${c >= 60 ? c / 60 + " min" : c + " s"}</button>`).join("")}</span>` : ""}</div>`}</div>`;
  const bar = host.querySelector(".gti-bar"), num = host.querySelector(".gti-num"), box = host.querySelector(".gtimer"), go = host.querySelector("[data-ti-go]");
  const paint = () => { const f = Math.max(0, T.left / (T.total * 1000)); bar.style.strokeDashoffset = (100 * (1 - f)).toFixed(2); num.textContent = T.left > 0 ? fmt(T.left) : "Time's up"; box.classList.toggle("end", T.left <= 0); box.classList.toggle("low", T.left > 0 && T.left <= 5000); if(go) go.textContent = T.run ? "⏸ Pause" : T.left < T.total * 1000 && T.left > 0 ? "▶ Go on" : "▶ Start"; };
  const tick = now => { if(!T.run) return; T.left = Math.max(0, T.end - now); paint(); if(T.left <= 0){ T.run = false; paint(); if(onEnd) onEnd(); return; } T.raf = requestAnimationFrame(tick); };
  T.start = () => { if(T.run) return; if(T.left <= 0) T.left = T.total * 1000; T.run = true; T.end = performance.now() + T.left; T.raf = requestAnimationFrame(tick); paint(); };
  T.pause = () => { T.run = false; cancelAnimationFrame(T.raf); paint(); };
  T.reset = (s) => { T.pause(); if(s) T.total = s; T.left = T.total * 1000; paint(); };
  if(go) go.addEventListener("click", () => T.run ? T.pause() : T.start());
  const r = host.querySelector("[data-ti-reset]"); if(r) r.addEventListener("click", () => T.reset());
  host.querySelectorAll("[data-ti-set]").forEach(b => b.addEventListener("click", () => { host.querySelectorAll("[data-ti-set]").forEach(x => x.classList.toggle("on", x === b)); T.reset(+b.dataset.tiSet); }));
  paint(); if(autostart) T.start();
  return T;
}

/* ---------- ⌛ the hourglass (her 22:30: "talk for a minute", "hold on for a minute"): the sand runs down smoothly; tap it → it turns
   over and starts again ---------- */
function gHourglass(host, {seconds = 60, choices = [30, 60, 120], onEnd = null} = {}){
  const H = {total: seconds, f: 0, run: false, raf: 0};
  host.innerHTML = `<div class="ghg"><button class="ghg-btn" aria-label="Turn the hourglass over"><svg viewBox="0 0 120 180" class="ghg-svg"><g class="ghg-rot">
    <defs><clipPath id="ghgTop"><path d="M26 22 H94 C94 58 66 72 61 88 H59 C54 72 26 58 26 22Z"/></clipPath><clipPath id="ghgBot"><path d="M59 92 H61 C66 108 94 122 94 158 H26 C26 122 54 108 59 92Z"/></clipPath></defs>
    <path d="M26 22 H94 C94 58 66 72 61 90 C66 108 94 122 94 158 H26 C26 122 54 108 59 90 C54 72 26 58 26 22Z" class="ghg-glass"/>
    <g clip-path="url(#ghgTop)"><rect x="20" width="80" class="ghg-sand ghg-top" y="40" height="60"/></g>
    <g clip-path="url(#ghgBot)"><path class="ghg-sand ghg-pile" d=""/></g>
    <line x1="60" y1="88" x2="60" y2="156" class="ghg-stream"/>
    <path d="M26 22 H94 C94 58 66 72 61 90 C66 108 94 122 94 158 H26 C26 122 54 108 59 90 C54 72 26 58 26 22Z" class="ghg-line"/>
    <rect x="12" y="8" width="96" height="14" rx="5" class="ghg-cap"/><rect x="12" y="158" width="96" height="14" rx="5" class="ghg-cap"/>
    <line x1="18" y1="22" x2="18" y2="158" class="ghg-post"/><line x1="102" y1="22" x2="102" y2="158" class="ghg-post"/></g></svg></button>
    <div class="ghg-side"><span class="ghg-num"></span>${choices.length > 1 ? `<span class="gti-ch">${choices.map(c => `<button data-hg-set="${c}" class="${c === seconds ? "on" : ""}">${c >= 60 ? c / 60 + " min" : c + " s"}</button>`).join("")}</span>` : ""}<span class="ghg-hint">Tap the hourglass to start</span></div></div>`;
  const top = host.querySelector(".ghg-top"), pile = host.querySelector(".ghg-pile"), stream = host.querySelector(".ghg-stream"), rot = host.querySelector(".ghg-rot"), num = host.querySelector(".ghg-num"), box = host.querySelector(".ghg"), hint = host.querySelector(".ghg-hint");
  function paint(){
    const f = H.f, topH = 62 * Math.pow(1 - f, .8), y = 88 - topH; top.setAttribute("y", y.toFixed(1)); top.setAttribute("height", (topH + 4).toFixed(1));
    const ph = 46 * Math.pow(f, .75), base = 158, peak = base - ph - 6 * Math.min(1, f * 4);
    pile.setAttribute("d", f <= 0 ? "" : `M20 ${base + 2} L20 ${(base - ph).toFixed(1)} Q60 ${peak.toFixed(1)} 100 ${(base - ph).toFixed(1)} L100 ${base + 2}Z`);
    stream.style.opacity = H.run && f < 1 ? 1 : 0; stream.setAttribute("y2", (base - ph - 2).toFixed(1));
    const left = Math.ceil(H.total * (1 - f)); num.textContent = f >= 1 ? "Time's up" : left >= 60 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : `${left} s`;
    box.classList.toggle("end", f >= 1);
  }
  const tick = now => { if(!H.run) return; H.f = Math.min(1, (now - H.t0) / (H.total * 1000)); paint(); if(H.f >= 1){ H.run = false; paint(); if(onEnd) onEnd(); return; } H.raf = requestAnimationFrame(tick); };
  function start(){ H.f = 0; H.run = true; H.t0 = performance.now(); hint.textContent = "Tap to turn it over again"; H.raf = requestAnimationFrame(tick); }
  function flip(){
    cancelAnimationFrame(H.raf); const was = H.run || H.f > 0; H.run = false;
    if(!was || gCalm()){ start(); return; }
    gAnimate(650, t => { rot.style.transform = `rotate(${(180 * gEaseOut(t, 3)).toFixed(1)}deg)`; }, () => { rot.style.transform = ""; H.f = 0; paint(); start(); });
  }
  host.querySelector(".ghg-btn").addEventListener("click", flip);
  host.querySelectorAll("[data-hg-set]").forEach(b => b.addEventListener("click", () => { host.querySelectorAll("[data-hg-set]").forEach(x => x.classList.toggle("on", x === b)); cancelAnimationFrame(H.raf); H.run = false; H.total = +b.dataset.hgSet; H.f = 0; hint.textContent = "Tap the hourglass to start"; paint(); }));
  paint(); return H;
}

/* ---------- 🧠 Memo (Olga Akimkina; her 22:30: a warmer): look at the list for 30 seconds — it hides — say what you remember — Check:
   tap the ones you remembered ---------- */
function gMemo(host, items, {seconds = 30, show = t => gEsc(t)} = {}){
  const M = {phase: "ready", got: new Set()};
  function render(){
    if(M.phase === "ready") host.innerHTML = `<div class="gmemo"><p class="gm-big">${items.length} expressions · ${seconds} seconds to remember them</p><button class="btn primary" data-gm-go>▶ Show them</button></div>`;
    else if(M.phase === "look") { host.innerHTML = `<div class="gmemo look"><div class="gm-timer"></div><ul class="gm-list">${items.map(t => `<li>${show(t)}</li>`).join("")}</ul><button class="btn" data-gm-hide>Hide them now</button></div>`;
      gTimer(host.querySelector(".gm-timer"), {seconds, compact: true, autostart: true, onEnd: () => { M.phase = "recall"; render(); }}); }
    else if(M.phase === "recall") host.innerHTML = `<div class="gmemo"><p class="gm-big">What do you remember? Take turns: one expression each.</p><div class="gm-cover">${items.map(() => `<span></span>`).join("")}</div><button class="btn primary" data-gm-check>Check</button></div>`;
    else host.innerHTML = `<div class="gmemo"><p class="gm-big">Tap the ones you remembered — <b>${M.got.size} of ${items.length}</b></p><ul class="gm-list check">${items.map((t, k) => `<li><button class="${M.got.has(k) ? "on" : ""}" data-gm-k="${k}">${show(t)}</button></li>`).join("")}</ul><button class="btn" data-gm-again>↺ Again</button></div>`;
    const on = (q, f) => host.querySelectorAll(q).forEach(b => b.addEventListener("click", () => f(b)));
    on("[data-gm-go]", () => { M.phase = "look"; render(); });
    on("[data-gm-hide]", () => { M.phase = "recall"; render(); });
    on("[data-gm-check]", () => { M.phase = "check"; render(); });
    on("[data-gm-k]", b => { const k = +b.dataset.gmK; M.got.has(k) ? M.got.delete(k) : M.got.add(k); render(); });
    on("[data-gm-again]", () => { M.phase = "ready"; M.got.clear(); render(); });
  }
  render(); return M;
}

/* ---------- 🧠 Memory / Pelmanism (Olga Lifshits): the cards face down; turn two over — two halves of one expression stay up, and you
   use it in a true sentence; otherwise they turn back ---------- */
function gMemory(host, pairs, {cols = 4} = {}){
  const cards = gShuffle(pairs.flatMap((p, i) => [{i, t: p[0], s: 0}, {i, t: p[1], s: 1}]));
  const M = {up: [], done: new Set(), busy: false, last: null};
  host.innerHTML = `<div class="gmem"><div class="gmm-grid" style="--c:${cols}">${cards.map((c, k) => `<button class="gmm-card" data-mm="${k}" aria-label="Card ${k + 1}"><span class="gmm-in"><span class="gmm-b"></span><span class="gmm-f">${gEsc(c.t)}</span></span></button>`).join("")}</div><div class="gmm-side"><p class="gmm-msg">Turn over two cards.</p><p class="gmm-n"></p></div></div>`;
  const msg = host.querySelector(".gmm-msg"), cnt = host.querySelector(".gmm-n");
  const paint = () => { cnt.textContent = `${M.done.size} of ${pairs.length} pairs`; };
  host.querySelectorAll("[data-mm]").forEach(b => b.addEventListener("click", () => {
    const k = +b.dataset.mm; if(M.busy || M.up.includes(k) || M.done.has(cards[k].i)) return;
    b.classList.add("up"); M.up.push(k);
    if(M.up.length < 2){ msg.textContent = "Now one more."; return; }
    const [a, c] = M.up.map(x => cards[x]);
    if(a.i === c.i){ M.done.add(a.i); M.up.forEach(x => host.querySelector(`[data-mm="${x}"]`).classList.add("got")); const p = pairs[a.i]; M.up = [];
      msg.innerHTML = `✓ <b>${gEsc(p[0])} ${gEsc(p[1])}</b> — use it in a true sentence!`; paint();
      if(M.done.size === pairs.length) msg.innerHTML += `<br>🎉 All the pairs!`; }
    else { M.busy = true; msg.textContent = "Not a pair — remember where they are…"; setTimeout(() => { M.up.forEach(x => host.querySelector(`[data-mm="${x}"]`).classList.remove("up")); M.up = []; M.busy = false; msg.textContent = "Turn over two cards."; }, gCalm() ? 900 : 1600); }
  }));
  paint(); return M;
}

/* ---------- ⬢ Blockbusters / Hex (her 22:30): a board of hexagons, each a task; blue joins left and right, orange top and bottom;
   do the task → the hexagon is yours; the turn passes either way ---------- */
function gHex(host, tasks, {n = 5, teams = ["Blue", "Orange"], letter = t => (String(t.a || "").replace(/[^A-Za-z]/g, "")[0] || "?").toUpperCase(), prompt = t => gEsc(t.q || t), answer = t => gEsc(t.a || "")} = {}){
  const H = {cells: gShuffle(tasks).slice(0, n * n).map(t => ({t, o: -1})), turn: 0, open: -1, shown: false, win: null};
  const R = 30, W = Math.sqrt(3) * R, pos = k => { const r = Math.floor(k / n), q = k % n; return [W * (q + r / 2) + W, 1.5 * R * r + R + 6]; };
  const nb = k => { const r = Math.floor(k / n), q = k % n; return [[q + 1, r], [q - 1, r], [q, r + 1], [q, r - 1], [q + 1, r - 1], [q - 1, r + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => b * n + a); };
  const won = t => { const start = H.cells.map((_, k) => k).filter(k => H.cells[k].o === t && (t === 0 ? k % n === 0 : k < n)), seen = new Set(start), q = start.slice();
    while(q.length){ const k = q.shift(); if(t === 0 ? k % n === n - 1 : Math.floor(k / n) === n - 1) return true; nb(k).forEach(j => { if(!seen.has(j) && H.cells[j].o === t){ seen.add(j); q.push(j); } }); } return false; };
  const hexPath = ([x, y]) => Array.from({length: 6}, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return `${(x + R * Math.cos(a)).toFixed(1)},${(y + R * Math.sin(a)).toFixed(1)}`; }).join(" ");
  const COL = ["#0693E3", "#FF9900"];
  function render(){
    const w = W * (n + (n - 1) / 2) + W * 1.2, h = 1.5 * R * (n - 1) + 2 * R + 14, o = H.open > -1 ? H.cells[H.open] : null;
    const [x0] = pos(0), [xr] = pos(n - 1), [, yb] = pos(n * (n - 1)), [xb0] = pos(n * (n - 1)), [xbr] = pos(n * n - 1);
    const edges = `<line x1="${x0 - W * .75}" y1="${R * .4}" x2="${x0 - W * .75 + W * (n - 1) / 2}" y2="${yb - R * .4}" class="gh-edge" stroke="${COL[0]}"/><line x1="${xr + W * .75}" y1="${R * .4}" x2="${xbr + W * .75}" y2="${yb - R * .4}" class="gh-edge" stroke="${COL[0]}"/>
      <line x1="${x0 - W / 2}" y1="${2}" x2="${xr + W / 2}" y2="${2}" class="gh-edge" stroke="${COL[1]}"/><line x1="${xb0 - W / 2}" y1="${yb + R + 4}" x2="${xbr + W / 2}" y2="${yb + R + 4}" class="gh-edge" stroke="${COL[1]}"/>`;
    host.innerHTML = `<div class="ghex"><svg viewBox="0 -4 ${w.toFixed(0)} ${(h + 6).toFixed(0)}" class="gh-board">${edges}${H.cells.map((c, k) => { const p = pos(k);
      return `<g class="gh-cell ${c.o > -1 ? "taken" : ""} ${k === H.open ? "open" : ""}" data-hx="${k}" tabindex="${c.o > -1 || H.win ? -1 : 0}" role="button" aria-label="Hexagon ${letter(c.t)}"><polygon points="${hexPath(p)}" fill="${c.o > -1 ? COL[c.o] : k === H.open ? "#FFF8C4" : "#FFFFFF"}"/><text x="${p[0]}" y="${p[1] + 8}" text-anchor="middle">${gEsc(letter(c.t))}</text></g>`; }).join("")}</svg>
      <div class="gt-side">${H.win != null ? `<p class="gt-turn big"><span class="gs-dot" style="background:${COL[H.win]}"></span> ${gEsc(teams[H.win])} wins! 🎉</p><button class="btn primary" data-hx-again>Play again</button>`
        : `<p class="gt-turn"><span class="gs-dot" style="background:${COL[H.turn]}"></span> <b>${gEsc(teams[H.turn])}'s turn</b> <span class="gh-goal">${H.turn ? "top ↕ bottom" : "left ↔ right"}</span></p>
        ${o ? `<div class="gt-task${H.shown ? " shown" : ""}"><p class="gt-q">${prompt(o.t)}</p>${H.shown ? `<p class="gt-a">${answer(o.t)}</p>` : ""}<div class="gt-acts">${!H.shown ? `<button class="btn" data-hx-show>Show the answer</button>` : ""}<button class="btn ok" data-hx-yes>✓ ${gEsc(teams[H.turn])} takes it</button><button class="btn again" data-hx-no>✗ Not this time</button></div></div>` : `<p class="gs-hint">Choose a hexagon: its answer starts with that letter.</p>`}`}</div></div>`;
    host.querySelectorAll("[data-hx]").forEach(g => { const pick = () => { const k = +g.dataset.hx; if(H.win != null || H.open > -1 || H.cells[k].o > -1) return; H.open = k; H.shown = false; render(); };
      g.addEventListener("click", pick); g.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); pick(); } }); });
    const on = (q, f) => { const b = host.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-hx-show]", () => { H.shown = true; render(); });
    on("[data-hx-yes]", () => { H.cells[H.open].o = H.turn; H.open = -1; if(won(H.turn)) H.win = H.turn; else H.turn = 1 - H.turn; render(); });
    on("[data-hx-no]", () => { H.open = -1; H.turn = 1 - H.turn; render(); });
    on("[data-hx-again]", () => { H.cells = gShuffle(tasks).slice(0, n * n).map(t => ({t, o: -1})); H.turn = 0; H.win = null; render(); });
  }
  render(); return H;
}

/* ---------- ▪ Dots and boxes (her blog, 2015): first the task card — right → draw one line (a closed box is yours, and you go again);
   wrong → the turn passes ---------- */
function gDots(host, tasks, {n = 4, players = ["Blue", "Orange"], prompt = t => gEsc(t.q || t), answer = t => gEsc(t.a || "")} = {}){
  const COL = ["#0693E3", "#FF9900"], G = {lines: {}, boxes: {}, turn: 0, phase: "task", deck: gShuffle(tasks), at: 0, shown: false};
  const S = 60, P = 24, size = P * 2 + S * (n - 1), key = (a, b) => a < b ? a + "-" + b : b + "-" + a;
  const boxesOf = k => { const [a, b] = k.split("-").map(Number), out = [], r = i => Math.floor(i / n), c = i => i % n;
    if(b - a === 1){ if(r(a) > 0) out.push(a - n); if(r(a) < n - 1) out.push(a); } else { if(c(a) > 0) out.push(a - 1); if(c(a) < n - 1) out.push(a); } return out; };
  const boxDone = t => [key(t, t + 1), key(t, t + n), key(t + 1, t + n + 1), key(t + n, t + n + 1)].every(k => G.lines[k] != null);
  const xy = i => [P + (i % n) * S, P + Math.floor(i / n) * S];
  function render(){
    const all = []; for(let i = 0; i < n * n; i++){ if(i % n < n - 1) all.push(key(i, i + 1)); if(i < n * (n - 1)) all.push(key(i, i + n)); }
    const total = (n - 1) * (n - 1), score = [0, 1].map(p => Object.values(G.boxes).filter(o => o === p).length), over = Object.keys(G.boxes).length === total, t = G.deck[G.at % G.deck.length];
    host.innerHTML = `<div class="gdots"><svg viewBox="0 0 ${size} ${size}" class="gdt-board">
      ${Object.entries(G.boxes).map(([b, o]) => { const [x, y] = xy(+b); return `<rect x="${x + 4}" y="${y + 4}" width="${S - 8}" height="${S - 8}" rx="6" fill="${COL[o]}" opacity=".85"/>`; }).join("")}
      ${all.map(k => { const [a, b] = k.split("-").map(Number), [x1, y1] = xy(a), [x2, y2] = xy(b), o = G.lines[k];
        return `<g class="gdt-l ${o != null ? "on" : G.phase === "line" ? "free" : ""}" data-dl="${k}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="gdt-line" ${o != null ? `style="stroke:${COL[o]}"` : ""}/><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="gdt-hit"/></g>`; }).join("")}
      ${Array.from({length: n * n}, (_, i) => { const [x, y] = xy(i); return `<circle cx="${x}" cy="${y}" r="6" class="gdt-dot"/>`; }).join("")}</svg>
      <div class="gt-side">${over ? `<p class="gt-turn big">${score[0] === score[1] ? "It's a draw!" : `<span class="gs-dot" style="background:${COL[score[0] > score[1] ? 0 : 1]}"></span> ${gEsc(players[score[0] > score[1] ? 0 : 1])} wins! 🎉`}</p>`
        : `<p class="gt-turn"><span class="gs-dot" style="background:${COL[G.turn]}"></span> <b>${gEsc(players[G.turn])}'s turn</b></p>
        ${G.phase === "task" ? `<div class="gt-task${G.shown ? " shown" : ""}"><p class="gt-q">${prompt(t)}</p>${G.shown ? `<p class="gt-a">${answer(t)}</p>` : ""}<div class="gt-acts">${!G.shown ? `<button class="btn" data-dt-show>Show the answer</button>` : ""}<button class="btn ok" data-dt-yes>✓ Got it — draw a line</button><button class="btn again" data-dt-no>✗ Not quite</button></div></div>`
          : `<p class="gs-msg">Draw one line between two dots.</p>`}`}
        <p class="gdt-score">${players.map((p, i) => `<span class="gs-dot" style="background:${COL[i]}"></span> ${score[i]}`).join(" &nbsp; ")}</p></div></div>`;
    const on = (q, f) => { const b = host.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-dt-show]", () => { G.shown = true; render(); });
    on("[data-dt-yes]", () => { G.phase = "line"; render(); });
    on("[data-dt-no]", () => { G.at++; G.shown = false; G.turn = 1 - G.turn; render(); });
    host.querySelectorAll(".gdt-l.free").forEach(l => l.addEventListener("click", () => { const k = l.dataset.dl; G.lines[k] = G.turn; let closed = false;
      boxesOf(k).forEach(b => { if(G.boxes[b] == null && boxDone(b)){ G.boxes[b] = G.turn; closed = true; } });
      G.at++; G.shown = false; G.phase = "task"; if(!closed) G.turn = 1 - G.turn; render(); }));
  }
  render(); return G;
}

/* ---------- 🎲 the word die (Olga Akimkina, Irina Dubovitskaya): draw a word, roll the die — the face says what to do with it ---------- */
function gWordDie(host, words, {faces = ["Explain it", "Give an example", "Ask a question with it", "Say the opposite or a synonym", "Two collocations", "Your choice!"], show = w => gEsc(w)} = {}){
  const G = {deck: gShuffle(words), at: -1, n: 0, busy: false};
  host.innerHTML = `<div class="gwd"><div class="gwd-deck"></div><button class="gs-diebtn" data-wd-roll aria-label="Roll the die">${gDieHTML(0)}</button><p class="gwd-task" aria-live="polite"></p>
    <ol class="gwd-faces">${faces.map((f, i) => `<li data-face="${i + 1}"><b>${i + 1}</b> ${gEsc(f)}</li>`).join("")}</ol></div>`;
  gDeck(host.querySelector(".gwd-deck"), words, {face: w => `<span class="gd-k">Your word</span><span style="font-size:1.4rem">${show(w)}</span>`, label: "Draw a word"});
  const task = host.querySelector(".gwd-task");
  host.querySelector("[data-wd-roll]").addEventListener("click", () => { if(G.busy) return; G.busy = true; const n = 1 + Math.floor(Math.random() * 6); task.textContent = "";
    host.querySelectorAll(".gwd-faces li").forEach(li => li.classList.remove("on"));
    gRoll(host.querySelector(".gdie"), n, () => { G.busy = false; task.textContent = faces[n - 1]; host.querySelector(`.gwd-faces li[data-face="${n}"]`).classList.add("on"); }); });
  return G;
}

/* ---------- 🖼 Big reveal (her warmers post, after Tekhnologic): a picture under numbered tiles; open them one by one and guess as early as
   you can what it is. With tasks: tap a tile, its task appears — right → the tile opens, wrong → it stays ---------- */
function gReveal(host, {img, alt = "", cols = 4, rows = 3, tasks = null, prompt = t => gEsc(t.q || t), answer = t => gEsc(t.a || ""),
    ask = "What's in the picture? Guess as early as you can.", say = ["It might be …", "It looks like …", "I think it's …"]} = {}){
  const N = cols * rows, R = {open: new Set(), sel: -1, shown: false, deck: tasks && tasks.length ? gShuffle(tasks) : null, at: -1};
  const PAL = [["#FFD34D", "#1D1D1B"], ["#7BDCB5", "#1D1D1B"], ["#F78DA7", "#1D1D1B"], ["#8ED1FC", "#1D1D1B"], ["#FF9900", "#1D1D1B"]];
  host.innerHTML = `<div class="grv"><div class="grv-pic" style="--c:${cols};--r:${rows}"><img src="${gEsc(img)}" alt="${gEsc(alt)}">
    <div class="grv-tiles">${Array.from({length: N}, (_, i) => { const [bg, fg] = PAL[(i % cols + 2 * Math.floor(i / cols)) % PAL.length];
      return `<button class="grv-tile" data-rv="${i}" style="background:${bg};color:${fg}" aria-label="Tile ${i + 1}">${i + 1}</button>`; }).join("")}</div></div>
    <div class="grv-side gt-side"></div></div>`;
  const pic = host.querySelector(".grv-pic"), side = host.querySelector(".grv-side"), tile = i => pic.querySelector(`[data-rv="${i}"]`), im = pic.querySelector("img");
  const fit = () => { if(im.naturalWidth) pic.style.aspectRatio = im.naturalWidth + " / " + im.naturalHeight; }; if(im.complete) fit(); else im.addEventListener("load", fit);
  const openTile = i => { R.open.add(i); const b = tile(i); b.classList.remove("sel"); b.classList.add("gone"); b.disabled = true; };
  function panel(){
    const all = R.open.size === N, t = R.sel > -1 && R.deck ? R.deck[R.at % R.deck.length] : null;
    side.innerHTML = `<p class="grv-ask">${gEsc(ask)}</p>${say.length ? `<p class="grv-say">${say.map(gEsc).join(" &nbsp;·&nbsp; ")}</p>` : ""}
      ${t ? `<div class="gt-task${R.shown ? " shown" : ""}"><p class="gt-q">${prompt(t)}</p>${R.shown && answer(t) ? `<p class="gt-a">${answer(t)}</p>` : ""}<div class="gt-acts">${answer(t) && !R.shown ? `<button class="btn" data-rv-show>Show the answer</button>` : ""}<button class="btn ok" data-rv-yes>✓ Got it — open it</button><button class="btn again" data-rv-no>✗ Not this time</button></div></div>`
        : all ? "" : `<p class="gs-hint" style="margin:0">${R.deck ? "Choose a tile: get its task right and it opens." : "Tap a tile to open it."}</p>`}
      <p class="grv-n">${R.open.size} of ${N} open</p>
      ${all ? `<button class="btn" data-rv-cover>↺ Cover it again</button>` : `<button class="btn" data-rv-all>👀 Show the whole picture</button>`}`;
    const on = (q, f) => { const b = side.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-rv-show]", () => { R.shown = true; panel(); });
    on("[data-rv-yes]", () => { openTile(R.sel); R.sel = -1; panel(); });
    on("[data-rv-no]", () => { tile(R.sel).classList.remove("sel"); R.sel = -1; panel(); });
    on("[data-rv-all]", () => { if(R.sel > -1) tile(R.sel).classList.remove("sel"); R.sel = -1; let k = 0;
      for(let i = 0; i < N; i++) if(!R.open.has(i)){ R.open.add(i); setTimeout(() => openTile(i), gCalm() ? 0 : 70 * k++); } panel(); });
    on("[data-rv-cover]", () => { R.open.clear(); pic.querySelectorAll(".grv-tile").forEach(b => { b.classList.remove("gone"); b.disabled = false; }); panel(); });
  }
  pic.querySelectorAll(".grv-tile").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.rv;
    if(!R.deck){ openTile(i); panel(); return; }
    if(R.sel > -1) tile(R.sel).classList.remove("sel"); else { R.at++; if(R.at && R.at % R.deck.length === 0) R.deck = gShuffle(tasks); R.shown = false; }
    R.sel = i; b.classList.add("sel"); panel(); }));
  panel(); return R;
}

/* ---------- 🪿 the goose track (her opinions board game, 2015): flip the coin — heads one step, tails two; the square says what to talk
   about; a goose 🪿 = flip again; the first to the finish wins ---------- */
function gGoose(host, squares, {cols = 6, goose = 5, players = ["Blue", "Orange"], task = "", show = s => gEsc(s.t || s), detail = s => s.q ? gEsc(s.q) : ""} = {}){
  const COLS = ["#0693E3", "#FF9900", "#9B51E0"], PAL = ["#FFF3C4", "#D6F5E8", "#FFE0EA", "#DDF1FF"];
  const cells = [{start: true}]; squares.forEach(s => { if(goose && cells.length % goose === 0) cells.push({goose: true}); cells.push(s); }); cells.push({finish: true});
  /* on a phone the track folds into 4 columns */
  let C = cols; const N = cells.length, rc = k => { const r = Math.floor(k / C), i = k % C; return [r, r % 2 ? C - 1 - i : i]; };
  const G = {pos: players.map(() => 0), turn: 0, busy: false, phase: "flip", winner: null, msg: "", face: 0};
  host.innerHTML = `<div class="ggo"><div class="ggo-board" style="--c:${cols}"><svg class="ggo-road" aria-hidden="true"></svg>
    ${cells.map((c, k) => { const [r, col] = rc(k);
      return `<div class="ggo-sq${c.start ? " start" : c.finish ? " finish" : c.goose ? " goose" : ""}" data-k="${k}" style="grid-row:${r + 1};grid-column:${col + 1};${c.start || c.finish || c.goose ? "" : `background:${PAL[k % PAL.length]}`}">${c.start || c.finish || c.goose ? "" : `<span class="ggo-n">${k}</span>`}<span class="ggo-t">${c.start ? "Start" : c.finish ? "🏁" : c.goose ? "🪿" : show(c)}</span></div>`; }).join("")}
    ${players.map((p, i) => `<span class="ggo-pawn" data-p="${i}" style="background:${COLS[i]}" aria-label="${gEsc(p)}"></span>`).join("")}</div><div class="ggo-side gt-side"></div></div>`;
  const board = host.querySelector(".ggo-board"), side = host.querySelector(".ggo-side"), road = host.querySelector(".ggo-road");
  const cen = k => { const s = board.querySelector(`[data-k="${k}"]`); return [s.offsetLeft + s.offsetWidth / 2, s.offsetTop + s.offsetHeight / 2]; };
  /* the pawns stand on the bottom edge of their square, so the words stay readable */
  const foot = k => { const s = board.querySelector(`[data-k="${k}"]`); return [s.offsetLeft + s.offsetWidth / 2, s.offsetTop + s.offsetHeight - 2]; };
  const OFF = [[-15, 0], [15, 0], [0, 0]];
  const place = (i, x, y) => { const p = board.querySelector(`[data-p="${i}"]`), o = OFF[i] || [0, 0]; p.style.left = (x + o[0]) + "px"; p.style.top = (y + o[1]) + "px"; };
  function layout(){
    const want = host.offsetWidth && host.offsetWidth < 560 ? Math.min(cols, 4) : cols;
    if(want !== C || !layout.done){ C = want; layout.done = true; board.style.setProperty("--c", C); cells.forEach((_, k) => { const [r, col] = rc(k), el = board.querySelector(`[data-k="${k}"]`); el.style.gridRow = r + 1; el.style.gridColumn = col + 1; }); }
    road.setAttribute("viewBox", `0 0 ${board.offsetWidth} ${board.offsetHeight}`); road.setAttribute("width", board.offsetWidth); road.setAttribute("height", board.offsetHeight);
    const pts = cells.map((_, k) => cen(k).join(",")).join(" ");
    road.innerHTML = `<polyline points="${pts}" class="ggo-road-o"/><polyline points="${pts}" class="ggo-road-i"/>`;
    if(!G.busy) players.forEach((_, i) => place(i, ...foot(G.pos[i])));
  }
  if(window.ResizeObserver) new ResizeObserver(layout).observe(board);
  const coinSm = f => gCoinHTML(f, "sm");
  function panel(){
    const p = G.turn, me = `<span class="gs-dot" style="background:${COLS[p]}"></span>`, c = cells[G.pos[p]];
    side.innerHTML = G.winner != null ? `<p class="gt-turn big"><span class="gs-dot" style="background:${COLS[G.winner]}"></span> ${gEsc(players[G.winner])} wins! 🎉</p><button class="btn primary" data-go-again>Play again</button>`
      : `<p class="gt-turn">${me} <b>${gEsc(players[p])}'s turn</b></p>${G.msg ? `<p class="gs-msg">${G.msg}</p>` : ""}
      ${G.phase === "task" ? `<div class="gt-task"><p class="gt-q">${show(c)}</p>${detail(c) ? `<p class="ggo-d">${detail(c)}</p>` : ""}${task ? `<p class="ggo-task">${task}</p>` : ""}</div><button class="btn primary" data-go-next>Next player ▸</button>`
        : `<button class="ggo-coin" data-go-flip aria-label="Flip the coin" ${G.busy ? "disabled" : ""}>${gCoinHTML(G.face, "md")}</button><p class="gs-hint">Tap the coin: heads ${coinSm(1)} one step, tails ${coinSm(2)} two</p>`}`;
    const on = (q, f) => { const b = side.querySelector(q); if(b) b.addEventListener("click", f); };
    on("[data-go-flip]", flip);
    on("[data-go-next]", () => { G.turn = (G.turn + 1) % players.length; G.phase = "flip"; G.msg = ""; panel(); });
    on("[data-go-again]", () => { G.pos = players.map(() => 0); G.turn = 0; G.winner = null; G.phase = "flip"; G.msg = ""; layout(); panel(); });
  }
  function hop(i, from, to, done){
    if(from === to){ done(); return; }
    const next = from + 1, [x1, y1] = foot(from), [x2, y2] = foot(next);
    gAnimate(gCalm() ? 0 : 260, t => { const e = gEaseOut(t, 2); place(i, x1 + (x2 - x1) * e, y1 + (y2 - y1) * e - Math.sin(Math.PI * t) * 24); }, () => { G.pos[i] = next; hop(i, next, to, done); });
  }
  function flip(){
    if(G.busy) return; G.busy = true; G.msg = ""; const p = G.turn, f = Math.random() < .5 ? 1 : 2, coin = side.querySelector(".gcoin");
    side.querySelector("[data-go-flip]").disabled = true; const hint = side.querySelector(".gs-hint"); if(hint) hint.style.visibility = "hidden";
    gToss(coin, f, () => { G.face = f; setTimeout(() => hop(p, G.pos[p], Math.min(N - 1, G.pos[p] + f), () => {
      G.busy = false; const c = cells[G.pos[p]];
      if(c.finish){ G.winner = p; panel(); return; }
      if(c.goose){ G.msg = "🪿 A goose! Flip again."; G.phase = "flip"; panel(); return; }
      G.phase = "task"; panel(); }), gCalm() ? 0 : 350); });
  }
  layout(); panel(); return G;
}

/* ---------- 🏝 Discussion islands (Iryna Piatrouskaya, her warmers post): questions live on islands; tap Sail — the boat wanders off and
   stops at an island, like the music stopping — and you talk about its question; a visited island keeps its flag ---------- */
const G_ISLES = {3: [[230, 190], [770, 170], [500, 420]], 4: [[220, 170], [770, 150], [290, 420], [730, 410]],
  5: [[190, 150], [510, 110], [830, 170], [290, 410], [720, 420]], 6: [[170, 140], [500, 105], [830, 150], [180, 420], [520, 400], [840, 420]],
  7: [[160, 135], [470, 100], [800, 125], [300, 330], [640, 300], [880, 420], [140, 450]], 8: [[160, 130], [450, 95], [760, 110], [290, 320], [610, 290], [890, 330], [140, 470], [720, 470]]};
function gIslands(host, islands, {label = "⛵ Sail", onPick = null} = {}){
  const W = 1000, H = 560, n = Math.min(8, Math.max(3, islands.length)), list = islands.slice(0, n), P = G_ISLES[n], R = n > 6 ? 70 : 80;
  const I = {at: -1, seen: new Set(), busy: false, boat: null};
  const rnd = k => { const x = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const blob = (cx, cy, r, seed) => { const m = 11, pts = Array.from({length: m}, (_, i) => { const a = i / m * Math.PI * 2, rr = r * (.86 + .26 * rnd(seed * 31 + i)); return [cx + Math.cos(a) * rr * 1.32, cy + Math.sin(a) * rr * .88]; });
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for(let i = 0; i < m; i++){ const p0 = pts[(i - 1 + m) % m], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[(i + 2) % m];
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
    return d + "Z"; };
  const lines = s => { const w = String(s).split(" "), out = [""]; w.forEach(x => { if((out[out.length - 1] + " " + x).trim().length > 10 && out[out.length - 1]) out.push(x); else out[out.length - 1] = (out[out.length - 1] + " " + x).trim(); }); return out.slice(0, 3); };
  /* the boat starts in the open sea, as far from every island as possible */
  let best = [W / 2, H - 40], bd = 0; for(let x = 60; x <= W - 60; x += 20) for(let y = 50; y <= H - 40; y += 20){ const d = Math.min(...P.map(([a, b]) => Math.hypot(a - x, (b - y) * 1.25))); if(d > bd){ bd = d; best = [x, y]; } }
  I.boat = best.slice();
  const waves = Array.from({length: 26}, (_, k) => [40 + rnd(k + 3) * (W - 80), 30 + rnd(k + 50) * (H - 60)]).filter(([x, y]) => P.every(([a, b]) => Math.hypot(a - x, b - y) > R * 1.5));
  host.innerHTML = `<div class="gis"><svg class="gis-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="A sea with ${n} islands">
    <rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="18" class="gis-sea"/>
    ${waves.map(([x, y]) => `<path d="M${x.toFixed(0)} ${y.toFixed(0)}q8 -7 16 0t16 0" class="gis-wave"/>`).join("")}
    ${list.map((it, k) => { const [x, y] = P[k], d = blob(x, y, R, k + 1), g = blob(x, y - 4, R * .74, k + 9), L = lines(it.name || it.q);
      return `<g class="gis-isle" data-is="${k}" tabindex="0" role="button" aria-label="${gEsc(it.name || it.q)}"><path d="${d}" transform="translate(0 7)" class="gis-shadow"/><path d="${d}" class="gis-sand"/><path d="${g}" class="gis-grass"/>
        ${L.map((s, j) => `<text x="${x}" y="${(y - 4 + (j - (L.length - 1) / 2) * 32 + 10).toFixed(0)}" text-anchor="middle" class="gis-label">${gEsc(s)}</text>`).join("")}<text x="${x + R * .55}" y="${y - R * .62}" class="gis-flag">🚩</text></g>`; }).join("")}
    <g class="gis-boat"><g class="gis-boat-in"><text class="gis-notes" x="-6" y="-40">♪ ♫</text><path d="M-24 2h48l-9 14h-30z" class="gis-hull"/><line x1="0" y1="2" x2="0" y2="-34" class="gis-mast"/><path d="M2 -32l20 28h-20z" class="gis-sail"/><path d="M-2 -28l-15 24h15z" class="gis-sail b"/></g></g>
  </svg><div class="gis-side gt-side"></div></div>`;
  const svg = host.querySelector(".gis-map"), side = host.querySelector(".gis-side"), boat = svg.querySelector(".gis-boat"), bin = svg.querySelector(".gis-boat-in");
  const putBoat = (x, y, rot = 0, flipX = false) => { boat.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`); bin.setAttribute("transform", `rotate(${rot.toFixed(1)}) scale(${flipX ? -1 : 1} 1)`); };
  putBoat(...I.boat);
  function panel(){
    const it = I.at > -1 ? list[I.at] : null, all = I.seen.size === n;
    side.innerHTML = `${it ? `<div class="gt-task"><p class="gis-name">🏝 ${gEsc(it.name || "")}</p><p class="gt-q">${it.q ? gEsc(it.q) : ""}</p></div>`
        : `<p class="gs-hint" style="margin:0">Tap Sail: the boat stops at an island. Talk about its question.</p>`}
      <button class="btn primary" data-is-sail ${I.busy ? "disabled" : ""}>${all ? "↺ Sail round again" : it ? label + " on" : label}</button>
      <p class="grv-n">${I.seen.size} of ${n} islands</p>`;
    const b = side.querySelector("[data-is-sail]"); if(b) b.addEventListener("click", () => { if(all){ I.seen.clear(); svg.querySelectorAll(".gis-isle").forEach(g => g.classList.remove("seen", "on")); } sail(); });
  }
  function sail(to){
    if(I.busy) return; const free = list.map((_, k) => k).filter(k => !I.seen.has(k) && k !== I.at);
    if(to == null){ if(!free.length) return; to = free[Math.floor(Math.random() * free.length)]; }
    I.busy = true; svg.querySelectorAll(".gis-isle").forEach(g => g.classList.remove("on")); const prev = I.at; I.at = -1; panel(); svg.classList.add("sailing");
    const [x0, y0] = I.boat, [cx, cy] = P[to], a = Math.atan2(y0 - cy, x0 - cx), dock = [cx + Math.cos(a) * R * 1.75, cy + Math.sin(a) * R * 1.2 + 12];
    const dx = dock[0] - x0, dy = dock[1] - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, s = (Math.random() < .5 ? 1 : -1) * Math.min(160, L * .45);
    const c1 = [x0 + dx * .3 + nx * s, y0 + dy * .3 + ny * s], c2 = [x0 + dx * .75 - nx * s * .6, y0 + dy * .75 - ny * s * .6];
    const B = (t, a0, a1, a2, a3) => (1 - t) ** 3 * a0 + 3 * (1 - t) ** 2 * t * a1 + 3 * (1 - t) * t * t * a2 + t ** 3 * a3;
    let lastX = x0;
    gAnimate(Math.max(1700, Math.min(2900, L * 4.2)), t => { const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = B(e, x0, c1[0], c2[0], dock[0]), y = B(e, y0, c1[1], c2[1], dock[1]);
      putBoat(x, y + Math.sin(t * Math.PI * 7) * 3 * (1 - t), Math.sin(t * Math.PI * 5) * 6 * (1 - t), x < lastX - .01); lastX = x; },
      () => { I.boat = dock; I.busy = false; I.at = to; I.seen.add(to); svg.classList.remove("sailing");
        const g = svg.querySelector(`[data-is="${to}"]`); g.classList.add("on", "seen"); panel(); if(onPick) onPick(list[to], to); });
  }
  svg.querySelectorAll(".gis-isle").forEach(g => { const go = () => { const k = +g.dataset.is; if(k !== I.at) sail(k); };
    g.addEventListener("click", go); g.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); go(); } }); });
  panel(); return I;
}
