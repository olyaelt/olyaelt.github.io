// tools 30 also (B2 debrief 6.11: «📋 Copy the hard cards» wasn't on the lesson page): on her device the 👥 dots of a cards block and of a game
// have 📋 Copy the hard cards — the cards the groups sent back, most often first, front → answer; nothing sent back → it says so.
//   node tests/gd_copy_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 720}});
  await ctx.addInitScript(() => { try { localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('hw-code', 'TEST'); } catch (e) {} });
  await ctx.route(/script\.google\.com|googleusercontent/, r => r.fulfill({status: 200, contentType: 'application/json', body: '{"ok":true,"rows":[]}'}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
  await p.goto('file://' + path.join(site, 'tools/b2-2026-11-06/stages-of-life-live.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { window.copyText = async t => { window.__copied = t; return true; }; });
  for (const bi of [0, 1]) {
    await p.evaluate(bi => { const si = D.stages.findIndex(s => /Practice/.test(s.label)); goStage(si, false); S.intro = false; goBlock(si, bi); }, bi); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__copied = null; GW.decks = []; onGroupData(); }); await p.waitForTimeout(100);
    out['btn' + bi] = await p.locator('#main [data-gdots] [data-gd-copy]').count(); expect(`block ${bi}: the button`, out['btn' + bi] === 1, out['btn' + bi]);
    if (!out['btn' + bi]) continue;
    await p.click('#main [data-gdots] [data-gd-copy]'); await p.waitForTimeout(150);
    out['empty' + bi] = await p.evaluate(() => [window.__copied, document.querySelector('#main [data-gd-copy]').innerText]);
    expect(`block ${bi}: nothing sent back`, out['empty' + bi][0] === null && /Nothing sent back/.test(out['empty' + bi][1]), out['empty' + bi]);
    await p.evaluate(() => { const b = curBlock(), L = b.kind === 'game' ? b.tasks : b.cards, now = Date.now();
      GW.decks = [{ts: now, again: {[L[2]._n]: 2, [L[0]._n]: 1}, got: [L[1]._n]}, {ts: now, again: {[L[2]._n]: 1}, got: []}]; onGroupData(); }); await p.waitForTimeout(2300);
    await p.click('#main [data-gdots] [data-gd-copy]'); await p.waitForTimeout(150);
    const t = await p.evaluate(() => window.__copied || ''); out['text' + bi] = t.split('\n').slice(0, 4);
    const lines = t.split('\n');
    expect(`block ${bi}: most often first`, /^3× \(on 2 screens\) · /.test(lines[1] || '') && /^1× · /.test(lines[2] || '') && / → /.test(lines[1] || ''), lines);
    expect(`block ${bi}: no markup`, !/\*\*|\(\(|<g>|~~/.test(t), t);
    expect(`block ${bi}: the counts`, /Got it, never sent back: 1 · not reached: \d+/.test(t), lines.slice(-1)); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK copy the hard cards'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
