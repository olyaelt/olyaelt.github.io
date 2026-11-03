// engine 61 also (her 2.11 18:30: «мы пишем Finish, и когда нажимаешь на Finish, дальше проходится ещё раз по bookmarked questions… Finish
// немножко сбивает с толку»): when the task's bookmarks come next, the last button says "Next: 🔖 your bookmarks" (Finish and send → Send
// and go on); a bookmark set or taken off on that screen changes it at once; "How was this task?" is not on that screen but on the last
// bookmark, above Finish, where the task really ends. No bookmarks → Finish, as before. Step tasks, the old gaps texts, Over to you.
//   node tests/bm_finish_check.js SITE_DIR
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', BM = 'Next: your bookmarks';
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', 'B2']]);
  const b = await chromium.launch();
  const open = async page => {
    const src = fs.readFileSync(path.join(site, page), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    const tmp = path.join(os.tmpdir(), 'bm_finish_' + path.basename(page)); fs.writeFileSync(tmp, src);
    const ctx = await b.newContext(devices['iPhone 13']);
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto('file://' + tmp); await p.waitForTimeout(250); await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(500); return p; };
  const state = p => p.evaluate(() => { const g = document.querySelector('.actions #go') || document.querySelector('.actions #fin');
    return {btn: g ? g.textContent.replace(/\s+/g, ' ').trim() : '', icon: !!(g && g.querySelector('.bm-ic svg')), react: !!document.querySelector('.actions #react'), count: (document.querySelector('.count, .taskbar .n') || {}).textContent || '',
      once: !!(current && current._once) || !!document.querySelector('.panel.once'), home: !!document.querySelector('.lesson-head')}; });
  const clickBm = p => p.evaluate(() => { const r = [...document.querySelectorAll('.stage .rev:not(.demo)')][0]; r.click(); });

  // 1. a step task (dlg, dlg): the last screen
  let p = await open('b2/2026-10-30.html');
  await p.click('[data-open="arc-1"]'); await p.waitForTimeout(150);
  await p.click('#go'); await p.waitForTimeout(80); await p.click('#go'); await p.waitForTimeout(80);   // step 1 checked → Next → step 2
  await p.click('#go'); await p.waitForTimeout(120);   // step 2 checked
  out.noBm = await state(p);
  expect('no bookmarks: the last button is Finish, "How was this task?" above it', out.noBm.btn === 'Finish' && out.noBm.react, out.noBm);
  await clickBm(p); await p.waitForTimeout(80); out.bmOn = await state(p);
  expect('a bookmark on the last screen → "Next: 🔖 your bookmarks" at once, no "How was this task?" yet', out.bmOn.btn === BM && out.bmOn.icon && !out.bmOn.react, out.bmOn);
  await clickBm(p); await p.waitForTimeout(80); out.bmOff = await state(p);
  expect('the bookmark taken off → Finish again (and the row)', out.bmOff.btn === 'Finish' && out.bmOff.react, out.bmOff);
  await clickBm(p); await p.waitForTimeout(80);
  await p.click('#go'); await p.waitForTimeout(200); out.pass0 = await state(p);
  expect('Next: 🔖 your bookmarks → the bookmarks pass, its screen to do again', out.pass0.once && /Once more: your bookmarks/.test(out.pass0.count) && out.pass0.btn !== 'Finish', out.pass0);
  await p.click('#go'); await p.waitForTimeout(150); out.pass = await state(p);
  expect('the bookmarks pass: its one screen ends with Finish and "How was this task?"', out.pass.once && out.pass.btn === 'Finish' && out.pass.react, out.pass);
  await p.click('#go'); await p.waitForTimeout(250); out.end = await state(p);
  expect('Finish on the last bookmark → the list, the task ticked', out.end.home && await p.evaluate(() => taskDone('arc-1')), out.end);
  // a finished task reopened (✓ Done bar): its last screen says Finish, the bookmarks are a button in the bar
  await p.evaluate(() => openTask('arc-1')); await p.waitForTimeout(200); out.review = await state(p);
  expect('a finished task reopened: Finish on its last screen (bookmarks again = the bar)', out.review.btn === 'Finish', out.review);
  await p.context().close();

  // 2. Over to you after a text with a bookmark: Finish and send → Send and go on
  p = await open('b2/2026-10-30.html');
  await p.evaluate(() => { const t = TASKS.find(x => x.id === 'write'); ls.set(revKey('write', 0), '[0]'); openTask('write'); });
  await p.waitForTimeout(150);
  await p.evaluate(() => { stepIdx = current.steps.length - 1; checked = false; renderTask(); }); await p.waitForTimeout(150);
  await p.click('.seg-btn[data-mode="write"]').catch(() => {}); await p.fill('#txt', 'A test text.').catch(() => {}); await p.waitForTimeout(80);
  out.prod = await state(p);
  expect('Over to you with bookmarks after it: "Send and go on" (not Finish and send)', out.prod.btn === 'Send and go on' && !out.prod.react, out.prod);
  await p.evaluate(() => { ls.set(revKey('write', 0), '[]'); }); await p.evaluate(() => reactPre()); out.prod0 = await state(p);
  expect('no bookmarks: Finish and send, as before', out.prod0.btn === 'Finish and send', out.prod0);
  await p.context().close();

  // 3. an old gaps text (kind "gaps"): #fin
  p = await open('b2/2026-10-23.html');
  await p.click('[data-open="clocks-text"]'); await p.waitForTimeout(150);
  out.g0 = await state(p);
  expect('a gaps text, no bookmarks: Finish', out.g0.btn === 'Finish' && out.g0.react, out.g0);
  await clickBm(p); await p.waitForTimeout(80); out.g1 = await state(p);
  expect('a gaps text with a bookmark: "Next: 🔖 your bookmarks"', out.g1.btn === BM && !out.g1.react, out.g1);
  await p.click('#fin'); await p.waitForTimeout(200); out.g2 = await state(p);
  expect('its bookmarks pass ends with Finish and "How was this task?"', out.g2.once && out.g2.btn === 'Finish' && out.g2.react, out.g2);
  await p.click('#fin'); await p.waitForTimeout(200); out.g3 = await state(p);
  expect('Finish → the list', out.g3.home, out.g3);
  await p.context().close();

  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK bookmarks next, then Finish'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
