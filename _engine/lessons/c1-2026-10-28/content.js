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

/* ---------- content of this page: C1 lesson 5 homework, 28.10.26 → Fri 30.10 (small), from the lesson chat's TZ of 28.10, 23:59 ---------- */
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
  {id:"school", title:"Should schools teach more practical things?", sub:"A radio show asked listeners: was school any use?", box:()=>BOX_SCHOOL}
];

/* R1: the three radio answers, each with the glossary, then all three without it */
const R1_FIRST = "Fill the gaps in the three answers. Steps 1–3 have the glossary; step 4 is all three again, without it. Say the missing words, then tap the yellow and orange boxes to check.";
const R1_GLOSS = "Say the missing words, then tap the yellow and orange boxes to check.";
const R1_PLAIN = "Say the missing words, then tap the yellow boxes to check.";
const RADIO = ["gary", "claire", "helena"];
const R1_STEPS = [
  {type:"dlg", intro:GAPS.intros[0], lines:GAPS.gary.lines, gloss:GAPS.gary.gloss, instr:R1_FIRST},
  {type:"dlg", intro:GAPS.intros[1], lines:GAPS.claire.lines, gloss:GAPS.claire.gloss, instr:R1_GLOSS},
  {type:"dlg", intro:GAPS.intros[2], lines:GAPS.helena.lines, gloss:GAPS.helena.gloss, instr:R1_GLOSS},
  {type:"dlg", intro:GAPS.intros[3], lines:RADIO.flatMap(k => GAPS[k].lines), instr:R1_PLAIN}
];

/* R2: the group's slips, in new sentences and new contexts */
const SAYIT = {html:true, rows:[
  ["Честно говоря, этот вебинар был совершенно пустой тратой времени: два часа сплошной рекламы.", `To be honest, that webinar was ${g("a complete waste of time")}: it was basically a two-hour sales pitch.`],
  ["Дедушка говорит, что в его время хлеб стоил копейки.", `My grandpa says that ${g("back in his day")}, bread cost next to nothing.`],
  ["Он два года копил на фуд-трак — и это окупилось: теперь у него лучший кофе в городе.", `He saved for two years to buy a food truck, and ${g("it paid off")}: now he sells the best coffee in town.`],
  ["Я два часа гуляла, но часы разрядились, так что ничего не засчиталось.", `I walked for two hours, but my watch died, so ${g("none of it counted")}.`],
  ["Не все читают инструкцию. А многие даже не знают, что она есть.", `${g("Not everyone reads")} the instructions. A lot of ${g("people don't")} even know there are any.`],
  ["Пять лет назад я купила хлебопечку, испекла один хлеб — и с тех пор ни разу ею не пользовалась.", `I bought a bread maker five years ago, made one loaf, and ${g("I've never used it since")}.`]],
  note:"The small words: a complete waste of time · back in his day · it paid off · none of it counted · not everyone reads · people don't · I've never used it since"};

const TASKS = [
  {id:"r1", topic:"school", sec:"Revision", title:"Three answers on the radio: was school any use?", meta:"4 steps", kind:"steps", steps:R1_STEPS},
  {id:"r2", topic:"school", sec:"Revision", title:"Small words that matter: say it in English", meta:"6 lines", kind:"steps",
   steps:[{type:"sayit", s:SAYIT, instr:"Say it in English. Then tap to check."}]},
  {id:"e1", topic:"school", sec:"Extension", title:"Hear it: the phrases in real videos", meta:"6 clips, 7 gaps", kind:"steps",
   takeaway:TQ.takeaway,
   steps:TQ.e1.map((clip,i)=>({type:"listen",clip,first:i===0}))}
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
