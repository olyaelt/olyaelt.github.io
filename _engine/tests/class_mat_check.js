// engine 62 (her 4.11 09:44: «кликаешь по домашке, и там появляется наверху совсем тоненькая Class materials… одна»): a homework page whose
// page.json has "class" shows one thin fold «📂 Class materials · dd.mm ▸ Open» under its heading, closed; open: the topics of that class,
// each to its lesson page when there is one (a topic without a page is quiet, not a link), then «The same lesson on Google Slides» when
// given. No link at all → no fold. Pages without "class" (the list, her own pages) don't change.
//   node tests/class_mat_check.js SITE_DIR
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', 'B2']]);
  const b = await chromium.launch();
  const open = async (page, dev = devices['iPhone 13']) => {
    const src = fs.readFileSync(path.join(site, page), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
    const tmp = path.join(path.dirname(path.join(site, page)), '_cm_' + path.basename(page)); fs.writeFileSync(tmp, src);
    const ctx = await b.newContext(dev);
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(page + ': ' + e.message));
    await p.goto('file://' + tmp); await p.waitForTimeout(250);
    if (await p.locator('#code').count()) { await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(500); }
    p._tmp = tmp; return p; };
  const close = async p => { fs.unlinkSync(p._tmp); await p.context().close(); };
  const fold = p => p.evaluate(() => { const d = document.querySelector('.cm-peek'); if (!d) return null; const r = d.getBoundingClientRect(), h = document.querySelector('.lesson-head').getBoundingClientRect();
    return {open: d.open, n: document.querySelectorAll('.cm-peek').length, h: Math.round(r.height), underHead: r.top >= h.bottom - 1 && r.top - h.bottom < 40,
      sum: d.querySelector('summary').textContent.replace(/\s+/g, ' ').trim(),
      items: [...d.querySelectorAll('.cm-in .cm-lk')].map(a => ({t: a.textContent.replace('→', '').trim(), href: a.getAttribute('href'), link: a.tagName === 'A'})),
      slides: (d.querySelector('.cm-gs a') || {}).href || '', openShown: getComputedStyle(d.querySelector('.cm-open')).display !== 'none'}; });

  let p = await open('b2/2026-10-28.html');
  out.f28 = await fold(p);
  expect('28.10: one thin fold under the heading, closed', out.f28 && out.f28.n === 1 && !out.f28.open && out.f28.h <= 52 && out.f28.underHead && /Class materials\s*· 28\.10\s*▸ Open/.test(out.f28.sum), out.f28);
  await p.click('.cm-peek summary'); await p.waitForTimeout(80); out.f28o = await fold(p);
  expect('28.10 open: its lesson page, a link', out.f28o.open && out.f28o.items.length === 1 && out.f28o.items[0].link && out.f28o.items[0].href === '../tools/b2-2026-10-28/have-you-seen-it.html' && !out.f28o.openShown, out.f28o);
  await p.click('.cm-lk'); await p.waitForTimeout(300); out.nav = p.url();
  expect('tapping it opens the lesson page', /tools\/b2-2026-10-28\/have-you-seen-it\.html$/.test(out.nav), out.nav);
  await close(p);

  p = await open('b2/2026-10-30.html'); await p.click('.cm-peek summary'); await p.waitForTimeout(80); out.f30 = await fold(p);
  expect('30.10: two topics as in class — the revision game a link, the other quiet (no page yet)', out.f30.items.length === 2 && out.f30.items[0].link && /f-clocks\.html$/.test(out.f30.items[0].href) && !out.f30.items[1].link && /So you wouldn't recommend it\?/.test(out.f30.items[1].t), out.f30);
  out.off = await p.evaluate(() => { const x = document.querySelector('.cm-lk.off'); return x ? getComputedStyle(x).borderTopStyle : ''; });
  expect('the topic without a page doesn\'t look like a button', out.off === 'dashed', out.off);
  // a Google Slides link, when page.json gives one (here put in by hand)
  out.gs = await p.evaluate(() => { CLASS_MAT.slides = 'https://docs.google.com/presentation/d/TEST/view'; document.querySelector('.cm-peek').outerHTML = classHTML(); document.querySelector('.cm-peek').open = true;
    const a = document.querySelector('.cm-gs a'); return a ? {t: a.parentElement.textContent.trim(), href: a.href, target: a.target} : null; });
  expect('slides: «The same lesson on Google Slides», a new tab', out.gs && /The same lesson on Google Slides/.test(out.gs.t) && out.gs.target === '_blank', out.gs);
  out.bad = await p.evaluate(() => { CLASS_MAT.slides = 'javascript:alert(1)'; CLASS_MAT.topics = [{t: 'x', href: 'javascript:alert(1)'}]; return classHTML(); });
  expect('nothing but https / site links', out.bad === '', out.bad);
  await close(p);

  p = await open('b2/2026-10-23.html'); out.f23 = await fold(p);
  expect('23.10: topics but nothing to link yet → no fold', out.f23 === null, out.f23); await close(p);
  p = await open('b2/2026-10-16.html'); out.f16 = await fold(p);
  expect('a page without "class" → no fold', out.f16 === null, out.f16); await close(p);
  p = await open('b2/2026-10-28.html', {viewport: {width: 1280, height: 720}}); out.lap = await fold(p);
  expect('on a computer: one line too', out.lap && out.lap.h <= 52, out.lap); await close(p);

  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK class materials fold'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
