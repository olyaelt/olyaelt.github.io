// An unlisted page ("listed": false) and a write-only produce step (modes:["write"]):
// students don't see the page in their group list (it opens by its link); her teacher view shows it, marked
// "🔒 Not published", in the group list, on the start page and on top of the page itself; its write-only
// produce step has no Record tab and no "Prefer to talk?" hint. 📢 Publish on the page (engine 27): the draft joins the students'
// list (with a code and without one) and loses its 🔒 in her lists; Unpublish takes it back; an old table script says so.
//   node tests/unlisted_check.js SITE_DIR <group>/<YYYY-MM-DD>.html
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3], [g, file] = rel.split('/');
  const out = {};
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unl-')); fs.mkdirSync(path.join(dir, g));
  const put = f => fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(site, f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  put(rel); put(g + '/index.html'); put('index.html');
  const html = fs.readFileSync(path.join(site, rel), 'utf8');
  out.markedUnlisted = html.includes('<meta name="hw-unlisted"');
  const date = html.match(/const LESSON = \{ date:"([^"]+)"/)[1];
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 1, 3).setValues([['s1', 'Anna', g.toUpperCase()]]);
  const b = await chromium.launch(); const errs = []; let oldScript = false;
  const answer = body => { const p = JSON.parse(body); return oldScript && p.action === 'publish' ? {ok: true, role: 'teacher'} : env.post(body); };
  const ctxOf = async () => { const c = await b.newContext({viewport: {width: 420, height: 900}});
    await c.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(answer(r.request().postData()))})); return c; };
  // a student: the list leaves it out; the page opens by its link without the teacher note
  const sp = await (await ctxOf()).newPage(); sp.on('pageerror', e => errs.push(e.message));
  await sp.goto('file://' + path.join(dir, g, 'index.html')); await sp.fill('#code', 's1'); await sp.click('#code-go'); await sp.waitForTimeout(500);
  out.studentListHasIt = (await sp.locator('.hw .date').allInnerTexts()).includes(date);
  await sp.goto('file://' + path.join(dir, rel)); await sp.waitForTimeout(400);
  out.studentPage = {opens: await sp.locator('.task-btn').count() > 0, note: await sp.locator('.unl-note').count()};
  // her teacher view
  const tp = await (await ctxOf()).newPage(); tp.on('pageerror', e => errs.push(e.message));
  await tp.goto('file://' + path.join(dir, g, 'index.html')); await tp.fill('#code', tc); await tp.click('#code-go'); await tp.waitForTimeout(600);
  out.teacherList = await tp.locator('.hw.unl').evaluateAll(xs => xs.map(x => x.querySelector('.hw-top').textContent.replace(/\s+/g, ' ').trim()));
  await tp.goto('file://' + path.join(dir, 'index.html')); await tp.waitForTimeout(600);
  out.startPage = await tp.locator('.hw.unl').evaluateAll(xs => xs.map(x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)));
  await tp.goto('file://' + path.join(dir, rel)); await tp.waitForTimeout(500);
  out.teacherNote = (await tp.locator('.unl-note').innerText().catch(() => 'none')).replace(/\s+/g, ' ');
  const prod = await tp.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); return t ? {id: t.id, i: t.steps.findIndex(s => s.type === 'produce'), modes: t.steps.find(s => s.type === 'produce').modes || t.modes || null} : null; });
  if (prod) { await tp.evaluate(x => openTask(x.id, x.i), prod); await tp.waitForTimeout(150);
    out.produce = {modes: prod.modes, recordTab: await tp.locator('[data-mode="record"]').count(), instr: (await tp.locator('.instr').innerText().catch(() => '')).trim()}; }
  // 📢 Publish: an old script first (nothing saved, she is told), then the new one
  const toast = async () => (await tp.locator('.toast').last().innerText().catch(() => '')).trim();
  await tp.evaluate(() => renderHome()); await tp.waitForTimeout(100);
  oldScript = true; await tp.click('#unl-pub'); await tp.waitForTimeout(300);
  out.oldScript = {toast: await toast(), still: (await tp.locator('.unl-note b').innerText()).trim()};
  oldScript = false; await tp.click('#unl-pub'); await tp.waitForTimeout(300);
  out.published = {toast: await toast(), note: (await tp.locator('.unl-note').innerText()).replace(/\s+/g, ' ').trim(), sheet: env.sheets.Published ? env.sheets.Published.d : null};
  await tp.goto('about:blank'); await tp.goto('file://' + path.join(dir, rel)); await tp.waitForTimeout(500);
  out.afterReload = (await tp.locator('.unl-note b').innerText().catch(() => 'none')).trim();
  await sp.goto('file://' + path.join(dir, g, 'index.html')); await sp.waitForTimeout(500);
  out.studentListAfterPublish = (await sp.locator('.hw .date').allInnerTexts()).includes(date);
  const np = await (await ctxOf()).newPage(); np.on('pageerror', e => errs.push(e.message));
  await np.goto('file://' + path.join(dir, g, 'index.html')); await np.waitForTimeout(500);
  out.noCodeListAfterPublish = (await np.locator('.hw .date').allInnerTexts()).includes(date);
  await tp.goto('file://' + path.join(dir, g, 'index.html')); await tp.waitForTimeout(600);
  out.teacherListLocksAfterPublish = await tp.locator('.hw.unl').count();
  await tp.goto('file://' + path.join(dir, 'index.html')); await tp.waitForTimeout(600);
  out.startPageLocksAfterPublish = await tp.locator('.hw.unl').count();
  // Unpublish
  await tp.goto('about:blank'); await tp.goto('file://' + path.join(dir, rel)); await tp.waitForTimeout(500);
  await tp.click('#unl-pub'); await tp.waitForTimeout(300);
  out.unpublished = {toast: await toast(), note: (await tp.locator('.unl-note b').innerText()).trim()};
  await sp.goto('file://' + path.join(dir, g, 'index.html')); await sp.waitForTimeout(500);
  out.studentListAfterUnpublish = (await sp.locator('.hw .date').allInnerTexts()).includes(date);
  await np.reload(); await np.waitForTimeout(500);
  out.noCodeListAfterUnpublish = (await np.locator('.hw .date').allInnerTexts()).includes(date);
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
