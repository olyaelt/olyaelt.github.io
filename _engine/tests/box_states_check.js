// tools 30 (B2 6.11 fixes-5, her 15:34: the box opens less and less through the lesson): a block's box is open, gapped (first letters,
// tap the yellow, «Show all») or folded (a thin bar «Useful language · Stuck? Peek ▸»); "box_state" is the default; Peek / Show all / Fold
// change it on this screen only. The B2 6.11 defaults: Warm-up debate gapped, the talk after the text gapped, Practice gapped, the model
// open, snakes and the real stories folded.
//   node tests/box_states_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch();
  for (const vp of [{width: 1280, height: 720}, {width: 390, height: 844}]) {
    const p = await (await b.newContext({viewport: vp})).newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto('file://' + path.join(site, 'tools/b2-2026-11-06/stages-of-life.html')); await p.waitForTimeout(400);
    const st = await p.evaluate(() => { const r = {}; D.stages.forEach((s, si) => s.blocks.forEach((b, bi) => { if (!b.box || b.kind === 'box') return; goStage(si, false); S.intro = false; goBlock(si, bi);
      const side = document.querySelector('#side'), ab = side.querySelector('aside.box'), fold = side.querySelector('.box-fold');
      r[`${s.label} ${bi} ${b.kind}`] = {state: boxState(b), shown: ab ? 'box' : fold ? 'bar' : '-', bh: ab ? ab.querySelectorAll('.bh').length : 0, barH: fold ? Math.round(fold.getBoundingClientRect().height) : 0, boxB: ab ? Math.round(ab.getBoundingClientRect().bottom) : 0}; })); return r; });
    const want = {'👋 Warm-up': 'gapped', '📖 The text': 'gapped', '🃏 Practice': 'gapped'};
    for (const [k, v] of Object.entries(st)) {
      const stage = Object.keys(want).find(x => k.startsWith(x)), w = stage ? want[stage] : /model/.test(k) ? 'open' : /Use it/.test(k) ? 'folded' : 'open';
      expect(`${vp.width}: ${k} opens ${w}`, v.state === w, v);
      if (v.state === 'gapped') expect(`${vp.width}: ${k} gapped — the phrases hidden`, v.shown === 'box' && v.bh > 10, v);
      if (v.state === 'folded') expect(`${vp.width}: ${k} folded — one thin bar`, v.shown === 'bar' && v.barH > 0 && v.barH <= 50, v);
      if (v.state === 'open') expect(`${vp.width}: ${k} open — nothing hidden`, v.shown === 'box' && v.bh === 0, v);
      if (vp.width === 1280 && v.shown === 'box') expect(`${vp.width}: ${k} the box whole on the screen`, v.boxB <= 720, v); }
    if (vp.width === 1280) {
      await p.evaluate(() => { const si = D.stages.findIndex(s => /Use it/.test(s.label)); goStage(si, false); S.intro = false; goBlock(si, 1); }); await p.waitForTimeout(200);
      const seq = [];
      await p.click('#side .box-fold'); await p.waitForTimeout(150); seq.push(await p.evaluate(() => boxState(curBlock())));
      await p.click('#side [data-boxst="open"]'); await p.waitForTimeout(150); seq.push(await p.evaluate(() => boxState(curBlock()) + ':' + document.querySelectorAll('#side .bh').length));
      await p.click('#side [data-boxst="folded"]'); await p.waitForTimeout(150); seq.push(await p.evaluate(() => boxState(curBlock())));
      expect('Peek → gapped, Show all → open, Fold → the bar', seq.join() === 'gapped,open:0,folded', seq);
      await p.click('#side .box-fold'); await p.waitForTimeout(150);
      await p.evaluate(() => goBlock(S.stage, 0)); await p.waitForTimeout(150); out.next = await p.evaluate(() => boxState(curBlock()));
      await p.evaluate(() => goBlock(S.stage, 1)); await p.waitForTimeout(150); out.back = await p.evaluate(() => boxState(curBlock()));
      expect('the state isn\'t remembered: each screen opens in its own default', out.next === 'open' && out.back === 'folded', out);
      await p.evaluate(() => { goStage(D.stages.findIndex(s => /Practice/.test(s.label)), false); S.intro = false; goBlock(S.stage, 0); }); await p.waitForTimeout(200);
      await p.click('#side aside.box .bh >> nth=0'); await p.waitForTimeout(150);
      expect('gapped: tap a yellow, it opens', await p.evaluate(() => document.querySelectorAll('#side .bh.open').length === 1), 'bh');
    }
    await p.context().close(); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK box states'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
