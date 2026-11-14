const STICKER = "__STICKER__";
const GAPS = __GAPS__;           /* ben1, ben2, ben3: Ben's video (the lesson page tools/b2-2026-11-11/bens-video, 📜 Text blocks 4, 9, 49) with the TZ's notes; arc1a–arc2b: Fiona and Nadia */
const PRACTICE_DATA = __PRACTICE__;   /* practice: rewrite → say, by turns, two «Mind if…?» at the end; more: the same for part 3 */
const OTY = __OTY__;             /* Over to you: Joe's reply (Fiona's message hidden), the task, the plan, a possible answer */
const TQ = __TQ__;               /* B2_1, B2_2: the AL chat's two quizzes (handoff 2026-11-14_1210), capitals made normal, b9 with her shift of 14.11 11:58 */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
/* in her lists this homework goes by its own name (engine 63 SHOW_TITLE) */
const SHOW_TITLE = true;
const PAGE_KEY = "hw-ge-b2-2026-11-13";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework Fri 13.11.26 (Lesson 14, The Intern · Scene 1) → Wed 18.11 (big), from the lesson chat's TZ
   (box handoff 2026-11-14_1630_lesson-B2__to_engine__homework-1311-come-rain-or-shine); the listening block from the AL chat (1210) ---------- */
const LESSON = { date:"13.11.26", sub:"" };   /* the page says itself: «you don't have to do it all in one go» */
const md = (s, cls) => esc(s).replace(/\*\*(.+?)\*\*/g, (_, x) => cls ? `<b class="${cls}">${x}</b>` : `<b>${x}</b>`);   /* **bold** in the TZ's texts */

/* the box: Ben's phrases of parts 1–2, as the whole group did them (the lesson's box + cards); part 3 is not in it */
const BOX = "<h4>BEN'S STORY</h4>\n<p><b>At first</b>, I <b>enjoyed</b> … <i class=\"ru\">поначалу мне нравилось</i></p>\n<p><b>The problem was</b>, … <i class=\"ru\">проблема была в том, что…</i></p>\n<p><b>no matter where</b> I went <i class=\"ru\">куда бы я ни поехал</i></p>\n<p><b>As soon as I got home</b>, … <i class=\"ru\">как только я возвращался домой</i></p>\n<p>… <b>hit me like a ton of bricks</b> <span class=\"ipa\">/tʌn/</span> <i class=\"ru\">накрыло (как обухом по голове)</i></p>\n<p>I had a lot of <b>time on my hands</b>. <i class=\"ru\">свободное время, которое нечем занять</i></p>\n<h4>WHAT HE DOES NOW</h4>\n<p>Get up, <b>get out of the house</b>. <i class=\"ru\">перестать сидеть дома, выбраться из дома</i></p>\n<p><b>Come rain or shine</b>, … <i class=\"ru\">в любую погоду, что бы ни было</i></p>\n<p><b>Can't explain it</b>, but … <i class=\"ru\">не могу объяснить почему, но…</i></p>\n<p>… <b>makes me feel part of something</b> <i class=\"ru\">я чувствую себя частью чего-то</i></p>\n<p>…, <b>you name it</b>. <i class=\"ru\">да что угодно, чего только нет</i></p>\n<p>Believe me, <b>I've tried everything</b>. <i class=\"ru\">я всё перепробовал</i></p>\n<h4>PEOPLE</h4>\n<p><b>Mind if</b> I join you? — <b>No, go ahead.</b> <i class=\"ru\">Не против, если я…? — Нет, пожалуйста.</i></p>";

const TOPICS = [
  {id:"ben", title:"The Intern: Ben's video", sub:"Ben's video once more — then the same phrases in a new story.", box:()=>BOX}
];

const DLG_WITH = "Say the missing words. Then tap the yellow and orange boxes to check.";
const DLG_WITHOUT = "Now without the glossary.";
const DLG_ON = "Read on. Say the missing words, then tap to check.";
const dlgPair = (part, first) => [{type:"dlg", intro:part.intro, lines:part.lines, gloss:part.gloss, instr: first ? DLG_WITH : DLG_ON},
                                  {type:"dlg", intro:part.intro, lines:part.lines, instr:DLG_WITHOUT}];

