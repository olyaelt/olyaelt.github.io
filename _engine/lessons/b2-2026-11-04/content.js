const STICKER = "__STICKER__";
const GAPS = __GAPS__;   /* beach1, beach2: the new chat (TZ 2026-11-04_2320); linden1, linden2: the Linden Street chat of the field f-crime («🔁 Recall»), unchanged */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-11-04";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework Wed 4.11.26 (Lesson 11, Jeopardy revision) → Fri 6.11 (small), from the lesson chat's TZ
   (box handoff 2026-11-04_2320_lesson-B2-L11__to_engine__homework-0411-revision) ---------- */
const LESSON = { date:"04.11.26", sub:"" };

/* the boxes as taught in class (field pages f-crime, f-dis, f-pp) */
const BOX_CRIME = `
  <h4>CRIME · THE NEWS</h4>
  <p>Someone <b>broke into</b> the flat. · A car <b>got broken into</b>. <i class="ru">вскрыли</i></p>
  <p>The bakery <b>was robbed</b> ${ipa("/rɒbd/")}. <i class="ru">ограбили</i> · <b>reported it</b> to the police ${ipa("/rɪˈpɔːt/")}</p>
  <h4>REACT AND ASK</h4>
  <p><b>Did they take</b> anything? · <b>Did they catch</b> him?</p>
  <p><b>Did anyone get hurt?</b> ${ipa("/hɜːt/")} → I hope <b>nobody got hurt</b>.</p>
  <p><b>Was there much damage?</b> ${ipa("/ˈdæmɪdʒ/")} · <b>What happened next?</b></p>
  <h4>END</h4>
  <p><b>Watch out for</b> … → <b>Thanks for the heads-up!</b> ${ipa("/ˈhedz ʌp/")}</p>`;

const BOX_DIS = `
  <h4>A QUESTION FIRST</h4>
  <p><b>Do you think so?</b> I found it… <i class="ru">правда? а мне показалось…</i></p>
  <h4>AGREE A LITTLE, THEN YOUR POINT</h4>
  <p><b>Yeah, I suppose so. But</b> … ${ipa("/səˈpəʊz/")}</p>
  <h4>KEEP YOUR OPINION — GENTLY · FINISH</h4>
  <p><b>Maybe, but I still think</b> … · <b>Fair enough.</b> / <b>OK, fair point.</b></p>
  <h4>TAGS: I THINK SO — DO YOU?</h4>
  <p>Titanic has a really sad ending, <b>doesn't it?</b></p>`;

const BOX_PP = `
  <h4>THE NEWS · PRESENT PERFECT</h4>
  <p><b>I've been</b> to Italy! · <b>Have you</b> read anything good <b>in the last</b> few weeks?</p>
  <h4>THE DETAILS · PAST SIMPLE</h4>
  <p><b>When did you go?</b> — We <b>went</b> in August. · <b>How was it?</b></p>
  <p><b>last</b> month · a week <b>ago</b> · <b>When did you last</b> …?</p>`;

