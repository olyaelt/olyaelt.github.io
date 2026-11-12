// engine 74 (her 12.11 19:28: a question she goes over in class had no ✓ Discussed of its own): each piece of a student's work has
// ✓ Discussed in class (and undo) on the students' work page, and «💬 Waiting for your answer» has ✓ Discussed next to each item;
// it stops waiting for an answer, in the page and in her list.
//   node tests/disc_item_check.js SITE_DIR [page=b2/2026-10-30.html]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-10-30.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const KEY = html.match(/const PAGE_KEY = "([^"]+)"/)[1], G = rel.split('/')[0].toUpperCase();
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['s1', 'Mila', G]]);
  const P = o => env.post(JSON.stringify(o));
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1100, height: 900}});
  await ctx.addInitScript(c => { try{ localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }catch(e){} }, tc);
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://hw.test/**', r => r.fulfill({status: 200, contentType: 'text/html', body: html}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://hw.test/' + rel); await p.waitForTimeout(400);
  const tid = await p.evaluate(() => TASKS[0].id);
  P({code: 's1', page: KEY, tasks: [{id: tid, title: 'x', frames: 1}], events: []});
  P({code: 's1', page: KEY, action: 'submit', task: tid, type: 'question', text: 'Why is it "nobody got hurt"?'});
  P({code: 's1', page: KEY, action: 'submit', task: tid, type: 'question', text: 'And this one?'});
  const toAnswer = () => P({action: 'overview', code: tc, pages: [KEY], fresh: true}).pages[KEY].toAnswer;
  ok(toAnswer() === 2, 'two questions do not wait: ' + toAnswer());
  await p.reload(); await p.waitForTimeout(1200);
  // «Waiting for your answer»: ✓ Discussed next to each; one tap → it moves to «✓ Discussed in class»
  ok(await p.locator('.wait [data-wdone]').count() === 2, 'no ✓ Discussed in the waiting list: ' + await p.textContent('.wait').catch(() => 'no list'));
  await p.locator('.wait [data-wdone]').first().click(); await p.waitForTimeout(500);
  ok(await p.locator('.wait [data-wdone]').count() === 1 && /Discussed in class/.test(await p.textContent('.wait')) && toAnswer() === 1, 'the list after ✓ Discussed: ' + await p.textContent('.wait') + ' · ' + toAnswer());
  // the students' work page: ✓ Discussed in class / undo on each item
  await p.evaluate(t => renderTeacherTask(t), tid); await p.waitForTimeout(300);
  ok(await p.locator('.t-item .t-disc-on').count() === 1 && await p.locator('.t-item [data-wdisc]').count() === 1, 'the work page: ' + await p.locator('.t-item .row-btns').allTextContents());
  await p.locator('.t-item [data-wdisc]').click(); await p.waitForTimeout(400);
  ok(await p.locator('.t-item .t-disc-on').count() === 2 && toAnswer() === 0, 'its ✓ Discussed in class did not count: ' + toAnswer());
  await p.locator('.t-item [data-wundo]').first().click(); await p.waitForTimeout(400);
  ok(await p.locator('.t-item [data-wdisc]').count() === 1 && toAnswer() === 1, 'undo: ' + toAnswer());
  // engine 75: the questions sit under the task's last screen, each with ✓ Discussed / undo; a question in the waiting list opens it there
  await p.evaluate(() => goHome()); await p.waitForTimeout(300);
  await p.locator('.wait [data-wgo][data-q]').first().click(); await p.waitForTimeout(500);
  let q = await p.evaluate(t => ({last: stepIdx === TASKS.find(x => x.id === t).steps.length - 1, qs: document.querySelectorAll('#t-qs .t-q').length, open: document.querySelectorAll('#t-qs [data-mkdone]').length, done: document.querySelectorAll('#t-qs [data-mkundo]').length}), tid);
  ok(q.last && q.qs === 2 && q.open === 1 && q.done === 1, 'the questions under the last screen: ' + JSON.stringify(q));
  await p.click('#t-qs [data-mkdone]'); await p.waitForTimeout(400);
  q = await p.evaluate(() => ({open: document.querySelectorAll('#t-qs [data-mkdone]').length, done: document.querySelectorAll('#t-qs [data-mkundo]').length}));
  ok(q.open === 0 && q.done === 2 && toAnswer() === 0, 'its ✓ Discussed: ' + JSON.stringify(q) + ' ' + toAnswer());
  await p.click('#t-qs [data-mkundo]'); await p.waitForTimeout(400); ok(toAnswer() === 1, 'its undo');
  if (process.argv[4]) { await p.evaluate(() => document.getElementById('t-qs').scrollIntoView({block: 'center'})); await p.waitForTimeout(300); await p.screenshot({path: path.join(process.argv[4], 'questions.png')}); }
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK discussed, item by item'); process.exit(fail.length ? 1 : 0);
})();
