// tools 30 also (her 07.11 12:00: «когда заходишь в класс материалов… не вернуться обратно»): the homework's 📂 Class materials link opens
// the class page with ?hw=…, and the class page's «⬅ Homework» leads back to that homework; opened on its own it offers «⬅ All homework».
// The full lesson pages have no such link.   node tests/class_back_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const http = require('http'); const fs = require('fs');
(async () => {
  const root = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg'};
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': types[path.extname(f)] || 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const port = srv.address().port, b = await chromium.launch();
  for (const [g, d] of [['b2', '2026-11-06'], ['c1', '2026-11-06'], ['c1', '2026-11-04']]) {
    const p = await (await b.newContext({viewport: {width: 400, height: 860}})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/${g}/${d}.html`); await p.waitForTimeout(400);
    await p.click('.cm-peek summary'); await p.waitForTimeout(150);
    const href = await p.getAttribute('.cm-peek a.cm-lk', 'href'); expect(`${g} ${d}: the link carries ?hw=`, /-class\.html\?hw=/.test(href) && href.includes(`hw=${g}/${d}`), href);
    await p.click('.cm-peek a.cm-lk'); await p.waitForLoadState('load'); await p.waitForTimeout(400);
    const bk = await p.evaluate(() => { const a = document.querySelector('header .board-top'); return a ? {t: a.textContent.trim(), h: a.getAttribute('href')} : null; });
    expect(`${g} ${d}: «⬅ Homework» on the class page`, bk && /Homework/.test(bk.t), bk);
    if (bk) { await p.click('header .board-top'); await p.waitForLoadState('load'); await p.waitForTimeout(300);
      out[`${g}-${d}`] = new URL(p.url()).pathname; expect(`${g} ${d}: back on the homework`, out[`${g}-${d}`] === `/${g}/${d}.html`, p.url()); }
    await p.context().close(); }
  const p = await (await b.newContext()).newPage();
  await p.goto(`http://localhost:${port}/tools/b2-2026-11-06/stages-of-life-class.html`); await p.waitForTimeout(300);
  out.alone = await p.evaluate(() => { const a = document.querySelector('header .board-top'); return a ? a.textContent.trim() + ' ' + a.getAttribute('href') : null; });
  expect('opened on its own: «⬅ All homework» → the group list', /All homework ..\/..\/b2\/index\.html/.test(out.alone || ''), out.alone);
  await p.goto(`http://localhost:${port}/tools/b2-2026-11-06/stages-of-life.html`); await p.waitForTimeout(300);
  out.full = await p.evaluate(() => !!document.querySelector('header .board-top')); expect('the full lesson page: no link', out.full === false, out.full);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK class page leads back'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
