// engine 51 (her 31.10): a finished task opens as it was left (its last screen, answers shown) with «✓ Done · ↺ Do it again · 🔖 Your
// bookmarks again»; ↺ beside its tick at home; an unfinished task opens where they stopped; Back on the first screen = all tasks.
//   node tests/again_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'b2/2026-10-30.html';
(async () => {
  const site = path.resolve(process.argv[2]);
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const p = await (await b.newContext({viewport: {width: 400, height: 860}})).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.emulateMedia({reducedMotion: 'reduce'}); await p.goto(base + PAGE); await p.waitForTimeout(400);
  const where = () => p.evaluate(() => current ? {id: current.id, step: stepIdx, review: !!current._review, checked, bar: (document.querySelector('.again-bar') || {}).innerText || '', home: false} : {home: true});
  // Back on the first screen → all tasks
  await p.click('[data-open="rewrite"]'); await p.waitForTimeout(150);
  out.firstBack = await p.evaluate(() => !document.getElementById('prev').disabled); await p.click('#prev'); await p.waitForTimeout(150);
  out.afterBack = await p.evaluate(() => !!document.querySelector('[data-open="rewrite"]') && !document.querySelector('.taskbar'));
  expect('Back on the first screen is on and goes to all tasks', out.firstBack && out.afterBack, out);
  // unfinished: where they stopped
  await p.click('[data-open="rewrite"]'); await p.waitForTimeout(150);
  await p.fill('#rw', 'Could we make it Thursday'); await p.click('#go'); await p.waitForTimeout(100); await p.click('#go'); await p.waitForTimeout(100);   // step 2
  await p.click('#home'); await p.waitForTimeout(100); await p.click('[data-open="rewrite"]'); await p.waitForTimeout(150); out.resume = await where();
  expect('an unfinished task opens where they stopped', out.resume.step === 1 && !out.resume.review, out.resume);
  // finish it, with a bookmark on step 2
  await p.click('#go'); await p.waitForTimeout(100); await p.locator('.rev:not(.demo)').first().click().catch(() => {}); await p.click('#go'); await p.waitForTimeout(100);
  for (let k = 0; k < 2; k++) { await p.click('#go'); await p.waitForTimeout(100); await p.click('#go'); await p.waitForTimeout(100); }
  await p.waitForTimeout(300); if (await p.locator('#list').count()) { await p.click('#list'); await p.waitForTimeout(150); }
  if (await p.locator('.taskbar').count()) { await p.click('#home').catch(() => {}); await p.waitForTimeout(150); }
  out.ticked = await p.evaluate(() => taskDone('rewrite')); out.againBtn = await p.locator('[data-again="rewrite"]').count();
  expect('finished: ticked, ↺ beside the tick at home', out.ticked && out.againBtn === 1, out);
  // reopen after a reload: as it was left
  await p.reload(); await p.waitForTimeout(400); await p.click('[data-open="rewrite"]'); await p.waitForTimeout(150);
  out.review = Object.assign(await where(), {first: await p.evaluate(() => (typed['rewrite-0'] || ''))});
  expect('a finished task reopens on its last screen, answers shown, with ✓ Done · ↺ Do it again · 🔖 bookmarks again; typed answers kept after a reload',
    out.review.review && out.review.step === 3 && out.review.checked && /✓ Done/.test(out.review.bar) && /Do it again/.test(out.review.bar) && /bookmarks again/.test(out.review.bar) && out.review.first === 'Could we make it Thursday', out.review);
  await p.click('#prev'); await p.waitForTimeout(100); await p.click('#prev'); await p.waitForTimeout(100); await p.click('#prev'); await p.waitForTimeout(100);
  out.reviewFirst = Object.assign(await where(), {verdict: await p.locator('.verdict, .yours, .rw-yours, .ok-box, .no-box').count(), val: await p.evaluate(() => (document.querySelector('.stage') || {}).innerText || '')});
  expect('Back in a finished task: the earlier screens, answered', out.reviewFirst.step === 0 && out.reviewFirst.checked && /Could we make it Thursday/.test(out.reviewFirst.val), {step: out.reviewFirst.step, checked: out.reviewFirst.checked});
  await p.click('#do-again'); await p.waitForTimeout(150); out.fresh = Object.assign(await where(), {first: await p.evaluate(() => typed['rewrite-0'] || ''), input: await p.locator('#rw').inputValue().catch(() => '?')});
  expect('↺ Do it again: step 1, not checked, the answers cleared (the tick stays)', out.fresh.step === 0 && !out.fresh.review && !out.fresh.checked && out.fresh.first === '' && out.fresh.input === '' && await p.evaluate(() => taskDone('rewrite')), out.fresh);
  // ↺ at home = fresh too
  await p.click('#home'); await p.waitForTimeout(100); await p.click('[data-again="rewrite"]'); await p.waitForTimeout(150); out.homeAgain = await where();
  expect('↺ beside the tick opens the task from the start', out.homeAgain.step === 0 && !out.homeAgain.review, out.homeAgain);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK again'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
