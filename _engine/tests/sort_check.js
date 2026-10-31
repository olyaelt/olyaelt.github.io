// engine 49: the `sort` step (B2 30.10, task 2 «Recommend: say it, then sort it») and `scene` lines in dlg.
//   node tests/sort_check.js SITE_DIR [shots_dir]
// item 1 flies into its box by itself; item 2: the right box glows; a wrong box → why line, the card stays; the right box → next item;
// item 5 into «Советую» → «Посоветовал коллега…»; after item 8: 4 × 2 lines + the question; "Show all the answers" → the summary at once;
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
  for (const [w, h, tag] of [[400, 860, 'phone'], [1280, 720, 'laptop']]) {
    const p = await open(w, h, '#sort'), log = [];
    await p.click('[data-sen]'); await p.waitForTimeout(3300); log.push(await S(p));                       // 0: auto flew + why, next
    await p.click('[data-sen]'); await p.waitForTimeout(150); log.push(await S(p));                        // 1: item 2 open, p2 glows
    await p.click('[data-sp="p1"]'); await p.waitForTimeout(150); log.push(await S(p));                    // 2: wrong
    await p.click('[data-sp="p2"]'); await p.waitForTimeout(2900); log.push(await S(p));                   // 3: right → item 3
    for (let k = 0; k < 2; k++) { const want = await p.evaluate(() => SORT.items[SORTS[Object.keys(SORTS)[0]].at].p); await p.click('[data-sen]'); await p.click(`[data-sp="${want}"]`); await p.waitForTimeout(2900); }
    await p.click('[data-sen]'); await p.waitForTimeout(100); const glow5 = (await S(p)).glow; await p.click('[data-sp="p1"]'); await p.waitForTimeout(150); log.push(await S(p));   // 4: item 5 wrong
    if (shots) await p.screenshot({path: path.join(shots, `sort-${tag}-wrong.png`)});
    for (let k = 0; k < 4; k++) { const want = await p.evaluate(() => SORT.items[SORTS[Object.keys(SORTS)[0]].at].p); if (k) await p.click('[data-sen]'); await p.click(`[data-sp="${want}"]`); await p.waitForTimeout(1100); }
    log.push(await S(p));                                                                                   // 5: done
    out[tag] = {log, glow5, sum: await p.evaluate(() => ({boxes: document.querySelectorAll('.sort-pats.sum .sp').length, lines: [...document.querySelectorAll('.sort-pats.sum .sp')].map(x => x.querySelectorAll('li').length).join(), bold: !!document.querySelector('.sort-pats.sum li b'), q: (document.querySelector('.se-q') || {}).textContent || '', go: document.getElementById('go').textContent, w: document.documentElement.scrollWidth, vw: innerWidth}))};
    const L = log, M = out[tag].sum;
    expect(tag + ': item 1 flies by itself', L[0].n === 1 && L[0].at === 1, L[0]);
    expect(tag + ': item 2 open, its box glows', L[1].open && L[1].glow === 'p2', L[1]);
    expect(tag + ': wrong box → why, the card stays', L[2].at === 1 && L[2].n === 1 && /тебе посоветовали/.test(L[2].wrong), L[2]);
    expect(tag + ': right box → item 3', L[3].at === 2 && L[3].n === 2 && !L[3].wrong, L[3]);
    expect(tag + ': item 5 (free): no glow; «Советую» brings the why line', glow5 === '' && L[4].at === 4 && /Посоветовал коллега/.test(L[4].wrong), [glow5, L[4]]);
    expect(tag + ': after item 8 the summary: 4 boxes × 2 lines, the question, Finish', L[5].done && M.boxes === 4 && M.lines === '2,2,2,2' && M.bold && /ни разу не стоит/.test(M.q) && /Finish/.test(M.go), M);
    expect(tag + ': no sideways scroll', M.w <= M.vw, M);
    if (shots) await p.screenshot({path: path.join(shots, `sort-${tag}-summary.png`)});
  }
  { const p = await open(400, 860, '#sort'); await p.click('#go'); await p.waitForTimeout(200);
    out.showAll = await p.evaluate(() => [document.querySelectorAll('.sort-pats.sum li').length, document.getElementById('go').textContent]);
    expect('"Show all the answers" → the summary at once', out.showAll[0] === 8 && /Finish/.test(out.showAll[1]), out.showAll); }
  { const p = await open(400, 860, '#rev');
    out.scene = await p.evaluate(() => [...document.querySelectorAll('.dlg p.scene')].map(x => x.textContent.trim() + (x.querySelector('.spk') ? '+spk' : '')).join('|'));
    expect('scene lines: grey date lines, no speaker', out.scene === 'Exchange 1|Exchange 2|Exchange 3', out.scene); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK sort'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
