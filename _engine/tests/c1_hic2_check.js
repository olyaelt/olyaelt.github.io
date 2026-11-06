// tools 30 (C1 6.11 v2 handoff 13:55): «Has it changed much?» — four stages; the photo first, with its credit; the video transcript in three
// parts + two memorisation screens, each with its glossary and the source line; the first chat with its own ⚡; one deck of 11 form cards
// (box FORM) + 6 make-sentence cards (box ABC, 💬 Your turn); the recall; the six photos with ⏱ and the credit on one row; six scenes with
// a credit each; then & now with box FL and ⚡ with two lines. Every screen fits 1280×720.
//   node tests/c1_hic2_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.png') ? 'image/png' : f.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
  await p.goto(base + 'tools/c1-2026-11-06/has-it-changed.html'); await p.waitForTimeout(400);
  const go = (si, bi) => p.evaluate(([si, bi]) => { goStage(si, false); S.intro = false; goBlock(si, bi); }, [si, bi]).then(() => p.waitForTimeout(300));
  const fits = () => p.evaluate(() => { const blk = document.querySelector('#main .blk'), bar = document.querySelector('#main .stepbar'), side = document.querySelector('#side aside.box'), r = bar.getBoundingClientRect();
    return {ok: blk.getBoundingClientRect().bottom <= r.top + 1 && r.bottom <= innerHeight + 1 && (!side || side.getBoundingClientRect().bottom <= innerHeight + 1), k: (document.querySelector('#main .blk [style*="--k"]') || {style: {getPropertyValue: () => ''}}).style.getPropertyValue('--k')}; });
  const txt = () => p.evaluate(() => document.querySelector('#main').innerText);
  out.stages = await p.evaluate(() => D.stages.map(s => s.label)); expect('four stages, her names', JSON.stringify(out.stages) === JSON.stringify(['☕ Warm-up', '🎬 Video', '✏️ Practice', '💬 Use it']), out.stages);
  const n = await p.evaluate(() => D.stages.map(s => s.blocks.length));
  for (let si = 0; si < n.length; si++) for (let bi = 0; bi < n[si]; bi++) { await go(si, bi); const f = await fits(); expect(`screen ${si}.${bi} fits 1280×720, the box too`, f.ok, f);
    expect(`screen ${si}.${bi}: no "undefined", no raw ~~ or **`, !/undefined|~~|\*\*/.test(await txt()), si + '.' + bi); }
  // warm-up: the photo (a frame until it's there), no task line, the credit with its links in a new tab
  await go(0, 0); out.w = await p.evaluate(() => ({instr: !!document.querySelector('#main .finstr'), fig: !!document.querySelector('#main figure.pic'), links: [...document.querySelectorAll('#main p.credit a')].map(a => [a.target, a.rel, /^https:/.test(a.href)])}));
  expect('warm-up: the photo alone, the credit links open in a new tab', !out.w.instr && out.w.fig && out.w.links.length === 2 && out.w.links.every(l => l[0] === '_blank' && l[1] === 'noopener' && l[2]), out.w);
  // video: three parts with glossary + source, two memorisation screens with gaps
  for (const bi of [0, 1, 2]) { await go(1, bi); const v = await p.evaluate(() => ({cred: (document.querySelector('#main p.credit') || {}).textContent || '', gl: document.querySelectorAll('#main aside.gloss .gl').length, ipa: [...document.querySelectorAll('#main aside.gloss .ipa')].length}));
    expect(`video ${bi + 1}: its glossary, the IPA shown, the source line`, /Empower C1 Workbook/.test(v.cred) && v.gl >= 5 && v.ipa >= 1, v); }
  await go(1, 0); out.del = await p.evaluate(() => document.querySelectorAll('#main aside.gloss .ru .m-del').length); expect('a struck form in a glossary note («in our days»)', out.del === 1, out.del);
  for (const bi of [3, 4]) { await go(1, bi); const g = await p.evaluate(() => document.querySelectorAll('#main .dlg .gp').length); expect(`memorisation ${bi - 2}: gaps with first letters`, g >= 10, g); }
  // the first chat: two questions one at a time, its own ⚡ after the second
  await go(1, 5); out.q1 = await p.evaluate(() => ({fast: !!document.querySelector('#main section.fast'), box: !!document.querySelector('#side aside.box')}));
  await p.click('.stepbar [data-step]'); await p.waitForTimeout(300);
  out.q2 = await p.evaluate(() => { const f = document.querySelector('#main section.fast'); return {fast: f ? f.innerText : '', stage: S.stage}; });
  expect('the first chat: the box beside, ⚡ only after the second question, with its own line', !out.q1.fast && out.q1.box && /hardly changed/.test(out.q2.fast) && !/bring back/.test(out.q2.fast) && out.q2.stage === 1, {q1: out.q1, q2: out.q2});
  // practice: one deck — 11 form cards (FORM), then 6 make-sentence cards (ABC) with their own instruction and 💬 Your turn
  await go(2, 0);
  out.deck = await p.evaluate(() => { const b = curBlock(); return {n: b.cards.length, box0: boxFor(b), del: document.querySelectorAll('#side aside.box .m-del').length}; });
  expect('practice: one deck of 17 cards, box FORM first, «more busier» struck', out.deck.n === 17 && out.deck.box0 === 'FORM' && out.deck.del === 1, out.deck);
  out.c12 = await p.evaluate(() => { const b = curBlock(), d = deckOf(b); d.queue = [11].concat(d.queue.filter(i => i !== 11)); d.flipped = false; render(); return {box: boxFor(b), lbl: (document.querySelector('#main .deck .fc .lbl, #main .deck .fc .fc-lbl, #main .deck .flab') || document.querySelector('#main .deck')).innerText.slice(0, 120)}; });
  expect('card 12 (make sentences): box ABC, its own instruction', out.c12.box === 'ABC' && /make a sentence from the words/i.test(out.c12.lbl), out.c12);
  await p.click('.stepbar [data-step]'); await p.waitForTimeout(250); await p.click('.stepbar [data-step]'); await p.waitForTimeout(300);
  out.turn = await p.evaluate(() => ({turn: deckOf(curBlock()).turn, t: /your turn/i.test(document.querySelector('#main').innerText)}));
  expect('after its answer: 💬 Your turn', out.turn.turn === 11 && out.turn.t, out.turn);
  expect('the Your turn screen fits', (await fits()).ok, await fits());
  // use it: the six photos with ⏱ and the credit on one row, the reactions under them
  await go(3, 0); out.pic = await p.evaluate(() => { const row = document.querySelector('#main .ptimer-row.pcred'); return {row: !!row, tm: row && !!row.querySelector('[data-ptimer]'), cred: row && !!row.querySelector('p.credit a'), task: /Is that a good thing/.test((document.querySelector('#main p.task') || {}).textContent || ''), frames: document.querySelectorAll('#main .alt-grid .alt-f').length, imgs: document.querySelectorAll('#main figure.pic img').length}; });
  expect('use it: ⏱ and the credit on one row, the reactions, six frames or the photo', out.pic.row && out.pic.tm && out.pic.cred && out.pic.task && (out.pic.frames === 6 || out.pic.imgs === 1), out.pic);
  if (out.pic.imgs === 1) { await p.click('#main figure.pic[data-zoom]'); await p.waitForTimeout(200); out.zoom = await p.evaluate(() => !!document.querySelector('.pic-zoom img')); await p.click('.pic-zoom'); await p.waitForTimeout(150);
    expect('a tap on the photo: the whole screen; a tap closes it', out.zoom && !(await p.evaluate(() => !!document.querySelector('.pic-zoom'))), out.zoom); }
  if (out.pic.imgs === 1) { await p.click('[data-ptimer]'); await p.waitForTimeout(1200);
    out.tz = await p.evaluate(() => { const z = document.querySelector('.pic-zoom[data-timed]'); return z ? {t: z.querySelector('[data-pzt]').textContent, h: Math.round(z.querySelector('img').getBoundingClientRect().height)} : null; });
    expect('⏱: the photos on the whole screen with the minute in the corner', out.tz && /0:5\d/.test(out.tz.t) && out.tz.h > 500, out.tz);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
    out.tz2 = await p.evaluate(() => ({open: !!document.querySelector('.pic-zoom'), at: bIdx()}));
    expect('an arrow closes the big picture and doesn\'t step on', !out.tz2.open && out.tz2.at === 0, out.tz2); }
  await go(3, 1); out.sc = [];
  for (let k = 0; k < 6; k++) { out.sc.push(await p.evaluate(() => ({cred: (document.querySelector('#main figure.scn figcaption p.credit') || {}).textContent || '', say: /Has it changed much/.test(document.querySelector('#main .scn-bubs') ? document.querySelector('#main .scn-bubs').innerText : '')})));
    const f = await fits(); expect(`scene ${k + 1} fits`, f.ok, f); await p.click('.stepbar [data-step]'); await p.waitForTimeout(250); await p.click('.stepbar [data-step]'); await p.waitForTimeout(250); }
  expect('six scenes, each with its credit and the question bubble', out.sc.every(x => x.cred.length > 3 && x.say), out.sc);
  await go(3, 2); out.end = await p.evaluate(() => { const f = document.querySelector('#main section.fast'); return {lines: f ? f.querySelectorAll('p').length : 0, t: f ? f.innerText : '', box: boxFor(curBlock()), bh: document.querySelectorAll('#side aside.box .bh').length}; });
  expect('then & now: box FL with first letters, ⚡ with its two lines only', out.end.box === 'FL' && out.end.bh > 20 && out.end.lines === 2 && !/hardly changed/.test(out.end.t), out.end);
  console.log(JSON.stringify(out).slice(0, 1200)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK C1 6.11 v2'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
