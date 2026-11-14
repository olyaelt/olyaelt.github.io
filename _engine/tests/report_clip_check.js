// engine 88 (AL chat 14.11 14:00 part 2; her 13:58 «чтобы не бесила и чтобы её было заметно»): under every listening clip a quiet line
// «Video not playing? · Sound doesn't match the words?»; a tap that doesn't start the video in 2 s opens the hint with a big button
// «The video doesn't play — skip this clip»; YouTube's own error says so in the video. Such a clip is a «player» row, not a try: no
// first try for its gaps, the main button becomes Next.
//   node tests/report_clip_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const path = require('path');
const PLAYER = (err, dead) => `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=${dead ? 5 : 1}};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>f.remove();
 setTimeout(()=>{o.events&&o.events.onReady&&o.events.onReady(); ${err ? "setTimeout(()=>o.events.onError&&o.events.onError({data:150}),80);" : ""}},30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch();
  const open = async (err, dead) => { const ctx = await b.newContext({viewport: {width: 400, height: 860}, deviceScaleFactor: shots ? 2 : 1});
    await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER(err, dead)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.join(site, 'c1/2026-11-13.html')); await p.waitForTimeout(500);
    await p.click('[data-open="c1_1"]'); await p.waitForTimeout(900); return p; };
  const journal = p => p.evaluate(() => { try{ return Object.values(JSON.parse(localStorage.getItem(FT_KEY) || '{}')); }catch(e){ return []; } });
  // 1. the quiet line is there; a tap on «Video not playing?» → a player row, no try, Next
  let p = await open(false, false);
  let st = await p.evaluate(() => ({q: (document.getElementById('repq') || {}).textContent || '', big: !document.getElementById('hint') || document.getElementById('hint').hidden}));
  ok(/Video not playing\?/.test(st.q) && /Sound doesn't match the words\?/.test(st.q) && st.big, 'the quiet line, the big button hidden: ' + JSON.stringify(st));
  await p.fill('.gap-in >> nth=0', 'something');
  await p.click('#repq [data-rep="noplay"]'); await p.waitForTimeout(500);
  let J = await journal(p);
  st = await p.evaluate(() => ({done: (document.querySelector('.rep-done') || {}).textContent || '', go: (document.getElementById('go') || {}).textContent || ''}));
  ok(J.some(x => x.type === 'player' && /s0\.rep$/.test(x.item) && x.first === 'student: the video doesn\'t play') && !J.some(x => x.type === 'listen'), 'a player row, no listening try: ' + JSON.stringify(J));
  ok(/won't count/.test(st.done) && /Next/.test(st.go), 'thanks + Next: ' + JSON.stringify(st));
  // the next clip counts as usual
  await p.click('#go'); await p.waitForTimeout(600);
  ok(!!(await p.$('#repq')), 'the next clip has the quiet line again');
  await p.context().close();
  // 2. «Sound doesn't match»
  p = await open(false, false); await p.click('#repq [data-rep="nosync"]'); await p.waitForTimeout(400); J = await journal(p);
  ok(J.some(x => x.type === 'player' && x.first === 'student: the sound doesn\'t match'), 'sound doesn\'t match: ' + JSON.stringify(J));
  await p.context().close();
  // 3. a tap that doesn't start the video → the big button in the hint
  p = await open(false, true); await p.click('.ln[data-i="0"] .pl'); await p.waitForTimeout(2600);
  st = await p.evaluate(() => { const h = document.getElementById('hint'); return {shown: h && !h.hidden, big: !!(h && h.querySelector('.rep-big'))}; });
  ok(st.shown && st.big, 'nothing plays → the big button: ' + JSON.stringify(st));
  if (shots){ await p.evaluate(() => document.getElementById('hint').scrollIntoView({block: 'center'})); await p.waitForTimeout(150); await p.screenshot({path: path.join(shots, 'report_big.png')}); }
  await p.click('#hint .rep-big'); await p.waitForTimeout(400); J = await journal(p);
  ok(J.some(x => x.type === 'player' && x.first === 'student: the video doesn\'t play') && !J.some(x => x.type === 'listen'), 'the big button: ' + JSON.stringify(J));
  await p.context().close();
  // 4. YouTube's own error: the message in the video, no try, Next
  p = await open(true, false); await p.waitForTimeout(500); J = await journal(p);
  st = await p.evaluate(() => ({m: (document.getElementById('vmsg') || {}).textContent || '', go: (document.getElementById('go') || {}).textContent || ''}));
  ok(/isn't available for you/.test(st.m) && /Next/.test(st.go) && J.some(x => x.type === 'player' && x.first === 'error 150') && !J.some(x => x.type === 'listen'), 'YouTube\'s error: ' + JSON.stringify({st, J}));
  if (shots) await p.screenshot({path: path.join(shots, 'report_yt.png')});
  await p.context().close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  await b.close();
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK report a clip: quiet line, big button when nothing plays, YouTube error, no try'); process.exit(fail.length ? 1 : 0);
})();
