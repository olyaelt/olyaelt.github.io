// engine 89 (her 14.11 16:24–16:25): /prep/index.html — her rating pages and drafts, newest first, with how many clips she has rated
// (her table: rateGet, her teacher code); the old 11.11 page under «Done»; linked from the tools list.
//   node tests/prep_index_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], rel = 'prep/index.html', fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const html = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  const pool = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lessons/prep-2026-11-13/pool.json'), 'utf8')).map(x => x.id);
  env.post(JSON.stringify({action: 'ratePut', code: tc, set: 'hw-2026-11-13', cards: [{id: pool[0], level: 2}, {id: pool[1], out: true}, {id: pool[2], note: 'not rated'}]}));
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 400, height: 860}, deviceScaleFactor: shots ? 2 : 1});
  await ctx.addInitScript(c => { try{ localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }catch(e){} }, tc);
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith(rel)) return r.fulfill({status: 200, contentType: 'text/html', body: html});
    const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/' + rel); await p.waitForTimeout(1500);
  const st = await p.evaluate(() => ({cur: [...document.querySelectorAll('#list .lesson')].map(a => a.querySelector('.t').textContent), old: [...document.querySelectorAll('#old .lesson')].map(a => a.querySelector('.t').textContent),
    first: (document.querySelector('#list .lesson') || {}).textContent || ''}));
  ok(st.cur.length === 4 && /Rate the clips/.test(st.cur[0]) && st.old.length === 1 && /11\.11/.test(st.old[0]), 'lists: ' + JSON.stringify(st));
  ok(/Pool for the step quiz: 2 of 53 rated · 51 to go/.test(st.first) && /Homework clips \(B2 and C1\): 0 of 30/.test(st.first), 'counts: ' + st.first);
  ok(fs.readFileSync(path.join(site, 'tools/index.html'), 'utf8').includes('href="../prep/index.html"'), 'linked from the tools list');
  if (shots) await p.screenshot({path: path.join(shots, 'prep_index.png'), fullPage: true});
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK prep index'); process.exit(fail.length ? 1 : 0);
})();
