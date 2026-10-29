// Engine 40: each gap of a listening clip can be checked on its own ("Check" after the gap, or Enter in it), as in TubeQuizard
// (a C1 student: with two gaps in a clip, Check answers opened both at once, so she couldn't guess, check and go on).
//   node tests/listen_gap_check.js ../c1/2026-10-28.html [shots_dir]   (a page whose first listening step has 2+ gaps)
// Checks: "Check" hidden until something is typed; it judges only its gap (the other stays a field) and doesn't play the line;
// Enter does the same and moves on to the next gap; the last gap checked one by one = the step is checked (Next, the after-line,
// bookmarks on the gap lines); Check answers after one ✓ opens only the rest (an empty gap shows the answer).
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
const OK = `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const file = path.resolve(process.argv[2]); const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  const expect = (name, ok, got) => { if (!ok) fail.push(name + ' ' + JSON.stringify(got)); };
  async function run(name, fn){
    const ctx = await b.newContext({...devices['iPhone 13']});
    await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: OK}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.goto('file://' + file); await p.waitForTimeout(400);
    const info = await p.evaluate(() => { const t = TASKS.find(t => t.steps && t.steps.some(s => s.type === 'listen'));
      const st = t && t.steps[0]; return {id: t && t.id, first: st && st.type, gaps: st && st.clip ? st.clip.flatMap(l => l[3].filter(x => typeof x !== 'string').map(x => x.gap)) : []}; });
    out.info = info;
    if (info.first !== 'listen' || info.gaps.length < 2) { fail.push('the first listening step needs 2+ gaps: ' + JSON.stringify(info)); await ctx.close(); return; }
    await p.click(`[data-open="${info.id}"]`); await p.waitForTimeout(600);
    const look = () => p.evaluate(() => ({inputs: document.querySelectorAll('.gap-in').length, cks: [...document.querySelectorAll('.gap-ck')].map(x => !x.hidden),
      ok: document.querySelectorAll('.gap-res.ok').length, no: document.querySelectorAll('.gap-res.no').length, ans: document.querySelectorAll('.gap-res.ans').length,
      fb: document.querySelectorAll('.gap-fb').length, go: document.getElementById('go').textContent, after: !document.getElementById('after').hidden,
      playing: document.querySelectorAll('.ln.playing').length, rev: document.querySelectorAll('.ln.has-gap .rev').length, focus: document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null}));
    try { await fn(p, info, look); } catch (e) { fail.push(name + ': ' + e.message); }
    if (shots) await p.screenshot({path: path.join(shots, name + '.png'), fullPage: true});
    await ctx.close();
  }
  await run('one-by-one', async (p, info, look) => {
    const n = info.gaps.length; let v = await look(); out.start = v;
    expect('start: fields, ✓ hidden, Check answers', v.inputs === n && v.cks.every(x => !x) && /Check answers/.test(v.go), v);
    await p.fill('.gap-in[data-k="0"]', 'something else'); v = await look(); expect('typing shows its ✓ only', v.cks[0] && !v.cks.slice(1).some(Boolean), v);
    await p.click('.gap-ck[data-k="0"]'); await p.waitForTimeout(150); v = await look(); out.afterFirst = v;
    expect('✓ judges only its gap, no play', v.inputs === n - 1 && v.no === 1 && v.ans === 1 && v.fb === 1 && !v.after && /Check answers/.test(v.go) && v.playing === 0, v);
    for (let k = 1; k < n; k++) { await p.fill(`.gap-in[data-k="${k}"]`, info.gaps[k]); await p.press(`.gap-in[data-k="${k}"]`, 'Enter'); await p.waitForTimeout(150);
      v = await look(); if (k < n - 1) expect('Enter moves to the next gap', v.focus === String(k + 1), v); }
    out.allDone = v;
    expect('all checked one by one = the step is checked', v.inputs === 0 && v.ok === n - 1 && v.no === 1 && v.after && /Next|Finish/.test(v.go) && v.rev > 0, v);
  });
  await run('then-check-answers', async (p, info, look) => {
    const n = info.gaps.length;
    await p.fill('.gap-in[data-k="0"]', info.gaps[0]); await p.click('.gap-ck[data-k="0"]'); await p.waitForTimeout(150);
    await p.click('#go'); await p.waitForTimeout(150); const v = await look(); out.thenCheck = v;
    expect('Check answers opens only the rest', v.inputs === 0 && v.ok === 1 && v.ans === n - 1 && v.no === 0 && v.after && /Next|Finish/.test(v.go), v);
  });
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen gaps'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
