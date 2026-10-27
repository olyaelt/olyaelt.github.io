const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = {};
const TQ = __TQ__;   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-14";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 14.10 homework (deck "Lessons 4–5", slides 90–108 and the summary on slide 89; TubeQuizard quizzes 1–3) ---------- */
const LESSON = { date:"14.10.26", sub:"" };
/* the box on slides 33 / 89–108 and the green row of the spreadsheet */
const BOX_SHARE = `
  <h4>START THE CONVERSATION</h4>
  <p><b>Did you hear about</b> the petrol station?</p>
  <p><b>You won't believe</b> what happened!</p>
  <h4>USE SHORT REPLIES</h4>
  <p><b>Did you hear</b> — Yes, I did! / No, what happened?</p>
  <h4>SHARE A REACTION ↘</h4>
  <p>It's awful, <b>isn't it</b>? — It really <b>is</b>!</p>
  <p>That's scary, <b>isn't it</b>? — It <b>is</b>!</p>
  <h4>SHOW CONCERN AND ASK</h4>
  <p>Oh no! That's awful! <b>Did they take</b> anything?</p>
  <p class="small">or: When did it happen? / Are you OK?</p>
  <h4>EMOTIONS</h4>
  <p>It's <b>awful · scary · crazy · a shame · a nightmare · a relief</b>, isn't it?</p>`;
/* the smaller box on slides 99–107 */
const BOX_SMALL = `<p><b>awful</b></p><p><b>scary</b></p><p><b>crazy</b></p><p><b>a shame</b></p><p><b>a nightmare</b></p><p><b>a relief</b></p>`;
/* the summary on slide 89 */
const BOX_RU = `
  <h4>ЧТО ХОЧЕТСЯ СКАЗАТЬ В ЭТОЙ СИТУАЦИИ</h4>
  <p>${ru("Вообще ужас.")} → It's <b>awful</b>, isn't it?</p>
  <p>${ru("Вообще жуть.")} → It's <b>scary</b>, isn't it?</p>
  <p>${ru("Вообще с ума сойти.")} → It's <b>crazy</b>, isn't it?</p>
  <p>${ru("Жалко, конечно.")} → It's <b>a shame</b>, isn't it?</p>
  <p>${ru("Замучились уже с этим лифтом.")} → It's <b>a nightmare</b>, isn't it?</p>
  <p>${ru("Ну хоть нашёлся! Уже хорошо.")} → That's <b>a relief</b>, isn't it?</p>
  <p>${ru("Ты не поверишь!")} → <b>You won't believe</b> what happened!</p>
  <p class="small">In Russian we say something like «Вообще ужас», «Жалко, конечно» — we don't ask anything but we <b>do</b> expect a reply. In English, you can add <b>a tag question</b> when you're sharing your emotions. Your voice goes down: It's awful, ↘ isn't it? Тэг не обязателен: I know. It's awful. — тоже делится эмоцией.</p>
  <p class="small">BrE → AmE: petrol station → gas station · lift → elevator · parcel → package</p>
  <p class="small">You should be ashamed of yourself!</p>`;
const TOPICS = [
  {id:"news", title:"Did you hear about…?", sub:"Reacting to news: share a feeling, or react and ask", box:()=>BOX_SHARE + BOX_RU}
];

