// engine 78 (AL chat 12.11 23:15, her 23:21 «давай перейдём на свободное прослушивание сейчас»): the 11.11 homework listens freely again.
// A YouTube line plays as often as they like; at the gap's first Check its row in Attempts has the plays before it (kept over a reload),
// the plays of the clip's lines without a gap (Context plays) and Mode free. A 🎬 film task with `free`: no «listen once» step — the line
// plays at once and again, Check gives the first try with its plays and Mode free.
//   node tests/listen_free_check.js SITE_DIR [FILM_FILE]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os'), {execSync} = require('child_process');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  // 1. YouTube lines, B2 11.11
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(3, 1, 1, 3).setValues([['b2a', 'Bella', 'B2']]);
  const rel = 'b2/2026-11-11.html', html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1100, height: 900}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); localStorage.setItem('hw-code', 'b2a'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://hw.test/' + rel); await p.waitForTimeout(900);
  const A = () => env.sheets.Attempts, rows = () => A() ? A().getRange(2, 1, Math.max(1, A().getLastRow() - 1), 28).getValues().filter(r => r[0]) : [];
  const go = async (task, si) => { await p.evaluate(([t, s]) => { goHome(); openTask(t); stepIdx = s; checked = false; renderTask(); }, [task, si]); await p.waitForTimeout(500); };
  // l3 step 1 (s0): «Wow. But tickets go on sale next week.» / «So, you [can] start planning…» / «to go see Sting.» — the gap is line 1, lines 0 and 2 have none
  await go('l3', 0);
  const st = await p.evaluate(() => ({once: !!current.listenOnce, ask: !!document.querySelector('[data-ask]'), instr: document.querySelector('.instr').textContent}));
  ok(!st.once && !/listen once/i.test(st.instr), 'no «listen once» on these pages any more: ' + JSON.stringify(st));
  const k = await p.evaluate(() => document.querySelector('.ln[data-i="1"] .gap-in').dataset.k);
  const cl = await p.evaluate(() => current.steps[stepIdx].clip.map(l => [l[1], l[2]]));
  ok(/The first listen plays the whole clip/.test(st.instr), 'the instruction: ' + st.instr);
  // engine 81 (her 13.11 09:40–09:49): the first tap — here on the EMPTY gap (engine 80) — plays the WHOLE clip from its first line;
  // the line that sounds lights up; a tap while it plays doesn't cut it; the cursor stays in the gap
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click(`.gap-in[data-k="${k}"]`); await p.waitForTimeout(120);
  const L0 = await p.evaluate(() => (window._yl || []).splice(0));
  ok(L0.some(x => x[0] === 'seek' && Math.abs(x[1] - Math.max(0, cl[0][0] - 1)) < .01) && !L0.some(x => x[0] === 'seek' && Math.abs(x[1] - (cl[1][0] - 1)) < .01),
    'the first tap does not play the whole clip from its first line: ' + JSON.stringify(L0) + ' ' + JSON.stringify(cl));
  ok(await p.evaluate(k => document.activeElement && document.activeElement.dataset.k === k, k), 'the tap does not leave the cursor in the gap');
  ok(!(await p.evaluate(() => !!document.querySelector('[data-ask]'))), 'no «What did you catch?»');
  ok(await p.waitForFunction(() => document.querySelector('.ln[data-i="2"]').classList.contains('playing'), null, {timeout: 6000}).then(() => true, () => false), 'the line that sounds does not light up');
  await p.waitForFunction(() => !document.querySelector('.ln.playing'), null, {timeout: 8000}).catch(() => fail.push('the whole clip never ended'));
  ok(await p.evaluate(() => !!document.querySelector('.lstrip')), 'no strip under the line after the first listen');
  // then a tap on the empty gap plays its own line only
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click(`.gap-in[data-k="${k}"]`); await p.waitForTimeout(1500);
  const L1 = await p.evaluate(() => (window._yl || []).splice(0));
  ok(L1.some(x => x[0] === 'seek' && Math.abs(x[1] - (cl[1][0] - 1)) < .01), 'after the whole clip, a tap on the gap does not play its line: ' + JSON.stringify(L1));
  await p.click('.ln[data-i="1"] .pl'); await p.waitForTimeout(1500);
  await p.click('.ln[data-i="2"] .pl'); await p.waitForTimeout(1200);   // a line without a gap: context
  await p.reload(); await p.waitForTimeout(900); await go('l3', 0);      // the plays (and the whole clip heard) stay over a reload
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click('.ln[data-i="1"] .pl'); await p.waitForTimeout(1500);
  ok((await p.evaluate(() => (window._yl || []).splice(0))).some(x => x[0] === 'seek' && Math.abs(x[1] - (cl[1][0] - 1)) < .01), 'after a reload the whole clip played again instead of the line');
  await p.fill(`.gap-in[data-k="${k}"]`, 'can');
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click(`.gap-in[data-k="${k}"]`); await p.waitForTimeout(600);
  ok(!(await p.evaluate(() => (window._yl || []).splice(0))).some(x => x[0] === 'seek'), 'a tap on a gap with text in it plays the line (fixing a typo would start the sound)');
  await p.click(`.gap-ck[data-k="${k}"]`); await p.waitForTimeout(2600);
  const g = rows().find(r => /^l3:s0\.g/.test(r[6]));
  ok(g && g[10] === 'can' && g[11] === '✓' && g[15] === 4 && g[26] === 'context' && g[27] === 1, 'Attempts: first try, plays 4 (the whole clip + 3 of the line, over a reload), Mode context, Context plays 1: ' + JSON.stringify(g && g.slice(6)));
  ok((await A().getRange(1, 1, 1, 28).getValues()[0])[27] === 'Context plays', 'the Context plays column');
  const an = await p.evaluate(() => ftForAnalysis({items: [{task: 'l3', item: 'l3:s0.g0', type: 'listen', prompt: 'x', answer: 'can', who: [['Bella', 'can', 'ok', 3, '1/1', 'x', '12.11 23:40:00', 'free', 1]]}]}));
  // engine 79 (AL 23:55, point 9): Easy / OK / Hard and the «?» lines, a student without first tries gets the next S
  const an2 = await p.evaluate(() => { teacherData = {students: [{name: 'Bella'}, {name: 'Zed'}], reactions: {l3: {easy: [], ok: [0], hard: [1]}},
    work: [{type: 'marked', s: 1, task: 'l3', text: "So, you ___ start planning\n— can or can't?\nx"}, {type: 'question', s: 0, task: 'l3', text: 'q'}]};
    const r = ftForAnalysis({items: [{task: 'l3', item: 'l3:s0.g0', type: 'listen', prompt: 'x', answer: 'can', who: [['Bella', 'can', 'ok', 3, '1/1', 'x', '12.11 23:40:00', 'free', 1]]}]}); teacherData = null; return r; });
  ok(/Easy \/ OK \/ Hard[^]*\nS1\t[^\n]*\tOK\nS2\t[^\n]*\tHard/.test(an2) && /Hard to hear[^]*\nS2\t[^\n]*\tSo, you ___ start planning\tcan or can't\?/.test(an2), '📋: ratings and «?» lines: ' + an2.split('How they')[1]);
  ok(/\tplays\tctx plays\t/.test(an) && /\tgap, before Check\tfree\t[^\n]*\tright\t3\t1\t1\/1\t/.test(an), '📋 For the analysis has plays and ctx plays: ' + an);
  await b.close();

  // 2. a 🎬 film task with `free` (the trial page's task, switched to free here)
  let film = process.argv[3];
  if (!film) { film = path.join(os.tmpdir(), 'film-free-' + process.pid + '.mp4');
    execSync(`ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=420:c=pink:a=0.3" -f lavfi -i "testsrc2=size=160x90:rate=10:d=420" -map 1:v -map 0:a -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 32k -shortest "${film}"`); }
  const b2 = await chromium.launch(), c2 = await b2.newContext({viewport: {width: 1280, height: 720}}), att = [];
  await c2.route('https://hw.test/**', r => { const f = path.join(site, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
  await c2.route('https://script.google.com/**', async r => { let body = {}; try { body = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    if (body.action === 'attempts') att.push(...body.items); r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body.action === 'sync' ? {ok: true, name: 'Test', marks: {}, work: []} : {ok: true, id: 1001})}); });
  await c2.addInitScript(() => { window.showOpenFilePicker = undefined; localStorage.setItem('hw-code', 'test42'); });
  const q = await c2.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto('https://hw.test/c1/film-trial.html'); await q.waitForTimeout(600);
  await q.evaluate(() => { TASKS.find(t => t.id === 'film').film.free = true; }); await q.click('[data-open="film"]'); await q.waitForTimeout(400);
  const [fc] = await Promise.all([q.waitForEvent('filechooser'), q.click('[data-filmopen]')]); await fc.setFiles(film);
  await q.waitForFunction(() => FILM.dur > 0, null, {timeout: 15000}).catch(() => fail.push('the film did not load'));
  const fs1 = await q.evaluate(() => ({check: !!document.getElementById('f-check'), none: !!document.getElementById('f-none'), instr: document.querySelector('.instr').textContent}));
  ok(fs1.check && !fs1.none && /as many times as you like/.test(fs1.instr) && !/no replay/.test(fs1.instr), 'film free: Check at once, no «Nothing yet»: ' + JSON.stringify(fs1));
  // engine 81 (her 13.11 09:49–09:50): a line with `ctxFrom` plays from there the first time (the context), a tap doesn't cut it, then only the line
  const fc0 = await q.evaluate(() => { const l = current.film.lines[current.steps[stepIdx].li], c = filmClip(l); l.ctxFrom = c.s - 2; renderTask(); return c; }); await q.waitForTimeout(400);
  await q.click('.film-in'); await q.waitForTimeout(300);
  let fp = await q.evaluate(() => ({on: !!FILM.playing, ctx: !!(FILM.playing && FILM.playing.ctx), lit: !!document.querySelector('.film-ln.playing')}));
  ok(fp.on && fp.ctx && fp.lit, 'film: a tap on the empty field does not play the context first: ' + JSON.stringify(fp));
  // engine 83 (her 16:59): a tap while the context plays plays the line
  await q.click('.film-ln .pl'); await q.waitForTimeout(300);
  fp = await q.evaluate(() => ({on: !!FILM.playing, ctx: !!(FILM.playing && FILM.playing.ctx), t: FILM.v.currentTime}));
  ok(fp.on && !fp.ctx && fp.t >= fc0.s - .35 && fp.t < fc0.s + .6, 'film: after the context the line plays alone, from its own start ' + fc0.s + ': ' + JSON.stringify(fp));
  await q.waitForFunction(() => !FILM.playing, null, {timeout: 8000}).catch(() => {});
  await q.fill('.film-in', 'lived'); await q.click('#f-check'); await q.waitForTimeout(3000);
  const fa = att.find(x => x.type === 'film');
  ok(fa && fa.first === 'lived' && fa.lis === 2 && fa.mode === 'context', 'film free: the first try at Check, plays 2 (context + the line), Mode context: ' + JSON.stringify(fa));
  await b2.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen free: the whole clip first, then the line; plays before the first Check (kept over a reload), context plays, Mode context; film: the context first, then the line'); process.exit(fail.length ? 1 : 0);
})();
