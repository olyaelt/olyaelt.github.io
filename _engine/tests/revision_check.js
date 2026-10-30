// The B2 revision (tools 13, handoff 30.10 03:45): the Jeopardy board (revision-board) and a field page (revision-field), live.
// Board: her ▶ Play on a cell (her wish 09:04: one button) lights it up on the groups' boards with a strip and opens its page for her;
// the next ▶ Play greys the one before; ↺ Not played; 🧹 Start fresh. Field: stages both ways, ⬅ Board; on -live the groups'
// texts, cards, ✓/≈/✗, 🔖, box ticks and where they are go to her table; her 📥 Groups: "Group 1 — Anna · 📝 Test yourself · 0 min",
// rooms opened/closed, her roster (tap a name, kept as a move), ⏩ move on (the group may say Not yet), 📢 to all rooms;
// her deck dots; ⚡ fast finishers; the plain pages send nothing.
//   node tests/revision_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', L = 'tools/b2-2026-10-30/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'B2', '']); env.sheets.Students.appendRow(['def456', 'Boris', 'B2', '']); env.sheets.Students.appendRow(['ghi789', 'Mila', 'B2', '']);
  let plainPosts = 0;
  const b = await chromium.launch();
  const open = async (rel, who, opts = {}) => {
    const c = await b.newContext(Object.assign({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'}, opts));
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    if (who === 'anna') await c.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-role', ''); });
    await c.route(/script\.google\.com/, r => { if (!/-live/.test(rel)) plainPosts++;
      return r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(path.dirname(path.join(site, rel)), '_rv_test_' + path.basename(rel)); fs.writeFileSync(tmp, src);
    await p.goto('file://' + tmp); await p.waitForTimeout(400); fs.unlinkSync(tmp); if(!opts.cloud) await cloudOff(p); return p;
  };
  const cloudOff = p => p.evaluate(() => { if(typeof S !== 'undefined' && S && S.intro){ S.intro = false; render(); } }).catch(() => {});
  const bubble = async (p, n) => { await p.click(`.stage-btn[data-stage="${n}"]`); await cloudOff(p); };
  const sheet = n => (env.sheets[n] ? env.sheets[n].d.slice(1) : []);

  // ---- the board: her ▶ Play reaches the groups' boards
  let OB = await open(L + 'jeopardy-live.html', 'teacher'); const GB = await open(L + 'jeopardy-live.html', '');
  out.boardLinks = await GB.evaluate(() => [...document.querySelectorAll('a.cell')].map(a => a.getAttribute('href')));
  expect('board: the four fields link to their -live pages', out.boardLinks.length === 4 && out.boardLinks.every(h => /^f-[a-z]+-live\.html$/.test(h)), out.boardLinks);
  out.today = await OB.locator('.cell.today').count(); expect('her board marks today\'s fields orange', out.today === 4, out.today);
  // her 13:24 (as on her slides): one click on a cell = ▶ Play — it lights up in every room and its page opens
  out.noActs = await OB.locator('[data-play], [data-cellwrap], [data-unplay]').count(); expect('no buttons on new cells, no Play / Now / Done bar', out.noActs === 0 && await OB.locator('[data-now], [data-done], .cellbar').count() === 0, out.noActs);
  await Promise.all([OB.waitForURL(/\/f-late-live\.html$/), OB.click('[data-cell="c5v100"]')]);
  out.opened = OB.url().split('/').pop(); expect('▶ Play opens the cell\'s page for her', out.opened === 'f-late-live.html', out.opened);
  await OB.close(); OB = await open(L + 'jeopardy-live.html', 'teacher');
  await GB.evaluate(() => boardPoll()); await GB.waitForTimeout(200);
  out.now = {strip: await GB.locator('.nowstrip').innerText().catch(() => ''), cell: await GB.locator('.cell.now').count(), href: await GB.locator('.nowstrip').getAttribute('href').catch(() => '')};
  expect('▶ Play: the groups\' board pulses that cell, strip with Open →', /Now playing: Everyday English · \$100/.test(out.now.strip) && out.now.cell === 1 && out.now.href === 'f-late-live.html', out.now);
  if (shots) await GB.screenshot({path: path.join(shots, 'rv-board-group.png')});

  // ---- the field: two groups on f-late-live
  const A = await open(L + 'f-late-live.html', 'anna'), B = await open(L + 'f-late-live.html', '');
  await A.waitForTimeout(300);
  out.where1 = sheet('Lesson rooms').map(r => [r[3], r[4]]);
  expect('each screen says where it is (Anna by her code)', out.where1.length === 2 && out.where1.some(r => r[0] === 'Anna' && r[1] === '📝 Test yourself'), out.where1);
  out.board = await A.locator('.board-top').getAttribute('href'); expect('⬅ Board on the page', out.board === 'jeopardy-live.html', out.board);
  await A.fill('[data-wta="0"]', 'Sorry guys, I stuck in traffic, I be 15 minutes late'); await A.waitForTimeout(3000);
  out.draft = sheet('Lesson work').map(r => [r[2], r[4], r[6], r[7]]); expect('their message goes to her table while they type', out.draft.length === 1 && out.draft[0][1] === 'Anna' && /stuck in traffic/.test(out.draft[0][2]), out.draft);
  await bubble(B, 1); await B.waitForTimeout(300);
  // her 📥 Groups
  const O = await open(L + 'f-late-live.html', 'teacher');
  out.teacherWhere = sheet('Lesson rooms').length; expect('her own screen never counts as a room', out.teacherWhere === 2, out.teacherWhere);
  await O.click('.stage-btn[data-stage="groups"]'); await O.waitForTimeout(500);
  out.cards = await O.evaluate(() => [...document.querySelectorAll('.gw-card')].map(c => c.querySelector('[data-who]').innerText.replace(/\s+/g, ' ')));
  expect('her cards: Group 1 — Anna · 📝 Test yourself · 0 min, Group 2 · 🔁 Recall', out.cards.length === 2 && /Group 1 — Anna/.test(out.cards[0]) && /📝 Test yourself · \d+ min/.test(out.cards[0]) && /Group 2/.test(out.cards[1]) && /Recall/.test(out.cards[1]), out.cards);
  out.rooms = await O.locator('#gw-rooms').innerText(); expect('Rooms opened … · 2 of 2 screens here', /Rooms opened \d\d:\d\d/.test(out.rooms) && /2 of 2 screens here/.test(out.rooms), out.rooms);
  out.text = await O.locator('.gw-card').first().locator('[data-text]').innerText(); expect('Anna\'s draft on her card', /I stuck in traffic/.test(out.text), out.text);
  // her roster: Boris and Mila sit at screen 2; then Mila moves to screen 1
  await O.locator('.gw-card').nth(1).locator('[data-roster]').click(); await O.waitForTimeout(150);
  out.names = await O.locator('.gw-card').nth(1).locator('[data-rn]').allInnerTexts(); expect('her B2 list in the fold', ['Anna', 'Boris', 'Mila'].every(n => out.names.some(t => t.startsWith(n))), out.names);
  await O.locator('.gw-card').nth(1).locator('[data-rn="Boris"]').click(); await O.waitForTimeout(250);
  await O.locator('.gw-card').nth(1).locator('[data-rn="Mila"]').click(); await O.waitForTimeout(250);
  await O.locator('.gw-card').nth(1).locator('[data-roster]').click(); await O.waitForTimeout(100);
  await O.locator('.gw-card').nth(0).locator('[data-roster]').click(); await O.waitForTimeout(150);
  await O.locator('.gw-card').nth(0).locator('[data-rn="Mila"]').click(); await O.waitForTimeout(300);
  out.labels = await O.locator('.gw-card .nm').allInnerTexts();
  const moves = sheet('Lesson rooms').map(r => r[8]).join(' ');
  expect('roster: Group 1 — Anna + Mila, Group 2 — Boris; the move kept', out.labels[0] === 'Group 1 — Anna + Mila' && out.labels[1] === 'Group 2 — Boris' && /Mila: Group 2 → Group 1/.test(moves), {labels: out.labels, moves});
  // ⏩ move on: Not yet, then Go
  await O.locator('.gw-card').nth(0).locator('[data-go]').selectOption({label: '🃏 Practice'}); await O.waitForTimeout(300);
  await A.evaluate(() => notesPoll()); await A.waitForTimeout(250);
  out.strip = await A.locator('.lw-strip').innerText().catch(() => ''); expect('the group gets "Olya suggests: move on to 🃏 Practice" with Go / Not yet', /move on to 🃏 Practice/.test(out.strip) && /Not yet/.test(out.strip), out.strip);
  if (shots) await A.screenshot({path: path.join(shots, 'rv-strip.png')});
  await A.click('[data-strip-later]'); await A.waitForTimeout(250);
  await O.evaluate(() => gwFetch()); await O.waitForTimeout(300);
  out.nudge = await O.locator('.gw-card').nth(0).locator('[data-nudge]').innerText(); expect('her card: ⏸ not yet', /not yet/.test(out.nudge), out.nudge);
  out.stillThere = await A.evaluate(() => S.stage); expect('Not yet: they stay', out.stillThere === 0, out.stillThere);
  await O.locator('.gw-card').nth(0).locator('[data-go]').selectOption({label: '🃏 Practice'}); await O.waitForTimeout(300);
  await A.evaluate(() => notesPoll()); await A.waitForTimeout(250); await A.click('[data-strip-go]'); await A.waitForTimeout(400);
  out.went = await A.evaluate(() => D.stages[S.stage].label); expect('Go → they are on 🃏 Practice', out.went === '🃏 Practice', out.went);
  // 📢 to all rooms
  await O.click('[data-say-all]'); await O.click('[data-say-quick="⏰ 2 minutes left!"]'); await O.waitForTimeout(400);
  await B.evaluate(() => notesPoll()); await B.waitForTimeout(250);
  out.say = await B.locator('.lw-strip').innerText().catch(() => ''); expect('📢 reaches the rooms with OK', /2 minutes left/.test(out.say) && /OK/.test(out.say), out.say);
  // cards: Anna's screen sends a kwt card back; her dots on that deck
  out.goCloud = await A.evaluate(() => S.intro); expect('her ⏩ Go lands on the stage\'s cloud (her 13:41)', out.goCloud === true, out.goCloud); await cloudOff(A);
  await A.click('[data-flip]'); await A.click('[data-again]'); await A.waitForTimeout(2600);
  out.deck = sheet('Lesson decks').map(r => r[4]); expect('Again goes to her table', out.deck.length === 1 && Object.values(JSON.parse(out.deck[0])).join() === '1', out.deck);
  await bubble(O, 2); await O.waitForTimeout(200); await O.evaluate(() => gwFetch()); await O.waitForTimeout(300);
  out.dots = await O.locator('[data-gdots] .gd-again').count(); expect('her dots: one orange card', out.dots === 1, out.dots);
  // 🔖 on a gap, ✓/≈/✗, a box phrase
  await bubble(B, 1); await B.locator('[data-gap]').first().click(); await B.waitForTimeout(100); await B.locator('[data-bm]').first().click(); await B.waitForTimeout(300);
  await bubble(A, 2); await A.waitForTimeout(100); await A.evaluate(() => { const b = curBlock(), d = deckOf(b), k = d.queue.findIndex(i => b.cards[i]._b.box); d.queue.unshift(d.queue.splice(k, 1)[0]); render(); });   /* one deck per stage (her 12:17): bring an 'ours' card (with the box) to the top */ await A.waitForTimeout(150);
  await A.locator('aside.box [data-ph]').first().click(); await A.waitForTimeout(300);
  const T2 = await open(L + 'f-tags-live.html', 'anna'); await T2.click('[data-sayshow]'); await T2.click('[data-check="close"]'); await T2.waitForTimeout(300);
  out.signals = sheet('Lesson signals').map(r => [r[1].split('/')[1], r[3], r[5]]);
  expect('signals kept: 🔖 gap, box phrase, ≈ close', out.signals.some(r => r[1] === 'gap' && r[2] === '1') && out.signals.some(r => r[1] === 'box' && r[2] === '1') && out.signals.some(r => r[0] === 'f-tags' && r[1] === 'check' && r[2] === 'close'), out.signals);
  // ⚡ fast finishers: the last block of f-tags, with the hard card from this screen
  await bubble(T2, 2); await T2.click('[data-flip]'); await T2.click('[data-again]'); await T2.waitForTimeout(100);
  await bubble(T2, 3); await T2.evaluate(() => { S.at[3] = D.stages[3].blocks.length - 1; render(); let g = 0; while (document.querySelector('.speak [data-speak-next]') && g++ < 20) document.querySelector('.speak [data-speak-next]').click(); }); await T2.waitForTimeout(150);   /* ⚡ only on the last question (her 15:17) */
  out.fast = await T2.locator('.fast').innerText().catch(() => ''); expect('⚡ If you\'re done: the fast line, the hard card, the text without first letters', /If you're done/.test(out.fast) && /Linden Street/.test(out.fast) && /1 hard card/.test(out.fast) && /no first letters/.test(out.fast), out.fast);
  await T2.click('[data-fast-text]'); await T2.waitForTimeout(150);
  out.noFirst = await T2.evaluate(() => ({stage: D.stages[S.stage].label, f: document.querySelectorAll('.dlg .gp .f').length})); expect('the text again: no first letters', /Recall/.test(out.noFirst.stage) && out.noFirst.f === 0, out.noFirst);
  // the board closes the rooms: she plays the next cell (one from the slides, no page: her board stays)
  await OB.click('[data-cell="c0v100"]'); await OB.waitForTimeout(600);
  out.next = {url: OB.url().split('/').pop(), now: await OB.locator('.cell.now').getAttribute('data-cell'), done: await OB.locator('.cell.done').evaluateAll(xs => xs.map(x => x.dataset.cell)), msg: await OB.locator('#live-status').innerText()};
  expect('the next ▶ Play: no page → her board stays, that cell pulses, the one before turns grey by itself', /_rv_test_jeopardy-live/.test(out.next.url) && out.next.now === 'c0v100' && JSON.stringify(out.next.done) === '["c5v100"]' && /lit up/.test(out.next.msg), out.next);
  await O.click('.stage-btn[data-stage="groups"]'); await O.evaluate(() => gwFetch()); await O.waitForTimeout(400);
  out.closed = await O.locator('#gw-rooms').isVisible(); expect('the next ▶ Play on the board closes the rooms: the strip goes (her wish 07:46)', !out.closed, out.closed);
  await O.locator('#gw-history summary').click(); out.hist = await O.locator('#gw-history').innerText();
  expect('📸 Who worked where at the bottom keeps the times', /Who worked where/.test(out.hist) && /\d\d:\d\d–\d\d:\d\d/.test(out.hist), out.hist);
  await GB.evaluate(() => boardPoll()); await GB.waitForTimeout(150); out.done = await GB.locator('.cell.done').count(); expect('Done greys the cell for the groups', out.done === 1, out.done);
  if (shots) await O.screenshot({path: path.join(shots, 'rv-groups.png')});
  // a wrong tap: ↺ Not played on the pulsing cell and on a grey one; then 🧹 Start fresh on the board (two steps)
  await OB.click('[data-unplay="c0v100"]'); await OB.waitForTimeout(300);
  out.unplay = {now: await OB.locator('.cell.now').count(), strip: await OB.locator('.nowstrip').count()}; expect('↺ Not played on the pulsing cell: nothing pulses, no strip', out.unplay.now === 0 && out.unplay.strip === 0, out.unplay);
  out.greyActs = await OB.locator('[data-unplay="c5v100"]').count(); expect('a grey cell has its small ↺', out.greyActs === 1, out.greyActs);
  await Promise.all([OB.waitForURL(/\/f-crime-live\.html$/), OB.click('[data-cell="c1v100"]')]); await OB.close(); OB = await open(L + 'jeopardy-live.html', 'teacher');
  out.before = await OB.locator('.cell.done, .cell.now').count();
  await OB.click('[data-fresh]'); out.sure = await OB.locator('.boardfoot').innerText(); await OB.click('[data-fresh-yes]'); await OB.waitForTimeout(300);
  out.fresh0 = {before: out.before, sure: out.sure, after: await OB.locator('.cell.done, .cell.now').count()}; expect('🧹 Start fresh asks once more, then every cell is new', out.fresh0.before === 2 && /Yes, start fresh/.test(out.fresh0.sure) && out.fresh0.after === 0, out.fresh0);
  if (shots) await OB.screenshot({path: path.join(shots, 'rv-board-her.png')});
  // 🧹 Start fresh after her test: no cards, no rooms strip (the table keeps everything)
  await O.click('[data-gw-fresh]'); await O.click('[data-gw-fresh]'); await O.waitForTimeout(200);
  out.fresh = {cards: await O.locator('.gw-card').count(), rooms: await O.locator('#gw-rooms').isVisible()}; expect('Start fresh hides her test screens and the rooms strip', out.fresh.cards === 0 && !out.fresh.rooms, out.fresh);
  // the plain pages send nothing
  const P1 = await open(L + 'f-late.html', 'anna'); await P1.fill('[data-wta="0"]', 'Sorry!'); await P1.waitForTimeout(3000); await P1.click('[data-wsend="0"]');
  const P2 = await open(L + 'jeopardy.html', 'teacher'); out.plain = {posts: plainPosts, share: await P1.locator('.share-note').innerText(), cellBtns: await P2.locator('[data-cell]').count()};
  expect('plain pages: nothing sent, no live buttons', out.plain.posts === 0 && /only on this device/.test(out.plain.share) && out.plain.cellBtns === 0, out.plain);
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK revision'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
