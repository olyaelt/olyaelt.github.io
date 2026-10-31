// Engine 33: a bookmark on every practice item (rewrite, say it, share, listening lines, look back; gaps and dlg since 30/32),
// then "Once more: your bookmarks" — only the bookmarked steps, each with only its bookmarked items; no "?" there;
// bookmarks kept when the task is reopened.   node tests/bookmarks_check.js SITE_DIR [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3];
  const b = await chromium.launch(); const out = {}; const errs = []; const fail = []; const expect = (n, ok) => { if (!ok) fail.push(n); };
  const open = async rel => {
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    const tmp = path.join(os.tmpdir(), 'bm_' + rel.replace('/', '_')); fs.writeFileSync(tmp, src);
    const env = makeEnv(); env.ctx.setUp(); const G = /hw-ge-c1-/.test(src) ? 'C1' : 'B2'; env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', G]]);
    const ctx = await b.newContext({...devices['iPhone 13'], reducedMotion: 'reduce'});
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    await p.goto('file://' + tmp); await p.waitForTimeout(200);
    if (await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(300); }
    return p;
  };
  const openTask = async (p, id) => { await p.evaluate(i => document.querySelector(`[data-open="${i}"]`).click(), id); await p.waitForTimeout(150); };
  const goText = p => p.locator('#go').innerText();
  const count = p => p.locator('.taskbar .count').innerText().catch(() => '');
  // walk a task: on each step check, then call onChecked(stepIdx, type); stop after the last Finish
  const walk = async (p, onChecked) => {
    for (let guard = 0; guard < 80; guard++) {
      if (!(await p.locator('#go').count())) return;
      const t = (await goText(p)).trim();
      if (!/^(Next|Finish)$/.test(t)) { await p.click('#go'); await p.waitForTimeout(80); continue; }
      const info = await p.evaluate(() => ({s: stepIdx, type: current.steps[stepIdx].type, once: !!current._once}));
      if (onChecked) await onChecked(info);
      await p.click('#go'); await p.waitForTimeout(100);
      if (t === 'Finish') return;
    }
  };
  // ---- rewrite + say it (b2 23.10, "Rewrite and say it")
  { const p = await open('b2/2026-10-23.html');
    await openTask(p, 'clocks-practice');
    let sayDone = false;
    await walk(p, async ({s, type}) => {
      if (type === 'rewrite' && s === 0) await p.locator('.target .rev').click();
      if (type === 'sayit' && !sayDone) { await p.locator('.say-a .rev').nth(1).click(); sayDone = true; if (shots) await p.screenshot({path: path.join(shots, 'bm-sayit.png')}); }
    });
    out.rs = {count1: await count(p), rw: await p.locator('#rw').count(), mk: await p.locator('.mk').count()};
    if (shots) await p.screenshot({path: path.join(shots, 'bm-once-rewrite.png')});
    await p.click('#go'); await p.waitForTimeout(80);   // check
    out.rs.revOnInOnce = await p.locator('.target .rev.on').count();
    await p.click('#go'); await p.waitForTimeout(100);  // next
    out.rs.count2 = await count(p); out.rs.sayRows = await p.locator('.say-row').count();
    await walk(p);
    out.rs.home = await p.locator('[data-open="clocks-practice"]').count() > 0;
    // engine 51: a finished task reopens on its last screen, answered — Back to screen 1, its answer and bookmark shown
    await openTask(p, 'clocks-practice'); await p.waitForTimeout(80);
    for (let k = 0; k < 12 && await p.evaluate(() => stepIdx) > 0; k++) { await p.click('#prev'); await p.waitForTimeout(60); }
    out.rs.kept = await p.locator('.target .rev.on').count();
    expect('rewrite + say it: Once more = 2 steps, the say-it step with its one bookmarked row, no "?"',
      /Once more: your bookmarks · 1 of 2/.test(out.rs.count1) && out.rs.rw === 1 && out.rs.mk === 0 && out.rs.revOnInOnce === 1 && /2 of 2/.test(out.rs.count2) && out.rs.sayRows === 1 && out.rs.home);
    expect('rewrite: bookmark kept on reopening', out.rs.kept === 1);
  }
  // ---- share + look back (b2 23.10, "Share your reaction and ask")
  { const p = await open('b2/2026-10-23.html');
    await openTask(p, 'share-ask');
    await walk(p, async ({s, type}) => {
      if (type === 'share' && s === 1) { await p.locator('.mk-row .rev').click(); if (shots) await p.screenshot({path: path.join(shots, 'bm-share.png')}); }
      if (type === 'lookback') await p.locator('.lb-item .rev').nth(2).click();
    });
    out.sl = {count1: await count(p), bubbles: await p.locator('.turn.b').count()};
    await walk(p, async ({type}) => { if (type === 'lookback') out.sl.lbItems = await p.locator('.lb-item').count(); });
    expect('share + look back: Once more = the bookmarked share step and one look-back item', /1 of 2/.test(out.sl.count1) && out.sl.lbItems === 1);
  }
  // ---- listening lines (b2 23.10, tq1)
  { const p = await open('b2/2026-10-23.html');
    await openTask(p, 'tq1');
    out.li = {};
    let done = false;
    await walk(p, async ({s, type}) => {
      if (type === 'listen' && !done) { out.li.lineRevs = await p.locator('.ln.has-gap .rev').count(); out.li.gapsTotal = await p.evaluate(() => current.steps[stepIdx].clip.flatMap(l => l[3].filter(x => typeof x !== 'string')).length);
        await p.locator('.ln.has-gap .rev').first().click(); done = true; if (shots) await p.screenshot({path: path.join(shots, 'bm-listen.png')}); }
    });
    out.li.count = await count(p); out.li.inputs = await p.locator('.gap-in').count(); out.li.lines = await p.locator('.ln').count();
    expect('listening: a bookmark on each line with a gap; Once more keeps only that line\'s gaps', out.li.lineRevs >= 1 && /1 of 1/.test(out.li.count) && out.li.inputs >= 1 && out.li.inputs <= out.li.gapsTotal);
  }
  out.errors = errs; expect('no page errors', !errs.length);
  console.log(JSON.stringify(out, null, 1)); console.log(fail.length ? 'FAILED: ' + fail.join('; ') : 'OK bookmarks');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
