// AL chat 12.11 14:30 («нужно одно: чтобы у заданий listen записывался первый ответ»): a listen task's gaps go into the Attempts sheet —
// one row per gap with the student, the page, the gap's id, what was typed before its first Check, right or not, the time; a second Check changes nothing.
//   node tests/listen_first_check.js SITE_DIR [page=c1/2026-10-28.html]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'c1/2026-10-28.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(3, 1, 1, 3).setValues([['c1a', 'Clara', 'C1']]);
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1100, height: 900}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', 'c1a'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://hw.test/' + rel); await p.waitForTimeout(900);
  const info = await p.evaluate(() => { const t = TASKS.find(t => t.steps && t.steps.some(s => s.type === 'listen')); const i = t.steps.findIndex(s => s.type === 'listen'), st = t.steps[i];
    return {id: t.id, i, gaps: st.clip.flatMap(l => l[3].filter(x => typeof x !== 'string').map(x => x.gap))}; });
  ok(info.i === 0 && info.gaps.length >= 2, 'the page needs a first listening step with 2+ gaps: ' + JSON.stringify(info));
  await p.click(`[data-open="${info.id}"]`); await p.waitForTimeout(600);
  await p.fill('.gap-in[data-k="0"]', info.gaps[0]); await p.click('.gap-ck[data-k="0"]'); await p.waitForTimeout(150);   // right at once
  await p.fill('.gap-in[data-k="1"]', 'zzz wrong'); await p.click('.gap-ck[data-k="1"]'); await p.waitForTimeout(3000);   // wrong
  const A = env.sheets.Attempts, rows = () => A ? A.getRange(2, 1, Math.max(1, A.getLastRow() - 1), 14).getValues().filter(r => r[0]) : [];
  const R = rows();
  const r0 = R.find(r => /\.g0$/.test(r[6])), r1 = R.find(r => /\.g1$/.test(r[6]));
  ok(R.length === 2 && r0 && r1, 'not one row per gap: ' + JSON.stringify(R));
  ok(r0 && r0[2] === 'Clara' && r0[10] === info.gaps[0] && r0[11] === '✓' && r0[0], 'the right first try: ' + JSON.stringify(r0));
  ok(r1 && r1[10] === 'zzz wrong' && r1[11] === '✗', 'the wrong first try: ' + JSON.stringify(r1));
  // the same step again (Do it again / a second Check) never changes the first try
  await p.evaluate(() => { const b = document.querySelector('[data-again]'); if(b) b.click(); }); await p.waitForTimeout(400);
  if (await p.locator('.gap-in[data-k="1"]').count()) { await p.fill('.gap-in[data-k="1"]', info.gaps[1]); await p.click('.gap-ck[data-k="1"]'); await p.waitForTimeout(2800); }
  ok(rows().length === 2 && rows().find(r => /\.g1$/.test(r[6]))[10] === 'zzz wrong', 'a later try changed the first: ' + JSON.stringify(rows()));
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen: the first try of each gap is in the journal'); process.exit(fail.length ? 1 : 0);
})();
