// engine 63 also (C1 6.11 TZ, her 07.11 07:56): a homework step's box "gapped" (the forms hidden behind first letters, a tap opens one) or
// "folded" (a thin bar «Stuck? Peek ▸» → the gapped box), beside the step from the start; a read-only dlg ("read": no gaps, the button
// says Next); a picture above a rewrite; a dlg chunk runs on through commas when the page says JOIN_PUNCT; the dlg's source line.
//   node tests/hw_box_states_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch();
  for (const vp of [{width: 400, height: 860}, {width: 1280, height: 720}]) {
    const p = await (await b.newContext({viewport: vp})).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(site, 'c1/2026-11-06.html')); await p.waitForTimeout(400);
    const go = async (id, k) => { await p.evaluate(([id, k]) => { current = TASKS.find(t => t.id === id); stepIdx = k; checked = false; renderTask(); }, [id, k]); await p.waitForTimeout(200); };
    // gapped: the box from the start, its forms hidden, a tap opens one, a second tap hides it
    await go('e1', 1);   /* fixes-1: step 0 is the box as a gap text; step 1 «your turn» has the gapped box */
    const g0 = await p.evaluate(() => ({box: !!document.querySelector('aside.box'), n: document.querySelectorAll('aside.box .bgap').length, t: document.querySelector('aside.box .bgap').textContent}));
    expect(`${vp.width} gapped: the box is there before Check, forms hidden`, g0.box && g0.n >= 15 && /…/.test(g0.t), g0);
    // her 07.11 13:52: beside the pictures no fork — the red pattern once, the words in runs with commas, the Russian beside each
    const pat = await p.evaluate(() => ({stems: document.querySelectorAll('aside.box p.stem b.pat').length, forks: document.querySelectorAll('aside.box .fork').length,
      inRuns: document.querySelectorAll('aside.box p.run .bgap').length, ru: [...document.querySelectorAll('aside.box p.run .ru')].filter(r => getComputedStyle(r).display === 'inline').length}));
    expect(`${vp.width} e1 side box: three red patterns, the words in comma runs, the Russian beside them, no fork`, pat.stems === 3 && pat.forks === 0 && pat.inRuns >= 14 && pat.ru >= 14, pat);
    if (vp.width === 1280) { const fit = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom) <= innerHeight); expect('1280×720: the whole box on the screen', fit, fit); }
    await p.click('aside.box .bgap >> nth=0'); const t1 = await p.evaluate(() => document.querySelector('aside.box .bgap').textContent);
    await p.click('aside.box .bgap >> nth=0'); const t2 = await p.evaluate(() => document.querySelector('aside.box .bgap').textContent);
    expect(`${vp.width} gapped: tap → the form, tap again → the letters`, t1 === 'greener' && t2 === g0.t, [t1, t2]);
    // folded: a thin bar, Peek → the gapped box; the next visit opens folded again
    await go('e1', 9);
    const f0 = await p.evaluate(() => ({bar: !!document.querySelector('[data-peek]'), h: Math.round(document.querySelector('[data-peek]').getBoundingClientRect().height), box: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} folded: one thin bar, no phrases`, f0.bar && f0.h <= 60 && f0.box === 0, f0);
    await p.click('[data-peek]'); await p.waitForTimeout(200);
    const f1 = await p.evaluate(() => ({bar: !!document.querySelector('[data-peek]'), n: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} Peek → the gapped box`, !f1.bar && f1.n >= 15, f1);
    // her 07.11 13:06–13:18: e2 and e3 — go through the box first (the box as the task), then it hangs open beside the first half,
    // halfway they go through it once more, and from then on it stays folded (only Peek)
    for (const [id, half] of [['e2', 3], ['e3', 9]]) {
      await go(id, 0); const t0 = await p.evaluate(() => ({task: document.querySelectorAll('.box-task .bgap').length, instr: (document.querySelector('.instr') || {}).textContent || ''}));
      expect(`${vp.width} ${id} 1st: go through the box`, t0.task >= 6 && /Before you start/.test(t0.instr), t0);
      await go(id, 1); const o = await p.evaluate(() => ({box: !!document.querySelector('.stage aside.box:not(.box-folded)'), bgap: document.querySelectorAll('aside.box .bgap').length, b: document.querySelectorAll('aside.box b').length}));
      expect(`${vp.width} ${id} first half: the open box`, o.box && o.bgap === 0 && o.b > 5, o);
      await go(id, half); const t1 = await p.evaluate(() => ({task: document.querySelectorAll('.box-task .bgap').length, instr: (document.querySelector('.instr') || {}).textContent || ''}));
      expect(`${vp.width} ${id} halfway: go through it once more`, t1.task >= 6 && /Halfway/.test(t1.instr), t1);
      await go(id, half + 1); const f = await p.evaluate(() => ({bar: !!document.querySelector('[data-peek]'), bgap: document.querySelectorAll('aside.box .bgap').length}));
      expect(`${vp.width} ${id} second half: folded`, f.bar && f.bgap === 0, f);
    }
    // the minute before the text: no answer, an hourglass, Next
    await go('e1', 1); const th = await p.evaluate(() => ({hg: !!document.querySelector('.hourglass'), ans: document.querySelectorAll('.reveal').length, btn: document.getElementById('go').textContent.trim(), instr: !!document.querySelector('.pic-row .pic-instr'), digits: /\d/.test(document.querySelector('.hourglass').textContent), svg: !!document.querySelector('.hourglass svg'), seen: document.getElementById('go').getBoundingClientRect().bottom <= innerHeight}));
    expect(`${vp.width} e1 your turn: the sand hourglass (no numbers), no answer, Next on the screen, instruction in the card`, th.hg && th.svg && !th.digits && th.ans === 0 && th.btn === 'Next' && th.instr && th.seen, th);
    // the box as the task: forms hidden, Show the answers opens them all
    await go('e1', 0); const bt = await p.evaluate(() => document.querySelectorAll('.box-task .bgap').length);
    const st = await p.evaluate(() => { const s = document.querySelector('.box-task .box .sticker'); return !!s && getComputedStyle(s).display !== 'none'; });
    const fk = await p.evaluate(() => ({forks: document.querySelectorAll('.box-task .fork .fork-stem.pat').length, inList: document.querySelectorAll('.box-task .fork-list .bgap').length,
      line: getComputedStyle(document.querySelector('.box-task .fork-list')).borderLeftStyle}));
    expect(`${vp.width} e1 box task: the collocation fork (three stems, a line, the words in the lists)`, fk.forks === 3 && fk.inList >= 15 && fk.line === 'solid', fk);
    expect(`${vp.width} e1 box task: it says Useful language`, st, st);
    if (vp.width === 1280) { const bb = await p.evaluate(() => Math.round(document.querySelector('.box-task .box').getBoundingClientRect().bottom) <= document.getElementById('go').getBoundingClientRect().top); expect('1280×720: the box task whole above the buttons', bb, bb); }
    await p.click('#go'); await p.waitForTimeout(150); const bo = await p.evaluate(() => [...document.querySelectorAll('.box-task .bgap')].every(g => g.classList.contains('open')));
    expect(`${vp.width} e1 box task: hidden forms, Show the answers opens all`, bt >= 15 && bo, [bt, bo]);
    // a rewrite with a picture; second half of e3: folded, Peek → the gapped box
    await go('e3', 10); await p.click('[data-peek]'); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({pic: !!document.querySelector('.panel .step-pic img'), alt: document.querySelector('.panel .step-pic img').alt.slice(0, 20), input: !!document.getElementById('rw'), box: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} rewrite: picture above, the box beside`, r.pic && r.alt && r.input && r.box > 10, r);
    // read-only: no gaps, the button says Next
    await go('e3', 4);
    const rd = await p.evaluate(() => ({gaps: document.querySelectorAll('.panel .chunk').length, btn: document.getElementById('go').textContent.trim(), bold: document.querySelectorAll('.dlg.read b.given').length}));
    expect(`${vp.width} read: no gaps, Next, the chunks bold`, rd.gaps === 0 && /Next|Finish/.test(rd.btn) && rd.bold >= 5, rd);
    // r1: the speakers' photos beside their lines, none beside the interviewer
    await go('r1', 0);
    const ph = await p.evaluate(() => [...document.querySelectorAll('.panel .dlg p')].map(x => (x.querySelector('.spk') || {}).textContent + (x.querySelector('img.lph') ? '📷' : '')));
    expect(`${vp.width} r1: photo beside the speaker, not the interviewer`, ph.some(x => /Stratford.*📷/.test(x)) && !ph.some(x => /Interviewer.*📷/.test(x)), ph);
    // r1: «Yes, it has, actually» is one chunk; the source line
    await go('r1', 0);
    const c = await p.evaluate(() => ({first: document.querySelector('.panel .dlg .chunk').textContent, credit: (document.querySelector('.panel .credit') || {}).textContent || ''}));
    expect(`${vp.width} r1: one chunk through the commas`, /^Y.*es, i.*t h.*as, a.*ctually$/.test(c.first), c.first);
    expect(`${vp.width} r1: the source`, /Empower C1/.test(c.credit), c.credit);
    out[vp.width] = {g0, f0, r, rd};
    await p.context().close(); }
  // an older page: chunks don't run on through commas there
  const p = await (await b.newContext()).newPage(); await p.goto('file://' + path.join(site, 'b2/2026-10-16.html')); await p.waitForTimeout(300);
  out.old = await p.evaluate(() => typeof JOINP !== 'undefined' ? JOINP : 'none'); expect('older pages: no comma joining', out.old === false, out.old);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK homework box states'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
