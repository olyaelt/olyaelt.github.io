const STICKER = "__STICKER__";
const BOAT1 = "__BOAT1__", BOAT2 = "__BOAT2__", BOAT3 = "__BOAT3__";   /* Olya's pictures (ChatGPT), 1100 px JPEG */
const BOAT = __BOAT__;          /* r1: life on a boat, two screens */
const CARDS = __CARDS__;        /* r1: six cards — Dan answers Jess (v2 of the TZ, her decision 5.11 14:34) */
const SAYIT = __SAYIT__;        /* r1: six situations, the whole reply from scratch */
const FIX = __FIX__;            /* e1: Fix it, four blocks */
const REUNION = __REUNION__;    /* e2: «Twenty years later» (23.10), part 2 */
const TQ = __TQ__;              /* e3: TubeQuizard, 8 clips mixed [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-11-04";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- content of this page: C1 lesson 7 homework, Wed 04.11.26 → Fri 06.11 (small), from the C1 lesson chat's TZ
   (box handoff 2026-11-05_1000_lesson-C1__to_engine__homework-04-11-easier) ---------- */
const LESSON = { date:"04.11.26", sub:"" };
const IPA = t => `<span class="ipa o">${t}</span>`;
const bm = (ph, ipaT, m, r) => `<p class="bm-row"><b>${ph}</b>${ipaT ? " " + IPA(ipaT) : ""} <span class="m">— ${m}</span> ${ru(r)}</p>`;
const BOX_COMP = `
  <h4>YOU CAN SAY</h4>
  <p>It's a lot <b>easier than you'd think</b>.</p>
  <p>It's a lot <b>more relaxing than you'd think</b>.</p>
  <p>It takes a lot <b>longer than you'd think</b>.</p>
  <p>There's a lot <b>more to it than you'd think</b>.</p>
  <h4>HOW</h4>
  <p>short → <b>-er</b>: warmer, cheaper, harder, nicer</p>
  <p>-y → <b>-ier</b>: friendlier, happier, busier, chattier</p>
  <p>long → <b>more</b>: more spacious, more relaxing</p>
  <p>fun → <b>more fun</b> · good / bad → <b>better / worse</b></p>
  <p><b>a lot / much / way</b> + -er <i class="ru">гораздо</i></p>
  <h4>ABOUT YOURSELF</h4>
  <p>It was a lot nicer <b>than I thought</b>.</p>`;
/* e1's box, as on 30.10 */
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
  {id:"easier", title:"It's a lot easier than you'd think", sub:"The last part of our school topic: comparatives, four small fixes and two old friends at a market.", box:()=>BOX_COMP}
];
const NAMED = {BOAT1, BOAT2, BOAT3, BOX_COMP};
const showIpa = g => g.h ? g : Object.assign({}, g, {p: g.p.map(x => x && typeof x === "object" && x.o && "r" in x ? {ipa: x.r.trim(), o: 1} : x)});
const withGloss = st => st.gloss ? {gloss: st.gloss.map(showIpa)} : {};

/* R1 (v2): two short screens of the boat chat (a picture above each, the glossary beside; each gap a whole phrase), six cards (Dan answers Jess),
   then six say-it steps from scratch (the collage above) */
