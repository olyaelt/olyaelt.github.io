// The old-homework import: ticks, Progress columns in date order, a text with feedback, Frames before the pages, a second run changes nothing,
// and what a student and the teacher then see on the pages.
//   node tests/import_check.js IMPORT.json SITE_DIR [shots_dir]     (IMPORT.json = {title, rows} from the import .xlsx)
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const imp = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), site = path.resolve(process.argv[3]), shots = process.argv[4];
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  const names = [...new Set(imp.rows.slice(1).map(r => r[1]).filter(Boolean))];   // the students named in the import file
  const G = imp.rows[1][2], g = G.toLowerCase();                                    // the group of the import file
  S.getRange(3, 1, names.length, 3).setValues(names.map((n, i) => ['c' + i + 'x', n, G]));
  const P = o => env.post(JSON.stringify(o));
  // a student already ticked something on the newest page before the import (its columns exist; the tick must stay)
  const newest = imp.rows.filter(r => r[0] === 'task').map(r => r[3]).sort().pop();
  const pre = imp.rows.find(r => r[0] === 'tick' && r[3] === newest);
  if (pre) P({code: 'c' + names.indexOf(pre[1]) + 'x', page: newest, date: pre[4], tasks: imp.rows.filter(r => r[0] === 'task' && r[3] === newest).map(r => ({id: r[5], title: r[6], frames: r[7]})),
     events: [{task: pre[5], done: true, ts: Date.now() - 1000}]});
  const load = () => { const sh = env.ctx.SpreadsheetApp.getActiveSpreadsheet().insertSheet(imp.title); imp.rows.forEach(r => sh.appendRow(r)); };
  load(); env.ctx.applyImportedTicks();
  const out = {first: env.ctx.alerts.pop()};
  const prog = env.sheets['Progress ' + G];
  out.columnsOrder = [...new Set(prog.d[0].slice(1).map(k => String(k).split('|')[0].slice(-10)))];
  const tr = imp.rows.find(r => r[0] === 'text') || [], writer = tr[1], wfile = g + '/' + String(tr[3]).slice(-10) + '.html';
  out.writer = prog.d.find(r => r[0] === writer).filter(Boolean).join(' | ');
  out.stateRows = env.sheets.State.getLastRow() - 1;
  out.work = env.sheets.Work.d.slice(1).map(r => [r[2], r[4], r[5], String(r[7]).slice(0, 30), String(r[9]).slice(0, 40)]);
  out.settings = env.sheets.Settings.d.find(r => r[0] === G).slice(0, 7).map(String);
  out.importTabGone = !env.sheets[imp.title];
  load(); env.ctx.applyImportedTicks(); out.second = env.ctx.alerts.pop(); out.stateRowsAfterSecond = env.sheets.State.getLastRow() - 1;
  // what the student and Olya see
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'imp-'));
  for (const f of [g + '/index.html', wfile]) {
    fs.mkdirSync(path.dirname(path.join(tmp, f)), {recursive: true});
    fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(site, f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  }
  const b = await chromium.launch(); const errs = [];
  const fresh = async () => { const ctx = await b.newContext({viewport: {width: 390, height: 844}});
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); return p; };
  let p = await fresh();
  await p.goto('file://' + path.join(tmp, g + '/index.html')); await p.fill('#code', 'c' + names.indexOf(writer) + 'x'); await p.click('#code-go'); await p.waitForTimeout(700);
  out.writerList = (await p.locator('.prog span').allInnerTexts()).join(' | ') + ' || ' + (await p.locator('.fb').allInnerTexts()).join(' | ');
  out.meter = (await p.locator('.meter').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 60);
  if (shots) await p.screenshot({path: path.join(shots, 'writer-list.png'), fullPage: true});
  await p.goto('file://' + path.join(tmp, wfile)); await p.waitForTimeout(700);
  out.writerTicksThere = await p.locator('.status[aria-pressed="true"]').count();
  out.writerFbLine = (await p.locator('[data-fbslot="write"]').innerText()).replace(/\s+/g, ' ');
  await p.locator('[data-fbslot="write"] .fb-line').first().click().catch(() => {}); await p.waitForTimeout(400);
  out.fbShown = (await p.locator('.fb-good').count()) + ' good · ' + (await p.locator('.fb-del').count()) + ' change · ' + (await p.locator('.fb-ins').count()) + ' Olya';
  if (shots) await p.screenshot({path: path.join(shots, 'writer-feedback.png'), fullPage: true});
  p = await fresh();
  await p.goto('file://' + path.join(tmp, wfile)); await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(800);
  out.teacherChips = (await p.locator('.t-line').allInnerTexts()).slice(0, 4).map(s => s.replace(/\s+/g, ' ').slice(0, 90));
  if (shots) await p.screenshot({path: path.join(shots, 'teacher.png'), fullPage: true});
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
