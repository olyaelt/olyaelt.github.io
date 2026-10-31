// tools 16 (B2 revision f-late, handoff 31.10 12:30): ✏️ Fix it and 🎮 noughts and crosses as field blocks in 🃏 Practice.
//   node tests/field_fix_game_check.js SITE_DIR [shots_dir]
// Fix it: the big line with "work" red + the note → the gap with two chips (wrong: shakes, the note; right: ✓, red word in) → the two
// messages one at a time (say it, tap / Next → the answer, "work(s)" bold); Back steps back; fits 1280×720 with the box.
// Game: 3×3; a square → its sentence (struck / green) + the Russian context → Show the answer (✓ / ✗ only after it) → ✓ Correct = X / O,
// ✗ Not quite = free, the turn passes; three in a row wins; Play again clears; the board survives a redraw and a reload; Next on an open
// square shows its answer; a "Not quite" square is in "↺ Your hard cards once more"; phone; dark.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/f-late';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const open = async (opts = {}) => { const ctx = opts.ctx ? await b.newContext(opts.ctx) : await b.newContext({viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + PAGE + '.html'); await p.waitForTimeout(200); return {p, ctx}; };
  const goBlock = (p, kind) => p.evaluate(k => { const si = D.stages.findIndex(s => s.blocks.some(x => x.kind === k)); S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(x => x.kind === k); render(); }, kind);
  const fx = p => p.evaluate(() => ({ph: (bs(curBlock()).fx || {}).ph, big: (document.querySelector('.fx-big .fx-line') || {}).innerHTML || '', note: !!document.querySelector('.fx-note'), chips: [...document.querySelectorAll('[data-fxchip]')].map(x => x.textContent),
    place: (document.querySelector('.fx-place .fx-line') || {}).textContent || '', msg: (document.querySelector('.fx-msg') || {}).textContent || '', says: [...document.querySelectorAll('.fx-say')].map(x => x.innerText.replace(/\s+/g, ' ')),
    red: [...document.querySelectorAll('.fx-red')].map(x => x.textContent), bottom: Math.round(Math.max(...[...document.querySelectorAll('.stepbar, .fx-says, .fx-place, .fx-big')].map(x => x.getBoundingClientRect().bottom))),
    box: !!document.querySelector('#side .box'), next: (document.querySelector('[data-step]') || {}).disabled}));
  { const {p} = await open(); await goBlock(p, 'fix');
    const F = [await fx(p)];
    expect('fix 1: the big line, "work" red, the note', F[0].ph === 0 && /<b class="fx-red">work<\/b>/.test(F[0].big) && F[0].note && F[0].chips.length === 0, F[0]);
    if (shots) await p.screenshot({path: path.join(shots, 'fix-1.png')});
    await p.click('[data-step]'); F.push(await fx(p));
    expect('fix 2: the gap with work / works, no note yet', F[1].ph === 1 && F[1].chips.join() === 'work,works' && !F[1].note && /Does that still\s*for you\?/.test(F[1].place), F[1]);
    await p.click('[data-fxchip="works"]'); await p.waitForTimeout(50); F.push(await fx(p));
    expect('fix 3: a wrong chip → the note, the chip marked', F[2].ph === 1 && F[2].note && await p.locator('.fx-chip.no').count() === 1, F[2]);
    if (shots) await p.screenshot({path: path.join(shots, 'fix-2-wrong.png')});
    await p.click('[data-fxchip="work"]'); F.push(await fx(p));
    expect('fix 4: the right chip → ✓, "work" red in the line', /That's it/.test(F[3].msg) && F[3].red.includes('work') && /Does that still work for you\?/.test(F[3].place), F[3]);
    await p.click('[data-step]'); F.push(await fx(p));
    expect('fix 5: message 1, its answer shut', F[4].ph === 2 && F[4].says.length === 1 && /Is eight still OK for you\? say it/.test(F[4].says[0]), F[4]);
    await p.click('[data-fxa="0"]'); F.push(await fx(p));
    out.ans1 = await p.evaluate(() => (document.querySelector('.fx-a:not(.shut)') || {}).innerHTML || '');
    expect('fix 6: tap → the answer, "work" bold', F[5].ph === 3 && /Does eight still <b class="bx">work<\/b> for you\?/.test(out.ans1), {F: F[5], a: out.ans1});
    await p.click('[data-step]'); await p.click('[data-step]'); F.push(await fx(p));
    out.ans2 = await p.evaluate(() => [...document.querySelectorAll('.fx-a:not(.shut)')].map(x => x.innerHTML).pop() || '');
    expect('fix 7: Next → message 2, Next → its answer ("works")', F[6].ph === 5 && F[6].says.length === 2 && /<b class="bx">works<\/b>/.test(out.ans2), {F: F[6], a: out.ans2});
    expect('fix: fits 1280×720 with the box', F.every(f => f.bottom <= 720) && F[6].box, F.map(f => f.bottom));
    if (shots) await p.screenshot({path: path.join(shots, 'fix-3-says.png')});
    await p.click('[data-back]'); F.push(await fx(p)); expect('fix: Back = the screen before', F[7].ph === 4, F[7]);
    await p.click('[data-step]'); await p.click('[data-step]'); out.afterFix = await p.evaluate(() => curBlock().kind); expect('fix: then Next goes on to the game', out.afterFix === 'game', out.afterFix);
    // the game
    const g = () => p.evaluate(() => { const T = bs(curBlock()).ttt; return {cells: document.querySelectorAll('.gt-cell').length, taken: document.querySelectorAll('.gt-cell.taken').length, turn: (document.querySelector('.gt-turn') || {}).textContent || '',
      q: (document.querySelector('.gt-q') || {}).innerHTML || '', a: (document.querySelector('.gt-a') || {}).innerHTML || '', btns: [...document.querySelectorAll('.gt-acts button')].map(x => x.textContent.trim()), open: T ? T.open : null,
      over: T && T.over, again: saved.again.slice(), bottom: Math.round(Math.max(...[...document.querySelectorAll('.stepbar, .gttt')].map(x => x.getBoundingClientRect().bottom))), box: !!document.querySelector('#side .box')}; });
    const G = [await g()];
    expect('game 1: 3×3, X to start, the box beside', G[0].cells === 9 && /X's turn — choose a square/.test(G[0].turn) && G[0].box, G[0]);
    await p.click('[data-gt="0"]'); G.push(await g());
    expect('game 2: a square → its sentence + context; only Show the answer', /class="lctx"/.test(G[1].q) && /m-del|m-good/.test(G[1].q) && G[1].btns.join() === 'Show the answer' && !G[1].a, G[1]);
    if (shots) await p.screenshot({path: path.join(shots, 'game-1-task.png')});
    await p.click('[data-step]'); G.push(await g());   // Next on an open square = its answer
    expect('game 3: Next shows the answer: Perfect English + the change + why; then ✓ Correct / ✗ Not quite', /Perfect English/.test(G[2].a) && /class="bx"/.test(G[2].a) && /class="note"/.test(G[2].a) && G[2].btns.join() === '✓ Correct,✗ Not quite', G[2]);
    if (shots) await p.screenshot({path: path.join(shots, 'game-2-answer.png')});
    await p.click('[data-gt-yes]'); G.push(await g());
    expect('game 4: ✓ Correct → X on the square, O\'s turn', G[3].taken === 1 && /O's turn/.test(G[3].turn), G[3]);
    const nOpen = await p.evaluate(() => { const T = bs(curBlock()).ttt; return T.cells.findIndex(c => !c.m); });
    await p.click(`[data-gt="${nOpen}"]`); await p.click('[data-gt-show]'); const tNo = await p.evaluate(k => bs(curBlock()).ttt.cells[k].t._n, nOpen); await p.click('[data-gt-no]'); G.push(await g());
    expect('game 5: ✗ Not quite → the square stays free, X\'s turn, the card is a hard card', G[4].taken === 1 && /X's turn/.test(G[4].turn) && G[4].again.includes(tNo), {G: G[4], tNo});
    await p.evaluate(() => render()); G.push(await g()); expect('game: the board survives a redraw', G[5].taken === 1, G[5]);
    await p.reload(); await p.waitForTimeout(300); G.push(await g()); expect('game: the board survives a reload (this device)', G[6].taken === 1 && /X's turn/.test(G[6].turn), G[6]);
    // three in a row for X: play X on 0,1,2 (O answers "not quite")
    await p.evaluate(() => { const T = bs(curBlock()).ttt; T.cells.forEach(c => c.m = null); T.turn = 0; T.open = -1; T.over = null; T.redraw(); });
    for (const k of [0, 1, 2]) { await p.click(`[data-gt="${k}"]`); await p.click('[data-gt-show]'); await p.click('[data-gt-yes]');
      if (k < 2) { const f = await p.evaluate(() => bs(curBlock()).ttt.cells.findIndex((c, i) => !c.m && i > 2)); await p.click(`[data-gt="${f}"]`); await p.click('[data-gt-show]'); await p.click('[data-gt-no]'); } }
    G.push(await g()); expect('game 6: three in a row wins, Play again', G[7].over && G[7].over.who === 'X' && /wins!/.test(G[7].turn) && G[7].btns.length === 0 && await p.locator('[data-gt-again]').count() === 1, G[7]);
    if (shots) await p.screenshot({path: path.join(shots, 'game-3-win.png')});
    await p.click('[data-gt-again]'); G.push(await g()); expect('game 7: Play again clears the marks', G[8].taken === 0 && !G[8].over, G[8]);
    expect('game: fits 1280×720', G.every(x => x.bottom <= 720), G.map(x => x.bottom));
    out.fast = await p.evaluate(() => fastDeckBlock().cards.map(c => c.front)); expect('a "Not quite" square comes back in the hard cards', out.fast.some(f => /~~|<g>/.test(f)), out.fast); }
  { const {p} = await open({ctx: {...devices['iPhone 13']}}); await goBlock(p, 'game'); await p.click('[data-gt="4"]'); await p.click('[data-gt-show]');
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth})); expect('phone: no sideways scroll', out.phone.w <= out.phone.vw, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'game-phone.png'), fullPage: true}); await goBlock(p, 'fix');
    out.phoneFix = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth})); expect('phone fix: no sideways scroll', out.phoneFix.w <= out.phoneFix.vw, out.phoneFix); }
  { const {p} = await open({scheme: 'dark'}); await goBlock(p, 'game'); await p.click('[data-gt="0"]'); await p.click('[data-gt-show]'); if (shots) await p.screenshot({path: path.join(shots, 'game-dark.png')});
    await goBlock(p, 'fix'); await p.click('[data-step]'); if (shots) await p.screenshot({path: path.join(shots, 'fix-dark.png')}); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK field fix + game'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
