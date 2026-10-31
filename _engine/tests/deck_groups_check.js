// The groups' decks (30.10, her wish): on a cards page (-live) each group's ↺ Again / ✓ Got it per card goes to her table (sheet Lesson decks);
// the counts are never reset (a page is made for one group: a snapshot to come back to next lesson);
// her screen shows a row of dots in card order: grey = nobody answered yet, green = got it and nobody sent it back, orange = sent back,
// bigger the more often; tap → the card with "Back into the deck 3× · 2 groups"; the plain page sends nothing.
//   node tests/deck_groups_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', PAGE = 'tools/c1-schools/cards-1', TOOL = 'c1-schools/cards-1';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'C1', '']);
  let plainPosts = 0;
  const b = await chromium.launch();
  const open = async (rel, who) => {
    const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
    await c.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    if (who === 'anna') await c.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-role', ''); });
    await c.route(/script\.google\.com/, r => { if (!/-live/.test(rel)) plainPosts++;
      return r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(path.dirname(path.join(site, rel)), '_dg_test_' + path.basename(rel)); fs.writeFileSync(tmp, src);
    await p.goto('file://' + tmp); await p.waitForTimeout(300); fs.unlinkSync(tmp); return p;
  };
  // answer the card on top: flip, then Again (false) or Got it (true); returns the card number
  const ans = async (p, ok) => { const i = await p.evaluate(() => +S.queue[0].slice(1)); await p.evaluate(k => { flip(); answer(k); }, ok); await p.waitForTimeout(80); return i; };
  const rows = () => (env.sheets['Lesson decks'] ? env.sheets['Lesson decks'].d.slice(1) : []);

  const A = await open(PAGE + '-live.html', 'anna'), B = await open(PAGE + '-live.html', '');
  out.groupNoDots = await A.locator('#gdots').count(); expect('groups see no group dots', out.groupNoDots === 0, out.groupNoDots);
  const x = await ans(A, false);                                   // A sends card x back…
  const y = await ans(A, true);                                    // …gets card y
  await A.evaluate(k => { while (S.queue[0] !== 'o' + k) { flip(); answer(true); } flip(); answer(false); }, x);   // …and x comes round again: back again
  await B.evaluate(k => { while (S.queue[0] !== 'o' + k) { flip(); answer(true); } flip(); answer(false); }, x);   // B: everything before x got, x back
  const bGot = await B.evaluate(() => [...S.got].map(id => +id.slice(1)));
  await A.waitForTimeout(2600);
  out.rows = rows().map(r => [r[3], r[4], r[5]]);
  expect('each group has one row: Anna by name, x back twice; B anonymous, x back once', out.rows.length === 2 && out.rows.some(r => r[0] === 'Anna' && JSON.parse(r[1])[x] === 2 && JSON.parse(r[2]).includes(y)) && out.rows.some(r => r[0] === '' && JSON.parse(r[1])[x] === 1), out.rows);

  const O = await open(PAGE + '-live.html', 'teacher'); await O.waitForTimeout(500);
  out.dots = await O.evaluate(() => [...document.querySelectorAll('#gdots [data-gd]')].map(b => ({id: b.dataset.gd, cls: b.className, w: Math.round(b.getBoundingClientRect().width)})));
  const dx = out.dots.find(d => d.id === 'o' + x), dy = out.dots.find(d => d.id === 'o' + y), base = out.dots.find(d => !/gd-again|gd-ok/.test(d.cls));
  expect('her row: one dot per card', out.dots.length === (await O.evaluate(() => D.cards.length)), out.dots.length);
  expect('x orange and big (3× back), y green, a card nobody answered grey and small', dx && /gd-again/.test(dx.cls) && dy && /gd-ok/.test(dy.cls) && (!base || dx.w > base.w * 1.6), {dx, dy, base});
  const notBack = bGot.filter(i => i !== x && i !== y)[0];
  if (notBack != null) { const d = out.dots.find(d => d.id === 'o' + notBack); expect('a card B got, nobody sent back: green', d && /gd-ok/.test(d.cls), d); }
  await O.click(`#gdots [data-gd="o${x}"]`); await O.waitForTimeout(200);
  out.look = {lbl: await O.locator('.card.lookback .lbl').innerText(), front: await O.locator('.card.lookback .say').first().innerText()};
  const front = await O.evaluate(k => D.cards[k][0].replace(/\(\(|\)\)/g, ''), x);
  expect('tap → that card with "back into the deck 3× · 2 screens"', /3×/.test(out.look.lbl) && /2 screens/i.test(out.look.lbl) && out.look.front.replace(/\s+/g, ' ').includes(front.replace(/\s+/g, ' ').slice(0, 20)), {look: out.look, front});
  // engine 49 (her catch 31.10): her dot opens the card on its FRONT (the group does it again); a tap on the card shows the answer
  out.lookShut = {open: await O.locator('.card.lookback.open').count(), ans: await O.locator('.card.lookback .ans').count()};
  await O.click('.card.lookback[data-lookflip]'); await O.waitForTimeout(150);
  out.lookOpen = {open: await O.locator('.card.lookback.open').count(), ans: await O.locator('.card.lookback .ans').count()};
  expect('her dot: the front first (no answer), a tap shows the answer', out.lookShut.open === 0 && out.lookShut.ans === 0 && out.lookOpen.open === 1 && out.lookOpen.ans === 1, [out.lookShut, out.lookOpen]);
  if (shots) await O.screenshot({path: path.join(shots, 'deck-groups.png')});
  // 📋 Copy the hard cards: most often first, front → answer
  await O.click('[data-gd-copy]'); await O.waitForTimeout(200); out.copy = await O.evaluate(() => navigator.clipboard.readText());
  const back = await O.evaluate(k => D.cards[k][1], x);
  expect('Copy the hard cards: x first, 3×, with its answer', out.copy.split('\n')[1].startsWith('3× (on 2 screens)') && out.copy.split('\n')[1].includes(back) && /never sent back/.test(out.copy), out.copy);
  // new counts come in: only the row changes, the card she shows stays
  await B.evaluate(k => { flip(); answer(false); }, 0); await B.waitForTimeout(2600);
  await O.evaluate(() => gdFetch()); await O.waitForTimeout(250);
  out.stillLooking = await O.locator('.card.lookback').count(); expect('a refresh keeps the card she shows', out.stillLooking === 1, out.stillLooking);
  // Start fresh hides the counts (the table keeps them), "Show older" brings them back
  await O.click('[data-gd-fresh]'); await O.click('[data-gd-fresh]'); await O.waitForTimeout(150);
  out.fresh = await O.locator('#gdots .gd-again, #gdots .gd-ok').count(); expect('Start fresh: all grey', out.fresh === 0, out.fresh);
  await O.click('[data-gd-all]'); await O.waitForTimeout(150); out.back = await O.locator('#gdots .gd-again').count(); expect('Show older: back', out.back >= 1, out.back);

  // next lesson, the same laptop: the counts go on from where they were
  { const src = fs.readFileSync(path.join(site, PAGE + '-live.html'), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(site, 'tools/c1-schools/_dg_test_again.html'); fs.writeFileSync(tmp, src); await A.goto('file://' + tmp); await A.waitForTimeout(300); fs.unlinkSync(tmp); } await A.evaluate(k => { while (S.queue[0] !== 'o' + k) { flip(); answer(true); } flip(); answer(false); }, x); await A.waitForTimeout(2600);
  out.kept = JSON.parse(rows().find(r => r[3] === 'Anna')[4])[x]; expect('counts kept on reload (3 now)', out.kept === 3, out.kept);
  const Pl = await open(PAGE + '.html', 'anna'); await ans(Pl, false); await Pl.waitForTimeout(2600);
  out.plain = {posts: plainPosts, dots: await Pl.locator('#gdots').count()}; expect('plain page: nothing sent, no dots', out.plain.posts === 0 && out.plain.dots === 0, out.plain);

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK deck groups'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
