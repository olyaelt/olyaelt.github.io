const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-09-30";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 30.09 homework (deck "Lesson 1 · Welcome back!", slides 16–56 and 59–73; Over to you from the spreadsheet) ---------- */
const LESSON = { date:"30.09.26", sub:"" };
const BOX_NEWS = `
  <h4>NEWS → PRESENT PERFECT</h4>
  <p><b>What's new?</b> ${ru("(с тех пор как мы виделись)")} → I<span class="pp">'ve started</span> a new job. I<span class="pp">'ve been</span> to Italy. I<span class="pp">'ve read</span> a great book.</p>
  <p>The period is not finished (June → now) + we don't say when → <span class="pp">present perfect</span>. ${ru("Период длится до сейчас, и не важно, когда именно это случилось. Это новость.")}</p>
  <h4>DETAILS → PAST SIMPLE</h4>
  <p>Past simple needs a <b>finished time</b>: I <span class="ps">started</span> a new job <b>in July</b> · We <span class="ps">went</span> to Italy <b>last week</b> · I <span class="ps">read</span> a great book <b>on holiday</b> / <b>two days ago</b>.</p>
  <h4>IN A CONVERSATION</h4>
  <p>A: <b>What have you been up to?</b></p>
  <p>B: I<span class="pp">'ve been</span> to Italy! ${ru("(новость — present perfect)")}</p>
  <p>A: Oh, nice! <b>When <span class="ps">did</span> you <span class="ps">go</span>?</b> ${ru("(детали — past simple)")}</p>
  <p>B: We <span class="ps">went</span> in August. It <span class="ps">was</span> amazing!</p>
  <p>When? Where? Who with? How was it? → <span class="ps">past simple</span></p>`;
/* the box on slides 18–33 and 62–73 */
const BOX_TIME = `
  <h4>IS THE TIME FINISHED?</h4>
  <p><b>No</b> (up to now / no time)<br>→ <span class="pp">present perfect</span></p>
  <p>I<span class="pp">'ve been</span> to Italy!<br>This year <span class="pp">has been</span> crazy.</p>
  <p><b>Yes</b> (finished time)<br>→ <span class="ps">past simple</span></p>
  <p>We <span class="ps">went</span> <b>in August</b>.<br>This summer <span class="ps">was</span> quiet. <span class="small">(it's over!)</span></p>`;
const TOPICS = [
  {id:"news", title:"What have you been up to?", sub:"Catching up after the summer: present perfect or past simple?", box:()=>BOX_NEWS}
];

