// engine 49: «Fix it» (C1 30.10, TZ from the C1 lesson chat 31.10): block cards (the slip struck grey, the fix big and red, why), items
// place (tap a ▢ and the word, or drag; wrong → "Not quite"; right → the sentence with the word red), which (tap every possible option),
// write (rewrite with the card); bookmarks; phone width; e2 rewrites with the box from the start.
//   node tests/fixit_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const url = 'file://' + path.join(site, 'c1/2026-10-30.html');
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const page = async (vp = {width: 1280, height: 720}) => { const p = await (await b.newContext({viewport: vp})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.emulateMedia({reducedMotion: 'reduce'}); await p.goto(url + '#e1'); await p.waitForTimeout(300); return p; };
  const go = (p, i) => p.evaluate(i => { stepIdx = i; checked = false; renderTask(); }, i);
  const st = p => p.evaluate(() => ({checked, msg: (document.querySelector('.fx-msg') || {}).textContent || '', ans: (document.querySelector('.fx-ans') || {}).textContent || '', red: (document.querySelector('.fx-ans .fx-in') || {}).textContent || '', go: document.getElementById('go').textContent}));
  { const p = await page();
    out.card = await p.evaluate(() => { const fx = document.querySelector('.fx-right .fx-fix'), line = document.querySelector('.fx-right');
      return {title: document.querySelector('.fx-t').textContent, del: getComputedStyle(document.querySelector('.fx-del')).textDecorationLine, good: !!document.querySelector('.fx-wrong .good'),
        big: parseFloat(getComputedStyle(fx).fontSize) / parseFloat(getComputedStyle(line).fontSize), red: getComputedStyle(fx).color, why: !!document.querySelector('.fx-why'), ru: !!document.querySelector('.fx-ru'),
        slots: document.querySelectorAll('.fx-slot').length, chips: [...document.querySelectorAll('.fx-chip')].map(c => c.textContent).join()}; });
    expect('card: the slip struck grey, good green, the fix big and red, why en + ru', /pick it up/.test(out.card.title) && out.card.del === 'line-through' && out.card.good && out.card.big > 1.2 && out.card.red === 'rgb(224, 0, 0)' && out.card.why && out.card.ru, out.card);
    expect('place 1: four ▢, one chip "it"', out.card.slots === 4 && out.card.chips === 'it', out.card);
    await p.click('.fx-slot[data-slot="1"]'); out.w1 = await st(p);
    await p.click('.fx-slot[data-slot="5"]'); out.w2 = await st(p);
    await p.click('.fx-slot[data-slot="3"]'); out.r1 = await st(p);
    expect('place: a wrong ▢ → Not quite, try another place (not checked)', !out.w1.checked && /Not quite — try another place/.test(out.w1.msg) && !out.w2.checked, [out.w1, out.w2]);
    expect('place: only the ▢ after "picked" → the sentence with "it" red, ✓, Next', out.r1.checked && out.r1.ans.trim() === 'Nobody taught me to swim. I picked it up at the lake as a kid.' && out.r1.red === 'it' && /✓ That's it/.test(out.r1.msg) && out.r1.go === 'Next', out.r1);
    if (shots) await p.screenshot({path: path.join(shots, 'fixit-place-right.png')});
    out.bm = await p.evaluate(() => !!document.querySelector('.fx-ans .rev')); expect('a bookmark after the answer', out.bm, out.bm);
    await p.click('.fx-ans .rev'); out.once = await p.evaluate(() => { const t = onceMoreTask(current); return t ? t.steps.map(s => s.type).join() : ''; });
    expect('Once more: a bookmarked fix step comes back', out.once === 'fix', out.once);
    // write (rewrite with the card, shorter card on later items)
    await go(p, 1); out.wcard = await p.evaluate(() => ({card: !!document.querySelector('.panel .fx-card.short'), why: !!document.querySelector('.fx-why'), hint: (document.querySelector('.target .ru') || {}).textContent}));
    await p.fill('#rw', 'hand them over'); await p.click('#go'); out.write = await p.evaluate(() => !!document.querySelector('.you-ok'));
    expect('write: the card (shorter), the hint, "hand them over" accepted', out.wcard.card && !out.wcard.why && out.wcard.hint === '(hand over)' && out.write, [out.wcard, out.write]);
    // which
    await go(p, 2); await p.click('.fx-opt[data-o="0"]'); await p.click('.fx-opt[data-o="2"]'); await p.click('#go');
    out.which = await p.evaluate(() => ({cls: [...document.querySelectorAll('.fx-opt')].map(o => o.className.replace('fx-opt', '').trim()), note: (document.querySelector('.panel .note') || {}).textContent || ''}));
    expect('which: right ones green, the wrong one grey struck, picks marked, then the note', out.which.cls[0] === 'right picked' && out.which.cls[1] === 'right' && out.which.cls[2] === 'wrong picked' && /With a noun, both/.test(out.which.note), out.which);
    // place with two chips (a / the), cap
    await go(p, 7); await p.click('.fx-chip[data-w="the"]'); await p.click('.fx-slot[data-slot="1"]'); out.t1 = await st(p);
    await p.click('.fx-chip[data-w="a"]'); await p.click('.fx-slot[data-slot="3"]'); out.t2 = await st(p);
    await p.click('.fx-slot[data-slot="1"]'); await p.click('.fx-chip[data-w="a"]'); out.t3 = await st(p);   /* the other order: the ▢ first, then the word */
    expect('a / the: "the" rejected, "a" in the wrong ▢ rejected, "a" in the first ▢ → "A complete waste of time"', !out.t1.checked && /other word/.test(out.t1.msg) && !out.t2.checked && /another place/.test(out.t2.msg)
      && out.t3.checked && out.t3.ans.trim() === 'That two-hour webinar on productivity? A complete waste of time.' && out.t3.red === 'A', [out.t1, out.t2, out.t3]);
    await go(p, 8); await p.click('.fx-chip[data-w="the"]'); await p.click('.fx-slot[data-slot="1"]'); out.t4 = await st(p);
    expect('the hard way', out.t4.checked && out.t4.ans.trim() === 'My first month with a puppy: I learned the hard way that puppies eat shoes.', out.t4);
    // Show the answer without placing
    await go(p, 0); await p.click('#go'); out.show = await st(p); expect('"Show the answer" shows it (no ✓)', out.show.checked && /picked it up/.test(out.show.ans) && !/That's it/.test(out.show.msg), out.show);
    out.min = await p.evaluate(() => minutesOf(TASKS.find(t => t.id === 'e1'))); expect('e1 ≈ 11 min', out.min === 11, out.min);
    // e2: the box beside the rewrite from the start; "been handed over" accepted
    await p.evaluate(() => openTask('e2', 3)); await p.waitForTimeout(200);
    out.e2 = {box: await p.locator('.stage aside.box').count()}; await p.fill('#rw', 'been handed over'); await p.click('#go'); out.e2.ok = await p.locator('.you-ok').count();
    expect('e2: the box from the start, "been handed over" accepted', out.e2.box === 1 && out.e2.ok === 1, out.e2); }
  // drag (mouse) on a phone-sized screen; no sideways scroll
  { const p = await page({width: 400, height: 860});
    const c = await p.locator('.fx-chip').boundingBox(), s = await p.locator('.fx-slot[data-slot="3"]').boundingBox();
    await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await p.mouse.down(); await p.mouse.move(c.x + 40, c.y - 20, {steps: 4});
    await p.mouse.move(s.x + s.width / 2, s.y + s.height / 2, {steps: 6}); await p.mouse.up(); await p.waitForTimeout(100);
    out.drag = await st(p); expect('drag the chip onto the right ▢ → placed', out.drag.checked && out.drag.red === 'it', out.drag);
    out.ghost = await p.locator('.fx-ghost').count(); expect('no ghost left after the drop', out.ghost === 0, out.ghost);
    for (const i of [0, 2, 7]) { await go(p, i); const w = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth]); expect('phone: no sideways scroll on step ' + (i + 1), w[0] <= w[1], w); }
    if (shots) { await go(p, 7); await p.screenshot({path: path.join(shots, 'fixit-phone.png'), fullPage: true}); } }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK fixit'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
