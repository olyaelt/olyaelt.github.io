// tools 26 (her German page «In der Krabbelgruppe», the handoff of 2.11 and her answers): 🎧 a listen block — "Load the videos" once,
// one player for the page on top of the block's place (hidden on other screens), the subtitle lines around each clip (her 14:45), each with
// its own ▶ (a second before it); ▶ Play = the whole stretch (no lines around: 3 s either side); ä = ae / ß = ss
// accepted, a wrong gap → the answer and the clip in "Your hard cards once more", Next = check, then the next clip (it plays at once),
// Back = the clip before; a text with a meaning answer; her move colours; 12 parts as signs in one row; 🎬 her film: a Self code kept
// apart from the teacher code, a finished part sends its frames to her table, the film shows the total; every screen fits 1280×720.
//   node tests/de_page_check.js SITE_DIR [shots_dir]
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const {makeEnv} = require('./mock');
const PAGE = 'tools/de-krabbelgruppe/krabbelgruppe.html';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const env = makeEnv(); env.ctx.setUp(); env.sheets.Students.appendRow(['selfde1', 'Olya DE', 'Self', '']);
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = [], fail = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const ctx = await b.newContext({viewport: {width: 1280, height: 720}, reducedMotion: 'reduce'});
  /* YouTube: a stand-in player that writes down what the page asks of it */
  await ctx.addInitScript(() => { window.__yt = []; window.YT = {Player: class { constructor(id, o){ this.o = o; this.t = 0; window.__yt.push(['new', o.videoId, o.playerVars.start]);
      const el = document.getElementById(id); if (el) el.outerHTML = `<iframe id="${id}" title="yt"></iframe>`; setTimeout(() => o.events.onReady(), 30); }
    seekTo(t){ this.t = t; window.__yt.push(['seek', t]); } playVideo(){ window.__yt.push(['play']); } pauseVideo(){ window.__yt.push(['pause']); }
    loadVideoById(x){ this.t = x.startSeconds; window.__yt.push(['load', x.videoId, x.startSeconds]); } cueVideoById(x){ window.__yt.push(['cue', x.videoId, x.startSeconds]); }
    setPlaybackRate(r){ window.__yt.push(['rate', r]); } getCurrentTime(){ return this.t; } destroy(){} }};
    ['ttt', 'dots', 'goose', 'snakes'].forEach(k => localStorage.setItem('tool-demo-' + k, '1')); localStorage.setItem('hw-code', 'TEACHERX'); localStorage.setItem('hw-role', 'teacher'); });
  await ctx.route(/youtube\.com/, r => r.fulfill({status: 200, contentType: 'text/javascript', body: ''}));
  await ctx.route(/script\.google\.com/, r => r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': '*'}, body: JSON.stringify(env.post(r.request().postData()))}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + PAGE); await p.waitForTimeout(400);
  const at = (si, bi) => p.evaluate(([si, bi]) => { S.stage = si; S.intro = false; S.view = 'field'; S.at[si] = bi; render(); }, [si, bi]).then(() => p.waitForTimeout(300));
  const fits = () => p.evaluate(() => { const bar = document.querySelector('.stepbar').getBoundingClientRect(), blk = document.querySelector('.blk').getBoundingClientRect(); return blk.bottom <= bar.top + 2 && bar.bottom <= innerHeight + 1; });
  const yt = () => p.evaluate(() => window.__yt.slice());

  out.lang = await p.evaluate(() => document.documentElement.lang); expect('the page is German', out.lang === 'de', out.lang);
  out.pills = await p.evaluate(() => { const n = document.querySelector('.stages'), r = [...n.querySelectorAll('.stage-btn')].map(x => x.getBoundingClientRect().top); return {many: n.classList.contains('many'), rows: new Set(r.map(Math.round)).size, named: [...n.querySelectorAll('.stage-btn')].filter(x => getComputedStyle(x.querySelector('.s-nm')).display !== 'none').length}; });
  expect('12 parts: signs in one row, only the current one named', out.pills.many && out.pills.rows === 1 && out.pills.named === 1, out.pills);

  // a text with its meaning answer
  const t1 = await p.evaluate(() => D.stages.findIndex(s => /Teil 1/.test(s.label)));
  await at(t1, 0); out.txt = {btn: await p.locator('[data-txshow]').count()};
  await p.click('[data-step]'); await p.waitForTimeout(250); out.txt.ans = await p.locator('.tx-ans').innerText().catch(() => ''); out.txt.i = await p.evaluate(() => bIdx());
  expect('Teil 1: Show the answer under the text; Next opens it, same screen', out.txt.btn === 1 && /Beide/.test(out.txt.ans) && out.txt.i === 0, out.txt);
  // her move colours
  await at(t1, 1); await p.click('[data-step]'); await p.waitForTimeout(250);
  out.mv = await p.evaluate(() => ['m1', 'm2', 'm3'].map(k => document.querySelectorAll('#main .mv.' + k).length));
  expect('the answer in her colours: green, yellow, cyan', out.mv.every(n => n > 0), out.mv);
  if (shots) await p.screenshot({path: path.join(shots, 'de-colours.png')});

  // 🎧 the listen block
  const H = await p.evaluate(() => D.stages.findIndex(s => /Hören/.test(s.label)));
  await at(H, 0);
  out.consent = await p.locator('[data-lisok]').count(); out.noPlayer = (await yt()).length;
  expect('🎧 first: "Load the videos", nothing from YouTube yet', out.consent === 1 && out.noPlayer === 0, {c: out.consent, yt: out.noPlayer});
  if (shots) await p.screenshot({path: path.join(shots, 'de-lis-consent.png')});
  await p.click('[data-lisok]'); await p.waitForTimeout(400);
  const c0 = await p.evaluate(() => { const c = curBlock()._clips[0]; return {vid: c.vid, start: c.start, dur: c.dur, n: c._n, gap: c.parts.find(x => typeof x !== 'string').gap, from: lisRange(c)[0], around: c.pre.length + c.post.length}; });
  out.made = (await yt()).find(x => x[0] === 'new');
  out.holder = await p.evaluate(() => { const h = document.querySelector('.lis-holder'), ph = document.querySelector('[data-lisvid]'); const a = h.getBoundingClientRect(), z = ph.getBoundingClientRect();
    return {shown: getComputedStyle(h).display === 'block', over: Math.abs(a.left - z.left) < 2 && Math.abs(a.top - z.top) < 2 && Math.abs(a.width - z.width) < 2}; });
  expect('one player, on the first clip from where its stretch starts, on top of the block\'s place', out.made && out.made[1] === c0.vid && out.made[2] === Math.floor(c0.from) && out.holder.shown && out.holder.over, {made: out.made, c0, holder: out.holder});
  out.lines = await p.locator('#main .lis-ln').count();
  expect('the subtitle lines around it: each a ▶, the gap line among them', c0.around >= 2 && out.lines === c0.around + 1 && (await p.locator('#main .lis-ln.gapl [data-lisin]').count()) === 1, {lines: out.lines, around: c0.around});
  await p.click('[data-lisplay]'); await p.waitForTimeout(200);
  out.play = (await yt()).filter(x => x[0] === 'seek' || x[0] === 'play');
  expect('▶ Play: the whole stretch, from a second before its first line', out.play.some(x => x[0] === 'seek' && Math.abs(x[1] - c0.from) < .01) && out.play.some(x => x[0] === 'play'), {play: out.play, from: c0.from});
  await p.click('#main .lis-ln.gapl .lis-pl'); await p.waitForTimeout(150);
  out.linePlay = (await yt()).filter(x => x[0] === 'seek').pop();
  expect('▶ next to the gap line: that line, from a second before', out.linePlay && Math.abs(out.linePlay[1] - (c0.start - 1)) < .01, {linePlay: out.linePlay, start: c0.start});
  // a wrong answer
  await p.fill('[data-lisin]', 'das weiß ich'); await p.press('[data-lisin]', 'Enter'); await p.waitForTimeout(250);
  out.wrong = {no: await p.locator('.lis-no').innerText().catch(() => ''), ans: await p.locator('.lis-ans').innerText().catch(() => ''), again: await p.evaluate(n => saved.again.includes(n), c0.n)};
  expect('a wrong gap: struck through → the answer; the clip goes to the hard cards', /weiß/.test(out.wrong.no) && out.wrong.ans === c0.gap && out.wrong.again, out.wrong);
  if (shots) await p.screenshot({path: path.join(shots, 'de-lis-wrong.png')});
  expect('the listen screen fits 1280×720', await fits(), 'scrolls');
  // Next → the next clip, and it plays
  const before = (await yt()).length; await p.click('[data-step]'); await p.waitForTimeout(400);
  const c1 = await p.evaluate(() => { const c = curBlock()._clips[1]; return {vid: c.vid, start: c.start, from: lisRange(c)[0]}; });
  out.next = {at: await p.evaluate(() => lisSt(curBlock()).at), calls: (await yt()).slice(before)};
  expect('Next on a checked clip → clip 2, and it plays (its whole stretch)', out.next.at === 1 && out.next.calls.some(x => (x[0] === 'load' && x[1] === c1.vid && Math.abs(x[2] - c1.from) < .01) || (x[0] === 'seek' && Math.abs(x[1] - c1.from) < .01)), {next: out.next, c1});
  // Next with a gap not checked = check it (empty → the answer shown)
  await p.click('[data-step]'); await p.waitForTimeout(250);
  out.emptyCheck = {ans: await p.locator('.lis-ans').count(), at: await p.evaluate(() => lisSt(curBlock()).at)};
  expect('Next on an unchecked clip = check (empty → the answer), same clip', out.emptyCheck.ans === 1 && out.emptyCheck.at === 1, out.emptyCheck);
  // Back → the clip before
  await p.click('[data-back]'); await p.waitForTimeout(250);
  expect('Back → the clip before', (await p.evaluate(() => lisSt(curBlock()).at)) === 0, 'not back');
  // ä = ae, ß = ss, ' optional: the words block
  const W = await p.evaluate(() => curBlocks().findIndex(b => b.kind === 'listen' && b._clips.some(c => c.parts.some(x => x.gap === 'Eingewöhnung'))));
  await at(H, W); await p.evaluate(() => { const b = curBlock(); lisSt(b).at = b._clips.findIndex(c => c.parts.some(x => x.gap === 'Eingewöhnung')); render(); }); await p.waitForTimeout(300);
  await p.fill('[data-lisin]', 'eingewoehnung'); await p.click('[data-lischeck]'); await p.waitForTimeout(250);
  out.fold = await p.locator('.lis-ok').count(); expect('"eingewoehnung" = Eingewöhnung ✓', out.fold === 1, out.fold);
  // the end of a block → the next block
  await at(H, 0); await p.evaluate(() => { const b = curBlock(); lisSt(b).at = b._clips.length - 1; render(); }); await p.waitForTimeout(250);
  await p.click('[data-step]'); await p.click('[data-step]'); await p.waitForTimeout(300);
  out.blockEnd = await p.evaluate(() => bIdx()); expect('the last clip checked, Next → the next listening block', out.blockEnd === 1, out.blockEnd);
  // another screen: the player hides
  await at(t1, 0); out.hidden = await p.evaluate(() => getComputedStyle(document.querySelector('.lis-holder')).display);
  expect('on another screen the player hides', out.hidden === 'none', out.hidden);
  // the hard cards: the missed clip comes back as a card
  out.fast = await p.evaluate(n => { const d = fastDeckBlock(); return d.cards.some(c => c._n === n && /______/.test(c.front)); }, c0.n);
  expect('"Your hard cards once more": the missed clip, with its gap', out.fast, out.fast);

  // 🎬 her film
  out.filmBtn = await p.locator('[data-film]').innerText().catch(() => '');
  expect('🎬 Your film in the head', /Your film/.test(out.filmBtn), out.filmBtn);
  await p.click('[data-film]'); await p.waitForTimeout(200);
  await p.fill('[data-film-in]', 'selfde1'); await p.click('[data-film-save]'); await p.waitForTimeout(600);
  out.code = await p.evaluate(() => ({self: localStorage.getItem('tool-self-code'), teacher: localStorage.getItem('hw-code')}));
  expect('her Self code kept apart; the teacher code untouched', out.code.self === 'selfde1' && out.code.teacher === 'TEACHERX', out.code);
  const L0 = await p.evaluate(() => SORD[0]);
  await at(L0, await p.evaluate(i => D.stages[i].blocks.length - 1, L0)); await p.evaluate(() => stepOn()); await p.waitForTimeout(800);
  const rows = env.sheets['State'] ? env.sheets['State'].d.slice(1).filter(r => r[1] === 'selfde1') : [];
  out.film = {rows: rows.map(r => [r[2], r[3], r[4], r[7]]), btn: await p.locator('[data-film]').innerText()};
  expect('a finished part → its frames in her table, the film shows them', rows.some(r => r[2] === 'de-krabbelgruppe/krabbelgruppe' && /^part-/.test(r[3]) && r[4] === true && r[7] > 0) && /\d+ 🎞/.test(out.film.btn), out.film);
  if (shots) await p.screenshot({path: path.join(shots, 'de-film.png')});

  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK German page'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
