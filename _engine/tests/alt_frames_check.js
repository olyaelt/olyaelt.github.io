// tools 28 also (C1 6.11, TZ 2026-11-06_0800, request 2): a picture not drawn yet shows its alt text in light-grey frames — the six-in-one
// as six numbered frames, each scene as one frame, «🖼 All six pictures» on the look-back button; and «💬 Your turn» on a `say` card.
//   node tests/alt_frames_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const p = await (await b.newContext({viewport: {width: 1280, height: 720}})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(site, 'tools/c1-2026-11-06/has-it-changed.html');
  const fs = require('fs'); const drawn = fs.existsSync(path.join(site, 'tools/c1-2026-11-06/then-now-1.jpg'));
  await p.goto(url + '#part-4-screen-1'); await p.waitForTimeout(500);
  out.grid = await p.evaluate(() => ({frames: [...document.querySelectorAll('#main .alt-grid .alt-f')].map(f => f.querySelector('b').textContent), broken: [...document.querySelectorAll('#main img')].filter(i => i.complete && !i.naturalWidth).length,
    inMain: [...document.querySelectorAll('#main .alt-f')].every(f => f.getBoundingClientRect().right <= document.querySelector('#main').getBoundingClientRect().right + 1), timer: !!document.querySelector('[data-ptimer]')}));
  if (!drawn) expect('the six-in-one not drawn yet: six numbered frames, inside the page, ⏱ there', out.grid.frames.join('') === '123456' && out.grid.inMain && out.grid.timer && out.grid.broken === 0, out.grid);
  await p.goto(url + '#part-4-screen-2'); await p.waitForTimeout(500);
  out.scene = await p.evaluate(() => ({frame: document.querySelector('figure.scn .alt-f')?.textContent.trim(), btn: document.querySelector('[data-peek]')?.textContent.trim()}));
  if (!drawn) expect('a scene not drawn yet: its alt text in a frame', /Asakusa/.test(out.scene.frame || ''), out.scene);
  expect('«🖼 All six pictures»', out.scene.btn === '🖼 All six pictures', out.scene);
  // v2 (13:55): the warm-up photo not there yet → one frame with its alt text; 💬 Your turn is in c1_hic2_check.js now
  const copley = fs.existsSync(path.join(site, 'tools/c1-2026-11-06/copley-square-then-now.jpg'));
  await p.goto(url + '#part-1-screen-1'); await p.waitForTimeout(500);
  out.warm = await p.evaluate(() => (document.querySelector('#main .alt-f.one') || {}).textContent || '');
  if (!copley) expect('the warm-up photo not there yet: one frame with its alt text', /Copley Square/.test(out.warm), out.warm);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK alt frames'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
