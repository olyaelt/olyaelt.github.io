// tools 13: situation-cards with a coin (B2 revision 30.10, tags.html «Did you hear?»; her decision 29.10: a coin for a two-way choice).
//   node tests/coin_cards_check.js SITE_DIR [shots_dir]
// Example (handoff 30.10 21:20): How it works → heads always → tails always → the cards with 📌 Examples; Cards: Draw → Toss → heads = S, tails = N, both come up in 20 tosses; Flip → that answer first;
// fits 1280×720; the toss animation runs without errors; phone; dark.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/tags';
(async () => {
  const drawOrNext = async p => (await p.locator('[data-draw]').count()) ? p.click('[data-draw]') : p.click('[data-cardnext]');   // her 16:09: one Next — the answers, then the next card
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const page = async (opts = {}) => { const ctx = await b.newContext(opts.ctx || {viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); if (!opts.motion) await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + PAGE + '.html'); await p.waitForTimeout(250); return p; };
  { const p = await page();
    // handoff 30.10 21:20 (her words: "so hard to understand what's going on here"): ⭐ Example = How it works → heads (always) → tails (always)
    const ex = () => p.evaluate(() => ({n: (document.querySelector('.stage .sit-count') || {}).textContent || '', how: [...document.querySelectorAll('.how li')].map(li => (li.querySelector('.gcoin') ? li.querySelector('.gcoin').dataset.face + ':' : '') + (c => { c.querySelectorAll('.gcoin').forEach(x => x.remove()); return c.textContent.trim().slice(0, 6); })(li.cloneNode(true))),
      end: (document.querySelector('.how-end') || {}).textContent || '', says: (document.querySelector('.scard .says') || {}).textContent || '', face: (document.querySelector('[data-trycoin] .gcoin') || {dataset: {}}).dataset.face,
      after: (document.querySelector('.try-after') || {}).textContent || '', gaps: document.querySelectorAll('.try-lines .gp').length, open: document.querySelectorAll('.try-lines .gp.open').length,
      next: (document.querySelector('[data-exnext]') || {}).textContent || '', oldIntro: !!document.querySelector('.coin-intro')}));
    out.ex = [await ex()];
    await p.click('[data-exnext]'); out.ex.push(await ex());
    await p.click('[data-trycoin]'); await p.waitForTimeout(50); out.ex.push(await ex());
    await p.click('[data-tall]'); out.ex.push(await ex());
    await p.click('[data-exnext]'); out.ex.push(await ex());
    await p.click('[data-exnext]'); await p.waitForTimeout(50); out.ex.push(await ex());
    await p.click('[data-exnext]'); out.ex.push(await ex());
    const E = out.ex;
    expect('1 How it works: four lines, the coin faces on the Heads / Tails lines, "Let\'s try it…", 1 of 3', /1 of 3/.test(E[0].n) && E[0].how.length === 4 && E[0].how[2] === '1:Heads:' && E[0].how[3] === '2:Tails:' && /one card first/.test(E[0].end) && !E[0].oldIntro, E[0]);
    expect('2 Heads: the card, the coin always lands on heads, the example with gaps, Show all', /2 of 3/.test(E[1].n) && /coffee machine/.test(E[1].says) && E[1].face === '0' && E[2].face === '1' && /^Heads!/.test(E[2].after) && E[2].gaps === 3 && E[2].open === 0 && E[3].open === 3, E.slice(1, 4));
    expect('3 Tails: same card, always tails; Next opens the answers, then "Start the cards"', /3 of 3/.test(E[4].n) && E[4].says === E[1].says && E[4].face === '1' && E[5].face === '2' && /^Tails!/.test(E[5].after) && E[6].open === E[6].gaps && E[6].gaps === 2 && /Start the cards/.test(E[6].next), E.slice(4));
    if (shots) await p.screenshot({path: path.join(shots, 'tags-example.png')});
    await p.click('[data-exnext]'); await p.waitForTimeout(60);
    out.start = await p.evaluate(() => ({view: S.view, go: (document.querySelector('.go-line') || {}).textContent || '', pin: [...document.querySelectorAll('.expin-b')].map(b => b.querySelector('.gcoin').dataset.face + (c => { c.querySelectorAll('.gcoin').forEach(x => x.remove()); return c.textContent.trim(); })(b.cloneNode(true))).join(), hint: !!document.querySelector('.hint-top'), model: !!document.querySelector('details.model')}));
    expect('the cards: the go line once, 📌 Examples heads | tails at the bottom, no old ⭐ model', out.start.view === 'cards' && /Now play for real/.test(out.start.go) && out.start.pin === '1Heads,2Tails' && !out.start.hint && !out.start.model, out.start);
    await p.click('[data-expin="0"]'); out.pinOpen = await p.evaluate(() => (document.querySelector('.expin-open') || {}).textContent || ''); expect('a pinned example opens on tap', /I have! It's so annoying, isn't it\?/.test(out.pinOpen), out.pinOpen);
    await p.click('[data-expin="0"]');
    const faces = new Set(); let fitMax = 0;
    for (let k = 0; k < 20; k++) {
      await drawOrNext(p); await p.waitForTimeout(30); await p.click('[data-roll]'); await p.waitForTimeout(30);
      const v = await p.evaluate(() => ({face: S.cur.face, type: S.cur.type, coin: document.querySelector('[data-die] .gcoin').getAttribute('aria-label'), how: document.querySelector('.die-how').textContent, roll: document.querySelector('[data-roll]').getAttribute('aria-label'), smallCoins: document.querySelectorAll('.die-how:not(.wait) .gcoin').length, rollBtns: document.querySelectorAll('[data-roll]').length, flip: document.querySelector('[data-cardnext]').textContent, oldFlip: !!document.querySelector('[data-flip]')}));
      expect('toss ' + k + ': heads = S, tails = N', ((v.face === 1 && v.type === 'S' && v.coin === 'heads' && /heads/i.test(v.how)) || (v.face === 2 && v.type === 'N' && v.coin === 'tails' && /tails/i.test(v.how))) && /Flip again/.test(v.roll) && /^Next →$/.test(v.flip.trim()) && !v.oldFlip && v.smallCoins === 0 && v.rollBtns === 1, v);   // her 21:17: one coin, tapped to flip
      faces.add(v.face);
      await p.click('[data-cardnext]'); await p.waitForTimeout(30);
      const bk = await p.evaluate(() => { const m = document.querySelector('.back-main p').cloneNode(true); m.querySelectorAll('.type, .gcoin').forEach(x => x.remove());
        return {main: m.textContent, want: D.cards[S.cur.i][S.cur.type].replace(/\*\*/g, ''), bottom: Math.round(document.querySelector('.back').getBoundingClientRect().bottom + scrollY)}; });
      expect('Flip: the tossed answer first', bk.main === bk.want, bk); fitMax = Math.max(fitMax, bk.bottom);
      if (k === 0 && shots) await p.screenshot({path: path.join(shots, 'tags-flipped.png')});
    }
    out.faces = [...faces]; out.fitMax = fitMax;
    expect('both sides came up', faces.size === 2, out.faces); expect('fits 1280×720', fitMax <= 720, fitMax);
    out.box = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom)); expect('box whole on 720', out.box <= 720, out.box); }
  { const p = await page({motion: true}); await p.click('[data-exnext]'); await p.click('[data-trycoin]'); await p.waitForTimeout(2200);
    out.intro = await p.evaluate(() => ({face: S.tries[0].face, busy: !!S.busy, coin: document.querySelector('[data-trycoin] .gcoin').getAttribute('aria-label')}));
    expect('the example coin really flips and lands on heads', out.intro.face === 1 && !out.intro.busy && out.intro.coin === 'heads', out.intro);
    await p.click('[data-stage="cards"]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.waitForTimeout(2200);
    out.animated = await p.evaluate(() => ({type: S.cur.type, busy: !!S.busy})); expect('the toss animation lands', out.animated.type && !out.animated.busy, out.animated); }
  { const p = await page({ctx: {...devices['iPhone 13']}}); await p.click('[data-stage="cards"]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]');
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth})); expect('phone: no sideways scroll', out.phone.w <= out.phone.vw, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'tags-phone.png'), fullPage: true}); }
  { const p = await page({scheme: 'dark'}); await p.click('[data-stage="cards"]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]'); if (shots) await p.screenshot({path: path.join(shots, 'tags-dark.png')}); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK coin cards'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
