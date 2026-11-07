const STICKER = "__STICKER__";
const GAPS = __GAPS__;   /* part1, part2: the lesson text (page stages-of-life, 📖 The text, the memorisation screens); every chunk bold, its note after it */
const TQ = __TQ__;       /* the TubeQuizard clips [videoId, start, duration, parts], easy → hard (TZ 2026-11-06_2125) */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-11-06";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: B2 homework Fri 6.11.26 (Lesson 12 «When did it happen? Stages of life») → Wed 11.11 (big),
   from the lesson chat's TZ (box handoff 2026-11-06_2125_lesson-B2-L12__to_engine__homework-0611-stages-of-life) ---------- */
const LESSON = { date:"06.11.26", sub:"" };

/* the box as taught in class (the lesson page's boxes.BOX) */
const BOX = "<h4>STAGES OF LIFE</h4><p><b>as a kid</b> <i class=\"ru\">в детстве</i></p><p><b>at school</b> <i class=\"ru\">в школе</i></p><p><b>at 18</b> <i class=\"ru\">в 18 лет</i></p><p><b>in my early / mid- / late thirties</b> <i class=\"ru\">чуть за 30 · лет 35 · под 40</i></p><p><i class=\"ru\">twenties, forties… · thirties <span class=\"ipa\">/ˈθɜːtiz/</span> · twenties <span class=\"ipa\">/ˈtwentiz/</span></i></p><h4>SCHOOL &amp; UNIVERSITY: CHOOSE ONE</h4><p><b>after high school</b> <span class=\"mean\">US</span> · <b>after I left school</b> <span class=\"mean\">UK</span> <i class=\"ru\">окончив школу</i></p><p><b>right out of college</b> <span class=\"mean\">US</span> · <b>straight out of university</b> <span class=\"mean\">UK</span> <i class=\"ru\">сразу после вуза</i></p><p><b>in my third year of college</b> <span class=\"mean\">US</span> · <b>in my third year at university</b> <span class=\"mean\">UK</span> <i class=\"ru\">на 3-м курсе</i></p><h4>NOT YET?</h4><p><b>I still can't</b> drive (swim, cook…).</p><p><b>I still don't have</b> my own place (a car…).</p><h4>ASK AND REACT</h4><p><b>When did you</b> learn to drive? → I learned <span class=\"ipa\">/lɜːnd/</span>… <i class=\"ru\">did + базовая форма</i></p><p><b>When did you last</b> go to the cinema? → <b>ages ago</b> · or: I haven't been <b>for ages</b>!</p><p>Not sure? <b>I can't remember exactly</b> — last summer, <b>maybe</b>? <span class=\"ipa\">/ɪɡˈzæktli/</span></p><p>Oh, nice! · How old were you? · Really? Why?</p>";

const TOPICS = [
  {id:"life", title:"When did it happen? Stages of life", sub:"Talking about when things happened — and what you still can't do", box:()=>BOX}
];

const DLG_WITH = "Say the missing words. Then tap the yellow and orange boxes to check.";
const DLG_WITHOUT = "Now without the glossary.";
const DLG_ON = "Read on. Say the missing words, then tap to check.";

