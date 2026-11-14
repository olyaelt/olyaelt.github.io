// engine 84 (AL chat 13.11 20:45 §1, §2): in a listening gap only the apostrophe wrong is no mistake («Thats' a», «thats a», «that,s a» for
// «That's a» → ✓, the spelling beside it; «it's a» still ✗), the same in the journal; a video YouTube refuses is kept in the journal as a
// «player» row (no new student UI) and 📋 For the analysis lists it under «Player errors», not as a try.
//   node tests/heard_apos_check.js SITE_DIR [shots/]
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const PLAYER = err => `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.05;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.unloadModule=()=>{};this.destroy=()=>f.remove();
 setTimeout(()=>{o.events&&o.events.onReady&&o.events.onReady(); ${err ? "setTimeout(()=>o.events.onError&&o.events.onError({data:150}),50);" : ""}},30)}`;
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3], fail = [], errs = [], ok = (c, m) => { if (!c) fail.push(m); };
  const b = await chromium.launch();
  const open = async (err) => { const ctx = await b.newContext({viewport: {width: 1280, height: 800}});
    await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
    await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: `window.YT={Player:${PLAYER(err)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.join(site, 'c1/2026-11-11.html')); await p.waitForTimeout(500);
    await p.click('[data-open="l2"]'); await p.waitForTimeout(700); return p; };
  const first = p => p.evaluate(() => { try{ return JSON.parse(localStorage.getItem(FT_KEY) || '{}'); }catch(e){ return {}; } });
  // the clip with «That's a»: type, check
  const tryIt = async (val, shot) => { const p = await open(false);
    const k = await p.evaluate(() => [...document.querySelectorAll('.gap-in')].findIndex(x => true));
    await p.evaluate(() => { const i = document.querySelector('.gap-in'); i.focus(); });
    await p.fill('.gap-in', val); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => { const r = document.querySelector('.gap-res'); const sp = document.querySelector('.gap-spell');
      return {cls: r ? r.className : '', txt: r ? r.textContent : '', spell: sp ? sp.textContent : null, fb: !!document.querySelector('.gap-fb:not(.gap-spell)')}; });
    const F = await first(p), it = Object.values(F).find(x => x.type === 'listen');
    if (shot && shots){ await p.evaluate(() => document.querySelector('.ln.has-gap').scrollIntoView({block: 'center'})); await p.waitForTimeout(200); const box = await p.locator('.ln.has-gap').first().boundingBox(); await p.screenshot({path: path.join(shots, shot), clip: {x: box.x - 20, y: box.y - 60, width: box.width + 40, height: box.height + 90}}); }
    await p.context().close(); return {st, ok: it && it.ok}; };
  const ON = /const HEARD_APOS = true/.test(fs.readFileSync(path.join(site, "c1/2026-11-11.html"), "utf8"));
  for (const v of (ON ? ["Thats' a", "thats a", "that,s a"] : [])) {
    const r = await tryIt(v, v === "Thats' a" ? 'apos_ok.png' : null);
    ok(/ok/.test(r.st.cls) && r.st.txt === v + ' ✓' && r.st.spell === "✓ The spelling: That's a" && !r.st.fb && r.ok === true, v + ': ' + JSON.stringify(r)); }
  if (!ON) { const r0 = await tryIt("Thats' a"); ok(/no/.test(r0.st.cls) && r0.ok === false, 'before her yes (HEARD_APOS false) the apostrophe still counts: ' + JSON.stringify(r0)); }
  let r = await tryIt('that’s a'); ok(/ok/.test(r.st.cls) && r.st.spell === null && r.ok === true, 'a curly apostrophe is just right: ' + JSON.stringify(r));
  r = await tryIt("That's a"); ok(/ok/.test(r.st.cls) && r.st.spell === null && r.ok === true, "That's a: " + JSON.stringify(r));
  r = await tryIt("it's a"); ok(/no/.test(r.st.cls) && r.ok === false, "it's a: " + JSON.stringify(r));
  // a video YouTube refuses (150): a «player» row in the journal, no new message for the student
  const p = await open(true); await p.waitForTimeout(400);
  const F = await first(p), pe = Object.values(F).filter(x => x.type === 'player');
  ok(pe.length === 1 && /:s0\.yt$/.test(pe[0].item) && pe[0].first === 'error 150' && pe[0].answer && pe[0].prompt.includes('___'), 'the player row: ' + JSON.stringify(pe));
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK heard: apostrophes + player errors'); process.exit(fail.length ? 1 : 0);
})();
