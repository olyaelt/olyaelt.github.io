const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quiz: [videoId, start, duration, parts] */
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

/* E1: the group's slips in new sentences (moved to Extension, her rule 29.10: Revision holds only what the whole group met in class) */
const SAYIT = {html:true, rows:[
  ["Это совещание было совершенно пустой тратой времени.", `That meeting was ${g("a complete waste of time")}.`],
  ["Папа говорит, что в его время все ходили в школу пешком.", `My dad says that ${g("back in his day")}, everyone walked to school.`],
  ["Я год учила испанский каждый день. Было тяжело, но это окупилось.", `I studied Spanish every day for a year. It was hard, but ${g("it paid off")}.`],
  ["Я два часа гуляла, но телефон с шагомером остался дома, так что ничего из этого не засчиталось.", `I walked for two hours, but I left my phone at home, so ${g("none of it counted")}.`],
  ["Не все любят готовить. Многие люди даже не знают, как сварить яйцо.", `${g("Not everyone likes")} cooking. A lot of ${g("people don't")} even know how to boil an egg.`],
  ["Я купила коврик для йоги, позанималась один раз — и с тех пор ни разу им не пользовалась.", `I bought a yoga mat, used it once, and ${g("I've never used it since")}.`]],
  note:"The small words: a complete waste of time · back in his day · it paid off · none of it counted · not everyone likes · people don't · I've never used it since (or: I haven't used it since)"};

const TASKS = [
  {id:"r1", topic:"school", sec:"Revision", title:"Three answers on the radio: was school any use?", meta:"6 steps", kind:"steps", steps:R1_STEPS},
  {id:"e1", topic:"school", sec:"Extension", title:"Small words that matter: say it in English", meta:"6 lines", kind:"steps",
   steps:[{type:"sayit", s:SAYIT, instr:"Say it in English. Then tap to check."}]},
  {id:"e2", topic:"school", sec:"Extension", title:"Hear it: the phrases in real videos", meta:"6 clips, 7 gaps", kind:"steps",
   takeaway:TQ.takeaway, tqLink:TQ.quiz_link,
   steps:TQ.e2.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"e3", topic:"school", sec:"Extension", title:"Hear it, part 2: the other phrases", meta:"6 clips, 6 gaps", kind:"steps",
   later:true, takeaway:TQ.takeaway_2, tqLink:TQ.quiz_link_2,
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
