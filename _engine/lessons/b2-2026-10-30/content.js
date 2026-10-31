const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const SORT = __SORT__;   /* task 2: say it, then sort it into its pattern (engine 49) */
const ARC = __ARC__;     /* tasks 4–5: the arc text, two chats, already cut into screens */
const OTU = __OTU__;     /* Over to you (TZ fixes 31.10 12:30): READ = the chat to read first (Sam's question is one hidden gap), TASK, MAP, MODEL */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-30";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework 30.10.26 → Wed 4.11 (big), from the lesson chat's TZ of 31.10 (box handoff 2026-10-31_1100)
   + her read-through fixes (handoff 2026-10-31_1230: sort in English, rewrites, topic 2, Over to you starts with reading the chat) ---------- */
const LESSON = { date:"30.10.26", sub:"" };
const REWRITE = [
  {"o": "Sorry, Tuesday's tricky for me. Can we meet on Thursday instead?", "k": "MAKE", "pre": "Sorry, Tuesday's tricky for me. ", "post": " instead?", "a": "Could we make it Thursday", "acc": ["Could we make it Thursday", "Can we make it Thursday", "Could we make it on Thursday", "Can we make it on Thursday", "Can you make Thursday", "Could you make Thursday", "Can you make it on Thursday", "Could you make it on Thursday"], "n": "= можем перенести на четверг? (it = встреча) · Could — чуть мягче, Can — тоже нормально · на уроке, когда переносили созвоны, эту фразу почти не говорили (вместо неё: Can we move…? / I suggest…) · or: Can you make Thursday? — а ты сможешь в четверг? (make = прийти, успеть; без it)"},
  {"o": "Checking work emails late at night doesn't help at all — it just makes things worse.", "k": "HARM", "pre": "Checking work emails late at night ", "post": ".", "a": "does more harm than good", "acc": ["does more harm than good", "just does more harm than good", "does far more harm than good", "does a lot more harm than good", "does much more harm than good"], "n": "= приносит больше вреда, чем пользы · does — глагол, с -s, как it does · or: does far more harm than good"},
  {"o": "I started learning Spanish on an app, but I stopped after two weeks.", "k": "UP", "pre": "I started learning Spanish on an app, but I ", "post": " two weeks.", "a": "gave up after", "acc": ["gave up after", "gave it up after", "gave up on it after"], "n": "= бросил(а) через две недели · or: gave it up after"},
  {"o": "I watched my favourite childhood cartoon again. Some of the jokes feel really awkward now.", "k": "AGED", "pre": "I rewatched my favourite childhood cartoon. Some of the jokes ", "post": ".", "a": "haven't aged well", "acc": ["haven't aged well", "haven't aged very well", "haven't really aged well", "really haven't aged well", "haven't aged that well", "didn't age well", "have aged badly"], "n": "= сегодня смотрятся неловко: время и культура ушли вперёд, а шутки остались (не просто «старомодные») · the jokes — haven't, one joke — hasn't · aged /eɪdʒd/ — один слог"}
];

const BOX_REC = `
  <h4>RECOMMEND + WHAT</h4>
  <p><b>I'd recommend it.</b> <i class="ru">советую</i> · recommend <span class="ipa">/ˌrekəˈmend/</span></p>
  <p><b>I'd recommend</b> Wednesday.</p>
  <p><b>I wouldn't recommend it.</b> <i class="ru">не советую</i></p>
  <p><b>So you wouldn't recommend it?</b> <i class="ru">значит, не советуешь?</i></p>
  <p><b>Can you recommend anything?</b> <i class="ru">можешь что-нибудь посоветовать?</i></p>
  <p><b>What would you recommend?</b> <i class="ru">что посоветуешь?</i></p>
  <h4>WHO? WITH TO</h4>
  <p>A friend <b>recommended it to me</b>. <i class="ru">мне посоветовал друг</i></p>
  <p class="small">не: <s>recommend you it</s> · <s>recommend to see</s></p>`;

