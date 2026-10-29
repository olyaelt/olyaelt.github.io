// Engine 41: a task "for later" (tag, not in the total time) and, in her teacher view only, the TubeQuizard copy of a listening task.
//   node tests/later_tq_check.js SITE_DIR/c1/2026-10-28.html [shots_dir]   (a page with a `later` task and `tqLink`s)
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'later-'));
  for (const f of [path.basename(src), 'index.html']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(path.dirname(src), f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const teacherCode = S.get(2, 1);
  const G = /\/c1\//.test(src) ? 'C1' : 'B2';
  S.getRange(3, 1, 2, 3).setValues([['s0', 'Anna', G], ['s1', 'Boris', G]]);
  const b = await chromium.launch(); const errs = []; const out = {}; const fail = [];
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({...devices['iPhone 13']});
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, path.basename(src))); await p.waitForTimeout(300);
  const meta = await p.evaluate(() => ({later: TASKS.filter(t => t.later).map(t => t.id), tq: TASKS.filter(t => t.tqLink).map(t => t.id), tqStud: TASKS.filter(t => t.tq).map(t => t.id),
    all: Math.round(TASKS.reduce((s, t) => s + minutesOf(t), 0) / 5) * 5, core: Math.round(TASKS.filter(t => !t.later).reduce((s, t) => s + minutesOf(t), 0) / 5) * 5}));
  out.meta = meta; expect('page has a later task and TubeQuizard links', meta.later.length && meta.tq.length, meta);
  // a student (code s0)
  await p.fill('#code', 's0'); await p.click('#code-go'); await p.waitForTimeout(400);
  const stud = await p.evaluate(() => ({total: document.querySelector('.total') ? document.querySelector('.total').textContent : '', tags: [...document.querySelectorAll('.later-tag')].map(x => x.closest('.task-wrap').querySelector('[data-open]').dataset.open),
    tq: document.querySelectorAll('.tq-link').length,
    alt: [...document.querySelectorAll('.tq-alt')].map(x => ({task: x.closest('.task-wrap').querySelector('[data-open]').dataset.open, href: x.querySelector('a').href}))}));
  out.student = stud;
  expect('student: total without the later task', new RegExp('About ' + meta.core + ' minutes').test(stud.total) && /for later/.test(stud.total), stud);
  expect('student: tag on the later task(s) only', JSON.stringify(stud.tags) === JSON.stringify(meta.later), stud);
  expect('student: no teacher TubeQuizard lines', stud.tq === 0, stud);
  // engine 42: a task with `tq` (C1 pages) shows students "Prefer TubeQuizard? Do the same quiz there"; without `tq` (B2) nothing
  expect('student: the TubeQuizard line on tasks with tq only', JSON.stringify(stud.alt.map(x => x.task)) === JSON.stringify(meta.tqStud) && stud.alt.every(x => /tubequizard\.com/.test(x.href)), stud);
  if (shots) await p.screenshot({path: path.join(shots, 'student-home.png'), fullPage: true});
  // Olya
  await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.waitForTimeout(300);
  await p.fill('#code', teacherCode); await p.click('#code-go'); await p.waitForTimeout(500);
  const t = await p.evaluate(() => ({links: [...document.querySelectorAll('.tq-link')].map(x => ({task: x.closest('.task-wrap').querySelector('[data-open]').dataset.open, href: x.querySelector('a').href})), alt: document.querySelectorAll('.tq-alt').length}));
  out.teacher = t;
  expect('teacher: no student line', t.alt === 0, t);
  expect('teacher: one TubeQuizard line per task with tqLink', JSON.stringify(t.links.map(x => x.task)) === JSON.stringify(meta.tq) && t.links.every(x => /tubequizard\.com/.test(x.href)), t);
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await p.locator('[data-copy-tq]').first().click(); await p.waitForTimeout(200);
  out.copied = await p.locator('[data-copy-tq]').first().innerText(); expect('Copy link says copied', /Copied|Couldn't/.test(out.copied), out.copied);
  out.stillHome = await p.evaluate(() => !document.querySelector('.stage'));   // the copy button doesn't open the task
  expect('copy does not open the task', out.stillHome, out.stillHome);
  if (shots) await p.screenshot({path: path.join(shots, 'teacher-home.png'), fullPage: true});
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK later + TubeQuizard links'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
