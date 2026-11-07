// tools 28 also (her 05.11 18:45, C1 4.11: «вариант с актуальной частью… без всего, что отсутствовало на уроке»): a field page with
// "class_view" is also built as <page>-class.html with only the stages done in class; the homework's 📂 Class materials links to it.
//   node tests/class_view_check.js SITE_DIR
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, 'tools/c1-2026-11-04/practical-things-class.html')); await p.waitForTimeout(400);
  out.cls = await p.evaluate(() => ({stages: D.stages.map(s => s.label), id: PAGE_ID, cv: 'class_view' in D, council: D.stages.some(s => s.blocks.some(x => x.kind === 'council'))}));
  expect('the class view: Revision, Make it perfect, Say it naturally — nothing else', JSON.stringify(out.cls.stages) === JSON.stringify(['🧠 Revision', '✏️ Make it perfect', '🗣 Say it naturally']) && !out.cls.council && !out.cls.cv, out.cls);
  expect('its own page id (its own saved place)', out.cls.id === 'c1-2026-11-04/practical-things-class', out.cls);
  const src = fs.readFileSync(path.join(site, 'tools/c1-2026-11-04/practical-things-class.html'), 'utf8');
  expect('plain: never talks to her table', /const LIVE_ON = false, LIVE_URL = ""/.test(src), (src.match(/const LIVE_ON = [^;]*/) || [''])[0]);
  await p.goto('file://' + path.join(site, 'tools/c1-2026-11-04/practical-things.html')); await p.waitForTimeout(300);
  out.full = await p.evaluate(() => D.stages.length);
  expect('the full page keeps all its stages', out.full === 6, out.full);
  await p.goto('file://' + path.join(site, 'c1/2026-11-04.html')); await p.waitForTimeout(300);
  out.hw = await p.evaluate(() => [...document.querySelectorAll('.cm-peek .cm-lk')].map(a => a.getAttribute('href')));
  expect('C1 homework 4.11: Class materials → the class view', out.hw.length === 1 && /^\.\.\/tools\/c1-2026-11-04\/practical-things-class\.html(\?hw=c1\/2026-11-04)?$/.test(out.hw[0]), out.hw);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK class view'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
