// Engine 41: in a listening task the bookmark hint stays one line, however many clips are checked (a B2 student, 29.10: one more line on every clip).
//   node tests/revhint_listen_check.js PAGE   (a page whose listening task has 3+ clips)
const {chromium, devices} = require('playwright'); const path = require('path');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
const OK = `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({...devices['iPhone 13']}); const errs = [];
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: OK}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForTimeout(400);
  const id = await p.evaluate(() => (TASKS.find(t => t.steps && t.steps.filter(s => s.type === 'listen').length >= 3) || {}).id);
  await p.click(`[data-open="${id}"]`); await p.waitForTimeout(500);
  const counts = [];
  for (let k = 0; k < 3; k++) { await p.click('#go'); await p.waitForTimeout(150); counts.push(await p.locator('.rev-hint').count()); await p.click('#go'); await p.waitForTimeout(250); counts.push(await p.locator('.rev-hint').count()); }
  console.log(JSON.stringify({id, counts, errs}));
  const ok = counts.every(c => c <= 1) && counts[0] === 1 && !errs.length;
  console.log(ok ? 'OK one bookmark hint' : 'FAILED one bookmark hint'); await b.close(); process.exit(ok ? 0 : 1);
})();