const BOX_AGAIN = `
  <h4>CHANGING THE CLOCKS</h4>
  <p><b>Just a heads-up:</b> … <i class="ru">просто предупреждаю</i> → <b>Thanks for the heads-up!</b></p>
  <p><b>The clocks go back</b> tonight. · <b>the clock change</b> <i class="ru">перевод часов</i></p>
  <p>It'll be <b>an hour later for you</b> — six <b>my time</b>, two <b>your time</b>.</p>
  <p><b>Does that still work for you?</b></p>
  <p><b>Could we make it</b> two? <i class="ru">можем перенести на…?</i></p>
  <p><b>I already have something at that time.</b></p>
  <p>It really <b>affects my sleep</b>. <i class="ru">без on</i> · It <b>does more harm than good</b>.</p>
  <h4>SERIES</h4>
  <p>Everyone <b>keeps going on about it</b>. <i class="ru">без конца твердят</i></p>
  <p><b>Is it any good?</b> · <b>It's so worth it!</b> worth <span class="ipa">/wɜːθ/</span></p>
  <p>I've <b>only seen bits of it</b>. <i class="ru">видел(а) только куски</i></p>
  <p>I <b>gave up after</b> episode two. <b>I couldn't get into it.</b></p>
  <p>It really <b>picks up</b> in episode three. <i class="ru">потом интереснее</i></p>
  <p>The acting's great, <b>I'll give it that</b>. <i class="ru">это надо признать</i></p>
  <p><b>I'll give it a try.</b> <i class="ru">попробую</i> · The jokes <b>haven't aged well</b>. aged <span class="ipa">/eɪdʒd/</span></p>
  <h4>CRIME</h4>
  <p>Someone <b>pretending to be</b> from the bank. <i class="ru">выдавая себя за</i></p>
  <p><b>There's a scam going around.</b> <i class="ru">ходит такой развод</i> · <b>Case closed!</b></p>`;

const TASK_HTML = `
<p class="task-h">Your task</p>
<p>Now it's your turn. A friend asks you the same question:</p>
<p><b>“I've got a 10-hour flight on Saturday 😩 What should I watch? Any recommendations?”</b></p>
<p>Write your reply: recommend one or two things, and mention one you wouldn't recommend.</p>
<p class="small">Write it or record it.</p>`;
const MAP = OTU.MAP;
const MAP_NUMBERED = true;
const TENSES = "";
const PICK_EACH = true;
const PLAN_INSTR = "Tap the phrases you'll use — at least one from each part.";
const PRODUCE_INSTR = "Write your reply to your friend. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const MODEL_TITLE = "The chat you've just read";
const MODEL = OTU.MODEL;   /* the same chat, with Sam's lines */


const TOPICS = [
  {id:"rec", title:"So you wouldn't recommend it?", sub:"Recommending series, books and places — and asking for tips", box:()=>BOX_REC},
  {id:"again", title:"Revision topics: changing the clocks, series, crime", sub:"The phrases from our last lessons in new stories", box:()=>BOX_AGAIN}
];
const ARC_NEXT = "Say each missing bit, then tap to check.";
const arcSteps = (steps, first) => steps.map((st, i) => Object.assign({}, st, {instr: i === 0 ? first : ARC_NEXT, box: BOX_AGAIN}));

/* Over to you sits under topic 2 so that it comes last on the home screen (the TZ: "keep Over to you last anyway", it uses both boxes) */
const TASKS = [
  {id:"rev", topic:"rec", sec:"Revision", title:"Any recommendations? Three exchanges from class", meta:"With the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:GAPS.rev.intro, lines:GAPS.rev.lines, gloss:GAPS.rev.gloss, instr:"Say the missing words. Then tap the yellow and orange boxes to check."},
          {type:"dlg", lines:GAPS.rev.lines, instr:"Now without the glossary."}]},
  {id:"sort", topic:"rec", sec:"Extension", title:"Recommend: English patterns vs Russian", meta:"8 sentences · 4 patterns", kind:"steps",
   steps:[{type:"sort", data:SORT}]},
  {id:"rewrite", topic:"again", sec:"Extension", title:"Rewrite the sentence with our phrase", meta:"4 sentences", kind:"steps",
   steps:REWRITE.map((r,i)=>({type:"rewrite", r, first:i===0, box:BOX_AGAIN}))},
  {id:"arc-1", topic:"again", sec:"Extension", title:"A call across time zones: the clocks change", meta:"7 gaps · 2 screens", kind:"steps", steps:arcSteps(ARC.part1, ARC.instr1)},
  {id:"arc-2", topic:"again", sec:"Extension", title:"The family chat: a series about scams", meta:"9 gaps · 3 screens", kind:"steps", steps:arcSteps(ARC.part2, ARC.instr2)},
  {id:"write", topic:"again", sec:"Over to you!", title:"What should I watch on a 10-hour flight?", meta:"Read a chat · plan · write and send", kind:"steps", min:14,
   steps:[Object.assign({checkLabel:"Show Sam's question"}, OTU.READ), {type:"task"}, {type:"plan"}, {type:"produce"}]}
];

const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
