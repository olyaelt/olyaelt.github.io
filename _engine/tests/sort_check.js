// engine 49: the `sort` step (B2 30.10, task 2 «Recommend: say it, then sort it») and `scene` lines in dlg.
//   node tests/sort_check.js SITE_DIR [shots_dir]
// item 1 flies into its box by itself; item 2: the right box glows; a wrong box → why line, the card stays; the right box → next item;
// item 5 into «I'd recommend» → «A colleague recommended it to you…» (the why lines in English since 31.10); after item 8: 4 × 2 lines + the question; engine 50: nothing moves on by itself, no skip button;
// scene lines are grey date lines without a speaker; phone: no sideways scroll.
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'b2/2026-10-30.html';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const open = async (w, h, hash) => { const p = await (await b.newContext({viewport: {width: w, height: h}})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.emulateMedia({reducedMotion: 'reduce'}); await p.goto(base + PAGE + hash); await p.waitForTimeout(400); return p; };
  const S = p => p.evaluate(() => { const s = SORTS[Object.keys(SORTS)[0]]; return s ? {at: s.at, open: s.open, n: Object.keys(s.placed).length, done: s.done, wrong: s.wrong || '', glow: [...document.querySelectorAll('.sp.glow')].map(x => x.dataset.sp).join()} : null; });
  const goTxt = p => p.evaluate(() => { const g = document.getElementById('go'); return (g.disabled ? 'disabled:' : '') + g.textContent.trim(); });
  const right = p => p.evaluate(() => SORT.items[SORTS[Object.keys(SORTS)[0]].at].p);
  for (const [w, h, tag] of [[400, 860, 'phone'], [1280, 720, 'laptop']]) {
    const p = await open(w, h, '#sort'), log = [];
    log.push({go: await goTxt(p)});                                                                         // 0: Check
    await p.click('[data-sen]'); await p.waitForTimeout(5000); log.push(Object.assign(await S(p), {go: await goTxt(p)}));   // 1: auto flew, waits
    await p.click('#go'); await p.waitForTimeout(150);
    await p.click('#go'); await p.waitForTimeout(150); log.push(Object.assign(await S(p), {go: await goTxt(p)}));           // 2: item 2 open via Check, glow
    await p.click('[data-sp="p1"]'); await p.waitForTimeout(150); log.push(await S(p));                       // 3: wrong
    await p.click('[data-sp="p2"]'); await p.waitForTimeout(4000); log.push(Object.assign(await S(p), {go: await goTxt(p), why: await p.locator('.sp-why').count()}));   // 4: landed, stays
    await p.click('#go'); await p.waitForTimeout(150);
    for (let k = 0; k < 2; k++) { const want = await right(p); await p.click('[data-sen]'); await p.click(`[data-sp="${want}"]`); await p.waitForTimeout(400); await p.click('#go'); await p.waitForTimeout(150); }
    await p.click('[data-sen]'); await p.waitForTimeout(100); const glow5 = (await S(p)).glow; await p.click('[data-sp="p1"]'); await p.waitForTimeout(150); log.push(await S(p));   // 5: item 5 wrong
    if (shots) await p.screenshot({path: path.join(shots, `sort-${tag}-wrong.png`)});
    for (let k = 0; k < 4; k++) { const want = await right(p); if (k) await p.click('[data-sen]'); await p.click(`[data-sp="${want}"]`); await p.waitForTimeout(400);
      if (k === 3) log.push({go: await goTxt(p)}); await p.click('#go'); await p.waitForTimeout(150); }
    log.push(await S(p));                                                                                   // 6: last go label, 7: done
    out[tag] = {log, glow5, sum: await p.evaluate(() => ({boxes: document.querySelectorAll('.sort-pats.sum .sp').length, lines: [...document.querySelectorAll('.sort-pats.sum .sp')].map(x => x.querySelectorAll('li').length).join(), bold: !!document.querySelector('.sort-pats.sum li b'), q: (document.querySelector('.se-q') || {}).textContent || '', struck: [...document.querySelectorAll('.se-a s.fb-del')].map(x => x.textContent).join('|'), go: document.getElementById('go').textContent, w: document.documentElement.scrollWidth, vw: innerWidth, skip: /Show all the answers/.test(document.body.innerText)}))};
    const L = log, M = out[tag].sum;
    expect(tag + ': the main button starts as Check', L[0].go === 'Check', L[0]);
    expect(tag + ': item 1 flies by itself and then WAITS (her 31.10: nothing moves on by itself)', L[1].n === 1 && L[1].at === 0 && L[1].go === 'Next card →', L[1]);
    expect(tag + ': Check opens item 2; the main button waits; its box glows', L[2].at === 1 && L[2].open && L[2].go.startsWith('disabled:') && L[2].glow === 'p2', L[2]);
    expect(tag + ': wrong box → why, the card stays', L[3].at === 1 && L[3].n === 1 && /Someone recommended it to you/.test(L[3].wrong), L[3]);
    expect(tag + ': right box → it lands, the why line stays, Next card', L[4].at === 1 && L[4].n === 2 && L[4].why === 1 && L[4].go === 'Next card →', L[4]);
    expect(tag + ': item 5 (free): no glow; «Советую» brings the why line', glow5 === '' && L[5].at === 4 && /A colleague recommended it to you/.test(L[5].wrong), [glow5, L[5]]);
    expect(tag + ': the last card: "See all four patterns →", then the summary', L[6].go === 'See all four patterns →' && L[7].done, [L[6], L[7]]);
    expect(tag + ': the summary: 4 boxes × 2 lines, the question, Finish; no "Show all the answers" anywhere', M.boxes === 4 && M.lines === '2,2,2,2' && M.bold && /never comes right after recommend/.test(M.q) && M.struck === 'recommend you|recommend me|recommend to see' && /Finish/.test(M.go) && !M.skip, M);
    expect(tag + ': no sideways scroll', M.w <= M.vw, M);
    if (shots) await p.screenshot({path: path.join(shots, `sort-${tag}-summary.png`)});
  }
  { // engine 50 (her 31.10): Back = the card before, as it was left; the summary's Back = the last card; ↺ Do it again; opening the task again = a fresh start
    const p = await open(400, 860, '#sort'); const right = () => p.evaluate(() => SORT.items[SORTS[Object.keys(SORTS)[0]].at].p);
    await p.click('[data-sen]'); await p.waitForTimeout(300); await p.click('#go'); await p.waitForTimeout(150);
    await p.click('[data-sen]'); await p.click(`[data-sp="${await right()}"]`); await p.waitForTimeout(300); await p.click('#go'); await p.waitForTimeout(150);
    const backOn = await p.evaluate(() => !document.getElementById('prev').disabled);
    await p.click('#prev'); await p.waitForTimeout(150); const back1 = Object.assign(await S(p), {why: await p.locator('.sp-why').count(), go: await p.evaluate(() => document.getElementById('go').textContent.trim())});
    await p.click('#go'); await p.waitForTimeout(150); const fwd = await S(p);
    out.backs = {backOn, back1, fwd};
    expect('Back on a card = the card before, in its box with its why line; Next card → forward again', backOn && back1.at === 1 && back1.open && back1.why === 1 && back1.go === 'Next card →' && fwd.at === 2 && !fwd.open, out.backs);
    await p.click('#go'); await p.waitForTimeout(100);   // Check
    for (let k = 2; k < 8; k++) { const want = await right(); if (k > 2) await p.click('[data-sen]'); await p.click(`[data-sp="${want}"]`); await p.waitForTimeout(300); await p.click('#go'); await p.waitForTimeout(150); }
    const sumBack = await p.evaluate(() => !document.getElementById('prev').disabled); await p.click('#prev'); await p.waitForTimeout(150); const last = await S(p);
    await p.click('#go'); await p.waitForTimeout(150); const again = await S(p);
    await p.click('[data-sort-again]'); await p.waitForTimeout(150); const fresh = await S(p);
    await p.click('#home'); await p.waitForTimeout(150); await p.click('[data-open="sort"]'); await p.waitForTimeout(200); const reopened = await S(p);
    out.redo = {sumBack, last, again, fresh, reopened};
    expect('the summary: Back = the last card; ↺ Do it again = card 1, empty; opening the task again = a fresh start', sumBack && last.at === 7 && last.open && !last.done && again.done && fresh.at === 0 && fresh.n === 0 && !fresh.done && reopened && reopened.at === 0 && reopened.n === 0, out.redo); }
  { const p = await open(400, 860, '#rev');
    out.scene = await p.evaluate(() => [...document.querySelectorAll('.dlg p.scene')].map(x => x.textContent.trim() + (x.querySelector('.spk') ? '+spk' : '')).join('|'));
    expect('scene lines: grey date lines, no speaker', out.scene === 'Exchange 1|Exchange 2|Exchange 3', out.scene); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK sort'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
