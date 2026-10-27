// A student sees new feedback: red box on the group list and on top of the homework page; "✓ I've read it" clears it.
//   node tests/fb_check.js SITE_DIR/b2/2026-10-09.html [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = path.resolve(process.argv[2]), shots = process.argv[3];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-'));
  for (const f of [path.basename(src), 'index.html']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(path.dirname(src), f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  const G = /\/c1\//.test(src) ? 'C1' : 'B2';
  S.getRange(3, 1, 2, 3).setValues([['s1', 'Anna', G], ['s2', 'Boris', G]]);
  const b = await chromium.launch(); const errs = []; const out = {};
  const ctx = await b.newContext({...devices['iPhone 13'], colorScheme: process.env.DARK ? 'dark' : 'light'});
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, path.basename(src))); await p.waitForTimeout(200);
  const meta = await p.evaluate(() => ({ key: PAGE_KEY, write: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'produce')) || {}).id,
    rw: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'rewrite')) || {}).id }));
  const P = o => env.post(JSON.stringify(Object.assign({page: meta.key}, o)));
  const t1 = P({code: 's1', action: 'submit', task: meta.write, type: 'text', text: 'A: Hi! How was Spain?\nB: I have went there last week.'});
  const t2 = P({code: 's1', action: 'submit', task: meta.rw, type: 'question', text: 'Can I say "the clocks change"?'});
  P({code: tc, action: 'feedback', id: t1.id, text: '[[Great start, Anna! Your reactions sound natural.]]\nA: **Hi!** How was Spain?\nB: I ~~have went~~ {went} there last week. [[last week => past simple]]\n\n[[Next time: tell us one thing you did there, with a time word.]]'});
  P({code: tc, action: 'feedback', id: t2.id, text: 'Yes, that works too!'});
  // the group list
  await p.goto('file://' + path.join(dir, 'index.html')); await p.waitForTimeout(200);
  await p.fill('#code', 's1'); await p.click('#code-go'); await p.waitForTimeout(600);
  out.listAlert = (await p.locator('.fb-alert').innerText().catch(() => 'no alert')).replace(/\s+/g, ' ');
  out.listCard = await p.locator('.hw.fbnew .fb').allInnerTexts();
  if (shots) await p.screenshot({path: path.join(shots, 'student_list.png')});
  // the homework page
  await p.locator('.fb-alert a').first().click(); await p.waitForTimeout(600);
  out.box = (await p.locator('.hot.fbnew').innerText().catch(() => 'no box')).replace(/\s+/g, ' ');
  if (shots) await p.screenshot({path: path.join(shots, 'student_home.png')});
  await p.locator(`.hot.fbnew [data-fb="${meta.write}"]`).click(); await p.waitForTimeout(200);
  out.readButtons = await p.locator('[data-read]').count();
  out.boxes = await p.locator('.fb-overall .fb-overall-h').allInnerTexts();
  if (shots) await p.screenshot({path: path.join(shots, 'student_feedback.png'), fullPage: true});
  out.seenBefore = env.sheets.Work.d.slice(1).map(r => r[10]);
  await p.locator('[data-read]').first().click(); await p.waitForTimeout(200);
  out.afterRead = await p.locator('.fb-isread').allInnerTexts();
  out.seenAfter = env.sheets.Work.d.slice(1).map(r => r[10] ? 'read' : '');
  await p.click('#fb-home'); await p.waitForTimeout(150);
  out.boxAfter = (await p.locator('.hot.fbnew').innerText().catch(() => 'no box')).replace(/\s+/g, ' ');
  await p.locator(`[data-fb="${meta.rw}"]`).first().click(); await p.waitForTimeout(150);
  await p.locator('[data-read]').first().click(); await p.waitForTimeout(150); await p.click('#fb-home'); await p.waitForTimeout(150);
  out.boxAll = await p.locator('.hot.fbnew').count();
  await p.goto('file://' + path.join(dir, 'index.html')); await p.waitForTimeout(500);
  out.listAfter = await p.locator('.fb-alert').count();
  // Olya's panel: read or not
  const t = await (await b.newContext()).newPage();
  await t.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  P({code: 's2', action: 'submit', task: meta.write, type: 'text', text: 'Boris text'});
  P({code: tc, action: 'feedback', id: 1003, text: '**Boris** text'});
  await t.goto('file://' + path.join(dir, path.basename(src))); await t.fill('#code', tc); await t.click('#code-go'); await t.waitForTimeout(500);
  await t.click(`.t-line[data-teach="${meta.write}"]`); await t.waitForTimeout(150);
  out.teacherSees = await t.locator('.t-item > .small').allInnerTexts();
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
