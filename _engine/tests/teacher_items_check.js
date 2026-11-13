// engine 82 (her 13.11 14:38: «это отображается как вопрос от студента — так и должно быть?»): in her view a 🎬 / 🎧 task's own record
// (order, file, totals) is one line «Words caught» on top, not a card with a form, and not «to answer»; a «?» line or a question has a reply
// field without ✓ Good / ✗ Change / ✎ Correction / 💬 Comment; a «?» without a note opens it on «💬 Reply», ✓ Discussed at hand.
//   node tests/teacher_items_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch(), p = await (await b.newContext({viewport: {width: 1280, height: 900}})).newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, 'b2/2026-11-11.html')); await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const fid = TASKS.find(t => t.film).id, yid = TASKS.find(t => t.steps && t.steps.some(s => s.clip)).id;
    teacherData = {students: [{name: 'Petr Sk'}, {name: 'Julia Ch'}, {name: 'Mila K'}], done: {}, reactions: {}, discussed: {},
      work: [{id: 1, s: 0, task: fid, type: 'text', sent: '13.11 12:13', text: '🎬 The Intern · order: t2 t3 · file: x.mp4\nTotal: 28/34 words (82%), listening freely · each line: sheet Attempts'},
             {id: 2, s: 1, task: yid, type: 'marked', sent: '13.11 11:40', text: "That's all there is to it.\nhttps://youtu.be/x?t=3"},
             {id: 3, s: 2, task: yid, type: 'marked', sent: '13.11 11:45', text: "That's all there is to it.\n— is it 'to it'?\nhttps://youtu.be/x?t=3"},
             {id: 4, s: 2, task: yid, type: 'question', sent: '13.11 11:50', text: 'Why "there is" here?'},
             {id: 5, s: 1, task: fid, type: 'text', sent: '13.11 12:20', text: '🎬 The Intern · order: t2 t3 · file: x.mp4\nTotal: 30/34 words (88%), listening freely · each line: sheet Attempts'}]};
    const c = {f: teacherCounts(fid), y: teacherCounts(yid)};
    renderTeacherTask(fid);
    const f = {cards: document.querySelectorAll('.t-item').length, caught: (([...document.querySelectorAll('.t-panel p')].find(x => /Words caught/.test(x.textContent)) || {}).textContent || '')};
    return {fid, yid, c, f}; });
  ok(r.f.cards === 0 && /Words caught: Petr Sk 28\/34 \(82%\) · Julia Ch 30\/34 \(88%\)/.test(r.f.caught), 'the film record: ' + JSON.stringify(r.f));
  ok(r.c.f.work === 0 && r.c.f.open === 0, 'the film record counts as work to answer: ' + JSON.stringify(r.c.f));
  ok(r.c.y.open === 2, 'the «?» with a note and the question are to answer, the bare «?» not: ' + JSON.stringify(r.c.y));
  if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, 'teacher_film.png'), clip: {x: 0, y: 0, width: 1280, height: 330}}); }
  await p.evaluate(id => renderTeacherTask(id), r.yid); await p.waitForTimeout(200);
  const y = await p.evaluate(() => [...document.querySelectorAll('.t-item')].map(c => ({w: c.dataset.w, tools: c.querySelectorAll('[data-wrap],[data-mark]').length, copy: !!c.querySelector('[data-copy]'),
    open: !c.querySelector('.t-fb').hidden, reply: !!c.querySelector('[data-reply]'), disc: c.querySelectorAll('.t-discslot').length, ph: (c.querySelector('.t-ta') || {}).placeholder})));
  const g = id => y.find(x => x.w === String(id)) || {};
  ok(/^Reply to a «\?» or a question/.test(await p.textContent('.instr')), 'the instruction for marks and questions: ' + await p.textContent('.instr'));
  ok(g(2).tools === 0 && !g(2).open && g(2).reply && g(2).disc === 1 && g(2).copy, 'a bare «?»: folded on 💬 Reply, Discussed at hand: ' + JSON.stringify(g(2)));
  ok(g(3).tools === 0 && g(3).open && !g(3).reply && g(3).disc === 1 && /Your answer/.test(g(3).ph), 'a «?» with a note: a plain reply field: ' + JSON.stringify(g(3)));
  ok(g(4).tools === 0 && g(4).open && g(4).disc === 1, 'a question: a plain reply field: ' + JSON.stringify(g(4)));
  if (shots) await p.screenshot({path: path.join(shots, 'teacher_marks.png'), fullPage: true});
  await p.click('.t-item[data-w="2"] [data-reply]'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => { const c = document.querySelector('.t-item[data-w="2"]'); return !c.querySelector('.t-fb').hidden && document.activeElement === c.querySelector('.t-ta') && !c.querySelector('[data-reply]'); }), '💬 Reply does not open the field');
  // a student's text keeps the marking tools
  await p.evaluate(() => { teacherData.work.push({id: 6, s: 0, task: TASKS.find(t => t.film).id, type: 'text', sent: '13.11', text: 'There is a man everyone loves.'}); renderTeacherTask(TASKS.find(t => t.film).id); });
  ok(await p.evaluate(() => document.querySelectorAll('.t-item').length === 1 && document.querySelectorAll('.t-item [data-wrap],.t-item [data-mark]').length === 4), 'a student\'s text lost the marking tools');
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK her view: task records as one line, «?» and questions with a plain reply'); process.exit(fail.length ? 1 : 0);
})();
