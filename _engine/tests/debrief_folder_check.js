// tools 35 (her 12.11 12:37; the B2 debrief chat 12:15): 📁 Debrief folder — her live page keeps the lesson in a file on her computer.
//   node tests/debrief_folder_check.js SITE_DIR [shots/]
// The File System Access API is a stub (a folder in memory); Code.gs runs in Node (mock.js).
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const STUB = (name) => `(() => {
  const files = window.__dbf = {};
  const dir = (n, kids) => ({kind: 'directory', name: n,
    async getFileHandle(f, o){ if(kids && kids.files && kids.files.includes(f)) return {kind: 'file', name: f}; if(!(o && o.create)) throw new DOMException('no', 'NotFoundError');
      return {kind: 'file', name: f, async createWritable(){ let buf = ''; return {async write(x){ buf += x; }, async close(){ files[f] = buf; }}; }}; },
    async getDirectoryHandle(d){ if(kids && kids.dirs && kids.dirs.includes(d)) return dir(d); throw new DOMException('no', 'NotFoundError'); },
    async queryPermission(){ return 'granted'; }, async requestPermission(){ return 'granted'; }});
  window.__dirs = {good: dir(${JSON.stringify(name)}), lms: dir('LMS', {dirs: ['_engine', '.git'], files: ['CNAME', 'index.html']})};
  window.__pick = 'lms';
  window.showDirectoryPicker = async () => window.__dirs[window.__pick];
})();`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  const page = 'tools/b2-2026-11-11/bens-video-live.html';
  const html = fs.readFileSync(path.join(site, page), 'utf8'), url = (html.match(/LIVE_URL = "([^"]*)"/) || [])[1];
  const b = await chromium.launch();
  const open = async (file, code) => { const ctx = await b.newContext({viewport: {width: 1280, height: 720}});
    await ctx.addInitScript(STUB('_debrief'));
    if (url) await ctx.route(url + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const f = path.join(site, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('https://hw.test/' + file); if (code) { await p.evaluate(c => { localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }, code); await p.reload(); }
    await p.waitForTimeout(900); return {ctx, p}; };
  // her live page: the button; a folder inside the site is refused
  const A = await open(page, tc), p = A.p;
  ok(await p.isVisible('[data-dbf-pick]'), 'no 📁 Debrief folder on her live page');
  await p.click('[data-dbf-pick]'); await p.waitForTimeout(300);
  ok(/goes to the website/.test(await p.textContent('[data-dbf]')) && !(await p.evaluate(() => Object.keys(window.__dbf).length)), 'a folder inside LMS was taken');
  await p.evaluate(() => { window.__pick = 'good'; }); await p.click('[data-dbf-pick]'); await p.waitForTimeout(500);
  let F = await p.evaluate(() => window.__dbf), name = Object.keys(F)[0];
  ok(name && /^tools_b2-2026-11-11_bens-video_\d{4}-\d{2}-\d{2}\.json$/.test(name.replace(/\//g, '_')) || /bens-video_\d{4}-\d{2}-\d{2}\.json$/.test(name || ''), 'the file name: ' + name);
  ok(/✓/.test(await p.textContent('[data-dbf]')), 'the button does not say it saves');
  if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, 'dbf-bar.png'), clip: {x: 0, y: 0, width: 1280, height: 200}}); }
  // she moves on, opens her decoding, marks a word, plays nothing: the screens and the decoding go into the file
  await p.click('#next').catch(() => {}); await p.waitForTimeout(300);
  await p.evaluate(() => { const i = D.stages.findIndex(s => s.teacher); const x = document.querySelector(`[data-stage="${i}"]`); if(x) x.click(); }); await p.waitForTimeout(500);
  for (let k = 0; k < 4 && !(await p.$('.dc-line [data-dw="0"]')); k++) { await p.evaluate(() => { const st = document.querySelector('[data-step]'); if(st) st.click(); }); await p.waitForTimeout(400); }
  await p.click('[data-dw="0"]'); await p.waitForTimeout(150); await p.click('[data-dcmk="grey"]'); await p.waitForTimeout(200);
  await p.evaluate(() => dbfWrite(false)); await p.waitForTimeout(400);
  F = await p.evaluate(() => window.__dbf); const J = JSON.parse(F[Object.keys(F)[0]]);
  ok(J.page && J.day && Array.isArray(J.screens) && J.screens.length >= 3 && J.screens.some(s => /Ben's video · 1 of 1 · line 1/.test(s.screen)), 'screens: ' + JSON.stringify(J.screens));
  ok(J.sections.Decoding && /grey/.test(J.sections.Decoding), 'the decoding is not in the file: ' + JSON.stringify(J.sections).slice(0, 300));
  // nothing new → the file isn't written again
  await p.evaluate(() => { window.__dbf = {}; }); await p.evaluate(() => dbfWrite(false)); await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => Object.keys(window.__dbf).length)), 'written again with nothing new');
  await A.ctx.close();
  // the plain page and a student on the live page: no button
  const B = await open('tools/b2-2026-11-11/bens-video.html', tc); ok(!(await B.p.$('[data-dbf-pick]')), 'the plain page has the button'); await B.ctx.close();
  const C = await open(page, ''); ok(!(await C.p.$('[data-dbf-pick]')), 'a student sees the button'); await C.ctx.close();
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK debrief folder'); process.exit(fail.length ? 1 : 0);
})();
