const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const BETTER_ROWS = __BETTER__;   /* r2: the group's sentences from the lesson (slide 55) */
const FIX = __FIX__;              /* e1: Fix it, five blocks */
const SAYIT = __SAYIT__;          /* e2: say it another way, rewrite format; <b class="hl"> = the part to rephrase (fixes 31.10 12:25) */
const TQ = __TQ__;                /* e3: TubeQuizard, 14 clips mixed, McGowan with two gaps [videoId, start, duration, parts] (fixes 31.10 12:55, 13:40) */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-10-30";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- content of this page: C1 lesson 6 homework, Fri 30.10.26 → Wed 04.11 (big), from the C1 lesson chat's TZ of 31.10, 10:30 ---------- */
const LESSON = { date:"30.10.26", sub:"" };
const IPA = t => `<span class="ipa o">${t}</span>`;
const bm = (ph, ipaT, m, r) => `<p class="bm-row"><b>${ph}</b>${ipaT ? " " + IPA(ipaT) : ""} <span class="m">— ${m}</span> ${ru(r)}</p>`;
/* the Part 2 box as on slides 51/54; the TZ's two changes: "picked it up on the job" and "the hard way" on two lines, "I taught myself (off YouTube)" */
const BOX_MORE2 = `<details class="box-more"><summary>More about these phrases</summary><div class="bm-in">
  <h5>USEFUL OR NOT?</h5>
  ${bm("I've never used it since", "", "not once after that", "с тех пор ни разу не пригодилось")}
  ${bm("come in handy", "", "be useful (it came in handy = it helped)", "пригодиться")}
  ${bm("more … than you'd think", "/ðən juːd ˈθɪŋk/", "more than people expect", "больше, чем можно подумать")}
  ${bm("only gets you so far", "", "helps, but only up to a point", "даёт лишь базу")}
  ${bm("add value", "/ˈvæljuː/", "be useful in a way others (or software) can't", "приносить пользу, быть ценным")}
  <h5>LEARNING</h5>
  ${bm("a (really) steep learning curve", "/stiːp ˈlɜːnɪŋ kɜːv/", "a lot to learn, very fast", "пришлось очень быстро всему учиться")}
  ${bm("pick sth up on the job", "", "learn it while you're working", "научиться в процессе работы")}
  ${bm("the hard way", "", "through your own mistakes", "на собственных ошибках")}
  ${bm("read up on sth", "", "read a lot about it", "почитать, изучить тему")}
  ${bm("teach yourself (off YouTube)", "", "learn without a teacher or a course", "научиться самому (по YouTube)")}
  <h5>TODAY</h5>
  ${bm("have stopped hiring juniors", "/ˈdʒuːniəz/", "don't take on beginners any more", "перестали нанимать джунов")}
  ${bm("hand sth over to AI", "", "give it to AI to do instead · ≠ handle = deal with it yourself", "передавать что-то ИИ")}
  ${bm("out of date", "", "no longer correct or useful · old ≠ out of date", "устаревший")}
  ${bm("adapt", "/əˈdæpt/", "change to fit a new situation · ≠ adopt /əˈdɒpt/", "приспосабливаться")}
</div></details>`;
const BOX_SCHOOL2 = `
  <h4>USEFUL OR NOT?</h4>
  <p>It was <b>a complete waste of time</b>.</p>
  <p>I've <b>never used it since</b>.</p>
  <p>You <b>never know when it might come in handy</b>.</p>
  <p>It's more … <b>than you'd think</b>.</p>
  <p><b>What's the point of</b> …?</p>
  <p><b>None of it counted</b>.</p>
  <p>I had to <b>start from scratch</b>.</p>
  <p>School <b>only gets you so far</b>.</p>
  <p>That's where I really <b>add value</b>.</p>
  <h4>LEARNING</h4>
  <p>It was <b>a steep learning curve</b>.</p>
  <p>I <b>picked it up on the job</b>.</p>
  <p>I learned it <b>the hard way</b>.</p>
  <p>I <b>read up on</b> it. I <b>did my homework</b>.</p>
  <p>I <b>taught myself</b> (off YouTube).</p>
  <h4>TODAY</h4>
  <p>They've <b>stopped hiring juniors</b>.</p>
  <p>They're <b>handing it over to AI</b>.</p>
  <p>It's <b>out of date</b>. You need to <b>adapt</b>.</p>
  ${BOX_MORE2}`;
