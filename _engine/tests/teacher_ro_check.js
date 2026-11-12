// engine 70 (her 12.11 12:13: «домашка уже две минуты как loading»): her own page reads without the lock; a busy table → the page asks again.
//   node tests/teacher_ro_check.js SITE_DIR
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['c1a', 'Clara', 'C1']]);
  const P = o => env.post(JSON.stringify(o)), page = 'hw-ge-c1-film-trial';
  // the script: her sync with teacher: 1 takes no lock and writes no visit; a student's code with teacher: 1 goes the usual way
  let l0 = env.ctx.locks || 0, r = P({action: 'sync', code: tc, page, teacher: 1});
  ok(r.ok && r.role === 'teacher' && (env.ctx.locks || 0) === l0, 'her read took the lock: ' + JSON.stringify(r).slice(0, 200));
  ok(!env.sheets.Students.get(2, 4), 'her read wrote a visit');
  l0 = env.ctx.locks || 0; r = P({action: 'sync', code: 'c1a', page, teacher: 1, tasks: [], events: []});
  ok(r.ok && r.role !== 'teacher' && (env.ctx.locks || 0) === l0 + 1, 'a student with teacher: 1 did not go the usual way');
  l0 = env.ctx.locks || 0; r = P({action: 'sync', code: tc, page});
  ok(r.ok && r.role === 'teacher' && (env.ctx.locks || 0) === l0 + 1, 'an old page (no flag) did not go the usual way');
  // the page: two busy answers, then the table answers → her view loads
  const html = fs.readFileSync(path.join(site, 'c1/film-trial.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1100, height: 800}}); let n = 0, flags = [];
  await ctx.route(URL_ + '**', rt => { const d = JSON.parse(rt.request().postData()); let body;
    if (d.action === 'sync'){ n++; flags.push(d.teacher); body = n <= 2 ? {ok: false, error: 'busy'} : env.post(rt.request().postData()); } else body = env.post(rt.request().postData());
    rt.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(body)}); });
  await ctx.route('https://hw.test/**', rt => rt.fulfill({status: 200, contentType: 'text/html', body: html}));
  const p = await ctx.newPage();
  await p.goto('https://hw.test/c1/film-trial.html'); await p.evaluate(c => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }, tc);
  n = 0; flags = []; await p.reload(); await p.waitForTimeout(500);
  ok(/loading…/.test(await p.textContent('#app')), 'not loading at first');
  await p.waitForFunction(() => !/loading…/.test(document.getElementById('app').textContent), null, {timeout: 15000}).catch(() => fail.push('her view stayed «loading…» after two busy answers'));
  ok(n >= 3 && flags.every(f => f === 1), 'the page did not ask again, or not as the teacher: ' + n + ' ' + flags);
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK her read without the queue'); process.exit(fail.length ? 1 : 0);
})();
