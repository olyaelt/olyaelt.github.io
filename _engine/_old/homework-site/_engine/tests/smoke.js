// Walk every task of a homework page to the end on a phone screen: node tests/smoke.js ../b2/2026-10-30.html [shots_dir]
// YouTube and the microphone are faked. Fails on any page error or a task that doesn't finish.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const FAKE_YT = `window.YT={Player:function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}};
 setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const file = path.resolve(process.argv[2]); const shots = process.argv[3];
  const b = await chromium.launch({args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']});
  const ctx = await b.newContext({...devices['iPhone 13'], permissions: ['microphone']});
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: FAKE_YT}));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file); await p.waitForTimeout(300);
  if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, 'home.png'), fullPage: true}); }
  const ids = await p.evaluate(() => TASKS.map(t => t.id)); const report = [];
  for (const id of ids) {
    await p.click(`[data-open="${id}"]`); await p.waitForTimeout(150);
    if (shots) await p.screenshot({path: path.join(shots, id + '.png')});
    let clicks = 0;
    while (clicks < 120 && await p.locator('.lesson-head').count() === 0) {
      const go = p.locator('#go, #fin').first();
      if (!(await go.count())) break;
      await go.click(); clicks++; await p.waitForTimeout(60);
    }
    const back = await p.locator('.lesson-head').count() > 0;
    const ticked = back && await p.locator(`.task-row.is-done [data-toggle="${id}"]`).count() > 0;
    report.push(`${back && ticked ? 'ok  ' : 'FAIL'} ${id} (${clicks} taps)`);
    if (!back) { await p.click('#home').catch(() => {}); await p.waitForTimeout(100); }
  }
  console.log(report.join('\n')); console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  await b.close(); process.exit(report.some(r => r.startsWith('FAIL')) || errs.length ? 1 : 0);
})();
