// Engine 44: a long gapped text on a small screen shows "↓ More below" over the buttons until its last line has been on screen
// (her worry 29.10: they tap "Show the answers" and never see the second half); a tap scrolls on; a text that fits shows nothing.
//   node tests/more_below_check.js SITE_DIR/c1/2026-10-28.html [shots_dir]   (task e1: the group chat, five screens)
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const file = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const chip = p => p.evaluate(() => { const c = document.querySelector('.more-below'); return c ? !c.hidden : null; });
  // a laptop: every screen of e1 fits, no chip; 8 gap boxes over the five screens
  { const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file); await p.waitForTimeout(300); await p.click('[data-open="e1"]'); await p.waitForTimeout(300);
    const n = await p.evaluate(() => current.steps.length); const per = [];
    for (let k = 0; k < n; k++) { per.push({chip: await chip(p), gaps: await p.evaluate(() => document.querySelectorAll('.panel .dlg .chunk').length),
      intro: await p.evaluate(() => (document.querySelector('.situation') || {}).textContent || '')});
      if (shots && k === 0) await p.screenshot({path: path.join(shots, 'e1-laptop-1.png')});
      if (k < n - 1) { await p.click('#go'); await p.waitForTimeout(150); await p.click('#go'); await p.waitForTimeout(250); } }
    out.laptop = per;
    expect('five screens, 8 gap boxes, no chip on a laptop', n === 5 && per.reduce((s, x) => s + x.gaps, 0) === 8 && per.every(x => x.chip === false), per);
    expect('part 2 starts with "Later that evening"', /Later that evening/.test(per[3].intro), per[3]);
    await ctx.close(); }
  // a phone: the first screen is longer than the screen → the chip; a tap scrolls; at the end it goes; Show the answers still works
  { const ctx = await b.newContext({...devices['iPhone 13']}); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + file); await p.waitForTimeout(300); await p.click('[data-open="e1"]'); await p.waitForTimeout(300);
    out.phoneStart = await chip(p); expect('phone: chip at first', out.phoneStart === true, out.phoneStart);
    if (shots) await p.screenshot({path: path.join(shots, 'e1-phone-chip.png')});
    const y0 = await p.evaluate(() => scrollY); await p.click('.more-below'); await p.waitForTimeout(700);
    const y1 = await p.evaluate(() => scrollY); out.scrolled = y1 - y0; expect('a tap scrolls on', y1 > y0, {y0, y1});
    for (let i = 0; i < 6 && await chip(p); i++) { await p.evaluate(() => { const c = document.querySelector('.more-below'); if (c && !c.hidden) c.click(); }); await p.waitForTimeout(800); }
    out.phoneEnd = await chip(p); expect('chip gone once the end is on screen', out.phoneEnd === false, out.phoneEnd);
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); out.afterTop = await chip(p); expect('it stays gone', out.afterTop === false, out.afterTop);
    await p.click('#go'); await p.waitForTimeout(300); out.checked = await p.evaluate(() => document.querySelectorAll('.panel .dlg .chunk.open').length);
    expect('Show the answers still opens the gaps', out.checked > 0, out.checked);
    await ctx.close(); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK more below'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
