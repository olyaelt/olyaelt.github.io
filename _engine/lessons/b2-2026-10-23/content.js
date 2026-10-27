const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-23";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;

/* ---------- content of this page (everything below up to TASKS is lesson-specific) ---------- */
const LESSON = { date:"23.10.26", sub:"" };
const CLOCKS_MAP = [
  {h:"Next week's call", items:[
    ["<b>The clocks go back</b> on Sunday. <span class=\"ipa\">/ðə ˈklɒks ɡəʊ ˈbæk/</span>","переводят часы назад (весной: go forward)"],
    ["Our call will be <b>an hour later for you</b>. <span class=\"ipa\">/ən ˈaʊə ˈleɪtə/</span>","для тебя на час позже (earlier — раньше)"],
    ["ten <b>my time</b>, one <b>your time</b>","в десять по моему времени, в час по твоему"],
    ["<b>Could we make it</b> nine your time?","может, в девять по твоему?"],
    ["<b>Does that still work for you?</b> <span class=\"ipa\">/wɜːk/</span>","тебе так всё ещё удобно?"]]},
  {h:"Small talk", items:[
    ["<b>an extra hour of sleep</b> <span class=\"ipa\">/ˈekstrə ˈaʊər əv ˈsliːp/</span>","поспать на час дольше"],
    ["<b>The clocks went back.</b>","часы перевели"]]}
];
const TOPICS = [
  {id:"clocks", title:"The clocks go back", sub:"Moving a call when the clocks change", box:()=>mapInner(CLOCKS_MAP)},
  {id:"shows", title:"Did you see…?", sub:"Catching up and small talk about shows, films and books", box:()=>mapInner(MAP, true, false, TENSES)}
];
const READ_INTRO = "Monday morning, the office kitchen. Dan is back from holiday.";
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>Two colleagues meet in the office kitchen.</p>
        <ul>
          <li><b>A</b> is back from holiday.</li>
          <li><b>B</b> asks about it. Then they talk about a show, a film or a book.</li>
        </ul>
        <p class="small">Record it (say both parts) or write it.</p>`;
const PLAN_INSTR = "Tap the phrases you'll use — three or four are enough.";
const PRODUCE_INSTR = "Write your conversation — both parts. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const PRODUCE_NOTE = ``;
const MAP_NUMBERED = true;
const BOX_CLOCKS = `
  <h4>NEXT WEEK'S CALL</h4>
  <p><b>The clocks go back.</b></p>
  <p><b>an hour later for you</b></p>
  <p>nine <b>my time</b></p>
  <p>twelve <b>your time</b></p>
  <p><b>Does that still work for you?</b></p>
  <h4>SMALL TALK</h4>
  <p><b>an extra hour of sleep</b></p>
  <p><b>The clocks went back.</b></p>`;
const BOX_SHARE = `
  <h4>START</h4>
  <p><span class="n">1</span><b>Are you (still) watching</b> …?</p>
  <p><span class="n">2</span><b>Did you see</b> the final <b>last night</b>?</p>
  <p><span class="n">3</span><b>Have you seen</b> the new season <b>yet</b>?</p>
  <p><span class="n">4</span><b>Anyway,</b> …</p>
  <h4>SHARE</h4>
  <p><span class="n">5</span>I was <b>on the edge of my seat</b>.</p>
  <p><span class="n">6</span>I watched <b>the whole thing in one go</b>.</p>
  <p><span class="n">7</span>I'm <b>still not over it</b>.</p>
  <p><span class="n">8</span><b>Honestly? I was a bit disappointed.</b></p>
  <p><span class="n">9</span>Horror's <b>not really my thing</b>, but …</p>
  <h4>ASK</h4>
  <p><span class="n">10</span><b>What did you think of</b> the ending?</p>`;
/* Over to you: the conversation map (box and success criteria in one, in the order of the dialogue) */
const MAP = [
  {h:"Catch up", items:[["<b>It's been ages! How have you been?</b>","сто лет не виделись! как ты?"],["<b>I've just got back from</b> …","только что вернулся с…"],
    ["<b>Lucky you! When did you get back?</b>","везёт тебе! когда вернулся?"],["<b>What have you been up to?</b>","чем занимался?"]]},
  {h:"Start", items:[["<b>Are you (still) watching</b> …?","ты (всё ещё) смотришь…?"],["<b>Did you see</b> the final <b>last night</b>?","ты вчера видел…?"],
    ["<b>Have you seen</b> the new season <b>yet</b>?","ты уже смотрел…?"]]},
  {h:"Share and ask", items:[["I was <b>on the edge of my seat</b>.","смотрел, затаив дыхание"],["I watched <b>the whole thing in one go</b>.","всё за один присест"],
    ["I'm <b>still not over it</b>.","до сих пор не могу отойти"],["<b>Honestly? I was a bit disappointed.</b>","честно? я немного разочарован(а)"],
    ["Horror's <b>not really my thing</b>, but …","не моё"],["<b>What did you think of</b> the ending?","как тебе концовка?"]]},
  {h:"Move on", items:[["<b>Anyway,</b> … "+"<span class=\"ipa\">/ˈeniweɪ/</span>","слушай, кстати… (меняем тему)"],["<b>I'd better get back to work.</b>","мне пора за работу"]]}
];
const TENSES = `<b>Have you seen</b> it <b>yet</b>? — no time · <b>Did you see</b> it <b>last night</b>? — with a time`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");
const mapBox = (withRu=true) => box(mapInner(MAP, withRu, MAP_NUMBERED, TENSES));
const CHECKS = [
  ["Catch up","It's been ages! How have you been?"],
  ["Start","a question about a show, a film or a book"],
  ["Share + ask","a reaction and What did you think of…?"],
  ["Move on","Anyway, … / I'd better get back to work."],
  ["Tenses","Have you seen… yet? · Did you see… last night?"]
];
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- content (from the deck, slides 38, 40–55, 71, 110–133, 23–24) ---------- */
const REWRITE = [
  {o:"On Sunday we all put our clocks back an hour.", k:"GO", pre:"The clocks ", post:" on Sunday.", a:"go back an hour", acc:["go back an hour","will go back an hour"],
   n:`= ${ru("в воскресенье часы переводят на час назад · present simple: по календарю")} · or: go back / will go back`},
  {o:"From next week you'll have to join our call at seven, not six.", k:"LATER", pre:"From next week our call will be ", post:".", a:"an hour later for you", acc:["an hour later for you"],
   n:`= ${ru("для тебя на час позже")} · hour ${ipa("/ˈaʊə/")} ${ru("— h не читается")}`},
  {o:"I can do noon London time. What time is that where you are?", k:"YOUR", pre:"I can do noon London time. What's ", post:"?", a:"that in your time", acc:["that in your time","that your time"],
   n:`= ${ru("а это сколько по твоему времени?")} · or: What's that your time?`},
  {o:"Are you still OK with nine?", k:"WORK", pre:"Does ", post:"?", a:"nine still work for you", acc:["nine still work for you"],
   n:`= ${ru("тебе в девять ещё удобно?")} · work ${ipa("/wɜːk/")} ${ru("(не")} walk ${ipa("/wɔːk/")}${ru(")")}`},
  {o:"On Saturday night we can sleep an hour longer!", k:"EXTRA", pre:"On Saturday night we get ", post:"!", a:"an extra hour of sleep", acc:["an extra hour of sleep","an extra hour in bed"],
   n:`= ${ru("можно поспать на час дольше")} · or: an extra hour in bed`},
  {o:"It's been getting dark really early ever since we switched to winter time.", k:"WENT", pre:"It's been getting dark really early ever since ", post:".", a:"the clocks went back", acc:["the clocks went back"],
   n:`= ${ru("с тех пор как перевели часы · since + past simple: момент в прошлом")}`}
];
const SAYIT = [
  {rows:[
    ["<i>(в конце созвона)</i> Кстати, в воскресенье переводят часы назад.","By the way, the clocks go back on Sunday."],
    ["Значит, со следующей недели созвон для меня будет на час позже?","So from next week the call will be an hour later for me?"],
    ["Может, в девять по моему времени? Это двенадцать по твоему.","How about nine my time? That's twelve your time."]],
   note:`Other answers are also possible.<br>or: Could we do nine my time?`},
  {rows:[
    ["Тебе так всё ещё удобно?","Does that still work for you?"],
    ["Ура, в эти выходные можно поспать на час дольше!","Yay, we get an extra hour of sleep this weekend!"],
    ["<i>(в понедельник)</i> Часы перевели, а я всё равно проснулась в шесть!","The clocks went back, but I still woke up at six!"]],
   note:`Other answers are also possible.<br>Is it still <s>comfortable</s> for you? ${ru("comfortable — физически удобно; о времени:")} Does that still work for you? · Is that still convenient? ${ru("— тоже правильно, но официальнее")}`}
];
const SHARE = [
  {i:"Share your reaction and ask a question — aloud. Use the words in capitals and the box. Then tap Check.",
   a:"Have you finished the latest Dan Brown yet? I was up till two finishing it!",
   sit:"Yes — you read the last 300 pages without stopping. Ask about the ending.", use:"ONE GO · THINK OF", hint:true,
   s:"Yes! I read the last 300 pages <b>in one go</b>.", q:"<b>What did you think of</b> the ending?",
   next:"Classic Dan Brown! He gets me every time.",
   notes:[`${g("in one go")} = ${ru("за один присест")}`, `${g("read")} ${ipa("/red/")} ${ru("в прошедшем")}`]},
  {i:"Share and ask.",
   a:"Are you still listening to the full-cast Harry Potter audiobooks? I loved them!",
   sit:"No, you finished the last one last weekend. It was really exciting. Ask what A thought of Hugh Laurie as Dumbledore.", use:"EDGE · THINK OF", hint:true,
   s:"No, I finished the last one last weekend! I was <b>on the edge of my seat</b>.", q:"<b>What did you think of</b> Hugh Laurie as Dumbledore?",
   next:"Loved him! I could listen to him all day.",
   notes:[`${g("on the edge of my seat")} = ${ru("затаив дыхание")} · ${g("edge")} ${ipa("/edʒ/")}`, `${g("as Dumbledore")} = ${ru("в роли Дамблдора")}`,
          `${g("Hugh")} ${ipa("/hjuː/")} · ${g("Dumbledore")} ${ipa("/ˈdʌmbldɔː/")}`, `${g("full-cast")} = ${ru("все роли читают разные актёры")}`]},
  {i:"Share and ask.",
   a:"Did you hear about the café downstairs? It's closing at the end of the month!",
   sit:"You heard about it last week, and you're still upset. Ask where you'll all get coffee now.", use:"OVER · COFFEE", hint:true,
   s:"I know! <b>I'm still not over it</b>.", q:"Where are we going to get our coffee now?",
   next:"The machine upstairs. Its coffee's awful!",
   notes:[`${g("I'm still not over it")} = ${ru("до сих пор не могу отойти")}`, `${g("coffee")} ${ipa("/ˈkɒfi/")}`,
          ru("or: Where will we get coffee now?"), ru("Новость → реакция + вопрос, не просто «Interesting.»")]},
  {i:"Now you only get the words in capitals.",
   a:"Did you see the rocket launch last night?",
   sit:"Yes, you watched it live. It was really exciting. Ask if A thinks people will live on Mars one day.", use:"EDGE · THINK",
   s:"Yes! I was <b>on the edge of my seat</b> the whole time.", q:"<b>Do you think</b> people will live on Mars one day?",
   next:"Maybe. But not me — I hate flying!",
   notes:[`${g("on the edge of my seat")} = ${ru("затаив дыхание")}`, `${g("What did you think of…?")} ${ru("— как тебе? (уже посмотрел)")}`,
          `${g("Do you think…?")} ${ru("— как думаешь? (мнение сейчас)")}`]},
  {i:"Share and ask.",
   a:"I've just watched Project Hail Mary. It's even better than the book, isn't it?",
   sit:"You've read the book and seen the film. You don't agree: the film wasn't as good — they cut so much of the science. Ask why A thinks they did that.", use:"THINK SO · DISAPPOINTED",
   s:"Do you think so? Honestly, <b>I was a bit disappointed</b>. They cut so much of the science!", q:"Why do you think they did that?",
   next:"Time! It's over two and a half hours.",
   notes:[ru("Смягчаем, объясняем причину, спрашиваем"), `${g("disappointed")} ${ipa("/ˌdɪsəˈpɔɪntɪd/")} = ${ru("разочарован(а)")}`,
          `${g("Why do you think they did that?")} ${ru("— без did после think")}`]},
  {i:"Share and ask.",
   a:"Have you started Severance yet? It's brilliant!",
   sit:"You watched the first episode, but you don't really like sci-fi, so you stopped. Ask if it gets better.", use:"MY THING · BETTER",
   s:"Just the first episode. Sci-fi's <b>not really my thing</b>, so I stopped.", q:"Does it get better?",
   next:"Much better! Wait for episode three.",
   notes:[`${g("not really my thing")} = ${ru("не моё")}`, `${g("…, so I stopped")} = ${ru("поэтому бросила")}`,
          `${g("episode")} ${ipa("/ˈepɪsəʊd/")}`, ru("or: I watched the first episode, but…")]},
  {i:"Share and ask.",
   a:"Did you see that article about working four days a week?",
   sit:"You read it. You expected more: there was nothing new in it. Ask if A thinks it would work in your company.", use:"DISAPPOINTED · THINK",
   s:"I did. <b>Honestly? I was a bit disappointed</b> — there was nothing new in it.", q:"<b>Do you think</b> it would work here?",
   next:"Here? We don't even get weekends!",
   notes:[`${g("Did you see…? — I did.")} ${ru("отвечаем коротко")}`, `${g("disappointed")} = ${ru("разочарован(а)")}`, ru("or: …work in our company?")]},
  {i:"Now no words given: use the box.",
   a:"I've finished The Little Prince audiobook you recommended! It took me three weeks, though.",
   sit:"You're surprised: it's very short. You listened to all of it in one evening. Ask what A thought of the ending.",
   s:"Three weeks? I listened to <b>the whole thing in one go</b>!", q:"<b>What did you think of</b> the ending?",
   next:"Honestly? By the end, I'd forgotten the beginning!",
   notes:[`${g("Three weeks?")} ${ru("— так показываем удивление")}`, `${g("listened to the whole thing in one go")} = ${ru("за один присест")}`,
          `${g("audiobook")} ${ipa("/ˈɔːdiəʊbʊk/")} · ${g("whole")} ${ipa("/həʊl/")}`]},
  {i:"Share and ask.",
   a:"You have to read Murder on the Orient Express. Best book I've read this year!",
   sit:"You've read it. You don't usually read crime, but you couldn't stop reading. Ask if A guessed the killer.",
   s:"Oh, I've already read it! Crime novels <b>aren't really my thing, but</b> I couldn't stop reading.", q:"Did you guess who did it?",
   next:"No! Not until the last page.",
   notes:[`${g("I've already read it!")} ${ru("«уже», без «когда» → Present Perfect")}`, `${g("read")} ${ipa("/red/")} ${ru("· or: Did you guess who the killer was?")}`]},
  {i:"Share and ask.",
   a:"Have you got to the end of The Silent Patient yet? That ending!",
   sit:"You finished it last night, and you're still in shock. Ask if A expected it.",
   s:"I have! <b>I'm still not over it</b>, honestly.", q:"Did you expect that?",
   next:"Not at all! I had to read the last chapter twice.",
   notes:[`${g("I'm still not over it")} = ${ru("до сих пор не могу отойти")}`, ru("or: Did you see it coming? (= ты ожидал?)")]}
];
const LOOKBACK = [
  {p:"I watched the whole thing in one go.", qa:[["What about a book? Or an audiobook?","I read the last 300 pages / I listened to the whole thing in one go."]]},
  {p:"Horror's not really my thing, but…", qa:[["What about crime novels? Why can't we use 's here?","Crime novels aren't really my thing, but… (plural → aren't)"],
                                             ["And if you gave up after one episode?","Sci-fi's not really my thing, so I stopped."]]},
  {p:"What did you think of the ending?", qa:[["How did B ask about Hugh Laurie in the Harry Potter audiobooks?","What did you think of Hugh Laurie as Dumbledore?"]]}
];
const MODEL = [
  ["Priya","Dan! <b>It's been ages! How have you been?</b>"],
  ["Dan","Good, thanks. <b>I've just got back from Crete</b>, actually. Two weeks of sun, sea and no emails."],
  ["Priya","<b>Lucky you! When did you get back?</b>"],
  ["Dan","Last night. <b>I was up till two</b> unpacking."],
  ["Priya","Oh no. So <b>did you see</b> the Star Kitchen final <b>last night</b>, or were you too tired?"],
  ["Dan","Are you joking? I unpacked in front of the TV. <b>I was on the edge of my seat!</b>"],
  ["Priya","Me too! <b>What did you think of the result?</b>"],
  ["Dan","<b>Honestly? I was a bit disappointed.</b> Marco was much better."],
  ["Priya","Totally. <b>Everyone's saying that.</b>"],
  ["Dan","<b>Anyway</b> — <b>what have you been up to</b> while I was away?"],
  ["Priya","Oh, not much. Work, mostly. <b>Are you still watching</b> Crown Street? <b>Have you seen the new season yet?</b>"],
  ["Dan","Yes! <b>I watched the whole thing in one go</b> the weekend before I left."],
  ["Priya","In one go? It's ten episodes! <b>It took me all week.</b>"],
  ["Dan","I know, I know. I just couldn't stop. So <b>what did you think of the ending?</b>"],
  ["Priya","Honestly? I was so angry. Why would they do that to Jess?"],
  ["Dan","Seriously! <b>I'm still not over it.</b>"],
  ["Priya","Me neither. Right, <b>I'd better get back to work.</b> See you at lunch?"],
  ["Dan","Yeah, see you then."]
];
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];

