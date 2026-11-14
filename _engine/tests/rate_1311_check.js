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
  // the 13.11 rate page moved to the homework engine (engine 85, tests/rate_page_check.js): both old links lead there
  for (const f of ['rate-2026-11-13.html', 'rate-2026-11-13-live.html']) ok(/location\.replace\("\.\.\/\.\.\/prep\/rate-2026-11-13\.html"/.test(fs.readFileSync(path.join(site, 'tools/prep', f), 'utf8')), f + ' does not lead to the new page');
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
  await b.close();
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK rate 13.11 + take it out'); process.exit(fail.length ? 1 : 0);
})();