/* 🔁 Back to the start: the six sentences of the lesson's test (core: the whole group did them in class) */
const SAYIT = [
  {html:true, rows:[["Я научилась плавать <u>в детстве</u>.", "I learned to swim <b class=\"g\">as a kid</b>."]], note:"<i class=\"ru\">«в детстве» — это прошлое</i> → learned, <i class=\"ru\">не</i> <s class=\"fb-del\">I've learned</s> · in my childhood — <i class=\"ru\">можно, но</i> as a kid / when I was a kid <i class=\"ru\">гораздо чаще</i>"},
  {html:true, rows:[["<u>В 18</u> я уехала от родителей.", "I left home <b class=\"g\">at 18</b>."]], note:"<i class=\"ru\">в классе почти все сказали</i> <s class=\"fb-del\">in 18</s>: <i class=\"ru\">с возрастом</i> — <b>at</b> · <s class=\"fb-del\">I left my parents</s> = <i class=\"ru\">«бросила родителей»</i> → left home"},
  {html:true, rows:[["<u>Сразу после вуза</u> я нашла работу.", "I got a job <b class=\"g\">right out of college</b>.<br>or: I got a job <b class=\"g\">straight out of university</b>."]], note:"<i class=\"ru\">в классе все сказали</i> after university — <i class=\"ru\">это верно</i>; right out of / straight out of = <i class=\"ru\">именно «сразу после»</i> (US / UK)"},
  {html:true, rows:[["Я познакомилась с лучшей подругой <u>на третьем курсе</u>.", "I met my best friend <b class=\"g\">in my third year at university</b>.<br>or: … <b class=\"g\">in my third year of college</b>."]], note:"<i class=\"ru\">курс</i> = year, <i class=\"ru\">на</i> → in: <i class=\"ru\">не</i> <s class=\"fb-del\">on the third course</s> / <s class=\"fb-del\">grade</s> · meet — <i class=\"ru\">без</i> with"},
  {html:true, rows:[["<u>Когда</u> ты <u>научился</u> водить?", "<b class=\"g\">When did you learn</b> to drive?"]], note:"did + <i class=\"ru\">базовая форма</i>: learn, <i class=\"ru\">не</i> <s class=\"fb-del\">learned</s>"},
  {html:true, rows:[["Я <u>до сих пор не умею</u> водить.", "<b class=\"g\">I still can't</b> drive."]], note:"<i class=\"ru\">«не умею»</i> = can't; still — <i class=\"ru\">перед</i> can't: <i class=\"ru\">не</i> <s class=\"fb-del\">I can't still</s>"}
];

