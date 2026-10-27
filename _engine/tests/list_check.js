// The group list in the teacher view: each homework shows what waits for Olya (💬 N to answer, red frame), with a total on top.
//   node tests/list_check.js SITE_DIR GROUP [shot.png]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), g = process.argv[3] || 'b2', G = g.toUpperCase(), shot = process.argv[4];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'list-')); fs.mkdirSync(path.join(tmp, g));
  const html = fs.readFileSync(path.join(site, g, 'index.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  fs.writeFileSync(path.join(tmp, g, 'index.html'), html);
  const keys = JSON.parse(html.match(/const HW_ALL = (\[.*?\]);\n/s)[1]).map(h => h.key);
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 2, 3).setValues([['s1', 'Anna', G], ['s2', 'Boris', G]]);
  const P = o => env.post(JSON.stringify(o));
  const newest = keys[0], oldest = keys[keys.length - 1];
  P({code: 's1', page: newest, tasks: [{id: 'write', title: 'x', frames: 5}], events: [{task: 'write', done: true, ts: Date.now()}]});
  P({code: 's1', page: newest, action: 'submit', task: 'write', type: 'text', text: 'hello'});
  P({code: 's2', page: oldest, action: 'submit', task: 'write', type: 'text', text: 'an old text'});
  P({code: 's2', page: oldest, action: 'submit', task: 'write', type: 'question', text: 'why?'});
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 420, height: 900}}); const errs = []; const out = {};
  // OLD=1: the table still runs the Code.gs before v14 (no "overview"): the list must ask homework by homework
  const asked = []; const answer = d => { const o = JSON.parse(d); asked.push(o.action || 'sync'); return process.env.OLD && o.action === 'overview' ? {ok: false, error: 'no-page'} : env.post(d); };
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(answer(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(tmp, g, 'index.html')); await p.waitForTimeout(200);
  await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(900);
  out.sum = await p.locator('.t-sum').innerText().catch(() => 'none');
  out.cards = await p.locator('.hw').evaluateAll(xs => xs.map(x => (x.classList.contains('todo') ? '🟥 ' : '') + x.querySelector('.date').textContent + ' ' + (x.querySelector('.tb') || {}).textContent));
  if (shot) await p.screenshot({path: shot, fullPage: true});
  // a student code still sees the student list (no teacher badges)
  const p2 = await (await b.newContext()).newPage();
  await p2.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await p2.goto('file://' + path.join(tmp, g, 'index.html')); await p2.fill('#code', 's1'); await p2.click('#code-go'); await p2.waitForTimeout(600);
  out.studentSees = {teacherBadges: await p2.locator('.tb').count(), progress: (await p2.locator('.prog span').first().innerText())};
  out.requests = asked.join(' ');
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
