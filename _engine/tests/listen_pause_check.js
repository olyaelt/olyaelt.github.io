// engine 83 (her 13.11 16:47: in class «слушали много раз, и полоса так и не появилась»): the first listen of a screen is the whole clip; the
// strip opens at once; if that clip stops before its end (paused or ended on YouTube), the next tap plays the line, not the whole clip again.
//   node tests/listen_pause_check.js SITE_DIR [page=b2/2026-11-11.html]
const {chromium} = require('playwright'); const path = require('path');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-11-11.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, rel)); await p.waitForTimeout(600);
  // the first screen of a clip with a gap below its top line
  let w = null, gi = -1;
  for (const [id, n] of await p.evaluate(() => TASKS.filter(t => (t.steps || []).some(s => s.clip)).map(t => [t.id, t.steps.length]))) {
    for (let i = 0; i < n && gi < 1; i++) { await p.evaluate(([id, i]) => { openTask(id); stepIdx = i; checked = false; renderTask(); }, [id, i]); await p.waitForTimeout(250);
      gi = await p.evaluate(() => [...document.querySelectorAll('.ln')].findIndex((x, k) => k > 0 && x.classList.contains('has-gap'))); w = [id, i]; }
    if (gi > 0) break; }
  ok(gi > 0, 'no clip with a gap below its top line');
  const cl = await p.evaluate(() => current.steps[stepIdx].clip.map(l => l[1]));
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click(`.ln[data-i="${gi}"] .pl`); await p.waitForTimeout(200);
  ok(await p.locator('.lstrip').count() === 1, 'no strip at once');
  ok((await p.evaluate(() => (window._yl || []).splice(0))).some(x => x[0] === 'seek' && Math.abs(x[1] - Math.max(0, cl[0] - 1)) < .01), 'the first tap is not the whole clip');
  // engine 83 (her 16:59): a tap while the whole clip plays plays the line
  await p.click(`.ln[data-i="${gi}"] .pl`); await p.waitForTimeout(200);
  { const L0 = await p.evaluate(() => (window._yl || []).splice(0)); ok(L0.some(x => x[0] === 'seek' && Math.abs(x[1] - (cl[gi] - 1)) < .01), 'a tap during the whole clip does not play the line: ' + JSON.stringify(L0)); }
  await p.evaluate(() => ytPlayer.pauseVideo()); await p.waitForTimeout(200);   // stopped on YouTube before its end
  await p.click(`.ln[data-i="${gi}"] .pl`); await p.waitForTimeout(200);
  const L = await p.evaluate(() => (window._yl || []).splice(0));
  ok(L.some(x => x[0] === 'seek' && Math.abs(x[1] - (cl[gi] - 1)) < .01) && !L.some(x => x[0] === 'seek' && Math.abs(x[1] - Math.max(0, cl[0] - 1)) < .01), 'after a stopped whole clip the tap plays the whole clip again: ' + JSON.stringify(L));
  // engine 83 (her 16:51): after Check the checked line has its strip even if it never played; after Check answers too
  await p.evaluate(([id, i]) => { localStorage.clear(); localStorage.setItem('hw-yt-ok', '1'); openTask(id); stepIdx = i + 1 < current.steps.length ? i + 1 : i; checked = false; renderTask(); }, w); await p.waitForTimeout(500);
  const g2 = await p.evaluate(() => [...document.querySelectorAll('.ln')].findIndex(x => x.classList.contains('has-gap')));
  const k2 = await p.evaluate(g => document.querySelector(`.ln[data-i="${g}"] .gap-in`).dataset.k, g2);
  await p.fill(`.gap-in[data-k="${k2}"]`, 'lala'); await p.click(`.gap-ck[data-k="${k2}"]`); await p.waitForTimeout(400);
  ok(await p.evaluate(g => { const s = document.querySelector('.lstrip'); return !!s && s.previousElementSibling === document.querySelector(`.ln[data-i="${g}"]`); }, g2), 'no strip under the line after Check');
  await p.evaluate(([id, i]) => { openTask(id); stepIdx = i; checked = false; renderTask(); }, w); await p.waitForTimeout(500);
  await p.evaluate(() => { localStorage.clear(); }); await p.evaluate(([id, i]) => { openTask(id); stepIdx = i; checked = false; renderTask(); }, w); await p.waitForTimeout(500);
  if (!(await p.locator('.lstrip').count())) { await p.click('#go'); await p.waitForTimeout(500); ok(await p.locator('.lstrip').count() === 1, 'no strip after Check answers'); }
  await b.close(); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen pause: the strip at once; a stopped whole clip still counts; the strip after Check and Check answers'); process.exit(fail.length ? 1 : 0);
})();
