// Engine 57–58 (1.11, a student's recording was lost — Done ticked, nothing reached Olya; her 10:29 «должно быть Finish and send либо
// Save without sending»; 10:31 «Save не должно выводить со страницы»): at the bottom of Over to you
//  · Finish and send with nothing written → "Write or dictate it first", nothing ticked;
//  · Save without sending → stays on the page, "✓ Saved on this device — not sent to Olya yet" + Back to the homework; not ticked; the list
//    shows "✏️ Saved on this device · not sent to Olya yet — tap to send", which opens the task with the text still there;
//  · after Copy (no code) the button is just Finish → ticked;
//  · a recording is kept on the device (IndexedDB): after a reload the task shows it again, "not sent yet";
//  · with a code, Finish and send puts the recording straight into her Drive (through her table) and the task is ticked at once;
//  · "▶ Your recording" plays it again: this phone's copy, or (another phone) from her Drive via the script; someone else's code gets nothing.
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
  await ctx.grantPermissions(['microphone', 'clipboard-read', 'clipboard-write']);
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const toProduce = async () => { await p.goto(url); await p.waitForTimeout(400);
    return p.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); const i = t.steps.findIndex(s => s.type === 'produce'); openTask(t.id, i, 'fresh'); return {id: t.id, i, n: t.steps.length}; }); };
  const info = await toProduce(); out.info = info;
  if (!info || info.i < 0) { console.log('FAILED: no Over to you task on this page'); process.exit(1); }
  const ticked = () => p.evaluate(id => !!(marks[id] && marks[id].done), info.id);
  const bar = () => p.evaluate(() => ({go: (document.getElementById('go') || {}).textContent || '', nosend: !!document.getElementById('nosend') && !document.getElementById('nosend').hidden,
    send: !!document.getElementById('send'), msg: (document.getElementById('msg') || {}).textContent || '', home: !!document.querySelector('.lesson-head')}));
  await p.waitForTimeout(200);
  let u = await bar(); out.bar = u;
  expect('the bar: Finish and send · Save without sending, no separate Send to Olya', /Finish and send/.test(u.go) && u.nosend && !u.send, u);
  // nothing written → Finish and send says so, nothing ticked
  await p.evaluate(() => { const m = document.querySelector('[data-mode="write"]'); if (m) m.click(); });
  await p.click('#go'); await p.waitForTimeout(150);
  u = await bar(); u.ticked = await ticked();
  expect('Finish and send with nothing → "Write or dictate it first", stays, not ticked', /Write or dictate it first/.test(u.msg) && !u.home && !u.ticked, u);
  // written → Save without sending: stays here, not ticked, Back to the homework
  await p.fill('#txt', 'Watch The Bear — it really picks up after episode 2.');
  await p.click('#nosend'); await p.waitForTimeout(200);
  u = await bar(); u.ticked = await ticked(); u.back = !!(await p.$('#to-list')); out.saved = u;
  expect('Save without sending → stays, "Saved on this device — not sent", Back to the homework, not ticked', /Saved on this device — not sent/.test(u.msg) && u.back && !u.home && !u.ticked, u);
  await p.click('#to-list'); await p.waitForTimeout(250);
  u = await p.evaluate(id => { const r = document.querySelector(`[data-toggle="${id}"]`), l = document.querySelector(`[data-tosend="${id}"]`);
    return {home: !!document.querySelector('.lesson-head'), done: r ? r.closest('.task-row').classList.contains('is-done') : null, line: l ? l.textContent : ''}; }, info.id);
  out.list = u;
  expect('the list: not ticked, "✏️ Saved on this device · not sent to Olya yet — tap to send"', u.home && u.done === false && /not sent to Olya yet/.test(u.line), u);
  await p.click(`[data-tosend="${info.id}"]`); await p.waitForTimeout(250);
  u = await p.evaluate(() => ({txt: (document.getElementById('txt') || {}).value || '', go: (document.getElementById('go') || {}).textContent || ''}));
  expect('the line opens Over to you with the text still there', /The Bear/.test(u.txt) && /Finish and send/.test(u.go), u);
  // no code: Copy → the button is just Finish → ticked
  await p.click('#copy'); await p.waitForTimeout(150);
  u = await bar(); expect('after Copy the button is Finish, Save without sending goes', /^\s*Finish\s*$/.test(u.go) && !u.nosend, u);
  await p.click('#go'); await p.waitForTimeout(300);
  u = await bar(); u.ticked = await ticked(); u.line = await p.evaluate(id => !!document.querySelector(`[data-tosend="${id}"]`), info.id);
  expect('Finish → on the list, ticked, the reminder line gone', u.home && u.ticked && !u.line, u);
  // a recording is kept on the device
  await toProduce(); await p.waitForTimeout(200);
  await p.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); });
  const canRec = await p.$('#rec');
  if (canRec) {
    await p.click('#rec'); await p.waitForTimeout(1300); await p.click('#rec'); await p.waitForTimeout(1500);
    let r = await p.evaluate(() => ({review: !document.getElementById('rec-review').hidden, kept: (document.getElementById('rec-kept') || {}).textContent || '', go: document.getElementById('go').textContent}));
    expect('recorded → "✓ Saved on this device", the button Finish and send', r.review && /Saved on this device/.test(r.kept) && /Finish and send/.test(r.go), r);
    await p.reload(); await p.waitForTimeout(400);
    await p.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); openTask(t.id, t.steps.findIndex(s => s.type === 'produce')); });
    await p.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); }); await p.waitForTimeout(600);
    r = await p.evaluate(() => ({review: !document.getElementById('rec-review').hidden, src: !!document.getElementById('rec-audio').src, kept: (document.getElementById('rec-kept') || {}).textContent || ''}));
    out.reload = r;
    expect('after a reload the recording is back, "not sent yet"', r.review && r.src && /not sent yet/.test(r.kept), r);
  } else fail.push('no Record button on this task');
  // with a code: Finish and send puts the recording straight into her Drive (through her table), the row gets the link, the task is done
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
      const tid = await q.evaluate(() => { const t = TASKS.find(t => (t.steps || []).some(s => s.type === 'produce')); openTask(t.id, t.steps.findIndex(s => s.type === 'produce'), 'fresh'); return t.id; });
      await q.waitForTimeout(300); await q.evaluate(() => { const m = document.querySelector('[data-mode="record"]'); if (m) m.click(); });
      await q.click('#rec'); await q.waitForTimeout(1300); await q.click('#rec'); await q.waitForTimeout(1500);
      await q.click('#go'); await q.waitForTimeout(2500);
      const d = await q.evaluate(id => ({home: !!document.querySelector('.lesson-head'), banner: !!document.querySelector('.done-banner'), ticked: !!(marks[id] && marks[id].done)}), tid);
      out.drive = {d, ups, files: env.drive.files.map(f => [f.name, f.folder.name, f.size]), rows: (env.sheets.Work ? env.sheets.Work.d.slice(1) : []).map(r => [r[2], r[6], r[7]])};
      expect('with a code: Finish and send → the recording lands in her Drive (folder B2), the row has the link, the task is ticked with ✓ Done!',
        ups === 1 && env.drive.files.length === 1 && env.drive.files[0].folder.name === 'B2' && env.drive.files[0].size > 500 && out.drive.rows.some(r => /recording \(Drive\)/.test(r[1]) && /drive\.google\.com/.test(r[2])) && d.home && d.banner && d.ticked, out.drive);
      /* reopened after sending: just Finish */
      await q.evaluate(id => { const t = TASKS.find(x => x.id === id); openTask(id, t.steps.findIndex(s => s.type === 'produce')); }, tid); await q.waitForTimeout(500);
      const again = await q.evaluate(() => ({go: document.getElementById('go').textContent, nosend: !!document.getElementById('nosend') && !document.getElementById('nosend').hidden}));
      expect('reopened after sending: the button is Finish, no Save without sending', /^\s*Finish\s*$/.test(again.go) && !again.nosend, again);
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
