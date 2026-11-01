// tools 23 (her 1.11 18:41: «а что делать группам, в которых 3 студента?»; «если их двое, пусть играют 3 на 3»): 👥 2 · 3 players above
// each game. Three → snakes and ladders, the goose race and dots and boxes get a purple player and the turn goes round all three;
// noughts and crosses gets △ on a 4×4 board (three in a row), its 16 squares filled even when there are fewer sentences; two → 3×3 as
// before. Switching in the middle asks for a second tap; the choice stays after a reload; every screen still fits 1280×720.
//   node tests/three_players_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const DIR = 'tools/b2-2026-10-30/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/` + DIR;
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}});
  await ctx.addInitScript(() => { ['ttt', 'dots', 'goose', 'snakes'].forEach(k => localStorage.setItem('tool-demo-' + k, '1')); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
  const go = async (page, test) => { await p.goto(base + page); await p.waitForTimeout(250);
    const ok = await p.evaluate(test => { const t = new Function('x', 'return ' + test); const si = D.stages.findIndex(s => s.blocks.some(t)); if (si < 0) return false;
      S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(t); render(); return true; }, test); await p.waitForTimeout(400); return ok; };
  const np = () => p.evaluate(() => [...document.querySelectorAll('.g-np .np-b')].map(x => x.textContent + (x.classList.contains('on') ? '*' : '')));
  const fits = () => p.evaluate(() => { const bar = document.querySelector('.stepbar').getBoundingClientRect(), blk = document.querySelector('.blk').getBoundingClientRect(); return blk.bottom <= bar.top + 2 && bar.bottom <= innerHeight + 1; });
  const three = async () => { await p.click('.g-np [data-npv="3"]'); await p.waitForTimeout(300); };

  // 🐍 snakes and ladders: three pawns, the turn goes Blue → Orange → Purple → Blue
  if (await go('f-pp.html', 'x.piece === "snakes"')) {
    out.snNp = await np(); expect('snakes: 👥 2 players · 3 players, 2 picked', out.snNp.join('|') === '2 players*|3 players', out.snNp);
    await three();
    const turns = [];
    for (let k = 0; k < 4; k++) {
      turns.push(await p.evaluate(() => (document.querySelector('.gsnl .gt-turn b') || {}).textContent || ''));
      await p.click('[data-gs-roll]'); await p.waitForTimeout(400);
      for (let i = 0; i < 20 && await p.$('[data-gs-roll]') === null; i++) {
        if (await p.$('[data-gs-show]')) await p.click('[data-gs-show]'); else if (await p.$('[data-gs-yes]')) await p.click('[data-gs-yes]'); else if (await p.$('[data-gs-again]')) break;
        await p.waitForTimeout(300); }
    }
    out.sn = {pawns: await p.locator('.gs-pawn').count(), turns}; if (shots) await p.screenshot({path: path.join(shots, 'tp-snakes.png')});
    expect('snakes for three: 3 pawns, Blue → Orange → Purple → Blue', out.sn.pawns === 3 && out.sn.turns.join('|') === "Blue's turn|Orange's turn|Purple's turn|Blue's turn", out.sn);
    expect('snakes for three fits 1280×720', await fits(), 'scrolls');
    // in the middle: switching back asks first
    await p.click('.g-np [data-npv="2"]'); await p.waitForTimeout(200);
    out.snAsk = {btn: await p.locator('.g-np [data-npv="2"]').innerText(), pawns: await p.locator('.gs-pawn').count()};
    expect('switching in the middle asks first ("New game for 2? Tap again")', /New game for 2/.test(out.snAsk.btn) && out.snAsk.pawns === 3, out.snAsk);
    await p.reload(); await p.waitForTimeout(500);
    out.snReload = {np: await np(), pawns: await p.locator('.gs-pawn').count()};
    expect('after a reload: still three players, the same game', out.snReload.pawns === 3 && /3 players\*/.test(out.snReload.np.join('|')), out.snReload);
    await p.click('.g-np [data-npv="2"]'); await p.click('.g-np [data-npv="2"]'); await p.waitForTimeout(300);
    expect('the second tap: a new game for two', (await p.locator('.gs-pawn').count()) === 2, await p.locator('.gs-pawn').count());
  } else fail.push('no snakes game on f-pp');

  // 🪿 the goose race: three pawns
  if (await go('f-dis.html', 'x.piece === "goose"')) {
    await three(); out.goose = await p.locator('.ggo-pawn').count(); if (shots) await p.screenshot({path: path.join(shots, 'tp-goose.png')});
    expect('the goose race for three: 3 pawns', out.goose === 3, out.goose); expect('goose for three fits', await fits(), 'scrolls');
  } else fail.push('no goose game on f-dis');

  // ⬚ dots and boxes: three colours in the score, the turn goes round
  if (await go('f-st.html', 'x.piece === "dots"')) {
    await three();
    const turns = [];
    for (let k = 0; k < 4; k++) { turns.push(await p.evaluate(() => (document.querySelector('.gdots .gt-turn b') || {}).textContent || ''));
      if (await p.$('[data-dt-show]')) await p.click('[data-dt-show]'); await p.waitForTimeout(150); await p.click('[data-dt-no]'); await p.waitForTimeout(250); }
    out.dots = {score: await p.locator('.gdt-score .gs-dot').count(), turns}; if (shots) await p.screenshot({path: path.join(shots, 'tp-dots.png')});
    expect('dots for three: 3 in the score, Blue → Orange → Purple → Blue', out.dots.score === 3 && out.dots.turns.join('|') === "Blue's turn|Orange's turn|Purple's turn|Blue's turn", out.dots);
  } else fail.push('no dots game on f-st');

  // ⭕ noughts and crosses: two → 3×3; three → 4×4, X → O → △, three in a row wins
  if (await go('f-late.html', 'x.kind === "game" && (!x.piece || x.piece === "tictactoe")')) {
    out.ttt2 = await p.locator('.gt-cell').count(); expect('noughts and crosses for two: 3×3', out.ttt2 === 9, out.ttt2);
    await three();
    out.ttt3 = {cells: await p.locator('.gt-cell').count(), tasks: await p.evaluate(() => BLOCKS.find(x => x.kind === 'game' && (!x.piece || x.piece === 'tictactoe')).tasks.length)};
    expect('for three: 4×4 — 16 squares, even with fewer sentences', out.ttt3.cells === 16, out.ttt3);
    const turns = [];
    /* X takes 0, O takes 4, △ takes 8, X takes 1, O takes 5, △ takes 9, X takes 2 → X: 0 1 2 = three in a row */
    for (const k of [0, 4, 8, 1, 5, 9, 2]) { turns.push(await p.evaluate(() => (document.querySelector('.gttt .gt-turn b') || {}).textContent || ''));
      await p.click(`[data-gt="${k}"]`); await p.waitForTimeout(150); await p.click('[data-gt-show]'); await p.waitForTimeout(150); await p.click('[data-gt-yes]'); await p.waitForTimeout(250); }
    out.tttPlay = {turns: turns.slice(0, 4), tri: await p.locator('.gt-cell svg.gt-t').count(), win: await p.evaluate(() => (document.querySelector('.gttt .gt-turn.big') || {}).textContent || '')};
    if (shots) await p.screenshot({path: path.join(shots, 'tp-ttt.png')});
    expect('X → O → △ → X; △ on the board; three in a row wins on 4×4', out.tttPlay.turns.join('|') === "X's turn|O's turn|△'s turn|X's turn" && out.tttPlay.tri === 2 && /wins/.test(out.tttPlay.win), out.tttPlay);
    expect('noughts and crosses for three fits', await fits(), 'scrolls');
  } else fail.push('no noughts-and-crosses game on f-late');

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK three players'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
