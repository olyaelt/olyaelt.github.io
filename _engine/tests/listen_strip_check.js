// engine 72 (her 12.11 17:44): a listening task's video is small enough to keep the lines on the same screen; under a line that played, its time
// strip — drag = a piece that plays when let go (≥ 0.3 s), a tap = from there, ▶ Play the piece / Space = again; it counts as a listen of that line.
//   node tests/listen_strip_check.js SITE_DIR [page=b2/2026-11-11.html] [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;window.__seeks=[];
 this.seekTo=x=>{t=x;window.__seeks.push(x)};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), rel = process.argv[3] || 'b2/2026-11-11.html', shots = process.argv[4], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, rel)); await p.waitForTimeout(500);
  await p.click('[data-open="l1"]'); await p.waitForTimeout(700);
  // the video at most ~30% of the screen; the lines under it on the same screen
  const v = await p.evaluate(() => { const r = document.querySelector('.video').getBoundingClientRect(), l = document.querySelector('.ln.has-gap').getBoundingClientRect(); return {h: r.height, bottom: l.bottom, H: innerHeight}; });
  ok(v.h <= v.H * .31 && v.bottom <= v.H, 'the video is too big or the gap line is off the screen: ' + JSON.stringify(v));
  // a line with a gap played → its strip; the top line without a gap → no strip
  const gi = await p.evaluate(() => [...document.querySelectorAll('.ln')].findIndex(x => x.classList.contains('has-gap')));
  await p.click(`.ln[data-i="${gi}"] .pl`); await p.waitForTimeout(300);
  ok(await p.evaluate(i => { const s = document.querySelector('.lstrip'); return !!s && s.previousElementSibling === document.querySelector(`.ln[data-i="${i}"]`) && s.querySelectorAll('.ls-tk').length >= 4; }, gi), 'no strip under the line');
  if (shots) { fs.mkdirSync(shots, {recursive: true}); await p.screenshot({path: path.join(shots, 'strip.png')}); }
  // drag = a piece, it plays when let go; ▶ Play the piece / Space again
  const bar = await p.locator('.ls-bar').boundingBox(); await p.evaluate(() => { window.__seeks = []; });
  await p.mouse.move(bar.x + bar.width * .3, bar.y + 15); await p.mouse.down(); await p.mouse.move(bar.x + bar.width * .6, bar.y + 15, {steps: 5}); await p.mouse.up(); await p.waitForTimeout(150);
  let st = await p.evaluate(() => ({seeks: window.__seeks.slice(), sel: !document.querySelector('.ls-sel').hidden, btn: !document.querySelector('.ls-play').hidden, w: document.querySelector('.ls-sel').style.width}));
  ok(st.seeks.length === 1 && st.sel && st.btn && parseFloat(st.w) > 20, 'the drag: ' + JSON.stringify(st));
  await p.evaluate(() => document.activeElement && document.activeElement.blur()); await p.keyboard.press(' '); await p.waitForTimeout(150);
  ok(await p.evaluate(s0 => window.__seeks.length === 2 && Math.abs(window.__seeks[1] - s0) < .01, st.seeks[0]), 'Space did not play the piece again');
  // a tap = from there; typing a space in the gap still types
  await p.mouse.click(bar.x + bar.width * .5, bar.y + 15); await p.waitForTimeout(150);
  ok(await p.evaluate(() => window.__seeks.length === 3 && document.querySelector('.ls-sel').hidden), 'a tap did not play from there');
  await p.fill('.gap-in', 'there'); await p.focus('.gap-in'); await p.keyboard.press(' '); await p.keyboard.type('is');
  ok(await p.inputValue('.gap-in') === 'there is', 'Space in the gap: ' + await p.inputValue('.gap-in'));
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listening strip'); process.exit(fail.length ? 1 : 0);
})();
