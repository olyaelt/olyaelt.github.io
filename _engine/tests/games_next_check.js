// tools 25 (her 2.11 06:56, the wheel on «At the water cooler»: one spin, one answer, Next — and the game was gone): in a game Next is the
// game's next move (spin / roll / flip / sail / the answer) until somebody wins; ✓ or ✗, a square, a line → Next doesn't choose for them,
// those pulse and the bar says so; 🏁 Finish the game beside Next → Next says "Next task →" and goes on; ↩ Keep playing or a tap in the game
// brings it back; a won game → "Next task →"; finished stays finished after a reload; 🧠 memo keeps its own steps; every screen fits 1280×720.
//   node tests/games_next_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const DIR = 'tools/b2-2026-10-30/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/` + DIR;
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
  await ctx.addInitScript(() => { ['ttt', 'dots', 'goose', 'snakes'].forEach(k => localStorage.setItem('tool-demo-' + k, '1')); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const go = async (page, test) => { await p.goto(base + page); await p.waitForTimeout(250);
    const ok = await p.evaluate(test => { const t = new Function('x', 'return ' + test); const si = D.stages.findIndex(s => s.blocks.some(t)); if (si < 0) return false;
      S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(t); render(); return true; }, test); await p.waitForTimeout(350); return ok; };
  const next = async (ms = 350) => { await p.click('[data-step]'); await p.waitForTimeout(ms); };
  const where = () => p.evaluate(() => ({kind: curBlock().kind, piece: curBlock().piece || '', bi: bIdx(), si: S.stage}));
  const bar = () => p.evaluate(() => { const n = document.querySelector('[data-step]'), f = document.querySelector('[data-gfin]'), m = document.getElementById('step-msg');
    return {next: n.textContent, dis: n.disabled, fin: f && !f.hidden ? f.textContent : '', msg: m ? m.textContent : '', nudge: document.querySelectorAll('#main .nudge').length}; });
  const fits = () => p.evaluate(() => { const bar = document.querySelector('.stepbar').getBoundingClientRect(), blk = document.querySelector('.blk').getBoundingClientRect(),
    bs = [...document.querySelectorAll('.stepbar .btn:not([hidden])')].map(x => x.getBoundingClientRect().top);
    return blk.bottom <= bar.top + 2 && bar.bottom <= innerHeight + 1 && Math.max(...bs) - Math.min(...bs) < 4; });

  // 🎡 the wheel (f-wc, her case): Next spins, shows the answer, waits for ✓ / ✗, spins again
  if (await go('f-wc.html', 'x.piece === "wheel"')) {
    const w0 = await where(); out.wheel0 = await bar();
    expect('the wheel: "Next →" and 🏁 Finish the game beside it', out.wheel0.next === 'Next →' && /Finish the game/.test(out.wheel0.fin) && !out.wheel0.dis, out.wheel0);
    expect('the wheel with the finish button fits 1280×720, one row', await fits(), 'scrolls / wraps');
    if (shots) await p.screenshot({path: path.join(shots, 'gn-1-wheel.png')});
    await next(600); out.spin = await p.evaluate(() => ({cur: bs(curBlock()).wh.cur, task: !!document.querySelector('.fw-task')}));
    expect('Next on the wheel → it spins, a situation comes up', out.spin.cur != null && out.spin.task, out.spin);
    await next(); out.ans = await p.evaluate(() => !!document.querySelector('.fw-task.shown [data-whyes]'));
    expect('Next → the answer', out.ans, out.ans);
    await next(); out.verd = Object.assign(await bar(), await where());
    expect('Next on the answer → still the wheel, ✓ / ✗ pulse, "First: right or not?"', out.verd.bi === w0.bi && out.verd.piece === 'wheel' && out.verd.nudge === 2 && /right or not/.test(out.verd.msg), out.verd);
    if (shots) await p.screenshot({path: path.join(shots, 'gn-2-verdict.png')});
    await p.click('[data-whyes]'); await p.waitForTimeout(400);
    await next(600); out.spin2 = await p.evaluate(() => ({cur: bs(curBlock()).wh.cur, got: bs(curBlock()).wh.got.length}));
    expect('after ✓ Next spins again (not the next task)', out.spin2.cur != null && out.spin2.got === 1 && (await where()).bi === w0.bi, out.spin2);
    // 🏁 Finish the game
    await p.click('[data-gfin]'); await p.waitForTimeout(300); out.fin = await bar();
    out.dim = await p.evaluate(() => document.querySelector('#main .blk').classList.contains('g-ended'));
    expect('🏁 Finish → "Next task →", the button says ↩ Keep playing, the wheel quieter', out.fin.next === 'Next task →' && /Keep playing/.test(out.fin.fin) && out.dim, out.fin);
    if (shots) await p.screenshot({path: path.join(shots, 'gn-3-finished.png')});
    await p.click('[data-gfin]'); await p.waitForTimeout(200); out.back = await bar();
    expect('↩ Keep playing → the game again ("Next →", Finish)', out.back.next === 'Next →' && /Finish the game/.test(out.back.fin), out.back);
    await p.click('[data-gfin]'); await p.waitForTimeout(200);
    await p.reload(); await p.waitForTimeout(500); out.reload = Object.assign(await bar(), await where());
    expect('after a reload: still finished, "Next task →"', out.reload.bi === w0.bi && out.reload.next === 'Next task →', out.reload);
    // a tap in the game → playing again
    await p.click('[data-whshow], [data-whyes]').catch(() => {}); await p.waitForTimeout(300); out.tap = await bar();
    expect('a tap in the game after Finish → playing again', out.tap.next === 'Next →' && /Finish the game/.test(out.tap.fin), out.tap);
    await p.click('[data-gfin]'); await p.waitForTimeout(200);
    await next(); out.after = await where();
    expect('"Next task →" → the next screen', out.after.bi === w0.bi + 1 || out.after.si !== w0.si, out.after);
    // all done → Next task
    await go('f-wc.html', 'x.piece === "wheel"');
    await p.evaluate(() => { const b = curBlock(), st = bs(b); st.ended = false; st.wh = {cur: null, shown: false, got: b.tasks.map((_, i) => i)}; st.g = {w: b.tasks.map(() => 0), angle: 0, picked: -1}; render(); });
    await p.waitForTimeout(300); out.allDone = await bar();
    expect('the wheel all done → "Next task →", no Finish button', out.allDone.next === 'Next task →' && !out.allDone.fin, out.allDone);
  } else fail.push('no wheel on f-wc');

  // 🐍 snakes and ladders: Next rolls; a winner → "Next task →"
  if (await go('f-pp.html', 'x.piece === "snakes"')) {
    const w0 = await where();
    await next(500); out.snRoll = await p.evaluate(() => ({ti: bs(curBlock()).g && bs(curBlock()).g.ti, show: !!document.querySelector('[data-gs-show]')}));
    expect('snakes: Next rolls the die → a task', out.snRoll.ti != null && out.snRoll.show, out.snRoll);
    await next(); await next(); out.snV = Object.assign(await bar(), await where());
    expect('snakes: Next → the answer, then ✓ / ✗ pulse', out.snV.bi === w0.bi && out.snV.nudge === 2, out.snV);
    await p.evaluate(() => { const st = bs(curBlock()); st.g = Object.assign({}, st.g, {winner: 0, ti: null}); render(); }); await p.waitForTimeout(300);
    out.snWin = await bar(); expect('snakes won → "Next task →", no Finish', out.snWin.next === 'Next task →' && !out.snWin.fin, out.snWin);
    await p.click('[data-gs-again]'); await p.waitForTimeout(300); out.snAgain = await bar();
    expect('Play again → the game goes on ("Next →", Finish)', out.snAgain.next === 'Next →' && /Finish/.test(out.snAgain.fin), out.snAgain);
  } else fail.push('no snakes on f-pp');

  // ⭕ noughts and crosses: Next asks for a square; then the answer; then ✓ / ✗
  if (await go('f-late.html', 'x.kind === "game" && (!x.piece || x.piece === "tictactoe")')) {
    const w0 = await where();
    await next(); out.tt = Object.assign(await bar(), await where());
    expect('noughts and crosses: Next with no square → the squares hop, "First pick a square"', out.tt.bi === w0.bi && out.tt.nudge >= 9 && /pick a square/.test(out.tt.msg), out.tt);
    if (shots) await p.screenshot({path: path.join(shots, 'gn-4-squares.png')});
    await p.click('[data-gt="0"]'); await p.waitForTimeout(200); await next(); out.ttA = await p.evaluate(() => bs(curBlock()).ttt.shown);
    await next(); out.ttV = await bar();
    expect('a square: Next → its answer, then ✓ / ✗ pulse', out.ttA && out.ttV.nudge === 2, {a: out.ttA, v: out.ttV});
    expect('noughts and crosses fits', await fits(), 'scrolls / wraps');
  } else fail.push('no noughts and crosses on f-late');

  // ⬚ dots and boxes: after ✓ Next asks for a line
  if (await go('f-st.html', 'x.piece === "dots"')) {
    await next(); await p.click('[data-dt-yes]'); await p.waitForTimeout(250); await next(); out.dt = await bar();
    expect('dots: after ✓ Next → the free lines pulse, "First draw a line"', out.dt.nudge > 10 && /draw a line/.test(out.dt.msg), out.dt);
    if (shots) await p.screenshot({path: path.join(shots, 'gn-5-lines.png')});
  } else fail.push('no dots on f-st');

  // 🃏 the deck (tools 28, f-dis): the example first, then Next draws a card; Finish beside Next
  if (await go('f-dis.html', 'x.piece === "deck"')) {
    out.d0 = await bar(); expect('the deck\'s example: no Finish button yet', !out.d0.fin, out.d0);
    for (let k = 0; k < 3 && await p.evaluate(() => rlIntro(curBlock())); k++) await next();
    out.d1 = await bar(); await next(1100);
    out.drawn = await p.evaluate(() => rlSt(curBlock()).dk.at);
    expect('the deck: Next draws a card, Finish beside Next', out.drawn === 0 && /Finish/.test(out.d1.fin), {drawn: out.drawn, bar: out.d1});
    await next(300); expect('Next again → how A says it (the card\'s answer, tools 28)', await p.evaluate(() => !!rlSt(curBlock()).dk.shown && !!document.querySelector('.rl-carda')), await where());
    await next(1100); expect('Next again → the next card, the same screen', (await where()).piece === 'deck' && await p.evaluate(() => rlSt(curBlock()).dk.at) === 1, await where());
    if (shots) await p.screenshot({path: path.join(shots, 'gn-6-deck.png')});
    expect('the deck fits', await fits(), 'scrolls / wraps');
  } else fail.push('no deck on f-dis');

  // 🏝 islands: Next sails
  if (await go('f-st.html', 'x.piece === "islands"')) {
    for (let k = 0; k < 3 && await p.evaluate(() => rlIntro(curBlock())); k++) await next();
    await next(900); out.isl = await p.evaluate(() => (bs(curBlock()).g || {}).seen || []);
    expect('islands: Next sails to an island', out.isl.length === 1, out.isl);
  } else fail.push('no islands on f-st');

  // 🧠 memo: its own steps, no Finish
  if (await go('f-seen.html', 'x.piece === "memo"')) {
    out.memo = await bar(); await next(); out.memoPh = await p.evaluate(() => bs(curBlock()).memo.phase);
    expect('memo: no Finish button, Next → ▶ as before', !out.memo.fin && out.memoPh === 'look', {bar: out.memo, ph: out.memoPh});
  } else fail.push('no memo on f-seen');

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK games next'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
