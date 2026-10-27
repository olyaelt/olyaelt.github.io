const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-07";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 07.10 homework (deck "Lesson 3", slides 39 and 42–43; boxes on slides 36 and 39) ---------- */
const LESSON = { date:"07.10.26", sub:"" };
/* slide 39 and the green row "Replying in chats" */
const BOX_REPLIES = `
  <h4>SOMEONE IS LATE</h4>
  <p><b>No worries!</b> ${ru("ничего страшного")}</p>
  <p><b>OK, no worries!</b> ${ru("хорошо, не страшно")}</p>
  <p><b>No rush.</b> ${ru("не спеши / можешь не торопиться")}</p>
  <p><b>Join when you can!</b> ${ru("подключайся (онлайн)")}</p>
  <p><b>See you soon!</b> ${ru("до скорого")}</p>
  <p><b>Thanks for the heads-up!</b> ${ru("спасибо, что предупредил(а)")}</p>
  <p><b>Thanks for letting me know!</b> ${ru("спасибо, что написал(а)")}</p>
  <h4>SOMEONE SENDS OR SUGGESTS SOMETHING</h4>
  <p><b>Got it, thanks!</b> ${ru("получил(а), спасибо")}</p>
  <p><b>Great, thanks!</b> ${ru("отлично, спасибо")}</p>
  <p><b>Sounds good!</b> ${ru("отлично, договорились")}</p>
  <p><b>Sure, … works for me!</b> ${ru("да, мне подходит")}</p>
  <p class="small">OK. / Fine. одни в чате могут звучать холодно, а Fine. — даже раздражённо. That's fine! / Fine by me! — нормально.</p>`;
/* slide 36 and the green row */
const BOX_TAGS = `
  <h4>+ SENTENCE → − TAG</h4>
  <p>It's been ages, <b>hasn't it</b>?</p>
  <p>You went to Italy, <b>didn't you</b>?</p>
  <p>The food there is amazing, <b>isn't it</b>?</p>
  <h4>− SENTENCE → + TAG</h4>
  <p>I can't complain, <b>can I</b>?</p>
  <p>You haven't been there, <b>have you</b>?</p>
  <h4>WHICH VERB?</h4>
  <p><b>is / are / has / can / will</b> → the same verb</p>
  <p>it's (= it <b>is</b>) → <b>isn't it</b> · it's been (= it <b>has</b>) → <b>hasn't it</b></p>
  <p>no auxiliary → <b>do / does / did</b>: you live → <b>don't you</b> · you went → <b>didn't you</b></p>
  <h4>+ DISAGREE?</h4>
  <p>It's been ages, <b>hasn't it</b>? — Well, actually… · No, we went to Spain, actually. · I have, actually.</p>`;
const TOPICS = [
  {id:"replies", title:"Replying in chats", sub:"Warm, friendly replies instead of a cold OK or Fine", box:()=>BOX_REPLIES},
  {id:"tags", title:"I can't complain, can I?", sub:"Tag questions in a catch-up chat", box:()=>BOX_TAGS}
];

/* ---------- the practice from the deck ---------- */
/* slide 39: make the replies warmer */
const WARMER = {html:true, note:"Many answers are possible.", rows:[
  ["Tom: Just a heads-up — I'll be 10 minutes late.<br><i>OK.</i> →", "No worries! See you soon!"],
  ["Lena: My last meeting is running over — start the call without me!<br><i>Fine.</i> →", "OK, no rush. Join when you can!"],
  ["A colleague: I've just sent you the file.<br><i>OK.</i> →", "Got it, thanks!"],
  ["A friend: Can we meet at 7 instead of 6?<br><i>OK.</i> →", "Sure, 7 works for me!"]]};

const TASKS = [
  {id:"warm-replies", topic:"replies", sec:"Revision", title:"Make the replies warmer", meta:"4 chat replies", kind:"steps", min:3,
   steps:[{type:"sayit", s:WARMER, box:BOX_REPLIES, boxAlways:true,
     instr:"Make the replies warmer. Use the box. Say your reply aloud, then tap the yellow boxes to check."}]},
  {id:"tags-chat", topic:"tags", sec:"Extension", title:"Catching up with Anna: tenses and tags", meta:"1 dialogue", kind:"steps", min:5,
   steps:[{type:"dlg", lines:GAPS.anna,
     intro:"PP — новость, опыт, период до сейчас · PS — законченное время, детали · PPC — действие до сейчас (since, for) · (tag): + → −, − → +",
     note:"(3) since + действие до сейчас → present perfect continuous · (6) still haven't = до сих пор не<br>(8) this year ещё идёт → present perfect · (9), (10) in August, детали → past simple · (11) there are → aren't there",
     instr:"Present perfect, past simple or present perfect continuous? Add the tags. Say the missing words, then tap Show the answers."}]}
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
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
