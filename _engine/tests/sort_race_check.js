// tools 30 also (C1 lesson chat 6.11 19:40, her screenshot 19:36: on a fast Next a card landed in the box of the card before): tapping Next
// as fast as possible (and box + Next) through the C1 sort — with the fly animation on — every card ends in its own box, no card is skipped,
// and the end screen is the answer key; ** shows as bold.
//   node tests/sort_race_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch();
  for (const how of ['next', 'box']) {
    const p = await (await b.newContext({viewport: {width: 1280, height: 720}})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(site, 'tools/c1-2026-11-06/has-it-changed.html')); await p.waitForTimeout(400);
    await p.evaluate(() => { const si = D.stages.findIndex(s => /Practice/.test(s.label)); goStage(si, false); S.intro = false; goBlock(si, D.stages[si].blocks.findIndex(b => b.kind === 'sort')); }); await p.waitForTimeout(300);
    const seen = new Set();
    for (let k = 0; k < 200; k++) { const st = await p.evaluate(() => { if (curBlock().kind !== 'sort') return {done: true, left: true}; const Q = soSt(curBlock()); return {done: Q.done, at: Q.at, open: Q.open, landed: Q.landed, p: curBlock().items[Q.at].p}; });
      if (st.done) break; if (st.open) seen.add(st.at);
      if (how === 'box' && st.open && !st.landed) { await p.click(`[data-fsp="${st.p}"]`).catch(() => {}); }
      await p.click('[data-step]'); await p.click('[data-step]').catch(() => {}); await p.waitForTimeout(60); }
    await p.evaluate(() => { if (curBlock().kind !== 'sort') goBlock(S.stage, D.stages[S.stage].blocks.findIndex(b => b.kind === 'sort')); }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const b = curBlock(), Q = soSt(b); return {done: Q.done, wrong: b.items.map((x, i) => Q.placed[i] === x.p ? null : [i, x.p, Q.placed[i]]).filter(Boolean),
      sum: [...document.querySelectorAll('.fsort.done .fs-pat')].map(x => [...x.querySelectorAll('li b, li strong')].map(l => l.innerText).join(',')), stars: /\*\*/.test(document.querySelector('.fsort').innerText)}; });
    out[how] = {seen: seen.size, sum: r.sum};
    expect(`${how}: reached the end`, r.done, r); expect(`${how}: every card in its own box`, r.wrong.length === 0, r.wrong);
    expect(`${how}: every card was opened`, seen.size === 15, seen.size);
    expect(`${how}: the end screen is the key`, r.sum.join(' | ') === 'greener,busier,emptier,cleaner,dirtier,safer,fancier | more built-up,more crowded,more dangerous,more run-down | quieter,more quiet,livelier,more lively | better,worse', r.sum);
    expect(`${how}: no raw **`, !r.stars, r.stars);
    await p.context().close(); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK sort on a fast Next'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
