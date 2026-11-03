// tools 24 (her 1.11 21:55: «перетащить куски урока самой… на карточку кликнуть и поменять текст»): on a lesson page's -live version
//  · she drags a stage button (Use it back before Say it naturally — the page itself has it after since 2.11) → her order is saved
//    in her table; a group gets it at its next tap: the buttons in the new order, Next at the end of Make it perfect goes to Use it;
//    a group already in a part stays there;
//  · ✏️ on a card (Card / Red word / Answer / Instruction) and on a line with gaps ([[…]] = the yellow gap) → the group sees the new text at
//    its next tap; ↩ Original brings the page's own text back; 📋 My changes lists what she changed; the groups' screens show no ✏️.
//   node tests/live_field_check.js SITE_DIR
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', PAGE = 'tools/c1-2026-11-04/practical-things';
(async () => {
  const site = path.resolve(process.argv[2]), out = {}, errs = [], fail = [];
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  const b = await chromium.launch(); const tmps = [];
  const open = async (who) => {
    const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
    await c.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await c.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message));
    const rel = PAGE + '-live.html', src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(path.dirname(path.join(site, rel)), '_lf_' + who + '_' + path.basename(rel)); fs.writeFileSync(tmp, src); tmps.push(tmp);
    await p.goto('file://' + tmp); await p.waitForTimeout(400); return p;
  };
  const pills = p => p.evaluate(() => [...document.querySelectorAll('.stages .stage-btn[data-stage]')].filter(x => /^\d+$/.test(x.dataset.stage)).map(x => x.textContent.trim()));
  const at = (p, si, bi) => p.evaluate(([si, bi]) => { S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = bi; render(); }, [si, bi]).then(() => p.waitForTimeout(250));
  const O = await open('teacher'), G = await open('group');
  out.groupEdit = await G.locator('.led-b').count(); expect('the groups\' screens: no ✏️', out.groupEdit === 0, out.groupEdit);

  // ---- 1. her order: Use it before Say it naturally
  out.before = await pills(O);
  const council = O.locator('.stage-btn', {hasText: 'Use it'}), sayNat = O.locator('.stage-btn', {hasText: 'Say it naturally'});
  const box = await sayNat.boundingBox();
  await council.dragTo(sayNat, {targetPosition: {x: 4, y: box.height / 2}}); await O.waitForTimeout(500);
  out.herOrder = await pills(O); out.stored = (env.sheets.Live ? env.sheets.Live.d.slice(1) : []).map(r => r.join(' | ').slice(0, 200));
  expect('she drags Use it before Say it naturally → her buttons in the new order', out.herOrder.join(' > ').includes('Make it perfect > 🎲 Use it > 🗣 Say it naturally'), out);
  // the group gets it at its next tap
  await G.evaluate(() => liveFetch(false)); await G.waitForTimeout(300);
  out.groupBeforeTap = await pills(G);
  await at(G, 1, 0); out.groupAfterTap = await pills(G);
  expect('the group: unchanged until its next tap, then the new order', !out.groupBeforeTap.join(' > ').includes('Use it > 🗣 Say it naturally') && out.groupAfterTap.join(' > ').includes('Use it > 🗣 Say it naturally'), {b: out.groupBeforeTap, a: out.groupAfterTap});
  await G.evaluate(() => { S.at[1] = D.stages[1].blocks.length - 1; render(); }); await G.evaluate(() => stepOn()); await G.waitForTimeout(200);
  out.nextFromPerfect = await G.evaluate(() => D.stages[S.stage].label);
  expect('Next at the end of Make it perfect → Use it', /Use it/.test(out.nextFromPerfect), out.nextFromPerfect);

  // ---- 2. ✏️ a card: the first key-word card of Say it naturally
  const si = await O.evaluate(() => D.stages.findIndex(s => /naturally/.test(s.label)));
  const deckBi = await O.evaluate(si => D.stages[si].blocks.findIndex(b => b.kind === 'cards'), si);
  await at(O, si, deckBi);
  await O.click('.led-card .led-b'); await O.waitForTimeout(150);
  out.cardForm = await O.evaluate(() => [...document.querySelectorAll('.live-edit label span')].map(x => x.textContent));
  expect('✏️ on a card: Card · Red word · Answer · Instruction', ['Instruction', 'Card', 'Red word', 'Answer'].every(k => out.cardForm.includes(k)), out.cardForm);
  await O.locator('.live-edit textarea[data-p$=".front"]').fill('Pilates? Isn\'t that just lying on a mat?');
  await O.click('[data-live-save]'); await O.waitForTimeout(400);
  out.herCard = await O.evaluate(() => (document.querySelector('.fc .say') || {}).textContent || '');
  expect('her card shows the new sentence at once', /Pilates/.test(out.herCard), out.herCard);
  await G.evaluate(() => liveFetch(false)); await G.waitForTimeout(200); await at(G, si, deckBi);
  out.groupCard = await G.evaluate(() => (document.querySelector('.fc .say') || {}).textContent || '');
  expect('the group sees it at its next tap', /Pilates/.test(out.groupCard), out.groupCard);

  // ---- 3. ✏️ a line with gaps
  const txtBi = await O.evaluate(si => D.stages[si].blocks.findIndex(b => b.kind === 'text' && JSON.stringify(b.lines).includes('"r"')), si);   /* the first text with gaps (a meaning screen comes first since 2.11) */
  await at(O, si, txtBi);
  await O.locator('.dlg p[data-live-host] .led-b').first().click(); await O.waitForTimeout(150);
  out.lineMark = await O.locator('.live-edit textarea').first().inputValue(); out.lineHelp = await O.locator('.led-help').count();
  expect('the line as text: the gap in [[…]], with the help line', /\[\[than you'd think\]\]/.test(out.lineMark) && out.lineHelp === 1, out.lineMark);
  await O.locator('.live-edit textarea').first().fill("Something I learned at school that I still use… I use it [[a lot more]] than you'd think.");
  await O.click('[data-live-save]'); await O.waitForTimeout(400);
  await G.evaluate(() => liveFetch(false)); await G.waitForTimeout(200); await at(G, si, txtBi);
  out.groupLine = await G.evaluate(() => { const l = document.querySelector('.dlg p'); return {text: l.textContent, gap: (l.querySelector('.gp .r') || {}).textContent || ''}; });
  expect('the group: the new line, its gap = "a lot more"', /still use/.test(out.groupLine.text) && out.groupLine.gap === 'a lot more', out.groupLine);

  // ---- 4. 📋 My changes, then ↩ Original
  out.changes = await O.evaluate(() => liveChangesText());
  expect('📋 My changes: the order and both corrections', /New order \(stages\)/.test(out.changes) && /Pilates/.test(out.changes) && /a lot more/.test(out.changes), out.changes);
  await O.locator('.dlg p[data-live-host] .led-b').first().click(); await O.waitForTimeout(150);
  await O.click('[data-live-orig]'); await O.waitForTimeout(400);
  out.backLine = await O.evaluate(() => document.querySelector('.dlg p').textContent);
  expect('↩ Original: the page\'s own line again', /come in handy/.test(out.backLine), out.backLine);

  for (const t of tmps) { try { fs.unlinkSync(t); } catch (e) {} }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK live field'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
