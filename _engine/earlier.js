// Prints the revisitable steps (rewrite and say-it) of earlier lesson pages as JSON:
//   node earlier.js lessons/b2-2026-10-23/content.js [more…]   (a built page works too: its LESSON CONTENT block is used)
// The lesson content is run in a sandbox; data placeholders are stubbed.
const fs = require('fs'), vm = require('vm');
const out = [];
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const a = src.indexOf('LESSON CONTENT: START'), b = src.indexOf('/* ===== LESSON CONTENT: END');
  let code;
  if (/\.js$/.test(file)) code = src;
  else { if (a < 0 || b < 0) continue; code = src.slice(src.indexOf('\n', a) + 1, b); }
  /* a stand-in for the data files: any property, call or loop on it just gives an empty value */
  const deep = () => new Proxy(function () {}, { get: (o, k) => k === Symbol.toPrimitive ? () => '' : k === Symbol.iterator ? function* () {} : k === 'length' ? 0 : deep(), apply: () => deep() });
  const stub = deep();
  const ctx = { console };
  for (const m of code.matchAll(/__([A-Z][A-Z0-9_]*)__/g)) ctx['__' + m[1] + '__'] = stub;
  code += '\n;this.__out = {date: LESSON.date, tasks: TASKS};';
  try { vm.createContext(ctx); vm.runInContext(code, ctx, { timeout: 2000 }); } catch (e) { console.error('skip', file, e.message); continue; }
  const items = [];
  for (const t of ctx.__out.tasks) for (const st of (t.steps || [])) {
    if (st.type === 'rewrite' && st.r && st.r.a) items.push({ type: 'rewrite', r: st.r });
    if (st.type === 'sayit' && st.s && st.s.rows) for (const row of st.s.rows) items.push({ type: 'sayit', s: { rows: [row], note: '', html: !!st.s.html }, ...(st.instr ? { instr: st.instr } : {}) });
  }
  out.push({ file, date: ctx.__out.date, items: JSON.parse(JSON.stringify(items)) });
}
process.stdout.write(JSON.stringify(out));