const REWRITE = [
  {o:"Did you tell the police about it?", k:"REPORT", pre:"Did you ", post:" to the police?", a:"report it",
   acc:["report it"],
   n:`${ru("= ты заявил(а) в полицию?")}<br>report <b>it</b> — “it” обязательно · report ${ipa("/rɪˈpɔːt/")}<br>or: Have you reported it…? — если это свежая новость`, box:BOX_CRIME},
  {o:"Was anyone injured?", k:"GET", pre:"Did anyone ", post:"?", a:"get hurt",
   acc:["get hurt","get injured"],
   n:`${ru("= кто-нибудь пострадал?")}<br>did + <b>get</b> hurt · “hurt” ${ipa("/hɜːt/")}<br>or: get injured — то же, но “get hurt” разговорнее`, box:BOX_CRIME},
  {o:"Someone broke into our neighbour's car last night.", k:"GOT", pre:"Our neighbour's car ", post:" last night.", a:"got broken into",
   acc:["got broken into","was broken into"],
   n:`${ru("= машину соседа вскрыли (кто — неважно)")}<br>got broken <b>into</b> — “into” остаётся · “broken” ${ipa("/ˈbrəʊkən/")}<br>or: was broken into`, box:BOX_CRIME},
  {o:"Two men stole money from the café on the corner yesterday.", k:"ROBBED", pre:"The café on the corner ", post:" yesterday.", a:"was robbed",
   acc:["was robbed","got robbed","was robbed by two men","got robbed by two men"],
   n:`${ru("= кафе ограбили")} · “robbed” ${ipa("/rɒbd/")} — один слог<br>“rob” — место или человека (rob a café), “steal” — вещь (steal money)<br>не: <s>It was robbery</s> → It was robbed; существительное — с “a”: There was a robbery`, box:BOX_CRIME},
  {o:"When was the last time you went to the cinema?", k:"LAST", pre:"When ", post:" to the cinema?", a:"did you last go",
   acc:["did you last go"],
   n:`${ru("= когда ты последний раз ходил(а) в кино?")}<br>did + <b>go</b>, не “went” · or: When did you go to the cinema last?<br>“for the last time” — в последний раз (и больше не будет)`, box:BOX_PP},
  {o:"A: The ending was brilliant, wasn't it?  B: No. The ending was boring.", k:"FOUND", pre:"B: Do you think so? I ", post:" a bit boring.", a:"found the ending",
   acc:["found the ending","found it"],
   n:`${ru("= правда? а мне концовка показалась скучноватой")}<br>find + что + какое: I found the ending boring (без “was”)<br>“Do you think so?” — мягкое несогласие вместо “No.”`, box:BOX_DIS}
];

const SAY = [
  {html:true, rows:[["A neighbour tells you someone stole all the plants from her front garden last night. You think the police should know.",
     `Oh no! ${g("Did you report it to the police?")}`]],
   note:`<b>Crime</b> ${ru("= ты заявила в полицию?")} — report <b>it</b>`, box:BOX_CRIME},
  {html:true, rows:[["A friend says there was a small fire in the café under his office at lunchtime, when it was full. Ask about the people inside.",
     `Oh no! ${g("Did anyone get hurt?")}<br>or: I hope ${g("nobody got hurt")}.`]],
   note:`<b>Crime</b> ${ru("= кто-нибудь пострадал? · надеюсь, никто не пострадал")} — в вопросе “anyone”, после “I hope” — “nobody”`, box:BOX_CRIME},
  {html:true, rows:[["A friend says: “That new pizza place is amazing, isn't it?” You went there last week, and the pizza was worse than you'd expected.",
     `${g("Do you think so? I found it")} a bit disappointing, to be honest.`]],
   note:`<b>Disagree and stay friends</b> ${ru("= правда? а мне она показалась так себе")} · “disappointing” — хуже, чем ожидал(а); о пицце — “disappointing”, о человеке — “disappointed”`, box:BOX_DIS},
  {html:true, rows:[["Your brother says: “Working from home is so lonely.” You work from home too. You partly agree, but you love having no commute.",
     `${g("Yeah, I suppose so. But")} at least we don't have to commute!<br>or: ${g("Maybe, but I still think")} it's better than commuting.`]],
   note:`<b>Disagree and stay friends</b> ${ru("= ну, наверное… но")} — “I suppose so”, когда хоть немного согласен(на)`, box:BOX_DIS},
  {html:true, rows:[["You're watching a series with a friend. You love the music and expect your friend to agree.",
     `This has such a good soundtrack, ${g("doesn't it?")}<br>or: The music's amazing, ${g("isn't it?")} · It's got a great soundtrack, ${g("hasn't it?")}`]],
   note:`<b>Tags</b> ${ru("= делюсь мнением и жду согласия")} — интонация вниз · “has” (без “got”) → “doesn't it” · “has got” → “hasn't it” · “is” → “isn't it”`, box:BOX_DIS},
  {html:true, rows:[["A friend you haven't seen for a month asks: “Any news?” You and your family moved to a new flat two weeks ago.",
     `${g("We've moved!")} We ${g("found")} a lovely flat and ${g("moved in two weeks ago")}.<br>or: We ${g("moved")} to a new flat two weeks ago!`]],
   note:`<b>Present perfect vs past simple</b> ${ru("новость — present perfect, подробности (когда, как) — past simple · с “ago” — только past simple")}`, box:BOX_PP}
];

