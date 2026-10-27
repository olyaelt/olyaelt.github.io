// Engine 31: "Your phrases" on the produce screen grouped by the parts of MAP. b2/2026-10-23 "Your own conversation":
// pick 2 from SHARE AND ASK only → four headings, SHARE AND ASK with the 2, the other three red with "0 phrases" (a red heading
// goes back to the plan screen); one more in each → no red; PICK_EACH = false → the flat list.   node tests/parts_check.js SITE_DIR [shots]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3];
  const b = await chromium.launch(); const out = {}; const errs = []; const fail = []; const expect = (n, ok) => { if (!ok) fail.push(n); };
  const open = async (flat) => {
    let src = fs.readFileSync(path.join(site, 'b2/2026-10-23.html'), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    if (flat) src = src.replace('const MAP = [', 'const PICK_EACH = false;\nconst MAP = [');
    const tmp = path.join(os.tmpdir(), 'parts_' + (flat ? 'flat' : 'parts') + '.html'); fs.writeFileSync(tmp, src);
    const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', 'B2']]);
    const ctx = await b.newContext(devices['iPhone 13']);
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + tmp); await p.waitForTimeout(200);
    if (await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(300); }
    await p.evaluate(() => document.querySelector('[data-open="write"]').click()); await p.waitForTimeout(150);
    await p.click('#go'); await p.waitForTimeout(100);   // task → plan
    return p;
  };
  const toProduce = async p => { await p.click('#go'); await p.waitForTimeout(150); };
  const state = p => p.evaluate(() => [...document.querySelectorAll('.ph-part')].map(d => ({h: d.querySelector('.ph-h').innerText.trim(), red: d.classList.contains('empty'), n: d.querySelectorAll('input').length, zero: !!d.querySelector('.ph-zero')})));
  { const p = await open(false);
    const share = await p.evaluate(() => MAP.findIndex(g => /share/i.test(g.h)));
    await p.click(`[data-id="${share}-0"]`); await p.click(`[data-id="${share}-1"]`);
    out.planCounter = await p.locator('#pc').innerText();
    await toProduce(p);
    out.first = await state(p);
    if (shots) await p.locator('fieldset.check').screenshot({path: path.join(shots, 'parts-produce.png')});
    expect('four parts, SHARE AND ASK with 2, three red with 0 phrases', out.first.length === 4 && out.first.filter(x => x.red && x.zero && x.n === 0).length === 3 && out.first.find(x => /share/i.test(x.h)).n === 2 && !out.first.find(x => /share/i.test(x.h)).red);
    // a red heading → the plan screen; pick one in each part → no red
    await p.locator('.ph-part.empty [data-plan]').first().click(); await p.waitForTimeout(150);
    out.backToPlan = await p.locator('.pick').count() > 0;
    for (let gi = 0; gi < 4; gi++) if (gi !== share) await p.click(`[data-id="${gi}-0"]`);
    await toProduce(p);
    out.second = await state(p);
    expect('a red heading goes back to the plan', out.backToPlan);
    expect('one in each part → no red', out.second.length === 4 && out.second.every(x => !x.red && x.n >= 1));
    // ticks still saved
    await p.locator('fieldset.check input').first().check(); out.ticked = await p.evaluate(() => localStorage.getItem(usedKey()));
    expect('ticks saved', /"/.test(out.ticked || ''));
  }
  { const p = await open(true);
    await p.click('[data-id="2-0"]'); await p.click('[data-id="2-1"]'); await toProduce(p);
    out.flat = {parts: await p.locator('.ph-part').count(), boxes: await p.locator('fieldset.check input').count()};
    expect('PICK_EACH = false → the flat list', out.flat.parts === 0 && out.flat.boxes === 2);
  }
  out.errors = errs; expect('no page errors', !errs.length);
  console.log(JSON.stringify(out, null, 1)); console.log(fail.length ? 'FAILED: ' + fail.join('; ') : 'OK phrases by part');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