const RW_FIRST = "Rewrite the sentence. Use the word in capitals. Type the missing part or say it aloud, then tap Check.";
const SAY_FIRST = "What would you say? Say it aloud, then tap the yellow box to check.";
const practiceSteps = list => { let rwN = 0, sayN = 0; return list.map(x => x.kind === "rw"
  ? {type:"rewrite", r:Object.assign({box:BOX}, x.r), box:BOX, first:rwN++ === 0, instrFirst:RW_FIRST}
  : {type:"sayit", s:Object.assign({box:BOX}, x.s), box:BOX, instr: sayN++ === 0 ? SAY_FIRST : "What would you say?"}); };
const listenSteps = clips => clips.map((clip, i) => ({type:"listen", clip, first:i===0}));

/* Over to you: Joe's reply first (Fiona's message hidden: guess it), then the task */
function OTU_READ(){
  const parts = []; String(OTY.read.reply).split(/(\*\*.+?\*\*)/).forEach(x => { if(!x) return; const m = x.match(/^\*\*(.+)\*\*$/); parts.push(m ? {b: m[1]} : x); });
  return {type: "dlg", intro: OTY.read.intro, lines: [{s: "Fiona", p: [{f: "", r: OTY.read.hidden}]}, {s: "Joe", p: parts}]};
}
const TASK_HTML = `
<p class="task-h">Your task</p>
<p>${esc(OTY.task)}</p>
<p class="small">Write it or record it.</p>`;
const MAP = OTY.map;
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = !!OTY.pick_each;
const PICK_MIN = OTY.pick_min || 0;
const PLAN_INSTR = OTY.plan_instr;
const PRODUCE_PH = "Fiona, …";
const PRODUCE_INSTR = OTY.produce_instr;
const MODEL_TITLE = OTY.model_title;
const MODEL = [["Fiona", esc(OTY.read.hidden)], ["You", md(OTY.model)]];

const TASKS = [
  {id:"r1", topic:"ben", sec:"Revision", title:"Ben's video: the missing words", meta:"2 parts · with the glossary, then without", kind:"steps", min:12,
   steps:[...dlgPair(GAPS.ben1, true), ...dlgPair(GAPS.ben2, false)]},
  {id:"e1", topic:"ben", sec:"Extension", title:"Rewrite it, then say what you'd say", meta:"10 sentences + 12 situations", kind:"steps", min:15,
   steps:practiceSteps(PRACTICE_DATA.practice)},
  {id:"e2", topic:"ben", sec:"Extension", title:"Fiona and Nadia: a video call", meta:"a video call in 4 parts · with the glossary, then without", kind:"steps", min:20,
   steps:[...dlgPair(GAPS.arc1a, true), ...dlgPair(GAPS.arc1b, false), ...dlgPair(GAPS.arc2a, false), ...dlgPair(GAPS.arc2b, false)]},
  /* the listening slot (the AL chat): two fixed quizzes until the step quiz has its ladders */
  {id:"b2_1", topic:"ben", sec:"Extension", title:"Ben, part 1: at first, the problem was…", meta:"7 short clips · 7 gaps", kind:"steps", min:4, tqLink:TQ.tqLink.B2_1, tq:TQ.tq.B2_1, steps:listenSteps(TQ.B2_1)},
  {id:"b2_2", topic:"ben", sec:"Extension", title:"Ben, part 2: get out of the house, you name it…", meta:"7 short clips · 8 gaps", kind:"steps", min:4, tqLink:TQ.tqLink.B2_2, tq:TQ.tq.B2_2, steps:listenSteps(TQ.B2_2)},
  {id:"otu", topic:"ben", sec:"Over to you!", title:OTY.title, meta:"Read a chat · plan · write or record", kind:"steps", min:12,
   steps:[Object.assign({checkLabel:"Show Fiona's message"}, OTU_READ()), {type:"task"}, {type:"plan"}, {type:"produce"}]},
  /* her 13.11 20:20: part 3 only as an optional block «if you want more» — not in the time */
  {id:"more", topic:"ben", sec:"If you want more", title:"Ben's video, part 3 — then rewrite and say", meta:"the end of Ben's video · 4 sentences + 4 situations", kind:"steps", optional:true,
   steps:[{type:"dlg", intro:GAPS.ben3.intro, lines:GAPS.ben3.lines, gloss:GAPS.ben3.gloss, instr:DLG_WITH},
          {type:"dlg", intro:"Now without the glossary.", lines:GAPS.ben3.lines, instr:DLG_WITHOUT},
          ...practiceSteps(PRACTICE_DATA.more)]}
];

const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = BOX;
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
