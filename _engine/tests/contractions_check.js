// Engine 55 (31.10, a student's friend, then her decision): a typed answer counts with any apostrophe a keyboard gives (’ ` ´ ʼ …)
// and with or without a contraction (it's = it is, I'll = I will, you'd = you would), as in TubeQuizard; not where one of the two
// would be wrong English ("is not it" for "isn't it", "It's," closing a clause, "it is been"). A gap's own alt: ["…"] counts too.
//   node tests/contractions_check.js ENGINE_TEMPLATE PAGE_WITH_TAGS.html   (e.g. engine/page_template.html ../b2/2026-10-14.html)
// Part 1: the rules themselves (answerForms / sameAnswer pulled out of the template).
// Part 2: on the page, in the listening clips: the long form of "It's … isn't it" is ✓, "it´s" with a German-keyboard accent is ✓,
//          "It's, isn't it" for "It is, isn't it" and "is not it" are ✗ (the red → answer line).
const {chromium, devices} = require('playwright'); const path = require('path'); const fs = require('fs');
const fail = []; const expect = (name, ok, got) => { if (!ok) fail.push(name + ' ' + JSON.stringify(got)); };
const tpl = fs.readFileSync(path.resolve(process.argv[2]), 'utf8');
const a = tpl.indexOf('const APOS'), b = tpl.indexOf('const splitTok');
if (a < 0 || b < a) { console.log('FAILED: answerForms not found in the template'); process.exit(1); }
const sameAnswer = new Function(tpl.slice(a, b) + '\nreturn sameAnswer;')();
const RULES = [
  ["It's embarrassing, isn't it", "It is embarrassing, isn't it", true], ["it's hard isn't it", "it`s hard isn´t it", true],
  ["it is a long story", "itʼs a long story", true], ["it is hard", "it ' s hard", true], ["everyone's talking about", "everyone is talking about", true],
  ["I'll give them that", "I will give them that", true], ["couldn't get into that", "could not get into that", true],
  ["than you'd think", "than you would think", true], ["it's been years", "it has been years", true], ["what have you been up to", "what've you been up to", true],
  ["cannot", "can't", true], ["learned the hard way", "learnt the hard way", true], ["hands-on", "hands on", true], ["AM my time", "a.m. my time", true],
  ["kind of a long story", "kinda a long story", true], ["you'd better go", "you had better go", true], ["it isn't that bad", "it is not that bad", true],
  ["isn't it", "is not it", false], ["don't you think", "do not you think", false], ["Why don't we", "why do not we", false],
  ["It is, isn't it", "It's, isn't it", false], ["It is isn't it", "It's isn't it", false], ["it really is", "it really's", false],
  ["it's been years", "it is been years", false], ["it is", "its", false], ["you'd better go", "you would better go", false], ["the easy part", "the easy parts", false]
];
RULES.forEach(([ans, val, want]) => { const got = sameAnswer(val, [ans], ""); expect(`rule "${val}" for "${ans}"`, got === want, got); });
expect('a short form mid-clause (words after the gap)', sameAnswer("it's", ["it is"], " hard to say") === true, false);
expect('a short form closing the clause', sameAnswer("it's", ["it is"], ".") === false, true);
expect('alt', sameAnswer("kept me busy", ["keep me busy", "kept me busy"], ".") === true, false);
const PLAYER = `function(id,o){const d=document.getElementById(id),f=document.createElement('iframe');f.id=id;d.replaceWith(f);let t=0,s=-1;
 this.seekTo=x=>{t=x};this.playVideo=()=>{s=1};this.pauseVideo=()=>{s=2};this.getCurrentTime=()=>{if(s===1)t+=.5;return t};this.getPlayerState=()=>s;
 this.setPlaybackRate=()=>{};this.cueVideoById=()=>{s=5};this.loadVideoById=()=>{};this.destroy=()=>f.remove();setTimeout(()=>o.events&&o.events.onReady&&o.events.onReady(),30)}`;
const OK = `window.YT={Player:${PLAYER}};setTimeout(()=>window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(),10);`;
(async () => {
  const file = path.resolve(process.argv[3]); const br = await chromium.launch(); const errs = []; const out = {};
  const ctx = await br.newContext({...devices['iPhone 13']});
  await ctx.addInitScript(() => { try{ localStorage.setItem('hw-yt-ok', '1'); }catch(e){} });
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({status: 200, contentType: 'text/javascript', body: OK}));
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file); await p.waitForTimeout(400);
  /* the listening step and gap of a given answer */
  const find = ans => p.evaluate(ans => { for (const t of TASKS) (t.steps || []).forEach((st, si) => { if (st.type !== 'listen' || window.__f) return;
      let k = 0; st.clip.forEach(l => l[3].forEach(x => { if (typeof x !== 'string') { if (x.gap === ans && !window.__f) window.__f = {id: t.id, si, k}; k++; } })); });
    const f = window.__f; window.__f = null; return f; }, ans);
  const tryGap = async (ans, typedVal) => {
    const f = await find(ans); if (!f) { fail.push('no listening gap "' + ans + '" on this page'); return null; }
    await p.evaluate(f => openTask(f.id, f.si, 'fresh'), f); await p.waitForTimeout(300);
    await p.fill(`.gap-in[data-k="${f.k}"]`, typedVal); await p.press(`.gap-in[data-k="${f.k}"]`, 'Enter'); await p.waitForTimeout(150);
    return p.evaluate(() => ({ok: [...document.querySelectorAll('.gap-res.ok')].map(x => x.textContent), no: document.querySelectorAll('.gap-res.no').length, fb: document.querySelectorAll('.gap-fb').length}));
  };
  let v;
  v = await tryGap("It's embarrassing, isn't it", "It is embarrassing, isn't it"); out.long = v;
  expect('the long form is ✓ and stays as typed', v && v.ok.length === 1 && /It is embarrassing/.test(v.ok[0]) && v.no === 0, v);
  v = await tryGap("it's hard isn't it", "it´s hard isn´t it"); out.accent = v;
  expect('a German-keyboard accent for the apostrophe is ✓', v && v.ok.length === 1 && v.no === 0, v);
  v = await tryGap("It is, isn't it", "It's, isn't it"); out.closing = v;
  expect('"It\'s," for "It is," is ✗', v && v.ok.length === 0 && v.no === 1 && v.fb === 1, v);
  v = await tryGap("aggressive isn't it", "aggressive is not it"); out.tag = v;
  expect('"is not it" for the tag is ✗', v && v.ok.length === 0 && v.no === 1, v);
  console.log(JSON.stringify(out, null, 1)); if (errs.length) fail.push('page errors: ' + errs.join(' | '));
  console.log(fail.length ? 'FAILED:\n' + fail.join('\n') : 'OK contractions (' + RULES.length + ' rules, 4 gaps)'); await br.close(); process.exit(fail.length ? 1 : 0);
})();
