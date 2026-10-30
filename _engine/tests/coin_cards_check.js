// tools 13: situation-cards with a coin (B2 revision 30.10, tags.html «Did you hear?»; her decision 29.10: a coin for a two-way choice).
//   node tests/coin_cards_check.js SITE_DIR [shots_dir]
// Example: two types, no answers → Show → both; Cards: Draw → Toss → heads = S, tails = N, both come up in 20 tosses; Flip → that answer first;
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
    out.example = await p.evaluate(() => ({types: document.querySelectorAll('.trow').length, ask: document.querySelector('.ex-ask').textContent,
      intro: (document.querySelector('.coin-intro p') || {}).textContent || '', introCoin: !!document.querySelector('.coin-intro [data-intro-coin]'),
      faces: [...document.querySelectorAll('.coin-intro p .coin')].map(c => c.getAttribute('aria-label')).join(), rowCoins: [...document.querySelectorAll('.trow .coin')].map(c => c.getAttribute('aria-label')).join(),
      words: document.querySelectorAll('.trow .type').length}));
    expect('example: two types, "both"', out.example.types === 2 && /both/.test(out.example.ask), out.example);
    // her 14:53: what heads and tails are — the coin on top, "Flip the coin. Did you get heads (picture) or tails (picture)?", the pictures on the rows
    expect('example: the coin and "Flip the coin. Did you get heads … or tails …?" with both faces', out.example.introCoin && /^Flip the coin\. Did you get heads\s*or tails\s*1?\?$/.test(out.example.intro.trim()) && out.example.faces === 'heads,tails', out.example);
    expect('example rows: the faces instead of the words', out.example.rowCoins === 'heads,tails' && out.example.words === 0, out.example);
    await p.click('[data-show-ex]'); await p.waitForTimeout(50); expect('both model answers', await p.locator('.tans').count() === 2, 'tans');
    if (shots) await p.screenshot({path: path.join(shots, 'tags-example.png')});
    await p.click('[data-start]'); await p.waitForTimeout(60);
    const faces = new Set(); let fitMax = 0;
    for (let k = 0; k < 20; k++) {
      await drawOrNext(p); await p.waitForTimeout(30); await p.click('[data-roll]'); await p.waitForTimeout(30);
      const v = await p.evaluate(() => ({face: S.cur.face, type: S.cur.type, coin: document.querySelector('[data-die] .coin').getAttribute('aria-label'), how: document.querySelector('.die-how').textContent, roll: document.querySelector('[data-roll]').textContent, flip: document.querySelector('[data-cardnext]').textContent, oldFlip: !!document.querySelector('[data-flip]')}));
      expect('toss ' + k + ': heads = S, tails = N', ((v.face === 1 && v.type === 'S' && v.coin === 'heads' && /heads/i.test(v.how)) || (v.face === 2 && v.type === 'N' && v.coin === 'tails' && /tails/i.test(v.how))) && /Flip again/.test(v.roll) && /^Next →$/.test(v.flip.trim()) && !v.oldFlip, v);
      faces.add(v.face);
      await p.click('[data-cardnext]'); await p.waitForTimeout(30);
      const bk = await p.evaluate(() => { const m = document.querySelector('.back-main p').cloneNode(true); m.querySelectorAll('.type, .coin').forEach(x => x.remove());
        return {main: m.textContent, want: D.cards[S.cur.i][S.cur.type].replace(/\*\*/g, ''), bottom: Math.round(document.querySelector('.back').getBoundingClientRect().bottom + scrollY)}; });
      expect('Flip: the tossed answer first', bk.main === bk.want, bk); fitMax = Math.max(fitMax, bk.bottom);
      if (k === 0 && shots) await p.screenshot({path: path.join(shots, 'tags-flipped.png')});
    }
    out.faces = [...faces]; out.fitMax = fitMax;
    expect('both sides came up', faces.size === 2, out.faces); expect('fits 1280×720', fitMax <= 720, fitMax);
    out.box = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom)); expect('box whole on 720', out.box <= 720, out.box); }
  { const p = await page({motion: true}); await p.waitForTimeout(2000);
    out.intro = await p.evaluate(() => ({face: S.introFace, busy: !!S.introBusy, label: document.querySelector('[data-intro-coin]').innerHTML.includes('svg') ? 'heads' : 'tails'}));
    expect('on arrival the coin flips by itself and lands', [1, 2].includes(out.intro.face) && !out.intro.busy && out.intro.label === ['', 'heads', 'tails'][out.intro.face], out.intro);
    await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.waitForTimeout(1800);
    out.animated = await p.evaluate(() => ({type: S.cur.type, busy: !!S.busy})); expect('the toss animation lands', out.animated.type && !out.animated.busy, out.animated); }
  { const p = await page({ctx: {...devices['iPhone 13']}}); await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]');
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth})); expect('phone: no sideways scroll', out.phone.w <= out.phone.vw, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'tags-phone.png'), fullPage: true}); }
  { const p = await page({scheme: 'dark'}); await p.click('[data-start]'); await p.click('[data-draw]'); await p.click('[data-roll]'); await p.click('[data-cardnext]'); if (shots) await p.screenshot({path: path.join(shots, 'tags-dark.png')}); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK coin cards'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
