// Olya's "Student view": her teacher code, but the page shows what students see (? marks, ticks, banner) and sends nothing.
//   node tests/preview_check.js SITE_DIR GROUP SHARE_OR_REWRITE_TASK_ID [shots_dir]     e.g. ... b2 share-ask
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), g = process.argv[3], task = process.argv[4], shots = process.argv[5];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preview-'));
  for (const f of [`${g}/index.html`, `${g}/2026-10-23.html`]) {
    fs.mkdirSync(path.dirname(path.join(tmp, f)), {recursive: true});
    fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(site, f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  }
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  const out = {posts: [], errors: []};
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 390, height: 844}});
  await ctx.route(URL_ + '**', r => { const body = r.request().postData(); out.posts.push(JSON.parse(body).action || 'sync');
    r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(body))}); });
  const p = await ctx.newPage(); p.on('pageerror', e => out.errors.push(e.message));
  const page = 'file://' + path.join(tmp, `${g}/2026-10-23.html`);
  await p.goto(page); await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(600);
  out.teacherBar = (await p.locator('.teacher-bar').innerText()).replace(/\s+/g, ' ');
  await p.click('#as-student'); await p.waitForLoadState('load'); await p.waitForTimeout(500);
  const before = out.posts.length;
  out.previewBar = (await p.locator('.preview-bar').innerText()).replace(/\s+/g, ' ');
  out.tickCircles = await p.locator('[data-toggle]').count();
  out.chips = await p.locator('.chips, .t-line').count();
  if (shots) await p.screenshot({path: path.join(shots, 'preview-home.png')});
  await p.click(`[data-toggle]`); await p.waitForTimeout(900);
  await p.click(`[data-open="${task}"]`); await p.waitForTimeout(200);
  await p.click('#go'); await p.waitForTimeout(200);                 // Check
  out.markVisible = await p.locator('.mk:not(.demo)').count();
  if (out.markVisible) await p.locator('.mk:not(.demo)').first().click();
  if (shots) await p.screenshot({path: path.join(shots, 'preview-mark.png'), fullPage: true});
  let n = 0; while (n < 80 && await p.locator('.lesson-head').count() === 0) { await p.locator('#go, #fin').first().click(); n++; await p.waitForTimeout(60); }
  await p.waitForTimeout(500);
  out.banner = (await p.locator('.done-banner, .banner, .finished').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 200);
  const react = p.locator('[data-react="hard"]'); if (await react.count()) { await react.first().click(); await p.waitForTimeout(300); }
  out.postsInStudentView = out.posts.slice(before);
  await p.click('#as-teacher'); await p.waitForLoadState('load'); await p.waitForTimeout(600);
  out.backToTeacher = await p.locator('.teacher-bar').count();
  out.leftovers = await p.evaluate(() => Object.keys(localStorage).filter(k => /^hw-ge-/.test(k)).length);
  // the list page has the switch too
  await p.goto('file://' + path.join(tmp, `${g}/index.html`)); await p.waitForTimeout(500);
  out.listSwitch = await p.locator('#as-student').count();
  await p.click('#as-student'); await p.waitForLoadState('load'); await p.waitForTimeout(400);
  out.listPreview = (await p.locator('.preview-bar').innerText().catch(() => '')).replace(/\s+/g, ' ');
  out.stateRowsForTeacher = env.sheets.State.d.filter(r => r[1] === tc).length;
  out.workRows = env.sheets.Work.getLastRow() - 1;
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
