const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quiz: [videoId, start, duration, parts] */
const CHAT = __CHAT__;   /* e1: the group chat «Class of 2006» */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-10-28";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- content of this page: C1 lesson 5 homework, 28.10.26 → Fri 30.10 (small), from the lesson chat's TZ of 29.10, 15:15 ---------- */
const LESSON = { date:"28.10.26", sub:"" };
/* the lesson's box, as taught (bold parts as on the slides) */
const BOX_SCHOOL = `
  <h4>BACK THEN</h4>
  <p><b>Back in my day</b>, …</p>
  <p>It was <b>out of touch with real life</b>.</p>
  <p>We learned it <b>by heart</b>.</p>
  <p><b>Nobody ever taught us how to</b> …</p>
  <p>My kids' school is very <b>hands-on</b>.</p>
  <h4>USEFUL OR NOT?</h4>
  <p>It was <b>a complete waste of time</b>.</p>
  <p>I've <b>never used it since</b>.</p>
  <p>You <b>never know when it might come in handy</b>.</p>
  <p>I use it <b>more often than you'd think</b>.</p>
  <p><b>What's the point of</b> …?</p>
  <p>That's where I really <b>add value</b>.</p>
  <p>You <b>pick it up along the way</b>.</p>
  <h4>STARTING AGAIN</h4>
  <p><b>None of it counted</b>.</p>
  <p>I had to <b>start from scratch</b>.</p>
  <p>It was hard, but it <b>paid off</b>.</p>
  <p>School <b>only gets you so far</b>.</p>`;
const TOPICS = [
  {id:"school", title:"Should schools teach more practical things? Part 1", sub:"A radio show asked listeners: was school any use?", box:()=>BOX_SCHOOL}
];

/* R1 (TZ 29.10 15:15, her decision 29.10, the same in B2 and C1): each answer twice in a row — with the glossary beside it, then straight away without it */
const R1_FIRST = "Each answer twice: first with the glossary beside it, then straight away without it. Say the missing words, then tap the yellow and orange boxes to check.";
const R1_GLOSS = "Say the missing words, then tap the yellow and orange boxes to check.";
const R1_PLAIN = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";
const R1_STEPS = GAPS.steps.map((st, i) => Object.assign({}, st, {instr: i === 0 ? R1_FIRST : st.gloss ? R1_GLOSS : R1_PLAIN}));

/* R2 (TZ 29.10 17:00, better.json = deck slides 47–53 as the class saw them): green = good, grey = could be better; the note under each after Check.
   core: the whole group did it in class, so later Quick look backs take it first (engine 43). */
const BETTER = {html:true, rows:[
  [`<span class="en"><span class="good">All the skills you've learned</span> <span class="trap">sooner or later never be useless</span>.</span> ${ru("(любые навыки рано или поздно пригодятся)")}`,
   `All the skills you've learned <b class="g">will come in handy</b> sooner or later. / Everything you learn <b class="g">comes in handy</b> sooner or later.`,
   `Sooner or later and never don't go together. Also possible: You never know when it might come in handy.`],
  [`<span class="en"><span class="trap">In our days</span>, <span class="trap">back to the past</span>, <span class="good">the university was very ideological</span>.</span> ${ru("(в наше время вуз был очень идеологизированным)")}`,
   `<b class="g">Back in my day</b>, / <b class="g">In our day</b>, the university was very ideological.`,
   `Not in our days, but in our day (no -s) = back in my day. «В наше время» = back then → in our day; = now → these days / nowadays. Back to the past isn't an English phrase. · ideological ${ipa("/ˌaɪdiəˈlɒdʒɪkl/")}`],
  [`<span class="en"><span class="good">It's a good way to</span> <span class="trap">know</span> <span class="good">something new</span>: to create something <span class="trap">from zero to the end</span>.</span> ${ru("(хороший способ узнать что-то новое — сделать что-то с нуля самому)")}`,
   `It's a good way to <b class="g">learn</b> something new: to make something <b class="g">from scratch</b>.`,
   `Know = знать (a state); «узнать что-то новое» → learn something new. «С нуля» → from scratch; «от начала до конца» → from start to finish. · scratch ${ipa("/skrætʃ/")}`]]};

const TASKS = [
  {id:"r1", topic:"school", sec:"Revision", title:"Three answers on the radio: was school any use?", meta:"6 steps", kind:"steps", steps:R1_STEPS},
  {id:"r2", topic:"school", sec:"Revision", title:"Our sentences: could be better → perfect", meta:"3 sentences", kind:"steps", core:true,
   steps:[{type:"sayit", s:BETTER, box:BOX_SCHOOL, boxAlways:true, instr:"Our sentences from the lesson. Green = good, grey = could be better. How would you make each one perfect English with today's phrases? Use the box. Then tap to check."}]},
  /* E1 (TZ 29.10 17:00, chat.json): the group chat; its gaps sit on the group's slips of 28.10, each with a red note when opened (engine 43) */
  {id:"e1", topic:"school", sec:"Extension", title:"Class of 2006: the group chat", meta:"8 gaps · 2 screens", kind:"steps",
   steps:CHAT.steps.map((st, i) => ({type:"dlg", intro:st.intro, lines:st.lines, instr: i === 0 ? CHAT.instr : "Say each missing bit, then tap to check."}))},
  {id:"e2", topic:"school", sec:"Extension", title:"Hear it: the phrases in real videos", meta:"6 clips, 7 gaps", kind:"steps",
   takeaway:TQ.takeaway, tqLink:TQ.quiz_link, tq:TQ.quiz_link,
   steps:TQ.e2.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"e3", topic:"school", sec:"Extension", title:"Hear it, part 2: the other phrases", meta:"6 clips, 6 gaps", kind:"steps",
   later:true, takeaway:TQ.takeaway_2, tqLink:TQ.quiz_link_2, tq:TQ.quiz_link_2,
   steps:TQ.e3.map((clip,i)=>({type:"listen",clip,first:i===0}))}
];
const MAP = [];
const TENSES = "";
const MODEL = [];
const READ_INTRO = "";
const TASK_HTML = "";
const PLAN_INSTR = "";
const PRODUCE_INSTR = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = [];
