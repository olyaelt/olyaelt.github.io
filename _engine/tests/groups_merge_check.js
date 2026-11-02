// tools 22 (her 1.11 11:29): in 📥 Groups every screen is a card; she drags Boris's card onto Anna's → one group "Anna + Boris" (Anna's
// screen shows; kept after a reload, on her computer); "move on" goes to both screens; Boris's screen typing on its own makes 🔀 New groups
// pulse (never splits by itself); New groups → every screen its own card again, ↩ Undo brings the groups back; tapping Boris's name makes his
// screen the shown one; ✕ takes him out; 🧹 Start fresh forgets the groups.
//   node tests/groups_merge_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const http = require('http');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', PAGE = 'tools/b2-2026-10-30/late';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'B2', '']); env.sheets.Students.appendRow(['bbb111', 'Boris', 'B2', '']);
  /* over http, not file:// — Chromium sometimes drops a file:// page's storage on reload, and the groups live in her browser storage */
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const open = async (who) => {
    const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
    await c.addInitScript(([code, role]) => { if (code) { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', role); } }, who === 'teacher' ? [T, 'teacher'] : [who || '', '']);
    await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await c.newPage(); p.on('pageerror', e => errs.push((who || 'anon') + ': ' + e.message));
    const rel = PAGE + '-live.html', src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(site, 'tools/b2-2026-10-30', '_gm_' + (who || 'anon') + '_' + path.basename(rel)); fs.writeFileSync(tmp, src);
    await p.goto(base + path.relative(site, tmp)); await p.waitForTimeout(300); p._tmp = tmp; return p;
  };
  const flush = p => p.evaluate(() => shareFlush()).then(() => p.waitForTimeout(150));
  const A = await open('abc123'), B = await open('bbb111'), C = await open('');
  for (const [p, t] of [[A, 'Sorry, I got stuck in traffic'], [B, 'Sorry, I got stuck in traffic'], [C, 'Hello, I am late']]) {
    await p.click('.acts.wide [data-next]'); await p.waitForTimeout(150); await p.fill('#msg', t); await flush(p); }
  const devA = await A.evaluate(() => DEV), devB = await B.evaluate(() => DEV);
  const O = await open('teacher');
  await O.click('.stage-btn[data-stage="groups"]'); await O.waitForTimeout(500);
  const cards = () => O.locator('.gw-grid .gw-card .nm').allInnerTexts();
  out.start = await cards(); out.hint = await O.locator('#gw-hint').isVisible();
  expect('three screens, three cards; the hint shows', out.start.length === 3 && /Anna/.test(out.start[0]) && /Boris/.test(out.start[1]) && out.hint, out);
  if (shots) await O.screenshot({path: path.join(shots, 'gm-1-three.png')});
  /* HTML5 drag in a headless browser is sometimes dropped by Playwright: if the first dragTo didn't land, the same events by hand */
  const dragCard = async (from, onto) => {
    await O.locator(`.gw-card[data-dev="${from}"] .gw-head`).dragTo(O.locator(`.gw-card[data-dev="${onto}"]`)); await O.waitForTimeout(300);
    if (await O.evaluate(f => !!(JSON.parse(localStorage.getItem(MERGE_KEY) || 'null') || {into: {}}).into[f], from)) return;
    await O.evaluate(([f, o]) => { const dt = new DataTransfer(), h = document.querySelector(`.gw-card[data-dev="${f}"] .gw-head`), c = document.querySelector(`.gw-card[data-dev="${o}"]`);
      h.dispatchEvent(new DragEvent('dragstart', {bubbles: true, dataTransfer: dt})); c.dispatchEvent(new DragEvent('dragover', {bubbles: true, cancelable: true, dataTransfer: dt}));
      c.dispatchEvent(new DragEvent('drop', {bubbles: true, cancelable: true, dataTransfer: dt})); h.dispatchEvent(new DragEvent('dragend', {bubbles: true, dataTransfer: dt})); }, [from, onto]);
    await O.waitForTimeout(300); };
  // drag Boris's card onto Anna's
  await dragCard(devB, devA); await O.waitForTimeout(100);
  out.merged = await cards(); out.mem = await O.locator(`.gw-card[data-dev="${devA}"] .gw-mem`).innerText().then(t => t.replace(/\s+/g, ' ')).catch(() => '');
  out.newBtn = {shown: await O.locator('#gw-new').isVisible(), pulse: await O.locator('#gw-new.pulse').count()};
  expect('Boris dropped on Anna → "Group 1 — Anna + Boris", Anna shares the screen, New groups shown (quiet)',
    out.merged.length === 2 && /Group 1 — Anna \+ Boris/.test(out.merged[0]) && /Anna shares the screen/.test(out.mem) && /Boris/.test(out.mem) && out.newBtn.shown && !out.newBtn.pulse, out);
  if (shots) await O.screenshot({path: path.join(shots, 'gm-2-joined.png')});
  await O.reload(); await O.waitForTimeout(300); await O.click('.stage-btn[data-stage="groups"]'); await O.waitForTimeout(500);
  out.afterReload = await cards(); expect('kept after a reload', out.afterReload.length === 2 && /Anna \+ Boris/.test(out.afterReload[0]), out.afterReload);
  // "move on" goes to both screens of the group
  await O.evaluate(dev => sendNote(document.querySelector(`.gw-card[data-dev="${dev}"]`), 'Speaking', 'go', {noTarget: true}), devA); await O.waitForTimeout(400);
  const goes = env.sheets['Lesson notes'].d.slice(1).filter(r => r[7] === 'go').map(r => r[4]);
  expect('"move on" goes to Anna\'s and Boris\'s screens', goes.includes(devA) && goes.includes(devB), goes);
  // Boris types on his own screen → New groups pulses, his name says so
  await B.fill('#msg', 'Sorry Sarah, I am stuck in traffic, start without me'); await flush(B);
  await O.evaluate(() => gwFetch()); await O.waitForTimeout(500);
  await O.waitForSelector(`.gw-card[data-dev="${devA}"] .gw-j.solo`, {timeout: 10000}).catch(() => {});   /* the next paint, however slow */
  out.solo = {pulse: await O.locator('#gw-new.pulse').count(), mem: (await O.locator(`.gw-card[data-dev="${devA}"] .gw-mem`).innerText()).replace(/\s+/g, ' '), cards: (await cards()).length};
  expect('Boris works on his own screen → 🔀 New groups pulses, nothing splits by itself', out.solo.pulse === 1 && /working on their own screen/.test(out.solo.mem) && out.solo.cards === 2, out.solo);
  if (shots) await O.screenshot({path: path.join(shots, 'gm-3-pulse.png')});
  await O.click('#gw-new'); await O.waitForTimeout(300);
  out.split = {cards: (await cards()).length, btn: await O.locator('#gw-new').innerText()};
  expect('New groups → every screen its own card, ↩ Undo', out.split.cards === 3 && /Undo/.test(out.split.btn), out.split);
  await O.click('#gw-new'); await O.waitForTimeout(300);
  out.undo = await cards(); expect('↩ Undo → the group is back', out.undo.length === 2 && /Anna \+ Boris/.test(out.undo[0]), out.undo);
  // Boris's name → his screen is the shown one
  await O.click(`[data-host="${devB}"]`); await O.waitForTimeout(300);
  out.host = {first: await O.locator('.gw-grid .gw-card').first().getAttribute('data-dev'), mem: await O.locator(`.gw-card[data-dev="${devB}"] .gw-mem`).innerText().then(t => t.replace(/\s+/g, ' ')).catch(() => '')};
  expect('tap Boris → his screen shows, Anna joined', out.host.mem.startsWith('🖥 Boris') && /Anna/.test(out.host.mem) && (await cards()).length === 2, out.host);
  // ✕ → Anna back on her own card
  await O.click(`[data-split="${devA}"]`); await O.waitForTimeout(300);
  out.x = (await cards()).length; expect('✕ → back to three cards', out.x === 3, out.x);
  // Start fresh forgets the groups
  await dragCard(devB, devA);
  await O.click('[data-gw-fresh]'); await O.click('[data-gw-fresh]'); await O.waitForTimeout(200);
  out.fresh = await O.evaluate(() => localStorage.getItem(MERGE_KEY)); expect('🧹 Start fresh forgets the groups', !out.fresh || out.fresh === 'null', out.fresh);
  for (const p of [A, B, C, O]) { try { fs.unlinkSync(p._tmp); } catch (e) {} }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK groups merge'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
