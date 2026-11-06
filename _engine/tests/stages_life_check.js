// tools 28 also (B2 6.11, TZ 2026-11-05_2010 v3, engine requests 1–3): «💬 Your turn» after a noughts-and-crosses square (Next only, the
// game goes on, kept on reload); a US | UK pairs group in the box (flags drawn by the page, both ticking like any phrase); pictures in a
// text block that aren't there yet → no picture, no broken image.
//   node tests/stages_life_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  const url = 'file://' + path.join(site, 'tools/b2-2026-11-06/stages-of-life.html');
  await p.goto(url + '#part-4-screen-1'); await p.waitForTimeout(500);
  await p.click('#side [data-boxst="open"]'); await p.waitForTimeout(200);   /* fixes-5: Practice opens the box gapped — «Show all» first */
  out.box = await p.evaluate(() => { const g = document.querySelector('.ph-pairs'); const box = document.querySelector('aside.box').getBoundingClientRect();
    return {flags: [...g.querySelectorAll('.pp-h span')].map(s => [s.textContent.trim(), !!s.querySelector('svg.flag')]), rows: g.querySelectorAll('.pp-row').length,
      cells: [...g.querySelector('.pp-row').querySelectorAll('.ph')].map(x => x.textContent.trim()), ru: g.querySelector('.pp-ru')?.textContent, boxBottom: Math.round(box.bottom),
      ipa: !!document.querySelector('aside.box .ipa'), raw: /##/.test(document.querySelector('aside.box').textContent)}; });
  expect('US | UK: two flags, three pairs, the Russian under the pair', JSON.stringify(out.box.flags) === '[["US",true],["UK",true]]' && out.box.rows === 3 && out.box.cells[0] === 'after high school' && out.box.cells[1] === 'after I left school' && out.box.ru === 'окончив школу', out.box);
  expect('the box whole at 1280×720, IPA shown as IPA', out.box.boxBottom <= 720 && out.box.ipa && !out.box.raw, out.box);
  await p.locator('.ph-pairs .ph').nth(1).click(); await p.waitForTimeout(100);
  out.tick = await p.evaluate(() => [...document.querySelectorAll('.ph-pairs .ph')].map(x => x.classList.contains('used')).slice(0, 2));
  expect('a UK cell ticks by itself', JSON.stringify(out.tick) === '[false,true]', out.tick);
  await p.goto(url + '#part-4-screen-2'); await p.waitForTimeout(500);
  await p.locator('.gt-cell').first().click(); await p.waitForTimeout(300); await p.locator('[data-gt-show]').click(); await p.waitForTimeout(200);
  await p.locator('[data-gt-no]').click(); await p.waitForTimeout(300);
  out.talk = await p.evaluate(() => ({talk: document.querySelector('.gt-talk')?.innerText.replace(/\s+/g, ' ').slice(0, 80), off: [...document.querySelectorAll('.gt-cell')].every(c => c.disabled), next: !!document.querySelector('[data-gt-talked]'), pageNext: document.querySelector('[data-step]').classList.contains('primary'), own: [...document.querySelectorAll('.gt-talk button')].filter(x => !x.hidden).length, hint: document.querySelector('.gt-tnext')?.textContent}));
  expect('✗ Not quite → «💬 Your turn», the board waits', /Your turn/.test(out.talk.talk || '') && out.talk.off, out.talk);
  expect('her 21:12: no button of its own — «Talk about it, then Next →», the page Next (filled) goes on, as in the Jeopardy games', out.talk.own === 0 && /then Next/.test(out.talk.hint || '') && out.talk.pageNext === true, out.talk);
  await p.reload(); await p.waitForTimeout(500); out.kept = await p.evaluate(() => ({talk: !!document.querySelector('.gt-talk'), pageNext: document.querySelector('[data-step]').classList.contains('primary')}));
  expect('kept on reload', out.kept.talk, out.kept);
  await p.locator('[data-step]').click(); await p.waitForTimeout(300);
  out.after = await p.evaluate(() => ({talk: !!document.querySelector('.gt-talk'), turn: document.querySelector('.gt-turn')?.textContent.trim(), free: [...document.querySelectorAll('.gt-cell')].filter(c => !c.disabled).length}));
  out.after.pageNext = await p.evaluate(() => document.querySelector('[data-step]').classList.contains('primary'));
  expect('the page Next → the game goes on (the other player, the square still free), still on the game', !out.after.talk && /O's turn/.test(out.after.turn) && out.after.free === 9 && out.after.pageNext, out.after);
  await p.goto(url + '#part-3-screen-1'); await p.waitForTimeout(500);
  out.pics = await p.evaluate(() => ({img: document.querySelectorAll('#main img.lph, #main .tx-pic img').length, broken: [...document.querySelectorAll('#main img')].filter(i => i.complete && !i.naturalWidth).length}));
  expect('her pictures (6.11 13:12): nothing broken', out.pics.broken === 0, out.pics);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK stages of life'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
