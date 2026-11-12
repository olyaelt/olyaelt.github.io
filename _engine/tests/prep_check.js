// tools 33 (her 12.11 07:57–08:09): 🎧 decoding prep, screen 1 (analysis) — the film and its .srt from her computer, ▶ at each line,
// the waveform, words → a piece (feature with subtopics, hard for B2 / C1, context from a line or the waveform, a note), the bank in her table.
//   node tests/prep_check.js SITE_DIR FILM.mp4 SUBS.srt [shots/]
// tools 36 (her 12.11 13:18–13:21): a line break written <br/> is a space; ▶ / a click in a line plays ON from there, the waveform and the line follow; ■ stops;
//   the waveform moves with ← → and by dragging its times; a piece made on the old glued text keeps its words.
// Code.gs runs in Node (mock.js); the live page talks to it. A second "computer" (an empty browser) gets the same bank from the table.
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), film = path.resolve(process.argv[3]), subs0 = path.resolve(process.argv[4]), shots = process.argv[5];
  const fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const shot = async (p, n) => { if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, n + '.png')}); } };
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['c1a', 'Clara', 'C1']]);
  // the script: only her code reads or writes the bank
  ok(!env.post(JSON.stringify({action: 'bankGet', code: 'c1a', film: 'x'})).ok, 'a student code read the bank');
  ok(!env.post(JSON.stringify({action: 'bankPut', code: 'c1a', film: 'x', pieces: [{id: 'p1'}]})).ok, 'a student code wrote the bank');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prep-')); fs.mkdirSync(path.join(tmp, 'tools/prep'), {recursive: true});
  // her real .srt writes the line break inside a cue as <br/>: line 3 gets one, line 4 a plain second line
  const subs = path.join(tmp, path.basename(subs0));
  fs.writeFileSync(subs, fs.readFileSync(subs0, 'utf8').replace("I can't believe they actually hired you.", "I can't believe<br/>they actually hired you.").replace("Well, there's a first time for everything.", "Well, there's a first time\nfor everything."));
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
  const chooseAny = async (p, cue, phrase) => {   // the same across the line's pieces (its text is split by marks)
    await p.evaluate(([c, ph]) => { const el = document.querySelector(`.cue-x[data-cx="${c}"]`), i = el.textContent.indexOf(ph), j = i + ph.length, w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), r = document.createRange(); let at = 0, n;
      while((n = w.nextNode())){ const L = n.textContent.length; if(i >= at && i <= at + L) r.setStart(n, i - at); if(j >= at && j <= at + L){ r.setEnd(n, j - at); break; } at += L; }
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); }, [cue, phrase]);
    await p.dispatchEvent('#pp-cues', 'mouseup'); await p.waitForTimeout(200); };
  // 1. her page with her code: the film and the subtitles from her computer
  const A = await open('decoding-live.html', {code: tc}); const p = A.p;
  await shot(p, 'p0-empty');
  await load(p, 'sub', subs); await load(p, 'film', film);
  const nCues = await p.locator('.cue').count(), nPl = await p.locator('.cue [data-cpl].cue-pl').count();
  ok(nCues === 40 && nPl === 40, '1: the lines are not as in the .srt: ' + nCues + ' / ' + nPl);
  ok(/Morning\. You're the new intern\?/.test(await p.textContent('.cue[data-c="0"]')), '1: the first line');
  ok(await p.evaluate(() => P.cues[2].t === "I can't believe they actually hired you." && P.cues[3].t === "Well, there's a first time for everything."), '1: a line break is not a space: ' + await p.evaluate(() => P.cues[2].t + ' | ' + P.cues[3].t));
  ok(/In your table ✓/.test(await p.textContent('#pp-top')), '1: the bank status: ' + await p.textContent('#pp-top'));
  // 2. ▶ at a line plays ON from it: the waveform turns its page, the next lines light up, ▶ there is ■; ■ stops
  await p.click('.cue[data-c="2"] .cue-pl'); await p.waitForTimeout(300);
  let st = await p.evaluate(() => ({win: P.win, playing: P.playing && P.playing.what, t: P.v.currentTime, cur: P.cur, s: P.cues[2].s, e: P.cues[2].e, stop: (document.querySelector('.cue[data-c="2"] .cue-pl') || {}).textContent}));
  ok(st.playing === 'run' && st.cur === 2 && st.win[0] <= st.s && st.win[1] >= st.e && st.t >= st.s - .1 && st.stop === '■', '2: ▶ at a line: ' + JSON.stringify(st));
  const w0 = st.win[0];
  await p.waitForTimeout(9000);
  st = await p.evaluate(() => ({playing: P.playing && P.playing.what, t: P.v.currentTime, cur: P.cur, win: P.win, drawn: Object.keys(P.pk.hi).length, curEl: !!document.querySelector('.cue.cur[data-c="' + P.cur + '"]'), stops: [...document.querySelectorAll('.cue-pl.stopb')].map(b => b.dataset.cpl), was: document.querySelector('.cue[data-c="2"] .cue-pl').textContent}));
  ok(st.playing === 'run' && st.cur >= 4 && st.curEl && st.win[0] > w0 + 2 && st.t >= st.win[0] && st.t <= st.win[1] && st.drawn > 500, '2: it didn\'t play on, or the waveform / the line didn\'t follow: ' + JSON.stringify(st));
  ok(st.stops.length === 1 && +st.stops[0] === st.cur && st.was === '▶', '2: ■ is not on the line that plays: ' + JSON.stringify(st));
  await shot(p, 'p1-line');
  await p.click('.cue-pl.stopb'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !P.playing && !document.querySelector('.cue-pl.stopb')), '2: ■ did not stop');
  // a click in a line's words plays on from that line; a drag there is still a piece (section 3); Esc stops
  await p.click('.cue[data-c="1"] .cue-x', {position: {x: 30, y: 8}}); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({playing: P.playing && P.playing.what, cur: P.cur, t: P.v.currentTime, s: P.cues[1].s, draft: !!P.draft}));
  ok(st.playing === 'run' && st.cur === 1 && st.t >= st.s - .1 && st.t < st.s + 1.5 && !st.draft, '2: a click in the words: ' + JSON.stringify(st));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => !P.playing), '2: Esc did not stop');
  // the waveform moves along: → and ←, and dragging its times (the strip under the wave)
  let wa = await p.evaluate(() => P.win.slice()); await p.keyboard.press('ArrowRight'); let wb = await p.evaluate(() => P.win.slice());
  ok(wb[0] > wa[0] + 1 && Math.abs((wb[1] - wb[0]) - (wa[1] - wa[0])) < .01, '2: → did not move the waveform: ' + wa + ' → ' + wb);
  await p.keyboard.press('ArrowLeft'); ok(Math.abs((await p.evaluate(() => P.win[0])) - wa[0]) < .01, '2: ← did not move it back');
  const wbox = await p.locator('canvas[data-wave]').boundingBox(); wa = await p.evaluate(() => P.win.slice());
  await p.mouse.move(wbox.x + wbox.width * .6, wbox.y + wbox.height - 6); await p.mouse.down(); await p.mouse.move(wbox.x + wbox.width * .3, wbox.y + wbox.height - 6, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(150);
  st = await p.evaluate(() => ({win: P.win, playing: !!P.playing, sel: P.sel}));
  ok(st.win[0] > wa[0] + (wa[1] - wa[0]) * .2 && !st.playing && !st.sel, '2: dragging the times did not move the waveform: ' + JSON.stringify([wa, st]));
  // a piece dragged past the right edge moves the waveform along, and the piece grows with it (her 13:44)
  wa = await p.evaluate(() => P.win.slice()); const tStart = wa[0] + (wa[1] - wa[0]) * .5;
  await p.mouse.move(wbox.x + wbox.width * .5, wbox.y + 40); await p.mouse.down(); await p.mouse.move(wbox.x + wbox.width + 40, wbox.y + 40, {steps: 6}); await p.waitForTimeout(800);
  st = await p.evaluate(() => ({win: P.win.slice(), sel: P.sel && {s: P.sel.s, e: P.sel.e}}));
  await p.mouse.up(); await p.waitForTimeout(150);
  const st2 = await p.evaluate(() => ({playing: P.playing && P.playing.what, sel: P.sel && {s: P.sel.s, e: P.sel.e}}));
  ok(st.win[0] > wa[0] + 1 && st.sel && Math.abs(st.sel.s - tStart) < .1 && Math.abs(st.sel.e - st.win[1]) < .15 && st.sel.e > wa[1] + 1 && st2.playing === 'piece' && st2.sel.e >= st.sel.e - .01, '2: a piece dragged past the edge: ' + JSON.stringify([wa, st, st2]));
  await p.keyboard.press('Escape'); await p.evaluate(() => { P.sel = null; });
  // a click on the waveform plays on from there
  await p.mouse.click(wbox.x + wbox.width * .5, wbox.y + 40); await p.waitForTimeout(250);
  st = await p.evaluate(() => ({playing: P.playing && P.playing.what, c: P.cursor, t: P.v.currentTime}));
  ok(st.playing === 'run' && Math.abs(st.t - st.c) < 1, '2: a click on the waveform: ' + JSON.stringify(st));
  await p.keyboard.press('Escape');
  // 3. words in a line → a piece: a feature with a subtopic, hard for B2, context from the line before, a note
  await choose(p, 2, "can't");
  ok(await p.evaluate(() => P.draft && P.draft.c0 === 2), '3: no draft from the chosen words');
  ok((await p.textContent('[data-editor] .pp-line b')) === "can't", '3: the gap: ' + await p.textContent('[data-editor] .pp-line b'));
  ok(await p.evaluate(() => Math.abs(P.draft.ctx - P.cues[2].s) < .001 && /the line/.test(document.querySelector('[data-editor]').textContent)), '3: the context is not the line by default');
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
  await p.click('.cue[data-c="4"] .cue-pl'); await p.waitForTimeout(3200); await p.keyboard.press('Escape');
  await choose(p, 4, 'of the');
  const box = await p.locator('canvas[data-wave]').boundingBox();
  await p.mouse.move(box.x + box.width * .35, box.y + 40); await p.mouse.down(); await p.mouse.move(box.x + box.width * .45, box.y + 40, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(200);
  st = await p.evaluate(() => ({sel: P.sel, playing: P.playing && P.playing.what}));
  ok(st.sel && st.sel.e > st.sel.s && st.playing === 'piece', '4: the drag on the waveform: ' + JSON.stringify(st));
  await p.click('[data-pp-time]');
  ok(await p.evaluate(() => Math.abs(P.draft.s - P.sel.s) < .001), '4: the piece time from the waveform');
  ok(!(await p.$('[data-newf]')), '4: the add row is open on a new piece'); await p.click('[data-addopen]');
  await p.fill('[data-newf]', 'weak of'); await p.click('[data-addf]');
  ok(await p.evaluate(() => !P.draft.b2 && !P.draft.c1h), '4: a new feature kept hard-for of the last one: ' + await p.evaluate(() => JSON.stringify(P.draft)));
  await p.click('[data-hard="c1h"]'); await p.click('[data-ctxnone]');
  await p.keyboard.press('Space'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => P.playing && P.playing.what === 'piece'), '4: Space doesn\'t play the piece');
  await shot(p, 'p3-wave');
  await p.click('[data-save]'); await p.waitForTimeout(1600);
  rows = bank().filter(r => r[0] !== '_features');
  ok(rows.length === 2 && rows.some(r => r[5] === 'weak of' && r[6] === 'C1' && r[8] === ''), '4: the second row: ' + JSON.stringify(rows));
  // 5. find: words, or /regex/
  await p.fill('[data-q]', "/can'?t/"); await p.waitForTimeout(150);
  const found = await p.locator('.cue').count(); ok(found === 2, "5: /can'?t/ found " + found + ' lines');
  await p.fill('[data-q]', "/can|can't/"); await p.waitForTimeout(150); const nRe = await p.locator('.cue').count();
  for (const q of ["can|can't", "(can|can’t)"]) { await p.fill('[data-q]', q); await p.waitForTimeout(150); const n = await p.locator('.cue').count(); ok(nRe >= 2 && n === nRe, '5: «' + q + '» found ' + n + ', /can|can\'t/ ' + nRe); }
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
  await p.click('.pp-bank .bk-t:has-text("of the")'); await p.click('[data-del]'); await p.waitForTimeout(1600);
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
  // 12. fewer clicks (her 13:28–13:34): words → the feature they point to, hard for as last time in it, the context = the line; choosing other words keeps the piece; Esc keeps it
  const G = await open('decoding-live.html', {code: tc}); const g = G.p; await load(g, 'sub', subs); await load(g, 'film', film); await g.waitForTimeout(800);
  const n0 = bank().filter(r => r[0] !== '_features').length;
  await choose(g, 6, 'Can I get');
  let gd = await g.evaluate(() => ({f: featName(P.draft.f), auto: P.draft.fAuto, b2: P.draft.b2, c1h: P.draft.c1h, ctx: Math.abs(P.draft.ctx - P.cues[6].s) < .001, why: document.querySelector('[data-editor]').textContent}));
  ok(gd.f === "grammar › can / can't" && gd.auto === 'words' && gd.b2 && !gd.c1h && gd.ctx && /from the words/.test(gd.why) && /as last time/.test(gd.why), '12: «Can I get»: ' + JSON.stringify(gd));
  await choose(g, 10, 'bit of a'); await g.waitForTimeout(1600);
  let rows12 = bank().filter(r => r[0] !== '_features');
  ok(rows12.length === n0 + 1 && rows12.some(r => /Can I get/.test(r[4]) && r[5] === "grammar › can / can't" && r[6] === 'B2'), '12: other words did not keep «Can I get»: ' + JSON.stringify(rows12));
  gd = await g.evaluate(() => ({f: featName(P.draft.f), b2: P.draft.b2, c1h: P.draft.c1h}));
  ok(gd.f === 'weak of' && !gd.b2 && gd.c1h, '12: «bit of a» → weak of, C1 only: ' + JSON.stringify(gd));
  await chooseAny(g, 10, 'bit of a mess');   // the same piece chosen again, longer: it moves, no second piece
  ok(await g.evaluate(() => !P.draft.id && pieceParts(P.draft).gap === 'bit of a mess'), '12: choosing over the piece again: ' + await g.evaluate(() => JSON.stringify(P.draft)));
  await g.keyboard.press('Escape'); await g.waitForTimeout(1600);
  rows12 = bank().filter(r => r[0] !== '_features');
  ok(rows12.length === n0 + 2 && rows12.some(r => r[4] === 'bit of a mess' && r[5] === 'weak of' && r[6] === 'C1') && !rows12.some(r => r[4] === 'bit of a'), '12: Esc did not keep it: ' + JSON.stringify(rows12));
  // ▶ With context plays the context and then the piece, also from the line's start
  await g.click('.pp-bank .bk-t:text-is("bit of a mess")'); await g.click('[data-ctxplay]'); await g.waitForTimeout(300);
  gd = await g.evaluate(() => ({p: P.playing && [P.playing.what, P.playing.s, P.playing.e], s: P.draft.s, e: P.draft.e}));
  ok(gd.p && gd.p[0] === 'ctx' && gd.p[2] > gd.e, '12: ▶ With context: ' + JSON.stringify(gd));
  await g.keyboard.press('Escape'); await g.keyboard.press('Escape'); await g.waitForTimeout(1600);
  ok(bank().filter(r => r[0] !== '_features').length === n0 + 2, '12: an unchanged piece was written again or lost');
  await shot(g, 'p7-defaults');
  // 13. the bank as a list to check (her 13:47): ▶ = the context, then the piece; B2 / C1, diagnostic / training and ✕ hide right there; ▶ all; found with find = training
  const li = t => `.pp-bank li:has(.bk-t:text-is("${t}"))`;
  ok(await g.locator('.pp-bank li').count() === 3 && await g.locator('.pp-bank li [data-bplay]').count() === 3 && await g.locator('.pp-bank li .bk-c.role.diag').count() === 3, '13: the list: ' + await g.textContent('.pp-bank'));
  await g.click(li('bit of a mess') + ' [data-bplay]'); await g.waitForTimeout(250);
  gd = await g.evaluate(() => { const x = P.pieces.find(p => p.gap === 'bit of a mess'); return {p: P.playing && [P.playing.what, P.playing.s, P.playing.e], a: Math.min(x.ctx, x.s), e: x.e, now: (document.querySelector('.pp-bank li.now .bk-t') || {}).textContent, stop: (document.querySelector('.pp-bank li.now [data-bplay]') || {}).textContent}; });
  ok(gd.p && gd.p[0] === 'bank' && Math.abs(gd.p[1] - gd.a) < .01 && gd.p[2] > gd.e && gd.now === 'bit of a mess' && gd.stop === '■', '13: ▶ in the list: ' + JSON.stringify(gd));
  await g.click(li('bit of a mess') + ' [data-bplay]'); ok(await g.evaluate(() => !P.playing), '13: ■ in the list did not stop');
  await g.click(li('Can I get') + ' [data-bhard$=":c1h"]'); await g.click(li('Can I get') + ' [data-brole]'); await g.waitForTimeout(1600);
  let rCan = bank().find(r => r[4] === 'Can I get');
  ok(rCan && /B2.*C1|C1.*B2/.test(rCan[6]) && /"role":"train"/.test(rCan[10]), '13: B2 / C1 and training from the list: ' + JSON.stringify(rCan));
  ok(await g.evaluate(() => [...document.querySelectorAll('.pp-bank details')].find(d => /can \/ can't/.test(d.querySelector('summary').textContent)).querySelector('li:last-child .bk-t').textContent) === 'Can I get', '13: training is not after diagnostic');
  await g.click(li('Can I get') + ' [data-bhide]'); await g.waitForTimeout(1600);
  ok(await g.locator('.bk-hid li').count() === 1 && /Hidden · 1/.test(await g.textContent('.pp-bank')) && !/Can I get/.test(await g.evaluate(() => chatText())) && /DIAGNOSTIC · /.test(await g.evaluate(() => chatText())), '13: ✕ hide: ' + await g.evaluate(() => chatText()));
  ok(/"hidden":true/.test((bank().find(r => r[4] === 'Can I get') || [])[10] || ''), '13: hidden is not kept in the table');
  await g.click('[data-ball]:near(:text("weak of"))').catch(() => {}); await g.evaluate(() => { const b = [...document.querySelectorAll('[data-ball]')].find(x => /weak of/.test(x.parentElement.textContent)); b.click(); }); await g.waitForTimeout(250);
  ok(await g.evaluate(() => P.playing && P.playing.what === 'bank'), '13: ▶ all did not play');
  await g.keyboard.press('Escape');
  await g.fill('[data-q]', 'hired'); await g.waitForTimeout(150); await chooseAny(g, 2, 'actually'); 
  ok(await g.evaluate(() => P.draft && P.draft.role === 'train' && /training/.test(document.querySelector('[data-editor]').textContent)), '13: a piece found with find is not training: ' + await g.evaluate(() => JSON.stringify(P.draft)));
  await shot(g, 'p8-bank'); await g.keyboard.press('Escape'); await g.fill('[data-q]', ''); await g.waitForTimeout(1600);
  await g.click('.bk-hid summary'); await shot(g, 'p9-list');
  await G.ctx.close();
  // 11. a piece made when the page glued the <br/> lines ("believethey") keeps its words: "believe they"; and it goes to the table
  const E = await open('decoding-live.html', {code: tc});
  const glued = "I can't believethey actually hired you.", gs = glued.indexOf('believethey');
  await E.p.evaluate(([t, g]) => localStorage.setItem('prep-bank-The_Intern', JSON.stringify({features: [], pieces: [{id: 'pold', c0: 2, c1: 2, cs0: 8.12, gs: g, ge: g + 11, gap: 'believethey', text: t, s: 8.12, e: 11.12, f: null, b2: false, c1h: false, note: '', ctx: null, u: 1}]})), [glued, gs]);
  await load(E.p, 'sub', subs); await E.p.waitForTimeout(1600);
  const old = await E.p.evaluate(() => { const x = P.pieces.find(p => p.id === 'pold'); return x && {gap: pieceParts(x).gap, text: x.text, mark: (document.querySelector('mark[data-pc="pold"]') || {}).textContent}; });
  ok(old && old.gap === 'believe they' && old.mark === 'believe they' && /believe they/.test(old.text), '11: the old piece: ' + JSON.stringify(old));
  ok(bank().some(r => r[0] === 'pold' && /believe they/.test(r[4])), '11: the fixed piece is not in the table');
  await E.ctx.close();
  // 10. 1280×720 (her smaller screen): the waveform and the editor's Save are on screen
  const D = await open('decoding-live.html', {code: tc, vp: {width: 1280, height: 720}}); await load(D.p, 'sub', subs); await load(D.p, 'film', film);
  await chooseAny(D.p, 6, 'you a coffee');
  const fits = await D.p.evaluate(() => { const w = document.querySelector('canvas[data-wave]').getBoundingClientRect(); return {wave: w.bottom <= innerHeight + 1, doc: document.documentElement.scrollHeight <= innerHeight + 1}; });
  const save = await D.p.evaluate(() => { const r = document.querySelector('[data-save]').getBoundingClientRect(), s = document.getElementById('pp-side').getBoundingClientRect(); return r.bottom <= s.bottom + 1; });
  ok(fits.wave && fits.doc && save, '10: 1280×720: ' + JSON.stringify(fits) + ' save on screen: ' + save);
  await shot(D.p, 'p6-1280');
  await D.ctx.close();
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK decoding prep'); process.exit(fail.length ? 1 : 0);
})();
