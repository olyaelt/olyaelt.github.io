// engine 52 (her decision 31.10: "? = ask Olya, 🔖 = I want to practise this again" — one rule everywhere): "?" beside every gap of a text
// (dlg steps, the old gaps tasks, Revision texts too), on sort cards, on look-back items; it shows once the gap is open, as the bookmark;
// a tap marks it; at Finish it goes to her table with the gap's line (the gap in [ ]); her teacher view lists it under "Where they got stuck"
// and frames the line with the gap named.
//   node tests/marks_everywhere_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mkall-'));
  const copy = (rel, name) => { fs.writeFileSync(path.join(dir, name), fs.readFileSync(path.join(site, rel), 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`)); return 'file://' + path.join(dir, name); };
  const NEW = copy('b2/2026-10-30.html', 'new.html'), OLD = copy('b2/2026-10-23.html', 'old.html'); fs.copyFileSync(path.join(site, 'b2/index.html'), path.join(dir, 'index.html'));
  const env = makeEnv(); env.ctx.setUp(); const S = env.sheets.Students; const tc = S.get(2, 1);
  S.getRange(3, 1, 1, 3).setValues([['s1', 'Mila', 'B2']]);
  const b = await chromium.launch(); const errs = []; const out = {}; const fail = [];
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 900, height: 1000}});
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(NEW); await p.waitForTimeout(200); await p.fill('#code', 's1'); await p.click('#code-go'); await p.waitForTimeout(400);
  const vis = sel => p.locator(sel + ':visible').count();
  // 1. task 1 (Revision, a dlg with the glossary): no ? on a closed gap; open a gap → ? beside its bookmark; tap → marked
  await p.click('[data-open="rev"]'); await p.waitForTimeout(150);
  out.rev = {closed: await vis('.dlg .mk'), all: await p.locator('.dlg .mk').count(), chunks: await p.locator('.panel .dlg .chunk').count()};
  await p.locator('.panel .dlg .chunk').nth(1).click();
  out.rev.open = await vis('.dlg .mk');
  out.rev.order = await p.evaluate(() => { const c = document.querySelectorAll('.panel .dlg .chunk')[1]; const a = c.nextElementSibling, z = a && a.nextElementSibling; return [a && a.className, z && z.className]; });
  await p.locator('.dlg .mk:visible').first().click(); out.rev.on = await p.locator('.dlg .mk.on').count();
  out.rev.snippet = await p.evaluate(() => flags.rev && Object.values(flags.rev)[0].s);
  out.rev.hint = await p.locator('.mk-hint').count();
  if (shots) await p.screenshot({path: path.join(shots, 'mk-gap.png')});
  expect('1 dlg: ? hidden on closed gaps, one per gap', out.rev.closed === 0 && out.rev.all === out.rev.chunks && out.rev.chunks > 3, out.rev);
  expect('1 dlg: open gap → ? after its bookmark, tap marks it', out.rev.open === 1 && /\brev\b/.test(out.rev.order[0]) && /\bmk\b/.test(out.rev.order[1]) && out.rev.on === 1, out.rev);
  expect('1 dlg: what it sends = the line, the gap in [ ]', /^[A-Z][A-Za-z]*: .*\[.+\]/.test(out.rev.snippet || ''), out.rev.snippet);
  for (let i = 0; i < 6 && !(await p.locator('.end, .lesson-head').count()); i++) { await p.click('#go'); await p.waitForTimeout(80); }
  await p.waitForTimeout(400);
  out.sent = env.sheets.Work.d.filter(r => r.some(c => /marked/.test(String(c)))).map(r => r.join(' | ')).slice(-1)[0] || '';
  if (!out.sent) out.sent = 'rows: ' + JSON.stringify(env.sheets.Work.d.slice(-2));
  expect('1 Finish: the mark is in her table with its line', /\[.+\]/.test(out.sent), out.sent);
  await p.click('#list, #home').catch(() => {}); await p.waitForTimeout(200);
  // 2. Over to you: step 1 is the chat to read; Sam's question is one hidden gap, with ? once it's open
  await p.goto(NEW); await p.waitForTimeout(300); await p.click('[data-open="write"]'); await p.waitForTimeout(150);
  out.write = await p.evaluate(() => ({count: document.querySelector('.taskbar .count') && document.querySelector('.taskbar .count').textContent, chunks: document.querySelectorAll('.panel .dlg .chunk').length,
    intro: (document.querySelector('.situation') || {}).textContent || '', go: document.getElementById('go').textContent, spk: [...document.querySelectorAll('.dlg .spk')].map(x => x.textContent).join('')}));
  await p.locator('.panel .dlg .chunk').first().click(); out.write.mk = await vis('.dlg .mk');
  if (shots) await p.screenshot({path: path.join(shots, 'mk-otu-read.png')});
  expect('2 Over to you starts with the chat: one gap (Sam\'s question), ? when open', /1 of 4/.test(out.write.count) && out.write.chunks === 1 && /What did Sam ask/.test(out.write.intro) && /^Sam:You:You:Sam:You:Sam:You:$/.test(out.write.spk) && out.write.mk === 1, out.write);
  await p.click('#go'); await p.waitForTimeout(100); out.write.task = await p.locator('.stage').innerText();
  expect('2 then the task in the new wording', /Now it's your turn/.test(out.write.task), out.write.task.slice(0, 80));
  // 3. sort: English label big, Russian small; the intro on top; ? on the card
  await p.goto(NEW); await p.waitForTimeout(300); await p.click('[data-open="sort"]'); await p.waitForTimeout(150);
  out.sort = await p.evaluate(() => { const sp = document.querySelector('.sp'); return {first: sp.firstElementChild.className, en: sp.querySelector('.sp-en').textContent, ru: sp.querySelector('.sp-ru').textContent,
    enSize: parseFloat(getComputedStyle(sp.querySelector('.sp-en')).fontSize), ruSize: parseFloat(getComputedStyle(sp.querySelector('.sp-ru')).fontSize), instr: (document.querySelector('.instr') || {}).textContent || ''}; });
  await p.click('#go'); await p.waitForTimeout(100); out.sort.mk = await vis('.sort-card .mk');
  if (shots) await p.screenshot({path: path.join(shots, 'mk-sort.png')});
  expect('3 sort: English pattern first and big, Russian small; intro on top; ? on the card', out.sort.first === 'sp-en' && out.sort.en === "I'd recommend + what" && out.sort.ru === 'советую' && out.sort.enSize > out.sort.ruSize && /Let's compare/.test(out.sort.instr) && out.sort.mk === 1, out.sort);
  // 4. her teacher view: "Where they got stuck" lists task 1; the line is framed, the gap named
  await p.goto(NEW); await p.waitForTimeout(300);
  await p.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await p.reload(); await p.waitForTimeout(300);
  await p.fill('#code', tc); await p.click('#code-go'); await p.waitForTimeout(500);
  out.hot = (await p.locator('section.hot:not(.wait):not(.unl-note)').innerText()).replace(/\s+/g, ' ');
  await p.click('[data-stuck="rev"]'); await p.waitForTimeout(400);
  out.framed = await p.locator('.dlg p.t-marked').count(); out.label = (await p.locator('.t-mk-who').first().innerText().catch(() => 'none')).replace(/\s+/g, ' ');
  if (shots) await p.screenshot({path: path.join(shots, 'mk-teacher.png'), fullPage: true});
  expect('4 teacher: stuck lists task 1, its line framed, the gap named', /Any recommendations\? Three exchanges from class.*❔ 1/.test(out.hot) && out.framed === 1 && /❔ Mila · “.+”/.test(out.label), {hot: out.hot, framed: out.framed, label: out.label});
  // 5. an older page with a gaps task (Revision texts): ? on its gaps too
  const ctx2 = await b.newContext({viewport: {width: 900, height: 1000}});
  await ctx2.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(OLD); await p2.waitForTimeout(200); await p2.fill('#code', 's1'); await p2.click('#code-go'); await p2.waitForTimeout(400);
  const gid = await p2.evaluate(() => (TASKS.find(t => t.kind === 'gaps') || {}).id);
  await p2.click(`[data-open="${gid}"]`); await p2.waitForTimeout(150);
  out.old = {closed: await p2.locator('.dlg .mk:visible').count()}; await p2.locator('.panel .dlg .chunk').first().click(); out.old.open = await p2.locator('.dlg .mk:visible').count();
  expect('5 old gaps task: ? on its gaps once open', gid && out.old.closed === 0 && out.old.open === 1, {gid, ...out.old});
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK marks everywhere'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
