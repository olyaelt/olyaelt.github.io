// tools 40 (AL chat's handoffs 13.11 20:45 §3c and 14.11 09:20): her rating page for the listening quizzes of 13.11 — a whole clip per card
// (several gap lines, a ▶ per line), the ▶ count before the answer, two more «why» labels, «🗑 Take it out of the homework» kept with her
// rating; on the 11.11 page the same 🗑 also takes the clip out of the published homework (sheet «Removed from homework»).
//   node tests/rate_1311_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{if(s===1)L.push(['pause',t]);s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=v=>{s=5;L.push(['cue',v.videoId||v])};this.unloadModule=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const J = n => JSON.parse(fs.readFileSync(path.join(site, '..', 'engine', 'tools', 'prep', n + '.json'), 'utf8'));
  const D = J('rate-2026-11-13'), D11 = J('rate-2026-11-11');
  const page = n => fs.readFileSync(path.join(site, 'tools/prep/' + n + '.html'), 'utf8').replace(/const LIVE_ON = false, LIVE_URL = "[^"]*";/, `const LIVE_ON = false, LIVE_URL = "${URL_}";`);
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  const b = await chromium.launch();
  const open = async (n, vp) => {
    const ctx = await b.newContext({viewport: vp || {width: 1280, height: 800}}), html = page(n);
    await ctx.addInitScript(c => { try{ localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', 'teacher'); }catch(e){} }, tc);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith(n + '.html')) return r.fulfill({status: 200, contentType: 'text/html', body: html});
      const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/tools/prep/' + n + '.html'); await p.waitForTimeout(900); return p; };
  // the data: 30 clips, 7 B2 · 7 C1 · 10 both · 6 for later; a clip in two quizzes is one card
  const later = D.cards.filter(c => c.quizzes.join() === 'later').length, both = D.cards.filter(c => c.groups.join() === 'B2,C1' && c.quizzes.join() !== 'later').length;
  ok(D.cards.length === 30 && D.cards.filter(c => c.groups.join() === 'B2').length === 7 && D.cards.filter(c => c.groups.join() === 'C1').length === 7 && both === 10 && later === 6, 'the cards');
  ok(new Set(D.cards.map(c => c.id)).size === 30 && D.cards.every(c => /^[a-h]\d+-/.test(c.id)), 'the card ids');
  const p = await open('rate-2026-11-13');
  // 1. the first card as a student meets it: the clip, the gaps empty, no answer, groups and quizzes hidden
  const c0 = D.cards[0], g0 = c0.rows.reduce((n, r) => n + (r.parts || []).filter(x => typeof x !== 'string').length, 0);
  let st = await p.evaluate(() => ({n: document.querySelector('#head .n').textContent, hid: /groups hidden/.test(document.getElementById('head').textContent), gaps: document.querySelectorAll('#body [data-guess]').length,
    ans: !!document.querySelector('#body .sub'), btn: document.querySelector('[data-play="line"]').textContent, out: !!document.querySelector('[data-out="1"]')}));
  ok(st.n === '1 of 30' && st.hid && st.gaps === g0 && !st.ans && st.btn === '▶ The clip' && st.out, 'the first card: ' + JSON.stringify(st));
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click('[data-play="line"]'); await p.waitForTimeout(Math.min(9000, (c0.play[1] - c0.play[0]) * 200 + 1500));
  let L = await p.evaluate(() => (window._yl || []).splice(0)), sk = L.find(x => x[0] === 'seek'), ps = L.find(x => x[0] === 'pause');
  ok(sk && Math.abs(sk[1] - c0.play[0]) < .01 && ps && ps[1] >= c0.play[1], 'the clip plays its range ' + JSON.stringify(c0.play) + ': ' + JSON.stringify(L));
  // a ▶ per line
  const ri = c0.rows.findIndex(r => r.me); await p.click(`[data-row="${ri}"]`); await p.waitForTimeout(300);
  L = await p.evaluate(() => (window._yl || []).splice(0)); ok(L.some(x => x[0] === 'seek' && Math.abs(x[1] - c0.rows[ri].at[0]) < .01), 'the line ▶: ' + JSON.stringify(L));
  // 2. a clip with three gaps in three lines (Beckham): what she heard, joined; the ▶ count before the answer
  const bi = D.cards.findIndex(c => c.id.startsWith('b5-')), bc = D.cards[bi];
  await p.evaluate(i => go(i), bi); await p.waitForTimeout(300);
  const ins = await p.$$('#body [data-guess]'); ok(ins.length === 3, 'Beckham: three gaps, ' + ins.length);
  await p.click('[data-play="line"]'); await p.waitForTimeout(200); await p.click('[data-play="line"]'); await p.waitForTimeout(200);
  const ans = bc.answer.split(' … '); for (let k = 0; k < ins.length; k++) await ins[k].fill(ans[k].toLowerCase());
  await p.click('[data-show]'); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({same: !!document.querySelector('.rt-ans .same'), plays: (document.querySelector('.rt-ans .rt-stat') || {}).textContent, whys: [...document.querySelectorAll('[data-why]')].map(b => b.dataset.why)}));
  ok(st.same && st.plays === '▶ 2× before the answer', 'what she heard and the ▶ count: ' + JSON.stringify(st));
  ok(st.whys.includes('a word in the gap is swallowed') && st.whys.includes('very reduced — find more like it for C1') && st.whys.length === 7, 'the why labels: ' + st.whys.join(' | '));
  if (shots) await p.screenshot({path: path.join(shots, 'rate1311_answer.png')});
  await p.click('[data-level="4"]'); await p.click('[data-why="a word in the gap is swallowed"]'); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({gr: (document.querySelector('#head .gr') || {}).textContent, q: document.querySelector('#head').textContent}));
  ok(st.gr === 'B2 · C1' && /C1 · Ben's phrases out there/.test(st.q) && /Ben, part 2/.test(st.q), 'rated: groups and quizzes shown: ' + JSON.stringify(st));
  // 3. 🗑 Take it out of the homework: one tap, the card marked, «why» chips; ↩ puts it back
  await p.click('[data-out="1"]'); await p.waitForTimeout(300);
  st = await p.evaluate(i => ({out: document.getElementById('card').classList.contains('is-out'), dot: document.querySelector(`[data-go="${i}"]`).className, back: !!document.querySelector('[data-out="0"]'), gw: document.querySelectorAll('#body [data-gwhy]').length}), bi);
  ok(st.out && /out/.test(st.dot) && st.back && st.gw === 5, '🗑 out: ' + JSON.stringify(st));
  await p.click('#body [data-gwhy="sound"]'); await p.waitForTimeout(1600);
  const R = env.sheets['My ratings'], rows = R.getRange(2, 1, R.getLastRow() - 1, 14).getValues(), r0 = rows.find(r => r[1] === bc.id), x0 = r0 && JSON.parse(r0[13]);
  ok(r0 && r0[0] === 'hw-2026-11-13' && r0[8] === 4 && /swallowed/.test(r0[9]) && /sound/.test(r0[11]) && x0.out === true && x0.plays === 2 && r0[3].includes('C1 · Ben'), 'sheet «My ratings»: ' + JSON.stringify(r0 && r0.slice(0, 13)));
  ok(!env.sheets['Removed from homework'] || env.sheets['Removed from homework'].getLastRow() < 2, 'a 13.11 clip is not on a homework page yet — nothing removed there');
  // after a reload on another device: from her table
  const q = await open('rate-2026-11-13'); await q.evaluate(() => localStorage.removeItem('rate-hw-2026-11-13')); await q.reload(); await q.waitForTimeout(1500);
  await q.evaluate(i => go(i), bi); await q.waitForTimeout(300);
  st = await q.evaluate(() => ({out: document.getElementById('card').classList.contains('is-out'), cnt: document.getElementById('cnt').textContent}));
  ok(st.out && /1 of 30/.test(st.cnt), 'from her table: ' + JSON.stringify(st));
  await q.click('[data-out="0"]'); await q.waitForTimeout(300); ok(!(await q.evaluate(() => document.getElementById('card').classList.contains('is-out'))), '↩ Put it back');
  // 📋
  await p.click('#copy'); const t = await p.evaluate(() => window._rtCopy || '');
  ok(t.includes('\t▶ before the answer\t') && t.includes('\tOUT\t') && t.includes(bc.id), '📋: ' + t.slice(0, 400));
  // 4. the 11.11 page: 🗑 takes the clip out of the published homework too, ↩ brings it back
  const o = await open('rate-2026-11-11'), c11 = D11.cards.find(c => c.items.B2 && c.items.C1 && c.kind === 'yt');
  await o.evaluate(id => go(D.cards.findIndex(c => c.id === id)), c11.id); await o.waitForTimeout(300);
  await o.click('[data-out="1"]'); await o.waitForTimeout(800);
  const RM = env.sheets['Removed from homework'], rm = RM ? RM.getRange(2, 1, RM.getLastRow() - 1, 4).getValues() : [];
  const want = ['hw-ge-b2-2026-11-11|' + c11.items.B2[0].replace(/\.g\d+$/, ''), 'hw-ge-c1-2026-11-11|' + c11.items.C1[0].replace(/\.g\d+$/, '')];
  ok(want.every(k => rm.some(r => r[0] === k && r[3] === true)), 'out of the published homework: ' + JSON.stringify(rm));
  await o.click('[data-out="0"]'); await o.waitForTimeout(800);
  const rm2 = env.sheets['Removed from homework'].getRange(2, 1, env.sheets['Removed from homework'].getLastRow() - 1, 4).getValues();
  ok(want.every(k => rm2.some(r => r[0] === k && r[3] === false)), 'back in the homework: ' + JSON.stringify(rm2));
  // 5. a phone
  const m = await open('rate-2026-11-13', {width: 390, height: 844});
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the phone scrolls sideways');
  if (shots) await m.screenshot({path: path.join(shots, 'rate1311_phone.png')});
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK rate 13.11 + take it out'); process.exit(fail.length ? 1 : 0);
})();
