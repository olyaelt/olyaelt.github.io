// engine 62 also (B2 4.11, TZ 2026-11-05_1745, her idea «вначале прочитайте for gist… выбрать одну из двух картинок»): a «read for gist»
// step before the gaps — the whole chat with its gaps shut (they don't open, no notes, no bookmarks), the question, two pictures; the
// wrong one shakes and says why, Next stays off; the right one goes green, says so, and Next leads to the chat with the glossary.
//   node tests/gist_check.js SITE_DIR [SHOTS_DIR]
const {chromium, devices} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch();
  for (const [name, dev] of [['phone', {...devices['iPhone 13'], deviceScaleFactor: 2}], ['laptop', {viewport: {width: 1280, height: 800}, deviceScaleFactor: 2}]]) {
    const ctx = await b.newContext(dev); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('file://' + path.join(site, 'b2/2026-11-04.html')); await p.waitForTimeout(300);
    out.home = await p.evaluate(() => document.querySelector('[data-open="beach"]')?.closest('.task, .card, li, div')?.innerText.replace(/\s+/g, ' ').slice(0, 160));
    await p.evaluate(() => openTask('beach', 0)); await p.waitForTimeout(300);
    const st = () => p.evaluate(() => { const go = document.getElementById('go');
      return {count: document.querySelector('.taskbar .count')?.textContent, instr: document.querySelector('.instr')?.innerText,
        lines: document.querySelectorAll('.dlg.shut p').length, chunks: document.querySelectorAll('.dlg.shut .chunk').length,
        open: document.querySelectorAll('.dlg.shut .chunk.open').length, notes: [...document.querySelectorAll('.gap-n')].filter(n => !n.hidden).length,
        marks: document.querySelectorAll('.dlg .rev, .dlg .mk').length, opts: document.querySelectorAll('.gist-opt').length,
        pics: [...document.querySelectorAll('.gist-opt img')].map(i => i.naturalWidth), ok: document.querySelectorAll('.gist-opt.ok').length,
        no: document.querySelectorAll('.gist-opt.no').length, msg: document.querySelector('.gist-msg')?.textContent || '', goOff: go.disabled, go: go.textContent.trim()}; });
    let s = await st(); out[name + '0'] = s;
    expect(name + ': the whole chat, gaps shut, nothing to open', s.lines === 15 && s.chunks >= 9 && s.open === 0 && s.notes === 0 && s.marks === 0, s);
    expect(name + ': the question on top, two pictures, Next off', /First read the whole chat/.test(s.instr) && /What really happened/.test(s.instr) && s.opts === 2 && s.pics.every(w => w === 1024) && s.goOff, s);
    await p.locator('.dlg.shut .chunk').first().click({force: true}); await p.waitForTimeout(100);
    s = await st(); expect(name + ': a tap on a gap opens nothing', s.open === 0, s);
    if (shots) await p.screenshot({path: path.join(shots, 'gist-' + name + '-top.png')});
    await p.locator('.gist-opt').nth(0).click(); await p.waitForTimeout(120);
    s = await st(); const shake = await p.evaluate(() => !!document.querySelector('.gist-opt.shake')); out[name + 'wrong'] = s;
    expect(name + ': the thief: shakes, «Not quite», Next still off', s.no === 1 && shake && /Not quite/.test(s.msg) && s.goOff, {s, shake});
    if (shots) { await p.waitForTimeout(500); await p.locator('.gist-opts').scrollIntoViewIfNeeded(); await p.screenshot({path: path.join(shots, 'gist-' + name + '-wrong.png')}); }
    await p.locator('.gist-opt').nth(1).click(); await p.waitForTimeout(400);
    s = await st(); out[name + 'right'] = s;
    expect(name + ': the seagulls: green, «Yes!», Next on', s.ok === 1 && s.no === 0 && /^Yes!/.test(s.msg) && !s.goOff && s.go === 'Next', s);
    if (shots) await p.screenshot({path: path.join(shots, 'gist-' + name + '-right.png')});
    await p.click('#go'); await p.waitForTimeout(300);
    out[name + 'next'] = await p.evaluate(() => ({count: document.querySelector('.taskbar .count')?.textContent, gloss: !!document.querySelector('aside.gloss'), chunks: document.querySelectorAll('.panel .dlg .chunk').length}));
    expect(name + ': Next → the chat with the glossary', out[name + 'next'].gloss && out[name + 'next'].chunks > 0, out[name + 'next']);
    await p.click('#prev'); await p.waitForTimeout(300); s = await st();
    expect(name + ': Back to it: the gaps still shut', s.open === 0 && s.lines === 15, s);
    await ctx.close();
  }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK gist'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
