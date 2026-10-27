// Privacy: no outside requests before consent (no font services), YouTube only after "Load the videos",
// the consent is remembered and can be withdrawn on datenschutz.html, and every page links to Impressum and Datenschutz.
//   node tests/privacy_check.js SITE_DIR LISTEN_TASK_ID [shots_dir]      e.g. ... b2/2026-10-23.html tq1
const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
const FAKE_YT = `window.YT={Player:function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);
 this.seekTo=()=>{};this.playVideo=()=>{};this.pauseVideo=()=>{};this.getCurrentTime=()=>0;this.getPlayerState=()=>2;this.setPlaybackRate=()=>{};this.cueVideoById=()=>{};this.destroy=()=>{};
 setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),10)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const site = path.resolve(process.argv[2]), page = process.argv[3], task = process.argv[4], shots = process.argv[5];
  const b = await chromium.launch(); const out = {outside: [], errors: []};
  const ctx = await b.newContext({viewport: {width: 360, height: 740}});
  await ctx.route(/^https?:\/\//, r => {
    const u = r.request().url(); out.outside.push(u.replace(/\?.*/, ''));
    if (u.startsWith('https://www.youtube.com/iframe_api')) return r.fulfill({status: 200, contentType: 'text/javascript', body: FAKE_YT});
    return r.fulfill({status: 200, contentType: 'application/json', body: '{"ok":false,"error":"offline"}'});
  });
  const p = await ctx.newPage(); p.on('pageerror', e => out.errors.push(e.message));
  const at = f => 'file://' + path.join(site, f);
  for (const f of ['index.html', path.dirname(page) + '/index.html', page, 'impressum.html', 'datenschutz.html']) {
    await p.goto(at(f)); await p.waitForTimeout(250);
    const links = await p.locator('footer.legal a').evaluateAll(as => as.map(a => a.href));
    out[f] = {footer: links.map(h => fs.existsSync(decodeURIComponent(new URL(h).pathname)) ? 'ok' : 'MISSING ' + h).join(' '),
              font: await p.evaluate(() => document.fonts.check('16px "Homework Sans"'))};
    if (shots && /impressum|datenschutz/.test(f)) await p.screenshot({path: path.join(shots, path.basename(f, '.html') + '.png'), fullPage: true});
  }
  out.beforeTask = [...out.outside];
  await p.goto(at(page) + '#' + task); await p.waitForTimeout(400);
  out.cardShown = await p.locator('#yt-consent').isVisible();
  out.youtubeBeforeClick = out.outside.filter(u => u.includes('youtube')).length;
  if (shots) await p.screenshot({path: path.join(shots, 'consent.png')});
  await p.click('#yt-ok'); await p.waitForTimeout(400);
  out.youtubeAfterClick = out.outside.filter(u => u.includes('youtube')).length;
  out.playerAfterClick = await p.locator('.video iframe').count();
  await p.goto(at(page) + '#' + task); await p.waitForTimeout(400);
  out.cardAfterReload = await p.locator('#yt-consent').count();
  await p.goto(at('datenschutz.html')); await p.waitForTimeout(200);
  out.stateBefore = await p.locator('#yt-state').innerText();
  await p.click('#yt-off'); out.stateAfter = await p.locator('#yt-state').innerText();
  await p.goto(at(page) + '#' + task); await p.waitForTimeout(400);
  out.cardAfterWithdraw = await p.locator('#yt-consent').isVisible();
  const dark = await b.newContext({viewport: {width: 360, height: 740}, colorScheme: 'dark'}); const d = await dark.newPage();
  if (shots) { await d.goto(at('datenschutz.html')); await d.waitForTimeout(200); await d.screenshot({path: path.join(shots, 'datenschutz-dark.png')}); }
  out.outside = [...new Set(out.outside)];
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
