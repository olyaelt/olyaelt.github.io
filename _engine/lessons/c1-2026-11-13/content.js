const STICKER = "__STICKER__";
const R1 = __R1__;      /* r1: Ben's video from the lesson (The Intern), three parts, each with the glossary → without */
const E1 = __E1__;      /* e1: the group chat «Rick hands over the store», four parts with the glossary → without, then the phrases' places */
const E2 = __E2__;      /* e2: six rewrites, then six situations */
const OTY = __OTY__;
const TQ = __TQ__;      /* C1_1, C1_2: the two listening quizzes from the AL chat (handoff 2026-11-14_1210, her clip order of 10:39–10:40), the subtitles' capitals made normal;
                           tqLink: her TubeQuizard copy of each quiz; tq: the same quiz there for a student. No «for later» quiz (her 13:13). */    /* Over to you: Nina's reply (the friend's message hidden), the task, the plan */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
/* her 14.11 11:36: in her lists this homework goes by its own name, not by its topics (engine 63 SHOW_TITLE) */
const SHOW_TITLE = true;
const PAGE_KEY = "hw-ge-c1-2026-11-13";
const JOIN_PUNCT = true;

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const md = (s, cls) => esc(s).replace(/\*\*(.+?)\*\*/g, (_, x) => cls ? `<b class="${cls}">${x}</b>` : `<b>${x}</b>`);   /* **bold** in the TZ's texts */

/* ---------- content of this page: C1 lesson 10 homework, Fri 13.11.26 → Wed 18.11 (big), from the C1 lesson chat's TZ
   (box handoff 2026-11-14_1000_lesson-C1__to_engine__homework-1311-come-rain-or-shine, the 11:00 version) ---------- */
const LESSON = { date:"13.11.26", sub:"" };

/* the topic box: Ben's STORY box from the lesson page (as on her slides) + four phrases the group stumbled on */
const BOX_BEN = `<h4>BEN'S STORY</h4>
<p><b>At first</b>, I <b>enjoyed</b> it.</p>
<p><b>The problem was</b>, …</p>
<p><b>no matter where</b> I went</p>
<p>… <b>hit me like a ton of bricks</b>.</p>
<p>Golf, books — <b>you name it</b>.</p>
<p>Believe me, <b>I've tried</b> everything.</p>
<p><b>These days</b>, I'm at my Starbucks by 7:15.</p>
<h4>PEOPLE</h4>
<p><b>Mind if</b> I join you? — No, go ahead.</p>
<p>I <b>rely on</b> <span class="ipa">/rɪˈlaɪ/</span> my phone more than I should.</p>
<p><b>Don't get me wrong</b>, …</p>
<h4>ALSO FROM BEN'S VIDEO</h4>
<p>I've got (some) <b>time on my hands</b> <i class="ru">свободное время, которое нечем занять</i></p>
<p>Get up, <b>get out of the house</b>, and go somewhere. <i class="ru">выбраться из дома (go out — чаще «развлечься»)</i></p>
<p><b>Can't explain it, but</b> it <b>makes me feel part of something</b>. <i class="ru">не могу объяснить почему, но… · чувствую себя частью чего-то</i></p>
<p>I'm not an unhappy person. <b>Quite the contrary.</b> <i class="ru">как раз наоборот</i></p>`;

const TOPICS = [
  {id:"ben", title:"The Intern: Ben's video", sub:"Ben's video once more — then the same phrases in a new chat.", box:()=>BOX_BEN}
];

/* r1 and e1: the step's intro is its instruction (as on 06.11); the notes after «Show the answers» */
const DLG = st => Object.assign({}, st, {intro: "", instr: st.intro || st.instr || "", note: st.note ? md(st.note) : ""});
const R1_STEPS = R1.steps.map(DLG);
/* e1, the last step «Same phrases, new places»: the table as lines with the existing mechanics (the TZ's fallback) — the phrase, where we
   met it, and «in the chat» behind a yellow box, opened by a tap like a gap */