/* rewrite and say it, mixed (her decision 6.11: control and speaking take turns — for fossilised errors) */
const RW_FIRST = "Rewrite the sentence. Use the word in capitals. Type the missing part or say it aloud, then tap Check.";
const SAY_FIRST = "What would you say? Say it aloud, then tap the yellow box to check.";
const PRACTICE = [
  {kind:'rw', r:{o:"My sister was 17 when she moved to London.", k:"AT", pre:"My sister moved to London ", post:".", a:"at 17",
   acc:["at 17", "at seventeen", "at the age of 17", "at the age of seventeen"],
   n:"<i class=\"ru\">в 17 лет</i> → <b>at</b> 17, <i class=\"ru\">не</i> <s class=\"fb-del\">in 17</s> / <s class=\"fb-del\">in her 17</s>", box:BOX}},
  {kind:'say', s:{html:true, rows:[["Your neighbour's son is leaving home for university next month. He asks: “How old were you when you left home? Was it scary?”",
     "I left home <b class=\"g\">at 19</b>. Scary? A bit — I cried for a week!"]],
   note:"at + <i class=\"ru\">возраст</i>: at 19 = <i class=\"ru\">в 19 лет</i> · or: when I was 19", box:BOX}},
  {kind:'rw', r:{o:"I'd love to know the year you and your best friend first met.", k:"WHEN", pre:"", post:" your best friend?", a:"When did you meet",
   acc:["When did you meet", "When did you first meet"],
   n:"<i class=\"ru\">когда вы познакомились</i>? did + <i class=\"ru\">базовая форма</i>: did you <b>meet</b>, <i class=\"ru\">не</i> <s class=\"fb-del\">did you met</s> · meet — <i class=\"ru\">без</i> with", box:BOX}},
  {kind:'say', s:{html:true, rows:[["Your friend shows you her wedding photo. Ask when she and her husband met.",
     "Aw! <b class=\"g\">When did you two meet</b>?"]],
   note:"<i class=\"ru\">когда вы познакомились</i>? — did + meet · or: When did you meet?", box:BOX}},
  {kind:'rw', r:{o:"My dad taught me to fish when I was a child.", k:"KID", pre:"My dad taught me to fish ", post:".", a:"as a kid",
   acc:["as a kid", "when I was a kid"],
   n:"<i class=\"ru\">в детстве</i> → <b>as a kid</b> (<i class=\"ru\">так говорят чаще, чем</i> in my childhood)", box:BOX}},
  {kind:'say', s:{html:true, rows:[["Your colleague says her daughter, 8, is scared of the sea. You were too, when you were little. What do you tell your colleague?",
     "Oh, I was scared of the sea <b class=\"g\">as a kid</b>, too! Now I love it."]],
   note:"<i class=\"ru\">в детстве</i> = as a kid · or: when I was a kid / when I was little", box:BOX}},
  {kind:'rw', r:{o:"We met when we were both second-year students at university.", k:"YEAR", pre:"We met ", post:" at university.", a:"in our second year",
   acc:["in our second year"],
   n:"<i class=\"ru\">на втором курсе</i> → <b>in our second year</b> · <i class=\"ru\">курс</i> = year, <i class=\"ru\">на</i> → in: <i class=\"ru\">не</i> <s class=\"fb-del\">on the second course</s> · US: in our second year of college", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A new colleague asks: “So you studied in Kazan? Did you make any good friends there?” You met your best friend as a first-year student.",
     "Yes! I met my best friend <b class=\"g\">in my first year</b>."]],
   note:"<i class=\"ru\">на первом курсе</i> = in my first year · or: in my first year at university / of college", box:BOX}},
  {kind:'rw', r:{o:"Swimming? I never learned how — and I'm 40!", k:"STILL", pre:"Swimming? I ", post:" swim — and I'm 40!", a:"still can't",
   acc:["still can't", "still cannot", "still don't know how to", "still haven't learned to", "still haven't learnt to"],
   n:"<i class=\"ru\">до сих пор не умею</i> → <b>still can't</b>: still <i class=\"ru\">перед</i> can't, <i class=\"ru\">не</i> <s class=\"fb-del\">can't still</s> · can't /kɑːnt/ (UK), /kænt/ (US)", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A friend invites you to go ice skating on Saturday. You never learned to skate.",
     "I'd love to, but <b class=\"g\">I still can't skate</b>! Can you teach me?"]],
   note:"<i class=\"ru\">до сих пор не умею кататься</i> · or: I still don't know how to skate", box:BOX}},
  {kind:'rw', r:{o:"When was the last time you saw your cousins?", k:"LAST", pre:"When ", post:" your cousins?", a:"did you last see",
   acc:["did you last see"],
   n:"<i class=\"ru\">когда ты последний раз видел(а)</i>…? — did + last + <i class=\"ru\">базовая форма</i>: <b>see</b>, <i class=\"ru\">не</i> <s class=\"fb-del\">seen</s> / <s class=\"fb-del\">saw</s>", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A friend is flying home to see her parents. Ask about her last visit.",
     "Oh, nice! <b class=\"g\">When did you last see</b> them?"]],
   note:"<i class=\"ru\">когда ты их последний раз видела</i>? · or: When was the last time you saw them?", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A friend asks: “When did you last go to the theatre?” It was a long time ago, and you're not sure when.",
     "Oh, <b class=\"g\">ages ago</b>! <b class=\"g\">I can't remember exactly</b> — 2019, <b class=\"g\">maybe</b>?"]],
   note:"ages ago = <i class=\"ru\">сто лет назад</i> · I can't remember exactly = <i class=\"ru\">точно не помню</i> · …, maybe? = <i class=\"ru\">может, …? (в конце фразы)</i>", box:BOX}},
  {kind:'rw', r:{o:"The last time I went to a concert was years and years ago.", k:"AGES", pre:"I haven't ", post:".", a:"been to a concert for ages",
   acc:["been to a concert for ages", "been to a concert in ages", "been to any concerts for ages", "been to any concerts in ages"],
   n:"<i class=\"ru\">давно не был(а)</i> → present perfect + <b>for ages</b> (<i class=\"ru\">или</i> in ages) · <i class=\"ru\">с</i> ago — <i class=\"ru\">прошлое</i>: I last went ages ago", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A friend asks: “Do you still play tennis?” You stopped years ago.",
     "Not really — I haven't played <b class=\"g\">for ages</b>!"]],
   note:"for ages = <i class=\"ru\">сто лет (давно не…)</i> · or: in ages", box:BOX}},
  {kind:'rw', r:{o:"I started working as soon as I finished university.", k:"OUT", pre:"I started working ", post:" university.", a:"straight out of",
   acc:["straight out of", "right out of"],
   n:"<i class=\"ru\">сразу после вуза</i> → <b>straight out of university</b> (UK) / right out of college (US) · right after university — <i class=\"ru\">тоже верно</i>", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A younger colleague asks: “Did you take a gap year after university?” You started work the next week.",
     "No — I started working <b class=\"g\">straight out of university</b>!"]],
   note:"<i class=\"ru\">сразу после вуза</i> · or: right out of college (US) · a gap year = <i class=\"ru\">год перерыва перед / после учёбы</i>", box:BOX}},
  {kind:'rw', r:{o:"You should go to that café on the corner — it's lovely.", k:"RECOMMEND", pre:"I'd really ", post:" — it's lovely.", a:"recommend that café on the corner",
   acc:["recommend that café on the corner", "recommend the café on the corner", "recommend that café", "recommend going to that café on the corner", "recommend it"],
   n:"<i class=\"ru\">советую</i> → recommend + <b><i class=\"ru\">что</i></b> <i class=\"ru\">сразу: не</i> <s class=\"fb-del\">recommend you to go</s>, <i class=\"ru\">не</i> <s class=\"fb-del\">recommend you this café</s>", box:BOX}},
  {kind:'say', s:{html:true, rows:[["A friend asks about the swimming lessons you took last year. They were great.",
     "Oh, <b class=\"g\">I'd really recommend them</b>! I learned to swim in a month."]],
   note:"recommend + <i class=\"ru\">что</i>: them = the lessons · <i class=\"ru\">не</i> <s class=\"fb-del\">recommend you them</s>", box:BOX}},
  {kind:'rw', r:{o:"Who said you should watch this series?", k:"RECOMMENDED", pre:"Who ", post:"?", a:"recommended this series to you",
   acc:["recommended this series to you", "recommended it to you", "recommended the series to you"],
   n:"<i class=\"ru\">кто тебе посоветовал? — кому</i>: <b>to you</b>, <i class=\"ru\">в конце</i> · <i class=\"ru\">не</i> <s class=\"fb-del\">recommended you this series</s>", box:BOX}},
  {kind:'say', s:{html:true, rows:[["Your friend is watching a great new series. You want to know who told her about it.",
     "Ooh, <b class=\"g\">who recommended it to you</b>?"]],
   note:"<i class=\"ru\">кто тебе его посоветовал</i>? · recommend sth <b>to</b> sb", box:BOX}}
];
let rwN = 0, sayN = 0;
const PRACTICE_STEPS = PRACTICE.map(x => x.kind === "rw"
  ? {type:"rewrite", r:x.r, box:BOX, first:rwN++ === 0, instrFirst:RW_FIRST}
  : {type:"sayit", s:x.s, box:BOX, instr: sayN++ === 0 ? SAY_FIRST : "What would you say?"});

