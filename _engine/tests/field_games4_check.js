// tools 20 (B2 revision 4.11, the handoffs of 1.11 00:30–02:30): the four new fields and their games.
//   f-wc  🎡 the wheel (✓ = the sector leaves, ↺ = it stays) · 🎲🎲 two dice with a guided start (the example, Go, Roll, 📌)
//   f-dis 🐍 snakes and ladders · 🃏 a deck with a guided start (tools 28; the goose race and the one die before)
//   f-pp  🐍 snakes and ladders (a task at every stop) · 🧩 mix (one from each column → the question; 🎲 Pick for us)
//   f-st  ⬚ dots and boxes (✓ → draw a line) · 🏝 islands with a guided start
// Every screen fits 1280×720 above Back / Next; a game comes back as it was after a reload; the board links the four cells and shows
// Have you seen it? as a plain number (closed on 4.11).
//   node tests/field_games4_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const DIR = 'tools/b2-2026-10-30/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/` + DIR;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  /* tools 21: ▶ How to play — a fresh device sees the demo first: it plays by itself (captions change), a tap skips it, the real board comes
     in; the next time straight to the game; ▶ How to play shows it again */
  { const c0 = await b.newContext({viewport: {width: 1280, height: 720}}); const q = await c0.newPage(); q.on('pageerror', e => errs.push('demo: ' + e.message));
    await q.goto(base + 'f-st.html'); await q.waitForTimeout(250);
    await q.evaluate(() => { const si = D.stages.findIndex(s => s.blocks.some(x => x.piece === 'dots')); S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(x => x.piece === 'dots'); render(); });
    await q.waitForTimeout(700); const cap1 = await q.evaluate(() => (document.querySelector('.gdm-cap') || {}).textContent || '');
    await q.waitForTimeout(2600); const cap2 = await q.evaluate(() => (document.querySelector('.gdm-cap') || {}).textContent || '');
    if (shots) await q.screenshot({path: path.join(shots, 'demo-dots.png')});
    expect('a fresh device: the dots demo plays, its caption changes', /line/i.test(cap1) && cap2 && cap2 !== cap1 && !(await q.$('.gdots svg.gdt-board')), {cap1, cap2});
    await q.click('.gdemo'); await q.waitForTimeout(700);
    const real = await q.evaluate(() => ({board: !!document.querySelector('svg.gdt-board'), demo: !!document.querySelector('.gdemo'), seen: !!localStorage.getItem('tool-demo-dots')}));
    expect('tap = skip: the real board comes in, the demo is marked seen', real.board && !real.demo && real.seen, real);
    await q.reload(); await q.waitForTimeout(400);
    const again = await q.evaluate(() => ({board: !!document.querySelector('svg.gdt-board'), demo: !!document.querySelector('.gdemo')}));
    expect('the next time: straight to the game', again.board && !again.demo, again);
    await q.click('[data-gdemo]'); await q.waitForTimeout(400);
    expect('▶ How to play shows it again', !!(await q.$('.gdemo')), 'no demo');
    await c0.close(); }
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}});
  await ctx.addInitScript(() => { ['ttt', 'dots', 'goose', 'snakes'].forEach(k => localStorage.setItem('tool-demo-' + k, '1')); });   /* the games themselves below */
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.emulateMedia({reducedMotion: 'reduce'});
  const shot = async n => { if (shots) await p.screenshot({path: path.join(shots, n + '.png')}); };
  const open = async f => { await p.goto(base + f + '.html'); await p.waitForTimeout(250); };
  const go = (kind, piece) => p.evaluate(([k, pc]) => { const si = D.stages.findIndex(s => s.blocks.some(x => x.kind === k && (!pc || x.piece === pc)));
    S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(x => x.kind === k && (!pc || x.piece === pc)); render(); scrollTo(0, 0); }, [kind, piece]);
  const fits = () => p.evaluate(() => { const bar = document.querySelector('.stepbar').getBoundingClientRect(), blk = document.querySelector('.blk').getBoundingClientRect(); return blk.bottom <= bar.top + 2; });
  const click = async q => { await p.click(q); await p.waitForTimeout(120); };
  const txt = q => p.evaluate(q => (document.querySelector(q) || {}).textContent || '', q);
  /* every screen of the four fields fits */
  const over = [];
  for (const f of ['f-wc', 'f-dis', 'f-pp', 'f-st']) {
    await open(f); const n = await p.evaluate(() => D.stages.map(s => s.blocks.length));
    for (let si = 0; si < n.length; si++) for (let bi = 0; bi < n[si]; bi++) { await p.evaluate(([si, bi]) => { S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = bi; render(); scrollTo(0, 0); }, [si, bi]); await p.waitForTimeout(80); if (!(await fits())) over.push(`${f} s${si}b${bi}`); }
  }
  expect('every screen fits 1280×720', !over.length, over);
  /* 🎡 the wheel */
  await open('f-wc'); await go('game', 'wheel');
  await click('.gw-disc'); let w = await p.evaluate(() => bs(curBlock()).wh); out.spin = w;
  expect('spin → a situation', w.cur != null && !w.shown && /Show the answer/.test(await txt('.fw-side')), w);
  await shot('wc-wheel-task');
  await p.click('[data-step]'); await p.waitForTimeout(120); w = await p.evaluate(() => bs(curBlock()).wh);
  expect('Next on an open situation = its answer', w.shown && /Got it/.test(await txt('.fw-side')), w);
  await shot('wc-wheel-answer'); expect('the wheel\'s answer fits', await fits(), 'over');
  const k1 = w.cur; await click('[data-whyes]'); w = await p.evaluate(() => ({wh: bs(curBlock()).wh, g: bs(curBlock()).g}));
  expect('✓ → the sector leaves the wheel', w.wh.cur == null && w.wh.got.includes(k1) && w.g.w[k1] === 0 && /7 of 8 left/.test(await txt('.fw-side')), w);
  await click('.gw-disc'); w = await p.evaluate(() => bs(curBlock()).wh); const k2 = w.cur;
  await click('[data-whshow]'); await click('[data-whno]'); w = await p.evaluate(() => ({wh: bs(curBlock()).wh, g: bs(curBlock()).g}));
  expect('↺ Not quite → it stays', w.wh.cur == null && !w.wh.got.includes(k2) && w.g.w[k2] === 1 && /7 of 8 left/.test(await txt('.fw-side')), w);
  await p.reload(); await p.waitForTimeout(300); w = await p.evaluate(() => ({wh: bs(curBlock()).wh, g: bs(curBlock()).g, kind: curBlock().piece}));
  expect('a reload: the wheel as it was', w.kind === 'wheel' && w.wh.got.length === 1 && w.g.w[k1] === 0, w);
  /* 🎲🎲 two dice with a guided start */
  await go('game', 'dice2'); let r = await p.evaluate(() => ({ph: rlSt(curBlock()).ph, instr: document.querySelector('.finstr').textContent, gaps: document.querySelectorAll('.rl .gp').length, faces: [...document.querySelectorAll('.rl-face')].map(x => x.textContent)}));
  expect('dice2: the example first (its instruction, the dice on 1 and 2, the chat with gaps)', r.ph === 'intro' && /example/i.test(r.instr) && r.gaps > 4 && /cooking show/.test(r.faces[0]) && /last night/.test(r.faces[1]), r);
  await shot('wc-dice-example');
  await p.click('[data-step]'); await p.waitForTimeout(100); r = await p.evaluate(() => ({ph: rlSt(curBlock()).ph, open: document.querySelectorAll('.rl .gp.open').length, all: document.querySelectorAll('.rl .gp').length}));
  expect('Next opens the example\'s gaps', r.ph === 'intro' && r.open === r.all, r);
  await p.click('[data-step]'); await p.waitForTimeout(100); r = await p.evaluate(() => ({ph: rlSt(curBlock()).ph, pin: !!document.querySelector('.expin-f'), instr: document.querySelector('.finstr').textContent}));
  expect('the next Next = Go: the real game, the example pinned', r.ph === 'play' && r.pin && /Roll both dice/.test(r.instr), r);
  await click('[data-rlroll]'); r = await p.evaluate(() => ({roll: rlSt(curBlock()).roll, res: (document.querySelector('.rl-res') || {}).textContent || ''}));
  expect('Roll → both dice, the line with the start', r.roll && r.roll.length === 2 && /→/.test(r.res) && /\?/.test(r.res), r);
  await shot('wc-dice-roll');
  r = await p.evaluate(() => ({lists: document.querySelectorAll('.rl-faces').length, lit: document.querySelectorAll('.rl-faces li.on').length, fold: document.querySelectorAll('details.rl-all').length}));
  expect('tools 28 (her 3.11 20:23): both dice faces lists in view, the rolled faces lit, no «All the faces» fold', r.lists === 2 && r.lit === 2 && r.fold === 0, r);
  await p.click('[data-back]'); await p.waitForTimeout(100); r = await p.evaluate(() => rlSt(curBlock()).ph);
  expect('Back from the game → the example', r === 'intro', r);
  /* tools 28 (the B2 handoff 03.11 20:10): f-dis has snakes and ladders and 🃏 a deck now (the goose race and the one die are on no page) */
  await open('f-dis'); await go('game', 'snakes');
  await click('[data-gs-roll]'); let g = await p.evaluate(() => bs(curBlock()).g);
  expect('f-dis snakes: roll → a task with its full label', g && g.ti != null && /How do you say it in English\?|Make it gentler|Fix the mistake/.test(await txt('.gt-task, .gsnl')), g);
  await shot('dis-snakes-task');
  /* 🃏 the deck: the example, Go, draw */
  await go('game', 'deck'); r = await p.evaluate(() => ({ex: !!document.querySelector('.rl-intro'), card: (document.querySelector('.rl-cardm') || {}).textContent || ''}));
  expect('deck: the example first, with its card', r.ex && /Films are far too long/.test(r.card), r);
  await p.click('[data-rlgo]'); await p.waitForTimeout(100); await click('[data-rlpile]');
  r = await p.evaluate(() => ({at: rlSt(curBlock()).dk.at, card: (document.querySelector('[data-rlslot] .rl-cardt') || {}).textContent || ''}));
  expect('deck: Go → Draw a card → a hot take (not the example\'s card first)', r.at === 0 && r.card.length > 10 && !/Films are far too long/.test(r.card), r);
  await shot('dis-deck-card');
  /* 🐍 snakes and ladders */
  await open('f-pp'); await go('game', 'snakes');
  await click('[data-gs-roll]'); let s = await p.evaluate(() => bs(curBlock()).g);
  expect('snakes: roll → a task wherever you stop', s && s.ti != null && s.pos[0] > 1 && /Show the answer/.test(await txt('.gs-side')), s);
  await shot('pp-snakes-task');
  await click('[data-gs-show]'); s = await p.evaluate(() => bs(curBlock()).g);
  expect('Show the answer → ✓ / ✗ by her rule', s.shown && /Got it/.test(await txt('.gs-side')) && /Not quite/.test(await txt('.gs-side')), s);
  await shot('pp-snakes-answer'); expect('the snakes answer fits', await fits(), 'over');
  const at = s.pos[0]; await click('[data-gs-yes]'); s = await p.evaluate(() => bs(curBlock()).g);
  expect('✓ → you stay (or up the ladder), the next player', s.turn === 1 && s.pos[0] >= at && s.ti == null, s);
  /* 🧩 mix */
  await go('mix'); await click('[data-mx="l1"]'); await click('[data-mx="r1"]'); let m = await txt('.mx-q');
  expect('mix: one from each column → the question', /Have you\s+been to a concert or a festival\s+in the last few months\?/.test(m.replace(/\s+/g, ' ')), m);
  await click('[data-mxrand]'); m = await p.evaluate(() => bs(curBlock()).mx);
  expect('🎲 Pick for us → one of each', m.l != null && m.r != null, m);
  await shot('pp-mix');
  /* ⬚ dots and boxes */
  await open('f-st'); await go('game', 'dots');
  let d = await p.evaluate(() => ({show: !!document.querySelector('[data-dt-show]'), yes: !!document.querySelector('[data-dt-yes]'), key: (document.querySelector('.gt-q .kw') || {}).textContent || ''}));
  expect('dots: the transformation with its key word, ✓ only after Show the answer', d.show && !d.yes && /^[A-Z]+$/.test(d.key), d);
  await click('[data-dt-show]'); await shot('st-dots-answer'); expect('the dots answer fits', await fits(), 'over'); await click('[data-dt-yes]'); await p.locator('.gdt-l.free').first().dispatchEvent('click'); await p.waitForTimeout(120);   /* an svg line: Playwright calls it invisible */
  d = await p.evaluate(() => bs(curBlock()).g);
  expect('✓ → draw a line → the other player', Object.keys(d.lines).length === 1 && d.turn === 1 && d.phase === 'task', d);
  await shot('st-dots');
  /* 🏝 islands */
  await go('game', 'islands'); let i = await p.evaluate(() => ({ph: rlSt(curBlock()).ph, isle: (document.querySelector('.rl-isle') || {}).textContent || ''}));
  expect('islands: the example on the cinema first', i.ph === 'intro' && /cinema/.test(i.isle), i);
  await p.click('[data-rlgo]'); await p.waitForTimeout(150); await click('[data-is-sail]');
  i = await p.evaluate(() => ({g: bs(curBlock()).g, side: (document.querySelector('.gis-side') || {}).textContent || ''}));
  expect('Go → Sail → an island with its topic and hint', i.g && i.g.at > -1 && /Your topic/.test(i.side), i);
  await shot('st-islands');
  /* the board */
  await open('jeopardy'); const bd = await p.evaluate(() => ({links: [...document.querySelectorAll('a.cell')].map(a => a.getAttribute('href')), closed: [...document.querySelectorAll('.cell.closed')].map(x => x.textContent)}));
  out.board = bd;
  expect('the board links the four new fields', ['f-wc.html', 'f-dis.html', 'f-pp.html', 'f-st.html'].every(h => bd.links.includes(h)) && !bd.links.includes('f-seen.html'), bd);
  expect('Have you seen it? is a plain number', bd.closed.length === 1 && bd.closed[0] === '$300', bd);
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK four fields'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
