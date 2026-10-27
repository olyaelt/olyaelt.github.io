// Check ticks syncing and the feedback loop against a stand-in of Olya's table (runs ../Code.gs):
//   node tests/sync_check.js ../b2/2026-10-30.html
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = fs.readFileSync(path.resolve(process.argv[2]), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const tmp = path.join(os.tmpdir(), 'sync_check_page.html'); fs.writeFileSync(tmp, src);
  const env = makeEnv(); env.ctx.setUp(); const G = /hw-ge-c1-/.test(src) ? 'C1' : 'B2'; env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', G]]);
  const b = await chromium.launch(); const out = {}; const errs = [];
  const open = async dev => { const ctx = await b.newContext(dev); await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + tmp); await p.waitForTimeout(200);
    await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(300); return p; };
  const phone = await open(devices['iPhone 13']);
  const ids = await phone.evaluate(() => TASKS.map(t => t.id));
  const prodTask = await phone.evaluate(() => (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'produce')) || {}).id);
  await phone.click(`[data-toggle="${ids[0]}"]`); await phone.waitForTimeout(900);
  if (prodTask) {
    await phone.click(`[data-open="${prodTask}"]`);
    for (let i = 0; i < 10 && !(await phone.locator('#txt').count()); i++) { await phone.click('#go'); await phone.waitForTimeout(80); }
    await phone.click('.seg-btn[data-mode="write"]'); await phone.fill('#txt', 'A test text.'); await phone.click('#send'); await phone.waitForTimeout(300);
    out.sent = (await phone.locator('#msg').textContent()).trim();
    env.sheets.Work.set(2, 10, 'A **test** ~~text~~ {line}.');
  }
  // finish the first task through its own button → the banner asks how it was
  await phone.goto('file://' + tmp); await phone.waitForTimeout(300);
  await phone.click(`[data-open="${ids[1]}"]`);
  for (let i = 0; i < 80 && !(await phone.locator('.lesson-head').count()); i++) { await phone.locator('#go, #fin').first().click(); await phone.waitForTimeout(40); }
  await phone.waitForTimeout(900);
  out.reactShown = await phone.locator('#react').count() === 1;
  if (out.reactShown) {
    await phone.click('[data-react="hard"]'); await phone.waitForTimeout(200);
    if (process.env.SHOT) { await phone.click('#ask'); await phone.screenshot({path: process.env.SHOT}); await phone.click('#ask').catch(()=>{}); }
    await phone.click('#ask'); await phone.fill('#ask-txt', 'Why is it "went" here?'); await phone.click('#ask-go'); await phone.waitForTimeout(300);
    out.reactMsg = (await phone.locator('#react-msg').textContent()).trim();
    const W = env.sheets.Work; const qRow = W.d.findIndex(r => String(r[6]).includes('question')) + 1;
    out.questionRow = qRow > 0; if (qRow > 0) W.set(qRow, 10, 'Because it is a {finished} action.');
    out.reactionsTab = (env.sheets.Reactions.d[1] || []).slice(1, 6).join(' | ');
  }
  const laptop = await open({viewport: {width: 1100, height: 900}});
  out.questionAnswered = (await laptop.locator(`.fb-line[data-fb="${ids[1]}"]`).count()) === 1 ? (await laptop.locator(`.fb-line[data-fb="${ids[1]}"]`).innerText()) : 'no';
  out.tickArrived = await laptop.locator(`.task-row.is-done [data-toggle="${ids[0]}"]`).count() === 1;
  if (prodTask) { out.feedbackShown = await laptop.locator(`.fb-line[data-fb="${prodTask}"]`).count() === 1;
    await laptop.click(`.fb-line[data-fb="${prodTask}"]`); out.feedbackHTML = await laptop.locator('.fb-text').first().innerHTML(); out.seenOnOpen = !!env.sheets.Work.get(2, 11);
    await laptop.locator('[data-read]').first().click(); await laptop.waitForTimeout(100); out.seen = !!env.sheets.Work.get(2, 11); }
  out.progressCell = (env.sheets['Progress ' + G].d[3] || []).filter(Boolean).join(' | ');
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
