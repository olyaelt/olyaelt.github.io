// engine 69 (AL chat's request 11.11 21:40, additions 22:10 / 22:55; her 12.11 09:37): YouTube lines in the listening task — the request's
// checks 9–18 on the trial page c1/film-trial.html. YouTube is a stub (time runs 4× faster); Code.gs runs in Node (mock.js).
//   node tests/film_yt_check.js SITE_DIR [shots/]
const {chromium, devices} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const YT_STUB = `(() => {
  const log = window.__yt = [];
  class Player {
    constructor(id, o){ const el = document.getElementById(id), f = document.createElement('iframe'); f.id = id; f.__stub = Math.random(); el.replaceWith(f);
      this.f = f; this.vid = o.videoId; this.t = (o.playerVars || {}).start || 0; this.on = false; this.rate = 1; this.last = performance.now(); this.ev = o.events || {};
      log.push(['new', o.videoId, this.t]); setTimeout(() => this.ev.onReady && this.ev.onReady({target: this}), 60); }
    tick(){ const now = performance.now(); if(this.on) this.t += (now - this.last) / 1000 * this.rate * 4; this.last = now; }
    getCurrentTime(){ this.tick(); return this.t; }
    getPlayerState(){ return this.on ? 1 : 2; }
    seekTo(s){ this.tick(); this.t = s; log.push(['seek', this.vid, s]); }
    playVideo(){ this.tick(); this.on = true; log.push(['play', this.vid, this.t]); }
    pauseVideo(){ this.tick(); this.on = false; }
    loadVideoById(o){ this.vid = o.videoId; this.t = o.startSeconds || 0; this.on = true; this.last = performance.now(); log.push(['load', o.videoId, this.t]); }
    cueVideoById(o){ this.vid = o.videoId; this.t = o.startSeconds || 0; this.on = false; log.push(['cue', o.videoId, this.t]); }
    setPlaybackRate(r){ this.tick(); this.rate = r; log.push(['rate', r]); }
    getVideoData(){ return {video_id: this.vid}; } getOptions(){ return []; } setOption(){} unloadModule(){}
    destroy(){ log.push(['destroy']); }
  }
  window.YT = {Player}; if(typeof window.onYouTubeIframeAPIReady === 'function') window.onYouTubeIframeAPIReady();
})();`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const shot = async (p, n) => { if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, n + '.png')}); } };
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students, tc = S.get(2, 1);
  S.getRange(3, 1, 2, 3).setValues([['c1a', 'Clara', 'C1'], ['c1b', 'Boris', 'C1']]);
  const html = fs.readFileSync(path.join(site, 'c1/film-trial.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch(), posts = [];
  const open = async (code, role, opts = {}) => {
    const ctx = await b.newContext(opts.dev || {viewport: {width: 1280, height: 720}});
    await ctx.route(URL_ + '**', r => { const d = JSON.parse(r.request().postData()); posts.push([code, d]); r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: YT_STUB}));
    await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(code + ': ' + e.message));
    await p.goto('https://hw.test/c1/film-trial.html');
    await p.evaluate(([c, r]) => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', r); }, [code, role]); await p.reload(); await p.waitForTimeout(900);
    return {ctx, p}; };
  // the list: the YouTube part first and for everyone, the film part optional and out of the total time
  const A = await open('c1a', ''); const p = A.p;
  const list = await p.textContent('#app');
  ok(/YouTube: what did they say\?/.test(list) && /The Intern: what did they say\?[\s\S]*optional/i.test(list) && /Optional[\s\S]*tasks aren't in it/.test(list), 'the list: ' + list.slice(0, 400));
  ok(posts.some(([c, d]) => c === 'c1a' && d.action === 'sync' && d.ab === 1 && d.tasks.some(t => t.title === 'The Intern: what did they say? (optional)')), 'the sync: no ab flag or no (optional) in the table');
  const half = await p.evaluate(() => localStorage.getItem('hw-half-c1a'));
  ok(half === 'x' || half === 'y', 'no half from the table: ' + half);
  // 13. the order: y1, then tier 2, then tier 3
  await p.click('[data-open="yt"]'); await p.waitForTimeout(400);
  const order = await p.evaluate(() => current.steps.map(s => s.type === 'film' ? current.film.lines[s.li].id : s.type));
  ok(order[0] === 'y1' && ['y2', 'y4'].includes(order[1]) && ['y2', 'y4'].includes(order[2]) && ['y3', 'y5'].includes(order[3]) && ['y3', 'y5'].includes(order[4]) && order[5] === 'filmsum', 'the order: ' + order);
  // the consent, then one player
  ok(await p.isVisible('#yt-ok'), 'no YouTube consent'); await shot(p, 'yt0-consent');
  await p.click('#yt-ok'); await p.waitForTimeout(400);
  const ifr = await p.evaluate(() => { const f = document.querySelector('.yt-box iframe'); window.__f = f && f.__stub; return !!f; }); ok(ifr, 'no player');
  // 9 (1). once; a second click does not play
  await p.click('.film-ln .pl'); await p.waitForTimeout(200);
  let y = await p.evaluate(() => ({playing: !!(FILM.playing && FILM.playing.yt), log: window.__yt.slice(-3)}));
  ok(y.playing && y.log.some(x => (x[0] === 'seek' || x[0] === 'load') && Math.abs(x[2] - 96.82) < .01), 'the first click: ' + JSON.stringify(y));
  await p.waitForFunction(() => !FILM.playing, null, {timeout: 5000}).catch(() => fail.push('the line did not stop'));
  await p.waitForTimeout(150); await p.click('.film-ln .pl'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !FILM.playing) && await p.isVisible('#f-none'), 'a second click played before the first version');
  await shot(p, 'yt1-caught');
  // 3. a first version: hearts; 10. the strip: a drag plays its piece
  await p.fill('.film-in', 'worked'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelectorAll('.fheart').length > 0), 'no hearts');
  ok(await p.isVisible('canvas[data-fw]') && /strip/.test(await p.textContent('.fw-hint')), 'no strip after the first version');
  const cv = await p.$('canvas[data-fw]'), bb = await cv.boundingBox();
  await p.mouse.move(bb.x + bb.width * .3, bb.y + 30); await p.mouse.down(); await p.mouse.move(bb.x + bb.width * .55, bb.y + 30, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(150);
  y = await p.evaluate(() => ({sel: FILM.sel.y1, piece: !!(FILM.playing && FILM.playing.piece), last: window.__yt.filter(x => x[0] === 'seek').slice(-1)[0]}));
  ok(y.sel && y.piece && y.last && Math.abs(y.last[2] - y.sel.s) < .01, 'the strip: ' + JSON.stringify(y));
  await p.click('#spd [data-rate="0.5"]'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => window.__yt.some(x => x[0] === 'rate' && x[1] === .5)), '🐢 did not slow the player');
  await shot(p, 'yt2-strip');
  await p.waitForFunction(() => !FILM.playing, null, {timeout: 6000}).catch(() => fail.push('the piece did not stop'));
  await p.click('#spd [data-rate="1"]');
  // 4. Check
  await p.fill('.film-in', "I've worked"); await p.click('#f-check'); await p.waitForTimeout(200);
  ok(/First listen: 1 of 2 words → now: 2 of 2/.test(await p.textContent('.film-score')), 'score: ' + await p.textContent('.film-score'));
  // the same player on the next screen
  await p.click('#go'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { const f = document.querySelector('.yt-box iframe'); return !!f && f.__stub === window.__f; }), 'the player was made again for the next line');
  ok(!(await p.evaluate(() => window.__yt.some(x => x[0] === 'destroy'))), 'the player was destroyed');
  // the rest: Nothing yet, show me, skip; the summary
  await p.click('.film-ln .pl'); await p.waitForFunction(() => !FILM.playing, null, {timeout: 5000}); await p.waitForTimeout(100);
  await p.click('#f-none'); await p.waitForTimeout(150); ok(await p.evaluate(() => !!FILM.playing), 'Nothing yet did not play again');
  await p.click('#f-show'); await p.waitForTimeout(150);
  for (let k = 0; k < 4; k++) { await p.click('#go'); await p.waitForTimeout(200); }
  ok(/After one listen you caught \d+% of the words/.test(await p.textContent('.film-big')), 'no summary');
  await shot(p, 'yt3-sum');
  await p.waitForTimeout(2200);
  const rec = posts.filter(([c, d]) => c === 'c1a' && d.action === 'submit').map(x => x[1]);
  ok(rec.length === 1 && /🎧 YouTube · order: y1 /.test(rec[0].text), 'the record: ' + JSON.stringify(rec));
  const Att = env.sheets.Attempts, rows = Att ? Att.getRange(2, 1, Math.max(1, Att.getLastRow() - 1), 26).getValues().filter(r => r[0]) : [];
  const r1 = rows.find(r => r[6] === 'yt:y1') || [];
  ok(r1[10] === 'worked' && r1[14] === '1/2' && r1[15] === 1 && r1[16] >= 2 && r1[17] >= 1 && r1[21] === "I've worked" && r1[22] === '2/2', 'the journal: ' + JSON.stringify(r1));
  await A.ctx.close();
  // 17. halves: the second student of the group gets the other half; 14. the variant follows the half and the set
  const B = await open('c1b', ''); const hb = await B.p.evaluate(() => localStorage.getItem('hw-half-c1b'));
  ok(hb && hb !== half, 'the halves: ' + half + ' / ' + hb);
  const H = env.sheets['A/B halves']; ok(H && H.getLastRow() === 3, 'the halves sheet: ' + (H && H.getLastRow()));
  const vB = await B.p.evaluate(() => filmLineV(TASKS.find(t => t.id === 'film').film.lines.find(l => l.id === 'h1'), {})._v);
  ok(vB === (hb === 'x' ? 'b' : 'a'), '14: half ' + hb + ' sees ' + vB);
  // 15. the same code on another device: the same half
  const B2 = await open('c1b', ''); ok(await B2.p.evaluate(() => localStorage.getItem('hw-half-c1b')) === hb, '15: another device, another half'); await B2.ctx.close();
  // the film line's first try carries its variant and the comparison (no film file needed for the record of a first try)
  await B.p.evaluate(() => { const t = TASKS.find(x => x.id === 'film'), base = t.film.lines.find(l => l.id === 'h1'), l = filmLineV(base, {});
    firstTry(t, 'h1', {type: 'film', prompt: 'p', answer: filmParts(l).gap, first: 'lived', ok: false, words: '1/2', lis: 1, v: l._v, ab: t.film.ab.name}); });
  await B.p.waitForTimeout(2200);
  const rows2 = env.sheets.Attempts.getRange(2, 1, env.sheets.Attempts.getLastRow() - 1, 26).getValues(), h1 = rows2.find(r => r[6] === 'film:h1' && r[1] === 'c1b') || [];
  ok(h1[24] === vB && h1[25] === 'gap-length', '16: the journal row: ' + JSON.stringify(h1));
  await B.ctx.close();
  // 18. her view: A / B on the line
  const T = await open(tc, 'teacher'); await T.p.click('[data-open="film"]'); await T.p.waitForTimeout(400);
  ok(await T.p.isVisible('[data-abv="b"]'), '18: no A / B in her view');
  await T.p.click('[data-abv="b"]'); await T.p.waitForTimeout(200); const tb = await T.p.textContent('.film-ln');
  await T.p.click('[data-abv="a"]'); await T.p.waitForTimeout(200); const ta = await T.p.textContent('.film-ln');
  ok(/here all my life/.test(tb) && !/here all my life/.test(ta), '18: A / B: ' + ta + ' | ' + tb);
  await shot(T.p, 'yt4-her-ab');
  await T.ctx.close();
  // a phone: the YouTube part works there (no «on the computer»), the film part keeps its line
  const Ph = await open('c1a', '', {dev: devices['iPhone 13']}); const q = Ph.p;
  const ql = await q.textContent('#app'); ok(/The Intern[\s\S]*on the computer/.test(ql) && !/YouTube: what did they say\?\s*💻/.test(ql), 'phone list: ' + ql.slice(0, 300));
  await q.evaluate(() => localStorage.removeItem('hw-film-' + PAGE_KEY + '-yt')); await q.click('[data-open="yt"]'); await q.waitForTimeout(500);
  ok(await q.isVisible('.yt-box') && !/Open this task on the computer/.test(await q.textContent('#app')), 'phone: the YouTube part does not open');
  await shot(q, 'yt5-phone');
  await Ph.ctx.close();
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK film from YouTube'); process.exit(fail.length ? 1 : 0);
})();