const TOPICS = [
  {id:"school2", title:"Should schools teach more practical things? Part 2", sub:"A radio show asked listeners: was school any use? Three more answers.", box:()=>BOX_SCHOOL2}
];

/* R1: the same mechanics as c1-2026-10-28 (each answer twice: with the glossary beside it, then straight away without it; the glossary's IPA shown) */
const R1_FIRST = "Each answer twice: first with the glossary beside it, then straight away without it. Say the missing words, then tap the yellow boxes to check.";
const R1_GLOSS = "Say the missing words, then tap the yellow boxes to check.";
const R1_PLAIN = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";
const showIpa = g => g.h ? g : Object.assign({}, g, {p: g.p.map(x => x && typeof x === "object" && x.o && "r" in x ? {ipa: x.r.trim(), o: 1} : x)});
const R1_STEPS = GAPS.steps.map((st, i) => Object.assign({}, st, st.gloss ? {gloss: st.gloss.map(showIpa)} : {}, {instr: i === 0 ? R1_FIRST : st.gloss ? R1_GLOSS : R1_PLAIN}));

/* R2 (better.json, slide 55): green = good, grey = could be better; the English as the sentence (normal type), the Russian hint after it */
const enWrap = h => { const m = String(h).match(/^(.*?)\s*(<span class="ru">.*<\/span>)\s*$/); return m ? `<span class="en">${m[1]}</span> ${m[2]}` : `<span class="en">${h}</span>`; };
const BETTER = {html:true, rows: BETTER_ROWS.map(r => [enWrap(r[0]), r[1], r[2]])};

