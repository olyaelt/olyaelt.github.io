// tools 13: the chat-scenes type (B2 revision 30.10, late.html «Running late»; her decision 29.10: the pair agrees on one chat message).
//   node tests/chat_scenes_check.js SITE_DIR [shots_dir]
// Scene 1 = model: gaps reveal → the reply arrives, Next lights up; scene 2: type → Send → their bubble → Example by itself → reply;
// reload → the text is still there (this device only); 📌 Model from scene 4; last scene → Speaking → back; fits 1280×720 with example
// and reply; phone: context above the chat, no sideways scroll; the messages arrive one by one with motion on; dark mode; no errors.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs'); const http = require('http');
const PAGE = 'tools/b2-2026-10-30/late';
(async () => {
  const site = path.resolve(process.argv[2]), shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const srv = http.createServer((q, r) => { const f = path.join(site, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, {'Content-Type': f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream'}); r.end(d); }); }).listen(0);
  const base = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch(); const errs = []; const fail = []; const out = {};
  const expect = (n, ok, got) => { if (!ok) fail.push(n + ' ' + JSON.stringify(got)); };
  const bubs = p => p.evaluate(() => [...document.querySelectorAll('#msgs .bub')].map(x => (x.classList.contains('ex') ? 'EX' : x.classList.contains('typing') ? 'TYPING' : x.classList.contains('out') ? 'OUT' : 'IN')));
  const newPage = async (opts = {}) => { const ctx = await b.newContext(opts.ctx || {viewport: {width: 1280, height: 720}, colorScheme: opts.scheme || 'light'});
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); if (!opts.motion) await p.emulateMedia({reducedMotion: 'reduce'});
    await p.goto(base + PAGE + '.html'); await p.waitForTimeout(300); return {ctx, p}; };
  { const {ctx, p} = await newPage();
    out.s1 = {bubs: await bubs(p), gaps: await p.locator('#msgs [data-gap]').count(), input: await p.locator('#msg').count()};
    expect('scene 1: the message, the model with gaps, no input', out.s1.bubs.join() === 'IN,OUT' && out.s1.gaps === 2 && out.s1.input === 0, out.s1);
    for (let k = 0; k < out.s1.gaps; k++) { await p.locator('#msgs [data-gap]').nth(k).click(); await p.waitForTimeout(80); }
    out.s1open = {bubs: await bubs(p), next: await p.evaluate(() => document.querySelector('.acts.wide [data-next]').classList.contains('primary'))};
    expect('scene 1: all gaps open → the reply, Next lit', out.s1open.bubs.join() === 'IN,OUT,IN' && out.s1open.next, out.s1open);
    if (shots) await p.screenshot({path: path.join(shots, 'late-1.png')});
    await p.click('.acts.wide [data-next]'); await p.waitForTimeout(200);
    const typed = "So sorry, Sarah, I'm stuck in traffic. I'll be 20 minutes late.";
    await p.fill('#msg', typed); await p.click('[data-send]'); await p.waitForTimeout(300);
    out.s2 = {bubs: await bubs(p), mine: await p.evaluate(() => document.querySelectorAll('#msgs .bub.out')[0].textContent), bottom: await p.evaluate(() => Math.round(document.querySelector('.stage').getBoundingClientRect().bottom))};
    expect('scene 2: Send → their bubble, the example, the reply', out.s2.bubs.join() === 'IN,OUT,EX,IN' && out.s2.mine.includes(typed), out.s2);
    expect('fits 1280×720 with the example and the reply', out.s2.bottom <= 720, out.s2.bottom);
    if (shots) await p.screenshot({path: path.join(shots, 'late-2.png')});
    await p.reload(); await p.waitForTimeout(300); await p.click('.sc-dots [data-go="1"]'); await p.waitForTimeout(200);
    out.reload = {bubs: await bubs(p), mine: await p.evaluate(() => (document.querySelectorAll('#msgs .bub.out')[0] || {}).textContent || '')};
    expect('reload: the sent text is still there', out.reload.mine.includes(typed) && out.reload.bubs.join() === 'IN,OUT,EX,IN', out.reload);
    await p.click('.sc-dots [data-go="3"]'); await p.waitForTimeout(200); await p.click('[data-model]'); await p.waitForTimeout(100);
    out.model = await p.evaluate(() => (document.querySelector('.model-pop') || {}).textContent || ''); expect('📌 Model from scene 4', /stuck/.test(out.model), out.model);
    await p.click('[data-ex]'); await p.waitForTimeout(200); out.exEarly = await bubs(p); expect('💡 Example before sending, then the reply', out.exEarly.join() === 'IN,EX,IN', out.exEarly);
    await p.click('.sc-dots [data-go="4"]'); await p.waitForTimeout(200);
    await p.click('.acts.wide [data-stage="speak"]'); await p.waitForTimeout(200); out.speak = await p.locator('.speak-task').innerText();
    expect('last chat → Speaking', /late/i.test(out.speak), out.speak);
    await p.click('[data-stage="chats"]'); await p.waitForTimeout(200); expect('back to the chats', await p.locator('#msgs').count() === 1, 'no chat');
    out.box = await p.evaluate(() => Math.round(document.querySelector('aside.box').getBoundingClientRect().bottom)); expect('box whole on 720', out.box <= 720, out.box);
    await ctx.close(); }
  { const {p} = await newPage({motion: true}); out.first = await bubs(p); await p.waitForTimeout(1600); out.later = await bubs(p);
    expect('motion: "typing…" first, then the message', !out.first.includes('IN') && out.later.includes('IN'), {first: out.first, later: out.later}); }
  { const {p} = await newPage({ctx: {...devices['iPhone 13']}}); await p.click('.acts.narrow [data-next]'); await p.waitForTimeout(200);
    out.phone = await p.evaluate(() => ({w: document.documentElement.scrollWidth, vw: innerWidth, ctxTop: Math.round(document.querySelector('.ctx').getBoundingClientRect().top), phoneTop: Math.round(document.querySelector('.phone').getBoundingClientRect().top)}));
    expect('phone: context above the chat, no sideways scroll', out.phone.w <= out.phone.vw && out.phone.ctxTop < out.phone.phoneTop, out.phone);
    if (shots) await p.screenshot({path: path.join(shots, 'late-phone.png'), fullPage: true}); }
  { const {p} = await newPage({scheme: 'dark'}); await p.click('.acts.wide [data-next]'); await p.fill('#msg', 'Sorry!'); await p.click('[data-send]'); await p.waitForTimeout(300);
    if (shots) await p.screenshot({path: path.join(shots, 'late-dark.png')}); }
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK chat scenes'); await b.close(); srv.close(); process.exit(fail.length ? 1 : 0);
})();
