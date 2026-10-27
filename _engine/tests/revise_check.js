// Engines 30/32: bookmarks to revise (device only; a green bookmark since 32, "!" in 30). Gaps task: open 3 gaps, bookmark 2, Finish → "Once more: your bookmarks (2)"
// with exactly those 2 gaps closed and the rest open and plain; reopen → the 2 marks are still there. A dlg step: "!" after
// Show the answers (not in the glossary), the task's end → Once more with the marked gap closed.
//   node tests/revise_check.js SITE_DIR [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3];
  const b = await chromium.launch(); const out = {}; const errs = []; const fail = [];
  const expect = (n, ok) => { if (!ok) fail.push(n); };
  const open = async (rel, dev) => {
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    const tmp = path.join(os.tmpdir(), 'revise_' + rel.replace('/', '_')); fs.writeFileSync(tmp, src);
    const env = makeEnv(); env.ctx.setUp(); const G = /hw-ge-c1-/.test(src) ? 'C1' : 'B2'; env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', G]]);
    const ctx = await b.newContext(dev);
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    await p.goto('file://' + tmp); await p.waitForTimeout(200);
    if (await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(300); }
    return {p, tmp};
  };
  const openTask = async (p, id) => { await p.evaluate(i => document.querySelector(`[data-open="${i}"]`).click(), id); await p.waitForTimeout(150); };
  // ---- gaps: b2/2026-10-23, the clock change chat
  { const {p} = await open('b2/2026-10-23.html', devices['iPhone 13']);
    await openTask(p, 'clocks-text');
    out.gaps = {revBefore: await p.locator('.dlg .rev:visible').count(), hintBefore: await p.locator('.rev-hint').count()};
    for (const k of [0, 2, 4]) await p.locator('.chunk').nth(k).click();
    out.gaps.revAfterOpen = await p.locator('.dlg .rev:visible').count();
    await p.locator('.chunk').nth(0).locator('xpath=following-sibling::button[1]').click();
    await p.locator('.chunk').nth(4).locator('xpath=following-sibling::button[1]').click();
    out.gaps.on = await p.locator('.rev.on').count();
    if (shots) await p.screenshot({path: path.join(shots, 'revise-marks.png')});
    await p.click('#fin'); await p.waitForTimeout(200);
    out.gaps.once = {instr: (await p.locator('.instr').innerText()).split('\n')[0], closed: await p.locator('.chunk:not(.open)').count(), plainOpen: await p.locator('.chunk.open.plain').count(), total: await p.locator('.chunk').count(), revs: await p.locator('.rev.on').count()};
    if (shots) await p.screenshot({path: path.join(shots, 'revise-once-more.png')});
    await p.click('#all'); out.gaps.once.allOpen = await p.locator('.chunk:not(.open)').count() === 0;
    await p.click('#fin'); await p.waitForTimeout(200);
    out.gaps.home = await p.locator('[data-open="clocks-text"]').count() > 0;
    await openTask(p, 'clocks-text');
    out.gaps.reopened = {on: await p.locator('.rev.on').count(), visible: await p.locator('.dlg .rev:visible').count()}; out.gaps.hintAfterReopen = await p.locator('.rev-hint').count();
    expect('no bookmark before a gap is opened', out.gaps.revBefore === 0);
    expect('a bookmark after each opened gap', out.gaps.revAfterOpen === 3);
    expect('the hint until the first bookmark', out.gaps.hintBefore === 1 && out.gaps.hintAfterReopen === 0);
    expect('Once more (2)', /Once more: your bookmarks \(2\)/.test(out.gaps.once.instr) && out.gaps.once.closed === 2 && out.gaps.once.plainOpen === out.gaps.once.total - 2 && out.gaps.once.revs === 2 && out.gaps.once.allOpen);
    expect('marks kept on reopening', out.gaps.reopened.on === 2 && out.gaps.reopened.visible === 2);
    // no marks → Finish goes home as before
    await p.locator('.rev.on').nth(0).click(); await p.locator('.rev.on').nth(0).click();
    await p.click('#fin'); await p.waitForTimeout(200); out.gaps.noMarksHome = await p.locator('[data-open="clocks-text"]').count() > 0;
    expect('no marks → home', out.gaps.noMarksHome);
  }
  // ---- a dlg step with a glossary: c1/2026-10-16, the coffee break chat
  { const {p} = await open('c1/2026-10-16.html', {viewport: {width: 1280, height: 720}});
    await openTask(p, 'coffee-text');
    await p.click('#go'); await p.waitForTimeout(150);   // Show the answers
    out.dlg = {revs: await p.locator('.panel .dlg .rev').count(), chunks: await p.locator('.panel .dlg .chunk').count(), glossRevs: await p.locator('.box .rev').count()};
    await p.locator('.panel .dlg .rev').nth(1).click();
    const steps = await p.evaluate(() => current.steps.length);
    for (let i = 0; i < steps + 2 && !/Once more/.test(await p.locator('.taskbar .count').innerText().catch(() => '')); i++) { await p.click('#go'); await p.waitForTimeout(120); }
    out.dlg.once = {count: await p.locator('.taskbar .count').innerText(), closed: await p.locator('.panel .dlg .chunk:not(.open)').count(), plain: await p.locator('.panel .dlg .chunk.plain').count()};
    if (shots) await p.screenshot({path: path.join(shots, 'revise-dlg-once.png')});
    expect('dlg: a bookmark on every dialogue gap after Show the answers, none in the glossary', out.dlg.revs === out.dlg.chunks && out.dlg.revs > 0 && out.dlg.glossRevs === 0);
    expect('dlg: Once more at the end (engine 33: the step again, only the bookmarked gap closed)', /Once more: your bookmarks · 1 of 1/.test(out.dlg.once.count) && out.dlg.once.closed === 1 && out.dlg.once.plain === out.dlg.chunks - 1);
  }
  out.errors = errs; expect('no page errors', !errs.length);
  console.log(JSON.stringify(out, null, 1)); console.log(fail.length ? 'FAILED: ' + fail.join('; ') : 'OK revise marks');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
