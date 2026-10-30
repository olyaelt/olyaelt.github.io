// Box phrases the groups ticked (her 30.10 18:45): on every -live page a tick goes to her table (Lesson signals, kind "box", latest wins);
// on her screen each phrase shows "👥 n" = screens with it ticked now (this lesson). Her own ticks are not sent.
//   node tests/box_ticks_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), out = {}, errs = [], fail = [];
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'C1', '']);
  const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2'};
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const pages = ['tools/c1-schools/cards-1-live.html', 'tools/b2-2026-10-30/f-crime-live.html'], orig = {};
  pages.forEach(rel => { const fp = path.join(site, rel); orig[fp] = fs.readFileSync(fp, 'utf8'); fs.writeFileSync(fp, orig[fp].replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`)); });
  const b = await chromium.launch();
  const open = async (rel, who) => {
    const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    else await c.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-role', ''); });
    await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    await p.goto(base + rel); await p.waitForTimeout(500); return p;
  };
  const sig = () => (env.sheets['Lesson signals'] ? env.sheets['Lesson signals'].d.slice(1) : []).filter(r => r[3] === 'box').map(r => [r[1], r[4], String(r[5])]);
  try {
    for (const rel of pages) {
      const A = await open(rel, 'anna'); const B = await open(rel, 'anna2');
      const toBox = p => p.evaluate(() => { goBlock(3, D.stages[3].blocks.findIndex(x => x.kind === 'scenes')); S.intro = false; render(); });   // Maple Road: the NEWS box
      if (/f-crime/.test(rel)) for (const p of [A, B]) await toBox(p);
      const ph = A.locator('aside.box [data-ph]');
      await ph.nth(0).click(); await ph.nth(1).click(); await ph.nth(1).click(); await A.waitForTimeout(400);   // ticks 0, ticks and unticks 1
      await B.locator('aside.box [data-ph]').nth(0).click(); await B.waitForTimeout(400);
      const O = await open(rel, 'teacher'); if (/f-crime/.test(rel)) await toBox(O);
      await O.locator('aside.box [data-ph]').nth(2).click(); await O.waitForTimeout(2600);   // her own tick: not sent
      if (process.argv[3]) await O.screenshot({path: path.join(process.argv[3], 'box-ticks-' + path.basename(rel, '.html') + '.png')});
      const tool = rel.replace(/^tools\//, '').replace(/-live\.html$/, '');
      out[tool] = {rows: sig().filter(r => r[0] === tool).length, chips: await O.locator('aside.box [data-ph] .ph-n').allInnerTexts(),
        first: await O.locator('aside.box [data-ph]').nth(0).locator('.ph-n').innerText().catch(() => ''), second: await O.locator('aside.box [data-ph]').nth(1).locator('.ph-n').count(),
        studentChips: await A.locator('.ph-n').count()};
      expect(tool + ': ticks reach her table (latest wins), her screen shows 👥 2 on the first phrase only, students see no counts, her tick not sent',
        out[tool].rows === 3 && out[tool].first === '👥 2' && out[tool].chips.length === 1 && out[tool].second === 0 && out[tool].studentChips === 0, out[tool]);
    }
  } finally { Object.entries(orig).forEach(([fp, s]) => fs.writeFileSync(fp, s)); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK box ticks'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