/* E1 «Fix it» (engine 49): each block's card, then its items; write items are rewrite steps carrying the card */
const E1_INSTR = "One small thing in each. Look at the fix, then fix the same thing in new sentences.";
const FIX_STEPS = FIX.flatMap((b, bi) => b.items.map((it, ii) => {
  const first = bi === 0 && ii === 0, cardFirst = ii === 0;   /* the whole card on the block's first item, a shorter one after it */
  if(it.kind === "write") return {type:"rewrite", card:b, cardFirst, r:{o:it.o || "", k:"", pre:it.pre, post:it.post, a:it.a, acc:it.acc, n:it.n, hint:it.hint},
    first, instrFirst:E1_INSTR, instr:"Fix the same thing: type the missing part or say it aloud, then tap Check."};
  return {type:"fix", card:b, cardFirst, it, instr: first ? E1_INSTR : it.kind === "place" ? "Put the word in the right place: tap a ▢, then the word — or drag the word." : "Tap every possible option. Then tap Check."};
}));
const E2_INSTR = "Say it another way with a phrase from the box. Use the word in red. Then tap to check.";
const TASKS = [
  {id:"r1", topic:"school2", sec:"Revision", title:"Three more answers on the radio", meta:"6 steps", kind:"steps", min:8, steps:R1_STEPS},
  {id:"r2", topic:"school2", sec:"Revision", title:"Our sentences: could be better → perfect", meta:"2 sentences", kind:"steps", core:true, min:2,
   steps:[{type:"sayit", s:BETTER, box:BOX_SCHOOL2, boxAlways:true, instr:"Our sentences from the lesson. Green = good, grey = could be better. How would you make each one perfect English? Use the box. Then tap to check."}]},
  {id:"e1", topic:"school2", sec:"Extension", title:"Fix it: one small thing", meta:"5 blocks · 11 items", kind:"steps", min:8, steps:FIX_STEPS},
  {id:"e2", topic:"school2", sec:"Extension", title:"Say it another way: new situations", meta:"6 sentences", kind:"steps", min:4,
   steps:SAYIT.map((r, i) => ({type:"rewrite", r, first:i === 0, instrFirst:E2_INSTR, instr:"Say it another way. Use the word in red.", box:BOX_SCHOOL2, boxAlways:true}))},
  {id:"e3", topic:"school2", sec:"Extension", title:"Hear it: the phrases in real videos", meta:"14 clips, 15 gaps", kind:"steps", min:12,
   takeaway:TQ.takeaway, tqLink:TQ.quiz_link, tq:TQ.quiz_link, steps:TQ.e3.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"write", topic:"school2", sec:"Over to you!", title:"A message for the radio show", meta:"Your task · plan · write or record and send", kind:"steps", min:12,
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const TASK_HTML2 = `
        <p class="task-h">Your task</p>
        <p>The radio show asked listeners: <b>“Should schools teach more practical things?”</b></p>
        <ul>
          <li>Write or record a message for the show with your answer (about a minute if you record it).</li>
          <li>Tell one story — yours or someone you know: something you learned the hard way, picked up on the job or taught yourself (at school, at work, at home or in a hobby).</li>
          <li>End with a question for the host or the listeners.</li>
        </ul>
        <p class="small">Recording? Listen back to it, then record a better version and send that one.</p>`;
const PLAN_INSTR2 = "Tap the phrases you'll use — three or four are enough.";
const PRODUCE_INSTR2 = "Write your message — a short paragraph is enough. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const CHECKS2 = [
  ["Your answer to the question, and why", ""],
  ["One story — yours or someone you know", ""],
  ["One thing you'd add to school (or cut)", ""],
  ["Three or four phrases from the last two lessons", ""],
  ["A question for the host or the listeners at the end", ""]
];
const MAP2 = [
  {h:"Back then", items:[
    ["<b>Back in my day</b>, …","в моё время","when I was young (a bit jokey)"],
    ["It was <b>completely out of touch with real life</b>.","совершенно оторвано от жизни"],
    ["<b>Nobody ever taught us how to</b> …","нас никто никогда не учил…"]]},
  {h:"Useful or not?", items:[
    ["It was <b>a complete waste of time</b>.","пустая трата времени"],
    ["I've <b>never used it since</b>.","с тех пор ни разу не пригодилось"],
    ["You <b>never know when it might come in handy</b>.","никогда не знаешь, когда пригодится"],
    ["It's <b>more useful than you'd think</b>.","полезнее, чем кажется"],
    ["School <b>only gets you so far</b>.","школа даёт лишь базу"],
    ["<b>None of it counted</b>. I had to <b>start from scratch</b>.","ничего не засчитали, пришлось начинать с нуля"]]},
  {h:"Learning", items:[
    ["It was <b>a steep learning curve</b>.","пришлось быстро всему учиться"],
    ["I <b>picked it up on the job</b>.","научилась в процессе работы"],
    ["I learned it <b>the hard way</b>.","на собственных ошибках"],
    ["I <b>taught myself</b> (off YouTube).","научилась сама"]]},
  {h:"Today", items:[
    ["They're <b>handing</b> a lot of that work <b>over to AI</b>.","передают ИИ"],
    ["<b>What matters is being able to adapt</b>.","главное — уметь приспосабливаться"]]}
];
/* the engine reads these names; the five checks from the TZ go under the task, so they're on all three screens (task, plan, produce) */
const TASK_HTML = TASK_HTML2 + `<p class="task-h">Before you send it, check you have:</p><ul>${CHECKS2.map(([a, b]) => `<li>${a}${b ? ` <span class="small">— ${b}</span>` : ""}</li>`).join("")}</ul>`;
const MAP = MAP2;
const PICK_EACH = false;
const PLAN_INSTR = PLAN_INSTR2;
const PRODUCE_INSTR = PRODUCE_INSTR2;
const TENSES = "";
const MODEL = [];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = [];