/* Over to you: Anna's reply first (Tom's message hidden: guess it), then Kim's message to answer */
const OTU_READ = {"type": "dlg", "intro": "Read Anna's reply. What did Tom write to her? Guess, then tap “Show Tom's message”.", "lines": [{"s": "Tom", "p": [{"f": "", "r": "Anna!! Is this you in this photo from our first year at university? 😂 When did we last see each other?"}]}, {"s": "Anna", "p": ["Tom!! Yes, that's me — what a haircut 😂 We met ", {"b": "in our first year"}, ", can you believe it? And when did we last see each other… oh, ", {"b": "ages ago"}, "! ", {"b": "I can't remember exactly"}, " — your 30th, ", {"b": "maybe"}, "? I moved to Bristol ", {"b": "in my late twenties"}, " and I still live here. And no, ", {"b": "I still can't"}, " cook 😂 What about you? Do you still play football?"]}]};
const TASK_HTML = `
<p class="task-h">Your task</p>
<p>Your old friend Kim writes to you: <i>“Hi!! Look what I found at my mum's 📸 Us in our first year at university! Those haircuts 😂 When did we last see each other? It's been ages… What have you been up to?”</i><br>Write back to Kim. You could say when you last saw each other (more or less), where you live now, what you do, something you still can't do or still don't have… Ask Kim a question at the end. A joke is welcome!</p>
<p class="small">Write it or record it.</p>`;
const MAP = [{"h": "Stages of life", "items": [["<b>as a kid</b>", "в детстве"], ["<b>at school</b>", "в школе"], ["<b>at 18</b>", "в 18 лет"], ["<b>in my early / mid- / late thirties</b>", "чуть за 30 · лет 35 · под 40"]]}, {"h": "School & university: choose one", "items": [["<b>after high school</b> (US) · <b>after I left school</b> (UK)", "окончив школу"], ["<b>right out of college</b> (US) · <b>straight out of university</b> (UK)", "сразу после вуза"], ["<b>in my third year of college</b> (US) · <b>in my third year at university</b> (UK)", "на 3-м курсе"]]}, {"h": "Not yet?", "items": [["<b>I still can't</b> drive (swim, cook…).", ""], ["<b>I still don't have</b> my own place (a car…).", ""]]}, {"h": "Ask and react", "items": [["<b>When did you</b> learn to drive? → I learned <span class=\"ipa\">/lɜːnd/</span>…", "did + базовая форма"], ["<b>When did you last</b> go to the cinema? → <b>ages ago</b> · or: I haven't been <b>for ages</b>!", ""], ["Not sure? <b>I can't remember exactly</b> — last summer, <b>maybe</b>? <span class=\"ipa\">/ɪɡˈzæktli/</span>", ""], ["Oh, nice! · How old were you? · Really? Why?", ""]]}];
const MAP_NUMBERED = false;
const TENSES = "";
const PICK_EACH = false;
const PICK_MIN = 3;
const PLAN_INSTR = "Tap the phrases you'd like to use.";
const PRODUCE_PH = "Kim!! …";   /* a message, not a dialogue */
const PRODUCE_INSTR = "Write your reply to Kim. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const MODEL_TITLE = "Possible answer (yours can be different, of course!)";
const MODEL = [["Tom", "Anna!! Is this you in this photo from our first year at university? 😂 When did we last see each other?"], ["Anna", "Tom!! Yes, that's me — what a haircut 😂 We met <b>in our first year</b>, can you believe it? And when did we last see each other… oh, <b>ages ago</b>! <b>I can't remember exactly</b> — your 30th, <b>maybe</b>? I moved to Bristol <b>in my late twenties</b> and I still live here. And no, <b>I still can't</b> cook 😂 What about you? Do you still play football?"], ["A possible answer to Kim", "Kim!! What a photo 😂 Those haircuts! Oh, we last saw each other <b>ages ago</b> — <b>I can't remember exactly</b>. At Lena's wedding, <b>maybe</b>? I moved to Kazan <b>in my late twenties</b> and I still live here. I work in a bank now. <b>I still don't have</b> a dog, but I have two cats! And yes, <b>I still can't</b> cook 😂 What about you? <b>When did you last</b> go back to our uni town?"]];