const TASKS = [
  {id:"clocks-text", topic:"clocks", sec:"Revision", title:"The clock change chat: the missing words", meta:"Say the missing words, then check", kind:"gaps",
   lead:"Now without the glossary.", instr:"Say the missing words. Then tap the yellow boxes to check.", lines:GAPS.clocks},
  {id:"clocks-practice", topic:"clocks", sec:"Revision", title:"Rewrite and say it", meta:"8 short steps", kind:"steps",
   steps:[...REWRITE.map((r,i)=>({type:"rewrite",r,first:i===0,box:BOX_CLOCKS})), ...SAYIT.map((s,i)=>({type:"sayit",s,first:i===0}))]},
  {id:"priya-dan-1", topic:"shows", sec:"Revision", title:"Back from holiday (part 1): the missing words", meta:"Say the missing words, then check", kind:"gaps",
   lead:"Now without the glossary.", instr:"Say the missing words. Then tap the yellow boxes to check.", lines:GAPS.priya1},
  {id:"priya-dan", topic:"shows", sec:"Revision", title:"Back from holiday (part 2): the missing words", meta:"Say the missing words, then check", kind:"gaps",
   lead:"Now without the glossary.", instr:"Say the missing words. Then tap the yellow boxes to check.", lines:GAPS.priya},
  {id:"tq1", topic:"clocks", sec:"Extension", title:"Listening: the clock change", meta:"10 short clips from real videos", kind:"steps",
   steps:TQ.tq1.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"tq2", topic:"clocks", sec:"Extension", title:"Listening: Daylight Saving Time explained", meta:"2 clips from one video", kind:"steps",
   steps:TQ.tq2.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"share-ask", topic:"shows", sec:"Extension", title:"Share your reaction and ask", meta:"10 short conversations", kind:"steps",
   steps:[...SHARE.map(s=>({type:"share",s})), {type:"lookback"}]},
  {id:"write", topic:"shows", sec:"Over to you!", title:"Your own conversation", meta:"Your task · plan · record and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];

