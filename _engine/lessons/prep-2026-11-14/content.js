const STICKER = "__STICKER__";
const CLIPS = __CLIPS__;   /* {main: the 52 priority clips, spare: 26} — AL chat's handoff 14.11 12:00, ordered by make_cancant.py */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-prep-2026-11-14";
const JOIN_PUNCT = true;

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- engine 86: her listening page for the can / can't trial (one B2 student): each clip a listening step as the students meet it;
   the gap stays closed — she answers with the student's buttons (can / can't), then the student's two questions, the step, flags, a note;
   the TubeQuizard line only after she gives the step. Kept on this device and in her table (sheet «My ratings», set cancant-2026-11-14). ---------- */
const LESSON = { date:"14.11.26", sub:"Only for Olya: the clips for the can / can't trial. Answer as the student will, then rank the clip." };
const RATE = {set: "cancant-2026-11-14", choice: ["can", "can't"], total: CLIPS.main.length,
  qs: [{id: "t heard", q: "Can you hear a /t/?", opts: ["yes", "no"]},
       {id: "vowel", q: "Is there a vowel between /k/ and /n/?", opts: ["clear vowel", "weak, very short", "none"]}],
  levels: [[1, "clear", ""], [2, "medium", ""], [3, "hard", ""]],
  flags: ["stressed can (full vowel in can)", "out of sync / poor sound", "British speaker", "other"]};
const step = (c, i) => ({type: "listen", clip: c.lines, first: i === 0, rate: {id: c.id, groups: ["B2 trial"], tasks: ["can / can't"], db: c.db, priority: c.priority}});

const TOPICS = [
  {id:"cc", title:"Can or can't?", sub:"The clip pool for one student's trial quiz: listen, answer as she will, then rank each clip.", box:()=>""}
];
const TASKS = [
  {id:"cc", topic:"cc", sec:"Listen", title:"Can or can't? The clips to check first", meta:`${CLIPS.main.length} clips · answer, two questions, a step`, kind:"steps", min:40,
   instr:"Listen, then tap can or can't — the buttons the student gets. Then her two questions and the step.",
   steps: CLIPS.main.map(step)},
  {id:"spare", topic:"cc", sec:"Spare", title:"Spare clips", meta:`${CLIPS.spare.length} clips · if you have time`, kind:"steps", min:20,
   instr:"The same: listen, tap can or can't, then the questions and the step.",
   steps: CLIPS.spare.map(step)}
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
