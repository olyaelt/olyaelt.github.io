// The start page: teacher overview of both groups (meters, "to answer", per homework); without a code just the code field.
//   node tests/start_check.js SITE_DIR [shot.png]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shot = process.argv[3];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'start-'));
  fs.writeFileSync(path.join(tmp, 'index.html'), fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 4, 3).setValues([['b1', 'Anna', 'B2'], ['b2x', 'Boris', 'B2'], ['c1x', 'Clara', 'C1'], ['c2x', 'Dmitry', 'C1']]);
  const P = o => env.post(JSON.stringify(o));
  P({code: 'b1', page: 'hw-ge-b2-2026-10-23', tasks: [{id: 'clocks-text', title: 'x', frames: 5}], events: [{task: 'clocks-text', done: true, ts: Date.now()}]});
  P({code: 'b1', page: 'hw-ge-b2-2026-10-23', action: 'submit', task: 'write', type: 'text', text: 'hello'});
  P({code: 'b2x', page: 'hw-ge-b2-2026-10-23', action: 'submit', task: 'tq1', type: 'marked', text: 'hard line'});
  P({code: 'c1x', page: 'hw-ge-c1-2026-10-23', action: 'submit', task: 'write', type: 'text', text: 'my story'});
  env.sheets.Work.set(4, 10, '**good**');
  P({code: 'b2x', page: 'hw-ge-b2-2026-09-30', action: 'submit', task: 'write', type: 'text', text: 'an older text'});   // older than the latest 6: must still show up
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1100, height: 900}}); const errs = []; const out = {};
  // OLD=1: the table still runs the Code.gs before v14 (no "overview"): the list must ask homework by homework
  const asked = []; const answer = d => { const o = JSON.parse(d); asked.push(o.action || 'sync'); return process.env.OLD && o.action === 'overview' ? {ok: false, error: 'no-page'} : env.post(d); };
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(answer(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(tmp, 'index.html')); await p.waitForTimeout(200);
  out.plain = {groups: await p.locator('.group').count(), codeField: await p.locator('#code').count()};   // students see no groups here
  await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(600);
  out.bar = (await p.locator('.sync-on').innerText()).replace(/\s+/g, ' ');
  out.todo = await p.locator('.total-todo').allInnerTexts();
  out.badges = await p.locator('.badges').allInnerTexts();
  out.dates = await p.locator('.hw .date').allInnerTexts();
  out.meters = await p.locator('.meter-top span').allInnerTexts();
  if (shot) await p.screenshot({path: shot, fullPage: true});
  out.requests = asked.join(' ');
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
