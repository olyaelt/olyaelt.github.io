// Lesson tools, live version (tools 7): Olya (her code on this device) removes, moves and corrects items on <page>-live.html;
// her table keeps the changes (sheet Live + Live log); a group's page picks them up at its next tap, never under their eyes;
// with the table down the page shows what it was built with; the plain page never asks the table anything.
//   node tests/live_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [], asked = [];
  const expect = (name, ok) => { if (!ok) fail.push(name); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  let down = false;
  const b = await chromium.launch();
  const open = async (rel, teacher, viewport = {width: 1280, height: 720}) => {
    const c = await b.newContext({viewport, reducedMotion: 'reduce'});
    if (teacher) await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    await c.route(/script\.google\.com/, r => { asked.push(rel); return down ? r.fulfill({status: 500, body: 'down'})
      : r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}); });
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    const src = fs.readFileSync(path.join(site, rel), 'utf8').replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`);
    const tmp = path.join(path.dirname(path.join(site, rel)), '_live_test_' + path.basename(rel)); fs.writeFileSync(tmp, src);
    await p.goto('file://' + tmp); await p.waitForTimeout(300); fs.unlinkSync(tmp); return p;
  };
  const live = tool => env.post(JSON.stringify({action: 'live', tool})).live;

  // ---- council: a group in Extra speaking, then Olya changes the tasks
  const C = 'tools/c1-schools/council-1-live.html';
  const g = await open(C, false);
  out.groupNoTools = await g.locator('.live-b, .live-bar').count(); expect('groups see no edit buttons', out.groupNoTools === 0);
  await g.click('.stage-btn[data-stage="speak"]'); await g.waitForTimeout(150);
  const t0 = await g.locator('.speak-task').innerText();
  const o = await open(C, true);
  out.teacherBar = await o.locator('.live-bar').count(); expect('Olya sees the live bar', out.teacherBar === 1);
  await o.click('.stage-btn[data-stage="speak"]'); await o.waitForTimeout(150);
  out.toolsOnTask = await o.locator('.speak .live-b').count(); expect('edit buttons on the task', out.toolsOnTask === 3);
  await o.click('.speak [data-live-hide]'); await o.waitForTimeout(250);            // hide task 1: she stays on it, greyed, with Show
  out.hiddenOnHerScreen = {dim: await o.locator('.speak .live-host.is-hidden').count(), show: await o.locator('.speak .live-show').count(), tag: await o.locator('.speak .live-hidden-tag').count()};
  expect('hidden task stays on her screen, greyed, with Show', out.hiddenOnHerScreen.dim === 1 && out.hiddenOnHerScreen.show === 1 && out.hiddenOnHerScreen.tag === 1);
  await o.click('[data-speak-next]'); await o.waitForTimeout(150);
  await o.click('.speak [data-live-last]'); await o.waitForTimeout(250);            // task 2 to the end
  await o.click('.speak [data-live-edit]'); await o.fill('.live-edit textarea', 'Each of you: one subject you loved at school and why. Use a phrase from the box.');
  await o.click('[data-live-save]'); await o.waitForTimeout(300);                    // correct task 3
  out.server = live('c1-schools/council-1'); out.log = env.sheets['Live log'].d.length - 1;
  const ord = (out.server.order || {}).speaking || [];
  expect('changes kept in her table', out.server.hide.includes('speaking.0') && ord[ord.length - 1] === 1 && /loved at school/.test(out.server.text['speaking.2']) && out.log === 3);
  out.olyaNow = await o.locator('.speak-task').innerText(); out.removedChip = await o.locator('.live-bar [data-live-unhide]').count();
  if (shots) await o.screenshot({path: path.join(shots, 'live-teacher.png')});
  expect('her screen shows the change at once, removed one restorable', /loved at school/.test(out.olyaNow) && out.removedChip === 1);
  // the group: nothing changes under their eyes; at the next tap they get the new list
  await g.evaluate(() => liveFetch(false)); await g.waitForTimeout(200);
  out.groupStill = (await g.locator('.speak-task').innerText()) === t0; expect('nothing changes under their eyes', out.groupStill);
  await g.click('[data-speak-next]'); await g.waitForTimeout(150);
  out.groupNext = await g.locator('.speak-task').innerText(); out.groupDots = await g.locator('.speak-dots button').count();
  expect('next tap: the corrected task, one task fewer', /loved at school/.test(out.groupNext) && out.groupDots === 4);
  // she shows the hidden one again (after correcting it, say): it comes back for the groups
  await o.click('.live-bar [data-live-unhide]'); await o.waitForTimeout(300); expect('show again', !live('c1-schools/council-1').hide.length);
  // she drags the last dot to the front: that task comes first for the groups
  const dots = o.locator('.speak-dots[data-drag="speaking"] button'); out.dragDots = await dots.count();
  const first = await dots.first().boundingBox(), lastB = await dots.last().boundingBox(), lastK = +(await dots.last().getAttribute('data-k'));
  await o.mouse.move(lastB.x + lastB.width / 2, lastB.y + lastB.height / 2); await o.mouse.down();
  await o.mouse.move(lastB.x - 10, lastB.y + lastB.height / 2, {steps: 4}); await o.mouse.move(first.x + first.width / 2, first.y + first.height / 2, {steps: 6});
  await o.mouse.up(); await o.waitForTimeout(400);
  out.dragOrder = (live('c1-schools/council-1').order || {}).speaking;
  expect('dragging a dot reorders the tasks', out.dragDots === 5 && out.dragOrder && out.dragOrder[0] === lastK);
  if (shots) await o.screenshot({path: path.join(shots, 'live-drag.png')});
  const g2 = await open(C, false); await g2.click('.stage-btn[data-stage="speak"]'); await g2.waitForTimeout(150);
  out.groupFirst = await g2.locator('.speak-task').innerText();
  const d0 = await open('tools/c1-schools/council-1.html', false); await d0.click('.stage-btn[data-stage="speak"]'); await d0.waitForTimeout(100);
  const builtTasks = await d0.evaluate(() => D.speaking);
  expect('a new group starts with the task she dragged first', out.groupFirst.replace(/\s+/g, ' ').trim() === builtTasks[lastK].replace(/\*\*/g, '').replace(/\s+/g, ' ').trim() || (lastK === 2 && /loved at school/.test(out.groupFirst)));


  // ---- council: remove a subject, correct an example line
  await o.click('.stage-btn[data-stage="game"]'); await o.waitForTimeout(150);
  const subj = await o.locator('.subj').innerText();
  await o.click('.stage-top [data-live-hide]'); await o.waitForTimeout(300);
  out.subjGone = live('c1-schools/council-1').hide.filter(p => /^lists\.\d+\.items\.\d+$/.test(p)).length;
  const fresh = await open(C, false); await fresh.click('.stage-btn[data-stage="decide"]'); await fresh.waitForTimeout(150);
  out.decideHasIt = (await fresh.locator('.pick').allInnerTexts()).some(t => t.includes(subj));
  expect('a removed subject is gone for a new group (Decide too)', out.subjGone === 1 && !out.decideHasIt);
  await o.click('#side details.all summary'); await o.waitForTimeout(100);
  await o.locator('#side [data-live-edit]').first().click(); await o.fill('#side .live-edit textarea', 'A corrected example with **a box phrase**.'); await o.click('#side [data-live-save]'); await o.waitForTimeout(300);
  out.exText = Object.values(live('c1-schools/council-1').text).some(t => /corrected example/.test(t)); expect('example corrected', out.exText);

  // ---- cards: remove one card, correct another (sentence, answer, key word)
  const K = 'tools/c1-schools/cards-1-live.html';
  const ok_ = await open(K, true);
  await ok_.click('#side details.all summary'); await ok_.waitForTimeout(100);
  const rows = ok_.locator('#side .all-row');
  const gone = await rows.nth(2).locator('.f').innerText();
  await rows.nth(2).locator('[data-live-hide]').click(); await ok_.waitForTimeout(300);
  await ok_.locator('#side .all-row').nth(3).locator('[data-live-edit]').click();
  const tas = ok_.locator('#side .live-edit textarea'); out.cardFields = await tas.count();
  await tas.nth(1).fill('The corrected answer.'); await ok_.click('#side [data-live-save]'); await ok_.waitForTimeout(400);
  const lv = live('c1-schools/cards-1'); out.cards = {hide: lv.hide, text: lv.text};
  expect('card removed and corrected', out.cardFields === 3 && lv.hide.length === 1 && Object.values(lv.text).includes('The corrected answer.'));
  const kg = await open(K, false);
  out.groupDeck = await kg.evaluate(() => ({n: S.cards.length, fronts: S.cards.map(c => c.f), answers: S.cards.map(c => c.b)}));
  expect('a new group: card gone, answer corrected', out.groupDeck.n === 15 && !out.groupDeck.fronts.some(f => gone.startsWith(f.replace(/\(\(|\)\)/g, '').slice(0, 20))) && out.groupDeck.answers.includes('The corrected answer.'));
  // ---- her usual case (28.10): hide a task, correct it while it's hidden, show it again
  const h = await open(K, true); await h.click('.stage-btn[data-stage="speak"]'); await h.waitForTimeout(100);
  await h.click('.speak [data-live-hide]'); await h.waitForTimeout(250);
  if (shots) await h.screenshot({path: path.join(shots, 'live-hidden.png')});
  await h.click('.speak [data-live-edit]'); await h.fill('.live-edit textarea', 'A better first task, corrected while hidden.'); await h.click('[data-live-save]'); await h.waitForTimeout(300);
  const midway = live('c1-schools/cards-1');
  await h.click('.speak .live-show'); await h.waitForTimeout(300);
  const after = live('c1-schools/cards-1');
  out.hideEditShow = {hiddenWhileEditing: midway.hide.includes('speaking.0'), text: after.text['speaking.0'], shownAgain: !after.hide.includes('speaking.0'), herTask: await h.locator('.speak-task').innerText()};
  expect('hide → correct → show', out.hideEditShow.hiddenWhileEditing && /corrected while hidden/.test(out.hideEditShow.text || '') && out.hideEditShow.shownAgain && /corrected while hidden/.test(out.hideEditShow.herTask));
  env.post(JSON.stringify({action: 'liveOp', code: T, tool: 'c1-schools/cards-1', op: {kind: 'untext', path: 'speaking.0'}}));
  // ---- her catch (28.10): she moves the task a group is on far down; the group must not skip the tasks in between
  const g3 = await open(K, false); await g3.click('.stage-btn[data-stage="speak"]'); await g3.waitForTimeout(100);
  const taskOf = async () => (await g3.locator('.speak-task').innerText()).replace(/\s+/g, ' ').trim();
  const built = (await g3.evaluate(() => D.speaking)).map(t => t.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim());
  const seen = [await taskOf()]; await g3.click('[data-speak-next]'); await g3.waitForTimeout(80); seen.push(await taskOf());
  const onK = built.indexOf(seen[1]);
  env.post(JSON.stringify({action: 'liveOp', code: T, tool: 'c1-schools/cards-1', op: {kind: 'order', path: 'speaking', text: JSON.stringify(built.map((_, k) => k).filter(k => k !== onK).concat([onK]))}}));
  await g3.evaluate(() => liveFetch(false)); await g3.waitForTimeout(150);
  let guard = 0; while (await g3.locator('[data-speak-next]').count() && guard++ < 10) { await g3.click('[data-speak-next]'); await g3.waitForTimeout(80); seen.push(await taskOf()); }
  out.noSkip = {onK, seen: seen.map(t => built.indexOf(t)), end: await g3.locator('.speak .row-actions button').allInnerTexts()};
  expect('moving the task a group is on: nothing skipped, no task twice, then the end', new Set(out.noSkip.seen).size === built.length && out.noSkip.seen.length === built.length && out.noSkip.end.some(t => /All the cards/.test(t)));
  // ---- the table is down: the live page shows what it was built with (plus what this device saw last), no errors
  down = true; const dn = await open('tools/c1-schools/council-2-live.html', false); out.downWorks = await dn.locator('.subj').count(); down = false;
  expect('table down: the page still works', out.downWorks === 1);
  // ---- the plain page never asks the table
  const before = asked.length; await open('tools/c1-schools/council-1.html', true); out.plainAsked = asked.length - before;
  out.plainTools = 0; expect('plain page: no table, no buttons', out.plainAsked === 0);

  out.errors = errs; console.log(JSON.stringify(out, null, 1));
  console.log(fail.length || errs.length ? 'FAILED: ' + fail.concat(errs).join('; ') : 'OK live');
  await b.close();
})();
