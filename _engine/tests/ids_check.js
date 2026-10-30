// Permanent numbers (tools 13, her decision 30.10 07:30): a rebuild that inserts, moves, corrects or removes cards never moves anyone's work.
// A test lesson folder (tools/zz-ids-test, removed afterwards) is built, used live (she hides a card and corrects one, a group sends a card
// back, a group types in a chat and she marks it), then the data changes (a new card first, the hidden one last, a typo fixed, one card gone,
// two chats swapped) and it is rebuilt: everything is still on the same card / chat; the build reports what it matched.
//   node tests/ids_check.js
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path'); const {execFileSync} = require('child_process');
const {makeEnv} = require('./mock');
const ENG = path.resolve(__dirname, '..'), LES = path.join(ENG, 'tools', 'zz-ids-test'), SITE = fs.mkdtempSync('/tmp/ids-site-');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const fail = [], out = {}, errs = []; const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  fs.mkdirSync(LES, {recursive: true});
  const cards = [["((the train is late)) I'll come later than we agreed.", "Sorry, I'll be ten minutes late."], ["((a friend is late)) It's not a problem!", "No worries, see you soon!"], ["((your call)) The meeting is taking longer than planned.", "My meeting is runing over."], ["((dinner with friends)) Don't wait for me.", "Start without me!"]];
  const deck = {type: 'say-it-another-way', title: 'Ids test', part: 'Test', hint: 'x', cards, box: [{h: 'BOX', items: ['one']}], speaking: ['Talk one', 'Talk two']};
  const late = JSON.parse(fs.readFileSync(path.join(ENG, 'tools/b2-2026-10-30/late.json'), 'utf8'));
  fs.writeFileSync(path.join(LES, 'deck.json'), JSON.stringify(deck)); fs.writeFileSync(path.join(LES, 'chat.json'), JSON.stringify(late));
  const build = () => execFileSync('python3', [path.join(ENG, 'build_tools.py'), SITE], {encoding: 'utf8'});
  try {
    build();
    const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
    const b = await chromium.launch();
    const open = async (rel, teacher) => {
      const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
      if (teacher) await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
      await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
      const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
      const src = fs.readFileSync(path.join(SITE, 'tools/zz-ids-test', rel), 'utf8').replace(/LIVE_URL = "[^"]*"/, `LIVE_URL = "${URL_}"`);
      const tmp = path.join(SITE, 'tools/zz-ids-test', '_t_' + rel); fs.writeFileSync(tmp, src); await p.goto('file://' + tmp); await p.waitForTimeout(400); return p;
    };
    // she hides card D and corrects card B's answer; a group sends card A back
    const O = await open('deck-live.html', true);
    await O.evaluate(() => { liveOp('hide', 'cards.3'); }); await O.waitForTimeout(250);
    await O.evaluate(() => { liveOp('text', 'cards.1.1', 'Card B back, corrected live'); }); await O.waitForTimeout(250);
    env.post(JSON.stringify({action: 'toolDeck', tool: 'zz-ids-test/deck', dev: 'aaaaaaaaaaaaaaaa', again: {0: 2}, got: [1]}));
    // a group types in chat 2 (Sarah), she marks it
    env.post(JSON.stringify({action: 'toolPost', tool: 'zz-ids-test/chat', chat: 1, dev: 'bbbbbbbbbbbbbbbb', text: 'Sorry Sarah, I stuck', sent: false}));
    env.post(JSON.stringify({action: 'toolNote', tool: 'zz-ids-test/chat', chat: 1, dev: 'bbbbbbbbbbbbbbbb', quote: 'I stuck', note: 'Check the verb form', code: T}));
    // the data changes: a new card first, D (hidden) last, a typo fixed in C, A removed; chats 1 and 2 swapped
    deck.cards = [["((a friend tells you about a delay)) Thank you for telling me in advance!", "Thanks for the heads-up!"], cards[1], ["((your call)) The meeting is taking longer than planned.", "My meeting is running over."], cards[3]];
    fs.writeFileSync(path.join(LES, 'deck.json'), JSON.stringify(deck));
    const sc = late.scenes.slice(); [sc[0], sc[1]] = [sc[1], sc[0]]; fs.writeFileSync(path.join(LES, 'chat.json'), JSON.stringify(Object.assign({}, late, {scenes: sc})));
    out.report = build().split('\n').filter(l => /permanent numbers|#\d+/.test(l));
    expect('the build reports new / corrected / removed', out.report.some(l => /cards #4 new: "a friend tells you/.test(l)) && out.report.some(l => /cards #2 corrected/.test(l)) && out.report.some(l => /cards #0 removed/.test(l)), out.report);
    const reg = JSON.parse(fs.readFileSync(path.join(LES, 'deck.ids.json'), 'utf8'));
    out.reg = reg.cards.map(e => [e.pid, e.gone]); expect('register: A kept as gone, E got #4', JSON.stringify(out.reg) === JSON.stringify([[0, true], [1, false], [2, false], [3, false], [4, false]]), out.reg);
    // the page after the rebuild: D is still the hidden one, B still corrected, the group's Again is on no visible card (A is gone)
    const G = await open('deck-live.html', false);
    out.hidden = await G.evaluate(() => S.cards.map(c => c.f)); expect('a group: D still hidden', !out.hidden.some(f => /Don't wait/.test(f)) && out.hidden.length === 3, out.hidden);
    out.corrected = await G.evaluate(() => S.cards.find(c => /not a problem/.test(c.f)).b); expect('B keeps her live correction', out.corrected === 'Card B back, corrected live', out.corrected);
    const O2 = await open('deck-live.html', true); await O2.waitForTimeout(500);
    out.dots = await O2.evaluate(() => [...document.querySelectorAll('#gdots [data-gd]')].map(x => ({id: x.dataset.gd, cls: x.className})));
    expect('her dots: B green (got), nobody orange (A was removed)', out.dots.some(d => d.id === 'o1' && /gd-ok/.test(d.cls)) && !out.dots.some(d => /gd-again/.test(d.cls)), out.dots);
    out.bar = await O2.locator('.live-bar').innerText(); expect('her bar still offers to show D again', /Don't wait for me/.test(out.bar), out.bar);
    // the chat page: Sarah is now chat 1, her note and the group's text are still on Sarah
    const C = await open('chat-live.html', true); await C.click('.stage-btn[data-stage="groups"]'); await C.waitForTimeout(500);
    out.chatLabel = await C.locator('.gw-card [data-who] .ch').first().innerText(); expect('her Groups: the text is on Sarah, now chat 1', /chat 1 · sarah/i.test(out.chatLabel), out.chatLabel);
    await b.close();
  } finally {
    fs.rmSync(LES, {recursive: true, force: true}); fs.rmSync(SITE, {recursive: true, force: true});
  }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK permanent numbers'); process.exit(fail.length ? 1 : 0);
})();
