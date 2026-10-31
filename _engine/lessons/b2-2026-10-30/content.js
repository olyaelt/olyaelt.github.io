const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const SORT = __SORT__;   /* task 2: say it, then sort it into its pattern (engine 49) */
const ARC = __ARC__;     /* tasks 4–5: the arc text, two chats, already cut into screens */
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

/* ---------- content of this page: B2 homework 30.10.26 → Wed 4.11 (big), from the lesson chat's TZ of 31.10 (box handoff 2026-10-31_1100) ---------- */
const LESSON = { date:"30.10.26", sub:"" };
const REWRITE = [
  {"o": "Sorry, Tuesday's tricky for me. Can we meet on Thursday instead?", "k": "MAKE", "pre": "Sorry, Tuesday's tricky for me. ", "post": " instead?", "a": "Could we make it Thursday", "acc": ["Could we make it Thursday", "Can we make it Thursday", "Could we make it on Thursday", "Can we make it on Thursday"], "n": "= можем перенести на четверг? · Could we make it + день или время? — то, что мы забываем на созвонах"},
  {"o": "Checking work emails late at night doesn't help at all — it just makes things worse.", "k": "HARM", "pre": "Checking work emails late at night ", "post": ".", "a": "does more harm than good", "acc": ["does more harm than good", "just does more harm than good", "does far more harm than good", "does a lot more harm than good", "does much more harm than good"], "n": "= больше вреда, чем пользы · checking … does — с -s, как it does · or: does far more harm than good"},
  {"o": "I started learning Spanish on an app, but I stopped after two weeks.", "k": "UP", "pre": "I started learning Spanish on an app, but I ", "post": " two weeks.", "a": "gave up after", "acc": ["gave up after", "gave it up after", "gave up on it after"], "n": "= бросил(а) через две недели · or: gave it up after"},
  {"o": "I watched my favourite childhood cartoon again, and it feels really old-fashioned now.", "k": "AGED", "pre": "I rewatched my favourite childhood cartoon. It ", "post": ".", "a": "hasn't aged well", "acc": ["hasn't aged well", "hasn't aged very well", "hasn't really aged well", "really hasn't aged well", "hasn't aged that well", "didn't age well", "has aged badly"], "n": "= устарел, смотрится уже не так · aged /eɪdʒd/ — один слог"}
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
  <h4>CALLS &amp; CLOCKS</h4>
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
  <p><b>I'll give it a try.</b> <i class="ru">попробую</i> · It <b>hasn't aged well</b>. aged <span class="ipa">/eɪdʒd/</span></p>`;

const TASK_HTML = `
<p class="task-h">Your task</p>
<p>Your friend writes:</p>
<p><b>“I've got a 10-hour flight on Saturday 😩 What should I watch? Any recommendations?”</b></p>
<p>Write your reply: recommend one or two things, and mention one you wouldn't recommend.</p>
<p class="small">Write it or record it.</p>`;
const MAP = [
 {
  "h": "React",
  "items": [
   [
    "<b>Ten hours?! Poor you!</b>",
    "десять часов?! бедняга!"
   ],
   [
    "<b>Lucky you! Where are you going?</b>",
    "везёт! куда летишь?"
   ]
  ]
 },
 {
  "h": "Recommend",
  "items": [
   [
    "<b>I'd really recommend</b> …",
    "очень советую…"
   ],
   [
    "<b>A friend recommended it to me</b>, and I loved it.",
    "мне посоветовал друг — и мне очень понравилось"
   ],
   [
    "It's slow at first, but it <b>really picks up</b> in episode …",
    "сначала медленно, потом становится интереснее"
   ],
   [
    "<b>It's really worth watching.</b>",
    "его правда стоит посмотреть"
   ],
   [
    "<b>Give it a try!</b>",
    "попробуй!"
   ]
  ]
 },
 {
  "h": "Not that one",
  "items": [
   [
    "<b>Honestly, I wouldn't recommend</b> …",
    "честно, не советую…"
   ],
   [
    "Everyone <b>keeps going on about</b> …, but <b>honestly? I wouldn't bother.</b>",
    "все о нём без конца твердят, но честно? не трать время"
   ],
   [
    "<b>It's not as good as everyone says.</b>",
    "не так хорош, как говорят"
   ],
   [
    "The acting's great, <b>I'll give it that</b>, but …",
    "актёры отличные, это надо признать, но…"
   ],
   [
    "<b>I couldn't get into it.</b> I <b>gave up after</b> episode …",
    "не смог(ла) втянуться, бросил(а) после … серии"
   ]
  ]
 },
 {
  "h": "Finish",
  "items": [
   [
    "<b>Let me know what you think!</b>",
    "напиши, как тебе!"
   ],
   [
    "<b>Have a good flight!</b>",
    "хорошего полёта!"
   ]
  ]
 }
];
const MAP_NUMBERED = true;
const TENSES = "";
const PICK_EACH = true;
const PLAN_INSTR = "Tap the phrases you'll use — at least one from each part.";
const PRODUCE_INSTR = "Write your reply to your friend. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const MODEL_TITLE = "A possible answer (yours can be different, of course!)";
const MODEL = [
 [
  "Friend",
  "I've got a 10-hour flight on Saturday 😩 What should I watch? Any recommendations?"
 ],
 [
  "You",
  "<b>Ten hours?! Poor you!</b> 😅"
 ],
 [
  "You",
  "<b>I'd really recommend</b> Ward Nine. It's a comedy about doctors in a tiny hospital, and the episodes are only 25 minutes long, so you can watch loads of them. It's a bit slow at first, but it <b>really picks up</b> in episode three. <b>A friend recommended it to me</b>, and I loved it."
 ],
 [
  "You",
  "Everyone <b>keeps going on about</b> The Last Lighthouse, but <b>honestly, I wouldn't recommend it.</b> The scenery's beautiful, <b>I'll give it that</b>, but I just <b>couldn't get into it</b>. I <b>gave up after</b> episode two."
 ],
 [
  "You",
  "<b>Have a good flight</b>, and <b>let me know what you think!</b>"
 ]
];


const TOPICS = [
  {id:"rec", title:"So you wouldn't recommend it?", sub:"Recommending series, books and places — and asking for tips", box:()=>BOX_REC},
  {id:"again", title:"Clocks, calls and series: once more", sub:"Moving a call when the clocks change, and talking about series — in new stories", box:()=>BOX_AGAIN}
];
const ARC_NEXT = "Say each missing bit, then tap to check.";
const arcSteps = (steps, first) => steps.map((st, i) => Object.assign({}, st, {instr: i === 0 ? first : ARC_NEXT, box: BOX_AGAIN}));

/* Over to you sits under topic 2 so that it comes last on the home screen (the TZ: "keep Over to you last anyway", it uses both boxes) */
const TASKS = [
  {id:"rev", topic:"rec", sec:"Revision", title:"Any recommendations? Three exchanges from class", meta:"With the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:GAPS.rev.intro, lines:GAPS.rev.lines, gloss:GAPS.rev.gloss, instr:"Say the missing words. Then tap the yellow and orange boxes to check."},
          {type:"dlg", lines:GAPS.rev.lines, instr:"Now without the glossary."}]},
  {id:"sort", topic:"rec", sec:"Extension", title:"Recommend: say it, then sort it", meta:"8 sentences · 4 patterns", kind:"steps",
   steps:[{type:"sort", data:SORT}]},
  {id:"rewrite", topic:"again", sec:"Extension", title:"Rewrite the sentence with our phrase", meta:"4 sentences", kind:"steps",
   steps:REWRITE.map((r,i)=>({type:"rewrite", r, first:i===0, box:BOX_AGAIN}))},
  {id:"arc-1", topic:"again", sec:"Extension", title:"A call across time zones: the clocks change", meta:"7 gaps · 2 screens", kind:"steps", steps:arcSteps(ARC.part1, ARC.instr1)},
  {id:"arc-2", topic:"again", sec:"Extension", title:"The family chat: a series about scams", meta:"9 gaps · 3 screens", kind:"steps", steps:arcSteps(ARC.part2, ARC.instr2)},
  {id:"write", topic:"again", sec:"Over to you!", title:"What should I watch on a 10-hour flight?", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];

const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
