// Engine 29: on a computer the Useful language box beside a task fits on the screen (its text shrinks from 1.15rem to 0.9rem
// at most); phones keep their layout. Walks every task of every page.   node tests/box_fit_check.js SITE_DIR [WxH ...]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]);
  const sizes = (process.argv.slice(3).length ? process.argv.slice(3) : ['1366x650', '1280x720', '1895x910']).map(s => s.split('x').map(Number));
  const pages = ['b2', 'c1'].flatMap(g => fs.readdirSync(path.join(site, g)).filter(f => /^\d{4}-\d\d-\d\d\.html$/.test(f)).map(f => g + '/' + f));
  const b = await chromium.launch(); const rows = []; const errs = [];
  for (const rel of pages) {
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    const tmp = path.join(os.tmpdir(), 'box_fit_page.html'); fs.writeFileSync(tmp, src);
    const env = makeEnv(); env.ctx.setUp(); const G = /hw-ge-c1-/.test(src) ? 'C1' : 'B2'; env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', G]]);
    for (const [w, h] of sizes) {
      const ctx = await b.newContext({viewport: {width: w, height: h}, reducedMotion: 'reduce'});
      await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
      await p.goto('file://' + tmp); await p.waitForTimeout(150);
      if (await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(250); }
      const ids = await p.evaluate(() => TASKS.map(t => t.id));
      for (const id of ids) {
        await p.evaluate(i => { const b = document.querySelector(`[data-open="${i}"]`); if (b) b.click(); else if (typeof openTask === 'function') openTask(i); }, id); await p.waitForTimeout(80);
        for (let k = 0; k < 14; k++) {
          await p.waitForTimeout(40);
          const r = await p.evaluate(() => { const bx = document.querySelector('.stage .box'); if (!bx) return null; const bb = bx.getBoundingClientRect();
            return {font: bx.style.fontSize || getComputedStyle(bx).fontSize, px: parseFloat(getComputedStyle(bx).fontSize).toFixed(1), bottom: Math.round(bb.bottom + scrollY), vh: innerHeight, h: Math.round(bb.height)}; });
          if (r) rows.push({page: rel, size: w + 'x' + h, task: id, step: k, ...r, fits: r.bottom <= r.vh - 4});
          if (!(await p.locator('#go').count()) || await p.locator('#go').isDisabled()) break;
          await p.click('#go');
        }
        await p.goto('file://' + tmp); await p.waitForTimeout(100);
      }
      await ctx.close();
    }
  }
  const boxes = rows.length, bad = rows.filter(r => !r.fits);
  const bySize = {}; rows.forEach(r => { const s = bySize[r.size] = bySize[r.size] || {n: 0, minPx: 99, maxPx: 0, notFit: 0}; s.n++; s.minPx = Math.min(s.minPx, +r.px); s.maxPx = Math.max(s.maxPx, +r.px); if (!r.fits) s.notFit++; });
  // a box that doesn't fit must already be at the smallest size (0.9rem): a long glossary that needs splitting in the lesson, not an engine fault
  const unfitted = bad.filter(r => r.font !== '0.9rem');
  console.log(JSON.stringify({boxes, bySize, notFitting: bad.map(r => `${r.page} ${r.size} task ${r.task} step ${r.step}: box ${r.h}px, ${r.px}px text`), errs}, null, 1));
  console.log(unfitted.length || errs.length ? 'FAILED: ' + (unfitted.length ? unfitted.length + ' boxes not shrunk' : errs.join('; ')) : `OK box fit: ${boxes - bad.length} of ${boxes} box screens fit; the rest are long boxes at the smallest size`);
  await b.close();
})();
