// Students see only their own group: a code from the other group goes to that group's list; the teacher sees both.
//   node tests/group_check.js SITE_DIR
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'group-'));
  const B = 'b2/2026-10-23.html', C = 'c1/2026-10-23.html';
  for (const f of ['index.html', 'b2/index.html', 'c1/index.html', B, C]) {
    fs.mkdirSync(path.dirname(path.join(tmp, f)), {recursive: true});
    fs.writeFileSync(path.join(tmp, f), fs.readFileSync(path.join(site, f), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  }
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 3, 3).setValues([['bob1', 'Bob', 'B2'], ['cat1', 'Cat', 'C1'], ['oli1', 'Oli', '']]);
  const out = {}, errs = [];
  const P = o => env.post(JSON.stringify(o));
  out.server = {
    b2codeOnC1: P({code: 'bob1', page: 'hw-ge-c1-2026-10-23'}),
    b2summaryOfC1: P({action: 'summary', code: 'bob1', pages: ['hw-ge-c1-2026-10-23']}),
    b2codeOnB2gid: P({code: 'bob1', page: 'hw-ge-b2-2026-10-23'}).gid,
    noGroupOnC1: P({code: 'oli1', page: 'hw-ge-c1-2026-10-23'}).ok,
  };
  const b = await chromium.launch();
  const fresh = async (init) => {
    const ctx = await b.newContext({viewport: {width: 390, height: 800}});
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    if (init) await ctx.addInitScript(init);
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); return p;
  };
  const go = async (p, f) => { await p.goto('file://' + path.join(tmp, f)); await p.waitForTimeout(500); return path.relative(tmp, decodeURIComponent(new URL(p.url()).pathname)); };
  const enter = async (p, code) => { await p.fill('#code', code); await p.click('#code-go'); await p.waitForTimeout(700); return path.relative(tmp, decodeURIComponent(new URL(p.url()).pathname)); };

  // a B2 student types their code on the C1 homework, then wanders around
  let p = await fresh();
  await go(p, C); out.b2codeOnC1page = await enter(p, 'bob1');
  out.thenC1list = await go(p, 'c1/index.html');
  out.thenC1page = await go(p, C);
  out.thenStart = await go(p, 'index.html');
  out.ownPageStays = await go(p, B);
  out.ownPageHasTasks = await p.locator('[data-toggle]').count();
  // a C1 student on the start page
  p = await fresh(); await go(p, 'index.html');
  out.startNoCode = {groups: await p.locator('.group').count(), codeField: await p.locator('#code').count(), text: (await p.locator('header').innerText()).replace(/\s+/g, ' ')};
  out.c1codeOnStart = await enter(p, 'cat1');
  // a B2 student on the C1 list
  p = await fresh(); await go(p, 'c1/index.html'); out.b2codeOnC1list = await enter(p, 'bob1');
  // a code saved before this change (no group remembered yet)
  p = await fresh(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('hw-code', 'bob1'); } });
  out.oldCodeOnC1page = await go(p, C);
  // a student with no group in the table is never sent away
  p = await fresh(); await go(p, C); out.noGroupStays = await enter(p, 'oli1');
  // the teacher sees both groups
  p = await fresh(); await go(p, 'index.html'); await enter(p, tc); await p.waitForTimeout(500);
  out.teacherStart = (await p.locator('.group h2').allInnerTexts()).join(' | ');
  out.teacherOnC1page = await go(p, C);
  out.teacherBar = (await p.locator('.teacher-bar').count()) > 0;
  out.bobRowsForC1 = env.sheets.State.d.filter(r => r[1] === 'bob1' && String(r[2]).includes('-c1-')).length;
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
