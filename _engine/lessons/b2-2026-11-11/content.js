const STICKER = "__STICKER__";
const TQ = __TQ__;   /* L1, L2, L3: the clips [videoId, start, duration, parts] in the AL chat's order (its draft 12.11 14:45, «Домашка к 13.11 на слух»);
                        the lines are TubeQuizard's subtitles (12.11), capitals made normal; tqLink: her TubeQuizard copy of each quiz; tq: the quiz a student may do there instead */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-11-11";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework Wed 11.11.26 → Fri 13.11, all listening: there is · there's, it's or that's · can or can't.
   Olya 12.11 13:11–14:45 via the AL chat: only what came up in the diagnostic on 11.11; the order of Listening 1 and 2 is compared by halves
   (her table's A/B halves: ORDER_AB, engine 71), Listening 3 last for everyone; every gap's first try goes to the Attempts sheet (engine 67/68). ---------- */
const LESSON = { date:"11.11.26", sub:"" };
/* the order of «there is» and «there's, it's or that's?» by halves (engine 71): her table splits each group in two; «can or can't?» last for everyone.
   The students see only their order, no text about it (her 16:16: «чем меньше не нужного им текста, тем лучше»). */
const ORDER_AB = {name:"order: chunks / contrast", x:["l1", "l2", "l3"], y:["l2", "l1", "l3"]};

const TOPICS = [
  {id:"ear", title:"Can you hear it?", sub:"Short words in real, fast speech"}
];

const listenSteps = clips => clips.map((clip, i) => ({type:"listen", clip, first:i===0}));
const TASKS = [
  {id:"l1", topic:"ear", sec:"", title:"There is / there are", meta:"7 short clips · 8 gaps", kind:"steps", min:5, tqLink:TQ.tqLink.L1, tq:TQ.tq.L1, steps:listenSteps(TQ.L1)},
  {id:"l2", topic:"ear", sec:"", title:"There's, it's or that's?", meta:"8 short clips · 9 gaps", kind:"steps", min:5, tqLink:TQ.tqLink.L2, tq:TQ.tq.L2, steps:listenSteps(TQ.L2)},
  {id:"l3", topic:"ear", sec:"", title:"Can or can't?", meta:"6 short clips · 8 gaps", kind:"steps", min:5, tqLink:TQ.tqLink.L3, tq:TQ.tq.L3, steps:listenSteps(TQ.L3)}
];

/* not used on this page (the template asks for them) */
const TASK_HTML = ``;
const MAP = [];
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = false;
const PICK_MIN = 3;
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
