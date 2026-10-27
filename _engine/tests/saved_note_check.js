// Engine 28: "✓ Saved on this device" under the Over to you text box, and the text is back after a reload;
// a browser that can't keep it says "tap Copy first".   node tests/saved_note_check.js SITE_DIR/c1/2026-10-23.html
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = fs.readFileSync(path.resolve(process.argv[2]), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
  const tmp = path.join(os.tmpdir(), 'saved_note_page.html'); fs.writeFileSync(tmp, src);
  const env = makeEnv(); env.ctx.setUp(); const G = /hw-ge-c1-/.test(src) ? 'C1' : 'B2'; env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', G]]);
  const b = await chromium.launch(); const out = {}; const errs = [];
  const route = ctx => ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const toText = async (p, first) => {
    await p.goto('file://' + tmp); await p.waitForTimeout(200);
    if (first && await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(300); }
    const prod = await p.evaluate(() => (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'produce')) || {}).id);
    const ids = await p.evaluate(() => TASKS.map(t => t.id));
    if (await p.locator(`[data-toggle="${ids[0]}"]`).count()) { await p.click(`[data-toggle="${ids[0]}"]`); await p.waitForTimeout(900); }
    await p.click(`[data-open="${prod}"]`);
    for (let i = 0; i < 12 && !(await p.locator('#txt').count()); i++) { await p.click('#go'); await p.waitForTimeout(80); }
    await p.click('.seg-btn[data-mode="write"]');
  };
  const ctx = await b.newContext(devices['iPhone 13']); await route(ctx); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await toText(p, true);
  out.emptyHidden = await p.locator('#txt-saved').isHidden();
  await p.fill('#txt', 'My first line.'); await p.waitForTimeout(50);
  out.note = (await p.locator('#txt-saved').textContent()).trim();
  await p.screenshot({path: path.join(os.tmpdir(), 'saved_note.png')});
  await toText(p, false);
  out.afterReload = await p.inputValue('#txt'); out.noteAfterReload = (await p.locator('#txt-saved').textContent()).trim();
  // private mode: storage throws
  const ctx2 = await b.newContext(devices['iPhone 13']); await route(ctx2);
  await ctx2.addInitScript(() => { const bad = () => { throw new Error('blocked'); }; Object.defineProperty(window, 'localStorage', {get: bad}); });
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push('private: ' + e.message));
  await toText(p2, true); await p2.fill('#txt', 'x'); out.privateNote = (await p2.locator('#txt-saved').textContent()).trim();
  out.errs = errs; console.log(JSON.stringify(out, null, 1));
  const ok = out.emptyHidden && out.note === '✓ Saved on this device' && out.afterReload === 'My first line.' && /Copy first/.test(out.privateNote) && !errs.length;
  console.log(ok ? 'OK saved note' : 'FAILED'); await b.close(); process.exit(ok ? 0 : 1);
})();
