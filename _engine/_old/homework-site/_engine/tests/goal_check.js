// Group goal: meter on the homework page and the list page, frames per task, a milestone celebration.
//   node tests/goal_check.js SITE_DIR/b2/2026-10-23.html
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const page = path.resolve(process.argv[2]), dir = path.dirname(page);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'goal-'));
  for (const f of [path.basename(page), 'index.html']) fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(dir, f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp();
  const group = /\/c1\//.test(page) ? 'C1' : 'B2';
  env.sheets.Students.getRange(2, 1, 2, 3).setValues([['test11', 'Tester', group], ['other22', 'Other', group]]);
  // put the group just under 50 % so one task crosses the mark
  const S = env.sheets.Settings; const row = S.d.findIndex(r => r[0] === group) + 1; S.set(row, 2, 1000); S.set(row, 3, 495);
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const errs = []; const out = {};
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(tmp, path.basename(page))); await p.waitForTimeout(200);
  await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(400);
  out.meterBefore = (await p.locator('.meter-top span').innerText()).trim();
  const first = await p.evaluate(() => TASKS[0].id);
  await p.click(`[data-open="${first}"]`);
  for (let i = 0; i < 80 && !(await p.locator('.lesson-head').count()); i++) { await p.locator('#go, #fin').first().click(); await p.waitForTimeout(40); }
  out.banner = (await p.locator('.done-banner').innerText()).split('\n')[0];
  await p.waitForTimeout(1200);
  out.meterAfter = (await p.locator('.meter-top span').innerText()).trim();
  out.toast = await p.locator('.toast').count() ? await p.locator('.toast').innerText() : 'none';
  out.filledFrames = await p.locator('.strip i.on').count();
  out.week = (await p.locator('.meter .small b').innerText());
  await p.screenshot({path: path.join(tmp, 'meter.png')});
  await p.goto('file://' + path.join(tmp, 'index.html')); await p.waitForTimeout(400);
  out.indexMeter = (await p.locator('.meter-top span').innerText()).trim();
  out.settingsNow = S.get(row, 6);
  out.errors = errs; out.shot = path.join(tmp, 'meter.png');
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
