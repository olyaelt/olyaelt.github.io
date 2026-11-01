// Engine 57 (1.11, a student's recording was lost — Done ticked, nothing reached Olya): on Over to you
//  · Finish before anything was sent → "You haven't sent it to Olya yet." (Send to Olya · Finish for now); nothing written →
//    "You haven't written or recorded anything yet."; after a send (Copy here) Finish just finishes;
//  · (her 09:25) Finish for now → "Not sent yet": the task is NOT ticked, Send it now goes back to Over to you; sent → ticked;
//  · (her 09:25) with a code, "▶ Your recording" plays the recording again: this phone's copy, or (another phone) from her Drive via the script;
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
  expect('written, not sent → "You haven\'t sent it to Olya yet" with Send to Olya and Finish for now', /haven't sent it to Olya yet/.test(u.box) && u.send && /for now/.test(u.skip), u);
  await p.click('#us-skip'); await p.waitForTimeout(250);
  const ticked = () => p.evaluate(id => !!(marks[id] && marks[id].done), info.id);
  let after = await p.evaluate(() => ({send: !!document.getElementById('send'), ns: (document.querySelector('.unsent-end') || {}).textContent || '', btn: !!document.getElementById('tosend')}));
  after.ticked = await ticked(); out.notSent = after;
  expect('Finish for now → "Not sent yet", the task is not ticked', !after.send && /Not sent yet/.test(after.ns) && after.btn && !after.ticked, after);
  await p.click('#tosend'); await p.waitForTimeout(200);
  after = await p.evaluate(() => ({send: !!document.getElementById('send'), txt: (document.getElementById('txt') || {}).value || ''}));
  expect('Send it now → back on Over to you, the text still there', after.send && /The Bear/.test(after.txt), after);
  await p.evaluate(() => goHome()); await p.waitForTimeout(200);
  after = await p.evaluate(id => { const r = document.querySelector(`[data-toggle="${id}"]`); return r ? r.closest('.task-row').classList.contains('is-done') : null; }, info.id);
  expect('on the list it is not ticked', after === false, after);
  // after a send (Copy) Finish doesn't ask
  await toProduce(); await p.waitForTimeout(200);
  await p.evaluate(() => { const m = document.querySelector('[data-mode="write"]'); if (m) m.click(); });
  await p.fill('#txt', 'Something to copy.'); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']); await p.click('#copy'); await p.waitForTimeout(150);
  await p.click('#go'); await p.waitForTimeout(250);
  u = await p.evaluate(() => ({unsent: !!document.getElementById('unsent'), send: !!document.getElementById('send'), ns: !!document.querySelector('.unsent-end')}));
  u.ticked = await ticked();
  expect('after Copy, Finish just finishes, and the task is ticked', !u.unsent && !u.send && !u.ns && u.ticked, u);
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
  // with a code: Send to Olya puts the recording straight into her Drive (through her table), the row gets the link
  { const {makeEnv} = require('./mock'); const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.appendRow(['abc123', 'Anna', 'B2', '']);
    const c2 = await b.newContext({...require('playwright').devices['iPhone 13'], permissions: ['microphone'], reducedMotion: 'reduce'});
    await c2.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-yt-ok', '1'); });
    let ups = 0, mine = 0;
    const route = r => { const body = r.request().postData() || ''; if (/"action":"upload"/.test(body)) ups++; if (/"action":"myRecording"/.test(body)) mine++;
      return r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(body))}); };
    await c2.route(/script\.google\.com/, route);
    const q = await c2.newPage(); q.on('pageerror', e => errs.push('drive: ' + e.message));
    await q.goto(url); await q.waitForTimeout(800);
    const live = await q.evaluate(() => typeof SYNC_URL !== 'undefined' && !!SYNC_URL);
    if (live) {
      await q.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); openTask(t.id, t.steps.findIndex(s => s.type === 'produce'), 'fresh'); });
      await q.waitForTimeout(300); await q.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); });
      await q.click('#rec'); await q.waitForTimeout(1300); await q.click('#rec'); await q.waitForTimeout(1500);
      await q.click('#send'); await q.waitForTimeout(2500);
      const d = await q.evaluate(() => ({msg: (document.getElementById('msg') || {}).textContent || '', kept: (document.getElementById('rec-kept') || {}).textContent || ''}));
      out.drive = {d, ups, files: env.drive.files.map(f => [f.name, f.folder.name, f.size]), rows: (env.sheets.Work ? env.sheets.Work.d.slice(1) : []).map(r => [r[2], r[6], r[7]])};
      expect('with a code: the recording lands in her Drive (folder B2), the row says Drive with the link, the page says Sent ✓',
        ups === 1 && env.drive.files.length === 1 && env.drive.files[0].folder.name === 'B2' && env.drive.files[0].size > 500 && out.drive.rows.some(r => /recording \(Drive\)/.test(r[1]) && /drive\.google\.com/.test(r[2])) && /Sent ✓/.test(d.msg) && /Sent to Olya/.test(d.kept), out.drive);
      await q.click('#go'); await q.waitForTimeout(300);
      const tid = await q.evaluate(() => TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')).id);
      const fin = await q.evaluate(id => ({asked: !!document.getElementById('unsent'), ns: !!document.querySelector('.unsent-end'), ticked: !!(marks[id] && marks[id].done)}), tid);
      expect('after the upload, Finish just finishes and the task is ticked', !fin.asked && !fin.ns && fin.ticked, fin);
      /* ▶ Your recording, on this phone: its own copy, no request */
      await q.evaluate(() => goHome()); await q.waitForTimeout(300);
      const line = await q.evaluate(id => { const b = document.querySelector(`.fb-rec[data-fb="${id}"]`); return b ? b.textContent : ''; }, tid);
      expect('the list: "✓ Sent to Olya … · ▶ your recording"', /Sent to Olya/.test(line) && /your recording/.test(line), line);
      await q.click(`.fb-rec[data-fb="${tid}"]`); await q.waitForTimeout(300);
      await q.click('[data-myrec]'); await q.waitForTimeout(600);
      const here = await q.evaluate(() => { const a = document.querySelector('.my-rec audio'); return a ? {src: /^blob:/.test(a.src)} : null; });
      expect('▶ Your recording plays this phone\'s copy (no request)', here && here.src && mine === 0, {here, mine});
      /* another phone (no copy): from her Drive, through her script */
      const c3 = await b.newContext({...require('playwright').devices['iPhone 13'], reducedMotion: 'reduce'});
      await c3.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-yt-ok', '1'); });
      await c3.route(/script\.google\.com/, route);
      const q3 = await c3.newPage(); q3.on('pageerror', e => errs.push('phone 2: ' + e.message));
      await q3.goto(url); await q3.waitForTimeout(1200);
      const l3 = await q3.$(`.fb-rec[data-fb="${tid}"]`);
      if (l3) { await l3.click(); await q3.waitForTimeout(300); await q3.click('[data-myrec]'); await q3.waitForTimeout(1200);
        const there = await q3.evaluate(async () => { const a = document.querySelector('.my-rec audio'); if (!a) return null; const bl = await (await fetch(a.src)).blob(); return {size: bl.size, type: bl.type}; });
        out.phone2 = {there, mine};
        expect('another phone: ▶ Your recording comes from her Drive (one request), the same recording', there && there.size > 500 && mine === 1 && there.size === env.drive.files[0].size, out.phone2);
      } else fail.push('phone 2: no "▶ your recording" line on the list');
      /* someone else's code can't get it */
      env.sheets.Students.appendRow(['zzz999', 'Boris', 'B2', '']);
      const wid = env.sheets.Work.d[1][0];
      const other = env.post(JSON.stringify({action: 'myRecording', code: 'zzz999', page: 'hw-ge-b2-2026-10-30', id: wid}));
      expect('another student\'s code gets nothing', other.ok === false && !other.b64, other);
      await c3.close();
    } else fail.push('the page has no SYNC_URL — the Drive part needs the built site page');
    await c2.close(); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK unsent'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
