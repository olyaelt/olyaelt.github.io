// Engine 56 / tools 21 (her 1.11 07:38): the site is light for everyone by default, also on a device set to dark; "🌙 Dark theme" at the
// bottom beside Impressum · Datenschutz switches the whole site to dark on this device (kept after a reload and on the other pages);
// "☀️ Light theme" brings it back.
//   node tests/theme_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => {
  const site = path.resolve(process.argv[2]);
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}, colorScheme: 'dark'}); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const look = () => p.evaluate(() => ({theme: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.body).backgroundColor, btn: (document.querySelector('.theme-tg') || {}).textContent || ''}));
  const dark = c => { const m = c.match(/\d+/g).map(Number); return m[0] + m[1] + m[2] < 200; };
  const pages = ['index.html', 'b2/index.html', 'b2/2026-10-28.html', 'tools/b2-2026-10-30/f-wc.html', 'tools/b2-2026-10-30/jeopardy.html', 'tools/c1-2026-11-04/practical-things.html'];
  for (const pg of pages) { await p.goto(base + pg); await p.waitForTimeout(250); const v = await look(); out[pg] = v;
    expect(pg + ': light on a dark device, with 🌙 Dark theme at the bottom', v.theme === 'light' && !dark(v.bg) && /Dark theme/.test(v.btn), v); }
  await p.goto(base + 'b2/2026-10-28.html'); await p.waitForTimeout(250); await p.click('.theme-tg'); await p.waitForTimeout(100);
  let v = await look(); expect('🌙 → dark, the button says Light theme', v.theme === 'dark' && dark(v.bg) && /Light theme/.test(v.btn), v);
  await p.reload(); await p.waitForTimeout(250); v = await look(); expect('kept after a reload', v.theme === 'dark' && dark(v.bg), v);
  await p.goto(base + 'tools/b2-2026-10-30/f-wc.html'); await p.waitForTimeout(250); v = await look(); expect('and on the other pages of the site', v.theme === 'dark' && dark(v.bg), v);
  await p.click('.theme-tg'); await p.waitForTimeout(100); v = await look(); expect('☀️ → light again', v.theme === 'light' && !dark(v.bg), v);
  const ctx2 = await b.newContext({viewport: {width: 1280, height: 720}, colorScheme: 'light'}); const q = await ctx2.newPage();
  await q.goto(base + 'b2/2026-10-28.html'); await q.waitForTimeout(250);
  const w = await q.evaluate(() => document.documentElement.getAttribute('data-theme')); expect('a light device: light', w === 'light', w);
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK theme'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
