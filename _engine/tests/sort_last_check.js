// tools 30 also (her 7.11 15:11, C1 06.11 class view): a sort that is the page's last block — Next goes through all its items to the summary.
//   node tests/sort_last_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [];
  const b = await chromium.launch(); const p = await (await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'})).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, 'tools/c1-2026-11-06/has-it-changed-class.html')); await p.waitForTimeout(500);
  await p.click('text=Practice'); await p.waitForTimeout(300);
  for (let i = 0; i < 8; i++) { if (await p.evaluate(() => /put it in its box/.test(document.body.innerText))) break; await p.click('[data-step]'); await p.waitForTimeout(300); }
  const seen = new Set(); let k = 0;
  for (; k < 90; k++) { const s = await p.evaluate(() => ({c: (document.body.innerText.match(/\d+ of 15/) || [''])[0], dis: document.querySelector('[data-step]').disabled}));
    if (s.c) seen.add(s.c); if (s.dis) break; await p.click('[data-step]'); await p.waitForTimeout(250); }
  const end = await p.evaluate(() => document.querySelectorAll('.fs-pat li, .fs-pat .fs-done, .fs-sum li').length);
  if (seen.size !== 15) fail.push('the class view sort shows ' + seen.size + ' of 15 items');
  if (!(await p.evaluate(() => /Do it again/.test(document.body.innerText)))) fail.push('no summary screen at the end');
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(JSON.stringify({items: seen.size, taps: k, listed: end}));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK sort as the last block'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
