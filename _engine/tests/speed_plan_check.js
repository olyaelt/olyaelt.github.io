// Engine 42: listening speed as three small buttons (normal · 0.75 · 0.5), kept for every clip on this device (a student, 28.10:
// slower than 0.75, and a way back that isn't the same button); the old 🐢 toggle (hw-slow) still reads as 0.75.
// And the plan step of Over to you says why to tap phrases (Julia P., 28.10).
//   node tests/speed_plan_check.js SITE_DIR [shots_dir]   (uses c1/2026-10-28.html for listening, b2/2026-10-23.html for the plan)
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=r=>{(window.__rates=window.__rates||[]).push(r)};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
const OK = `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const site = path.resolve(process.argv[2]); const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  const expect = (name, ok, got) => { if (!ok) fail.push(name + ' ' + JSON.stringify(got)); };
  async function page(file, init){
    const ctx = await b.newContext({...devices['iPhone 13']});
    await ctx.addInitScript(init || (() => {})); await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: OK}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.join(site, file)); await p.waitForTimeout(400); return {ctx, p};
  }
  const spd = p => p.evaluate(() => ({btns: [...document.querySelectorAll('#spd [data-rate]')].map(x => x.textContent + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')),
    last: (window.__rates || []).slice(-1)[0], label: (document.querySelector('.spd-l') || {}).textContent, oldBtn: !!document.getElementById('slow')}));
  // 1. speed
  { const {ctx, p} = await page('c1/2026-10-28.html');
    const id = await p.evaluate(() => TASKS.find(t => t.steps && t.steps[0] && t.steps[0].type === 'listen').id);
    await p.click(`[data-open="${id}"]`); await p.waitForTimeout(600);
    let v = await spd(p); out.start = v;
    expect('three buttons, normal on, no old toggle', JSON.stringify(v.btns) === JSON.stringify(['normal*', '0.75', '0.5']) && !v.oldBtn && /Speed/.test(v.label), v);
    await p.locator('.ln').nth(0).click({position: {x: 8, y: 8}}); await p.waitForTimeout(150); v = await spd(p); expect('plays at 1', v.last === 1, v);
    await p.click('#spd [data-rate="0.5"]'); await p.waitForTimeout(100); v = await spd(p); out.half = v;
    expect('0.5 on, the player slows down at once', JSON.stringify(v.btns) === JSON.stringify(['normal', '0.75', '0.5*']) && v.last === 0.5, v);
    if (shots) await p.screenshot({path: path.join(shots, 'speed-0.5.png')});
    await p.click('#go'); await p.waitForTimeout(150); await p.click('#go'); await p.waitForTimeout(500);
    v = await spd(p); out.nextClip = v; expect('the next clip keeps 0.5', JSON.stringify(v.btns) === JSON.stringify(['normal', '0.75', '0.5*']), v);
    await p.locator('.ln').nth(0).click({position: {x: 8, y: 8}}); await p.waitForTimeout(150); v = await spd(p); expect('plays at 0.5', v.last === 0.5, v);
    await p.click('#spd [data-rate="1"]'); await p.waitForTimeout(100); v = await spd(p); out.back = v;
    expect('normal brings it back', JSON.stringify(v.btns) === JSON.stringify(['normal*', '0.75', '0.5']) && v.last === 1, v);
    out.store = await p.evaluate(() => ({rate: localStorage.getItem('hw-rate'), slow: localStorage.getItem('hw-slow')}));
    await ctx.close(); }
  // 2. the old toggle's choice reads as 0.75
  { const {ctx, p} = await page('c1/2026-10-28.html', () => { try{ localStorage.setItem('hw-slow', '1'); }catch(e){} });
    const id = await p.evaluate(() => TASKS.find(t => t.steps && t.steps[0] && t.steps[0].type === 'listen').id);
    await p.click(`[data-open="${id}"]`); await p.waitForTimeout(600); const v = await spd(p); out.legacy = v;
    expect('old hw-slow = 0.75', JSON.stringify(v.btns) === JSON.stringify(['normal', '0.75*', '0.5']), v); await ctx.close(); }
  // 3. the plan step's why
  { const {ctx, p} = await page('b2/2026-10-23.html');
    const t = await p.evaluate(() => { const t = TASKS.find(t => t.steps && t.steps.some(s => s.type === 'plan')); return t && {id: t.id, at: t.steps.findIndex(s => s.type === 'plan')}; });
    if (!t) fail.push('no plan step on the page'); else {
      await p.click(`[data-open="${t.id}"]`); await p.waitForTimeout(400);
      for (let i = 0; i < t.at; i++) { await p.click('#go'); await p.waitForTimeout(250); }
      const v = await p.evaluate(() => ({instr: (document.querySelector('.instr') || {}).innerText, why: (document.querySelector('.instr .instr-why') || {}).textContent, picks: document.querySelectorAll('.pick').length}));
      out.plan = v; expect('plan: the why line under the instruction', v.picks > 0 && /remember to use them/.test(v.why || '') && /Tap the phrases/.test(v.instr || ''), v);
      if (shots) await p.screenshot({path: path.join(shots, 'plan-why.png')}); }
    await ctx.close(); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK speed + plan why'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
