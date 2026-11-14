// engine 88 (AL chat 14.11 14:00 §3; her 13:58, 14:01): the step quiz. Her view: «pretend you caught / missed everything» walks both ways;
// the order keeps her rules (no phrase twice in a row, no three of level 4–5 in a row, the last two ≤ 3, a harder clip 2–3 clips after the
// caught one, none after a miss); the table moves a clip's level from the group's first tries (≤ 1 step under 6 answers).
//   node tests/step_quiz_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], rel = 'prep/step-demo-2026-11-13.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students, tc = S.get(2, 1);
  S.getRange(3, 1, 4, 3).setValues([['b2a', 'Anna', 'B2'], ['b2b', 'Boris', 'B2'], ['c1a', 'Clara', 'C1'], ['c1b', 'Dan', 'C1']]);
  const b = await chromium.launch();
  const page = async (code, teacher, w) => {
    const ctx = await b.newContext({viewport: {width: w || 1280, height: 900}, deviceScaleFactor: shots && w ? 2 : 1});
    await ctx.addInitScript(([c, t]) => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', t ? 'teacher' : ''); }catch(e){} }, [code, teacher]);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith(rel)) return r.fulfill({status: 200, contentType: 'text/html', body: html});
      const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/' + rel); await p.waitForTimeout(1500); return p; };
  // walk a quiz in her view, pretending; returns the order with kinds and levels
  const walk = async (T, task, sim) => {
    await T.evaluate(t => openTask(t, 0, 'fresh'), task); await T.waitForTimeout(400);
    if (sim !== 'real') { await T.click(`[data-stepsim="${sim}"]`); }
    for (let k = 0; k < 40; k++) {
      const on = await T.evaluate(() => !!current && stepIdx < current.steps.length); if (!on) break;
      await T.evaluate(() => { const g = document.getElementById('go'); g.click(); }); await T.waitForTimeout(120);
      await T.evaluate(() => { const g = document.getElementById('go'); if (g) g.click(); }); await T.waitForTimeout(160);
    }
    return T.evaluate(t => { const x = TASKS.find(y => y.id === t), S = stepState(x), by = stepAll(x);
      return S.order.map(id => ({key: by[id].key, p: by[id]._p, kind: S.kind[id], wl: S.wl[id], res: S.res[id]})); }, task); };
  const rules = (o, name) => {
    ok(o.every((x, i) => !i || x.p !== o[i - 1].p), name + ': a phrase twice in a row ' + JSON.stringify(o.map(x => x.key)));
    ok(o.every((x, i) => i < 2 || !(x.wl >= 4 && o[i - 1].wl >= 4 && o[i - 2].wl >= 4)), name + ': three hard in a row');
    ok(o.slice(-2).every(x => x.wl <= 3), name + ': the last two ≤ 3 ' + JSON.stringify(o.slice(-2)));
    const perP = {}; o.forEach(x => { if (['start', 'harder', 'clearer'].includes(x.kind)) perP[x.p] = (perP[x.p] || 0) + 1; });
    ok(Object.values(perP).every(n => n <= 2), name + ': more than two a phrase'); };
  const T = await page(tc, true);
  for (let run = 0; run < 4; run++) {
    const c = await walk(T, 'b2', 'caught'); rules(c, 'B2 caught');
    const i13 = c.findIndex(x => x.key === 'a13'), i10 = c.findIndex(x => x.key === 'a10');
    ok(c[i13].kind === 'start' && (i10 > -1 ? c[i10].kind === 'harder' && i10 - i13 >= 2 : i13 >= c.length - 3), 'B2 caught: a10 after a13 by 2–3 ' + JSON.stringify(c.map(x => x.key)));
    const m = await walk(T, 'b2', 'missed'); rules(m, 'B2 missed');
    ok(m.every(x => x.kind === 'start') && !m.some(x => x.key === 'a10') && m.length === 10, 'B2 missed: only the starts, no a10 ' + JSON.stringify(m.map(x => x.key + ':' + x.kind)));
    const c1 = await walk(T, 'c1', 'caught'); rules(c1, 'C1 caught');
    const c1m = await walk(T, 'c1', 'missed'); rules(c1m, 'C1 missed');
    ok(c1.find(x => x.key === 'a10').kind === 'start' && c1m.some(x => x.key === 'a13' && x.kind === 'clearer'), 'C1 starts at 3 (a10), a miss brings a13 ' + JSON.stringify(c1m.map(x => x.key + ':' + x.kind)));
  }
  if (shots) { const P = await page(tc, true, 400); await P.evaluate(() => openTask('b2', 0, 'fresh')); await P.waitForTimeout(500);
    await P.evaluate(() => document.querySelector('.step-t details').open = true); await P.screenshot({path: path.join(shots, 'step_her.png'), fullPage: true}); await P.context().close(); }
  // the table: the group's first tries move a clip's level (a10, hers 3: missed by everyone → 4 under 6 answers, never 5)
  const P = o => env.post(JSON.stringify(o)), id10 = await T.evaluate(() => Object.values(stepAll(TASKS[0])).find(c => c.key === 'a10').id);
  const pg = c => c[0] === 'b' ? 'hw-ge-b2-test' : 'hw-ge-c1-test', PG = ['hw-ge-b2-test', 'hw-ge-c1-test'];
  for (const code of ['b2a', 'b2b', 'c1a', 'c1b']) { const r = P({action: 'attempts', code, page: pg(code), items: [{item: `b2:s@${id10}.g0`, task: 'b2', type: 'listen', prompt: 'p', answer: 'time on her hands', first: 'x', ok: false, step: 'harder · level 3 (hers 3)'}]}); ok(r.ok, 'attempt ' + JSON.stringify(r)); }
  P({action: 'attempts', code: 'c1a', page: 'hw-ge-c1-test', items: [{item: `c1:s@${id10}.rep`, task: 'c1', type: 'player', prompt: 'p', answer: 'v', first: "student: the sound doesn't match", ok: false}]});
  const st = P({action: 'stepStats', code: 'b2a', page: 'hw-ge-b2-test', pages: PG, levels: {[id10]: 3}});
  ok(st.ok && st.clips[id10].n === 4 && st.clips[id10].b > 0.5 && st.clips[id10].nosync === 1 && typeof st.theta === 'number', 'stepStats: ' + JSON.stringify(st));
  const A = env.sheets.Attempts, head = A.getRange(1, 1, 1, A.getLastColumn()).getValues()[0], col = head.indexOf('Step quiz');
  ok(col > -1 && A.get(2, col + 1) === 'harder · level 3 (hers 3)', 'the journal keeps the step: ' + JSON.stringify(head.slice(-3)));
  // the page takes it: a10 (hers 3, 4 misses) is level 4 now — not 5 under 6 answers
  const wl = await T.evaluate(async ([id, PG]) => { const t = TASKS[0]; t.step.pages = PG; delete STEP_STATS[t.step.set]; await stepLoadStats(); return [stepWL(t, stepAll(t)[id]), JSON.stringify(STEP_STATS[t.step.set] || null).slice(0, 300)]; }, [id10, PG]);
  ok(wl[0] === 4, 'a10 at level 4 now (hers 3, 4 misses): ' + wl);
  // a student's first screen: the intro, «Clip 1», the quiet line, no «of N»
  const Q = await page('', false, 400); await Q.evaluate(() => openTask('b2')); await Q.waitForTimeout(900);
  const s1 = await Q.evaluate(() => ({c: (document.querySelector('.taskbar .count') || {}).textContent, i: (document.querySelector('.instr') || {}).textContent, q: !!document.getElementById('repq')}));
  ok(/^Clip 1$/.test(s1.c) && /This quiz adapts to you/.test(s1.i) && s1.q, 'the student\'s first screen: ' + JSON.stringify(s1));
  if (shots) await Q.screenshot({path: path.join(shots, 'step_student.png')});
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK step quiz: both ways keep her rules, the group moves the levels'); process.exit(fail.length ? 1 : 0);
})();
