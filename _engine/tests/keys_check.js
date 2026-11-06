// engine 63 / tools 29 (her 6.11 09:55 «чтобы next и back были доступны с клавиатуры»): → and ← = Next and Back.
//   node tests/keys_check.js SITE_DIR
// Field page: → = a click on Next, ← = a click on Back; Ctrl / Alt / Cmd / Shift + arrows, a held key and arrows while typing do nothing;
// inside a field's tool block (the chat page in its frame) the arrows step the chats as the field's Next / Back do.
// Homework page: → = the screen's Check / Next, ← = Back; typing in a gap moves the cursor only; never a Send button.
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const newPage = async url => { const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + url); await p.waitForTimeout(400); return p; };
  const where = p => p.evaluate(() => JSON.stringify([S.stage, S.intro, bIdx(), document.querySelector('#main') ? document.querySelector('#main').innerText.length : 0]));
  const key = async (p, k) => { await p.keyboard.press(k); await p.waitForTimeout(250); };

  /* ---- a field page ---- */
  { const p = await newPage('tools/b2-2026-11-06/stages-of-life.html');
    await p.mouse.click(5, 5);
    const s0 = await where(p);
    await p.click('.stepbar [data-step]'); await p.waitForTimeout(250); const sClick = await where(p);
    await p.click('.stepbar [data-back]'); await p.waitForTimeout(250);
    expect('field: Back by click returns to the start', await where(p) === s0, [s0, await where(p)]);
    await key(p, 'ArrowRight'); const sKey = await where(p);
    expect('field: → does what Next does', sKey === sClick && sKey !== s0, [s0, sClick, sKey]);
    await key(p, 'ArrowLeft'); expect('field: ← does what Back does', await where(p) === s0, await where(p));
    for (const m of ['Control+ArrowRight', 'Alt+ArrowRight', 'Meta+ArrowRight', 'Shift+ArrowRight']) { await key(p, m); expect('field: ' + m + ' does nothing', await where(p) === s0, m); }
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(80); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(80); await p.keyboard.down('ArrowRight'); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(250);
    out.held = await where(p); expect('field: a held key steps once', out.held === sClick, [sClick, out.held]);
    await key(p, 'ArrowLeft');
    await p.evaluate(() => { const i = document.createElement('input'); i.id = 'kt'; i.value = 'abc'; document.querySelector('#main').prepend(i); });
    await p.focus('#kt'); await key(p, 'ArrowLeft'); await key(p, 'ArrowRight');
    expect('field: arrows in a text field move the cursor only', (await where(p)).startsWith(s0.slice(0, 12)) && await p.evaluate(() => document.activeElement && document.activeElement.id === 'kt'), await where(p));
    await p.evaluate(() => document.getElementById('kt').remove());
    out.aria = await p.evaluate(() => [document.querySelector('.stepbar [data-step]').getAttribute('aria-keyshortcuts'), document.querySelector('.stepbar [data-back]').getAttribute('aria-keyshortcuts')]);
    expect('field: the buttons name their keys', out.aria.join() === 'ArrowRight,ArrowLeft', out.aria);
    // the last screen: → stays there (Next is off), no errors
    await p.evaluate(() => { let i = S.stage; while (nextStage(i) != null) i = nextStage(i); goStage(i, false); S.intro = false; goBlock(i, D.stages[i].blocks.length - 1); });
    await p.waitForTimeout(300); const sl = await where(p);
    for (let k = 0; k < 5; k++) await key(p, 'ArrowRight');
    out.last = await p.evaluate(() => ({last: isLast()})); const blk = w => JSON.parse(w).slice(0, 3).join();   /* the same block (its speaking tasks go on, as with a click) */
    expect('field: → on the last screen stays there', out.last.last && blk(await where(p)) === blk(sl), [sl, await where(p)]);
    await p.context().close(); }

  /* ---- a field with a tool block: the chat page in its frame ---- */
  { const p = await newPage('tools/b2-2026-10-30/f-late.html');
    const ti = await p.evaluate(() => { const si = D.stages.findIndex(s => s.blocks.some(b => b.kind === 'tool')); goStage(si, false); S.intro = false; render(); return si; });
    await p.waitForTimeout(900);
    const fr = p.frame({url: /late\.html\?embed=1/}); expect('the chat page is in its frame', !!fr, p.frames().map(f => f.url()));
    if (fr) {
      const inside = () => fr.evaluate(() => JSON.stringify([S.view, S.at, (st(S.at).gaps || new Set()).size, !!st(S.at).ex]));
      const i0 = await inside();
      await fr.click('#msgs', {position: {x: 20, y: 20}}).catch(() => fr.click('body'));
      const i0b = await inside();
      await key(p, 'ArrowRight'); await p.waitForTimeout(250); const i1 = await inside();
      expect('inside the frame: → steps the chat as the field\'s Next', i1 !== i0b, [i0, i0b, i1]);
      await key(p, 'ArrowRight'); await p.waitForTimeout(250); const i2 = await inside();
      expect('inside the frame: → again, the next step', i2 !== i1, [i1, i2]);
      const ta = await fr.$('#msg');
      if (ta) { await fr.fill('#msg', 'abc'); await fr.focus('#msg'); const before = await inside(); await key(p, 'ArrowLeft'); await key(p, 'ArrowRight');
        expect('inside the frame: arrows while typing a message move the cursor only', await inside() === before, [before, await inside()]); await fr.fill('#msg', ''); }
      await fr.click('body', {position: {x: 5, y: 5}}).catch(() => {});
      const b0 = await inside(); await key(p, 'ArrowLeft'); await p.waitForTimeout(250);
      expect('inside the frame: ← steps back', await inside() !== b0, [b0, await inside()]);
      expect('the field stays on the tool block', await p.evaluate(() => curBlock().kind) === 'tool', ti);
    }
    await p.context().close(); }

  /* ---- a homework page ---- */
  { const p = await newPage('b2/2026-10-30.html');
    const t = await p.evaluate(() => { const t = TASKS.find(t => t.steps.length > 2 && t.steps.some(s => s.type === 'rewrite' || s.type === 'gaps' || s.type === 'dlg')) || TASKS[0]; openTask(t.id, 0); return {id: t.id, n: t.steps.length}; });
    await p.waitForTimeout(400); await p.mouse.click(5, 5);
    const hw = () => p.evaluate(() => JSON.stringify([stepIdx, checked, (document.getElementById('go') || {}).textContent]));
    const h0 = await hw();
    await key(p, 'ArrowRight'); const h1 = await hw(); expect('homework: → = the screen\'s main button (Check / Next)', h1 !== h0, [h0, h1]);
    for (let k = 0; k < 3 && JSON.parse(await hw())[0] === 0; k++) await key(p, 'ArrowRight');
    const h2 = await hw(); expect('homework: → goes on to the next screen', JSON.parse(h2)[0] >= 1, h2);
    await key(p, 'ArrowLeft'); expect('homework: ← = Back', JSON.parse(await hw())[0] === JSON.parse(h2)[0] - 1, await hw());
    for (const m of ['Control+ArrowRight', 'Alt+ArrowLeft', 'Meta+ArrowLeft']) { const was = await hw(); await key(p, m); expect('homework: ' + m + ' does nothing', await hw() === was, m); }
    const gi = await p.$('#task input[type=text], #task input:not([type]), .gapin, input.gap');
    if (gi) { const was = await hw(); await gi.focus(); await key(p, 'ArrowRight'); await key(p, 'ArrowLeft'); expect('homework: arrows in a gap move the cursor only', await hw() === was, [was, await hw()]); }
    // a Send button: → leaves it alone
    const sendCase = await p.evaluate(() => { const t = TASKS.find(t => t.steps.some(s => s.type === 'produce' || s.type === 'task')); if(!t) return null;
      const si = t.steps.findIndex(s => s.type === 'produce' || s.type === 'task'); openTask(t.id, si); return {id: t.id, si}; });
    await p.waitForTimeout(400);
    if (sendCase) {
      for (let k = 0; k < 6 && !(await p.$('#txt')); k++) { await p.click('#go'); await p.waitForTimeout(250); }
      await p.evaluate(() => { const w = document.querySelector('[data-mode="write"]'); if (w) w.click(); }); await p.waitForTimeout(200);
      if (await p.$('#txt')) { await p.fill('#txt', 'A test answer.'); await p.evaluate(() => document.getElementById('txt').dispatchEvent(new Event('input', {bubbles: true}))); }
      await p.mouse.click(5, 5); await p.waitForTimeout(150);
      const lbl = await p.evaluate(() => (document.getElementById('go') || {}).textContent || ''); out.sendLabel = lbl;
      const was = await hw(); await key(p, 'ArrowRight'); await p.waitForTimeout(300);
      if (/send/i.test(lbl)) expect('homework: → never presses Send', await hw() === was && !/Sending/.test(await hw()), [was, await hw()]);
      else fail.push('homework: no Send label to test — ' + lbl);
    } else fail.push('homework: no write step on this page');
    await p.context().close(); }

  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK keys'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
