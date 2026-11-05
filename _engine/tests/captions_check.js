// engine 62 also (her 05.11 17:05 «субтитры у меня снова включаются на странице квиза»): listening clips start without subtitles every
// time a video loads — the first clip, another video, the same video cued again after another one, and a new player (back to the task).
// A student who turns CC on keeps it for the clips of that video. YouTube is replaced by a stub that behaves like a viewer whose
// YouTube shows captions by itself (the captions module loads with the track on when a video starts playing).
//   node tests/captions_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path');
const STUB = `
window.YT = {Player: function(id, o){
  const P = this, ev = o.events || {}; let vid = o.videoId, mods = [], on = false;
  const el = document.getElementById(id); if(el){ const f = document.createElement("iframe"); f.id = id; f.src = "about:blank"; el.replaceWith(f); }
  window.__yt = {get on(){ return on; }, set on(v){ on = v; }, get mods(){ return mods; }, players: (window.__yt ? window.__yt.players : 0) + 1, userCC(){ mods = ["captions"]; on = true; }};
  P.getVideoData = () => ({video_id: vid}); P.getOptions = () => mods.slice();
  P.unloadModule = m => { if(m === "captions"){ mods = []; on = false; } };
  P.setOption = (m, k, v) => { if(m === "captions" && k === "track" && v && !v.languageCode) on = false; };
  P.cueVideoById = a => { vid = a.videoId || a; mods = []; on = false; };
  P.seekTo = () => {}; P.setPlaybackRate = () => {}; P.getCurrentTime = () => 0; P.getPlayerState = () => 1; P.pauseVideo = () => {}; P.destroy = () => {};
  P.playVideo = () => { setTimeout(() => { if(!mods.length){ mods = ["captions"]; on = true; if(ev.onApiChange) ev.onApiChange({}); } if(ev.onStateChange) ev.onStateChange({data: 1}); }, 120); };
  setTimeout(() => { if(ev.onReady) ev.onReady({target: P}); }, 60);
}};
if(typeof window.onYouTubeIframeAPIReady === "function") window.onYouTubeIframeAPIReady();`;
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('**/*', r => { const u = r.request().url(); if (/iframe_api/.test(u)) return r.fulfill({status: 200, contentType: 'text/javascript', body: STUB});
    if (u.startsWith('file:')) return r.continue(); return r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(site, 'c1/2026-11-04.html')); await p.waitForTimeout(300);
  const steps = await p.evaluate(() => { const t = TASKS.find(t => t.steps.some(s => s.type === 'listen'));
    return {id: t.id, vids: t.steps.map(s => s.type === 'listen' && s.clip[0] ? s.clip[0][0] : '')}; });
  const i0 = 0, i1 = steps.vids.findIndex(v => v && v !== steps.vids[0]);
  expect('the task has clips of two videos', i1 > 0, steps);
  const playLine = async () => { await p.click('.ln .pl'); await p.waitForTimeout(1800); return p.evaluate(() => ({on: window.__yt.on, players: window.__yt.players})); };
  const go = async si => { await p.evaluate(([id, si]) => openTask(id, si), [steps.id, si]); await p.waitForTimeout(400); };
  await go(i0); out.first = await playLine();
  expect('the first clip: no subtitles', out.first.on === false, out.first);
  await p.evaluate(() => window.__yt.userCC()); out.user = await playLine();
  expect('a student turns CC on: the next line of the same video keeps it', out.user.on === true, out.user);
  await go(i1); out.other = await playLine();
  expect('another video: no subtitles', out.other.on === false, out.other);
  await go(i0); out.again = await playLine();
  expect('the first video again, cued after the other one: no subtitles', out.again.on === false, out.again);
  // the usual way, Next and Back: the same player stays, the videos are cued in it
  await go(i0); await playLine(); const n0 = await p.evaluate(() => window.__yt.players);
  for (let k = 0; k < 40 && await p.evaluate(() => stepIdx) < i1; k++) { await p.click('#go'); await p.waitForTimeout(150); }
  out.nextOther = await playLine();
  expect('Next to another video (the same player): no subtitles', out.nextOther.on === false && out.nextOther.players === n0, out.nextOther);
  for (let k = 0; k < 40 && await p.evaluate(() => stepIdx) > i0; k++) { await p.click('#prev'); await p.waitForTimeout(150); }
  out.backFirst = await playLine();
  expect('Back to the first video (the same player): no subtitles', out.backFirst.on === false && out.backFirst.players === n0, out.backFirst);
  await p.evaluate(() => { stopPlayer(); renderHome(); }); await p.waitForTimeout(200);
  await go(i0); out.newPlayer = await playLine();
  expect('back to the task (a new player): no subtitles', out.newPlayer.on === false && out.newPlayer.players >= 2, out.newPlayer);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK captions off'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
