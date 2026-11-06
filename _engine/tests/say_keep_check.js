// tools 30 also (her 6.11 17:40, C1 «на экранах с ответами пропадает вопрос. Нужно оставлять вопрос тоже»): a `say` answer that shares
// no line with the task comes under the task, which stays; a filled-in answer (it repeats some task lines) still takes the task's place.
// The screens with a separate answer fit 1280×720 with the answer open.
//   node tests/say_keep_check.js SITE_DIR [shots]
const {chromium} = require('playwright'); const path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const pages = ['c1-2026-11-06/has-it-changed', 'c1-2026-11-04/practical-things', 'de-krabbelgruppe/krabbelgruppe', 'b2-2026-10-30/f-pp'];
  const b = await chromium.launch();
  for (const vp of [{width: 1280, height: 720}, {width: 390, height: 844}]) for (const pg of pages) {
    const p = await (await b.newContext({viewport: vp})).newPage(); p.on('pageerror', e => errs.push(pg + ': ' + e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto('file://' + path.join(site, 'tools/' + pg + '.html')); await p.waitForTimeout(300);
    const list = await p.evaluate(() => { const r = []; D.stages.forEach((s, si) => s.blocks.forEach((b, bi) => { if (b.kind === 'say' && b.answer && !b.one) r.push([si, bi, !b.answer.some(l => b.task.includes(l))]); })); return r; });
    for (const [si, bi, sep] of list) {
      await p.evaluate(([si, bi]) => { goStage(si, false); S.intro = false; goBlock(si, bi); }, [si, bi]); await p.waitForTimeout(150);
      await p.click('#main [data-sayshow]'); await p.waitForTimeout(250);
      const r = await p.evaluate(() => { const b = curBlock(), txt = document.querySelector('#main .say-lines').innerText.replace(/\s+/g, ' ');
        const plain = s => String(s).replace(/\(\([^)]*\)\)/g, ' ').replace(/[*~_]|<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const nav = document.querySelector('#go') || document.querySelector('.nav'), bot = Math.max(...[...document.querySelectorAll('#main .say-lines, #main .selfcheck, #go')].map(e => e.getBoundingClientRect().bottom));
        return {task: b.task.map(plain).filter(t => t && !txt.includes(t)), ans: b.answer.map(plain).filter(t => t && !txt.includes(t)), title: b.answer_title ? txt.toLowerCase().includes(b.answer_title.toLowerCase()) : null, bottom: Math.round(bot)}; });
      const k = `${vp.width} ${pg} ${si}.${bi}`;
      if (sep) { expect(`${k}: the task stays`, r.task.length === 0, r.task); expect(`${k}: the answer under it`, r.ans.length === 0 && r.title !== false, r); }
      else expect(`${k}: filled-in answer shown as before`, r.ans.length === 0, r.ans);
      if (vp.width === 1280 && /c1-2026-11-06/.test(pg)) expect(`${k}: fits 1280×720 with the answer open`, r.bottom <= 720, r.bottom);
      if (shots && sep && /c1-2026-11-06/.test(pg)) await p.screenshot({path: path.join(shots, `say_keep_${vp.width}_${si}_${bi}.png`)});
      out[k] = r.bottom; }
    await p.context().close(); }
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK say keeps the question'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
