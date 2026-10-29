// tools 11: the dice-situations type (B2 «Any recommendations?», 30.10.26).
//   node tests/situations_check.js SITE_DIR [shots_dir]    (serves SITE_DIR on a local port)
// Roll → three dice + the situation sentence; Done → the example for that need × answer opens by itself; 18 rolls = all 18 pairs, no repeats,
// then a new bag; every pair with its example open fits on 1280×720; Speaking and back; phone without sideways scrolling; dark mode;
// the live page with her code shows her tools; no page errors.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/recommend-dice';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const page = async (opts = {}) => { const ctx = await b.newContext(opts.ctx || {viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    if (opts.init) await ctx.addInitScript(opts.init); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + PAGE + (opts.live ? '-live' : '') + '.html'); await p.waitForTimeout(250); return p; };
  { const p = await page();
    out.before = await p.evaluate(() => ({dice: document.querySelectorAll('[data-die] .die').length, roll: !!document.querySelector('[data-roll]'), sit: !!document.querySelector('.sit')}));
    expect('start: three blank dice and Roll', out.before.dice === 3 && out.before.roll && !out.before.sit, out.before);
    const pairs = new Set(); let fitMax = 0;
    for (let k = 0; k < 18; k++) {
      await p.click('[data-roll]'); await p.waitForTimeout(60);
      const v = await p.evaluate(() => ({need: S.cur.need, type: S.cur.type, faces: S.cur.faces, sit: document.querySelector('.sit .who').textContent, how: document.querySelector('.sit .how').textContent,
        count: document.querySelector('.sit-count').textContent}));
      if (k === 0) out.first = v;
      expect('roll ' + k + ': die 3 matches the answer type', ({R: [1, 2], W: [3, 4], D: [5, 6]})[v.type].includes(v.faces[2]) && v.faces[1] === v.need + 1, v);
      pairs.add(v.need + v.type);
      await p.click('[data-done]'); await p.waitForTimeout(60);
      const ex = await p.evaluate(() => { const e = document.querySelector('.ex-step'); return {open: !!e, b: e ? e.querySelector('p.b').textContent : '', want: D.examples[S.cur.need][S.cur.type].b.replace(/\*\*/g, ''),
        bottom: e ? Math.round(e.getBoundingClientRect().bottom + scrollY) : 0}; });
      expect('Done opens the matching example', ex.open && ex.b.replace(/^B:/, '').trim() === ex.want, ex);
      fitMax = Math.max(fitMax, ex.bottom);
    }
    out.pairs = pairs.size; out.fitMax = fitMax;
    expect('18 rolls = 18 different pairs', pairs.size === 18, pairs.size);
    expect('every situation with its example fits on 1280×720', fitMax <= 720, fitMax);
    await p.click('[data-roll]'); await p.waitForTimeout(60); out.bag19 = await p.evaluate(() => ({count: document.querySelector('.sit-count').textContent, left: S.bag.length}));
    expect('then a new bag', out.bag19.count === '1 of 18' && out.bag19.left === 17, out.bag19);
    out.box = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom)); expect('box whole on 720', out.box <= 720, out.box);
    await p.click('[data-ex]'); await p.waitForTimeout(60); await p.click('[data-ex-hide]'); expect('hide closes the example', await p.locator('.ex-step').count() === 0, 'still open');
    await p.click('[data-stage="speak"]'); await p.waitForTimeout(80); out.speak = await p.locator('.speak-task').innerText();
    expect('speaking stage', /two things/.test(out.speak), out.speak);
    await p.click('[data-stage="roll"]'); await p.waitForTimeout(80); out.back = await p.evaluate(() => !!document.querySelector('.sit'));
    expect('back to the situation it was on', out.back, out.back);
    if (shots) await p.screenshot({path: path.join(shots, 'situations.png')}); }
  { const p = await page({ctx: {...devices['iPhone 13']}}); await p.click('[data-roll]'); await p.click('[data-done]');
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth})); expect('phone: no sideways scroll', out.phone.w <= out.phone.vw, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'situations-phone.png'), fullPage: true}); }
  { const p = await page({scheme: 'dark'}); await p.click('[data-roll]'); await p.click('[data-done]'); if (shots) await p.screenshot({path: path.join(shots, 'situations-dark.png')}); }
  { const p = await page({live: true, init: () => { localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('hw-code', 'T-TEST'); }});
    await p.click('[data-roll]'); await p.click('[data-done]');
    out.live = await p.evaluate(() => ({bar: !!document.querySelector('.live-bar'), tools: document.querySelectorAll('.live-tools').length}));
    expect('live page: her bar and tools', out.live.bar && out.live.tools >= 4, out.live); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK situations'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
