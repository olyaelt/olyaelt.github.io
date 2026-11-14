const STICKER = "__STICKER__";
const CLIPS = __CLIPS__;   /* the 30 clips of the five quizzes (AL chat's handoff 14.11 09:20), shuffled once — the same cards as tools/prep/rate-2026-11-13 */
const POOL = __POOL__;   /* AL chat 14.11 14:00, part 1: the 53 pool clips for the step quiz (pool_all_cards.json), new — no phrase twice in a row */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-prep-2026-11-13";
const JOIN_PUNCT = true;

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- engine 85 (her 14.11 09:46: «в интерфейсе отслушки иметь ровно такой же интерфейс, как у нас в упражнениях»): her rate page
   on the homework engine — each clip as a listening step, exactly as the students will meet it; after Check, her rating under the clip
   (1–5, why, a note, 🗑 out of the homework), kept in her table (sheet «My ratings», set hw-2026-11-13) ---------- */
const LESSON = { date:"14.11.26", sub:"Only for Olya: listen to each clip as a student would, then rate it. The groups and quizzes show after you rate." };
/* her one ladder for both groups (14.11 11:20): B2 gets 2–3, C1 gets 3–5; level 5 rare in a C1 quiz; ✕ = take it out */
const RATE = {set: "hw-2026-11-13", everyone: true, whys_add: ["a word in the gap is swallowed", "very reduced — find more like it for C1"],
  levels: [[1, "Very easy", ""], [2, "B2 will manage", ""], [3, "Reduced but audible", "strong B2, mid C1"], [4, "Strong reduction", "C1 only"], [5, "Almost inaudible", "strong C1 only, few per quiz"]]};

const TOPICS = [
  {id:"rate", title:"Rate the clips", sub:"The listening quizzes for the homework 13.11 → 18.11, B2 and C1 (the four new clips a13, a14, b9, h1 at the end), and the 53 clips of the pool for the step quiz.", box:()=>""}
];
const TASKS = [
  {id:"rate", topic:"rate", sec:"Rate", title:"Rate the clips", meta:`${CLIPS.length} clips · listen, type, Check, then rate`, kind:"steps", min:30,
   instr:"Listen as a student would and type what you hear, then Check. Under the clip: how hard it is for the students.",
   steps: CLIPS.map((c, i) => ({type: "listen", clip: c.lines, first: i === 0, rate: {id: c.id, groups: c.groups, tasks: c.tasks, mark: c.mark}}))},
  /* AL chat 14.11 14:00, part 1: the pool for the step quiz — the same card and the same ladder; the phrase shows once she rates */
  {id:"pool", topic:"rate", sec:"Pool", title:"Pool for the step quiz", meta:`${POOL.length} new clips · listen, type, Check, then rate`, kind:"steps", min:40,
   instr:"Listen as a student would and type what you hear, then Check. Under the clip: how hard it is for the students.",
   steps: POOL.map((c, i) => ({type: "listen", clip: c.lines, first: i === 0, rate: {id: c.id, key: c.key, phrase: c.phrase, groups: [], tasks: ["Pool for the step quiz"], mark: "new"}}))}
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
