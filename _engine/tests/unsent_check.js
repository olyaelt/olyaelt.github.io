// Engine 57 (1.11, a student's recording was lost — Done ticked, nothing reached Olya): on Over to you
//  · Finish before anything was sent → "You haven't sent it to Olya yet. Send it first?" (Send to Olya · Finish anyway); nothing written →
//    "You haven't written or recorded anything yet."; Finish anyway goes on; after a send (Copy here) Finish just finishes;
//  · a recording is kept on the device (IndexedDB): after a reload the task shows it again, "not sent yet".
//   node tests/unsent_check.js SITE_DIR/b2/2026-10-30.html
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => {
  const file = path.resolve(process.argv[2]), dir = path.dirname(file), name = path.basename(file);
  const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const url = `http://localhost:${srv.address().port}/${name}`;
  const b = await chromium.launch({args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']});
  const fail = [], errs = [], out = {}; const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({...require('playwright').devices['iPhone 13'], permissions: ['microphone'], reducedMotion: 'reduce'});
  await ctx.grantPermissions(['microphone']);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const toProduce = async () => { await p.goto(url); await p.waitForTimeout(400);
    return p.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); const i = t.steps.findIndex(s => s.type === 'produce'); openTask(t.id, i, 'fresh'); return {id: t.id, i, n: t.steps.length}; }); };
  const info = await toProduce(); out.info = info;
  if (!info || info.i < 0) { console.log('FAILED: no Over to you task on this page'); process.exit(1); }
  await p.waitForTimeout(200);
  // nothing written → the line, Finish anyway goes on
  await p.click('#go'); await p.waitForTimeout(150);
  let u = await p.evaluate(() => ({box: (document.getElementById('unsent') || {}).textContent || '', still: !!document.getElementById('send')}));
  expect('Finish with nothing → "You haven\'t written or recorded anything yet", the task stays', /written or recorded anything/.test(u.box) && u.still, u);
  // written, not sent → "You haven't sent it to Olya yet" + Send to Olya
  await p.evaluate(() => { const m = document.querySelector('[data-mode="write"]'); if (m) m.click(); });
  await p.fill('#txt', 'Watch The Bear — it really picks up after episode 2.');
  await p.evaluate(() => { const x = document.getElementById('unsent'); if (x) x.remove(); });
  await p.click('#go'); await p.waitForTimeout(150);
  u = await p.evaluate(() => ({box: (document.getElementById('unsent') || {}).textContent || '', send: !!document.getElementById('us-send'), skip: (document.getElementById('us-skip') || {}).textContent || ''}));
  expect('written, not sent → "You haven\'t sent it to Olya yet" with Send to Olya and Finish anyway', /haven't sent it to Olya yet/.test(u.box) && u.send && /anyway/.test(u.skip), u);
  await p.click('#us-skip'); await p.waitForTimeout(250);
  const after = await p.evaluate(() => ({send: !!document.getElementById('send'), end: !!document.querySelector('.end, .stage .cloud') || !!document.querySelector('#list')}));
  expect('Finish anyway → on (the end screen)', !after.send, after);
  // after a send (Copy) Finish doesn't ask
  await toProduce(); await p.waitForTimeout(200);
  await p.evaluate(() => { const m = document.querySelector('[data-mode="write"]'); if (m) m.click(); });
  await p.fill('#txt', 'Something to copy.'); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); await p.click('#copy'); await p.waitForTimeout(150);
  await p.click('#go'); await p.waitForTimeout(250);
  u = await p.evaluate(() => ({unsent: !!document.getElementById('unsent'), send: !!document.getElementById('send')}));
  expect('after Copy, Finish just finishes', !u.unsent && !u.send, u);
  // a recording is kept on the device
  await toProduce(); await p.waitForTimeout(200);
  await p.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); });
  const canRec = await p.$('#rec');
  if (canRec) {
    await p.click('#rec'); await p.waitForTimeout(1300); await p.click('#rec'); await p.waitForTimeout(1500);
    let r = await p.evaluate(() => ({review: !document.getElementById('rec-review').hidden, kept: (document.getElementById('rec-kept') || {}).textContent || ''}));
    expect('recorded → "✓ Saved on this device"', r.review && /Saved on this device/.test(r.kept), r);
    await p.reload(); await p.waitForTimeout(400);
    await p.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); openTask(t.id, t.steps.findIndex(s => s.type === 'produce')); });
    await p.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); }); await p.waitForTimeout(600);
    r = await p.evaluate(() => ({review: !document.getElementById('rec-review').hidden, src: !!document.getElementById('rec-audio').src, kept: (document.getElementById('rec-kept') || {}).textContent || ''}));
    out.reload = r;
    expect('after a reload the recording is back, "not sent yet"', r.review && r.src && /not sent yet/.test(r.kept), r);
  } else fail.push('no Record button on this task');
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK unsent'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
