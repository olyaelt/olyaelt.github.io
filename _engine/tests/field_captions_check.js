// tools 29 (her 6.11 09:55 «на странице для комнат тоже… отключаем субтитры»): the listening block of a field page starts its clips without
// subtitles every time a video loads — the first clip, another video, the same video again after another one, a new player (Try again).
// A student who turns CC on keeps it for the clips of that video. YouTube is a stub whose captions come on by themselves when a video plays
// (as for a viewer whose YouTube account has them on).
//   node tests/field_captions_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/de-krabbelgruppe/krabbelgruppe.html';
const STUB = `
window.YT = {Player: function(id, o){
  const P = this, ev = o.events || {}; let vid = o.videoId, mods = [], on = false;
  const el = document.getElementById(id); if(el){ const f = document.createElement("iframe"); f.id = id; f.src = "about:blank"; el.replaceWith(f); }
  window.__yt = {get on(){ return on; }, get vid(){ return vid; }, players: (window.__yt ? window.__yt.players : 0) + 1, userCC(){ mods = ["captions"]; on = true; }};
  const playing = () => setTimeout(() => { if(!mods.length){ mods = ["captions"]; on = true; if(ev.onApiChange) ev.onApiChange({}); } if(ev.onStateChange) ev.onStateChange({data: 1}); }, 120);
  P.getVideoData = () => ({video_id: vid}); P.getOptions = () => mods.slice();
  P.unloadModule = m => { if(m === "captions"){ mods = []; on = false; } };
  P.setOption = (m, k, v) => { if(m === "captions" && k === "track" && v && !v.languageCode) on = false; };
  P.cueVideoById = a => { vid = a.videoId || a; mods = []; on = false; };
  P.loadVideoById = a => { vid = a.videoId || a; mods = []; on = false; playing(); };
  P.seekTo = () => {}; P.setPlaybackRate = () => {}; P.getCurrentTime = () => 0; P.getPlayerState = () => 1; P.pauseVideo = () => {}; P.destroy = () => {};
  P.playVideo = () => playing();
  setTimeout(() => { if(ev.onReady) ev.onReady({target: P}); }, 60);
}};
if(typeof window.onYouTubeIframeAPIReady === "function") window.onYouTubeIframeAPIReady();`;
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const ctx = await b.newContext({viewport: {width: 1280, height: 800}});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('**/*', r => { const u = r.request().url(); if (/iframe_api/.test(u)) return r.fulfill({status: 200, contentType: 'text/javascript', body: STUB});
    if (u.startsWith(base)) return r.continue(); return r.abort(); });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.emulateMedia({reducedMotion: 'reduce'});
  await p.goto(base + PAGE); await p.waitForTimeout(400);
  const blk = await p.evaluate(() => { const b = BLOCKS.find(b => b.kind === 'listen'); goBlock(b._si, b._bi); S.intro = false; render();
    const vids = b._clips.map(c => c.vid), j = vids.findIndex(v => v !== vids[0]); return {id: b._id, j, v0: vids[0], vj: vids[j]}; });
  await p.waitForTimeout(500);
  expect('the block has clips of two videos', blk.j > 0, blk);
  const play = async () => { await p.click('#main [data-lisplay]'); await p.waitForTimeout(1900); return p.evaluate(() => ({on: window.__yt.on, vid: window.__yt.vid, players: window.__yt.players})); };
  const toClip = async i => { await p.evaluate(([id, i]) => { const b = BLOCKS.find(x => x._id === id); lisSt(b).at = i; render(); }, [blk.id, i]); await p.waitForTimeout(300); };
  out.first = await play();
  expect('the first clip: no subtitles', out.first.on === false && out.first.vid === blk.v0, out.first);
  await p.evaluate(() => window.__yt.userCC()); out.user = await play();
  expect('a student turns CC on: the same video again keeps it', out.user.on === true, out.user);
  await toClip(blk.j); out.other = await play();
  expect('another video: no subtitles', out.other.on === false && out.other.vid === blk.vj, out.other);
  await toClip(0); out.again = await play();
  expect('the first video again, after the other one: no subtitles', out.again.on === false && out.again.vid === blk.v0, out.again);
  // a new player (Try again): no subtitles
  await p.evaluate(() => { try{ LIS.player.destroy(); }catch(e){} LIS.player = null; LIS.ready = false; LIS.holder.querySelector('.lis-yt-box').innerHTML = '<div id="lis-yt"></div>'; lisPlace(); });
  await p.waitForTimeout(400); out.newPlayer = await play();
  expect('a new player: no subtitles', out.newPlayer.on === false && out.newPlayer.players >= 2, out.newPlayer);
  console.log(JSON.stringify(out)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK field captions off'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
