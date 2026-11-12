// engine 71 (her 12.11 16:16–16:17, the AL chat's order comparison): ORDER_AB on a page — each student gets the tasks in his half's order (the half
// from her table, equal halves per group), with no text about it; the order holds from the first task he opens; every first try says its half;
// her view: the x order and one line; 📊 First tries → 📋 For the analysis: no names, the half, the time, the order each student did.
//   node tests/order_ab_check.js SITE_DIR [page=b2/2026-11-11.html]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-11-11.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 2, 3).setValues([['b2a', 'Anna', 'B2'], ['b2b', 'Boris', 'B2']]);
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch();
  const open = async (code, role, extra) => { const ctx = await b.newContext({viewport: {width: 1100, height: 900}});
    await ctx.addInitScript(([c, r, x]) => { try{ localStorage.setItem('hw-yt-ok', '1'); if(c) localStorage.setItem('hw-code', c); if(r) localStorage.setItem('hw-role', r); Object.entries(x || {}).forEach(([k, v]) => localStorage.setItem(k, v)); }catch(e){} }, [code, role, extra]);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/' + rel); await p.waitForTimeout(1200); return {ctx, p}; };
  const order = p => p.evaluate(() => [...document.querySelectorAll('[data-open]')].map(x => x.dataset.open).filter(x => /^l/.test(x)).join(','));   // the YouTube tasks (the film block comes after them for everyone)
  const O = {x: 'l1,l2,l3', y: 'l2,l1,l3'};
  // two students of one group: the table gives them different halves; each sees his order, no word about halves or birthdays
  const A = await open('b2a'), B = await open('b2b');
  const hA = await A.p.evaluate(() => localStorage.getItem('hw-half-b2a')), hB = await B.p.evaluate(() => localStorage.getItem('hw-half-b2b'));
  ok(/^[xy]$/.test(hA) && /^[xy]$/.test(hB) && hA !== hB, 'the halves: ' + hA + ' ' + hB);
  ok(await order(A.p) === O[hA] && await order(B.p) === O[hB], 'the order: ' + await order(A.p) + ' / ' + await order(B.p));
  ok(!/half|order|birthday|Born on/i.test(await A.p.textContent('#app')), 'text about the order on the student\'s page');
  // a first try says the half and the comparison
  const first = O[hA].split(',')[0]; await A.p.click(`[data-open="${first}"]`); await A.p.waitForTimeout(500);
  // engine 76: these lines are «listen once» first — the line plays, then what they caught, then Check
  await A.p.evaluate(() => document.querySelector('.gap-in[data-k="0"]').closest('.ln').click()); await A.p.waitForTimeout(1500);
  await A.p.fill('.gap-in[data-k="0"]', 'zzz'); await A.p.click('[data-l1ok]'); await A.p.click('.gap-ck[data-k="0"]'); await A.p.waitForTimeout(2800);
  const At = env.sheets.Attempts, row = At.getRange(2, 1, At.getLastRow() - 1, 26).getValues().find(r => r[2] === 'Anna');
  ok(row && row[24] === hA && /order/.test(row[25]), 'the half in the journal: ' + JSON.stringify(row));
  // the order holds once a task was opened, even if the half changes
  await A.p.evaluate(h => localStorage.setItem('hw-half-b2a', h === 'x' ? 'y' : 'x'), hA); await A.p.goto('https://hw.test/' + rel); await A.p.waitForTimeout(600);
  ok(await order(A.p) === O[hA], 'the order changed after a task was opened');
  await A.ctx.close(); await B.ctx.close();
  // no code: this device picks a half and keeps it
  const N = await open(''); const o1 = await order(N.p); await N.p.reload(); await N.p.waitForTimeout(500); ok((o1 === O.x || o1 === O.y) && await order(N.p) === o1, 'no code: ' + o1); await N.ctx.close();
  // her view: the x order, one line; 📋 For the analysis: no names, S1, the half, the order
  const T = await open(tc, 'teacher'); await T.p.waitForTimeout(600);
  ok(await order(T.p) === O.x && /half's order/.test(await T.p.textContent('.order-note')), 'her view: ' + await order(T.p));
  await T.p.click('#ft-open'); await T.p.waitForTimeout(1200);
  const txt = await T.p.evaluate(async () => { const r = await ftSummary(true); return ftForAnalysis(r); });
  ok(/S1/.test(txt) && !/Anna|Boris/.test(txt) && new RegExp('\\tS?' + hA).test(txt.replace(/^S1\t/m, '\t')) && /half x — There is/.test(txt) && /S1 · half [xy]: /.test(txt), 'for the analysis:\n' + txt);
  await T.ctx.close(); await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK the order by halves'); process.exit(fail.length ? 1 : 0);
})();
