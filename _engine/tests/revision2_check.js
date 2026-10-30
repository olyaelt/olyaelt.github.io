// The B2 revision, round 2 (handoff 30.10 09:20 + her wishes 09:23): the same four stages on every field, 🎓 How it works (tips),
// f-demo with its button on the board, the chat page inside 💬 Use it shows only its working part (?embed=1), opened gaps black bold on
// the yellow, and her 👥 panel under a chat / a message: every group's text for this chat, live, with ✓ Good etc.; numbered chat dots.
//   node tests/revision2_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec', L = 'tools/b2-2026-10-30/';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], out = {}, errs = [], fail = [];
  if (shots) fs.mkdirSync(shots, {recursive: true});
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const env = makeEnv(); env.ctx.setUp(); const T = String(env.sheets.Students.d[1][0]);
  env.sheets.Students.appendRow(['abc123', 'Anna', 'B2', '']);
  const b = await chromium.launch(), tmps = [];
  // the pages are copied with the test table's address; the field's iframe loads its tool page the same way (routed)
  const open = async (rel, who, opts = {}) => {
    const c = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
    if (who === 'teacher') await c.addInitScript(code => { localStorage.setItem('hw-code', code); localStorage.setItem('hw-role', 'teacher'); }, T);
    if (who === 'anna') await c.addInitScript(() => { localStorage.setItem('hw-code', 'abc123'); localStorage.setItem('hw-role', ''); });
    await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    await p.goto('file://' + path.join(site, rel)); await p.waitForTimeout(500); if(!opts.cloud) await cloudOff(p); return p;
  };
  const cloudOff = p => p.evaluate(() => { if(typeof S !== 'undefined' && S && S.intro){ S.intro = false; render(); } }).catch(() => {});
  const bubble = async (p, n) => { await p.click(`.stage-btn[data-stage="${n}"]`); await cloudOff(p); };
  // the built pages talk to the real table: point them at the test one for this run (put back at the end)
  const pages = fs.readdirSync(path.join(site, L)).filter(f => /-live\.html$/.test(f)), orig = {};
  pages.forEach(f => { const fp = path.join(site, L, f); orig[fp] = fs.readFileSync(fp, 'utf8'); fs.writeFileSync(fp, orig[fp].replace(/LIVE_URL = "https:\/\/script\.google\.com[^"]*"/, `LIVE_URL = "${URL_}"`)); });
  try {
    // ---- the board: 🎓 How the game works
    const OB = await open(L + 'jeopardy-live.html', 'teacher');
    out.demoBtn = await OB.locator('.howgame').getAttribute('href').catch(() => ''); expect('the board: 🎓 How the game works → f-demo-live', out.demoBtn === 'f-demo-live.html', out.demoBtn);
    // ---- the same four stages on every field
    const want = '📝 Test yourself|🔁 Recall|🃏 Practice|💬 Use it';
    for (const f of ['f-late', 'f-tags', 'f-crime', 'f-clocks', 'f-demo']) {
      const p = await open(L + f + '-live.html', '');
      const labels = await p.evaluate(() => D.stages.map(s => s.label).join('|')); expect(f + ': the four stages', labels === want, labels);
      if (f === 'f-demo') {
        out.demo = {tips: await p.locator('.tip').count(), sw: await p.locator('[data-howto]').count(), part: await p.locator('.head .part').count(), back: await p.locator('.board-top').getAttribute('href')};
        expect('f-demo: tips on from the start, no switch, no cell name, ⬅ Board', out.demo.tips === 1 && out.demo.sw === 0 && out.demo.part === 0 && out.demo.back === 'jeopardy-live.html', out.demo);
        await p.fill('[data-wta]', 'No way! When did you last see him?'); await p.waitForTimeout(2600); await p.click('[data-wsend]'); await p.waitForTimeout(200);
        out.example = await p.locator('.ans-lines').innerText().catch(() => ''); expect('f-demo: after Send the example', /example/i.test(out.example) && /When did you last see him/.test(out.example), out.example);
        if (shots) await p.screenshot({path: path.join(shots, 'r2-demo.png')});
        // her catch 11:58: the three practice cards are one deck (three dots), each with its own label
        await bubble(p, 2); await p.waitForTimeout(150);
        out.mix = {dots: await p.locator('.fdots span').count(), labels: []};
        for (let k = 0; k < 3; k++) { out.mix.labels.push(await p.locator('.fc .lbl').innerText()); await p.click('[data-flip]'); await p.waitForTimeout(80); await p.click(k < 2 ? '[data-again]' : '[data-got]'); await p.waitForTimeout(120); }
        out.mix.again = await p.locator('.fdots .again').count();
        // her 12:18: no Next under a deck while it has cards; f-late's Practice = one deck of all its cards
        out.mix.nextInDeck = await p.locator('.blk-nav [data-next]').count();
        expect('f-demo Practice: one deck of three, own labels, Again counts', out.mix.dots === 3 && /three kinds/i.test(out.mix.labels[0]) && /our sentences/i.test(out.mix.labels[1]) && /how do you say/i.test(out.mix.labels[2]) && out.mix.again === 2 && out.mix.nextInDeck === 0, out.mix);
      }
      if (f === 'f-tags') {
        out.tags = {sw: await p.locator('[data-howto]').count(), before: await p.locator('.tip').count()};
        await p.click('[data-howto]'); await p.waitForTimeout(150); out.tags.after = await p.locator('.tip').innerText().catch(() => '');
        expect('🎓 How it works: off at first, a tip above the block when on', out.tags.sw === 1 && out.tags.before === 0 && /How it works: Say it aloud first/.test(out.tags.after), out.tags);
        await bubble(p, 1); await p.locator('[data-gap]').first().click(); await p.waitForTimeout(150);
        out.gap = await p.evaluate(() => { const g = document.querySelector('.gp.open'), cs = e => { const s = getComputedStyle(e); return [s.color, s.fontWeight, s.backgroundColor]; }; return {f: g.querySelector('.f') ? cs(g.querySelector('.f')) : null, r: cs(g.querySelector('.r'))}; });
        expect('an opened gap: black bold on the yellow, the first letters too', out.gap.r[0] === 'rgb(29, 29, 27)' && +out.gap.r[1] >= 700 && out.gap.r[2] === 'rgb(255, 255, 0)' && (!out.gap.f || (out.gap.f[0] === 'rgb(29, 29, 27)' && out.gap.f[2] === 'rgb(255, 255, 0)')), out.gap);
      }
    }
    // ---- the chat page inside 💬 Use it: only its working part
    const OL = await open(L + 'f-late-live.html', 'teacher'); await bubble(OL, 3); await OL.waitForTimeout(1500);
    out.src = await OL.locator('.tool-frame').getAttribute('src'); expect('the field loads the chat page with ?embed=1', out.src === 'late-live.html?embed=1', out.src);
    const fr = OL.frameLocator('.tool-frame');
    out.inner = {bar: await fr.locator('.live-bar').count(), h1: await fr.locator('.head h1').isVisible(), groups: await fr.locator('.stage-btn[data-stage="groups"]').count(), sub: await fr.locator('.stages.sub').count(), edit: await fr.locator('[data-live-edit], .live-tools').count()};
    expect('inside: no Live bar, no title, no 📥 Groups, small steps, no ✏️', out.inner.bar === 0 && !out.inner.h1 && out.inner.groups === 0 && out.inner.sub === 1 && out.inner.edit === 0, out.inner);
    if (shots) await OL.screenshot({path: path.join(shots, 'r2-late-useit.png')});
    // ---- her 👥 panel under a chat: a group types in chat 2, she sees it there and marks it
    const A = await open(L + 'late-live.html', 'anna');
    out.dots = await A.locator('.sc-dots button').allInnerTexts(); expect('numbered chat dots', out.dots.join() === '1,2,3,4,5', out.dots);
    await A.locator('.sc-dots button').nth(1).click(); await A.waitForTimeout(200); await A.fill('#msg', 'Sorry Alex, I stuck in traffic'); await A.waitForTimeout(2600);
    const O = await open(L + 'late-live.html', 'teacher'); await O.locator('.sc-dots button').nth(1).click(); await O.waitForTimeout(300); await O.evaluate(() => gwFetch()); await O.waitForTimeout(400);
    out.panel = await O.locator('.pc').innerText().catch(() => ''); expect('her panel under chat 2: Anna\'s text, live', /The groups on this chat/.test(out.panel) && /Group 1 — Anna/.test(out.panel) && /I stuck in traffic/.test(out.panel), out.panel);
    await O.evaluate(() => { const t = document.querySelector('.pc .gw-text'), n = [...t.childNodes].find(x => x.nodeType === 3 && x.textContent.includes('I stuck')), at = n.textContent.indexOf('I stuck'); const r = document.createRange(); r.setStart(n, at); r.setEnd(n, at + 7); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await O.waitForTimeout(200); await O.click('.pc [data-mk="change"]'); await O.waitForTimeout(400);
    out.note = (env.sheets['Lesson notes'] ? env.sheets['Lesson notes'].d.slice(1) : []).map(r => r.join('|')).filter(r => /I stuck/.test(r));
    expect('✗ Change from the panel reaches her table, on chat 2', out.note.length === 1 && /change/.test(out.note[0]), out.note);
    out.marked = await O.locator('.pc .gw-text .m-del').innerText().catch(() => ''); expect('the panel shows her mark', out.marked === 'I stuck', out.marked);
    await O.locator('.sc-dots button').nth(0).click(); await O.waitForTimeout(200); out.model = await O.locator('.pc').count(); expect('no panel on the model chat', out.model === 0, out.model);
    if (shots) { await O.locator('.sc-dots button').nth(1).click(); await O.waitForTimeout(300); await O.evaluate(() => document.querySelector('.pc').scrollIntoView()); await O.screenshot({path: path.join(shots, 'r2-panel.png')}); }
    // inside a field (her wish 10:07): the panel is under the frame, on the field itself, and follows the chat open inside
    const OF = await open(L + 'f-late-live.html', 'teacher'); await bubble(OF, 3); await OF.waitForTimeout(1500);
    out.fieldModel = await OF.locator('[data-pchost] .pc').innerText().catch(() => ''); expect('under the frame: chat 1 is the model', /model/.test(out.fieldModel), out.fieldModel);
    await OF.frameLocator('.tool-frame').locator('.sc-dots button').nth(1).click(); await OF.waitForTimeout(400); await OF.evaluate(() => gwFetch()); await OF.waitForTimeout(500);
    out.underFrame = {field: await OF.locator('[data-pchost] .pc').innerText().catch(() => ''), inside: await OF.frameLocator('.tool-frame').locator('.pc').count()};
    expect('under the frame: Anna\'s text for chat 2, with her marks; nothing inside the frame', /Group \d — Anna/.test(out.underFrame.field) && /I stuck/.test(out.underFrame.field) && /Change this/.test(out.underFrame.field) && out.underFrame.inside === 0, out.underFrame);
    out.namesBtn = await OF.locator('[data-pchost] [data-roster]').first().innerText().catch(() => ''); expect('the card says where to put names', /Names|Add names/.test(out.namesBtn), out.namesBtn);
    if (shots) { await OF.evaluate(() => document.querySelector('[data-pchost]').scrollIntoView()); await OF.screenshot({path: path.join(shots, 'r2-under-frame.png')}); }
    // f-late's 🃏 Practice: all its cards in one deck (warm replies, rewrites, our sentences), no Next until the end
    const PL = await open(L + 'f-late-live.html', ''); await bubble(PL, 2); await PL.waitForTimeout(150);
    out.lateDeck = await PL.evaluate(() => ({blocks: curBlocks().length, cards: curBlock().cards.length, all: D.stages[2].blocks.reduce((n, b) => n + b.cards.length, 0), kinds: [...new Set(curBlock().cards.map(c => c._b.style))].join(), next: document.querySelectorAll('.blk-nav [data-next]').length}));
    expect('f-late Practice: one deck of every card, three kinds, no Next yet', out.lateDeck.blocks === 1 && out.lateDeck.cards === out.lateDeck.all && out.lateDeck.kinds === 'say,kwt,ours' && out.lateDeck.next === 0, out.lateDeck);
    // her rule 12:29: one Back / Next, always in the same place; Next first shows the answers, then goes on
    const C = await open(L + 'f-clocks-live.html', 'anna'); const where = () => C.evaluate(() => [S.stage, bIdx()]);
    out.steps = {bar: await C.locator('.stepbar [data-back], .stepbar [data-step]').count(), other: await C.locator('[data-next], [data-prev]').count()};
    await C.click('[data-step]'); await C.waitForTimeout(100); out.steps.say = [await where(), await C.locator('.ans-h').count()];
    await C.click('[data-step]'); await C.waitForTimeout(150); out.steps.cloud = await C.evaluate(() => [S.stage, S.intro, document.querySelector('.si-name') ? document.querySelector('.si-name').textContent : '']);
    await C.click('[data-step]'); await C.waitForTimeout(150); out.steps.toRecall = await where();
    await C.click('[data-step]'); await C.waitForTimeout(100); out.steps.gaps = [await where(), await C.evaluate(() => allGaps(curBlock()).every(id => bs(curBlock()).open.has(id)))];
    await C.click('[data-step]'); await C.waitForTimeout(150); await C.click('[data-step]'); await C.waitForTimeout(150); out.steps.toPractice = await where();   // Practice's cloud, then its deck
    await C.click('[data-step]'); await C.waitForTimeout(100); out.steps.flipped = await C.evaluate(() => deckOf(curBlock()).flipped);
    await C.click('[data-step]'); await C.waitForTimeout(100); out.steps.got = await C.locator('.fdots .got').count();
    // her 12:58: Back in a deck = the card before (the answer → its front → the cards answered before, open), Next forward again; past the first card → the task before
    const cardOn = () => C.evaluate(() => { const b = curBlock(); if(S.intro) return 'cloud' + S.stage; if(b.kind !== 'cards') return 'stage' + S.stage; const st = bs(b), d = deckOf(b); return st.look != null ? 'look' + st.look : (d.flipped ? 'open' : 'front') + d.queue[0]; });
    const seq = async (btn, n) => { const r = []; for (let k = 0; k < n; k++) { await C.click(btn); await C.waitForTimeout(80); r.push(await cardOn()); } return r; };
    out.deckBack = [].concat(await seq('[data-back]', 1), await seq('[data-step]', 4), await seq('[data-back]', 4));
    out.steps.back = await where();
    expect('one Back / Next; Next shows the answer, then goes on; an open card + Next = Got it', out.steps.bar === 2 && out.steps.other === 0 && JSON.stringify(out.steps.say) === '[[0,0],1]' && JSON.stringify(out.steps.cloud) === '[1,true,"Recall"]' && JSON.stringify(out.steps.toRecall) === '[1,0]' && out.steps.gaps[1] === true && JSON.stringify(out.steps.gaps[0]) === '[1,0]' && JSON.stringify(out.steps.toPractice) === '[2,0]' && out.steps.flipped === true && out.steps.got === 1, out.steps);
    expect('Back in a deck: card before, open; Next forward; past the first card → the stage\'s cloud', JSON.stringify(out.deckBack) === '["look0","front1","open1","front2","open2","front2","look1","look0","cloud2"]' && JSON.stringify(out.steps.back) === '[2,0]', {seq: out.deckBack, back: out.steps.back});
    // her 13:04: on the very first step Back goes to the board (after Show the answer it first shows the question again)
    const BK = await open(L + 'f-tags-live.html', 'anna'); await BK.click('[data-step]'); await BK.waitForTimeout(80); await BK.click('[data-back]'); await BK.waitForTimeout(80);
    out.firstBack = {shown: await BK.locator('.ans-h').count()};
    await BK.click('[data-back]'); await BK.waitForTimeout(80); out.firstBack.cloud = await BK.evaluate(() => S.intro);
    await Promise.all([BK.waitForURL(/jeopardy-live\.html$/), BK.click('[data-back]')]); out.firstBack.url = BK.url().split('/').pop();
    expect('first step: Back hides the answer, then Test yourself\'s cloud, then the board', out.firstBack.shown === 0 && out.firstBack.cloud === true && out.firstBack.url === 'jeopardy-live.html', out.firstBack);
    // her 13:41: the page opens on Test yourself's cloud, and a bubble shows its stage's cloud too
    const CL = await open(L + 'f-crime-live.html', 'anna', {cloud: true}); out.cloudOpen = await CL.evaluate(() => [S.stage, S.intro, document.querySelector('.si-name').textContent]);
    await CL.click('.stage-btn[data-stage="2"]'); await CL.waitForTimeout(100); out.cloudBubble = await CL.evaluate(() => [S.stage, S.intro, document.querySelector('.si-name').textContent]);
    expect('the cloud: on opening (Test yourself) and on a bubble (Practice)', JSON.stringify(out.cloudOpen) === '[0,true,"Test yourself"]' && JSON.stringify(out.cloudBubble) === '[2,true,"Practice"]', [out.cloudOpen, out.cloudBubble]);
    // her 13:24: typing is optional for now — Next sends what they typed and goes on
    const W = await open(L + 'f-late-live.html', 'anna'); await W.fill('[data-wta]', 'Sorry, stuck in traffic!'); await W.click('[data-step]'); await W.waitForTimeout(300);
    out.write = {at: await W.evaluate(() => S.stage), sent: await W.evaluate(() => Object.values(saved.w).filter(x => x.sent).length)}; expect('Test yourself: Next sends what they typed and goes on (typing optional)', out.write.at === 1 && out.write.sent === 1, out.write);
    // her 15:36: typed, no Send, just Next — it reaches her table, sent; typed and left by a bubble — the draft reaches her table and stays on the device
    await W.waitForTimeout(900); const lw = () => (env.sheets['Lesson work'] ? env.sheets['Lesson work'].d.slice(1) : []).map(r => r.join('|'));
    out.writeRow = lw().filter(r => /stuck in traffic/.test(r));
    const W2 = await open(L + 'f-late-live.html', 'anna'); await W2.locator('[data-wta]').nth(1).fill('No worries, see you soon!'); await W2.waitForTimeout(3200);
    await bubble(W2, 2); await W2.waitForTimeout(300); await W2.reload(); await W2.waitForTimeout(600); await cloudOff(W2);
    out.writeDraft = {row: lw().filter(r => /No worries, see you soon/.test(r)).length, back: await W2.locator('[data-wta]').nth(1).inputValue().catch(() => '')};
    expect('nothing is lost: Next without Send reaches her table; a draft left by a bubble reaches it too and stays in the box', out.writeRow.length >= 1 && out.writeDraft.row >= 1 && out.writeDraft.back === 'No worries, see you soon!', {row: out.writeRow, draft: out.writeDraft});
    // her 13:24: the chat page inside has no Next of its own; the field's Next steps through it like slides
    await bubble(W, 3); await W.waitForTimeout(1500); const FR = W.frameLocator('.tool-frame');
    out.innerNext = await FR.locator('.acts [data-next]').first().isVisible().catch(() => false);
    const chatAt = () => FR.locator('body').evaluate(() => ({at: S.at, view: S.view, gaps: st(S.at).gaps.size, ex: st(S.at).ex}));
    out.embSteps = [];
    for (let k = 0; k < 4; k++) { await W.click('[data-step]'); await W.waitForTimeout(400); out.embSteps.push(await chatAt()); }
    expect('inside: no own Next; the field\'s Next: the model\'s gaps → chat 2 → its example → chat 3', out.innerNext === false && out.embSteps[0].at === 0 && out.embSteps[0].gaps > 0 && out.embSteps[1].at === 1 && !out.embSteps[1].ex && out.embSteps[2].at === 1 && out.embSteps[2].ex && out.embSteps[3].at === 2, {inner: out.innerNext, steps: out.embSteps});
    await W.click('[data-back]'); await W.waitForTimeout(400); out.embBack = await chatAt(); expect('Back inside: the chat before', out.embBack.at === 1, out.embBack);
    if (shots) await C.screenshot({path: path.join(shots, 'r2-stepbar.png')});
    // the same work in 📥 Groups
    await O.click('.stage-btn[data-stage="groups"]'); await O.waitForTimeout(500); out.groups = await O.locator('.gw-card').count(); expect('📥 Groups still shows it', out.groups === 1, out.groups);
    // ---- the panel under a message on a field (Test yourself)
    const B = await open(L + 'f-late-live.html', 'anna'); await B.fill('[data-wta]', 'Just a heads-up, I\'m running late'); await B.waitForTimeout(2600);
    const O2 = await open(L + 'f-late-live.html', 'teacher'); await O2.evaluate(() => gwFetch()); await O2.waitForTimeout(400);
    out.fieldPanel = await O2.locator('.pc').first().innerText().catch(() => ''); expect('her panel under the message on the field', /Group \d — Anna/.test(out.fieldPanel) && /running late/.test(out.fieldPanel), out.fieldPanel);
    // her 14:55: the two dialogues of Test yourself each on its own island; no "Check" label, the new answer lines marked
    const TG = await open(L + 'f-tags-live.html', 'anna');
    out.isles = {task: await TG.locator('.say-isle').count()}; await TG.click('[data-step]'); await TG.waitForTimeout(150);
    Object.assign(out.isles, {ans: await TG.locator('.say-isle').count(), check: await TG.locator('.ans-h').count(), fresh: await TG.locator('.say-lines p.new').count(), body: await TG.locator('.say-lines').innerText()});
    expect('Test yourself: two islands, no Check, the four new lines marked', out.isles.task === 2 && out.isles.ans === 2 && out.isles.check === 0 && out.isles.fresh === 4 && !/check/i.test(out.isles.body), out.isles);
    // her 14:56: the coin cards inside the field — no own Next (Start the cards / Next card); the field's Next: the examples → each card: the coin →
    // the answers → the next card; after the 6th the field goes on
    const at = await TG.evaluate(() => { for (let si = 0; si < D.stages.length; si++) { const k = D.stages[si].blocks.findIndex(x => x.kind === 'tool'); if (k > -1) { goBlock(si, k); S.intro = false; render(); return [si, k]; } } });
    await TG.waitForTimeout(1500); const TF = TG.frameLocator('.tool-frame');
    out.coinEmb = {own: await TF.locator('[data-start]:visible, .next-card:visible').count(), coin: await TF.locator('.coin-intro [data-intro-coin]').count()};
    const cAt = () => TF.locator('body').evaluate(() => [S.view, S.exShown, S.seen, S.cur ? (S.cur.flipped ? 'open' : S.cur.type ? 'coin' : 'card') : '']);
    out.coinEmb.steps = [];
    for (let k = 0; k < 19; k++) { await TG.click('[data-step]'); await TG.waitForTimeout(250); if (await TG.locator('.tool-frame').count() === 0) { out.coinEmb.steps.push('left at ' + k); break; } out.coinEmb.steps.push((await cAt()).join(':')); }
    await TG.click('[data-step]'); await TG.waitForTimeout(300); out.coinEmb.after = await TG.evaluate(() => [S.stage, bIdx(), curBlock().kind]);
    const ST = out.coinEmb.steps;
    expect('coin cards in the field: no own Next; Next = examples, then card → coin → answers ×6, then the field goes on', out.coinEmb.own === 0 && out.coinEmb.coin === 1
      && ST[0] === 'example:true:0:' && ST[1] === 'cards:true:1:card' && ST[2] === 'cards:true:1:coin' && ST[3] === 'cards:true:1:open' && ST[4] === 'cards:true:2:card' && ST[18] === 'cards:true:6:open'
      && out.coinEmb.after[1] === at[1] + 1 && out.coinEmb.after[2] === 'questions', out.coinEmb);
    // her 15:17–15:18: ⚡ only on the last question, Next goes on to question 2 (also after going back), numbered screens between Back
    // and Next (the seen ones tappable), and the way back from the board to where they were
    const CR = await open(L + 'f-crime-live.html', 'anna'); await bubble(CR, 3); await CR.waitForTimeout(150);
    const crs = () => CR.evaluate(() => ({b: bIdx(), dots: [...document.querySelectorAll('.sdots button')].map(x => x.className.trim() + (x.disabled ? '-' : '')).join(' '), next: !document.querySelector('[data-step]').disabled, fast: !!document.querySelector('.fast'), q: curBlock().kind === 'questions' ? spkCur.key : null}));
    out.crime = [await crs()]; for (let k = 0; k < 4; k++) { await CR.click('[data-step]'); await CR.waitForTimeout(150); out.crime.push(await crs()); }
    await CR.click('[data-back]'); await CR.waitForTimeout(150); out.crime.push(await crs());
    const K = out.crime;
    expect('Use it: numbered screens; ⚡ only on the last question; Next goes on to question 2, also after Back', K[0].dots === 'on- - -' && K[2].dots === 'was on- -' && K[3].q === 0 && K[3].next && !K[3].fast
      && K[4].q === 1 && !K[4].next && K[4].fast && K[5].q === 0 && K[5].next && !K[5].fast, K);
    await CR.click('.sdots [data-sdot="1"]'); await CR.waitForTimeout(150); out.crimeDot = await CR.evaluate(() => bIdx()); expect('a seen screen can be tapped', out.crimeDot === 1, out.crimeDot);
    await CR.click('.board-top'); await CR.waitForTimeout(800); out.backstrip = await CR.locator('.backstrip').innerText().catch(() => '');
    await CR.click('.backstrip'); await CR.waitForTimeout(800); out.resumed = await CR.evaluate(() => [location.hash, S.stage, bIdx(), S.intro]);
    expect('⬅ Board by mistake: the board offers the way back, and it opens where they were', /Back to Vocabulary · \$100 — Crime around us/.test(out.backstrip) && JSON.stringify(out.resumed) === '["",3,1,false]', [out.backstrip, out.resumed]);
    // her 15:21–15:23: a rewrite's answer fills in where the gap was (the change blue on light blue, no second sentence); after the
    // last card straight on to the next cloud (no "Done!" screen); Back from that cloud = the last card, open
    const CK = await open(L + 'f-clocks-live.html', 'anna'); await bubble(CK, 2); await CK.click('[data-step]'); await CK.waitForTimeout(120);
    out.kwt = await CK.evaluate(() => ({fill: (document.querySelector('.fc .frame .fill') || {}).textContent || '', dup: document.querySelectorAll('.fc .ans .say').length, gap: /___/.test(document.querySelector('.fc .frame').textContent)}));
    for (let k = 0; k < 5; k++) { await CK.click('[data-step]'); await CK.waitForTimeout(100); }
    out.kwtEnd = await CK.evaluate(() => [S.stage, S.intro, !!document.querySelector('.blk-end')]);
    await CK.click('[data-back]'); await CK.waitForTimeout(120); out.kwtBack = await CK.evaluate(() => { const b = curBlock(); return [S.stage, bs(b).look, deckOf(b).hist.slice(-1)[0], !!document.querySelector('.fc.open .frame .fill')]; });
    expect('rewrite answer in place; after the last card the next cloud; Back = the last card, open', out.kwt.fill && !out.kwt.dup && !out.kwt.gap && JSON.stringify(out.kwtEnd) === '[3,true,false]'
      && out.kwtBack[0] === 2 && out.kwtBack[1] === out.kwtBack[2] && out.kwtBack[3], [out.kwt, out.kwtEnd, out.kwtBack]);
    // her 15:31: 🧹 Start fresh on her board also clears what she typed while testing on this computer (every page of the lesson)
    const HF = await open(L + 'f-late-live.html', 'teacher'); await HF.locator('[data-wta]').first().fill('trulala'); await HF.locator('[data-wsend]').first().click(); await HF.waitForTimeout(250);
    const mine = p => p.evaluate(() => Object.keys(localStorage).filter(k => /^tool-(field|chat)-b2-2026-10-30\//.test(k) && !/"w":\{\}/.test(localStorage.getItem(k))).length);
    out.herFresh = {before: await mine(HF)};
    const HB = await HF.context().newPage(); await HB.goto('file://' + path.join(site, L, 'jeopardy-live.html')); await HB.waitForTimeout(500);
    await HB.click('[data-fresh]'); await HB.click('[data-fresh-yes]'); await HB.waitForTimeout(500);
    out.herFresh.after = await mine(HB); out.herFresh.msg = await HB.locator('#live-status').innerText().catch(() => '');
    await HF.reload(); await HF.waitForTimeout(600); await cloudOff(HF); out.herFresh.sent = await HF.evaluate(() => Object.values(saved.w).filter(x => (x.text || '').trim()).length + document.querySelectorAll('.witem .sentmsg').length); out.herFresh.where = await HF.evaluate(() => [...document.querySelectorAll('.sentmsg')].map(x => x.parentElement.className + ':' + x.textContent.slice(0, 20)));
    expect('her 🧹 Start fresh clears her test answers on this computer', out.herFresh.before >= 1 && out.herFresh.after === 0 && out.herFresh.sent === 0 && /test answers cleared/.test(out.herFresh.msg), out.herFresh);
  } finally {
    Object.entries(orig).forEach(([fp, s]) => fs.writeFileSync(fp, s));
  }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK revision 2'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
