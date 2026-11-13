// tools 38 (the AL chat's handoff 12.11 23:55): her page to rate the homework's lines. Her code only; each line first as a student meets
// it (the clip as on the homework page, an empty gap), then the answer and how hard it is; groups hidden until she rates; every tap kept on
// the device and in her table (sheet «My ratings», with the line's Attempts items); the lines she took out, folded, with «why»; 📋 a copy.
//   node tests/rate_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;const L=(window._yl=window._yl||[]);
 this.seekTo=x=>{t=x;L.push(['seek',x])};this.playVideo=()=>{s=1};this.pauseVideo=()=>{if(s===1)L.push(['pause',t]);s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=v=>{s=5;L.push(['cue',v.videoId||v])};this.unloadModule=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const D = JSON.parse(fs.readFileSync(path.join(site, '..', 'engine', 'tools', 'prep', 'rate-2026-11-11.json'), 'utf8'));
  let html = fs.readFileSync(path.join(site, 'tools/prep/rate-2026-11-11.html'), 'utf8');
  ok(/LIVE_URL = "https:\/\/script\.google\.com/.test(html), 'the plain page does not talk to her table');
  html = html.replace(/const LIVE_ON = false, LIVE_URL = "[^"]*";/, `const LIVE_ON = false, LIVE_URL = "${URL_}";`);
  const env = makeEnv(); env.ctx.setUp(); const tc = env.sheets.Students.get(2, 1);
  env.sheets.Students.getRange(3, 1, 1, 3).setValues([['s1', 'Mila', 'B2']]);
  const b = await chromium.launch();
  const open = async (code, teacher, vp) => {
    const ctx = await b.newContext({viewport: vp || {width: 1280, height: 800}});
    await ctx.addInitScript(([c, t]) => { try{ if (c) localStorage.setItem('hw-code', c); localStorage.setItem('hw-role', t ? 'teacher' : ''); }catch(e){} }, [code, teacher]);
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
    await ctx.route('https://hw.test/**', r => { const u = new URL(r.request().url()).pathname; if (u.endsWith('rate-2026-11-11.html')) return r.fulfill({status: 200, contentType: 'text/html', body: html});
      const f = path.join(site, decodeURIComponent(u)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('https://hw.test/tools/prep/rate-2026-11-11.html'); await p.waitForTimeout(900); return p; };
  // 1. a student / no code: closed
  const s = await open('s1', false); ok(/This page is for Olya/.test(await s.textContent('body')), 'a student sees the page');
  // 2. her code
  const p = await open(tc, true);
  ok(D.cards.length === 55 && D.removed.length === 5, 'cards: ' + D.cards.length + ', removed: ' + D.removed.length);
  const c0 = D.cards[0];
  let st = await p.evaluate(() => ({n: document.querySelector('#head .n').textContent, hid: /groups hidden/.test(document.getElementById('head').textContent), gaps: document.querySelectorAll('#body [data-guess]').length,
    ans: !!document.querySelector('#body .sub'), show: !!document.querySelector('[data-show]'), level: !!document.querySelector('[data-level]'), cnt: document.getElementById('cnt').textContent}));
  ok(st.n === '1 of 55' && st.hid && st.gaps >= 1 && !st.ans && st.show && !st.level && /0 of 55/.test(st.cnt), 'the first card, as a student meets it: ' + JSON.stringify(st));
  if (shots) await p.screenshot({path: path.join(shots, 'rate_1.png')});
  // ▶ the line: the clip as on the homework page
  if (c0.kind === 'yt') { await p.evaluate(() => (window._yl || []).splice(0)); await p.click('[data-play="line"]'); await p.waitForTimeout(1600);
    const L = await p.evaluate(() => (window._yl || []).splice(0)), sk = L.find(x => x[0] === 'seek'), ps = L.find(x => x[0] === 'pause');
    ok(sk && Math.abs(sk[1] - c0.play[0]) < .01 && ps && ps[1] >= c0.play[1] && ps[1] < c0.play[1] + .6, 'the line plays its homework range ' + JSON.stringify(c0.play) + ': ' + JSON.stringify(L)); }
  await p.fill('#body [data-guess]', 'there is'); await p.click('[data-show]'); await p.waitForTimeout(300);
  st = await p.evaluate(() => ({you: (document.querySelector('.rt-ans .you') || {}).textContent, sub: (document.querySelector('.rt-ans .sub') || {}).textContent, level: document.querySelectorAll('[data-level]').length}));
  ok(st.you === 'there is' && st.sub === c0.answer && st.level === 5, 'the answer next to what she heard: ' + JSON.stringify(st));
  if (shots) await p.screenshot({path: path.join(shots, 'rate_2.png')});
  await p.click('[data-level="4"]'); await p.click('[data-why="sound (reduction, speed)"]'); await p.fill('[data-note]', 'fast');
  await p.waitForTimeout(1600);
  st = await p.evaluate(() => ({gr: (document.querySelector('#head .gr') || {}).textContent, cnt: document.getElementById('cnt').textContent, dot: document.querySelector('[data-go="0"]').className}));
  ok(st.gr === c0.groups.join(' · ') && /1 of 55/.test(st.cnt) && /done/.test(st.dot), 'rated: groups shown, 1 of 55, the dot filled: ' + JSON.stringify(st));
  const R = env.sheets['My ratings'], rows = R ? R.getRange(2, 1, R.getLastRow() - 1, 14).getValues() : [];
  const r0 = rows.find(r => r[1] === c0.id);
  const items = Object.entries(c0.items).map(([g, a]) => g + ': ' + a.join(' ')).join('; ');
  ok(r0 && r0[0] === 'hw-2026-11-11' && r0[2] === c0.groups.join(' · ') && r0[4] === items && r0[6] === c0.answer && r0[7] === 'there is' && r0[8] === 4 && /sound/.test(r0[9]) && r0[10] === 'fast',
    'sheet «My ratings»: ' + JSON.stringify(r0 && r0.slice(0, 13)));
  // the player stays while she taps (no new player per tap)
  ok(await p.locator('#vid iframe').count() === 1, 'the player was rebuilt');
  // 3. next card, back; after a reload (another device: the table) the rating is there
  await p.click('#next'); await p.waitForTimeout(400); ok(await p.textContent('#head .n') === '2 of 55', 'Next');
  const q = await open(tc, true); await q.evaluate(() => localStorage.removeItem('rate-hw-2026-11-11')); await q.reload(); await q.waitForTimeout(1500);
  st = await q.evaluate(() => { const b = document.querySelector('[data-go="0"]'); b.click(); return {cnt: document.getElementById('cnt').textContent, lv: (document.querySelector('[data-level="4"]') || {}).ariaPressed || document.querySelector('[data-level="4"]').getAttribute('aria-pressed')}; });
  ok(/1 of 55/.test(st.cnt) && st.lv === 'true', 'from her table on another device: ' + JSON.stringify(st));
  // 4. a film card: the film from her computer
  const fi = D.cards.findIndex(c => c.kind === 'film');
  await p.evaluate(i => go(i), fi); await p.waitForTimeout(300);
  ok(/The film plays from your computer/.test(await p.textContent('#vid')), 'a film card does not ask for the film');
  if (shots) await p.screenshot({path: path.join(shots, 'rate_film.png')});
  // 5. the lines she took out: folded, ▶ and «why»
  await p.click('#gone summary'); await p.waitForTimeout(200);
  const g0 = D.removed[0];
  await p.click(`[data-gone="${g0.id}"] [data-gwhy="the subtitles don't match"]`); await p.waitForTimeout(1500);
  const r2 = (env.sheets['My ratings'].getRange(2, 1, env.sheets['My ratings'].getLastRow() - 1, 14).getValues()).find(r => r[1] === g0.id);
  ok(r2 && /subtitles don't match/.test(r2[11]), 'why she took it out, in the sheet: ' + JSON.stringify(r2 && r2.slice(0, 12)));
  await p.evaluate(() => (window._yl || []).splice(0)); await p.click(`[data-gone="${g0.id}"] [data-play="line"]`); await p.waitForTimeout(1500);
  const L2 = await p.evaluate(() => (window._yl || []).splice(0));
  ok(L2.some(x => x[0] === 'seek' && Math.abs(x[1] - g0.play[0]) < .01), 'a removed line does not play: ' + JSON.stringify(L2));
  if (shots) { await p.evaluate(() => document.getElementById('gone').scrollIntoView()); await p.screenshot({path: path.join(shots, 'rate_gone.png')}); }
  // 6. 📋 Copy for the analysis
  await p.click('#copy'); const t = await p.evaluate(() => window._rtCopy || '');
  ok(t.includes('\tdifficulty\t') && t.includes(c0.id + '\t' + c0.groups.join(' · ')) && /Lines she took out/.test(t), '📋: ' + t.slice(0, 300));
  // 7. a phone
  const m = await open(tc, true, {width: 390, height: 844});
  ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'the phone scrolls sideways');
  if (shots) await m.screenshot({path: path.join(shots, 'rate_phone.png'), fullPage: false});
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK rate the lines'); process.exit(fail.length ? 1 : 0);
})();
