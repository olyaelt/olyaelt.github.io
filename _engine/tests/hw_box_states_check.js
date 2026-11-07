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
    await go('e1', 0);
    const g0 = await p.evaluate(() => ({box: !!document.querySelector('aside.box'), n: document.querySelectorAll('aside.box .bgap').length, t: document.querySelector('aside.box .bgap').textContent}));
    expect(`${vp.width} gapped: the box is there before Check, forms hidden`, g0.box && g0.n >= 15 && /…/.test(g0.t), g0);
    await p.click('aside.box .bgap >> nth=0'); const t1 = await p.evaluate(() => document.querySelector('aside.box .bgap').textContent);
    await p.click('aside.box .bgap >> nth=0'); const t2 = await p.evaluate(() => document.querySelector('aside.box .bgap').textContent);
    expect(`${vp.width} gapped: tap → the form, tap again → the letters`, t1 === 'greener' && t2 === g0.t, [t1, t2]);
    // folded: a thin bar, Peek → the gapped box; the next visit opens folded again
    await go('e1', 4);
    const f0 = await p.evaluate(() => ({bar: !!document.querySelector('[data-peek]'), h: Math.round(document.querySelector('[data-peek]').getBoundingClientRect().height), box: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} folded: one thin bar, no phrases`, f0.bar && f0.h <= 60 && f0.box === 0, f0);
    await p.click('[data-peek]'); await p.waitForTimeout(200);
    const f1 = await p.evaluate(() => ({bar: !!document.querySelector('[data-peek]'), n: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} Peek → the gapped box`, !f1.bar && f1.n >= 15, f1);
    // a rewrite with a picture and the gapped box before Check
    await go('e3', 0);
    const r = await p.evaluate(() => ({pic: !!document.querySelector('.panel .step-pic img'), alt: document.querySelector('.panel .step-pic img').alt.slice(0, 20), input: !!document.getElementById('rw'), box: document.querySelectorAll('aside.box .bgap').length}));
    expect(`${vp.width} rewrite: picture above, the box beside`, r.pic && r.alt && r.input && r.box > 10, r);
    // read-only: no gaps, the button says Next
    await go('e3', 3);
    const rd = await p.evaluate(() => ({gaps: document.querySelectorAll('.panel .chunk').length, btn: document.getElementById('go').textContent.trim(), bold: document.querySelectorAll('.dlg.read b.given').length}));
    expect(`${vp.width} read: no gaps, Next, the chunks bold`, rd.gaps === 0 && /Next|Finish/.test(rd.btn) && rd.bold >= 5, rd);
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
