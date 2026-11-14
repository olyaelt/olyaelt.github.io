// engine 87 (AL chat 14.11 12:10, her 13:13): C1 13.11 gets the two listening quizzes after the arc text, before Over to you (no «for later»);
// «Get out or go out?» carries her rule folded under the instruction on every clip; the last clip also takes «get out, out of the house».
//   node tests/c1_1311_listen_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const path = require('path');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>f.remove();
 setTimeout(()=>{o.events&&o.events.onReady&&o.events.onReady()},30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 400, height: 860}, deviceScaleFactor: 2});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.join(site, 'c1/2026-11-13.html')); await p.waitForTimeout(600);
  let st = await p.evaluate(() => ({ids: TASKS.map(t => t.id), later: TASKS.filter(t => t.later).length, btn: [...document.querySelectorAll('[data-open]')].map(b => b.dataset.open),
    n1: TASKS[3].steps.length, g1: TASKS[3].steps.flatMap(s => s.clip.flatMap(l => l[3].filter(q => typeof q !== 'string'))).length,
    n2: TASKS[4].steps.length, g2: TASKS[4].steps.flatMap(s => s.clip.flatMap(l => l[3].filter(q => typeof q !== 'string'))).length,
    caps: TASKS.slice(3, 5).flatMap(t => t.steps.flatMap(s => s.clip.flatMap(l => l[3].map(q => typeof q === 'string' ? q : q.gap)))).filter(x => /[A-Z]{4,}/.test(x))}));
  ok(st.ids.join().replace(',earlier', '') === 'r1,e1,e2,c1_1,c1_2,otu' && st.later === 0 && st.btn.includes('c1_1') && st.btn.includes('c1_2'), 'the order: ' + JSON.stringify(st));
  ok(st.n1 === 9 && st.g1 === 11 && st.n2 === 8 && st.g2 === 8 && !st.caps.length, '9 · 11 and 8 · 8, no capitals: ' + JSON.stringify(st));
  if (shots) await p.screenshot({path: path.join(shots, 'c1_1311_list.png'), fullPage: true});
  // c1_1: no rule
  await p.click('[data-open="c1_1"]'); await p.waitForTimeout(700);
  ok(!(await p.$('.instr .l-rule')), 'Ben\'s phrases: no rule');
  await p.evaluate(() => goHome && goHome()).catch(() => {});
  // c1_2: the rule folded on every clip
  await p.goto('file://' + path.join(site, 'c1/2026-11-13.html')); await p.waitForTimeout(500);
  await p.click('[data-open="c1_2"]'); await p.waitForTimeout(700);
  st = await p.evaluate(() => { const d = document.querySelector('.instr .l-rule'); return d && {open: d.open, h: d.querySelector('summary').textContent, txt: d.textContent}; });
  ok(st && !st.open && st.h === 'Go out or get out?' && /stop sitting at home/.test(st.txt) && /go out for a walk/.test(st.txt), 'the rule, folded: ' + JSON.stringify(st));
  if (shots) await p.screenshot({path: path.join(shots, 'c1_1311_rule_closed.png')});
  await p.click('.instr .l-rule summary'); await p.waitForTimeout(200);
  if (shots) await p.screenshot({path: path.join(shots, 'c1_1311_rule_open.png')});
  // every clip keeps it; the last takes the alt
  for (let i = 1; i < 8; i++) { await p.evaluate(i => { stepIdx = i; checked = false; renderTask(); }, i); await p.waitForTimeout(250);
    if (!(await p.$('.instr .l-rule'))) { ok(false, 'the rule on clip ' + (i + 1)); break; } }
  await p.fill('.gap-in', 'get out, out of the house'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  st = await p.evaluate(() => (document.querySelector('.gap-res') || {}).className || '');
  ok(/ok/.test(st), 'b3 takes «get out, out of the house»: ' + st);
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK C1 13.11: two quizzes, the rule folded on every clip'); process.exit(fail.length ? 1 : 0);
})();
