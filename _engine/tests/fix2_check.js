// tools 30 (her 6.11 12:30–12:42, B2 «stages of life»): one answer at a time beside the lines from the text; the box on its own screen
// (then hidden, first letters); the text in two screens; IPA in a glossary shown (no "undefined"); the wheel's answer in lines; memo plates;
// ▶ How to play for noughts and crosses without captions; "Show the answers" when there are several; the stage names.
//   node tests/fix2_check.js SITE_DIR
const {chromium} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
(async () => {
  const site = path.resolve(process.argv[2]), fail = [], errs = [], out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const newPage = async (url, vp = {width: 1280, height: 720}, motion = 'reduce') => { const ctx = await b.newContext({viewport: vp}); await ctx.route(/^https?:\/\/(?!localhost)/, r => r.abort());
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(url + ': ' + e.message)); await p.emulateMedia({reducedMotion: motion}); await p.goto(base + url); await p.waitForTimeout(400); return p; };
  const go = (p, si, bi) => p.evaluate(([si, bi]) => { goStage(si, false); S.intro = false; goBlock(si, bi); }, [si, bi]).then(() => p.waitForTimeout(350));
  const fits = p => p.evaluate(() => { const blk = document.querySelector('#main .blk'), bar = document.querySelector('#main .stepbar'), r = bar.getBoundingClientRect();
    return {ok: blk.getBoundingClientRect().bottom <= r.top + 1 && r.bottom <= innerHeight + 1, blk: Math.round(blk.getBoundingClientRect().bottom), bar: Math.round(r.top), barB: Math.round(r.bottom)}; });
  const P = 'tools/b2-2026-11-06/stages-of-life.html';
  { const p = await newPage(P);
    out.stages = await p.evaluate(() => D.stages.map(s => s.label));
    expect('stage names: 📖 The text (her 12:42), 🔁 Back to the start after Practice', JSON.stringify(out.stages) === JSON.stringify(['📝 Test yourself', '📖 The text', '🃏 Practice', '🔁 Back to the start', '💬 Use it']), out.stages);
    // her 13:12: the warmer from her slide 2 (two stickers + her picture), first in Test yourself
    await go(p, 0, 0);
    out.warm = await p.evaluate(() => { const w = document.querySelector('#main .pi-wrap'), im = w && w.querySelector('.pi-pic img'), notes = [...document.querySelectorAll('#main .postit')];
      return w ? {notes: notes.length, pic: im ? Math.round(im.getBoundingClientRect().width) : 0, loaded: im ? im.naturalWidth : 0, right: im && notes[0] ? im.getBoundingClientRect().left > notes[0].getBoundingClientRect().right : false, t: notes.map(n => n.innerText).join(' | ')} : null; });
    expect('the warmer: two stickers, her picture beside them', out.warm && out.warm.notes === 2 && out.warm.pic > 300 && out.warm.loaded > 0 && out.warm.right && /old photos/.test(out.warm.t) && /do you keep them online/.test(out.warm.t), out.warm);
    expect('the warmer fits', (await fits(p)).ok, await fits(p));
    expect('the stage bar on the title\'s row (its arrows dropped)', await p.evaluate(() => { const n = document.querySelector('header.head nav.stages'), t = document.querySelector('header.head h1'); return n.classList.contains('tight') && n.getBoundingClientRect().top < t.getBoundingClientRect().bottom - 8; }), 'head');
    out.kinds0 = await p.evaluate(() => D.stages[0].blocks.map(b => b.kind)); expect('Test yourself: the warmer, three debate screens (fixes-3 §0), then the six sentences', out.kinds0.join() === 'postits,say,say,say,say', out.kinds0);
    out.kinds = await p.evaluate(() => D.stages[1].blocks.map(b => b.kind + (b.one ? '1' : '')));
    expect('the text stage: two reading screens, the questions, the box, two + two memorisation screens', out.kinds.join() === 'text,text,say1,box,text,text,text,text', out.kinds);
    // the text in two screens, each with its own glossary, no line pictures, no "undefined"
    for (const bi of [0, 1, 4, 5, 6, 7]) { await go(p, 1, bi); const f = await fits(p), t = await p.evaluate(() => document.querySelector('#main').innerText);
      expect(`text screen ${bi} fits 1280×720 with Back / Next`, f.ok, f); expect(`text screen ${bi}: no "undefined"`, !/undefined/.test(t), bi);
      if (bi === 0) { out.tpic = await p.evaluate(() => { const f = document.querySelector('#main .tx-pic.glpic'), im = f && f.querySelector('img'), g = document.querySelector('#main .tx-sidecol aside.gloss'), k = document.querySelector('#main .tx').style.getPropertyValue('--k');
          const shown = f && getComputedStyle(f).display !== 'none', h = im ? Math.round(im.getBoundingClientRect().height) : 0, under = im && g ? im.getBoundingClientRect().top >= g.getBoundingClientRect().bottom : false; f.style.display = 'none'; document.querySelector('#main .tx').style.removeProperty('--k'); fitCard(); const k0 = document.querySelector('#main .tx').style.getPropertyValue('--k'); f.style.removeProperty('display'); render();
          return {shown, h, under, k, k0}; });
        expect('reading 1: her picture under the glossary, the text not made smaller for it', out.tpic.shown && out.tpic.h >= 80 && out.tpic.under && out.tpic.k === out.tpic.k0, out.tpic); }
      if (bi < 2) { const ipa = await p.evaluate(() => [...document.querySelectorAll('#main .gloss .ipa')].map(x => x.textContent)); expect(`reading ${bi}: the glossary shows its IPA`, ipa.length >= 2 && ipa.every(x => /^\/.+\/$/.test(x)), ipa); } }
    out.lpics = await p.evaluate(() => D.stages[1].blocks.flatMap(b => (b.lines || []).filter(l => l.img)).length); expect('no pictures beside the lines', out.lpics === 0, out.lpics);
    out.part2 = await p.evaluate(() => [D.stages[1].blocks[1].lines[0].ctx, D.stages[1].blocks[1].instr]);
    expect('the second part starts with the question it answers; the speaking question is on it', /Who's this next to you/.test(out.part2[0]) && /more like/.test(out.part2[1]), out.part2);
    // the questions beside the lines from the text, one answer at a time
    await go(p, 1, 2);
    out.lay = await p.evaluate(() => { const ex = document.querySelector('#main .say-ex'), qs = document.querySelector('#main .say-qs'); return ex && qs ? {exR: Math.round(ex.getBoundingClientRect().right), qsL: Math.round(qs.getBoundingClientRect().left), bold: ex.querySelectorAll('b').length, qn: qs.querySelectorAll('.say-isle.so').length, open: qs.querySelectorAll('.so.open').length} : null; });
    expect('lines from the text on the left, five questions on the right, nothing open', out.lay && out.lay.exR < out.lay.qsL && out.lay.bold >= 9 && out.lay.qn === 5 && out.lay.open === 0, out.lay);
    expect('no side box on this screen', await p.evaluate(() => !document.querySelector('#side aside.box')), 'side');
    const st = () => p.evaluate(() => ({open: [...document.querySelectorAll('#main .so.open')].map(x => x.dataset.so), ok: [...document.querySelectorAll('#main .so.seen')].map(x => x.dataset.so), ans: document.querySelectorAll('#main .so.open p.new').length, stage: S.stage, at: bIdx()}));
    for (let k = 1; k <= 5; k++) { await p.click('.stepbar [data-step]'); await p.waitForTimeout(250); const s = await st(); const f = await fits(p);
      expect(`Next ${k}: answer ${k} open under its question, the ones before ✓ and closed`, s.open.join() === String(k) && s.ok.length === k - 1 && s.ans >= 1 && s.at === 2, s);
      expect(`answer ${k} open: the screen fits`, f.ok, f); }
    await p.click('.stepbar [data-back]'); await p.waitForTimeout(250); expect('Back closes the open answer', (await st()).open.length === 0 && (await st()).ok.length === 5, await st());
    await p.click('[data-so-show="2"]'); await p.waitForTimeout(250); expect('a question\'s own button opens its answer again', (await st()).open.join() === '2', await st());
    await p.reload(); await p.waitForTimeout(500); expect('kept on reload', (await st()).open.join() === '2' && (await st()).ok.length === 4, await st());
    await p.click('.stepbar [data-step]'); await p.waitForTimeout(300); expect('all seen: Next goes on, to the box', await p.evaluate(() => curBlock().kind) === 'box', await p.evaluate(() => curBlock().kind));
    // the box on its own screen, then hidden
    const bx = () => p.evaluate(() => { const m = document.querySelector('#main aside.box.mainbox'); return m ? {hid: m.classList.contains('hid'), bh: m.querySelectorAll('.bh').length, open: m.querySelectorAll('.bh.open').length, side: !!document.querySelector('#side aside.box'), instr: document.querySelector('#main .finstr').innerText, pairsBh: m.querySelectorAll('.pp-c .bh').length, txt: m.innerText, first: (() => { const c = m.querySelector('.ph').cloneNode(true); c.querySelectorAll('.bh, .bx-ctx, .gloss').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' ').replace(/в детстве/, '').trim(); })()} : null; });
    out.box0 = await bx(); expect('the box, whole, on the main screen; no box on the side', out.box0 && !out.box0.hid && out.box0.bh === 0 && !out.box0.side && /language for today/.test(out.box0.instr), out.box0);
    expect('the box screen fits', (await fits(p)).ok, await fits(p));
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    out.box1 = await bx(); expect('Next: the phrases hidden, first letters stay, US / UK too; the Russian stays', out.box1 && out.box1.hid && out.box1.bh > 20 && out.box1.pairsBh >= 6 && /в детстве/.test(out.box1.txt) && out.box1.first === 'a a k' && /some words are hidden/.test(out.box1.instr), out.box1 && Object.assign({}, out.box1, {txt: out.box1.txt.slice(0, 80)}));
    out.box18 = await p.evaluate(() => [...document.querySelectorAll('#main .mainbox .ph')].map(x => x.textContent).find(t => /18/.test(t)) || ''); expect('numbers stay (at 18)', /18/.test(out.box18), out.box18);
    await p.click('#main .mainbox .bh >> nth=0'); await p.waitForTimeout(200); expect('tap the yellow: it opens', (await bx()).open === 1, await bx());
    expect('the hidden box fits', (await fits(p)).ok, await fits(p));
    await p.click('.stepbar [data-back]'); await p.waitForTimeout(250); expect('Back: the whole box again', !(await bx()).hid, 'back');
    // Back to the start: its own stage, one answer at a time, no "Our answers"
    await go(p, 3, 0);
    out.back = await p.evaluate(() => ({cards: document.querySelectorAll('#main .say-isles .so').length, btns: document.querySelectorAll('#main [data-so-show]').length, our: /our answers/i.test(document.querySelector('#main').innerText), dots: document.querySelectorAll('#main .so-dots').length}));
    expect('Back to the start: six cards, each with its own button, the dots where the answer goes, no «Our answers»', out.back.cards === 6 && out.back.btns === 6 && !out.back.our && out.back.dots === 6, out.back);
    await p.click('[data-so-show="4"]'); await p.waitForTimeout(250);
    out.back4 = await p.evaluate(() => { const c = document.querySelector('#main .so.open'); return c ? {n: c.dataset.so, txt: c.innerText, dots: c.querySelectorAll('.so-dots').length} : null; });
    expect('its answer under the Russian, the dots gone', out.back4 && out.back4.n === '4' && /third year at university/.test(out.back4.txt) && /третьем курсе/.test(out.back4.txt) && out.back4.dots === 0, out.back4);
    expect('Back to the start fits', (await fits(p)).ok, await fits(p));
    // the wheel: the answer in lines
    await go(p, 2, 2); await p.evaluate(() => { const st = bs(curBlock()); st.wh = {cur: 0, shown: true, got: []}; render(); }); await p.waitForTimeout(300);
    out.wheel = await p.evaluate(() => { const n = document.querySelector('#main .gt-a .note.lines'); return n ? {lines: n.querySelectorAll('.nl').length, labs: [...n.querySelectorAll('.nlab')].map(x => x.textContent), color: getComputedStyle(n).color, bx: n.querySelectorAll('.bx').length, del: n.querySelectorAll('.m-del').length} : null; });
    expect('the wheel\'s answer: six lines in black, the labels bold, the phrases blue, the mistake struck', out.wheel && out.wheel.lines === 6 && out.wheel.labs.join('|') === 'Or:|The answer:|Not sure?' && out.wheel.color === 'rgb(29, 29, 27)' && out.wheel.bx >= 4 && out.wheel.del === 1, out.wheel);
    // fixes-3: 16 new cards, each with its own lines; the open answer takes the wheel's place, every card fits without small type
    out.wh16 = [];
    for (let k = 0; k < 16; k++) out.wh16.push(await p.evaluate(k => { const st = bs(curBlock()); st.wh = {cur: k, shown: true, got: []}; render();
      const blk = document.querySelector('#main .blk'), bar = document.querySelector('#main .stepbar'), fc = document.querySelector('#main .blk > .fgame'), wh = document.querySelector('#main .fw-wheel');
      return {fit: blk.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1, k: +(fc.style.getPropertyValue('--k') || 1), wheel: getComputedStyle(wh).display, never: [...document.querySelectorAll('#main .nlab')].some(x => x.textContent === 'Never?')}; }, k));
    expect('wheel: every answer fits, type at least .92, the wheel out of the way', out.wh16.every(x => x.fit && x.k >= .92 && x.wheel === 'none'), out.wh16.filter(x => !(x.fit && x.k >= .92 && x.wheel === 'none')));
    expect('wheel: «Never?» bold on cards 8 and 10', out.wh16[7].never && out.wh16[9].never && !out.wh16[0].never, 'never');
    out.whBack = await p.evaluate(() => { const st = bs(curBlock()); st.wh = {cur: null, shown: false, got: [0]}; render(); return getComputedStyle(document.querySelector('#main .fw-wheel')).display; });
    expect('wheel: no answer open → the wheel is back', out.whBack !== 'none', out.whBack);
    out.oneRow = await p.evaluate(() => new Set([...document.querySelectorAll('header.head nav.stages .stage-btn')].map(x => Math.round(x.getBoundingClientRect().top))).size);
    expect('beside the box the stage bar keeps one row', out.oneRow === 1, out.oneRow);
    await p.context().close(); }
  // a phone: the questions under the lines
  { const p = await newPage(P, {width: 390, height: 844}); await go(p, 1, 2);
    out.phone = await p.evaluate(() => { const ex = document.querySelector('#main .say-ex').getBoundingClientRect(), qs = document.querySelector('#main .say-qs').getBoundingClientRect(); return {under: qs.top >= ex.bottom - 1, wide: document.documentElement.scrollWidth <= innerWidth + 1}; });
    expect('phone: the questions under the lines, no sideways scroll', out.phone.under && out.phone.wide, out.phone);
    await go(p, 1, 3); out.phoneBox = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); expect('phone: the box screen, no sideways scroll', out.phoneBox, 'box');
    await p.context().close(); }
  // "Show the answers" when there are several; memo plates; the noughts-and-crosses demo without captions
  { const p = await newPage('tools/b2-2026-10-30/f-seen.html');
    const many = await p.evaluate(() => { const b = BLOCKS.find(b => b.kind === 'say' && !b.one && b.answer && b.task.filter(l => /^\*\*\d+\*\*/.test(l)).length > 1); if (!b) return null; goBlock(b._si, b._bi); S.intro = false; render(); return document.querySelector('[data-sayshow]').textContent; });
    if (many != null) expect('several answers: «Show the answers»', many === 'Show the answers', many);
    const memo = await p.evaluate(() => { const b = BLOCKS.find(b => b.kind === 'game' && b.piece === 'memo'); if (!b) return null; goBlock(b._si, b._bi); S.intro = false; render(); return true; });
    if (memo) { await p.waitForTimeout(300); await p.click('#main [data-gm-go]'); await p.waitForTimeout(300);
      const look = await p.evaluate(() => [...document.querySelectorAll('#main .gmemo .gm-list li')].map(x => Math.round(x.getBoundingClientRect().width)));
      await p.click('#main [data-gm-hide]'); await p.waitForTimeout(300);
      const ghost = await p.evaluate(() => { const L = [...document.querySelectorAll('#main .gm-list.ghost li')]; return {w: L.map(x => Math.round(x.getBoundingClientRect().width)), btn: document.querySelectorAll('#main .gm-list.ghost button').length, shadow: L.length ? getComputedStyle(L[0]).boxShadow : '', cover: document.querySelectorAll('#main .gm-cover').length, txt: L.map(x => { const c = x.cloneNode(true); c.querySelectorAll('.gm-hid').forEach(h => h.remove()); return c.textContent; }).join('|')}; });
      expect('memo: the hidden plates are the plates they looked at, the same length, nothing to press', ghost.w.length === look.length && ghost.w.every((w, i) => Math.abs(w - look[i]) <= 2) && ghost.btn === 0 && ghost.shadow === 'none' && ghost.cover === 0, {look, ghost});
      expect('memo without "recall": "first": no letters to read, only the dotted lengths', !/[A-Za-z]/.test(ghost.txt), ghost.txt);
      out.memoFirst = await p.evaluate(() => { const b = BLOCKS.find(b => b.kind === 'game' && b.piece === 'memo'); b.recall = 'first'; bs(b).memo = null; render(); return true; });
      await p.click('#main [data-gm-go]'); await p.waitForTimeout(200); await p.click('#main [data-gm-hide]'); await p.waitForTimeout(250);
      const f = await p.evaluate(() => { const c = document.querySelector('#main .gm-list.ghost li').cloneNode(true); c.querySelectorAll('.gm-hid').forEach(h => h.remove()); return c.textContent.trim(); }); expect('"recall": "first": the first letters stay', /^[A-Za-z]( [A-Za-z])+/.test(f), f);
    }
    await p.context().close(); }
  { const p = await newPage('tools/b2-2026-11-06/stages-of-life.html', {width: 1280, height: 720}, 'no-preference');
    await p.evaluate(() => { try{ localStorage.clear(); }catch(e){} }); await p.reload(); await p.waitForTimeout(400);
    await go(p, 2, 1); await p.waitForTimeout(1500);
    out.demo = await p.evaluate(() => ({demo: !!document.querySelector('#main .gdemo'), cap: document.querySelectorAll('#main .gdm-cap').length, marks: document.querySelectorAll('#main .gdm-c.m').length}));
    expect('noughts and crosses: ▶ How to play plays the game itself, no captions', out.demo.demo && out.demo.cap === 0 && out.demo.marks >= 1, out.demo);
    await p.context().close(); }
  console.log(JSON.stringify(out).slice(0, 1500)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK fix 2 (stages of life)'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
