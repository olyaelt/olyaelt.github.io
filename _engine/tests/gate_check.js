// Engine 35, on the site (olyaelt.github.io, served here from SITE_DIR): pages and lists open only with a code; a code the device
// already used keeps working when the table doesn't answer; Self students (studying on their own) have their own film,
// with a celebration every 100 frames, each code its own, and nothing of theirs reaches Olya's views or a group's meter.
//   node tests/gate_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', HOST = 'https://olyaelt.github.io/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  const expect = (name, ok) => { if (!ok) fail.push(name); };
  const env = makeEnv(); env.ctx.setUp();
  const S = env.sheets.Students, teacher = String(S.d[1][0]);
  S.appendRow(['mila11', 'Mila', 'B2']); S.appendRow(['anna11', 'Anna', 'Self']); S.appendRow(['ben22', 'Ben', 'Self']);
  // Anna has 95 frames already (an earlier homework), Ben 10
  const st = env.sheets.State, now = Date.now();
  st.appendRow(['anna11|hw-ge-b2-2026-10-16|x', 'anna11', 'hw-ge-b2-2026-10-16', 'x', true, now - 86400000, 'X', 95]);
  st.appendRow(['ben22|hw-ge-b2-2026-10-16|x', 'ben22', 'hw-ge-b2-2026-10-16', 'x', true, now - 86400000, 'X', 10]);
  let down = false;
  const b = await chromium.launch();
  const ctxFor = async () => {
    const c = await b.newContext({viewport: {width: 420, height: 900}, reducedMotion: 'no-preference'});
    await c.route(URL_ + '**', r => down ? r.fulfill({status: 500, body: 'down'})
      : r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await c.route(HOST + '**', r => {
      let rel = decodeURIComponent(new URL(r.request().url()).pathname).replace(/^\//, ''); if (!rel || rel.endsWith('/')) rel += 'index.html';
      const f = path.join(site, rel); if (!fs.existsSync(f)) return r.fulfill({status: 404, body: 'nope'});
      let body = fs.readFileSync(f); if (/\.html$/.test(f)) body = body.toString().replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`);
      r.fulfill({status: 200, contentType: /\.html$/.test(f) ? 'text/html' : /\.css$/.test(f) ? 'text/css' : 'application/octet-stream', body});
    });
    return c;
  };
  const go = async (c, rel) => { const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message)); await p.goto(HOST + rel); await p.waitForTimeout(250); return p; };
  const code = async (p, c) => { await p.fill('#code', c); await p.click('#code-go'); await p.waitForTimeout(400); };
  const PAGE = 'b2/2026-10-23.html';

  // 1. no code: the homework page and the list show only the code field
  const c1 = await ctxFor();
  let p = await go(c1, PAGE);
  out.noCode = {gate: await p.locator('#gate').count(), tasks: await p.locator('.task-btn').count(), topics: await p.locator('.topic').count(), field: await p.locator('#code').count()};
  if (shots) await p.screenshot({path: path.join(shots, 'gate-page.png')});
  expect('page locked without a code', out.noCode.gate === 1 && !out.noCode.tasks && !out.noCode.topics && out.noCode.field === 1);
  const l = await go(c1, 'b2/index.html');
  out.listNoCode = {gate: await l.locator('#gate').count(), cards: await l.locator('.hw').count(), field: await l.locator('#code').count()};
  if (shots) await l.screenshot({path: path.join(shots, 'gate-list.png')});
  expect('list locked without a code', out.listNoCode.gate === 1 && !out.listNoCode.cards && out.listNoCode.field === 1);
  await code(p, 'nosuch99'); out.wrong = {msg: await p.locator('#sync-msg').innerText(), gate: await p.locator('#gate').count()};
  expect('a wrong code stays locked', /doesn't have this code/.test(out.wrong.msg) && out.wrong.gate === 1);

  // 2. a link to a task + Anna's code → that task opens; her own film on the home screen, not the group's
  const tid = await p.evaluate(() => TASKS.find(t => t.kind === 'gaps').id);
  p = await go(c1, PAGE + '#' + tid); await code(p, 'anna11');
  out.anna = {inTask: await p.locator('.taskbar').count(), title: await p.locator('.task-title').innerText().catch(() => '')};
  expect('after the code the linked task opens', out.anna.inTask === 1);
  await p.click('#home'); await p.waitForTimeout(300);
  out.anna.meter = await p.locator('.meter').innerText(); out.anna.me = await p.locator('.meter-me').count();
  expect('Self: own film, no group meter', out.anna.me === 1 && /Your film/.test(out.anna.meter) && /95 🎞/.test(out.anna.meter) && !/Our group/.test(out.anna.meter));
  // she finishes the gaps task: banner "for your film", and crossing 100 frames is celebrated
  await p.click(`[data-open="${tid}"]`); await p.waitForTimeout(150); await p.click('#fin'); await p.waitForTimeout(1200);
  out.anna.banner = await p.locator('.done-banner').innerText().catch(() => '');
  out.anna.toast = await p.locator('.toast').allInnerTexts();
  out.anna.after = await p.locator('.meter').innerText({timeout: 3000}).catch(async e => 'NO METER: ' + (await p.locator('#app').innerText()).slice(0, 300));
  if (shots) await p.screenshot({path: path.join(shots, 'self-film.png')});
  expect('banner says your film', /for your film/.test(out.anna.banner));
  expect('100 frames celebrated', out.anna.toast.some(t => /100 frames in your film/.test(t)));

  // 3. Ben on the same device: his own film (10 + nothing), not Anna's
  await p.click('#code-change'); await p.waitForLoadState('load'); await p.waitForTimeout(400);
  out.benGate = await p.locator('#gate').count(); expect('Not you? locks again', out.benGate === 1);
  await code(p, 'ben22'); out.ben = await p.locator('.meter').innerText({timeout: 3000}).catch(async e => 'NO METER: ' + (await p.locator('#app').innerText()).slice(0, 400));
  expect('each Self code has its own film', /Your film/.test(out.ben) && /\b10 🎞/.test(out.ben));

  // 4. Olya's views: nothing of Anna's (her ticks are on the B2 page) — the group's meter and "started" count only Mila
  const ov = env.post(JSON.stringify({action: 'overview', code: teacher, pages: ['hw-ge-b2-2026-10-23'], stats: true}));
  out.overview = {started: ov.pages['hw-ge-b2-2026-10-23'].started, students: ov.pages['hw-ge-b2-2026-10-23'].students, groupTotal: ov.groups.B2 && ov.groups.B2.total};
  const before = Number(env.sheets.Settings.get(2, 3)) || 0;
  expect('teacher views leave Self out', out.overview.started === 0 && out.overview.students === 1 && out.overview.groupTotal === before);

  // 5. start page with Anna's code: both lists to choose from; Mila (B2) goes straight to her list and sees the group meter
  const c2 = await ctxFor(); let r = await go(c2, 'index.html'); await code(r, 'anna11');
  out.selfLinks = await r.locator('.self-links a').allInnerTexts(); if (shots) await r.screenshot({path: path.join(shots, 'self-start.png')});
  expect('Self start page: both lists', out.selfLinks.length === 2);
  const c3 = await ctxFor(); r = await go(c3, 'b2/index.html'); await code(r, 'mila11');
  out.mila = {cards: await r.locator('.hw').count(), meter: await r.locator('.meter').innerText().catch(() => '')};
  expect('B2 student: list + group meter', out.mila.cards > 0 && /Our group/.test(out.mila.meter));
  // 6. the table is down: a code this device already used still opens the homework
  down = true; r = await go(c3, PAGE); out.down = {gate: await r.locator('#gate').count(), tasks: await r.locator('.task-btn').count()}; down = false;
  expect('known code opens while the table is down', out.down.gate === 0 && out.down.tasks > 0);
  // 7. a code her table no longer knows: locked again, with a message
  S.d = S.d.filter(row => row[0] !== 'mila11'); r = await go(c3, PAGE); await r.waitForTimeout(300);
  out.removed = {gate: await r.locator('#gate').count(), msg: await r.locator('#sync-msg').innerText().catch(() => '')};
  expect('removed code locks again', out.removed.gate === 1 && /doesn't have this code/.test(out.removed.msg));

  out.errors = errs; console.log(JSON.stringify(out, null, 1));
  console.log(fail.length || errs.length ? 'FAILED: ' + fail.concat(errs).join('; ') : 'OK gate and self-study');
  await b.close();
})();
