// Teacher view: Olya's code shows who ticked what, where they got stuck, their work, and saves feedback.
//   node tests/teacher_check.js SITE_DIR/b2/2026-10-23.html [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = path.resolve(process.argv[2]), shots = process.argv[3];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teach-'));
  for (const f of [path.basename(src), 'index.html']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(path.dirname(src), f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const teacherCode = S.get(2, 1);
  const G = /\/c1\//.test(src) ? 'C1' : 'B2';
  const names = G === 'B2' ? ['Julia','Elena','Katerina','Liudmila','Natalia','Oleg','Olga','Vladimir','Victoria'] : ['Alena','Artyom','Ekaterina','Julia','Ksenia T','Ksenia L','Marina','Peter Smirnov','Petr S'];
  S.getRange(3, 1, names.length, 3).setValues(names.map((n, i) => ['s' + i, n, G]));
  const b = await chromium.launch(); const errs = []; const out = {};
  const ctx = await b.newContext({viewport: {width: 1100, height: 1000}, colorScheme: process.env.DARK ? 'dark' : 'light'});
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, path.basename(src))); await p.waitForTimeout(200);
  const meta = await p.evaluate(() => ({ key: PAGE_KEY, tasks: TASKS.map(t => ({id: t.id, title: t.title})),
    rw: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'rewrite')) || {}).id, write: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'produce')) || {}).id }));
  // what the students did (sent straight to the stand-in)
  const P = o => env.post(JSON.stringify(Object.assign({page: meta.key, date: '23.10.26'}, o)));
  [0, 1, 2, 4, 6].forEach(i => P({code: 's' + i, tasks: meta.tasks.map(t => ({...t, frames: 5})), events: [{task: meta.tasks[0].id, done: true, ts: Date.now()}]}));
  P({code: 's1', action: 'submit', task: meta.rw, type: 'marked', text: 'The clocks go back an hour on Sunday.\n— why no "will"?'});
  P({code: 's2', action: 'submit', task: meta.rw, type: 'marked', text: 'Does that still work for you?'});
  P({code: 's4', action: 'submit', task: meta.rw, type: 'question', text: 'Can I say "the clocks change"?'});
  P({code: 's6', action: 'submit', task: meta.write, type: 'text', text: 'A: Hi! How was Spain?\nB: I have went there last week.', phrases: ["It's been ages!"]});
  P({code: 's5', action: 'react', task: meta.rw, level: 'hard'});
  // Olya's view
  await p.fill('#code', teacherCode); await p.click('#code-go'); await p.waitForTimeout(500);
  out.bar = (await p.locator('.teacher-bar').innerText()).replace(/\s+/g, ' ').trim();
  out.statusHidden = !(await p.locator('.status').first().isVisible());
  out.firstTaskChips = await p.locator(`[data-teach="${meta.tasks[0].id}"] .t-chip`).evaluateAll(xs => xs.map(x => x.textContent + (x.classList.contains('on') ? '✓' : '')));
  out.hot = (await p.locator('section.hot:not(.wait)').innerText()).replace(/\s+/g, ' ');
  out.wait = (await p.locator('section.hot.wait').innerText()).replace(/\s+/g, ' ');
  // a waiting item opens its task's panel at that item
  await p.locator('section.hot.wait [data-wid]').last().click(); await p.waitForTimeout(150);
  out.waitOpens = (await p.locator('.t-item.t-focus .small').first().innerText().catch(() => 'no focused item')).replace(/\s+/g, ' ');
  await p.click('#t-home');
  // a tap on a task's title opens the task, with a strip on top that leads to the students' work (and back via "Open the task")
  await p.click(`[data-open="${meta.rw}"]`); await p.waitForTimeout(150);
  out.taskTapOpensTask = {panel: await p.locator('.t-panel').count(), strip: (await p.locator('#t-strip').innerText().catch(() => 'no strip')).replace(/\s+/g, ' ')};
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_strip.png')});
  await p.click('#t-strip'); await p.waitForTimeout(150);
  out.stripOpensPanel = {panel: await p.locator('.t-panel').count(), strip: await p.locator('#t-strip').count()};
  await p.click('#t-home'); await p.click(`[data-open="${meta.write}"]`); await p.waitForTimeout(150);
  // finishing a task as the teacher counts nothing
  for (let i = 0; i < 6 && !(await p.locator('.lesson-head').count()); i++) { await p.locator('#go').click(); await p.waitForTimeout(60); }
  out.finishBanner = (await p.locator('.done-banner').innerText().catch(() => 'no banner')).replace(/\s+/g, ' ');
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_home.png'), fullPage: false});
  await p.click(`.t-line[data-teach="${meta.rw}"]`); await p.waitForTimeout(150);
  out.items = await p.locator('.t-item .small').first().innerText();
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_task.png'), fullPage: true});
  // feedback on the Over to you text: the box is ready to mark up straight away
  await p.click('#t-home'); await p.click(`.t-line[data-teach="${meta.write}"]`); await p.waitForTimeout(150);
  const card = p.locator('.t-item').filter({has: p.locator('.t-ta')}).last();
  out.editorReady = await card.locator('.t-ta').inputValue();
  await card.locator('.t-ta').evaluate(ta => { const s = ta.value.indexOf('have went'); ta.focus(); ta.setSelectionRange(s, s + 9); });
  await card.locator('.tool.del').click();
  await card.locator('.t-ta').evaluate(ta => { ta.setRangeText(' {went}', ta.selectionEnd, ta.selectionEnd); ta.dispatchEvent(new Event('input')); const s = ta.value.indexOf('Hi!'); ta.setSelectionRange(s, s + 3); });
  await card.locator('.tool.good').click();
  // ✎ Correction / 💬 Comment: inside {went} the comment button turns it into [[went]], and back; at the end of the text it opens [[ ]] for a comment
  const ta = card.locator('.t-ta'), at = async i => ta.evaluate((el, i) => { el.focus(); const k = i < 0 ? el.value.length : el.value.indexOf('{went}') + 2; el.setSelectionRange(k, k); }, i);
  await at(0); await card.locator('.tool.cmt').click(); out.toNote = (await ta.inputValue()).includes('[[went]]');
  await card.locator('.tool.ins').click(); out.backToIns = (await ta.inputValue()).includes('{went}') && !(await ta.inputValue()).includes('[[');
  await at(-1); await card.locator('.tool.cmt').click(); await p.keyboard.type('Last week = past simple.');
  out.preview = await card.locator('.t-prev').innerHTML();
  out.msgBefore = await card.locator('.t-msg').innerText();
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await card.locator('.t-copy').click(); await p.waitForTimeout(150);
  out.copied = await p.evaluate(() => navigator.clipboard.readText()).catch(e => 'clipboard: ' + e.message);
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_editor.png'), fullPage: true});
  await card.locator('[data-save]').click(); await p.waitForTimeout(300);
  out.msgAfter = await card.locator('.t-msg').innerText();
  out.savedCell = env.sheets.Work.d.find(r => String(r[6]).includes('text'))[9];
  out.afterSave = await card.locator('.t-prev').innerHTML();
  await p.click('#t-home'); await p.waitForTimeout(100);
  out.waitAfterSave = (await p.locator('section.hot.wait').innerText()).replace(/\s+/g, ' ');
  // engine 39: no "Copy all for Claude" (her wish: one piece of work at a time)
  out.copyAllButtons = await p.locator('#copy-wait, #t-copy-all').count();
  // hide names for the screen
  await p.click('#hide-names'); await p.waitForTimeout(150);
  out.hiddenLine = (await p.locator(`[data-teach="${meta.tasks[0].id}"]`).first().innerText()).replace(/\s+/g, ' ');
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_hidden.png')});
  out.teacherTicksInState = env.sheets.State.d.filter(r => r[1] === teacherCode).length;
  await p.goto('file://' + path.join(dir, 'index.html')); await p.waitForTimeout(300);
  out.indexLine = (await p.locator('.sync-on').innerText()).replace(/\s+/g, ' ');
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
