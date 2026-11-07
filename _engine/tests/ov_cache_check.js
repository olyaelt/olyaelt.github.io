// engine 64 (her 07.11 20:09: «очень подолгу грузиться… не открывается именно с телефона»):
//  Code.gs — her overview goes outside the lock, reads State once, keeps its answer ~90 s; Refresh (fresh) and her answers start it afresh;
//  the start page and the group list — the last numbers show at once with their time, and stay when the table doesn't answer.
//   node tests/ov_cache_check.js SITE_DIR
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], out = {}, errs = [];
  const expect = (name, ok, got) => { if (!ok) fail.push(name + ' — got ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 2, 3).setValues([['b1', 'Anna', 'B2'], ['c1x', 'Clara', 'C1']]);
  const P = o => env.post(JSON.stringify(o));
  P({code: 'b1', page: 'hw-ge-b2-2026-10-23', action: 'submit', task: 'write', type: 'text', text: 'hello'});
  const keys = ['hw-ge-b2-2026-10-23', 'hw-ge-c1-2026-10-23'];
  // the script
  const l0 = env.ctx.locks || 0;
  const o1 = P({action: 'overview', code: tc, pages: keys, stats: true});
  expect('overview answers, counts the text', o1.ok && o1.pages[keys[0]].toAnswer === 1 && !o1.cached, o1);
  expect('overview takes no lock', (env.ctx.locks || 0) === l0, env.ctx.locks);
  expect('group stats come with it', o1.groups && o1.groups.B2 && typeof o1.groups.B2.total === 'number', o1.groups);
  const o2 = P({action: 'overview', code: tc, pages: keys, stats: true});
  expect('the second overview comes from the cache', o2.ok && o2.cached === true && o2.pages[keys[0]].toAnswer === 1, o2);
  const o3 = P({action: 'overview', code: tc, pages: keys, stats: true, fresh: true});
  expect('fresh: true reads the table', o3.ok && !o3.cached, o3);
  const id = env.sheets.Work.get(2, 1);
  P({action: 'feedback', code: tc, page: keys[0], id: String(id), text: 'Well done'});
  const o4 = P({action: 'overview', code: tc, pages: keys, stats: true});
  expect('after her answer the overview counts afresh', o4.ok && !o4.cached && o4.pages[keys[0]].toAnswer === 0, o4.pages);
  const bad = P({action: 'overview', code: 'nope', pages: keys});
  expect('an unknown code is still refused', !bad.ok && bad.error === 'unknown-code', bad);
  const stu = P({action: 'overview', code: 'b1', pages: keys});
  expect('a student code gets no overview', !stu.ok, stu);
  // the pages: first visit fills the device's copy; then the table goes quiet
  const b = await chromium.launch();
  for (const [file, sel, refresh] of [['index.html', '.total-todo', true], ['b2/index.html', '.t-sum', false]]) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ov-')); fs.mkdirSync(path.join(tmp, 'b2'));
    fs.writeFileSync(path.join(tmp, file), fs.readFileSync(path.join(site, file), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
    const ctx = await b.newContext({viewport: {width: 1000, height: 900}}); let mode = 'ok';
    await ctx.route(URL_ + '**', async r => {
      const d = JSON.parse(r.request().postData());
      if (mode === 'slow' && d.action === 'overview') await new Promise(res => setTimeout(res, 2500));
      if (mode === 'down' && d.action === 'overview') return r.abort();
      r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    // a real origin (file:// keeps no storage across a reload here)
    await ctx.route('https://hw.test/**', r => { const f = path.join(tmp, new URL(r.request().url()).pathname); fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({status: 200, contentType: 'text/html', body: fs.readFileSync(f)}) : r.fulfill({status: 404, body: ''}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('https://hw.test/' + file); await p.evaluate(c => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('hw-who', 'Olya'); }, tc);
    await p.reload(); await p.waitForTimeout(900);
    const first = (await p.locator(sel).allInnerTexts()).join(' | ');
    mode = 'slow'; await p.reload(); await p.waitForTimeout(500);
    const during = (await p.locator(sel).allInnerTexts()).join(' | '), badgesDuring = (await p.locator('.badges, .tb').allInnerTexts()).join(' | ');
    await p.waitForTimeout(3000); const after = (await p.locator(sel).allInnerTexts()).join(' | ');
    mode = 'down'; await p.reload(); await p.waitForTimeout(900);
    const down = (await p.locator(sel).allInnerTexts()).join(' | ');
    out[file] = {first, during, badgesDuring: badgesDuring.slice(0, 120), after, down};
    expect(file + ': the first visit shows the table\'s numbers', /waiting|Nothing waiting/.test(first) && !/at \d\d:\d\d/.test(first), first);
    expect(file + ': while the table is slow, the last numbers with their time', /at \d\d:\d\d · checking for new/.test(during) && /started/.test(badgesDuring), {during, badgesDuring});
    expect(file + ': then the fresh ones', !/at \d\d:\d\d/.test(after) && /waiting|Nothing waiting/.test(after), after);
    expect(file + ': the table down — the numbers from before stay', /at \d\d:\d\d · ⚠️ the table didn't answer now/.test(down), down);
    await ctx.close();
  }
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify(out, null, 1));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK overview: no lock, short cache, last numbers at once'); process.exit(fail.length ? 1 : 0);
})();
