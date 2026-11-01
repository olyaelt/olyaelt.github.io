// tools 19 (her test 31.10 22:38 / 22:45): on a lesson page (no Jeopardy board) a stage entered forward opens at its start, fresh —
// Next at the end of the stage before or its button on top; gaps closed, cards from the first. What they wrote stays. Back from a
// stage's first screen goes straight to the last screen of the stage before, as it was left. A reload comes back to the same screen.
// A Jeopardy field keeps each stage's place. Speaking tasks show no "**1**" number (the dots say where you are).
//   node tests/stage_flow_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const LESSON = 'tools/c1-2026-11-04/practical-things', FIELD = 'tools/b2-2026-10-30/f-clocks';
(async () => {
  const site = path.resolve(process.argv[2]);
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}}); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.emulateMedia({reducedMotion: 'reduce'});
  const where = () => p.evaluate(() => { const blk = curBlock(); const st = blk ? bs(blk) : null;
    return {stage: S.stage, intro: S.intro, i: bIdx(), kind: blk && blk.kind, open: st && st.open ? st.open.size : 0, shown: !!(st && st.shown), deck: st && st.deck ? st.deck.hist.length : 0}; });
  const next = async () => { await p.click('[data-step]'); await p.waitForTimeout(120); };
  const back = async () => { await p.click('[data-back]'); await p.waitForTimeout(120); };
  const pill = async i => { await p.click(`.stages [data-stage="${i}"]`); await p.waitForTimeout(120); };
  await p.goto(base + LESSON + '.html'); await p.waitForTimeout(300);
  out.flow = await p.evaluate(() => FLOW);
  expect('a lesson page is FLOW', out.flow === true, out.flow);
  /* stage 2 (Make it perfect): the box from memory, open its gaps, then the next screen */
  await pill(1); await next(); let w = await where(); out.s1first = w;
  expect('its button → the cloud → Next → its first screen', w.stage === 1 && !w.intro && w.i === 0, w);
  await next(); w = await where(); out.s1opened = w;
  expect('Next opens the gaps of the box', w.i === 0 && w.open > 0, w);
  await next(); w = await where(); out.s1second = w;
  expect('then the second screen', w.stage === 1 && w.i === 1, w);
  /* another stage, then back in by its button: from the start, fresh */
  await pill(2); await pill(1); await next(); w = await where(); out.s1again = w;
  expect('back in by its button: the first screen, gaps closed', w.stage === 1 && w.i === 0 && w.open === 0, w);
  /* Back from the first screen → the last screen of the stage before, not this stage's cloud */
  await back(); w = await where(); out.backPrev = w;
  const lastOf0 = await p.evaluate(() => D.stages[0].blocks.length - 1);
  expect('Back from a first screen → the last screen of the stage before', w.stage === 0 && !w.intro && w.i === lastOf0, {w, lastOf0});
  /* Next at the end of a stage: the next stage from its start, fresh */
  await pill(1); await next(); await next(); await next(); w = await where();   /* stage 2, second screen, the box's gaps open */
  await p.evaluate(() => { S.at[1] = D.stages[1].blocks.length - 1; render(); }); w = await where();
  await p.evaluate(() => stepOn()); await p.waitForTimeout(100); w = await where();
  expect('Next at the last screen → the next stage\'s cloud', w.stage === 2 && w.intro, w);
  await back(); w = await where();
  expect('Back from that cloud → the last screen of the stage before', w.stage === 1 && w.i === await p.evaluate(() => D.stages[1].blocks.length - 1), w);
  await pill(2); await pill(1); await next(); w = await where(); out.freshAfterEnd = w;   /* its own button while in it doesn't reset it (a slip mustn't cost the stage) */
  expect('stage 2 entered again: from the start, gaps closed', w.stage === 1 && w.i === 0 && w.open === 0, w);
  /* a reload comes back to the same screen, with what was done */
  await next(); await next(); w = await where(); const before = w;
  await p.reload(); await p.waitForTimeout(400); w = await where(); out.reload = {before, after: w};
  expect('a reload: the same screen, as it was', w.stage === before.stage && w.i === before.i && w.intro === before.intro, out.reload);
  /* no "**1**" in front of a speaking task */
  const q = await p.evaluate(() => { const si = D.stages.findIndex(s => s.blocks.some(x => x.kind === 'questions' && x.items.some(t => /^\*\*\d/.test(String(t.t || t)))));
    if (si < 0) return null; S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = D.stages[si].blocks.findIndex(x => x.kind === 'questions'); render();
    return (document.querySelector('.speak-task') || {}).textContent || ''; });
  out.speak = q;
  expect('a speaking task without its number', q && !/^\s*\d/.test(q), q);
  /* a Jeopardy field keeps each stage's place */
  await p.goto(base + FIELD + '.html'); await p.waitForTimeout(300);
  const f = await p.evaluate(() => ({flow: FLOW, n: D.stages.length, len: D.stages.map(s => s.blocks.length)}));
  out.field = f;
  expect('a Jeopardy field is not FLOW', f.flow === false, f);
  const two = f.len.findIndex(n => n > 1);
  if (two > -1 && f.n > 1) {
    await p.evaluate(k => { S.stage = k; S.intro = false; S.view = 'field'; S.at[k] = 1; render(); }, two);
    const other = two === 0 ? 1 : 0; await pill(other); await pill(two); await next(); w = await where();
    expect('field: back in by its button → where it was', w.stage === two && w.i === 1, w);
  }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK stage flow'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
