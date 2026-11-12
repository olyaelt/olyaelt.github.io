// tools 33 (her 12.11 07:57–08:09): 🎧 decoding prep, screen 1 (analysis) — the film and its .srt from her computer, ▶ at each line,
// the waveform, words → a piece (feature with subtopics, hard for B2 / C1, context from a line or the waveform, a note), the bank in her table.
//   node tests/prep_check.js SITE_DIR FILM.mp4 SUBS.srt [shots/]
// Code.gs runs in Node (mock.js); the live page talks to it. A second "computer" (an empty browser) gets the same bank from the table.
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), film = path.resolve(process.argv[3]), subs = path.resolve(process.argv[4]), shots = process.argv[5];
  const fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const shot = async (p, n) => { if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, n + '.png')}); } };
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['c1a', 'Clara', 'C1']]);
  // the script: only her code reads or writes the bank
  ok(!env.post(JSON.stringify({action: 'bankGet', code: 'c1a', film: 'x'})).ok, 'a student code read the bank');
  ok(!env.post(JSON.stringify({action: 'bankPut', code: 'c1a', film: 'x', pieces: [{id: 'p1'}]})).ok, 'a student code wrote the bank');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prep-')); fs.mkdirSync(path.join(tmp, 'tools/prep'), {recursive: true});
  for (const n of ['decoding.html', 'decoding-live.html'])
    fs.writeFileSync(path.join(tmp, 'tools/prep', n), fs.readFileSync(path.join(site, 'tools/prep', n), 'utf8').replace(/LIVE_URL = "[^"]*"/, `LIVE_URL = "${n.includes('live') ? URL_ : ''}"`));
  ok(!/script\.google\.com/.test(fs.readFileSync(path.join(site, 'tools/prep/decoding.html'), 'utf8')), 'the plain page talks to the table');
  const b = await chromium.launch({args: ['--autoplay-policy=no-user-gesture-required']});
  let posts = [];
  const open = async (page, opts = {}) => {
    const ctx = await b.newContext({viewport: opts.vp || {width: 1440, height: 860}, acceptDownloads: true});
    await ctx.addInitScript(() => { delete window.showOpenFilePicker; });   // the file input path (headless has no picker)
    await ctx.route(URL_ + '**', r => { const d = JSON.parse(r.request().postData()); posts.push(d.action); r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname, f = path.join(tmp, u); fs.existsSync(f) ? r.fulfill({status: 200, contentType: 'text/html', body: fs.readFileSync(f, 'utf8')}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(page + ': ' + e.message));
    await p.goto('https://hw.test/tools/prep/' + page);
    if (opts.code) { await p.evaluate(c => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }, opts.code); await p.reload(); }
    await p.waitForTimeout(300); return {ctx, p};
  };
  const load = async (p, kind, file) => { const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click(`[data-pick="${kind}"]`)]); await fc.setFiles(file); await p.waitForTimeout(500); };
  const choose = async (p, cue, phrase) => {   // select words inside a line, sloppily as with the mouse (a letter short at both ends, or a space more)
    await p.evaluate(([c, ph]) => { const el = document.querySelector(`.cue-x[data-cx="${c}"]`), tn = el.firstChild, t = tn.textContent, i = t.indexOf(ph), j = i + ph.length;
      const r = document.createRange(); r.setStart(tn, i ? i - 1 : 1); r.setEnd(tn, j - 1); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }, [cue, phrase]);
    await p.dispatchEvent('#pp-cues', 'mouseup'); await p.waitForTimeout(200); };
  // 1. her page with her code: the film and the subtitles from her computer
  const A = await open('decoding-live.html', {code: tc}); const p = A.p;
  await shot(p, 'p0-empty');
  await load(p, 'sub', subs); await load(p, 'film', film);
  const nCues = await p.locator('.cue').count(), nPl = await p.locator('.cue [data-cpl].cue-pl').count();
  ok(nCues === 40 && nPl === 40, '1: the lines are not as in the .srt: ' + nCues + ' / ' + nPl);
  ok(/Morning\. You're the new intern\?/.test(await p.textContent('.cue[data-c="0"]')), '1: the first line');
  ok(/In your table ✓/.test(await p.textContent('#pp-top')), '1: the bank status: ' + await p.textContent('#pp-top'));
  // 2. ▶ at a line plays it and moves the waveform there
  await p.click('.cue[data-c="2"] .cue-pl'); await p.waitForTimeout(300);
  let st = await p.evaluate(() => ({win: P.win, playing: !!P.playing, t: P.v.currentTime, cur: P.cur, s: P.cues[2].s, e: P.cues[2].e}));
  ok(st.playing && st.cur === 2 && st.win[0] <= st.s && st.win[1] >= st.e && st.t >= st.s - .1, '2: ▶ at a line: ' + JSON.stringify(st));
  await p.waitForTimeout(3300);
  st = await p.evaluate(() => ({playing: !!P.playing, drawn: Object.keys(P.pk.hi).length}));
  ok(!st.playing && st.drawn > 100, '2: the line didn\'t stop at its end, or no waveform: ' + JSON.stringify(st));
  await shot(p, 'p1-line');
  // 3. words in a line → a piece: a feature with a subtopic, hard for B2, context from the line before, a note
  await choose(p, 2, "can't");
  ok(await p.evaluate(() => P.draft && P.draft.c0 === 2), '3: no draft from the chosen words');
  ok((await p.textContent('[data-editor] .pp-line b')) === "can't", '3: the gap: ' + await p.textContent('[data-editor] .pp-line b'));
  await p.fill('[data-newf]', 'grammar'); await p.click('[data-addf]');
  await p.fill('[data-newf]', "can / can't"); await p.selectOption('[data-newp]', {label: 'under grammar'}); await p.click('[data-addf]');
  await p.click('[data-hard="b2"]'); await p.click('[data-ctxpick]'); await p.waitForTimeout(100);
  ok(await p.locator('.cue-pl.ctxpick').count() === 40, '3: the line buttons don\'t offer the context');
  await shot(p, 'p2-piece');
  await p.click('.cue[data-c="1"] .cue-pl');
  ok(await p.evaluate(() => Math.abs(P.draft.ctx - P.cues[1].s) < .01), '3: context from the line before');
  await p.fill('[data-note]', "can't → /kɑːn/, the t disappears");
  await p.click('[data-save]'); await p.waitForTimeout(1600);
  const bank = () => { const sh = env.sheets['Decoding bank']; return sh ? sh.getRange(2, 1, Math.max(1, sh.getLastRow() - 1), 11).getValues().filter(r => r[0]) : []; };
  let rows = bank(), r1 = rows.find(r => r[0] !== '_features');
  ok(r1 && r1[1] === 'The_Intern' && /can't/.test(r1[4]) && r1[5] === "grammar › can / can't" && r1[6] === 'B2' && /the t disappears/.test(r1[7]) && r1[8], '3: the row in her table: ' + JSON.stringify(rows));
  ok(rows.some(r => r[0] === '_features' && /can \/ can't/.test(r[10])), '3: her features are not in the table');
  ok(await p.locator('mark[data-pc]').count() === 1, '3: the piece is not marked in its line');
  // 4. a piece chosen on the waveform: drag → it plays; the piece's time = the waveform choice; another feature; hard for C1; no context
  await p.click('.cue[data-c="4"] .cue-pl'); await p.waitForTimeout(3200);
  await choose(p, 4, 'of the');
  const box = await p.locator('canvas[data-wave]').boundingBox();
  await p.mouse.move(box.x + box.width * .35, box.y + 40); await p.mouse.down(); await p.mouse.move(box.x + box.width * .45, box.y + 40, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({sel: P.sel, playing: P.playing && P.playing.what}));
  ok(st.sel && st.sel.e > st.sel.s && st.playing === 'piece', '4: the drag on the waveform: ' + JSON.stringify(st));
  await p.click('[data-pp-time]');
  ok(await p.evaluate(() => Math.abs(P.draft.s - P.sel.s) < .001), '4: the piece time from the waveform');
  ok(!(await p.$('[data-newf]')), '4: the add row is open on a new piece'); await p.click('[data-addopen]');
  await p.fill('[data-newf]', 'weak of'); await p.click('[data-addf]'); await p.click('[data-hard="c1h"]');
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => P.playing && P.playing.what === 'piece'), '4: Space doesn\'t play the piece');
  await shot(p, 'p3-wave');
  await p.click('[data-save]'); await p.waitForTimeout(1600);
  rows = bank().filter(r => r[0] !== '_features');
  ok(rows.length === 2 && rows.some(r => r[5] === 'weak of' && r[6] === 'C1' && r[8] === ''), '4: the second row: ' + JSON.stringify(rows));
  // 5. find: words, or /regex/
  await p.fill('[data-q]', "/can'?t/"); await p.waitForTimeout(150);
  const found = await p.locator('.cue').count(); ok(found === 2, "5: /can'?t/ found " + found + ' lines');
  await shot(p, 'p4-find');
  await p.fill('[data-q]', ''); await p.fill('[data-from]', '0:20'); await p.fill('[data-to]', '0:40'); await p.waitForTimeout(150);
  const scene = await p.evaluate(() => [...document.querySelectorAll('.cue')].map(x => P.cues[+x.dataset.c].s));
  ok(scene.length > 3 && scene.every(s => s <= 40) && scene[0] >= 17, '5: the scene from–to: ' + JSON.stringify(scene));
  await p.fill('[data-from]', ''); await p.fill('[data-to]', '');
  // 6. the chat text and the JSON
  const chat = await p.evaluate(() => chatText());
  ok(/## grammar › can \/ can't \(1\)/.test(chat) && /I \{\{can't\}\} believe/.test(chat) && /\{\{of the\}\}/.test(chat) && /hard B2/.test(chat) && /ctx 0:/.test(chat), '6: the chat text: ' + chat);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-json]')]); const J = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  ok(J.film === 'The_Intern' && J.pieces.length === 2 && J.features.length === 3, '6: the JSON: ' + JSON.stringify(J).slice(0, 200));
  // 7. a piece reopened and changed; then one deleted
  await p.click('mark[data-pc]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => P.draft && !!P.draft.id), '7: tapping a piece doesn\'t open it');
  await p.fill('[data-note]', 'changed'); await p.click('[data-save]'); await p.waitForTimeout(1600);
  ok(bank().some(r => r[7] === 'changed') && bank().filter(r => r[0] !== '_features').length === 2, '7: the change in the table');
  await p.click('li[data-open]:has-text("of the")'); await p.click('[data-del]'); await p.waitForTimeout(1600);
  ok(bank().filter(r => r[0] !== '_features').length === 1, '7: the deleted piece is still in the table');
  await shot(p, 'p5-bank');
  await A.ctx.close();
  // 8. the other computer: an empty browser with her code gets the same bank and features from the table
  const B = await open('decoding-live.html', {code: tc});
  await load(B.p, 'sub', subs);
  const other = await B.p.evaluate(() => ({n: P.pieces.length, f: P.features.map(f => f.name), note: P.pieces[0] && P.pieces[0].note}));
  ok(other.n === 1 && other.f.length === 3 && other.note === 'changed', '8: the other computer: ' + JSON.stringify(other));
  ok(await B.p.locator('mark[data-pc]').count() === 1, '8: the piece is not marked there');
  await B.ctx.close();
  // 9. the plain page: no table, the bank on this computer
  posts = []; const C = await open('decoding.html', {code: tc}); await load(C.p, 'sub', subs);
  ok(!posts.length && /this computer/i.test(await C.p.textContent('#pp-top')), '9: the plain page: ' + posts + ' · ' + await C.p.textContent('#pp-top'));
  await C.ctx.close();
  // 10. 1280×720 (her smaller screen): the waveform and the editor's Save are on screen
  const D = await open('decoding-live.html', {code: tc, vp: {width: 1280, height: 720}}); await load(D.p, 'sub', subs); await load(D.p, 'film', film);
  await choose(D.p, 6, 'Can I get');
  const fits = await D.p.evaluate(() => { const w = document.querySelector('canvas[data-wave]').getBoundingClientRect(); return {wave: w.bottom <= innerHeight + 1, doc: document.documentElement.scrollHeight <= innerHeight + 1}; });
  const save = await D.p.evaluate(() => { const r = document.querySelector('[data-save]').getBoundingClientRect(), s = document.getElementById('pp-side').getBoundingClientRect(); return r.bottom <= s.bottom + 1; });
  ok(fits.wave && fits.doc && save, '10: 1280×720: ' + JSON.stringify(fits) + ' save on screen: ' + save);
  await shot(D.p, 'p6-1280');
  await D.ctx.close();
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK decoding prep'); process.exit(fail.length ? 1 : 0);
})();
