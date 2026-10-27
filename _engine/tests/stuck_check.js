// "Where they got stuck" opens the task itself with the hard places framed (answers hidden), a bar of marked steps,
// ✓ Discussed / undo / ✓ All discussed (saved in the table), and the task leaves the list until something new comes in.
//   node tests/stuck_check.js SITE_DIR/b2/2026-10-23.html [shots_dir]      (KIND=listen default; rewrite / sayit / share for other step types)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = path.resolve(process.argv[2]), shots = process.argv[3], KIND = process.env.KIND || 'listen';
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stuck-'));
  for (const f of [path.basename(src), 'index.html']) fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(path.dirname(src), f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  const G = /\/c1\//.test(src) ? 'C1' : 'B2';
  S.getRange(3, 1, 3, 3).setValues([['s1', 'Mila', G], ['s2', 'Oleg', G], ['s3', 'Elena', G]]);
  const b = await chromium.launch(); const errs = []; const out = {};
  const ctx = await b.newContext({viewport: {width: 900, height: 1000}, colorScheme: process.env.DARK ? 'dark' : 'light'});
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, path.basename(src))); await p.waitForTimeout(200);
  const meta = await p.evaluate(K => {
    const t = TASKS.find(t => (t.steps || []).some(s => s.type === K)); if (!t) return null;
    const its = stuckItems(t).filter(it => t.steps[it.si].type === K), gapped = its.filter(it => K !== 'listen' || t.steps[it.si].clip[it.row][3].some(x => typeof x !== 'string'));
    return { key: PAGE_KEY, id: t.id, a: gapped[0], b: gapped[gapped.length - 1] };
  }, KIND);
  if (!meta) { console.log(JSON.stringify({skip: 'no ' + KIND + ' task'})); await b.close(); return; }
  const P = o => env.post(JSON.stringify(Object.assign({page: meta.key, task: meta.id}, o)));
  P({code: 's1', action: 'submit', type: 'marked', text: meta.a.snippet + '\n— what is the second word?'});
  P({code: 's2', action: 'submit', type: 'marked', text: meta.a.snippet});
  P({code: 's3', action: 'submit', type: 'marked', text: meta.b.snippet});
  P({code: 's2', action: 'submit', type: 'question', text: 'Why "ahead of" and not "before"?'});
  P({code: 's3', action: 'react', level: 'hard'});
  await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(500);
  out.hot = (await p.locator('section.hot:not(.wait)').innerText()).replace(/\s+/g, ' ');
  await p.click(`[data-stuck="${meta.id}"]`); await p.waitForTimeout(400);
  out.opensStep = {count: await p.locator('.taskbar .count').innerText().catch(() => '-'), expected: `${meta.a.si + 1} of`};
  out.bar = (await p.locator('#t-mkbar').innerText()).replace(/\s+/g, ' ');
  out.framed = await p.locator('.t-marked').count();
  out.label = (await p.locator('.t-mk-who').first().innerText()).replace(/\s+/g, ' ');
  out.answersHidden = KIND === 'listen' ? await p.locator('.gap-in').count() > 0 : await p.locator('.ans').count() === 0;
  if (shots) await p.screenshot({path: path.join(shots, `stuck_${KIND}.png`), fullPage: true});
  await p.locator('[data-mkdone]').first().click(); await p.waitForTimeout(300);
  out.afterOne = {label: (await p.locator('.t-mk-who').first().innerText()).replace(/\s+/g, ' '), sheet: (env.sheets.Discussed.d[1] || [])[3]};
  await p.locator('[data-mkundo]').first().click(); await p.waitForTimeout(300);
  out.afterUndo = (await p.locator('.t-mk-who').first().innerText()).replace(/\s+/g, ' ');
  if (meta.b.si !== meta.a.si) { await p.click(`[data-mkgo="${meta.b.si}"]`); await p.waitForTimeout(300);
    out.jump = {count: await p.locator('.taskbar .count').innerText().catch(() => '-'), framed: await p.locator('.t-marked').count(), label: (await p.locator('.t-mk-who').first().innerText().catch(() => 'none')).replace(/\s+/g, ' ')}; }
  await p.click('#t-mk-all'); await p.waitForTimeout(300);
  out.afterAll = (await p.locator('#t-mkbar').innerText()).replace(/\s+/g, ' ');
  await p.click('#home'); await p.waitForTimeout(200);
  out.hotAfter = (await p.locator('section.hot:not(.wait)').innerText()).replace(/\s+/g, ' ');
  P({code: 's1', action: 'submit', type: 'marked', text: meta.b.snippet + ' '});
  await p.reload(); await p.waitForTimeout(500);
  out.hotNew = (await p.locator('section.hot:not(.wait)').innerText()).replace(/\s+/g, ' ');
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