const R1_SIT = "Dan visits his sister Maya. A year ago she sold her flat — now she lives on a narrowboat. Dan expects the worst; Maya knows better.";
const R1_INSTR = ["Say Maya's missing words — the whole phrase, with the word in brackets — then tap the yellow boxes to check.", "Screen 2. The same: say the whole missing phrase, then tap to check."];
const CARD_FIRST = "That evening Dan calls his wife, Jess. She has her own doubts — and now Dan knows better. Say Dan's whole reply (≠ means the opposite), then tap the yellow box to check.";
const CARD_NEXT = "Say Dan's whole reply, then tap to check.";
const SAY_FIRST = "Now without any help. Someone expects the worst — you know better. Say the whole reply aloud with … than you'd think, then tap the yellow box to see one possible answer.";
const SAY_NEXT = "Say the whole reply aloud, then tap to check.";
const R1_STEPS = [
  ...BOAT.steps.map((st, i) => Object.assign({}, st, withGloss(st), {pic: NAMED[st.pic] || "", intro: i === 0 ? R1_SIT : st.intro, instr: R1_INSTR[i]})),
  /* ≠ inside the italic situation came out as «⁄» (the italic face has no ≠): set upright */
  ...CARDS.map(c => Object.assign({}, c, {rows: c.rows.map(r => r.map(x => String(x).replace(/≠/g, '<span style="font-style:normal">≠</span>')))}))
         .map((s, i) => ({type:"sayit", s, box: NAMED[s.box] || BOX_COMP, instr: i === 0 ? CARD_FIRST : CARD_NEXT})),
  ...SAYIT.map((s, i) => ({type:"sayit", s, box: NAMED[s.box] || BOX_COMP, pic: NAMED[s.pic] || "", instr: i === 0 ? SAY_FIRST : SAY_NEXT}))];

/* E1 «Fix it» (engine 49): the mechanics of 30.10 */
const E1_INSTR = "One small thing in each. Look at the fix, then fix the same thing in new sentences.";
const FIX_STEPS = FIX.flatMap((b, bi) => b.items.map((it, ii) => {
  const first = bi === 0 && ii === 0, cardFirst = ii === 0;   /* the whole card on the block's first item, a shorter one after it */
  if(it.kind === "write") return {type:"rewrite", card:b, cardFirst, r:{o:it.o || "", k:"", pre:it.pre, post:it.post, a:it.a, acc:it.acc, n:it.n, hint:it.hint},
    first, instrFirst:E1_INSTR, instr:"Fix the same thing: type the missing part or say it aloud, then tap Check.", box:BOX_SCHOOL2};
  return {type:"fix", card:b, cardFirst, it, instr: first ? E1_INSTR : it.kind === "place" ? "Put the word in the right place: tap a ▢, then the word — or drag the word." : "Tap every possible option. Then tap Check."};
}));

/* E2: «Twenty years later», part 2 — the mechanics of 30.10 r1 (with the glossary, then straight away without; the glossary's IPA shown) */
const R1_FIRST = "Each part twice: first with the glossary beside it, then straight away without it. Say the missing words, then tap the yellow boxes to check.";
const R1_GLOSS = "Say the missing words, then tap the yellow boxes to check.";
const R1_PLAIN = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";
const E2_STEPS = REUNION.steps.map((st, i) => Object.assign({}, st, withGloss(st), {instr: i === 0 ? R1_FIRST : st.gloss ? R1_GLOSS : R1_PLAIN}));

const TASKS = [
  {id:"r1", topic:"easier", sec:"Revision", title:"Not what you'd expect: life on a boat", meta:"2 short screens + 6 cards + 6 situations", kind:"steps", min:11, steps:R1_STEPS},
  {id:"e1", topic:"easier", sec:"Extension", title:"Fix it: one small thing", meta:"4 blocks · 10 items", kind:"steps", min:7, steps:FIX_STEPS},
  {id:"e2", topic:"easier", sec:"Extension", title:"Twenty years later: two old friends at a market", meta:"2 parts · with the glossary, then without", kind:"steps", min:10, steps:E2_STEPS},
  {id:"e3", topic:"easier", sec:"Extension", title:"Hear it: comparatives in real videos", meta:"8 clips · can wait till the weekend", kind:"steps", min:6,
   takeaway:TQ.takeaway, tqLink:TQ.quiz_link, tq:TQ.quiz_link, steps:TQ.e3.map((clip,i)=>({type:"listen",clip,first:i===0}))}
];

/* no Over to you this time (a small Wed → Fri week) */
const TASK_HTML = "";
const MAP = [];
const PICK_EACH = false;
const PLAN_INSTR = "";
const PRODUCE_INSTR = "";
const TENSES = "";
const MODEL = [];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = [];
