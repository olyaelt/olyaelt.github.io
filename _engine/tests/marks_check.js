// "?" marks: on answer cards and listening lines, sent at Finish, a note, Olya's answer shown.
//   node tests/marks_check.js SITE_DIR/b2/2026-10-23.html [shots_dir]
const {chromium, devices} = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const {makeEnv} = require('./mock');
const URL_ = 'https://script.google.com/macros/s/TEST/exec';
(async () => {
  const src = path.resolve(process.argv[2]), shots = process.argv[3];
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'marks-')), 'page.html');
  fs.writeFileSync(tmp, fs.readFileSync(src, 'utf8').replace(/const SYNC_URL = "[^"]*";/, `const SYNC_URL = "${URL_}";`));
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.getRange(2, 1, 1, 3).setValues([['test11', 'Tester', /\/c1\//.test(src) ? 'C1' : 'B2']]);
  const FAKE_YT = `window.YT={Player:function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);this.seekTo=()=>{};this.playVideo=()=>{};this.pauseVideo=()=>{};this.getCurrentTime=()=>0;this.getPlayerState=()=>1;this.cueVideoById=()=>{};this.setPlaybackRate=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events.onReady(),20)}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const errs = []; const out = {};
  await ctx.route(URL_ + '**', r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: FAKE_YT}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + tmp); await p.waitForTimeout(200); await p.fill('#code', 'test11'); await p.click('#code-go'); await p.waitForTimeout(400);
  const ids = await p.evaluate(() => ({ rw: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'rewrite')) || {}).id,
                                        li: (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'listen')) || {}).id }));
  // rewrite task: mark the first answer and (if there is one) a say-it line
  await p.click(`[data-open="${ids.rw}"]`); await p.click('#go'); await p.waitForTimeout(150);
  out.hintShown = await p.locator('.mk-hint').count() > 0;
  if (shots) await p.screenshot({path: path.join(shots, 'mark_rewrite.png')});
  await p.locator('.mk[data-mk]').first().click(); out.markedOn = await p.locator('.mk.on').count();
  let markedSay = false;
  for (let i = 0; i < 40 && !(await p.locator('.lesson-head').count()); i++) {
    if (!markedSay && await p.locator('.say-a .mk').count()) { await p.locator('.say-a .mk').first().click(); markedSay = true; }
    await p.locator('#go').click(); await p.waitForTimeout(40);
  }
  out.banner = (await p.locator('.flagged b').count()) ? await p.locator('.flagged b').innerText() : 'none';
  if (await p.locator('[data-note="0"]').count()) { await p.click('[data-note="0"]'); await p.fill('[data-ni="0"]', 'Why "go back", not "go back an hour"?'); await p.click('[data-ng="0"]'); await p.waitForTimeout(300); }
  if (shots) await p.screenshot({path: path.join(shots, 'mark_banner.png')});
  // listening: mark a hard line
  if (ids.li) {
    await p.click(`[data-open="${ids.li}"]`); await p.waitForTimeout(200); await p.click('#go'); await p.waitForTimeout(100);
    // engine 37: "?" only on lines with a gap, none on context lines
    out.listenMarks = await p.evaluate(() => [...document.querySelectorAll('.ln')].map(r => (r.classList.contains('has-gap') ? 'G' : '-') + (r.querySelector('.mk') ? '?' : '')).join(' '));
    await p.locator('.ln.has-gap .mk').first().click();
    if (shots) await p.screenshot({path: path.join(shots, 'mark_listen.png')});
    for (let i = 0; i < 80 && !(await p.locator('.lesson-head').count()); i++) { await p.locator('#go').click(); await p.waitForTimeout(30); }
    await p.waitForTimeout(400);
  }
  const W = env.sheets.Work; out.workRows = W.d.slice(1).map(r => `${r[0]} | ${r[6]} | ${String(r[7]).replace(/\n/g, ' ⏎ ')}`);
  W.set(2, 10, 'It **goes back** by default — {an hour} is optional.');
  await p.reload(); await p.waitForTimeout(500);
  out.answerLine = await p.locator(`.fb-line[data-fb="${ids.rw}"]`).count() ? await p.locator(`.fb-line[data-fb="${ids.rw}"]`).innerText() : 'none';
  out.errors = errs; console.log(JSON.stringify(out, null, 1)); await b.close();
})();
