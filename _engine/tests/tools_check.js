// Lesson tools (build_tools.py), tools 1 as of 27.10.26:
//  council — stages Reasons → Decide → Extra speaking (no separate Decide button); a subject on the table at once;
//            roll → grey ticks; 🙈 We give up; 💡 example after each step; Keep / Cut / 🤝 Agree to disagree;
//            Next subject; Decide: picks + "Your decision" + follow-ups after 2 + 2; Extra speaking loops back;
//            dice 1–3/1–4/1–6 on the hint; Part 2: situation, box hidden until Peek.
//  cards   — stages Cards → Speaking; tap the card to check (no Flip button), Again comes back 2–3 cards later,
//            look back through the dots, "Come back to these", review cards from Part 1; Space doesn't flip in Speaking.
//  both    — hint only on the practice stage; 📋 list under the box (side), folded; no outside requests, no errors.
// Most of it runs with reduced motion (instant); one animated roll and one animated answer are checked too.
//   node tests/tools_check.js SITE_DIR [shots_dir]      -> prints the results and "OK tools" / "FAILED: …"
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3];
  const b = await chromium.launch(), out = {}, errs = [], outside = [], fail = [];
  const expect = (name, ok) => { if (!ok) fail.push(name); };
  const page = async (rel, {scheme = 'light', motion = 'reduce', w = 1280, h = 720} = {}) => {
    const c = await b.newContext({viewport: {width: w, height: h}, colorScheme: scheme, reducedMotion: motion});
    const p = await c.newPage(); p.on('pageerror', e => errs.push(rel + ': ' + e.message));
    p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) outside.push(r.url()); });
    await p.goto('file://' + path.join(site, rel)); await p.waitForTimeout(150); return p;
  };
  const shot = async (p, name, full) => { if (shots) await p.screenshot({path: path.join(shots, name + '.png'), fullPage: !!full}); };
  const cur = p => p.locator('.stage-btn[aria-current="step"]').innerText();

  // ---- council, Part 1
  { const p = await page('tools/c1-schools/council-1.html', {motion: 'no-preference'});
    await shot(p, 'council-start');
    out.c = {stages: await p.locator('.stage-btn').allInnerTexts(), current: await cur(p), headDecide: await p.locator('.head [data-decide]').count(),
      label: await p.locator('.subj-label').first().innerText(), hint: await p.locator('.dice-hint').count(), list: {side: await p.locator('#side details.all').count(), main: await p.locator('#main details.all').count()}};
    expect('council stages', out.c.stages.join('|') === '🎲 Reasons|🤝 Decide|💬 Extra speaking' && /Reasons/.test(out.c.current) && !out.c.headDecide);
    expect('council list under the box', out.c.list.side === 1 && out.c.list.main === 0);
    expect('second roll locked', await p.locator('[data-roll="1"]').isDisabled());
    await p.click('[data-roll="0"]'); await p.waitForTimeout(2000);          // animated roll
    const n = await p.locator('.st').first().locator('.dot').count(); out.c.roll = n; expect('roll gives ticks', n >= 1 && n <= 6);
    // tools 6: the next row waits until this one is done (all ticked or We give up); "3 of 14" shows where they are
    expect('second row waits for the first to be done', await p.locator('[data-roll="1"]').isDisabled());
    out.c.count1 = await p.locator('.subj-count').innerText(); expect('subject count', /^1 of \d+$/.test(out.c.count1));
    for (let i = 0; i < n; i++) await p.locator('.st').first().locator('.dot').nth(i).click();
    await p.waitForTimeout(700);   // the example comes in a moment after the last tick
    out.c.step1 = {done: await p.locator('.st').first().evaluate(e => e.classList.contains('done')), exampleOpen: await p.locator('.ex-step').count()};
    expect('step 1 done + example opens by itself', out.c.step1.done && out.c.step1.exampleOpen === 1);
    // the die (her husband's point, 27.10): it slows down and simply stops — the result shows from about half a second in, no scale bounce
    await p.click('[data-roll="1"]');
    // it ends upright (two whole turns), so the dark edge doesn't flick to the bottom when it stops (her catch, 27.10)
    const endTurn = await p.locator('[data-die-slot="1"] .die').evaluate(d => { const a = d.getAnimations()[0], k = a && a.effect.getKeyframes(); return k ? k[k.length - 1].transform : null; });
    const endDeg = +((/rotate\((-?[\d.]+)deg\)/.exec(endTurn || '') || [])[1]);
    out.c.dieEnd = endTurn;
    expect('die ends upright', Number.isFinite(endDeg) && endDeg % 360 === 0 && /translate\(0(px)?, 0(px)?\)/.test(endTurn));
    const dieAt = () => p.locator('[data-die-slot="1"] .die').evaluate(d => ({pips: d.querySelectorAll('i.p').length, tr: getComputedStyle(d).transform}));
    await p.waitForTimeout(1150); const late1 = await dieAt(); await p.waitForTimeout(350); const late2 = await dieAt();
    await p.waitForTimeout(500); const rolled = await p.locator('.st').nth(1).locator('.dot').count();
    out.c.die = {late1, late2, rolled};
    const scaled = tr => { const m = /matrix\(([^,]+), ([^,]+)/.exec(tr); return m && Math.abs(Math.hypot(+m[1], +m[2]) - 1) > .01; };
    expect('die keeps its result for the last slow turns', late1.pips === late2.pips && late2.pips === rolled && !scaled(late1.tr) && !scaled(late2.tr));
    expect('decision waits for the second row', await p.locator('[data-dec="1"]').isDisabled());
    // the example opens every time a row is done, even after it was opened early and hidden
    if (await p.locator('[data-giveup="1"]').count()) {
      await p.click('[data-ex="1"]'); await p.waitForTimeout(150); await p.click('[data-ex-hide="1"]'); await p.waitForTimeout(150);
      const hidden = await p.locator('.ex-step').count();
      await p.click('[data-giveup="1"]'); await p.waitForTimeout(150);
      out.c.gaveUp = {gave: await p.locator('.st').nth(1).evaluate(e => e.classList.contains('gave')), monkey: await p.locator('.st').nth(1).locator('.n').innerText(), exBefore: hidden, exAfter: await p.locator('.ex-step').count()};
      expect('give up -> 🙈', out.c.gaveUp.gave && out.c.gaveUp.monkey.includes('🙈'));
      expect('give up opens the example again after a hide', out.c.gaveUp.exAfter === hidden + 1);
      expect('one example open at a time', out.c.gaveUp.exAfter === 1 && await p.locator('.ex-step [data-ex-hide="1"]').count() === 1 && await p.locator('[data-ex="0"]').count() === 1); }
    expect('next locked before a decision', await p.locator('[data-next]').isDisabled());
    await p.locator('.ph').nth(1).click(); out.c.phraseUsed = await p.locator('.ph.used').count(); expect('box phrase clickable', out.c.phraseUsed === 1);
    await p.click('[data-dec="agree"]'); await shot(p, 'council-turn');
    out.c.agreeOn = await p.evaluate(() => { const b = document.querySelector('[data-dec="agree"]'), c = document.createElement('i'); c.style.color = 'var(--date-bg)'; document.body.append(c);
      const want = getComputedStyle(c).color; c.remove(); return {bg: getComputedStyle(b).backgroundColor, want}; });
    expect('Agree to disagree picked: warm colour, not grey', out.c.agreeOn.bg === out.c.agreeOn.want);
    await p.click('[data-next]'); await p.waitForTimeout(1200);
    out.c.second = {label: await p.locator('.subj-label').first().innerText(), sofar: await p.locator('.chip').allInnerTexts()};
    expect('next subject + so far', out.c.second.sofar.length === 1 && /agree to disagree/.test(out.c.second.sofar[0]));
    expect('count moves on', /^2 of /.test(await p.locator('.subj-count').innerText()));
    // Decide stage
    await p.click('.stage-btn[data-stage="decide"]'); await p.waitForTimeout(600);
    out.c.decide = {current: await cur(p), hint: await p.locator('.dice-hint').count(), follow0: await p.locator('.follow').count()};
    await p.locator('.pick.cut').nth(0).click(); await p.locator('.pick.cut').nth(2).click(); await p.locator('.pick.add').nth(1).click();
    out.c.decide.follow3 = await p.locator('.follow').count();
    await p.locator('.pick.add').nth(3).click(); await p.waitForTimeout(500);
    out.c.decide.follow4 = await p.locator('.follow-q').innerText();
    out.c.decide.speakPrimary = await p.locator('.decide [data-stage="speak"]').evaluate(e => e.classList.contains('primary'));
    await shot(p, 'council-decide', true);
    let k = 0; while (await p.locator('[data-fu-next]').count() && k++ < 10) { await p.click('[data-fu-next]'); await p.waitForTimeout(100); }
    out.c.decide.followUps = k + 1;
    expect('decide: no dice hint, follow-ups after 2 + 2, Extra speaking not pushed', /Decide/.test(out.c.decide.current) && !out.c.decide.hint && !out.c.decide.follow0 && !out.c.decide.follow3 && out.c.decide.follow4.length > 20 && !out.c.decide.speakPrimary && out.c.decide.followUps >= 2);
    // Extra speaking: one task at a time, then back to the game / start again
    await p.click('.decide [data-stage="speak"]'); await p.waitForTimeout(600);
    out.c.speak = {current: await cur(p), h: await p.locator('.speak-h').innerText()};
    let s = 0; while (await p.locator('[data-speak-next]').count() && s++ < 20) { await p.click('[data-speak-next]'); await p.waitForTimeout(60); }
    out.c.speak.tasks = s + 1; out.c.speak.end = await p.locator('.speak .row-actions button').allInnerTexts();
    expect('extra speaking', /Extra speaking/.test(out.c.speak.current) && /EXTRA SPEAKING/i.test(out.c.speak.h) && out.c.speak.tasks >= 3 && out.c.speak.end.some(t => /Start again/.test(t)));
    await p.click('[data-back]'); await p.waitForTimeout(300); out.c.backToGame = /Reasons/.test(await cur(p)); expect('back to the reasons', out.c.backToGame);
    // dice setting on the hint: 1–4 never gives more than 4 (reduced motion from here: instant rolls)
    await p.emulateMedia({reducedMotion: 'reduce'});
    await p.click('[data-faces="4"]'); const rolls = [];
    for (let g = 0; g < 14; g++) { await p.click('.stage-btn[data-stage="speak"]'); await p.waitForTimeout(30);
      while (await p.locator('[data-speak-next]').count()) await p.click('[data-speak-next]');
      await p.click('[data-restart]'); await p.waitForTimeout(30); await p.click('[data-roll="0"]'); await p.waitForTimeout(30); rolls.push(await p.locator('.st').first().locator('.dot').count()); }
    out.c.dice4 = {max: Math.max(...rolls), min: Math.min(...rolls)}; expect('dice 1–4', out.c.dice4.max <= 4 && out.c.dice4.min >= 1);
    out.c.usedClearedOnRestart = await p.locator('.ph.used').count() === 0; expect('restart clears used phrases', out.c.usedClearedOnRestart);
    // the 📋 list keeps its place in the side panel while they work
    await p.click('#side details.all summary'); await p.evaluate(() => scrollTo(0, 150));   // the tapped tick must stay on screen (since tools 6 the page is more compact), or the click itself scrolls
    const before = await p.evaluate(() => scrollY);
    await p.locator('.st').first().locator('.dot').first().click(); await p.waitForTimeout(100);
    out.c.sideKeeps = {open: await p.locator('#side details.all').evaluate(d => d.open), scroll: [before, await p.evaluate(() => scrollY)]};
    expect('side list stays open and the page keeps its place', out.c.sideKeeps.open && out.c.sideKeeps.scroll[0] === out.c.sideKeeps.scroll[1] && out.c.sideKeeps.scroll[0] > 0);
  }
  { const p = await page('tools/c1-schools/council-1.html', {scheme: 'dark'}); await p.click('[data-roll="0"]'); await p.waitForTimeout(100); await p.locator('.dot').first().click(); await shot(p, 'council-dark'); }
  // ---- council, Part 2: situation, box hidden until Peek, play every subject
  { const p = await page('tools/c1-schools/council-2.html');
    out.p2 = {situation: (await p.locator('.situation').innerText()).slice(0, 40), boxBefore: await p.locator('.box').count(), extra: await p.locator('.extra').innerText()};
    await p.click('[data-peek]'); out.p2.boxAfterPeek = await p.locator('.box').count(); await shot(p, 'council2-peek');
    await p.click('[data-box-toggle]'); out.p2.hiddenAgain = await p.locator('.box').count() === 0;
    expect('part 2 peek', out.p2.boxBefore === 0 && out.p2.boxAfterPeek === 1 && out.p2.hiddenAgain);
    let guard = 0;
    // tools 6: every subject, with either example open, fits on a 1280×720 Zoom screen (Next subject included), so nobody has to scroll
    const fits = [];
    while (await p.locator('[data-roll="0"]').count() && guard++ < 20) { await p.click('[data-roll="0"]'); await p.click('[data-giveup="0"]'); await p.click('[data-roll="1"]'); await p.click('[data-giveup="1"]');
      for (const k of [0, 1]) { if (await p.locator(`[data-ex="${k}"]`).count()) await p.click(`[data-ex="${k}"]`);
        fits.push(await p.evaluate(() => { scrollTo(0, 0); return Math.round(document.querySelector('[data-next]').getBoundingClientRect().bottom); })); }
      await p.click('[data-dec="0"]'); await p.click('[data-next]'); await p.waitForTimeout(40); }
    out.p2.fitMax = Math.max(...fits); expect('a whole subject fits on a 720 px screen', out.p2.fitMax <= 720);
    out.p2.allDone = {rounds: guard, sofar: await p.locator('.chip').count(), end: await p.locator('.stage.empty p').innerText()};
    expect('part 2 all subjects', out.p2.allDone.sofar === guard && guard >= 4);
    await p.click('.stage.empty [data-decide]'); out.p2.toDecide = /Decide/.test(await cur(p)); expect('time to decide', out.p2.toDecide);
  }
  // ---- deck, Part 1
  { const p = await page('tools/c1-schools/cards-1.html', {motion: 'no-preference'});
    await shot(p, 'cards-front');
    const front = async () => (await p.locator('.card .say').first().innerText()).replace(/\s+/g, ' ').trim();
    const f0 = await front();
    out.k = {stages: await p.locator('.stage-btn').allInnerTexts(), dots: await p.locator('.pd').count(), flipBtn: await p.locator('[data-flip-btn]').count(), hint: await p.locator('.hint-top').innerText(),
      label: await p.locator('.card .lbl').innerText(), list: {side: await p.locator('#side details.all').count(), main: await p.locator('#main details.all').count()}};
    expect('cards stages + no Flip button + list under the box', out.k.stages.join('|') === '🃏 Cards|💬 Speaking' && !out.k.flipBtn && out.k.list.side === 1 && !out.k.list.main);
    // the key word (tools 4): after the sentence, red bold capitals, the same word as in the data; in the 📋 list too
    out.k.kw = await p.evaluate(() => { const k = document.querySelector('.card .say .kw'), c = S.cards.find(x => x.id === S.queue[0]), st = k && getComputedStyle(k);
      const lab = getComputedStyle(document.documentElement).getPropertyValue('--label').trim();
      return {text: k && k.textContent, data: c.k, weight: st && st.fontWeight, color: st && st.color, label: lab, last: k && k === k.parentElement.lastElementChild,
        listKw: document.querySelectorAll('#side .all-row .kw').length, cards: S.cards.length}; });
    const hex = h => { const m = /^#(..)(..)(..)$/.exec(h); return m ? `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})` : h; };
    expect('key word in red after the sentence', out.k.kw.text === out.k.kw.data && /^[A-Z]+$/.test(out.k.kw.text) && +out.k.kw.weight >= 800 && out.k.kw.color === hex(out.k.kw.label) && out.k.kw.last && out.k.kw.listKw === out.k.kw.cards);
    expect('hint mentions the word in red', /word in red/.test(out.k.hint));
    await p.click('.card'); await p.waitForTimeout(300); await shot(p, 'cards-open');
    out.k.open = {ans: await p.locator('.ans:not([hidden])').count(), sentenceStays: (await front()) === f0};
    expect('tap opens the answer under the sentence', out.k.open.ans === 1 && out.k.open.sentenceStays);
    // tools 6: Again and Got it weigh the same (no nudge towards Got it)
    out.k.btns = await p.evaluate(() => ['[data-again]', '[data-got]'].map(q => getComputedStyle(document.querySelector(q)).backgroundColor));
    expect('Again and Got it look equal', out.k.btns[0] === out.k.btns[1]);
    await p.click('[data-again]'); await p.waitForTimeout(1000);           // animated: flies into its dot
    await p.emulateMedia({reducedMotion: 'reduce'});
    const seen = [];
    for (let i = 0; i < 4; i++) { seen.push(await front()); await p.click('.card'); await p.click('[data-got]'); await p.waitForTimeout(40); }
    out.k.againCameBackAt = seen.indexOf(f0) + 1; expect('Again comes back after 2–3 cards', out.k.againCameBackAt === 3 || out.k.againCameBackAt === 4);
    // look back through a dot
    await p.locator('.pd.tap').first().click(); await p.waitForTimeout(100);
    out.k.look = {card: await p.locator('.card.lookback').count(), back: await p.locator('[data-look-done]').count()};
    await p.click('[data-look-done]'); expect('look back via the dots', out.k.look.card === 1 && out.k.look.back === 1);
    // move to Speaking mid-deck and back: the same card, Space doesn't flip anything there
    const mid = await front(); const left = await p.evaluate(() => S.queue.length);
    await p.click('.stage-btn[data-stage="speak"]'); await p.waitForTimeout(200);
    out.k.speak = {current: await cur(p), hint: await p.locator('.hint-top').count(), dots: await p.locator('.pd').count(), card: await p.locator('.card').count(), h: await p.locator('.speak-h').innerText()};
    await p.keyboard.press('Space'); await shot(p, 'cards-speak');
    await p.click('.stage-btn[data-stage="cards"]'); await p.waitForTimeout(200);
    out.k.backSame = (await front()) === mid && (await p.evaluate(() => S.queue.length)) === left && !(await p.locator('.card.open').count());
    expect('cards ↔ speaking keeps the place', /Speaking/.test(out.k.speak.current) && !out.k.speak.hint && !out.k.speak.dots && !out.k.speak.card && out.k.backSame);
    let guard = 0;
    while (await p.locator('.card[data-flip]').count() && guard++ < 40) { await p.keyboard.press('Space'); await p.keyboard.press('2'); await p.waitForTimeout(30); }
    out.k.end = {title: await p.locator('.end h2').innerText(), list: await p.locator('.back-list li').count(), speakBtn: await p.locator('.end [data-speak]').count()};
    expect('end: come back to these + speaking', /Come back/.test(out.k.end.title) && out.k.end.list >= 1 && out.k.end.speakBtn === 1);
    await shot(p, 'cards-end');
    out.k.saved = await p.evaluate(() => localStorage.getItem('tool-again-c1-schools/cards-1')); expect('Again cards remembered', !!out.k.saved && out.k.saved.length > 2);
    await p.click('.end [data-speak]'); let s = 0; while (await p.locator('[data-speak-next]').count() && s++ < 20) await p.click('[data-speak-next]');
    out.k.loop = await p.locator('.speak .row-actions button').allInnerTexts();
    expect('speaking loops back to the cards', out.k.loop.some(t => /hard cards/.test(t)) && out.k.loop.some(t => /All the cards/.test(t)));
    await p.click('[data-redo]'); out.k.redo = {dots: await p.locator('.pd').count(), stage: await cur(p)}; expect('hard cards again', out.k.redo.dots >= 1 && /Cards/.test(out.k.redo.stage));
    await p.click('[data-box-toggle]'); out.k.boxHidden = await p.locator('.box').count() === 0; expect('box hides', out.k.boxHidden);
    // Part 2 on the same device: own cards + 4 from Part 1 (the Again one included)
    await p.goto('file://' + path.join(site, 'tools/c1-schools/cards-2.html')); await p.waitForTimeout(150);
    out.k2 = {dots: await p.locator('.pd').count()};
    await p.click('[data-settings]'); await p.check('[data-review]'); await p.waitForTimeout(100);
    out.k2.withReview = await p.locator('.pd').count();
    const fronts = await p.evaluate(() => S.cards.filter(c => c.review).map(c => (c.f.replace(/\(\(|\)\)/g, '') + (c.k ? ' ' + c.k : '')).replace(/\s+/g, ' ').trim()));   // the grey ((context)) shows without its brackets; the key word after it
    out.k2.againIncluded = fronts.includes(f0);
    await p.goto('file://' + path.join(site, 'tools/c1-schools/cards-2.html?review=1')); await p.waitForTimeout(150);
    out.k2.viaLink = await p.locator('.pd').count();
    expect('review cards from Part 1', out.k2.withReview === out.k2.dots + 4 && out.k2.viaLink === out.k2.withReview && out.k2.againIncluded);
    await shot(p, 'cards2');
  }
  // tools 6: the end of the deck gets a burst of confetti; "you are here" is blue in the speaking dots
  { const p = await page('tools/c1-schools/cards-1.html', {motion: 'no-preference'});
    await p.evaluate(() => { S.queue = [S.queue[0]]; render(); }); await p.click('.card'); await p.click('[data-got]'); await p.waitForTimeout(900);
    out.k.confetti = await p.locator('.confetti').count(); await shot(p, 'cards-confetti');
    await p.click('.end [data-speak]'); await p.waitForTimeout(200);
    out.k.speakDot = await p.evaluate(() => { const d = document.querySelector('.speak-dots button.on'), c = document.createElement('i'); c.style.color = 'var(--instr)'; document.body.append(c);
      const want = getComputedStyle(c).color; c.remove(); return {dot: getComputedStyle(d, '::before').backgroundColor, want}; });
    expect('confetti at the end of the deck', out.k.confetti > 10);
    expect('speaking: current dot is blue', out.k.speakDot.dot === out.k.speakDot.want); }
  { const p = await page('tools/c1-schools/cards-1.html', {scheme: 'dark'}); await p.click('.card'); await p.waitForTimeout(200); await shot(p, 'cards-dark'); }
  // phone width: one column, nothing wider than the screen
  for (const f of ['council-1', 'cards-1']) { const p = await page('tools/c1-schools/' + f + '.html', {w: 390, h: 800});
    out['phone_' + f] = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth); expect('phone ' + f, out['phone_' + f]);
    await shot(p, 'phone-' + f, true); }
  out.outside = outside; out.errors = errs;
  expect('no outside requests', !outside.length); expect('no page errors', !errs.length);
  console.log(JSON.stringify(out, null, 1)); console.log(fail.length ? 'FAILED: ' + fail.join('; ') : 'OK tools');
  await b.close(); process.exit(fail.length ? 1 : 0);
})();
