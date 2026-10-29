// Engine 43: a gap can carry a red note (`n`) that shows under its line while the gap is open (C1 28.10, the group chat:
// "when they open it, write in red: singular"); a say-it row can carry its own note (row[2]), shown under it after Check;
// a task with core: true gives look-back items that always fit the page's whitelist.
//   node tests/gapnote_check.js SITE_DIR/c1/2026-10-28.html   (a page with an e1 dlg whose gaps have n, and r2 = say-it with row notes)
const {chromium, devices} = require('playwright'); const path = require('path'); const {execFileSync} = require('child_process');
(async () => {
  const file = path.resolve(process.argv[2]); const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({...devices['iPhone 13']}); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file); await p.waitForTimeout(400);
  const ids = await p.evaluate(() => ({dlg: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'dlg' && s.lines.some(l => l.p.some(x => x && x.n)))) || {}).id,
    say: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'sayit' && s.s.rows.some(r => r[2]))) || {}).id}));
  out.ids = ids; expect('page has both', ids.dlg && ids.say, ids);
  await p.click(`[data-open="${ids.dlg}"]`); await p.waitForTimeout(400);
  const look = () => p.evaluate(() => ({all: document.querySelectorAll('.gap-n').length, shown: [...document.querySelectorAll('.gap-n')].filter(n => !n.hidden).map(n => n.textContent),
    color: (() => { const n = [...document.querySelectorAll('.gap-n')].find(n => !n.hidden); return n ? getComputedStyle(n).color : ''; })(),
    firstNoted: [...document.querySelectorAll('.panel .dlg .chunk')].findIndex(c => c.dataset.nk)}));
  let v = await look(); out.start = v; expect('notes hidden at first', v.all > 0 && v.shown.length === 0, v);
  await p.locator('.panel .dlg .chunk').nth(v.firstNoted).click(); await p.waitForTimeout(100); v = await look(); out.one = v;
  expect('opening a gap shows its note only, in red', v.shown.length === 1 && /rgb\(2[0-9]{2}, 0, 0\)/.test(v.color), v);
  await p.locator('.panel .dlg .chunk').nth(v.firstNoted).click(); await p.waitForTimeout(100); v = await look(); expect('closing hides it', v.shown.length === 0, v);
  await p.click('#go'); await p.waitForTimeout(300); v = await look(); out.all = v; expect('Show the answers shows every note', v.shown.length === v.all, v);
  await p.click('#home'); await p.waitForTimeout(300);
  await p.click(`[data-open="${ids.say}"]`); await p.waitForTimeout(400);
  const say = () => p.evaluate(() => ({rows: document.querySelectorAll('.say-row').length, notes: document.querySelectorAll('.say-note').length, box: !!document.querySelector('.stage .box')}));
  let s = await say(); out.sayBefore = s; expect('say-it: no notes before Check, box beside', s.notes === 0 && s.box, s);
  await p.click('#go'); await p.waitForTimeout(300); s = await say(); out.sayAfter = s; expect('say-it: a note under each row after Check', s.notes === s.rows && s.rows > 0, s);
  await b.close();
  // core items for later look backs
  const lessonJs = path.join(__dirname, '..', 'lessons', path.basename(path.dirname(file)) + '-' + path.basename(file, '.html'), 'content.js');
  const items = JSON.parse(execFileSync('node', [path.join(__dirname, '..', 'earlier.js'), lessonJs]).toString())[0].items;
  out.core = items.filter(i => i.core).length; expect('earlier.js marks the core task\'s items', out.core > 0, items.map(i => i.core));
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK gap notes + row notes + core'); process.exit(fail.length ? 1 : 0);
})();
