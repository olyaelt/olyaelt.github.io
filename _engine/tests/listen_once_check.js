// engine 76 (AL chat 12.11 19:10, her decision 18:28–19:08): a listening task with `listenOnce` works like the film task —
// a line with a gap plays once at normal speed (lines that still wait for their own first listen are cut out of it), then
// «What did you catch?» waits (no replay), That's it / Enter / «Nothing yet ↻»; one first version per line goes to Attempts at once
// (item s<step>.r<line>, Listens 1, Mode once); after that the line plays freely, its strip opens, and the gap's Check writes its own
// row (s<step>.g<k>, Mode once) as before. A page without listenOnce is unchanged (tests/listen_first_check.js).
//   node tests/listen_once_check.js SITE_DIR [page=b2/2026-11-11.html]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2;L.push(['pause',t])};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=r=>{L.push(['rate',r])};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-11-11.html', shots = process.argv[4], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); const GR = /^c1\//.test(rel) ? 'C1' : 'B2', CODE = GR.toLowerCase() + 'a'; env.sheets.Students.getRange(3, 1, 1, 3).setValues([[CODE, 'Bella', GR]]);
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1100, height: 900}});
  await ctx.addInitScript(c => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', c); localStorage.setItem('hw-rate', '0.75'); }catch(e){} }, CODE);
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://hw.test/' + rel); await p.waitForTimeout(900);
  const A = () => env.sheets.Attempts, rows = () => A() ? A().getRange(2, 1, Math.max(1, A().getLastRow() - 1), 27).getValues().filter(r => r[0]) : [];
  const head = () => A() ? A().getRange(1, 1, 1, 27).getValues()[0] : [];
  // a step: where are its gap lines
  const go = async (task, si) => { await p.evaluate(([t, s]) => { goHome(); openTask(t); stepIdx = s; checked = false; renderTask(); }, [task, si]); await p.waitForTimeout(500);
    return p.evaluate(() => current.steps[stepIdx].clip.map(l => l[3].filter(x => typeof x !== 'string').map(x => x.gap))); };
  const log = () => p.evaluate(() => (window._yl || []).splice(0));
  const rowSel = i => `.ln[data-i="${i}"]`;

  // 1. l1, step 5 (s4): two gap lines in a row (Bridget Jones 4.13–5.55, 5.58–7.58), the top one has a gap
  let G = await go('l1', 4);
  ok(G[0].length === 1 && G[1].length === 1, 'the step: ' + JSON.stringify(G));
  let st = await p.evaluate(() => ({ro: [...document.querySelectorAll('.gap-in')].map(x => x.readOnly), whole: document.querySelector('.whole-note') ? document.querySelector('.whole-note').hidden : null,
    ck: [...document.querySelectorAll('.gap-ck')].every(x => x.hidden), instr: document.querySelector('.instr').textContent}));
  ok(st.ro.every(Boolean) && st.whole === true && st.ck, 'before the first listen the gaps wait: ' + JSON.stringify(st));
  ok(/listen once/i.test(st.instr), 'the instruction: ' + st.instr);
  await log(); await p.click(rowSel(0)); await p.waitForTimeout(900);
  let L = await log(); const seek = L.find(x => x[0] === 'seek'), pause = L.find(x => x[0] === 'pause'), rate = L.find(x => x[0] === 'rate');
  ok(seek && Math.abs(seek[1] - 3.13) < .02, 'the top line plays only itself, a second before: ' + JSON.stringify(L));
  ok(pause && pause[1] >= 5.58 && pause[1] < 6.1, 'it stops where the next line (still waiting) starts, not a second after: ' + JSON.stringify(L));
  ok(rate && rate[1] === 1, 'the one listen is at normal speed (0.75 was set): ' + JSON.stringify(L));
  st = await p.evaluate(() => ({ask: !!document.querySelector('[data-ask="0"]'), ro0: document.querySelector('.ln[data-i="0"] .gap-in').readOnly, ro1: document.querySelector('.ln[data-i="1"] .gap-in').readOnly, foc: document.activeElement && document.activeElement.dataset.k}));
  ok(st.ask && !st.ro0 && st.ro1 && st.foc === '0', '«What did you catch?» under the line, its gap open and focused: ' + JSON.stringify(st));
  await p.click(rowSel(0)); await p.waitForTimeout(500); L = await log();
  ok(!L.some(x => x[0] === 'seek'), 'no second listen before the first version: ' + JSON.stringify(L));
  await p.fill('.gap-in[data-k="0"]', 'there is no'); await p.press('.gap-in[data-k="0"]', 'Enter'); await p.waitForTimeout(2600);
  let R = rows(), r0 = R.find(r => /:s4\.r0$/.test(r[6]));
  ok(r0 && r0[10] === 'there is no' && r0[11] === '✓' && r0[15] === 1 && r0[26] === 'once', 'the line\'s first version in Attempts (Listens 1, Mode once): ' + JSON.stringify(r0));
  ok(head()[26] === 'Mode', 'the Mode column: ' + JSON.stringify(head().slice(14)));
  st = await p.evaluate(() => ({ask: !!document.querySelector('[data-ask="0"]'), ck: !document.querySelector('.gap-ck[data-k="0"]').hidden, strip: !!document.querySelector('.ln[data-i="0"] + .lstrip')}));
  ok(!st.ask && st.ck && st.strip, 'then the line is free: its Check, its strip: ' + JSON.stringify(st));
  await p.click(rowSel(0)); await p.waitForTimeout(700); L = await log();
  ok(L.some(x => x[0] === 'seek') && L.some(x => x[0] === 'rate' && x[1] === .75), 'it plays again, at their speed: ' + JSON.stringify(L));
  // «Nothing yet ↻» on the second line: a blank first version, and it plays again at once
  await p.click(rowSel(1)); await p.waitForTimeout(1200); await log();
  await p.click('[data-l1none="1"]'); await p.waitForTimeout(2600); L = await log();
  R = rows(); const r1 = R.find(r => /:s4\.r1$/.test(r[6]));
  ok(r1 && r1[10] === '' && r1[12] === 'yes' && r1[26] === 'once', '«Nothing yet»: a blank first version: ' + JSON.stringify(r1));
  ok(L.some(x => x[0] === 'seek'), '«Nothing yet» plays the line again: ' + JSON.stringify(L));
  // now the top line plays the whole clip again
  st = await p.evaluate(() => document.querySelector('.whole-note').hidden); ok(st === false, 'whole clip back when every line has its first version');
  // the gap's own Check: a row of its own, mode once, the first version unchanged
  await p.fill('.gap-in[data-k="0"]', 'there\'s no'); await p.click('.gap-ck[data-k="0"]'); await p.waitForTimeout(2600);
  R = rows(); const g0 = R.find(r => /:s4\.g0$/.test(r[6]));
  ok(g0 && g0[10] === "there's no" && g0[26] === 'once' && g0[15] >= 2, 'the gap before Check (mode once, listens counted): ' + JSON.stringify(g0));
  ok(R.find(r => /:s4\.r0$/.test(r[6]))[10] === 'there is no', 'the line\'s first version did not change');

  // 2. l3, step 4 (s3): one line with two gaps — Enter goes to the next gap, then gives the line's first version
  G = await go('l3', 3);
  ok(G[0].length === 2, 'two gaps in the line: ' + JSON.stringify(G));
  await p.click(rowSel(0)); await p.waitForTimeout(1500); await log();
  const k0 = await p.evaluate(() => document.querySelector('.ln[data-i="0"] .gap-in').dataset.k), k1 = String(+k0 + 1);
  await p.fill(`.gap-in[data-k="${k0}"]`, "can't"); await p.press(`.gap-in[data-k="${k0}"]`, 'Enter'); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({foc: document.activeElement && document.activeElement.dataset.k, ask: !!document.querySelector('[data-ask="0"]')}));
  ok(st.foc === k1 && st.ask, 'Enter in the first gap goes to the second: ' + JSON.stringify(st));
  if (shots) { await p.screenshot({path: path.join(shots, 'listen_once_ask.png')}); }
  await p.fill(`.gap-in[data-k="${k1}"]`, 'can be'); await p.click('[data-l1ok="0"]'); await p.waitForTimeout(2600);
  R = rows(); const r3 = R.find(r => /^l3:s3\.r0$/.test(r[6]));
  ok(r3 && r3[10] === "can't … can be" && r3[11] === '✗' && r3[9] === "can't … can't" && r3[14] === '1/2', 'one first version for the line, both gaps: ' + JSON.stringify(r3));
  // a reload keeps the line free (no second «one listen»)
  await p.reload(); await p.waitForTimeout(900); await go('l3', 3);
  st = await p.evaluate(() => ({ro: [...document.querySelectorAll('.ln[data-i="0"] .gap-in')].map(x => x.readOnly), ask: !!document.querySelector('[data-ask]')}));
  ok(st.ro.every(x => !x) && !st.ask, 'after a reload the line stays free: ' + JSON.stringify(st));
  // Check answers with a line heard but not answered: its first version goes first
  G = await go('l3', 0); await p.click(rowSel(1)); await p.waitForTimeout(1500);
  const kk = await p.evaluate(() => document.querySelector('.ln[data-i="1"] .gap-in').dataset.k);
  await p.fill(`.gap-in[data-k="${kk}"]`, 'can'); await p.click('#go'); await p.waitForTimeout(2600);
  R = rows(); ok(R.find(r => /^l3:s0\.r1$/.test(r[6])) && R.find(r => /^l3:s0\.g/.test(r[6])), 'Check answers straight after typing: the line\'s version and the gap\'s: ' + JSON.stringify(R.filter(r => /^l3:s0/.test(r[6])).map(r => [r[6], r[10]])));

  // 3. 📋 For the analysis: kind and mode columns (mode from the table, or from the rows)
  const an = await p.evaluate(() => ftForAnalysis({items: [
    {task: 'l1', item: 'l1:s4.r0', type: 'listen', prompt: 'x', answer: 'y', who: [['Bella', 'there is no', 'ok', 1, '3/3', 'x', '12.11 20:01:00', '']]},
    {task: 'l1', item: 'l1:s4.g0', type: 'listen', prompt: 'x', answer: 'y', who: [['Bella', "there's no", 'ok', 3, '3/3', 'x', '12.11 20:02:00', ''], ['Anna', 'there no', 'no', 2, '2/3', 'y', '12.11 19:00:00', '']]}]}));
  ok(/\tline, one listen\tonce\t/.test(an) && /S2\t[^\n]*\tgap, before Check\tonce\t/.test(an) && /S1\t[^\n]*\tgap, before Check\tfree\t/.test(an), 'kind / mode in 📋: ' + an);

  // 4. her view: no «once» (she plays lines in class)
  const tv = await p.evaluate(() => { localStorage.setItem('hw-role', 'teacher'); goHome(); openTask('l2'); stepIdx = 0; checked = false; renderTask();
    const r = {teacher: isTeacher(), ro: [...document.querySelectorAll('.gap-in')].some(x => x.readOnly), instr: document.querySelector('.instr').textContent}; localStorage.setItem('hw-role', ''); return r; });
  ok(tv.teacher && !tv.ro && !/listen once/i.test(tv.instr), 'her view is free: ' + JSON.stringify(tv));
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen once: one listen, what you caught, then free; journal rows with mode'); process.exit(fail.length ? 1 : 0);
})();
