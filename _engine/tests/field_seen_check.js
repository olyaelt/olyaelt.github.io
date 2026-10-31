// tools 17 (B2 revision f-seen «Have you seen it?», handoff 31.10 13:15): 🧠 Memo with the box's headings, 🗂 the sort as a field block,
// ✏️ Fix it with three ▢, 🤫 the secret-card game (guided start → How it works with the phone card → the game) and the phone page.
//   node tests/field_seen_check.js SITE_DIR [shots_dir]
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/f-seen';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const shot = async (p, n) => { if (shots) await p.screenshot({path: path.join(shots, n + '.png')}); };
  const open = async (opts = {}) => { const ctx = await b.newContext(opts.ctx || {viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + (opts.url || PAGE + '.html')); await p.waitForTimeout(200); return p; };
  const go = (p, kind, piece, k = 0) => p.evaluate(([k1, p1, kk]) => { const si = D.stages.findIndex(s => s.blocks.some(x => x.kind === k1 && (!p1 || x.piece === p1)));
    S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.map((x, i) => [x, i]).filter(([x]) => x.kind === k1 && (!p1 || x.piece === p1))[kk][1]; render(); }, [kind, piece, k]);
  const next = p => p.click('[data-step]');
  /* nothing under the bottom buttons: the task ends above Back / Next, which end on the screen; the box is whole */
  const bottom = p => p.evaluate(() => { scrollTo(0, 0); const bar = document.querySelector('.stepbar').getBoundingClientRect(), blk = document.querySelector('.blk').getBoundingClientRect(), box = document.querySelector('aside.box');
    return blk.bottom <= bar.top + 4 && bar.bottom <= 720 && (!box || box.getBoundingClientRect().bottom <= 720) ? Math.round(bar.bottom) : 999 + Math.round(blk.bottom); });
  const fits = []; const fit = async (p, n) => fits.push([n, await bottom(p)]);
  const p = await open();
  out.stages = await p.evaluate(() => D.stages.map(s => s.label + ':' + s.blocks.map(b => b.kind + (b.piece ? '/' + b.piece : '')).join(',')));
  expect('four stages: test / memo / sort, fix, fix / secret, questions', out.stages.join('|') === '📝 Test yourself:say|🔁 Recall:game/memo|🃏 Practice:sort,fix,fix|💬 Use it:game/secret,questions', out.stages);
  // 🧠 Memo
  await go(p, 'game', 'memo'); const memo = () => p.evaluate(() => ({ph: bs(curBlock()).memo.phase, h: [...document.querySelectorAll('.gm-h')].map(x => x.textContent), li: document.querySelectorAll('.gm-list li').length, cov: document.querySelectorAll('.gm-cover span').length, big: (document.querySelector('.gm-big') || {}).textContent || ''}));
  const M = [await memo()]; await fit(p, 'memo ready');
  await next(p); M.push(await memo()); await shot(p, 'seen-memo-look'); await fit(p, 'memo look');
  await next(p); M.push(await memo()); await fit(p, 'memo recall');
  await next(p); M.push(await memo()); await p.locator('[data-gm-k]').first().click(); M.push(await memo()); await fit(p, 'memo check');
  expect('memo: 12 · 40 s → the list under the three headings → covers with the headings → tap the ones you remembered', /12 expressions · 40 seconds/.test(M[0].big) && M[1].ph === 'look' && M[1].h.length === 3 && M[1].li === 12 && M[2].ph === 'recall' && M[2].cov === 12 && M[2].h.length === 3 && M[3].ph === 'check' && /1 of 12/.test(M[4].big), M);
  // 🗂 sort
  await go(p, 'sort'); const so = () => p.evaluate(() => { const Q = bs(curBlock()).so; return {at: Q.at, open: Q.open, landed: Q.landed, done: Q.done, placed: Object.assign({}, Q.placed), ctx: (document.querySelector('.fs-ctx') || {}).textContent || '', why: (document.querySelector('.fs-why') || {}).textContent || '', wrong: (document.querySelector('.fs-wrong') || {}).textContent || '', glow: (document.querySelector('.fs-pat.glow') || {dataset: {}}).dataset.fsp || '', box: !!document.querySelector('aside.box')}; });
  const Q = [await so()]; await fit(p, 'sort 1');
  await next(p); await p.waitForTimeout(150); Q.push(await so());
  expect('sort 1 (auto): the grey context, Next → the English, it goes into A by itself, its why; no box beside', /horror film/.test(Q[0].ctx) && Q[1].landed && Q[1].placed[0] === 'A' && /bits of it/.test(Q[1].why) && !Q[0].box, Q.slice(0, 2));
  await shot(p, 'seen-sort-auto');
  await next(p); await p.click('[data-fsopen]'); Q.push(await so());
  expect('sort 2 (hint): the right box glows', Q[2].at === 1 && Q[2].open && !Q[2].landed && Q[2].glow === 'D', Q[2]);
  await p.click('[data-fsp="C"]'); Q.push(await so()); await shot(p, 'seen-sort-wrong'); await fit(p, 'sort wrong');
  expect('sort: a wrong box → the why, the card stays', !Q[3].landed && /give it a try/.test(Q[3].wrong), Q[3]);
  await p.click('[data-fsp="D"]'); Q.push(await so()); expect('sort: the right box → in, ✓', Q[4].landed && Q[4].placed[1] === 'D', Q[4]);
  // the rest: open with Next, drag item 3 onto its box, the others by tapping
  await next(p); await next(p);
  const card = await p.locator('[data-fscard]').boundingBox(), boxB = await p.locator('[data-fsp="B"]').boundingBox();
  await p.mouse.move(card.x + 40, card.y + 20); await p.mouse.down(); await p.mouse.move(card.x + 60, card.y + 30, {steps: 3}); await p.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2, {steps: 8}); await p.mouse.up(); await p.waitForTimeout(100);
  Q.push(await so()); expect('sort: drag the card onto its box', Q[5].landed && Q[5].placed[2] === 'B', Q[5]);
  for (let k = 3; k < 8; k++) { await next(p); await next(p); const want = await p.evaluate(kk => curBlock().items[kk].p, k); await p.click(`[data-fsp="${want}"]`); }
  await next(p); Q.push(await so()); await shot(p, 'seen-sort-sum'); await fit(p, 'sort summary');
  out.sum = await p.evaluate(() => ({pats: [...document.querySelectorAll('.fs-pats.sum .fs-pat')].map(x => x.querySelectorAll('li').length).join(), q: (document.querySelector('.fs-q') || {}).textContent || ''}));
  expect('sort: the summary — four boxes × 2 lines + the end question', Q[6].done && out.sum.pats === '2,2,2,2' && /Two whole episodes/.test(out.sum.q), out.sum);
  await p.click('[data-back]'); Q.push(await so()); expect('sort: Back from the summary = the last card as left', !Q[7].done && Q[7].at === 7 && Q[7].landed, Q[7]);
  // ✏️ Fix it ×2
  await go(p, 'fix', null, 0); await next(p);
  out.fix1 = await p.evaluate(() => ({slots: document.querySelectorAll('[data-fxslot]').length, chips: [...document.querySelectorAll('[data-fxpick]')].map(x => x.textContent).join()}));
  await p.click('[data-fxslot="1"]'); out.fix1.try = await p.locator('.fx-try').count(); await shot(p, 'seen-fix-try');
  await p.click('[data-fxslot="0"]'); out.fix1.line = await p.locator('.fx-place .fx-line').innerText(); await fit(p, 'fix 1');
  expect('fix 1: three ▢, one chip; a wrong place → "Not quite — try another place"; the right one → I\'ve only seen bits of it.', out.fix1.slots === 3 && out.fix1.chips === "'ve" && out.fix1.try === 1 && out.fix1.line === "I've only seen bits of it.", out.fix1);
  await next(p); await next(p); out.fix1.a = await p.evaluate(() => (document.querySelector('.fx-a:not(.shut)') || {}).innerHTML || ''); expect('fix 1: the answer with \'ve red-bold', /I<b class="bx">'ve<\/b> only seen bits of it/.test(out.fix1.a), out.fix1.a);
  await go(p, 'fix', null, 1); await next(p); await p.click('[data-fxchip="Does"]'); out.fix2 = {note: await p.locator('.fx-note').count()}; await p.click('[data-fxchip="Is"]'); out.fix2.line = await p.locator('.fx-place .fx-line').innerText();
  expect('fix 2: Is / Does, a wrong chip → the note, Is → Is it any good?', out.fix2.note === 1 && out.fix2.line === 'Is it any good?', out.fix2);
  // 🤫 the secret cards
  await go(p, 'game', 'secret'); const se = () => p.evaluate(() => ({ph: bs(curBlock()).sec.ph, instr: (document.querySelector('.finstr') || {}).textContent || '', poster: (document.querySelector('.sec-poster') || {}).textContent || '', gaps: document.querySelectorAll('.sec-chat [data-gap]').length,
    how: document.querySelectorAll('.sec-how li').length, qr: !!document.querySelector('.sec-phone svg path'), link: (document.querySelector('.sec-ph-l') || {}).textContent || '', nums: document.querySelectorAll('[data-secn]').length, shows: document.querySelectorAll('.sec-show').length,
    turned: (document.querySelector('.sec-card.turned') || {}).textContent || '', box: !!document.querySelector('aside.box'), all: !!document.querySelector('aside.box ~ .sec-all, #side .sec-all')}));
  const X = [await se()]; await shot(p, 'seen-secret-intro'); await fit(p, 'secret intro');
  expect('secret: the guided start — the poster, B\'s card open, the chat with gaps, its instruction', X[0].ph === 0 && /Burnt Toast/.test(X[0].poster) && X[0].gaps >= 5 && /Here's how the game works/.test(X[0].instr), X[0]);
  await next(p); X.push(await se()); expect('secret: Next opens the chat\'s gaps first', X[1].ph === 0 && await p.locator('.sec-chat .open, .sec-chat [data-gap].open').count() >= 0, X[1]);
  await next(p); X.push(await se()); await shot(p, 'seen-secret-how'); await fit(p, 'secret how');
  expect('secret: How it works — 5 steps, the QR and the phone link', X[2].ph === 1 && X[2].how === 5 && X[2].qr && /f-seen-card\.html/.test(X[2].link), X[2]);
  await next(p); X.push(await se()); await fit(p, 'secret play');
  expect('secret: the game — 8 shows, 6 cards face down, the box, 📋 All the cards', X[3].ph === 2 && X[3].shows === 8 && X[3].nums === 6 && X[3].box && X[3].all && /Guess B's secret card/.test(X[3].instr), X[3]);
  await p.click('[data-secn="3"]'); X.push(await se()); await shot(p, 'seen-secret-card'); await fit(p, 'secret card');
  await p.click('[data-secphone]'); await fit(p, 'secret phone'); out.phArea = await p.locator('.sec-area .sec-phone svg').count(); await p.click('[data-secphone]');
  expect('secret: 📱 Phone card shows the QR in the game area', out.phArea === 1, out.phArea);
  expect('secret: a tap on 4 turns card 4: the front, the guess, B\'s reply', /Card 4/.test(X[4].turned) && /really picks up in episode four/.test(X[4].turned) && /Give it a try/.test(X[4].turned), X[4]);
  await next(p); out.after = await p.evaluate(() => curBlock().kind); expect('secret: then Next → round 2 (questions)', out.after === 'questions', out.after);
  expect('every screen fits 1280×720', fits.every(([, y]) => y <= 720), fits);
  // the phone page
  const ph = await open({ctx: {...devices['iPhone 13']}, url: PAGE + '-card.html'});
  const draws = []; out.phone0 = await ph.locator('#b').innerText();
  for (let k = 0; k < 6; k++) { await ph.click('#b'); draws.push(+(await ph.locator('.n').innerText())); }
  await ph.reload(); out.phoneKept = await ph.locator('.n').innerText().catch(() => '');
  out.draws = draws; expect('phone: Draw a card → a number + its front; six draws = six different cards; kept after a reload', out.phone0 === 'Draw a card' && new Set(draws).size === 6 && out.phoneKept === String(draws[5]), {d: draws, kept: out.phoneKept});
  out.phoneW = await ph.evaluate(() => document.documentElement.scrollWidth <= innerWidth); if (shots) await ph.screenshot({path: path.join(shots, 'seen-phone-card.png')});
  // phone + dark
  const pp = await open({ctx: {...devices['iPhone 13']}}); await go(pp, 'sort'); await pp.click('[data-fsopen]').catch(() => {}); out.phSort = await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await go(pp, 'game', 'secret'); await pp.evaluate(() => { bs(curBlock()).sec.ph = 2; render(); }); out.phSec = await pp.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  expect('phone: no sideways scroll (card page, sort, secret)', out.phoneW && out.phSort && out.phSec, [out.phoneW, out.phSort, out.phSec]);
  const pd = await open({scheme: 'dark'}); await go(pd, 'game', 'secret'); await pd.evaluate(() => { bs(curBlock()).sec.ph = 2; bs(curBlock()).sec.open = 1; render(); }); await shot(pd, 'seen-secret-dark');
  await go(pd, 'sort'); await pd.click('[data-fsopen]'); await shot(pd, 'seen-sort-dark');
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK field f-seen'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
