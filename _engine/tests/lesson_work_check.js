// Lesson work (30.10, her wish for «Running late»): on late-live.html each group's text goes to her table while they type and on Send;
// her 📥 Groups tab shows one card per group (name if a student's code is on that device, else Group 2…), she points at words and
// sends a quick note; the group sees it above their input (or 💬 on the chat's dot if they moved on); ✓ seen; Copy all / without names;
// Start fresh hides what's there; a refresh never wipes her half-typed note; the plain late.html sends nothing.
//   node tests/lesson_work_check.js SITE_DIR [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', PAGE = 'tools/b2-2026-10-30/late';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'B2', '']);
  let posts = 0, plainPosts = 0;
  const b = await chromium.launch();
  const open = async (rel, who, opts = {}) => {
    const c = await b.newContext(Object.assign({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'}, opts));
    await c.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    if (who === 'anna') await c.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-role', ''); });
    await c.route(/script\.google\.com/, r => { posts++; if (!/-live/.test(rel)) plainPosts++;
      return r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(path.dirname(path.join(site, rel)), '_lw_test_' + path.basename(rel)); fs.writeFileSync(tmp, src);
    await p.goto('file://' + tmp); await p.waitForTimeout(300); fs.unlinkSync(tmp); return p;
  };
  const rows = () => (env.sheets['Lesson work'] ? env.sheets['Lesson work'].d.slice(1) : []);
  const notes = () => (env.sheets['Lesson notes'] ? env.sheets['Lesson notes'].d.slice(1) : []);
  const flush = p => p.evaluate(() => shareFlush()).then(() => p.waitForTimeout(150));

  // ---- two groups type in chat 2: Anna's laptop (her code is saved there) and an anonymous one
  const A = await open(PAGE + '-live.html', 'anna'), B = await open(PAGE + '-live.html', '');
  for (const p of [A, B]) { await p.click('.acts.wide [data-next]'); await p.waitForTimeout(200); }
  out.shareNote = {a: await A.locator('.share-note').innerText(), b: await B.locator('.share-note').innerText()};
  expect('the page tells them Olya sees what they type (with your name only where a code is saved)', /Olya sees what you type/.test(out.shareNote.a) && /with your name/.test(out.shareNote.a) && !/with your name/.test(out.shareNote.b), out.shareNote);
  await A.fill('#msg', 'Sorry Sarah, I stuck at traffic'); await B.fill('#msg', 'Hello, I am late');
  await A.waitForTimeout(3000);                                                            // 2.5 s after they stop typing
  out.drafts = rows().map(r => [r[2], r[4], r[6], r[7]]);
  expect('drafts reach her table while they type, name only with a code', out.drafts.length === 2 && out.drafts.some(r => r[1] === 'Anna' && r[3] === 'typing' && /stuck at traffic/.test(r[2])) && out.drafts.some(r => r[1] === '' && /I am late/.test(r[2])), out.drafts);

  // ---- her screen: 📥 Groups, one card per group
  const O = await open(PAGE + '-live.html', 'teacher');
  out.teacherNoteLine = await O.locator('.share-note').count(); expect('her screen never sends (no "Olya sees" line)', out.teacherNoteLine === 0, out.teacherNoteLine);
  out.tabs = await O.locator('.stage-btn').allInnerTexts(); expect('Groups tab on her screen only', out.tabs.some(t => /Groups/.test(t)) && !(await A.locator('.stage-btn[data-stage="groups"]').count()), out.tabs);
  await O.click('.stage-btn[data-stage="groups"]'); await O.waitForTimeout(400);
  out.cards = await O.locator('.gw-card .nm').allInnerTexts();
  out.cardText = await O.locator('.gw-card').first().locator('[data-text]').innerText();
  expect('a card per group: Anna by name, the other anonymous', out.cards.join('|') === 'Group 1 — Anna|Group 2' && /stuck at traffic/.test(out.cardText), {cards: out.cards, t: out.cardText});
  out.state = await O.locator('.gw-card').first().locator('.stt').innerText(); expect('typing… shown', /typing/.test(out.state), out.state);

  // she points at "stuck at traffic" and taps a quick note
  await O.evaluate(() => { const tx = document.querySelector('.gw-card [data-text]'), node = tx.firstChild, t = node.textContent, a = t.indexOf('stuck at traffic');
    const r = document.createRange(); r.setStart(node, a); r.setEnd(node, a + 'stuck at traffic'.length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await O.waitForTimeout(150);
  out.pick = await O.locator('.gw-card').first().locator('[data-pick]').innerText(); expect('the words she picked are shown', /stuck at traffic/.test(out.pick), out.pick);
  await O.locator('.gw-card').first().locator('[data-quick]', {hasText: 'Check the verb form'}).click(); await O.waitForTimeout(300);
  out.noteRow = notes().map(r => [r[3], r[5], r[6], r[7]]);
  expect('her note is kept with the words and the chat', out.noteRow.length === 1 && out.noteRow[0][0] === 1 && out.noteRow[0][1] === 'Anna' && out.noteRow[0][2] === 'stuck at traffic' && /verb form/.test(notes()[0][8]), notes());
  out.marked = await O.locator('.gw-card').first().locator('[data-text] .m-note').allInnerTexts(); expect('the words are marked on her card', out.marked.includes('stuck at traffic'), out.marked);
  out.said = await O.locator('.gw-card').first().locator('[data-said]').innerText(); expect('she sees it went', /sent to them/.test(out.said), out.said);
  // her feedback buttons, as on the homework feedback page: ✓ Good on "Sorry Sarah", ✎ Correction on "I stuck"
  const pickIn = (card, words) => O.evaluate(([k, w]) => { const tx = document.querySelectorAll('.gw-card [data-text]')[k];
    const at = tx.textContent.indexOf(w); if (at < 0) return false;                       // across marks, as a mouse would select
    const walk = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT), r = document.createRange(); let n, pos = 0, started = false;
    while ((n = walk.nextNode())) { const len = n.textContent.length;
      if (!started && at < pos + len) { r.setStart(n, at - pos); started = true; }
      if (started && at + w.length <= pos + len) { r.setEnd(n, at + w.length - pos); break; } pos += len; }
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; }, [card, words]);
  const aCard0 = O.locator('.gw-card').first();
  await aCard0.locator('[data-mk="change"]').click(); await O.waitForTimeout(100);
  out.noWords = await aCard0.locator('[data-pick]').innerText(); expect('✗ without words: "select words first"', /Select words/.test(out.noWords), out.noWords);
  await pickIn(0, 'Sorry Sarah'); await O.waitForTimeout(100); await aCard0.locator('[data-mk="good"]').click(); await O.waitForTimeout(300);
  await pickIn(0, 'I stuck'); await O.waitForTimeout(100); await aCard0.locator('[data-mk="fix"]').click(); await O.waitForTimeout(100);
  out.fixBox = await aCard0.locator('[data-own] input').inputValue(); expect('✎ Correction: the box takes the words', out.fixBox === 'I stuck', out.fixBox);
  await aCard0.locator('[data-own] input').fill("I'm stuck in"); await aCard0.locator('[data-own] button').click(); await O.waitForTimeout(300);
  out.marks = notes().map(r => [r[6], r[7], r[8]]);
  expect('Good and Correction kept with their marks', JSON.stringify(out.marks.slice(1)) === JSON.stringify([['Sorry Sarah', 'good', ''], ['I stuck', 'fix', "I'm stuck in"]]), out.marks);
  out.cardMarks = await O.evaluate(() => { const t = document.querySelector('.gw-card [data-text]'); return {good: [...t.querySelectorAll('.m-good')].map(x => x.textContent), del: [...t.querySelectorAll('.m-del')].map(x => x.textContent), ins: [...t.querySelectorAll('.m-ins')].map(x => x.textContent)}; });
  expect('her card shows the marks as on the feedback page', out.cardMarks.good.includes('Sorry Sarah') && out.cardMarks.del.includes('I stuck') && out.cardMarks.ins.includes("I'm stuck in"), out.cardMarks);
  out.boxBack = {v: await aCard0.locator('[data-own] input').inputValue(), b: await aCard0.locator('[data-own] button').innerText()}; expect('the box is back to notes', out.boxBack.v === '' && out.boxBack.b === 'Send', out.boxBack);

  // the group sees it above their input, while they are still typing
  await A.evaluate(() => notesPoll()); await A.waitForTimeout(200);
  out.groupNote = await A.locator('#tnotes .t-note').allInnerTexts(); out.stillTyping = await A.inputValue('#msg');
  out.groupMarks = await A.evaluate(() => ({good: [...document.querySelectorAll('#tnotes .m-good')].map(x => x.textContent), del: [...document.querySelectorAll('#tnotes .m-del')].map(x => x.textContent), ins: [...document.querySelectorAll('#tnotes .m-ins')].map(x => x.textContent)}));
  expect('the group sees her notes above the input, their text untouched', out.groupNote.length === 3 && /stuck at traffic/.test(out.groupNote[0]) && /verb form/.test(out.groupNote[0]) && /stuck at traffic/.test(out.stillTyping), {n: out.groupNote, t: out.stillTyping});
  expect('…in her feedback marks: Good green, Correction struck → blue', out.groupMarks.good.includes('Sorry Sarah') && out.groupMarks.del.includes('I stuck') && out.groupMarks.ins.includes("I'm stuck in"), out.groupMarks);
  if (shots) await A.screenshot({path: path.join(shots, 'lw-group-note.png')});
  out.bNotes = await B.locator('#tnotes .t-note').count(); expect('the other group does not get it', out.bNotes === 0, out.bNotes);
  await A.evaluate(() => notesPoll()); await A.waitForTimeout(150);                        // reports "seen"
  await O.evaluate(() => gwFetch()); await O.waitForTimeout(250);
  out.seen = await O.locator('.gw-card').first().locator('[data-notes]').innerText(); expect('✓ seen on her card', /seen/.test(out.seen) && !/not seen/.test(out.seen), out.seen);

  // they fix it and send; her card says sent
  await A.fill('#msg', "So sorry, Sarah, I'm stuck in traffic. I'll be 20 minutes late."); await A.click('[data-send]'); await A.waitForTimeout(400);
  await O.evaluate(() => gwFetch()); await O.waitForTimeout(250);
  out.sentState = {st: await O.locator('.gw-card').first().locator('.stt').innerText(), t: await O.locator('.gw-card').first().locator('[data-text]').innerText()};
  expect('Send → ✓ sent with the new text', /sent/.test(out.sentState.st) && /stuck in traffic/.test(out.sentState.t), out.sentState);
  out.afterSend = await A.locator('.compose-note').innerText(); expect('after Send: "Olya sees it too"', /Olya sees it too/.test(out.afterSend), out.afterSend);

  // group B moves on to chat 3; her note on chat 2 lights the dot and a "note in chat 2" line
  await B.evaluate(() => shareFlush()); await B.waitForTimeout(150);
  await B.click('.acts.wide [data-next]'); await B.waitForTimeout(200); await B.fill('#msg', 'Sorry guys'); await flush(B);
  await O.evaluate(() => gwFetch()); await O.waitForTimeout(250);
  const bCard = O.locator('.gw-card').nth(1);
  out.bNow = await bCard.locator('[data-who] .ch').innerText(); expect('her card follows the group to chat 3', /Chat 3/i.test(out.bNow), out.bNow);
  await bCard.locator('[data-own] input').fill('Who are you writing to? Friends!'); await bCard.locator('[data-own] button').click(); await B.waitForTimeout(300);
  out.bNoteChat = notes().slice(-1)[0][3]; expect('a typed note goes to the chat they are on', out.bNoteChat === 2, out.bNoteChat);
  // a note for chat 2 while they are on chat 3 (sent straight to the table, as from an earlier card)
  env.post(JSON.stringify({action: 'toolNote', code: T, tool: 'b2-2026-10-30/late', dev: await B.evaluate(() => DEV), chat: 1, quote: 'I am late', note: '🎩 Too informal?'}));
  await B.evaluate(() => notesPoll()); await B.waitForTimeout(250);
  out.bHere = await B.locator('#tnotes .t-note').allInnerTexts(); out.toast = await B.locator('#ttoast').innerText(); out.dot = await B.locator('.sc-dots [data-go="1"].noted').count();
  expect('B: the note for this chat above the input, the other one as 💬 on its dot + a line', out.bHere.length === 1 && /Friends/.test(out.bHere[0]) && /chat 2/.test(out.toast) && out.dot === 1, {here: out.bHere, toast: out.toast, dot: out.dot});
  await B.click('#ttoast [data-go]'); await B.waitForTimeout(250);
  out.bThere = await B.locator('#tnotes .t-note').allInnerTexts(); out.dotAfter = await B.locator('.sc-dots .noted').count();
  expect('Open → chat 2 with the note, the dot calms down', out.bThere.length === 1 && /informal/.test(out.bThere[0]) && out.dotAfter === 0, {there: out.bThere, dot: out.dotAfter});
  if (shots) await B.screenshot({path: path.join(shots, 'lw-group-toast.png')});

  // a refresh never wipes her half-typed note or the words she picked
  const aCard = O.locator('.gw-card').first();
  await aCard.locator('[data-own] input').fill('Nice — and the time?'); await O.evaluate(() => gwFetch()); await O.waitForTimeout(250); await O.evaluate(() => render()); await O.waitForTimeout(150);
  out.kept = await O.locator('.gw-card').first().locator('[data-own] input').inputValue(); expect('her half-typed note survives a refresh', out.kept === 'Nice — and the time?', out.kept);
  if (shots) await O.screenshot({path: path.join(shots, 'lw-teacher.png')});

  // 📋 Copy all / without names
  await O.click('[data-gw-copy="names"]'); await O.waitForTimeout(200); out.copy = await O.evaluate(() => navigator.clipboard.readText());
  await O.click('[data-gw-copy=""]'); await O.waitForTimeout(200); out.copyAnon = await O.evaluate(() => navigator.clipboard.readText());
  expect('Copy all: by chat, names, notes, drafts marked', /Chat 2 · Sarah/.test(out.copy) && /Group 1 — Anna: So sorry/.test(out.copy) && /“stuck at traffic” — 🔍 Check the verb form/.test(out.copy) && /✓ “Sorry Sarah”/.test(out.copy) && /✎ “I stuck” → I'm stuck in/.test(out.copy) && /Group 2 \(draft\): Sorry guys/.test(out.copy) && /Chat 3/.test(out.copy), out.copy);
  expect('Without names: Group 1, Group 2', !/Anna/.test(out.copyAnon) && /Group 1: So sorry/.test(out.copyAnon), out.copyAnon);

  // 🧹 Start fresh (after her morning test): the cards go, the table keeps everything; "Show them" brings them back
  await O.click('[data-gw-fresh]'); await O.click('[data-gw-fresh]'); await O.waitForTimeout(200);
  out.fresh = {cards: await O.locator('.gw-card').count(), table: rows().length}; expect('Start fresh: no cards, the table keeps the rows', out.fresh.cards === 0 && out.fresh.table >= 3, out.fresh);
  await B.fill('#msg', 'Sorry, so sorry'); await flush(B); await O.evaluate(() => gwFetch()); await O.waitForTimeout(250);
  out.afterFresh = await O.locator('.gw-card .nm').allInnerTexts(); expect('new typing after Start fresh shows up', out.afterFresh.length === 1, out.afterFresh);
  await O.click('[data-gw-all]'); await O.waitForTimeout(200); out.all = await O.locator('.gw-card').count(); expect('Show them: all back', out.all === 2, out.all);

  // the script not redeployed yet: she gets the steps instead of an empty page
  const Old = await open(PAGE + '-live.html', 'teacher'); await Old.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify({ok: false, error: 'no-page'})}));
  await Old.click('.stage-btn[data-stage="groups"]'); await Old.waitForTimeout(400); out.old = await Old.locator('#gw-meta').innerText();
  expect('old script → the redeploy steps', /New version/.test(out.old), out.old);

  // phone: the note fits, no sideways scroll
  const Ph = await open(PAGE + '-live.html', 'anna', {...devices['iPhone 13'], reducedMotion: 'reduce'});
  await Ph.click('.acts.narrow [data-next]'); await Ph.waitForTimeout(200); await Ph.fill('#msg', 'Sorry, I stuck at traffic, sorry'); await flush(Ph);
  env.post(JSON.stringify({action: 'toolNote', code: T, tool: 'b2-2026-10-30/late', dev: await Ph.evaluate(() => DEV), chat: 1, quote: 'stuck at traffic', note: '🔍 Check the verb form'}));
  await Ph.evaluate(() => notesPoll()); await Ph.waitForTimeout(250);
  out.phone = await Ph.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth, notes: document.querySelectorAll('#tnotes .t-note').length}));
  expect('phone: the note shows, no sideways scroll', out.phone.w <= out.phone.vw && out.phone.notes === 1, out.phone);
  if (shots) await Ph.screenshot({path: path.join(shots, 'lw-phone.png'), fullPage: true});

  // the plain page sends nothing and says so
  const Pl = await open(PAGE + '.html', 'anna'); await Pl.click('.acts.wide [data-next]'); await Pl.fill('#msg', 'Sorry!'); await Pl.waitForTimeout(3000); await Pl.click('[data-send]'); await Pl.waitForTimeout(300);
  out.plain = {posts: plainPosts, note: await Pl.locator('.compose-note').innerText(), share: await Pl.locator('.share-note').count()};
  expect('plain page: nothing sent, "only on this device"', out.plain.posts === 0 && /only on this device/.test(out.plain.note) && out.plain.share === 0, out.plain);

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK lesson work'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
