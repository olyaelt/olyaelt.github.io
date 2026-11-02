// engine 60 (her 2.11 15:15: «отдельную страничку, не тулз, где всё это будет лежать… код такой же, чтобы у меня и туда был доступ к одному
// и тому же коду, который я ввела»): /me/index.html lists her own lessons; her own pages (group "me") use her Self code — the key her German
// page's 🎬 keeps (tool-self-code) — and never the teacher view, even on a device whose B2 / C1 pages use her teacher code; without that
// code the page asks for it and keeps it there (the teacher code untouched); every "go to the chat" stop shows its word and the button.
//   node tests/me_pages_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const {makeEnv} = require('./mock');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]); env.sheets.Students.appendRow(['selfde1', 'Olya DE', 'Self', '']);
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  /* the site's own host name, so the code gate works as on clickswith.me */
  const base = `http://clickswith.me:${srv.address().port}/`;
  const b = await chromium.launch({args: ['--host-resolver-rules=MAP clickswith.me 127.0.0.1']}); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const route = async ctx => ctx.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));

  // 1. a device with her teacher code and her Self code: the English page is hers as a learner
  let ctx = await b.newContext({viewport: {width: 1280, height: 800}}); await route(ctx);
  await ctx.addInitScript(t => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('hw-code', t); localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('tool-self-code', 'selfde1'); } }, T);
  let p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'me/english-1.html'); await p.waitForTimeout(900);
  out.self = await p.evaluate(() => ({self: SELF, code: myCode(), teacher: isTeacher(), h1: document.querySelector('h1') ? document.querySelector('h1').textContent : '', tasks: TASKS.length, hi: /Hi, Olya DE/.test(document.body.innerText)}));
  expect('her English page: her Self code, not the teacher view, her lesson title on top', out.self.self && out.self.code === 'selfde1' && !out.self.teacher && /My English/.test(out.self.h1) && out.self.hi, out.self);
  out.stops = await p.evaluate(() => TASKS.filter(t => /^💬/.test(t.title)).map(t => t.id));
  expect('four chat stops in the task list, marked 💬', out.stops.length === 4, out.stops);
  out.teacherKept = await p.evaluate(() => ({code: localStorage.getItem('hw-code'), role: localStorage.getItem('hw-role')}));
  if (shots) await p.screenshot({path: path.join(shots, 'me-english-home.png')});
  // a stop: the word to write, the button to the chat on the screen without scrolling
  await p.evaluate(() => openTask('p1-chat')); await p.waitForTimeout(300);
  out.stop = await p.evaluate(() => { const a = document.querySelector('.panel a.cta'); const r = a ? a.getBoundingClientRect() : null;
    return {word: /Живой класс, часть 1/.test(document.querySelector('.panel').innerText), href: a ? a.href : '', onScreen: !!r && r.bottom <= innerHeight, fin: (document.getElementById('fin') || {}).textContent}; });
  expect('a chat stop: the word to write, the chat button on screen, «I\'ve done it»', out.stop.word && /claude\.ai/.test(out.stop.href) && out.stop.onScreen && /done it/.test(out.stop.fin), out.stop);
  if (shots) await p.screenshot({path: path.join(shots, 'me-english-stop.png')});
  // a task done counts for her Self code in her table
  await p.evaluate(() => openTask('start')); await p.waitForTimeout(300); await p.click('#fin'); await p.waitForTimeout(1200);
  const rows = env.sheets['State'].d.slice(1).filter(r => r[1] === 'selfde1' && r[2] === 'hw-ge-me-english-1');
  expect('a finished card is ticked for her Self code', rows.some(r => r[3] === 'start' && r[4] === true), rows.map(r => r.slice(2, 5)));
  out.teacherAfter = await p.evaluate(() => ({code: localStorage.getItem('hw-code'), role: localStorage.getItem('hw-role')}));
  expect('her teacher code on this device is untouched', out.teacherKept.code === out.teacherAfter.code && out.teacherAfter.role === 'teacher', {before: out.teacherKept, after: out.teacherAfter});
  // the hub
  await p.goto(base + 'me/index.html'); await p.waitForTimeout(900);
  out.hub = await p.evaluate(() => ({items: [...document.querySelectorAll('.lesson .t')].map(x => x.textContent), film: (document.querySelector('.film .big') || {}).textContent || '', ticks: [...document.querySelectorAll('.lesson .st')].map(x => x.textContent)}));
  expect('My lessons: the English and the German page, her film, the English page shows ✓ 1', out.hub.items.length === 2 && /English/.test(out.hub.items[0]) && /Krabbelgruppe/.test(out.hub.items[1]) && /\d+ 🎞/.test(out.hub.film) && /✓ 1/.test(out.hub.ticks[0]), out.hub);
  if (shots) await p.screenshot({path: path.join(shots, 'me-hub.png')});
  await ctx.close();

  // 2. a device with only her teacher code: her own page asks for a code, keeps it as the Self code
  ctx = await b.newContext({viewport: {width: 390, height: 844}}); await route(ctx);
  await ctx.addInitScript(t => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('hw-code', t); localStorage.setItem('hw-role', 'teacher'); } }, T);
  p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'me/english-1.html'); await p.waitForTimeout(900);
  out.gate = await p.evaluate(() => ({gate: !!document.getElementById('gate'), teacher: isTeacher()}));
  expect('only a teacher code on the device: her own page asks for her code (no teacher view)', out.gate.gate && !out.gate.teacher, out.gate);
  if (shots) await p.screenshot({path: path.join(shots, 'me-gate.png')});
  await p.fill('#code', 'selfde1'); await p.click('#code-go'); await p.waitForTimeout(1200);
  out.after = await p.evaluate(() => ({self: localStorage.getItem('tool-self-code'), code: localStorage.getItem('hw-code'), list: !document.getElementById('gate')}));
  expect('her Self code typed in → kept as the Self code; the teacher code stays', out.after.self === 'selfde1' && out.after.code !== 'selfde1' && out.after.list, out.after);
  await p.goto(base + 'me/index.html'); await p.waitForTimeout(900);
  out.hub2 = await p.evaluate(() => !!document.querySelector('.film .big'));
  expect('the hub knows the same code', out.hub2, out.hub2);
  await ctx.close();

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK my pages'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
