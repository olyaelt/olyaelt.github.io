const STICKER = "__STICKER__";
const DEMO = __DEMO__;   /* AL chat 14.11 14:00, step_demo.json: the phrases and their rated clips, her levels — the real ladders come after she rates the pool */
//   /* AL chat 14.11 14:00, part 1: the 53 pool clips for the step quiz (pool_all_cards.json), new — no phrase twice in a row */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-prep-step-demo";
const JOIN_PUNCT = true;

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* engine 88: the step quiz on the demo data (AL chat 14.11 14:00 §3) — her screens before the students' */
const LESSON = { date:"14.11.26", sub:"Only for Olya: the quiz that adapts, on the clips you have rated. Pretend you caught or missed everything to see both ways and the end." };
const STEP_INTRO = "This quiz adapts to you. Catch a phrase and you may get a faster clip later. Miss it and you may get a clearer one. So your clips may differ from your classmates'.";
const TOPICS = [
  {id:"demo", title:"The step quiz (demo)", sub:"B2 and C1 on the demo ladders. Answers here don't mix with the homework's.", box:()=>""}
];
const TASKS = [
  {id:"b2", topic:"demo", sec:"Demo", title:"B2: the step quiz", meta:`${DEMO.b2.length} phrases · adapts to you`, kind:"steps", min:10, instr:STEP_INTRO,
   step:{set:"demo-b2", group:"B2", pages:[PAGE_KEY], phrases:DEMO.b2}, steps:[]},
  {id:"c1", topic:"demo", sec:"Demo", title:"C1: the step quiz", meta:`${DEMO.c1.length} phrases · adapts to you`, kind:"steps", min:10, instr:STEP_INTRO,
   step:{set:"demo-c1", group:"C1", pages:[PAGE_KEY], phrases:DEMO.c1}, steps:[]}
];

const TASK_HTML = "";
const MAP = [];
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = false;
const PICK_MIN = 0;
const PLAN_INSTR = "";
const PRODUCE_PH = "";
const PRODUCE_INSTR = "";
const MODEL_TITLE = "";
const MODEL = [];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