/* ---------- the practice from the deck ---------- */
const ADD_TIME = [
  {rows:[["I've been to a great concert. <b>+ last Friday</b>", "I <span class=\"ps\">went</span> to a great concert <b>last Friday</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("last Friday — законченное время")}`},
  {rows:[["We've moved to a new flat. <b>+ in July</b>", "We <span class=\"ps\">moved</span> to a new flat <b>in July</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("in July — законченное время")}`},
  {rows:[["I've read a brilliant book. <b>+ on holiday</b>", "I <span class=\"ps\">read</span> <span class=\"ipa\">/red/</span> a brilliant book <b>on holiday</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("отпуск закончился")}`},
  {rows:[["Work has been really busy. <b>+ since September</b>", "Work <span class=\"pp\">has been</span> really busy <b>since September</b>."]], html:true, note:`<b>No change ✓</b> ${ru("since September — период до сейчас")}`},
  {rows:[["I've taken up yoga. <b>+ a month ago</b>", "I <span class=\"ps\">took up</span> yoga <b>a month ago</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("ago — всегда past simple")}`},
  {rows:[["I've seen Tom three times. <b>+ this week</b>", "I<span class=\"pp\">'ve seen</span> Tom three times <b>this week</b>."]], html:true, note:`<b>No change ✓</b> ${ru("неделя ещё идёт")}`},
  {rows:[["We haven't been away. <b>+ this summer</b>", "We <span class=\"ps\">didn't go</span> away <b>this summer</b>.<br>= We <span class=\"ps\">weren't</span> away <b>this summer</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("Сегодня 30 сентября — лето закончилось")}`},
  {rows:[["I haven't had a day off. <b>+ since June</b>", "I <span class=\"pp\">haven't had</span> a day off <b>since June</b>."]], html:true, note:`<b>No change ✓</b> ${ru("since June — с июня до сейчас")}`}
];
const ADD_TIME_2 = [
  {rows:[["I've been really busy. <b>+ since September</b>", "I<span class=\"pp\">'ve been</span> really busy <b>since September</b>."]], html:true, note:`<b>No change ✓</b> ${ru("since September — с сентября и до сейчас")}`},
  {rows:[["We've managed to get away for a couple of weeks. <b>+ in August</b>", "We <span class=\"ps\">managed</span> to get away for a couple of weeks <b>in August</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("in August — законченное время")}`},
  {rows:[["Work has been crazy. <b>+ this month</b> <span class=\"small\">(It's October now.)</span>", "Work <span class=\"pp\">has been</span> crazy <b>this month</b>."]], html:true, note:`<b>No change ✓</b> ${ru("октябрь ещё не закончился")}`},
  {rows:[["I haven't had a day off. <b>+ for ages</b>", "I <span class=\"pp\">haven't had</span> a day off <b>for ages</b>."]], html:true, note:`<b>No change ✓</b> ${ru("for ages — «сто лет», до сейчас")}`},
  {rows:[["We've had a lovely change of scenery. <b>+ when we were in Italy</b>", "We <span class=\"ps\">had</span> a lovely change of scenery <b>when we were in Italy</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("when we were … — поездка закончилась")}`},
  {rows:[["I've started a new course. <b>+ a week ago</b>", "I <span class=\"ps\">started</span> a new course <b>a week ago</b>."]], html:true, note:`<b>The tense changes.</b> ${ru("ago → past simple.  a week ago звучит естественнее, чем one week ago")}`}
];
const IMPROVE = [
  {rows:[["One week ago I have visited the Hermitage.", "One week ago I <s class=\"fb-del\">have</s> visited the Hermitage."]], html:true, note:""},
  {rows:[["I have seen a great film last weekend.", "I <span class=\"ps\">saw</span> a great film <b>last weekend</b>."]], html:true, note:"last weekend — законченное время → past simple.<br><b>Your turn: Last weekend I ... . It was ...</b>"},
  {rows:[["When have you started your new job?", "<b>When</b> <span class=\"ps\">did</span> you <span class=\"ps\">start</span> your new job?"]], html:true, note:"When? — спрашиваем о конкретном времени → past simple.<br><b>Your turn: Tell your partner one piece of news. Partner: When did you ...?</b>"},
  {rows:[["How was your summer? — It has been great! We have been to Spain in July.", "How was your summer? — It <span class=\"ps\">was</span> great! We <span class=\"ps\">went</span> to Spain <b>in July</b>."]], html:true, note:"Лето закончилось + in July → past simple.<br><b>Your turn: How was your summer? — It was ... . I / We ...</b>"},
  {rows:[["I didn't see you for ages!", "I <span class=\"pp\">haven't seen</span> you <b>for ages</b>! = It<span class=\"pp\">'s been</span> ages!"]], html:true, note:"for ages — «сто лет», до сейчас → present perfect.<br><b>Your turn: I haven't ... for ages.</b>"},
  {rows:[["Since June I didn't see my friends from the course.", "I <span class=\"pp\">haven't seen</span> my friends from the course <b>since June</b>."]], html:true, note:"«Не видел с июня» — период до сейчас → present perfect.<br><b>Your turn: Since June I haven't ... / I've ...</b>"},
  {rows:[["What did you do since our last lesson?", "What <span class=\"pp\">have</span> you <span class=\"pp\">been up to</span> <b>since our last lesson</b>?"]], html:true, note:"since our last lesson — до сейчас. What have you been up to? — Чем занимался? (очень частая фраза)<br><b>Your turn: ask your partner and note down their answer.</b>"},
  {rows:[["Last three months I was very busy.", "I<span class=\"pp\">'ve been</span> very busy <b>over the last three months</b>."]], html:true, note:"Период до сейчас → present perfect. И нужен предлог: in / over the last three months.<br><b>Your turn: Over the last three months I've ...</b>"},
  {rows:[["This year I didn't have a real holiday yet.", "I <span class=\"pp\">haven't had</span> a real holiday <b>yet this year</b>."]], html:true, note:"this year ещё идёт + yet («пока ещё») → present perfect.<br><b>Your turn: This year I haven't ... yet, but I've ...</b>"},
  {rows:[["I know Anna since June.", "I<span class=\"pp\">'ve known</span> Anna <b>since June</b>."]], html:true, note:"since — с какого-то момента и до сейчас → present perfect, не present simple («знаю с июня»).<br><b>Your turn: I've known my best friend for / since ...</b>"},
  {rows:[["I have moved to Berlin three years ago, and I live here since then.", "I <span class=\"ps\">moved</span> to Berlin <b>three years ago</b>, and I<span class=\"pp\">'ve lived</span> here <b>since then</b>."]], html:true, note:"three years ago → past simple; since then (и до сейчас) → present perfect.<br><b>Your turn: I moved to / started ... ago, and I've ... since then.</b><br><br>😄 “Waiter! What is this?” — “It's bean soup, sir.” — “I don't want to know what it's been. I want to know what it is!”"}
];
const ADD_FIRST = "Add the time and say the new sentence aloud. Does the tense change? Then tap the yellow box to check.";
const ADD_NEXT = "Add the time. Does the tense change?";
const addSteps = list => list.map((s,i)=>({type:"sayit", s, box:BOX_TIME, boxAlways:true, instr: i===0 ? ADD_FIRST : ADD_NEXT}));

/* ---------- Over to you (spreadsheet: write a sample dialogue) ---------- */
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>You're chatting with a friend from England or the USA. You haven't seen each other for a couple of months.</p>
        <ul>
          <li>Catch up: what have you both been up to?</li>
          <li>Ask for details: when? where? who with? how was it?</li>
        </ul>
        <p class="small">Write a sample dialogue (or record it — say both parts).</p>`;
const PLAN_INSTR = "Tap the phrases you'll use — three or four are enough.";
const PRODUCE_INSTR = "Write your dialogue — both parts. Then check the tenses: present perfect or past simple? Send it to Olya. (Prefer to talk? Tap Record it.)";
const MAP = [
  {h:"Start", items:[["<b>It's been ages! How have you been?</b>","сто лет не виделись! как ты?"],["<b>What have you been up to?</b>","чем занимался?"],["<b>What's new?</b>","что нового?"]]},
  {h:"Your news: present perfect", items:[["I<b>'ve started</b> a new job / a new course.","новость — без времени"],["I<b>'ve been</b> to Italy!",""],
    ["I <b>haven't seen</b> you <b>for ages</b>!","сто лет не виделись"],["I<b>'ve been</b> really busy <b>since September</b>.","с сентября и до сейчас"],
    ["I <b>haven't had</b> a real holiday <b>yet this year</b>.","год ещё идёт"]]},
  {h:"Details: past simple", items:[["<b>When did you</b> …? <b>Where</b> …? <b>Who with?</b> <b>How was it?</b>","детали — past simple"],
    ["We <b>went</b> to Portugal <b>in August</b>. It <b>was</b> lovely.",""],["I <b>started</b> a new course <b>a week ago</b>.","ago — всегда past simple"]]}
];
const TENSES = `up to now / no time → <b>present perfect</b> · a finished time (in August, last week, ago) → <b>past simple</b>`;
const MODEL_TITLE = "An example: the catch-up chat from this homework";
const filled = p => p.map(x=>typeof x==="string"?esc(x):x.b?`<b>${esc(x.b)}</b>`:x.o?"":`<b>${esc(x.f+x.r)}</b>`).join("");
const MODEL = GAPS.anna.map(l=>[l.s, filled(l.p).replace(/ \([^)]*\)/g,"").replace(/\(\d+\) /g,"")]);

const TASKS = [
  {id:"catchup-chat", topic:"news", sec:"Revision", title:"A catch-up chat: present perfect or past simple?", meta:"Say the verbs, then check", kind:"gaps",
   lead:"Present perfect or past simple? Complete the dialogue.", instr:"Say the missing verbs. Then tap the yellow boxes to check.", lines:GAPS.anna},
  {id:"add-time", topic:"news", sec:"Revision", title:"Add the time: does the tense change?", meta:"8 short steps", kind:"steps",
   steps:addSteps(ADD_TIME)},
  {id:"improve", topic:"news", sec:"Revision", title:"Improve the sentence: tense traps", meta:"11 sentences", kind:"steps",
   steps:IMPROVE.map((s,i)=>({type:"sayit", s, box:"", instr: i===0 ? "Improve this sentence: say the correct version aloud. Then tap the yellow box to check." : "Improve this sentence."}))},
  {id:"kate-chat", topic:"news", sec:"Extension", title:"Catching up with Kate: present perfect or past simple?", meta:"Say the verbs, then check", kind:"gaps",
   lead:"Present perfect or past simple? Complete the dialogue.", instr:"Say the missing verbs. Then tap the yellow boxes to check.", lines:GAPS.kate},
  {id:"add-time-2", topic:"news", sec:"Extension", title:"Add the time: six more", meta:"6 short steps", kind:"steps",
   steps:addSteps(ADD_TIME_2)},
  {id:"write", topic:"news", sec:"Over to you!", title:"Your own catch-up chat", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
