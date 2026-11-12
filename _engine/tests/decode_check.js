// tools 32 (the AL chat's handoff 09.11 22:10): 🎧 the decoding block — the handoff's own checks on the test page t1–t5.
//   node tests/decode_check.js SITE_DIR [SCENE_FILE]   (no scene file → a 20-second one is made with ffmpeg)
const {chromium} = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os'), {execSync} = require('child_process');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [];
  let scene = process.argv[3];
  if (!scene) { scene = path.join(os.tmpdir(), 'decode-scene-' + process.pid + '.mp4');
    execSync(`ffmpeg -y -loglevel error -f lavfi -i "anoisesrc=d=20:c=pink:a=0.5" -f lavfi -i "sine=f=3:d=20" -f lavfi -i "testsrc2=size=320x180:rate=25:d=20" -filter_complex "[0][1]amultiply,volume=4[a]" -map 2:v -map "[a]" -c:v libx264 -preset veryfast -pix_fmt yuv420p -c:a aac -shortest "${scene}"`); }
  const b = await chromium.launch(), ctx = await b.newContext({viewport: {width: 1280, height: 720}});
  await ctx.route('https://hw.test/**', r => { const f = path.join(site, decodeURIComponent(new URL(r.request().url()).pathname)); fs.existsSync(f) ? r.fulfill({path: f}) : r.fulfill({status: 404}); });
  await ctx.addInitScript(() => { window.showOpenFilePicker = undefined; });   // the plain file input (headless has no file system picker)
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  const st = () => p.evaluate(() => ({at: dcSt(DC.b).at, ans: dcSt(DC.b).ans, m: dcMarks(DC.b, dcSt(DC.b).at)}));
  const ok = (c, m) => { if (!c) fail.push(m); };
  await p.goto('https://hw.test/tools/al-decode/decode-test.html#part-1-screen-1'); await p.waitForTimeout(500);
  ok(await p.isVisible('[data-dcgapin]'), 'the gap is not a box to type in');   // her 11.11 18:09: a gap fill, as in TubeQuizard
  // typed: Enter checks — the right words green, the wrong one struck, in 📋 Copy; Space in the box types (doesn't play)
  await p.click('[data-dcgapin]'); await p.keyboard.type('I was sit there'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => !DC.playing && document.querySelector('[data-dcgapin]').value === 'I was sit there'), 'Space in the box did not type');
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => dcSt(DC.b).ans && [...document.querySelectorAll('[data-dctry] .ok')].map(x => x.textContent).join(' ') === 'I was there' && [...document.querySelectorAll('[data-dctry] .no')].map(x => x.textContent).join(' ') === 'sit'), 'Enter did not check what was typed: ' + await p.evaluate(() => (document.querySelector('[data-dctry]') || {}).textContent));
  ok(/typed: I was sit there/.test(await p.evaluate(() => dcCopyText(DC.b))), 'what was typed is not in 📋 Copy');
  await p.click('[data-back]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !dcSt(DC.b).ans && document.querySelector('[data-dcgapin]').value === 'I was sit there'), 'Back: the box lost what was typed');
  await p.fill('[data-dcgapin]', 'I was sitting there'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => !!document.querySelector('[data-dctry] .dc-try-ok') && !document.querySelector('[data-dctry] .no')), 'all right: no ✓');
  await p.click('[data-dcclear]'); await p.waitForTimeout(150); await p.click('[data-back]'); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => /\{\{|\}\}|\*\*/.test(document.body.innerText))), 'markup visible in the question');
  ok((await p.textContent('[data-step]')).includes('Answer'), 'Next does not say Answer');
  await p.click('[data-step]'); await p.waitForTimeout(400);
  let s = await st(); ok(s.ans && s.at === 0, 'Next did not show the answer');
  ok(await p.evaluate(() => /I was sitting there with Gus one day/.test(document.querySelector('.dc-line').textContent.replace(/\s+/g, ' '))), 'the answer is not in the line');
  // a word: grey, strike; ↺
  await p.click('[data-dw="1"]'); await p.waitForTimeout(150); ok(await p.isVisible('[data-dcpan]'), 'no panel on a word');
  await p.click('[data-dcmk="grey"]'); await p.waitForTimeout(150);
  await p.click('[data-dw="4"]'); await p.click('[data-dcmk="strike"]'); await p.waitForTimeout(150);
  s = await st(); ok(s.m.w[1] === 'grey' && s.m.w[4] === 'strike', 'word marks: ' + JSON.stringify(s.m.w));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('[data-dw="1"]')).color !== getComputedStyle(document.querySelector('[data-dw="0"]')).color), 'grey does not look grey');
  await p.click('[data-dw="4"]'); await p.click('[data-dcundo]'); await p.waitForTimeout(150);
  s = await st(); ok(!s.m.w[4], '↺ did not take the mark away');
  // a letter
  // tools 34 (her 12.11 12:05): a tap on a word opens its letters at once, with the word's panel
  await p.click('[data-dw="2"]'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelector('[data-dw="2"]').classList.contains('lt') && !!document.querySelector('[data-dcpan]') && !document.querySelector('[data-dcletters]')), 'a tap on a word: no letters, or no panel');
  await p.click('[data-dl="2.6"]'); await p.click('[data-dcmk="strike"]'); await p.waitForTimeout(150);
  s = await st(); ok(s.m.l['2.6'] === 'strike' && Object.keys(s.m.l).length === 1, 'one letter struck: ' + JSON.stringify(s.m.l));
  ok(await p.evaluate(() => document.querySelector('[data-dw="2"]').classList.contains('lt')), 'the letters closed after a letter mark');
  // ↶ Undo: the last change goes back, one step at a time; Ctrl+Z too
  await p.click('[data-dl="2.0"]'); await p.click('[data-dcmk="grey"]'); await p.waitForTimeout(150);
  ok((await st()).m.l['2.0'] === 'grey', 'the second letter mark');
  await p.click('[data-dcundolast]'); await p.waitForTimeout(150); s = await st();
  ok(!s.m.l['2.0'] && s.m.l['2.6'] === 'strike', '↶ Undo: ' + JSON.stringify(s.m.l));
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150); s = await st();
  ok(!s.m.l['2.6'] && s.m.w[1] === 'grey', 'Ctrl+Z: ' + JSON.stringify(s.m));
  await p.click('[data-dw="2"]'); await p.waitForTimeout(100); await p.click('[data-dl="2.6"]'); await p.click('[data-dcmk="strike"]'); await p.waitForTimeout(150);
  // between two words → an arc; again → gone
  await p.click('[data-dj="2"]'); await p.waitForTimeout(600);
  ok((await p.$$('.dc-arcs path')).length === 1, 'no arc after a tap between the words');
  await p.click('[data-dj="5"]'); await p.waitForTimeout(200); await p.click('[data-dj="5"]'); await p.waitForTimeout(200);
  s = await st(); ok(JSON.stringify(s.m.k) === '[2]', 'the second tap did not take the arc away: ' + JSON.stringify(s.m.k));
  // the keys
  await p.click('[data-dw="6"]'); await p.keyboard.press('b'); await p.waitForTimeout(150);
  s = await st(); ok(s.m.w[6] === 'strong', 'B did not mark strong');
  // 🧹 on line 3 (marks there only)
  // the player
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('[data-dcopen]')]); await fc.setFiles(scene);
  await p.waitForFunction(() => DC.peaks && DC.dur > 0, null, {timeout: 15000}).catch(() => fail.push('no waveform / duration after opening the file'));
  const w = await p.evaluate(() => ({win: DC.win, sel: DC.sel}));
  ok(w.win && Math.abs(w.win[0] - 0) < .01 && Math.abs(w.win[1] - 6.2) < .01 && w.sel && Math.abs(w.sel.s - 1) < .01, 'the waveform is not on the line: ' + JSON.stringify(w));
  for (let i = 0; i < 5; i++) { await p.keyboard.press(' '); await p.waitForTimeout(300); }
  ok((await p.textContent('[data-dccnt]')).trim() === '▶ 5', 'five Spaces → ' + (await p.textContent('[data-dccnt]')));
  await p.waitForTimeout(2600);
  ok(await p.evaluate(() => !DC.playing && DC.m.currentTime >= 3.1 && DC.m.currentTime < 3.6), 'the piece did not stop at its end: ' + (await p.evaluate(() => DC.m.currentTime)));
  const cv = await p.$('[data-dcwave]'), bb = await cv.boundingBox();
  await p.mouse.move(bb.x + bb.width * .5, bb.y + 30); await p.mouse.down(); await p.mouse.move(bb.x + bb.width * .7, bb.y + 30, {steps: 6}); await p.mouse.up(); await p.waitForTimeout(200);
  const sel = await p.evaluate(() => DC.sel); ok(sel && Math.abs(sel.s - 3.1) < .1 && Math.abs(sel.e - 4.34) < .1, 'drag did not select: ' + JSON.stringify(sel));
  await p.click('[data-dcplay]'); await p.waitForTimeout(250); ok(await p.evaluate(() => DC.playing && DC.m.currentTime >= 3.0), '▶ did not play the piece');
  await p.mouse.click(bb.x + bb.width * .1, bb.y + 30); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !DC.sel && !DC.playing && Math.abs(DC.cur - .62) < .1), 'a click outside did not drop the selection');
  const copy = await p.evaluate(() => dcCopyText(DC.b));
  ok(/grey was/.test(copy) && /gone sitting:g/.test(copy) && /link sitting‿there/.test(copy) && /▶ 6: 0:01\.00–0:03\.20 ×5/.test(copy), 'Copy analysis:\n' + copy);
  // Next / Back go through the lines; a ready mark with one tap
  await p.click('[data-step]'); await p.waitForTimeout(300); s = await st(); ok(s.at === 1 && !s.ans, 'Next did not go to line 2');
  ok(await p.evaluate(() => !DC.playing && Math.abs(DC.sel.s - 4) < .01), 'line 2: the waveform is not on its time');
  await p.click('[data-step]'); await p.waitForTimeout(300);
  await p.click('[data-dw="3"]'); await p.waitForTimeout(200); s = await st();
  ok(s.m.s['3.2.1'] === 'd' && !(await p.isVisible('[data-dcpan]')), 'the ready mark (get:t → d) did not go on with one tap: ' + JSON.stringify(s.m));
  await p.click('[data-dw="3"]'); await p.waitForTimeout(150); ok(await p.isVisible('[data-dcpan]'), 'second tap: no panel');
  await p.click('[data-dcundo]'); await p.click('[data-dj="3"]'); await p.waitForTimeout(150);
  await p.click('[data-dcclear]'); await p.waitForTimeout(150); s = await st(); ok(!(await p.evaluate(() => dcHas(dcMarks(DC.b, 1)))), '🧹 did not clear the line');
  await p.click('[data-back]'); await p.waitForTimeout(200); s = await st(); ok(s.at === 1 && !s.ans, 'Back: not the question of line 2');
  await p.click('[data-back]'); await p.waitForTimeout(200); s = await st(); ok(s.at === 0 && s.ans && s.m.w[1] === 'grey', 'Back: not line 1 with its marks');
  // t4: and:d struck with one tap
  await p.click('[data-dcgo="3"]'); await p.waitForTimeout(200); await p.click('[data-step]'); await p.waitForTimeout(200);
  await p.click('[data-dw="0"]'); await p.waitForTimeout(150); s = await st(); ok(s.m.l['0.2'] === 'strike', 'and:d not struck with one tap: ' + JSON.stringify(s.m));
  // a reload in the lesson: the marks stay, the place too
  await p.reload(); await p.waitForTimeout(600);
  s = await st(); ok(s.at === 3 && s.ans && s.m.l['0.2'] === 'strike', 'after a reload: ' + JSON.stringify(s));
  ok(!(await p.evaluate(() => /\{\{|\}\}|\*\*/.test(document.body.innerText))), 'markup visible');
  // a later lesson: clean, ↺ Last time brings them back
  await p.evaluate(() => { const k = 'tool-decode-' + PAGE_ID, x = JSON.parse(localStorage.getItem(k)); Object.values(x.m).forEach(v => v.t -= 5 * 3600e3); localStorage.setItem(k, JSON.stringify(x)); });
  await p.reload(); await p.waitForTimeout(600);
  ok(!(await p.evaluate(() => dcHas(dcMarks(DC.b, 3)))) && await p.isVisible('[data-dclast]'), 'a later lesson does not open clean with ↺ Last time');
  await p.click('[data-dclast]'); await p.waitForTimeout(200); ok(await p.evaluate(() => dcMarks(DC.b, 3).l['0.2'] === 'strike'), '↺ Last time did not bring the marks back');
  // the whole thing fits 1280×720
  const fit = await p.evaluate(() => document.querySelector('.stepbar').getBoundingClientRect().bottom <= innerHeight + 1 && document.querySelector('[data-dc]').getBoundingClientRect().bottom <= document.querySelector('.stepbar').getBoundingClientRect().top + 30);
  ok(fit, 'the line, its player and Back / Next do not fit 1280×720');
  if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  if (!process.argv[3]) try { fs.unlinkSync(scene); } catch (e) {}
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK decoding'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
