// tools 12: the situation-cards type (B2 «Any recommendations?», 30.10.26; replaces the WHO / WHAT dice, her decision 29.10).
//   node tests/situation_cards_check.js SITE_DIR [shots_dir]    (serves SITE_DIR on a local port)
// ⭐ Example: the model card and the three answer types, no answers → Show the examples → Start the cards; 🃏 Cards: the model stays
// pinned; Draw → Roll → the type matches the die → Flip shows that answer first; 18 draws = 18 different cards, then a new deck;
// the pinned model + card + back fit 1280×720; 💬 Real talk and back; phone without sideways scrolling, model folded; dark; live tools.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/recommend-dice';
(async () => {
  const drawOrNext = async p => (await p.locator('[data-draw]').count()) ? p.click('[data-draw]') : p.click('[data-cardnext]');   // her 16:09: one Next — the answers, then the next card
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const page = async (opts = {}) => { const ctx = await b.newContext(opts.ctx || {viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    if (opts.init) await ctx.addInitScript(opts.init); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + PAGE + (opts.live ? '-live' : '') + '.html'); await p.waitForTimeout(250); return p; };
  { const p = await page();
    out.example = await p.evaluate(() => ({who: document.querySelector('.scard .who').textContent, types: document.querySelectorAll('.trow').length, answers: document.querySelectorAll('.tans').length}));
    expect('example: the model card, three types, no answers', out.example.types === 3 && out.example.answers === 0 && /colleague/i.test(out.example.who), out.example);
    if (shots) await p.screenshot({path: path.join(shots, 'cards-example.png')});
    await p.click('[data-show-ex]'); await p.waitForTimeout(60);
    out.shown = await p.evaluate(() => [...document.querySelectorAll('.tans')].map(x => x.textContent.slice(0, 30)));
    expect('Show the examples: three answers', out.shown.length === 3, out.shown);
    if (shots) await p.screenshot({path: path.join(shots, 'cards-example-shown.png')});
    await p.click('[data-start]'); await p.waitForTimeout(80);
    out.cardsStart = await p.evaluate(() => ({pinned: !!document.querySelector('details.model[open]'), draw: !!document.querySelector('[data-draw]')}));
    expect('cards stage: the model pinned open, Draw', out.cardsStart.pinned && out.cardsStart.draw, out.cardsStart);
    const seen = new Set(); let fitMax = 0;
    for (let k = 0; k < 18; k++) {
      await drawOrNext(p); await p.waitForTimeout(40);
      await p.click('[data-roll]'); await p.waitForTimeout(40);
      const v = await p.evaluate(() => ({i: S.cur.i, face: S.cur.face, type: S.cur.type, how: document.querySelector('.die-how').textContent, count: document.querySelector('.sit-count').textContent}));
      expect('draw ' + k + ': the type matches the die', ({R: [1, 2], W: [3, 4], D: [5, 6]})[v.type].includes(v.face) && v.how.includes(D_ANS(v.type)), v);
      seen.add(v.i);
      await p.click('[data-cardnext]'); await p.waitForTimeout(40);
      const bk = await p.evaluate(() => { const m = document.querySelector('.back-main p'), mc = m && m.cloneNode(true); if(mc) mc.querySelectorAll('.type').forEach(x => x.remove()); return {main: mc ? mc.textContent : '', want: D.cards[S.cur.i][S.cur.type].replace(/\*\*/g, ''), others: document.querySelectorAll('.back-other p').length,
        bottom: Math.round(document.querySelector('.back').getBoundingClientRect().bottom + scrollY), pinned: !!document.querySelector('details.model[open]')}; });
      expect('Flip: the rolled answer first, the two others under it', bk.main === bk.want && bk.others === 2 && bk.pinned, bk);
      fitMax = Math.max(fitMax, bk.bottom);
      if (k === 0 && shots) await p.screenshot({path: path.join(shots, 'cards-flipped.png')});
    }
    out.cards = seen.size; out.fitMax = fitMax;
    expect('18 draws = 18 different cards', seen.size === 18, seen.size);
    expect('pinned model + card + back fit on 1280×720', fitMax <= 720, fitMax);
    await drawOrNext(p); await p.waitForTimeout(40); out.deck19 = await p.evaluate(() => ({count: document.querySelector('.sit-count').textContent, left: S.deck.length}));
    expect('then a new deck', out.deck19.count === '1 of 18' && out.deck19.left === 17, out.deck19);
    out.box = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom)); expect('box whole on 720', out.box <= 720, out.box);
    await p.click('[data-stage="speak"]'); await p.waitForTimeout(80); out.speak = await p.locator('.speak-task').innerText();
    expect('real talk stage', /two things/i.test(out.speak), out.speak);
    await p.click('[data-stage="cards"]'); await p.waitForTimeout(80); out.back = await p.evaluate(() => !!document.querySelector('.scard'));
    expect('back to the card it was on', out.back, out.back); }
  { const p = await page({ctx: {...devices['iPhone 13']}}); await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]');
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth, folded: !document.querySelector('details.model[open]'),
      front: Math.round(document.querySelector('.scard').getBoundingClientRect().bottom), vh: innerHeight}));
    expect('phone: no sideways scroll, the model folded, the card front on screen', out.phone.w <= out.phone.vw && out.phone.folded && out.phone.front <= out.phone.vh, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'cards-phone.png'), fullPage: true}); }
  { const p = await page({scheme: 'dark'}); await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]'); if (shots) await p.screenshot({path: path.join(shots, 'cards-dark.png')}); }
  { const p = await page({live: true, init: () => { localStorage.setItem('hw-role', 'teacher'); localStorage.setItem('hw-code', 'T-TEST'); }});
    await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]');
    out.live = await p.evaluate(() => ({bar: !!document.querySelector('.live-bar'), tools: document.querySelectorAll('.live-tools').length}));
    expect('live page: her bar and tools', out.live.bar && out.live.tools >= 6, out.live); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK situation cards'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
  function D_ANS(t){ return ({R: 'You recommend it', W: "You wouldn't recommend it", D: "You don't know it"})[t]; }
})();
