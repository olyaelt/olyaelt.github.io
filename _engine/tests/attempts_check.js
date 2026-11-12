// engine 67 (the methodika chat's request 11.11 22:40): first tries and «I want to say this» — the request's checks 1–8.
//   node tests/attempts_check.js SITE_DIR [shots/]
// Code.gs runs in Node (mock.js); the trial page c1/upgrade-trial.html talks to it.
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], shot = async (p, n) => { if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, n + '.png')}); } }, fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students, tc = S.get(2, 1);
  S.getRange(3, 1, 3, 3).setValues([['c1a', 'Clara', 'C1'], ['c1b', 'Boris', 'C1'], ['b2a', 'Anna', 'B2']]);
  const P = o => env.post(JSON.stringify(o)), PAGE = 'hw-ge-c1-upgrade-trial';
  // the script: first only; opened without a try; another group's page is refused; only her code reads the summary
  P({action: 'attempts', code: 'c1a', page: PAGE, items: [{item: 'x:s0', task: 'x', type: 'rewrite', prompt: 'p', answer: 'a', first: 'one', ok: false}]});
  P({action: 'attempts', code: 'c1a', page: PAGE, items: [{item: 'x:s0', task: 'x', type: 'rewrite', prompt: 'p', answer: 'a', first: 'two', ok: true}]});
  let A = env.sheets.Attempts; ok(A && A.getLastRow() === 2 && A.get(2, 11) === 'one', 'the script kept a second try: ' + (A && A.getLastRow()));
  const other = P({action: 'attempts', code: 'b2a', page: PAGE, items: [{item: 'x:s0', first: 'z'}]}); ok(!other.ok && other.error === 'other-group', 'another group\'s page was taken');
  ok(!P({action: 'attemptsSummary', code: 'c1a', page: PAGE}).ok, 'a student code read the summary');
  A.d.splice(1);   // clean for the pages
  // the page, with the mocked script
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'att-')); fs.mkdirSync(path.join(tmp, 'c1'));
  fs.writeFileSync(path.join(tmp, 'c1/upgrade-trial.html'), fs.readFileSync(path.join(site, 'c1/upgrade-trial.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const b = await chromium.launch();
  const open = async (code, role) => { const ctx = await b.newContext({viewport: {width: 1100, height: 900}, acceptDownloads: true});
    await ctx.route(URL_ + '**', r => { if (process.env.LOGP) { const d = JSON.parse(r.request().postData()); console.log(code, d.action, (d.items || []).length); } r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    await ctx.route('https://hw.test/**', r => { const f = path.join(tmp, new URL(r.request().url()).pathname); fs.existsSync(f) ? r.fulfill({status: 200, contentType: 'text/html', body: fs.readFileSync(f, 'utf8')}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(code + ': ' + e.message));
    await p.goto('https://hw.test/c1/upgrade-trial.html'); await p.evaluate(([c, r]) => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', r); }, [code, role]);
    await p.reload(); await p.waitForTimeout(700); return {ctx, p}; };
  const rewrite = async (p, answers) => { await p.click('[data-open="rw"]'); await p.waitForTimeout(250);
    for (const a of answers) { if (a) await p.fill('#rw', a); await p.click('#go'); await p.waitForTimeout(150); await p.click('#go'); await p.waitForTimeout(200); } };
  // 1, 3: Clara — a wrong first try, then the answer opened with nothing typed
  const s1 = await open('c1a', ''); await rewrite(s1.p, ['have lived', '']); await s1.p.waitForTimeout(2600);
  A = env.sheets.Attempts;
  const rows = () => A.getRange(2, 1, Math.max(1, A.getLastRow() - 1), 14).getValues().filter(r => r[0]);
  ok(rows().length === 2, 'Clara: not two rows: ' + JSON.stringify(rows()));
  ok(rows().some(r => r[2] === 'Clara' && r[6] === 'rw:s0' && r[10] === 'have lived' && r[11] === '✗'), 'the wrong first try is not there');
  ok(rows().some(r => r[6] === 'rw:s1' && r[12] === 'yes' && r[10] === ''), 'the answer opened without a try is not marked so');
  // 2: Do it again — a second try never comes in
  await s1.p.click('[data-again="rw"]').catch(() => {}); await s1.p.waitForTimeout(300);
  if (await s1.p.locator('#rw').count()) { await s1.p.fill('#rw', "'ve been living"); await s1.p.click('#go'); await s1.p.waitForTimeout(2600); }
  ok(rows().length === 2 && rows().find(r => r[6] === 'rw:s0')[10] === 'have lived', 'Do it again changed the first try');
  // 6: «I want to say this» — two marked, one taken off
  await s1.p.click('#home').catch(() => {}); await s1.p.waitForTimeout(200);
  await s1.p.click('[data-open="up"]'); await s1.p.waitForTimeout(300);
  await s1.p.click('[data-want="u1"]'); await s1.p.click('[data-want="u2"]'); await s1.p.waitForTimeout(150); await s1.p.click('[data-want="u2"]');
  await shot(s1.p, 'up-student');
  ok(await s1.p.evaluate(() => document.querySelector('[data-want="u1"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-want="u2"]').getAttribute('aria-pressed') === 'false'), 'the hearts don\'t show their state');
  await s1.p.waitForTimeout(2400);
  const W = env.sheets['Want to say'], wrows = () => W ? W.getRange(2, 1, Math.max(1, W.getLastRow() - 1), 10).getValues().filter(r => r[0]) : [];
  ok(wrows().filter(r => r[8] === 'yes').length === 1 && wrows().some(r => r[6] === 'up:u1' && r[8] === 'yes' && r[2] === 'Clara'), 'wants: ' + JSON.stringify(wrows()));
  await s1.ctx.close();
  // 4, 7: Boris — the same wrong answer; the same line marked
  const s2 = await open('c1b', ''); await rewrite(s2.p, ['have lived ']); await s2.p.click('[data-open="up"]').catch(async () => { await s2.p.click('#home'); await s2.p.click('[data-open="up"]'); });
  await s2.p.waitForTimeout(300); await s2.p.click('[data-want="u1"]'); await s2.p.waitForTimeout(2600); await s2.ctx.close();
  // her view: the summary, grouped; by student; the counts on the lines; the CSV
  const T = await open(tc, 'teacher'); const tp = T.p;
  await tp.click('#ft-open'); await tp.waitForTimeout(800);
  await shot(tp, 'ft-item');
  const txt = await tp.textContent('#ft-body');
  ok(/✓ 0 of 2 right the first time/.test(txt) && /have lived ×2/.test(txt), '4: not grouped: ' + txt.slice(0, 400));
  ok(/1 opened without a try/.test(txt), '3: opened without a try: ' + txt.slice(0, 400));
  ok(/I want to say this[\s\S]*I've been living here for five years\.\s*2 students/.test(txt), '7: the counts: ' + txt.slice(-300));
  ok(!/Clara|Boris/.test(txt), 'names in the group view');
  await tp.click('[data-ftm="student"]'); await tp.waitForTimeout(200);
  await shot(tp, 'ft-student');
  const st = await tp.textContent('#ft-body'); ok(/Clara/.test(st) && /Boris/.test(st), 'by student: no names');
  await tp.click('[data-ftm="item"]');
  const [dl] = await Promise.all([tp.waitForEvent('download'), tp.click('#ft-csv')]); const csv = fs.readFileSync(await dl.path(), 'utf8');
  ok(/Right the first time/.test(csv) && /have lived ×2/.test(csv) && /up:u1,want,/.test(csv), '5: the CSV: ' + csv.slice(0, 300));
  await tp.click('#home'); await tp.waitForTimeout(200); await tp.click('[data-open="up"]'); await tp.waitForTimeout(700);
  await shot(tp, 'up-teacher');
  ok((await tp.textContent('[data-wn="u1"]')).trim() === '❤️ 2', 'her view of the lines: no count');
  ok(!(await tp.$('[data-want]')), 'her view has hearts to tap');
  await T.ctx.close();
  // nothing from her own view went in
  ok(!rows().some(r => r[2] === 'Olya'), 'her own tries were recorded');
  await b.close();
  // 8: the page is unlisted
  ok(/hw-unlisted/.test(fs.readFileSync(path.join(site, 'c1/upgrade-trial.html'), 'utf8')), 'the trial page is listed');
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK first tries and «I want to say this»'); process.exit(fail.length ? 1 : 0);
})();
