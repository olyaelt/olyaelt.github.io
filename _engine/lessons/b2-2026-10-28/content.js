const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quiz: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-28";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework 28.10.26 → Fri 30.10 (small), from the lesson chat's TZ of 28.10, 23:59 (deck Lesson_9_Everyone_at_work_is_talking_about_it) ---------- */
const LESSON = { date:"28.10.26", sub:"" };
const SEEN_MAP = [
  {h:"Have you seen it?", items:[
    ["<b>Everyone's talking about it.</b>","все о нём говорят ('s = is)"],
    ["Everyone <b>keeps going on about it</b>.","без конца твердят (надоело)"],
    ["I've <b>only seen bits of it</b>.","видел(а) только отрывки"],
    ["I <b>gave up after</b> episode 3.","бросил(а) после 3-й серии"],
    ["I <b>couldn't get into it</b>.","не смог(ла) втянуться"]]},
  {h:"What's it like?", items:[
    ["It really <b>picks up</b> in episode 4.","потом становится интереснее"],
    ["It's <b>not as good as everyone says</b>.","не так хорош, как говорят"],
    ["All the <b>hype put me off</b>. <span class=\"ipa\">/haɪp/</span>","шумиха оттолкнула"],
    ["The acting's great, <b>I'll give it that</b>.","это надо признать"],
    ["Well, it <b>is</b> a crime drama!","ну это же детектив (ударение на is)"]]},
  {h:"Old favourites", items:[
    ["<b>It takes me back.</b>","как в детстве"],
    ["The jokes <b>haven't aged well</b>. <span class=\"ipa\">/eɪdʒd/</span>","устарели"],
    ["I see it <b>in a different light</b> now.","смотрю по-другому"]]},
  {h:"Should I watch it?", items:[
    ["<b>Is it any good?</b>","ну как, стоит смотреть?"],
    ["<b>Give it a try.</b>","попробуй"],
    ["<b>I wouldn't bother.</b> <span class=\"ipa\">/ˈbɒðə/</span>","не трать время (прямо)"]]}
];

const TOPICS = [
  {id:"seen", title:"Have you seen it?", sub:"Talking about series: recommend one, or warn a friend off", box:()=>mapInner(SEEN_MAP)}
];

const SAYIT = [
  {html:true, rows:[
    ["Все на работе без конца о нём твердят — уже надоело.", `Everyone at work ${g("keeps going on about it")}.`],
    ["Я бросила после третьей серии — не смогла втянуться.", `I ${g("gave up after")} episode three. I just ${g("couldn't get into it")}.`],
    ["Честно? Не так уж он хорош, как все говорят.", `Honestly? It's ${g("not as good as everyone says")}.`]],
   note:`${ru("сериал, фильм, книга — это")} <b>it</b>${ru(", не he / him / she")}<br>everyone kee<b>ps</b>, everyone sa<b>ys</b> ${ru("— с -s, как he keeps")}<br>${ru("бросила после —")} gave up after ${ru("· втянуться —")} get into it ${ru("(без into:")} I didn't get it ${ru("= не поняла)")}`},
  {html:true, rows:[
    ["Ну это же детектив! (чего ты хотел?)", `Well, it ${g("is")} a crime drama!`],
    ["Пересматриваю «Друзей» — некоторые шутки устарели.", `I've been rewatching Friends — some of the jokes ${g("haven't aged well")}.`],
    ["Я бы не стала тратить на него время.", `Honestly? ${g("I wouldn't bother")}.`]],
   note:`it <b>is</b> ${ru("— с ударением на is: «это же…»")}<br>aged ${ipa("/eɪdʒd/")} ${ru("— один слог; jokes — haven't, одна шутка — hasn't")}<br>bother ${ipa("/ˈbɒðə/")} · or: I wouldn't waste my time on it. ${ru("(waste — впустую; spend time on it — нейтрально)")}`}
];

const TASKS = [
  {id:"seen-1", topic:"seen", sec:"Revision", title:"What should I watch? (part 1): the missing words", meta:"With the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:"Dan is off sick and on a call with his colleagues. He needs something to watch.", lines:GAPS.part1.lines, gloss:GAPS.part1.gloss,
           instr:"Say the missing words. Then tap the yellow and orange boxes to check."},
          {type:"dlg", lines:GAPS.part1.lines, instr:"Now without the glossary."}]},
  {id:"seen-2", topic:"seen", sec:"Revision", title:"What should I watch? (part 2): the missing words", meta:"With the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:"The conversation goes on.", lines:GAPS.part2.lines, gloss:GAPS.part2.gloss,
           instr:"Say the missing words. Then tap the yellow and orange boxes to check."},
          {type:"dlg", lines:GAPS.part2.lines, instr:"Now without the glossary."}]},
  {id:"then-now", topic:"seen", sec:"Revision", title:"Back to the start: how would you say it now?", meta:"6 sentences from the start of the lesson", kind:"steps",
   steps:SAYIT.map((s,i)=>({type:"sayit", s, first:i===0, box:"",
     instr: i===0 ? "Remember the start of the lesson? Say it in English — aloud. Then tap the yellow boxes to check." : "Say it in English."}))},
  {id:"tq-seen", topic:"seen", sec:"Extension", title:"Listening: the same phrases in real conversations", meta:"4 short clips from real videos", kind:"steps",
   steps:TQ.seen.map((clip,i)=>({type:"listen",clip,first:i===0}))}
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
const TQ_STEPS = [];
