// tools 30 also (her 6.11 18:03, B2 noughts and crosses: «не могу открыть жёлтую карточку в игре» — as on snakes, 4.11): on her device her
// 👥 dot on a noughts-and-crosses task that isn't free on this board opens it as a card over the game (front, tap → the answer, ← Back);
// nothing in the game moves. A task free on the board still opens its square.
//   node tests/ttt_peek_check.js SITE_DIR [shot.png]
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shot = process.argv[3], fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 720}});
  await ctx.addInitScript(() => { try { localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('hw-code', 'TEST'); } catch (e) {} });
  await ctx.route(/script\.google\.com|googleusercontent/, r => r.fulfill({status: 200, contentType: 'application/json', body: '{"ok":true,"rows":[]}'}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
  await p.goto('file://' + path.join(site, 'tools/b2-2026-11-06/stages-of-life-live.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { const si = D.stages.findIndex(s => /Practice/.test(s.label)); goStage(si, false); S.intro = false; goBlock(si, 1); }); await p.waitForTimeout(300);
  if (await p.locator('#main .gdemo').count()) { await p.click('#main .gdemo'); await p.waitForTimeout(400); }   /* skip How to play */
  out.dots = await p.locator('#main [data-gdots] [data-gd]').count(); expect('her dots on noughts and crosses', out.dots > 9, out.dots);
  const board = () => p.evaluate(() => { const T = bs(curBlock()).ttt; return T ? JSON.stringify(T.cells.map(c => !!c.m)) + T.open : 'no board'; });
  out.board = await board(); expect('the board is drawn', out.board !== 'no board', out.board);
  const free = await p.evaluate(() => { const b = curBlock(), T = bs(b).ttt; return b.tasks.map((t, i) => [i, !!(T && T.cells.some(c => c.t === t && !c.m))]); });
  const off = free.find(x => !x[1]), on = free.find(x => x[1]);
  const b0 = await board();
  await p.click(`#main [data-gdots] [data-gd="${off[0]}"]`); await p.waitForTimeout(250);
  out.peek = await p.evaluate(() => { const g = document.querySelector('#main .gpeek'); return g ? {lbl: g.querySelector('.lbl').innerText, front: g.querySelector('.fc').innerText.slice(0, 80)} : null; });
  expect('a task not on this board: the card over the game', !!out.peek, out.peek);
  if (shot) await p.screenshot({path: shot});
  await p.click('#main .gpeek [data-gpeek-flip]'); await p.waitForTimeout(200);
  out.open = await p.evaluate(() => !!document.querySelector('#main .gpeek .fc.open')); expect('tap → the answer', out.open, out.open);
  await p.click('#main .gpeek button[data-gpeek-x]'); await p.waitForTimeout(200);
  out.closed = await p.evaluate(() => !document.querySelector('#main .gpeek')); expect('← Back to the game', out.closed, out.closed);
  expect('nothing in the game moved', (await board()) === b0, [b0, await board()]);
  if (on) { await p.click(`#main [data-gdots] [data-gd="${on[0]}"]`); await p.waitForTimeout(250);
    out.square = await p.evaluate(() => ({open: bs(curBlock()).ttt.open, peek: !!document.querySelector('#main .gpeek')}));
    expect('a task free on the board opens its square', out.square.open > -1 && !out.square.peek, out.square); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK noughts and crosses: her dots open the card'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