const TABLE = st => ({type: "dlg", instr: st.intro, lines: st.rows.map(r => ({s: "", p: [{b: r[0]}, ` — ${r[1]} → in the chat: `, {f: "", r: r[2]}]}))});
const E1_STEPS = E1.steps.map(st => st.type === "table" ? TABLE(st) : DLG(st));
/* e2: six rewrites (typed, the accepted answers), then six situations (the box behind «Stuck? Peek»), as on 06.11 e3 */
const E2_STEPS = E2.steps.map(st => st.type === "rewrite"
  ? {type: "rewrite", instr: st.instr, box: BOX_BEN, boxState: "folded", r: {o: st.o, k: st.k, pre: st.pre, post: st.post, a: st.a, acc: st.acc, n: st.n ? md(st.n) : ""}}
  : {type: "sayit", instr: st.instr, box: BOX_BEN, boxState: st.box_state || "folded", s: {html: true, rows: [[esc(st.sit), md(st.ans, "g")]], note: st.note ? md(st.note) : ""}});

const listenSteps = clips => clips.map((clip, i) => ({type:"listen", clip, first:i===0}));
const TASKS = [
  {id:"r1", topic:"ben", sec:"Revision", title:"Ben's video: say it the way Ben does", meta:"3 parts · with the glossary, then without", kind:"steps", min:15, steps:R1_STEPS},
  {id:"e1", topic:"ben", sec:"Extension", title:"Rick hands over the store: a group chat", meta:"a group chat in 4 parts · with the glossary, then without · the phrases' places", kind:"steps", min:20, steps:E1_STEPS},
  {id:"e2", topic:"ben", sec:"Extension", title:"Say it another way — then what would you say?", meta:"6 rewrites · 6 situations", kind:"steps", min:10, steps:E2_STEPS},
  {id:"c1_1", topic:"ben", sec:"Extension", title:"Ben's phrases out there", meta:"9 short clips · 11 gaps", kind:"steps", min:7, tqLink:TQ.tqLink.C1_1, tq:TQ.tq.C1_1, steps:listenSteps(TQ.C1_1)},
  {id:"c1_2", topic:"ben", sec:"Extension", title:"Get out or go out?", meta:"8 short clips · 8 gaps", kind:"steps", min:6, tqLink:TQ.tqLink.C1_2, tq:TQ.tq.C1_2, steps:listenSteps(TQ.C1_2),
   /* her rule (14.11), folded under the instruction on every clip (engine 87) */
   rule:{h:"Go out or get out?", html:"<b>go out</b> = leave home to do something, there's a reason: <i>go out for dinner, go out with friends, go out for a walk</i>.<br><b>get out (of the house)</b> = the point is to stop sitting at home: <i>I really need to get out of the house today.</i>"}},
  {id:"otu", topic:"ben", sec:"Over to you!", title:OTY.title, meta:"Read a chat · plan · write or record", kind:"steps", min:12,
   steps:[Object.assign({checkLabel:"Show the message"}, OTU_READ()), {type:"task"}, {type:"plan"}, {type:"produce"}]}
];

/* Over to you: Nina's reply first (the friend's message hidden: guess it), then the task */
function OTU_READ(){
  const parts = []; String(OTY.read.reply).split(/(\*\*.+?\*\*)/).forEach(x => { if(!x) return; const m = x.match(/^\*\*(.+)\*\*$/); parts.push(m ? {b: m[1]} : x); });
  return {type: "dlg", intro: OTY.read.intro, lines: [{s: "Friend", p: [{f: "", r: OTY.read.hidden}]}, {s: "Nina", p: parts}]};
}
const TASK_HTML = `
<p class="task-h">Your task</p>
<p>${esc(OTY.task)}</p>
<p class="small">Write it or record it.</p>`;
const MAP = OTY.map.map(p => ({h: p.part, items: p.items.map(x => [esc(x).replace(/'/g, "&#x27;"), ""])}));
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = false;
const PICK_MIN = 0;
const PLAN_INSTR = OTY.plan_instr;
const PRODUCE_PH = "Ha, it's been ages! …";
const PRODUCE_INSTR = OTY.produce_instr;
const MODEL_TITLE = "Nina's reply";
const MODEL = [["Friend", esc(OTY.read.hidden)], ["Nina", md(OTY.read.reply)]];

const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = BOX_BEN;
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