const TOPICS = [
  {id:"rev", title:"Revision (Present perfect vs past simple · Disagree and stay friends · Crime)",
   sub:"The phrases from our revision lesson in a new story and new situations",
   box:()=>BOX_CRIME+BOX_DIS+BOX_PP,
   /* engine 62 also: three boxes, three fold-outs — together they are about 20 rows, too tall to see whole on a phone */
   boxes:[{h:"Crime", html:BOX_CRIME}, {h:"Disagree and stay friends", html:BOX_DIS}, {h:"Present perfect vs past simple", html:BOX_PP}]}
];
const RW_FIRST = "Rewrite the sentence. Use the word in capitals. Type the missing part or say it aloud, then tap Check.";
const DLG_WITH = "Say the missing words. Then tap the yellow and orange boxes to check.";
const DLG_WITHOUT = "Now without the glossary.";
const DLG_ON = "Read on. Say the missing words, then tap to check.";
/* a chat in two screens: each screen with its glossary, then straight away without (her rule 29.10) */
const chatSteps = (a, b) => [
  {type:"dlg", intro:GAPS[a].intro, lines:GAPS[a].lines, gloss:GAPS[a].gloss, instr:DLG_WITH},
  {type:"dlg", intro:GAPS[a].intro, lines:GAPS[a].lines, instr:DLG_WITHOUT},
  {type:"dlg", lines:GAPS[b].lines, gloss:GAPS[b].gloss, instr:DLG_ON},
  {type:"dlg", lines:GAPS[b].lines, instr:DLG_WITHOUT}];
/* fixes-1 (TZ 2026-11-05_1745, her idea): first read the whole chat for gist, then the gaps. Her pictures (ChatGPT), 1024 × 768 */
const BEACH_A = "__BEACH_A__", BEACH_B = "__BEACH_B__";
const GIST = {type:"gist",
  instr:"First read the whole chat. Don't fill in the gaps yet — just find out what happened.",
  q:"What really happened to Josh's car?",
  intro:GAPS.beach1.intro, lines:[...GAPS.beach1.lines, ...GAPS.beach2.lines],
  opts:[{img:BEACH_A, alt:"A thief takes the sandwiches through the car window", txt:"🦹 A thief broke into it."},
        {img:BEACH_B, alt:"Three seagulls on the wall behind the car eat the sandwiches", txt:"🐦 Seagulls got in through the open window."}],
  ok:1,
  right:"Yes! The “thief” was three seagulls 😂 Now read it again and fill in the gaps.",
  wrong:"Not quite. Read the end of the chat again."};
const TASKS = [
  {id:"beach", topic:"rev", sec:"Revision", title:"A break-in at the beach? The missing words", meta:"Read first · 9 phrases · 2 screens · with the glossary, then without", kind:"steps",
   steps:[GIST, ...chatSteps("beach1", "beach2")]},
  {id:"practice", topic:"rev", sec:"Extension", title:"Rewrite it, then say what you'd say", meta:"6 sentences + 6 situations", kind:"steps",
   steps:[...REWRITE.map((r,i)=>({type:"rewrite", r, box:r.box, first:i===0, instrFirst:RW_FIRST})),
          ...SAY.map((s,i)=>({type:"sayit", s, box:s.box, instr: i===0 ? "What would you say? Say it aloud, then tap the yellow box to check." : "What would you say?"}))]},
  /* optional: "for later", not in the total time (they have done Linden Street three times); its own section so it comes last */
  {id:"linden", topic:"rev", sec:"More revision", title:"Want more? The Linden Street chat from class", meta:"From 14.10 · with the glossary, then without", kind:"steps", later:true,
   steps:chatSteps("linden1", "linden2")}
];

/* no Over to you on this page */
const TASK_HTML = "";
const MAP = [];
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = false;
const PLAN_INSTR = "";
const PRODUCE_INSTR = "";
const MODEL_TITLE = "";
const MODEL = [];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
