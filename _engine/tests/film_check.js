// engine 65 (the AL chat's request 11.11 21:40): 🎬 listening from the film — the request's own checks on the trial page.
//   node tests/film_check.js SITE_DIR [FILM_FILE]   (no film → a 7-minute one is made with ffmpeg)
const {chromium, devices} = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os'), {execSync} = require('child_process');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  let film = process.argv[3];
  if (!film) { film = path.join(os.tmpdir(), 'film-' + process.pid + '.mp4');
    execSync(`ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=420:c=pink:a=0.3" -f lavfi -i "testsrc2=size=160x90:rate=10:d=420" -map 1:v -map 0:a -c:v libx264 -preset ultrafast -pix_fmt yuv420p -c:a aac -b:a 32k -shortest "${film}"`); }
  const b = await chromium.launch(), route = async ctx => ctx.route('https://hw.test/**', r => { const f = path.join(site, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
  const sent = [];
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); await route(ctx);
  await ctx.route('https://script.google.com/**', async r => { let body = {}; try { body = JSON.parse(r.request().postData() || '{}'); } catch (e) {}
    if (body.action === 'submit') sent.push(body); r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body.action === 'sync' ? {ok: true, name: 'Test', marks: {}, work: []} : {ok: true, id: 1001})}); });
  await ctx.addInitScript(() => { window.showOpenFilePicker = undefined; if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('hw-code', 'test42'); } });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://hw.test/c1/film-trial.html'); await p.waitForTimeout(600);
  await p.click('[data-open="film"]'); await p.waitForTimeout(400);
  const order = await p.evaluate(() => current.steps.map(s => s.type === 'film' ? current.film.lines[s.li].id : s.type));
  ok(order[0] === 'h1' && order.length === 4 && order[3] === 'filmsum', 'the first line is not first: ' + order);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-filmopen]')]); await fc.setFiles(film);
  await p.waitForFunction(() => FILM.dur > 0, null, {timeout: 15000}).catch(() => fail.push('the film did not load'));
  // 1. once; a second click does not play
  await p.click('.film-ln .pl'); await p.waitForTimeout(300); ok(await p.evaluate(() => !!FILM.playing), 'the line did not play');
  await p.waitForFunction(() => !FILM.playing, null, {timeout: 6000}).catch(() => fail.push('the clip did not stop'));
  await p.waitForTimeout(200); await p.click('.film-ln .pl'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !FILM.playing) && await p.isVisible('#f-none'), 'a second click played before the first version');
  // 3. "lived" + Enter: hearts, then the line plays freely
  await p.fill('.film-in', 'lived'); await p.keyboard.press('Enter'); await p.waitForTimeout(120);
  ok(await p.evaluate(() => document.querySelectorAll('.fheart').length > 0), 'no hearts for a right word');
  await p.waitForTimeout(300); await p.click('.film-ln .pl'); await p.waitForTimeout(250); ok(await p.evaluate(() => !!FILM.playing), 'after the first version the line does not play');
  // engine 66: the waveform from the second listen on — drawn from what played; a drag plays that piece; Space types in the box, Ctrl+Space plays
  ok(await p.isVisible('canvas[data-fw]'), 'no waveform after the first version');
  ok(await p.evaluate(() => { const [w0, w1] = fwWin(fwLine()); let n = 0; for (let b = Math.floor(w0 * 100); b < w1 * 100; b++) if (FILM.pk.hi[b] != null) n++; return n > 50; }), 'the waveform has nothing from the plays');
  ok(await p.evaluate(() => { const s = FILM.sel[fwLine().id], c = filmClip(fwLine()); return s && Math.abs(s.s - c.s) < .01 && Math.abs(s.e - c.e) < .01; }), 'the line is not selected on the waveform');
  await p.evaluate(() => filmStop());
  const cv = await p.$('canvas[data-fw]'), bb = await cv.boundingBox();
  await p.mouse.move(bb.x + bb.width * .3, bb.y + 40); await p.mouse.down(); await p.mouse.move(bb.x + bb.width * .6, bb.y + 40, {steps: 6}); await p.mouse.up(); await p.waitForTimeout(250);
  const pc = await p.evaluate(() => ({sel: FILM.sel[fwLine().id], w: fwWin(fwLine()), playing: !!(FILM.playing && FILM.playing.piece), t: FILM.v.currentTime}));
  ok(pc.sel && Math.abs(pc.sel.s - (pc.w[0] + .3 * (pc.w[1] - pc.w[0]))) < .1 && pc.playing && pc.t >= pc.sel.s - .05 && pc.t <= pc.sel.e + .1, 'a drag did not play its piece: ' + JSON.stringify(pc));
  await p.waitForFunction(() => !FILM.playing, null, {timeout: 6000}).catch(() => fail.push('the piece did not stop'));
  ok(await p.evaluate(() => FILM.v.currentTime <= FILM.sel[fwLine().id].e + .15), 'the piece ran past its end');
  await p.click('.film-in'); await p.keyboard.press(' '); await p.waitForTimeout(200); ok(await p.evaluate(() => !FILM.playing), 'Space in the box played');
  await p.keyboard.press('Control+Space'); await p.waitForTimeout(250); ok(await p.evaluate(() => !!(FILM.playing && FILM.playing.piece)), 'Ctrl+Space in the box did not play the piece');
  await p.evaluate(() => filmStop());
  // 4. Check: the score line
  await p.fill('.film-in', "I've lived"); await p.click('#f-check'); await p.waitForTimeout(300);
  ok(/First listen: 1 of 2 words → now: 2 of 2/.test(await p.textContent('.film-score')), 'score: ' + await p.textContent('.film-score'));
  // 2. Nothing yet ↻ plays again at once; 5. show me without red
  await p.click('#go'); await p.waitForTimeout(300); await p.click('.film-ln .pl'); await p.waitForFunction(() => !FILM.playing, null, {timeout: 8000}); await p.waitForTimeout(200);
  await p.click('#f-none'); await p.waitForTimeout(250); ok(await p.evaluate(() => !!FILM.playing), 'Nothing yet did not play it again');
  await p.click('#f-show'); await p.waitForTimeout(250); ok(!(await p.$('.gap-res.no, .film-you')) && await p.isVisible('.gap-res.ans'), 'show me: red, or no answer');
  await p.click('#go'); await p.waitForTimeout(300); await p.click('#go'); await p.waitForTimeout(500);
  // 6. the end: two percentages; 8. the record went to her table with the code
  ok(/After one listen you caught \d+% of the words\. In the end: \d+%\./.test(await p.textContent('.film-big')), 'no summary');
  await p.waitForTimeout(500);
  ok(sent.length === 1 && sent[0].type === 'listening' && /h1 \[I've lived\] — first: "lived" \(1 of 2\) · plays before Check: \d+ \(\d+ of them pieces\)/.test(sent[0].text) && /order: h1 /.test(sent[0].text), 'the record: ' + JSON.stringify(sent));
  await p.click('#go'); await p.waitForTimeout(400); ok(await p.evaluate(() => done.has('film')), 'Finish did not tick the task');
  await p.goto('https://hw.test/c1/film-trial.html#film'); await p.waitForTimeout(500); ok(sent.length === 1, 'the record went twice');
  // without a code nothing goes
  const c2 = await b.newContext({viewport: {width: 1280, height: 720}}); await route(c2); let any = 0;
  await c2.route('https://script.google.com/**', r => { any++; r.fulfill({status: 200, body: '{}'}); });
  const q = await c2.newPage(); await q.goto('https://hw.test/c1/film-trial.html'); await q.waitForTimeout(400);
  await q.evaluate(() => { const t = TASKS.find(x => x.id === 'film'); current = t; stepIdx = t.steps.length - 1; renderTask(); }); await q.waitForTimeout(400); ok(any === 0, 'without a code something was sent');
  // 7. a phone: the line about the computer
  const ph = await b.newContext({...devices['iPhone 13']}); await route(ph); const r = await ph.newPage(); r.on('pageerror', e => errs.push('phone: ' + e.message));
  await r.goto('https://hw.test/c1/film-trial.html'); await r.waitForTimeout(500); ok(/on the computer/i.test(await r.textContent('body')), 'phone: no 💻 tag in the list');
  await r.click('[data-open="film"]'); await r.waitForTimeout(300); ok(/Open this task on the computer where your film is/.test(await r.textContent('body')), 'phone: no line about the computer');
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  if (!process.argv[3]) try { fs.unlinkSync(film); } catch (e) {}
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK film'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
