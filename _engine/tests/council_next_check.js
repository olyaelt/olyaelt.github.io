// tools 27 (her 2.11 21:34 on practical things): Next waits until the pair has decided Keep / Cut / 🤝 (and before that, the reasons);
// on her device every screen dot can be tapped and the council's subjects have ‹ › (to read it all through); a die scaled down with
// the card keeps its dots inside («кубик становится меньше, а точки такими, как были»).
//   node tests/council_next_check.js SITE_DIR
const {chromium} = require('playwright');
const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]); const fail = []; const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const errs = []; const out = {};
  for (const [who, h] of [['student', 880], ['teacher', 880], ['student-low', 600]]) {
    const c = await b.newContext({viewport: {width: 1050, height: h}, reducedMotion: 'reduce'});
    if (who === 'teacher') await c.addInitScript(() => { localStorage.setItem('hw-code', 'T'); localStorage.setItem('hw-role', 'teacher'); });
    await c.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: '{"ok":false}'}));
    const p = await c.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message));
    await p.goto('file://' + path.join(site, 'tools/c1-2026-11-04/practical-things-live.html')); await p.waitForTimeout(400);
    const pos = await p.evaluate(() => { for (let si = 0; si < D.stages.length; si++) { const bi = D.stages[si].blocks.findIndex(x => x.kind === 'council'); if (bi > -1) return [si, bi]; } return null; });
    await p.evaluate(([si, bi]) => { S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = bi; render(); }, pos); await p.waitForTimeout(200);
    out[who] = {pos, dots: await p.locator('.sdots button:not([disabled])').count(), dotsAll: await p.locator('.sdots button').count(), browse: await p.locator('[data-cn-browse]').count()};
    // roll both rows, tick / give up, open an example
    await p.click('[data-cn-roll="0"]'); await p.waitForTimeout(150); await p.click('[data-cn-giveup="0"]'); await p.waitForTimeout(100);
    await p.click('[data-cn-roll="1"]'); await p.waitForTimeout(150);
    await p.click('[data-step]'); await p.waitForTimeout(150); out[who].msgReasons = await p.locator('#step-msg').innerText();
    await p.click('[data-cn-giveup="1"]'); await p.waitForTimeout(100);
    out[who].dice = await p.evaluate(() => [...document.querySelectorAll('.cn-die')].map(d => { const r = d.getBoundingClientRect(); const ps = [...d.querySelectorAll('i.p')].map(i => i.getBoundingClientRect());
      return {w: Math.round(r.width), inside: ps.every(q => q.left >= r.left + 3 && q.right <= r.right - 3 && q.top >= r.top + 3 && q.bottom <= r.bottom - 3)}; }));
    const at0 = await p.evaluate(() => cnSt(curBlock()).at);
    await p.click('[data-step]'); await p.waitForTimeout(150);
    out[who].stayed = await p.evaluate(() => cnSt(curBlock()).at) === at0; out[who].msg = await p.locator('#step-msg').innerText();
    await p.click('[data-cn-dec="1"]'); await p.waitForTimeout(100); await p.click('[data-step]'); await p.waitForTimeout(200);
    out[who].movedAfter = await p.evaluate(() => cnSt(curBlock()).at) === at0 + 1;
    if (who === 'teacher') { await p.click('[data-cn-browse="1"]'); await p.waitForTimeout(100); out.teacher.browsed = await p.evaluate(() => cnSt(curBlock()).at);
      await p.locator('.sdots button:not([disabled])').last().click(); await p.waitForTimeout(150); out.teacher.jumped = await p.evaluate(() => bIdx()); }
    await c.close();
  }
  for (const who of ['student', 'teacher', 'student-low']) { const o = out[who];
    expect(who + ': Next before the reasons stays, "First the reasons"', /First the reasons/.test(o.msgReasons), o.msgReasons);
    expect(who + ': Next before Keep / Cut stays on the subject, "First decide together"', o.stayed && /First decide together/.test(o.msg), o);
    expect(who + ': after Keep, Next goes to the next subject', o.movedAfter, o);
    expect(who + ': every die keeps its dots inside, also scaled down (her 21:34)', o.dice.length === 2 && o.dice.every(d => d.inside && d.w >= 28), o.dice); }
  expect('student: every other dot can be tapped too (her 4.11 19:33), no ‹ ›', out.student.dots === out.student.dotsAll - 1 && out.student.browse === 0, out.student);
  expect('teacher: every other dot can be tapped, ‹ › on the counter, both work', out.teacher.dots === out.teacher.dotsAll - 1 && out.teacher.browse === 2 && out.teacher.browsed === 2 && out.teacher.jumped === out.teacher.dotsAll - 1, out.teacher);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK council: Next waits for the decision, her dots, the dice'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
