// Engine 36: the YouTube player of a listening task never leaves a silent black box (a C1 student's phone, 28.10).
//   node tests/listen_load_check.js ../c1/2026-10-23.html [shots_dir]   (a page with a listening task; file:// = "on the site")
// Cases: normal; the ready-callback taken over by something else (YT.Player appears, onYouTubeIframeAPIReady never comes);
// the API blocked -> message + Try again -> works; the API never answers -> "Loading the video…" then the message after 20 s;
// the player never gets ready -> the message after 15 s; a task with `tq` links to TubeQuizard instead of YouTube.
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{if(!window.__noPlay)s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();if(!window.__noReady)setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
const OK = `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
const HIJACK = `window.onYouTubeIframeAPIReady=function(){};window.YT={Player:${PLAYER}};`;   /* another script took the callback */
(async () => {
  const file = path.resolve(process.argv[2]); const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, {recursive: true});
  const b = await chromium.launch(); const fail = []; const errs = []; const out = {};
  async function run(name, mode, fn){
    const ctx = await b.newContext({...devices['iPhone 13']});
    await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
    let api = mode;
    await ctx.route('https://www.youtube.com/iframe_api', r => api === 'block' ? r.abort('failed') : api === 'hang' ? null
      : r.fulfill({status: 200, contentType: 'text/javascript', body: api === 'hijack' ? HIJACK : OK}));
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    await p.clock.install();
    await p.goto('file://' + file); await p.clock.runFor(500);
    const id = await p.evaluate(() => (TASKS.find(t => t.steps && t.steps.some(s => s.type === 'listen')) || {}).id);
    const st = {
      open: async () => { await p.click(`[data-open="${id}"]`); await p.waitForTimeout(300); await p.clock.runFor(300); },
      look: () => p.evaluate(() => { const m = document.getElementById('vmsg'), l = document.getElementById('vload');
        return {iframe: !!document.querySelector('.video iframe'), loading: l ? l.textContent : '', msg: m && !m.hidden ? m.textContent.replace(/\s+/g, ' ').trim() : '',
                link: m && !m.hidden && m.querySelector('a') ? m.querySelector('a').href : ''}; }),
      setApi: v => { api = v; }, p, id };
    try { await fn(st); } catch (e) { fail.push(name + ': ' + e.message); }
    if (shots) await p.screenshot({path: path.join(shots, name + '.png')});
    await ctx.close();
  }
  const expect = (name, ok, got) => { if (!ok) fail.push(name + ' ' + JSON.stringify(got)); };
  await run('normal', 'ok', async s => { await s.open(); const v = await s.look(); out.normal = v; expect('normal', v.iframe && !v.loading && !v.msg, v); });
  await run('hijacked', 'hijack', async s => { await s.open(); await s.p.clock.runFor(1000); const v = await s.look(); out.hijacked = v;
    expect('hijacked: the player comes anyway', v.iframe && !v.msg && !v.loading, v); });
  await run('blocked', 'block', async s => { await s.open(); await s.p.clock.runFor(500); const v = await s.look(); out.blocked = v;
    expect('blocked: message, Try again, YouTube link (TubeQuizard when the task has tq, engine 42 on C1)', /isn't loading/.test(v.msg) && /Try again/.test(v.msg) && (/youtube\.com\/watch\?v=.+&t=\d+s/.test(v.link) || /tubequizard\.com/.test(v.link) && /Do this quiz in TubeQuizard/.test(v.msg)) && !v.loading, v);
    s.setApi('ok'); await s.p.click('#yt-retry'); await s.p.waitForTimeout(400); await s.p.clock.runFor(1000); const w = await s.look(); out.retried = w;
    expect('blocked: Try again works', w.iframe && !w.msg && !w.loading, w); });
  await run('hanging', 'hang', async s => { await s.open(); await s.p.clock.runFor(5000); const v = await s.look(); out.hanging5s = v;
    expect('hanging: "Loading the video…" at 5 s', v.loading === 'Loading the video…' && !v.msg, v);
    await s.p.clock.runFor(16000); const w = await s.look(); out.hanging21s = w;
    expect('hanging: message after 20 s', /isn't loading/.test(w.msg) && !w.loading, w); });
  await run('noready', 'ok', async s => { await s.p.evaluate(() => { window.__noReady = true; }); await s.open(); await s.p.clock.runFor(3000);
    const v = await s.look(); expect('noready: still loading at 3 s', v.iframe && v.loading && !v.msg, v);
    await s.p.clock.runFor(13000); const w = await s.look(); out.noready = w; expect('noready: message after 15 s', /isn't loading/.test(w.msg), w); });
  await run('tq-link', 'block', async s => { await s.p.evaluate(id => { TASKS.find(t => t.id === id).tq = 'http://tubequizard.com/quiz.php?id=12345'; }, s.id);
    await s.open(); await s.p.clock.runFor(500); const v = await s.look(); out.tq = v;
    expect('tq: TubeQuizard link', /TubeQuizard/.test(v.msg) && v.link === 'http://tubequizard.com/quiz.php?id=12345', v); });
  /* engine 36b: YouTube asks to sign in (or Safari hides the sign-in): a tap plays nothing -> the hint and "Still nothing?" with what to do */
  const help = p => p.evaluate(() => { const h = document.getElementById('hint'), d = h && h.querySelector('details');
    return {shown: !!h && !h.hidden, tapLine: !!h && !!h.querySelector('p') && !h.querySelector('p').hidden, summary: d ? d.querySelector('summary').textContent : '',
            text: d ? d.textContent.replace(/\s+/g, ' ') : '', link: d && d.querySelector('a') ? d.querySelector('a').href : ''}; });
  await run('noplay', 'ok', async s => { await s.p.evaluate(() => { window.__noPlay = true; }); await s.open(); await s.p.clock.runFor(1000);
    await s.p.click('.ln .pl >> nth=1');   /* the play button: a line's centre can be a gap field */ await s.p.clock.runFor(2500); const v = await help(s.p); out.noplay = v;
    expect('noplay: hint + Still nothing?', v.shown && v.tapLine && v.summary === 'Still nothing?' && /Sign in/.test(v.text) && /Prevent Cross-Site Tracking/.test(v.text) && /youtube\.com\/watch|tubequizard\.com/.test(v.link), v); });
  await run('failed-help', 'block', async s => { await s.open(); await s.p.clock.runFor(500); const v = await help(s.p); out.failedHelp = v;
    expect('failed: the help shows without the tap line', v.shown && !v.tapLine && v.summary === 'Still nothing?', v); });
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK listen-load'); await b.close(); process.exit(fail.length ? 1 : 0);
})();