/* ---------- slides 90–108: share a feeling, or react and ask? ---------- */
const BOTH = `<span class="pp">You both know → share</span>`, NEWS = `<span class="ps">It's news to you → react + ask</span>`;
const SHARE = [
  {i:"Share a feeling, or react and ask? Use a word from the Useful language box. Say your reply aloud, then tap Check.",
   ctx:"You and Tom have both read the chat.", a:"Did you hear about the petrol station? The guy had a knife!",
   hint:`<span class="a">[short reply]</span> <span class="s">[share a reaction]</span>`,
   sit:"Then Tom shares a reaction too: “[…]. I buy my coffee there every morning!” What do you both say?",
   s:"I did! It's scary, isn't it?", next:"It really is. I buy my coffee there every morning!", nextHtml:`<span class="pp">It really is</span>. I buy my coffee there every morning!`, notes:[BOTH + " · or: awful / crazy"]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't read the chat.", a:"You won't believe what happened! My bike disappeared from the courtyard!",
   hint:`<span class="s">[a short emotional reaction]</span> <span class="a">[a question]</span>`,
   s:"Oh no! That's awful!", q:"When did it happen?", next:"On Saturday. I only left it there for an hour!", notes:[NEWS]},
  {i:"Share a feeling, or react and ask?", ctx:"You and a neighbour have both read in the chat that someone smashed the new benches in the park.",
   a:"Did you see the benches?", s:"I did. It's a shame, isn't it?", next:"It really is. They were only put in last month!", notes:[BOTH]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't read the chat.", a:"You won't believe what happened! Someone tried to get into my flat last night!",
   s:"Oh no! That's so scary!", q:"Are you OK?", next:"I'm fine. I just didn't sleep much.", notes:[NEWS]},
  {i:"A smaller box now. Share a feeling, or react and ask?", ctx:"You and Ben have both read about another break-in in the chat.",
   a:"Did you see the chat? Another break-in!", s:"I know! It's crazy, isn't it?", next:"It is! That's the third one this month!", notes:[BOTH + " · or: awful"]},
  {i:"Share a feeling, or react and ask?", ctx:"The lift has been broken all week. You meet a neighbour on the stairs. You're both out of breath.",
   a:"Six floors again!", s:"It's a nightmare, isn't it?", next:"It really is. And I've got three bags of shopping!", notes:[BOTH + " · or: awful"]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't heard anything about it.", a:"You won't believe what happened! My neighbour got pickpocketed on the tram!",
   s:"Oh no, that's awful!", q:"What did they take?", next:"Her phone and her wallet.", notes:[NEWS]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't heard anything about it.", a:"You won't believe what happened! Someone stole a parcel from outside my door!",
   s:"Oh no, what a nightmare!", q:"What was in it?", next:"A birthday present for my wife!", notes:[NEWS + " · or: that's awful"]},
  {i:"Share a feeling, or react and ask?", ctx:"You and Ben have both read Lucy's update: her son had borrowed the bike.",
   a:"Did you see Lucy's update?", s:"I did! That's a relief, isn't it?", next:"It really is! She was so worried. Teenagers!", notes:[BOTH]}
];

/* ---------- Over to you (spreadsheet: one or two short conversations about recent news) ---------- */
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>Write one or two short conversations you might have about recent news.</p>
        <ul>
          <li>a conversation starter (e.g. <i>Did you hear about…?</i>)</li>
          <li>short replies and reactions (<i>Oh no! · It really is. · I did.</i>)</li>
          <li>1–2 tag questions to share a feeling</li>
          <li>1–2 questions to show concern or find out more</li>
        </ul>`;
const PLAN_INSTR = "Tap the phrases you'll use — three or four are enough.";
const PRODUCE_INSTR = "Write your conversation(s) — both parts. Then send them to Olya. (Prefer to talk? Tap Record it.)";
const MAP = [
  {h:"Start the conversation", items:[["<b>Did you hear about</b> …?","ты слышал про…?"],["<b>You won't believe</b> what happened!","ты не поверишь!"]]},
  {h:"Short replies", items:[["Yes, <b>I did!</b> / No, <b>what happened?</b>","да! / нет, а что случилось?"],["It <b>really is</b>! / It <b>is</b>!","ещё бы!"]]},
  {h:"Share a reaction ↘", items:[["It's awful, <b>isn't it</b>?","вообще ужас"],["That's scary, <b>isn't it</b>?","вообще жуть"],["It's a shame, <b>isn't it</b>?","жалко, конечно"],
    ["That's a relief, <b>isn't it</b>?","ну хоть так, уже хорошо"]]},
  {h:"Show concern and ask", items:[["Oh no! That's awful! <b>Did they take</b> anything?","кошмар! а что-нибудь взяли?"],["<b>When did it happen?</b>","когда это случилось?"],["<b>Are you OK?</b>","ты в порядке?"]]}
];

const TASKS = [
  {id:"share-ask", topic:"news", sec:"Revision", title:"Share a feeling, or react and ask?", meta:"9 short conversations", kind:"steps",
   steps:SHARE.map((s,i)=>({type:"share", s, box: i < 4 ? BOX_SHARE : BOX_SMALL, boxAfter: BOX_SHARE}))},
  {id:"tq1", topic:"news", sec:"Extension", title:"Listening: It's a shame, isn't it?", meta:"6 short clips from real videos", kind:"steps",
   steps:TQ.q1.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"tq2", topic:"news", sec:"Extension", title:"Listening: positive feelings — It's amazing, isn't it?", meta:"6 short clips from real videos", kind:"steps",
   steps:TQ.q2.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"tq3", topic:"news", sec:"Extension", title:"Listening: agreeing — It really is!", meta:"7 short clips from real videos", kind:"steps",
   steps:TQ.q3.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"write", topic:"news", sec:"Over to you!", title:"Your conversations about the news", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const TENSES = "";
const MODEL = [];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