const TASKS = [
  {id:"text", topic:"life", sec:"Revision", title:"Gran, is this you? The missing words", meta:"Read first · 2 parts · with the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:GAPS.part1.intro, lines:GAPS.part1.lines, gloss:GAPS.part1.gloss, instr:DLG_WITH},
          {type:"dlg", intro:GAPS.part1.intro, lines:GAPS.part1.lines, instr:DLG_WITHOUT},
          {type:"dlg", intro:GAPS.part2.intro, lines:GAPS.part2.lines, gloss:GAPS.part2.gloss, instr:DLG_ON},
          {type:"dlg", intro:GAPS.part2.intro, lines:GAPS.part2.lines, instr:DLG_WITHOUT}]},
  {id:"then-now", topic:"life", sec:"Revision", title:"Back to the start: how would you say it now?", meta:"6 sentences from the start of the lesson", kind:"steps", core:true,
   steps:SAYIT.map((s,i)=>({type:"sayit", s, first:i===0, box:"",
     instr: i===0 ? "Remember the start of the lesson? Say it in English — aloud. Then tap the yellow boxes to check." : "Say it in English."}))},
  {id:"practice", topic:"life", sec:"Extension", title:"Rewrite it, then say what you'd say", meta:"10 sentences + 11 situations", kind:"steps",
   steps:PRACTICE_STEPS},
  {id:"tq-life", topic:"life", sec:"Extension", title:"Listening: our phrases in real videos", meta:"10 short clips · 11 gaps", kind:"steps",
   tqLink:TQ.quiz_link,
   steps:TQ.life.map((clip,i)=>({type:"listen", clip, first:i===0}))},
  {id:"write", topic:"life", sec:"Over to you!", title:"A message from an old friend", meta:"Read a chat · plan · write and send", kind:"steps", min:14,
   steps:[Object.assign({checkLabel:"Show Tom's message"}, OTU_READ), {type:"task"}, {type:"plan"}, {type:"produce"}]}
];

const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const TQ_STEPS = [];
