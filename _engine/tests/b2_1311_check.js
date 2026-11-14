// engine 89 (lesson-B2 TZ 14.11 16:30): B2 13.11 «The Intern · Scene 1: Come rain or shine» — the tasks in order, the steps as the TZ counts
// them, «If you want more» optional (out of the total), Fiona's message hidden first, b9 at her shifted time; screenshots for Olya.
//   node tests/b2_1311_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 400, height: 860}, deviceScaleFactor: shots ? 2 : 1});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: 'window.YT={Player:function(id,o){setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30);this.seekTo=()=>{};this.playVideo=()=>{};this.pauseVideo=()=>{};this.getCurrentTime=()=>0;this.getPlayerState=()=>-1;this.setPlaybackRate=()=>{};this.cueVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>{}}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);'}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.join(site, 'b2/2026-11-13.html')); await p.waitForTimeout(600);
  const st = await p.evaluate(() => ({title: document.title, ids: TASKS.map(t => t.id), n: Object.fromEntries(TASKS.map(t => [t.id, (t.steps || []).length])),
    total: (document.querySelector('.total') || {}).textContent || '', opt: [...document.querySelectorAll('.later-tag')].map(x => x.textContent),
    kinds: TASKS.find(t => t.id === 'e1').steps.map(s => s.type === 'rewrite' ? 'rw' : 'say').join(','),
    b9: TASKS.find(t => t.id === 'b2_2').steps.map(s => s.clip).find(c => c[0][0] === 'tZNBy-BdM2A').map(l => l[1])}));
  ok(/The Intern · Scene 1: Come rain or shine/.test(st.title), 'title ' + st.title);
  ok(st.ids.join() === 'r1,e1,e2,b2_1,b2_2,otu,more,earlier' || st.ids.join() === 'r1,e1,e2,b2_1,b2_2,otu,more', 'order ' + st.ids);
  ok(st.n.r1 === 4 && st.n.e1 === 22 && st.n.e2 === 8 && st.n.b2_1 === 7 && st.n.b2_2 === 7 && st.n.more === 10, 'steps ' + JSON.stringify(st.n));
  ok(st.kinds === 'rw,say,rw,say,rw,say,rw,say,rw,say,rw,say,rw,say,rw,say,rw,say,rw,say,say,say', 'e1 rw/say ' + st.kinds);
  ok(st.opt.includes('optional') && /About \d+ minutes/.test(st.total), 'optional tag, total: ' + JSON.stringify(st));
  ok(JSON.stringify(st.b9) === '[417.44,418.94,420.54]', 'b9 shifted ' + JSON.stringify(st.b9));
  // the total leaves «more» out: r1 12 + e1 15 + e2 20 + 4 + 4 + otu 12 = 67 → about 65 (look back on top)
  if (shots) await p.screenshot({path: path.join(shots, 'b2_1311_list.png'), fullPage: true});
  await p.click('[data-open="r1"]'); await p.waitForTimeout(500); if (shots) await p.screenshot({path: path.join(shots, 'b2_1311_r1.png'), fullPage: true});
  await p.evaluate(() => goHome()); await p.waitForTimeout(300);
  await p.click('[data-open="e2"]'); await p.waitForTimeout(500); if (shots) await p.screenshot({path: path.join(shots, 'b2_1311_e2.png'), fullPage: true});
  await p.evaluate(() => goHome()); await p.waitForTimeout(300);
  await p.click('[data-open="otu"]'); await p.waitForTimeout(500);
  const go = await p.evaluate(() => (document.getElementById('go') || {}).textContent || '');
  ok(/Show Fiona's message/.test(go), "Fiona's message hidden at first: " + go);
  if (shots) await p.screenshot({path: path.join(shots, 'b2_1311_otu.png'), fullPage: true});
  await p.evaluate(() => goHome()); await p.waitForTimeout(300);
  await p.click('[data-open="more"]'); await p.waitForTimeout(500); if (shots) await p.screenshot({path: path.join(shots, 'b2_1311_more.png'), fullPage: true});
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK B2 13.11'); process.exit(fail.length ? 1 : 0);
})();
