// engine 85 (her 14.11 09:46: «в интерфейсе отслушки иметь ровно такой же интерфейс, как у нас в упражнениях… не могу кликнуть на верхнюю
// строчку и проиграть все»): her rate page is a homework page — each clip a listening step exactly as the students meet it (the top line
// plays the whole clip, a line plays itself, speed, strip, Check); after Check her rating under the clip: what she typed and her ▶ before
// the answer, 1–5, why, a note, 🗑 out of the homework; groups and quizzes after she rates; kept in her table (sheet «My ratings»).
//   node tests/rate_page_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], rel = 'prep/rate-2026-11-13.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  const b = await chromium.launch();
  const page = async code => {
    const ctx = await b.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(([c, t]) => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', t ? 'teacher' : ''); }catch(e){} }, [code, code === tc]);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith(rel)) return r.fulfill({status: 200, contentType: 'text/html', body: html});
      const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/' + rel); await p.waitForTimeout(1500); return p; };
  const T = await page(tc);
  await T.evaluate(() => openTask('rate')); await T.waitForTimeout(600);
  let st = await T.evaluate(() => ({n: current.steps.length, top: (document.querySelector('.ln[data-i="0"] .whole-note') || {}).textContent, box: !!document.getElementById('rtbox') && document.getElementById('rtbox').hidden, rm: !!document.querySelector('.t-rm'), spd: !!document.getElementById('spd')}));
  ok(st.n === 30 && /whole clip/.test(st.top || '') && st.box === true && !st.rm && st.spd, 'the screen is the students\' listening screen, the rating hidden: ' + JSON.stringify(st));
  // engine 86 (her 11:27): all the clips on top — the two to listen again red and first, the two new ones last, white
  st = await T.evaluate(() => [...document.querySelectorAll('.rt-li')].map(b => b.textContent + (b.classList.contains('red') ? '*' : '')));
  // her 11:34: the red and the white at the end — the first part is done, we finish the end
  ok(st.length === 30 && st[26] === 'b9*' && st[27] === 'h1*' && st[28] === 'a13' && st[29] === 'a14' && st.filter(x => x.endsWith('*')).length === 2, 'the clip list: ' + st.join(' '));
  // the top line plays the whole clip; then she types and checks
  await T.evaluate(() => (window._yl || []).splice(0)); await T.click('.ln[data-i="0"] .pl'); await T.waitForTimeout(400);
  const L = await T.evaluate(() => (window._yl || []).splice(0)), c0 = await T.evaluate(() => current.steps[0].clip[0][1]);
  ok(L.some(x => x[0] === 'seek' && x[1] <= c0 && x[1] >= c0 - 1.2), 'the top line plays the clip from its start: ' + JSON.stringify(L) + ' ' + c0);
  await T.waitForTimeout(300);
  const g0 = await T.evaluate(() => current.steps[0].clip.flatMap(l => l[3].filter(p => typeof p !== 'string').map(p => p.gap)));
  const ins = await T.$$('.gap-in'); for (let k = 0; k < ins.length; k++) await ins[k].fill(k === 0 ? 'something else' : g0[k]);
  await T.click('#go'); await T.waitForTimeout(500);
  st = await T.evaluate(() => { const b = document.getElementById('rtbox'); return {hidden: b.hidden, you: (b.querySelector('.rt-meta b') || {}).textContent, plays: b.querySelector('.rt-meta').textContent, lv: b.querySelectorAll('[data-rtl]').length, why: b.querySelectorAll('[data-rtw]').length, gr: /groups hidden/.test(b.textContent)}; });
  ok(!st.hidden && /^something else/.test(st.you) && /▶ [1-9]\d*× before the answer/.test(st.plays) && st.lv === 5 && st.why === 7 && st.gr, 'after Check, her rating: ' + JSON.stringify(st));
  if (shots) await T.screenshot({path: path.join(shots, 'ratepage_checked.png'), fullPage: true});
  await T.click('[data-rtl="4"]'); await T.click('[data-rtw="a word in the gap is swallowed"]'); await T.fill('[data-rtn]', 'fast'); await T.click('[data-rto="1"]'); await T.waitForTimeout(1500);
  st = await T.evaluate(() => ({gr: (document.querySelector('#rtbox .gr') || {}).textContent, out: !!document.querySelector('#rtbox .rt-outon')}));
  const id0 = await T.evaluate(() => current.steps[0].rate.id);
  ok(st.gr && st.out, 'rated: groups shown, out of the homework: ' + JSON.stringify(st));
  ok(await T.evaluate(() => document.querySelector('.rt-li').className.includes('done')), 'the rated clip is green in the list');
  // 📋 Copy all my ratings
  await T.evaluate(() => { window._cp = null; copyText = t => { window._cp = t; }; }); await T.click('[data-rtcopy]');
  const cp = await T.evaluate(() => window._cp || '');
  ok(/\tthe same\?\t/.test(cp) && cp.split('\n').length === 32 && cp.includes('\tOUT\t'), '📋: ' + cp.slice(0, 300));
  const R = env.sheets['My ratings'], rows = R ? R.getRange(2, 1, R.getLastRow() - 1, 14).getValues() : [], r0 = rows.find(r => r[1] === id0), x0 = r0 && JSON.parse(r0[13]);
  ok(r0 && r0[0] === 'hw-2026-11-13' && r0[8] === 4 && /swallowed/.test(r0[9]) && r0[10] === 'fast' && x0.out === true && x0.plays >= 1 && /^something else/.test(r0[7]), 'sheet «My ratings»: ' + JSON.stringify(r0 && r0.slice(0, 13)));
  // another device: from her table; the second clip still as a student meets it
  const Q = await page(tc); await Q.evaluate(() => localStorage.removeItem('rate-hw-2026-11-13')); await Q.reload(); await Q.waitForTimeout(1800);
  await Q.evaluate(() => openTask('rate')); await Q.waitForTimeout(600);
  st = await Q.evaluate(() => { const b = document.getElementById('rtbox'); return {hidden: b.hidden, lv: (b.querySelector('[data-rtl="4"]') || {}).getAttribute && b.querySelector('[data-rtl="4"]').getAttribute('aria-pressed')}; });
  ok(!st.hidden && st.lv === 'true', 'from her table on another device: ' + JSON.stringify(st));
  await Q.click('[data-rtgo="1"]'); await Q.waitForTimeout(400);
  ok(await Q.evaluate(() => stepIdx === 1), 'a tap in the list opens that clip');
  ok(await Q.evaluate(() => document.getElementById('rtbox').hidden), 'the next clip: the rating waits for Check');
  // engine 86: the can / can't page — the gap closed, the student's buttons, her two questions, the step, the database line only after it
  const html2 = fs.readFileSync(path.join(site, 'prep/rate-cancant-2026-11-14.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const C = await (async () => { const ctx = await b.newContext({viewport: {width: 1280, height: 900}});
    await ctx.addInitScript(c => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }catch(e){} }, tc);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith('rate-cancant-2026-11-14.html')) return r.fulfill({status: 200, contentType: 'text/html', body: html2});
      const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/prep/rate-cancant-2026-11-14.html'); await p.waitForTimeout(1500); return p; })();
  await C.evaluate(() => openTask('cc')); await C.waitForTimeout(600);
  st = await C.evaluate(() => ({n: current.steps.length, closed: document.querySelectorAll('.gap-ch').length, inputs: document.querySelectorAll('.gap-in').length, btn: [...document.querySelectorAll('[data-rtc]')].map(b => b.textContent), go: document.getElementById('go').textContent, list: document.querySelectorAll('.rt-li').length}));
  ok(st.n === 52 && st.closed === 1 && !st.inputs && st.btn.join('|') === "can|can't" && st.go === 'Show the answer' && st.list === 52, 'can / can\'t, before: ' + JSON.stringify(st));
  const ans0 = await C.evaluate(() => current.steps[0].clip.flatMap(l => l[3].filter(p => typeof p !== 'string'))[0].gap);
  await C.click('.ln[data-i="0"] .pl'); await C.waitForTimeout(300); await C.click(`[data-rtc="${ans0.toLowerCase()}"]`); await C.waitForTimeout(500);
  st = await C.evaluate(() => ({open: (document.querySelector('.ln .gap-res') || {}).className, qs: [...document.querySelectorAll('#rtbox h3')].map(h => h.textContent), db: !!document.querySelector('.rt-db'), steps: document.querySelectorAll('[data-rtl]').length, go: document.getElementById('go').textContent}));
  ok(/ok/.test(st.open || '') && st.qs[0] === 'Can you hear a /t/?' && st.qs[1] === 'Is there a vowel between /k/ and /n/?' && !st.db && st.steps === 3 && st.go === 'Next', 'can / can\'t, after the answer: ' + JSON.stringify(st));
  await C.click('[data-rtq="t heard"][data-rtv="no"]'); await C.click('[data-rtq="vowel"][data-rtv="none"]'); await C.click('[data-rtl="2"]'); await C.waitForTimeout(1500);
  st = await C.evaluate(() => ({db: (document.querySelector('.rt-db') || {}).textContent, cnt: document.querySelector('.rt-meta').textContent}));
  ok(/^TubeQuizard: /.test(st.db || '') && /Rated: 1 of 52/.test(st.cnt), 'the database line after the step: ' + JSON.stringify(st));
  if (shots) await C.screenshot({path: path.join(shots, 'cancant_after.png'), fullPage: true});
  const id1 = await C.evaluate(() => current.steps[0].rate.id), R2 = env.sheets['My ratings'].getRange(2, 1, env.sheets['My ratings'].getLastRow() - 1, 14).getValues().find(r => r[1] === id1), x2 = R2 && JSON.parse(R2[13]);
  ok(R2 && R2[0] === 'cancant-2026-11-14' && R2[7] === ans0.toLowerCase() && R2[8] === 2 && x2.qa['t heard'] === 'no' && x2.qa.vowel === 'none', 'her table: ' + JSON.stringify(R2 && R2.slice(0, 12)));
  await C.evaluate(() => { window._cp = null; copyText = t => { window._cp = t; }; }); await C.click('[data-rtcopy]');
  const cp2 = await C.evaluate(() => window._cp || ''), head2 = cp2.split('\n')[1];
  ok(head2 === ['id', 'answer', 'her answer', 'plays before the answer', 't heard', 'vowel', 'step', 'flags', 'note', 'db n', 'db right share', 'db tier', 'priority'].join('\t') && cp2.split('\n').length === 80, '📋 can / can\'t: ' + head2);
  // a student code: nothing of hers
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['s1', 'Mila', 'C1']]);
  const S = await page('s1'); await S.waitForTimeout(500);
  ok(!(await S.locator('#rtbox').count()), 'a student sees a rating box');
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK rate page on the homework engine'); process.exit(fail.length ? 1 : 0);
})();
