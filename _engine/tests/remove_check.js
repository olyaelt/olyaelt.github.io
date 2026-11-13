// engine 79 (her 12.11: «кнопочку „Удалить из домашки“»): in her view a listening clip or a 🎬 line has «🗑 Remove this … from the
// homework»; her table keeps it (sheet «Removed from homework»), every student's sync brings it, and the student's task opens without
// it — the other screens keep their numbers in the journal. She still sees it, marked, with «↩ Bring back».
//   node tests/remove_check.js SITE_DIR [page=b2/2026-11-11.html]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-11-11.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const KEY = html.match(/const PAGE_KEY = "([^"]+)"/)[1], G = rel.split('/')[0].toUpperCase();
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['s1', 'Mila', G]]);
  const b = await chromium.launch();
  const page = async code => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}});
    await ctx.addInitScript(([c, t]) => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', t ? 'teacher' : ''); }catch(e){} }, [code, code === tc]);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/' + rel); await p.waitForTimeout(1500); return p; };
  // her view: l2, screen 2 → remove it
  const T = await page(tc);
  const n0 = await T.evaluate(() => TASKS.find(t => t.id === 'l2').steps.length);
  await T.evaluate(() => { openTask('l2'); stepIdx = 1; renderTask(); }); await T.waitForTimeout(500);
  ok(await T.locator('[data-rmon="1"]').count() === 1, 'her view: no «Remove this clip» under the clip');
  if (process.argv[4]) await T.screenshot({path: path.join(process.argv[4], 'remove_before.png')});
  await T.click('[data-rmon="1"]'); await T.waitForTimeout(800);
  ok(await T.locator('.t-rm.is-gone [data-rmon="0"]').count() === 1, 'her view: the clip is not marked removed with ↩ Bring back');
  if (process.argv[4]) await T.screenshot({path: path.join(process.argv[4], 'remove_after.png')});
  const sh = env.sheets['Removed from homework'], rows = sh ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : [];
  ok(rows.some(r => r[1] === KEY && r[2] === 'l2:s1' && r[3] === true), 'the table: ' + JSON.stringify(rows));
  ok(await T.evaluate(() => TASKS.find(t => t.id === 'l2').steps.length) === n0, 'her view lost the removed clip');
  // a student: the task opens without it; the next clip keeps its number in the journal
  const S = await page('s1');
  const st = await S.evaluate(() => { openTask('l2'); return {n: current.steps.length, orig: current.steps.map(s => s._orig)}; });
  ok(st.n === n0 - 1 && !st.orig.includes(1) && st.orig[1] === 2, 'the student still sees the clip: ' + JSON.stringify(st));
  await S.evaluate(() => { stepIdx = 1; checked = false; renderTask(); }); await S.waitForTimeout(500);
  ok(await S.locator('.t-rm').count() === 0, 'a student sees her button');
  const k = await S.evaluate(() => document.querySelector('.gap-in').dataset.k);
  await S.click('.ln.has-gap .pl'); await S.waitForTimeout(1500);
  await S.fill(`.gap-in[data-k="${k}"]`, 'that'); await S.click(`.gap-ck[data-k="${k}"]`); await S.waitForTimeout(2600);
  const A = env.sheets.Attempts, at = A ? A.getRange(2, 1, A.getLastRow() - 1, 8).getValues().map(r => r[6]) : [];
  ok(at.some(x => /^l2:s2\.g/.test(x)), 'the next clip is not s2 in the journal: ' + JSON.stringify(at));
  // ↩ Bring back: the student has it again
  await T.click('[data-rmon="0"]'); await T.waitForTimeout(800);
  await S.reload(); await S.waitForTimeout(1500);
  const n2 = await S.evaluate(() => { openTask('l2'); return current.steps.length; });
  ok(n2 === n0, 'after ↩ Bring back the student still misses the clip: ' + n2 + ' of ' + n0);
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK remove from homework'); process.exit(fail.length ? 1 : 0);
})();
