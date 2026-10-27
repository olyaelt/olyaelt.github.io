const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-02";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 02.10 homework (deck "Lesson 1 · Welcome back!", slides 144–168; the box on slide 141) ---------- */
const LESSON = { date:"02.10.26", sub:"" };
/* slide 141 and the green rows of the spreadsheet */
const BOX_LATE = `
  <h4>GIVING A HEADS-UP</h4>
  <p><span class="n">1</span>Just a heads-up — I'll be <b>10 minutes late</b>.</p>
  <p><span class="n">2</span>I'm running <b>about 20 minutes late</b>. ${ru("(уже опаздываю, я в пути)")}</p>
  <p><span class="n">3</span>Sorry, I'm running <b>a bit late</b>.</p>
  <p><span class="n">4</span>I'll be <b>half an hour late</b> for the meeting. ${ipa("/ˌhɑːf ən ˈaʊə/")} ${ru("опоздать = be late; сначала сколько, потом куда; l и h не читаются")}</p>
  <p><span class="n">5</span>Start without me — I'll <b>be there in 5</b>! ${ru("(буду через 5 минут — с there)")}</p>
  <h4>REPLYING</h4>
  <p><span class="n">6</span><b>No worries</b>, see you soon!</p>
  <p><span class="n">7</span><b>Me too, probably.</b> / I might be a bit late too. ${ru("(я, наверное, тоже)")}</p>
  <h4>ALSO</h4>
  <p>Just a heads-up — I'm <b>stuck in traffic</b>. · If you're late, <b>give a heads-up</b>. ${ru("ударение: HEAD-zup")}</p>
  <p>Sorry, my meeting is <b>running over</b>. ${ru("(затягивается)")}</p>
  <p>My train <b>has been delayed by</b> 20 minutes. = My train is 20 minutes late. ${ru("после delayed нужен by")}</p>
  <p>If you <b>miss half the meeting</b>, that's unacceptable.</p>`;
/* the green rows of the spreadsheet and the note on slide 142 */
const BOX_LAST = `
  <h4>UP TO NOW → PRESENT PERFECT</h4>
  <p><b>in / over the last</b> two months ${ru("= за последние два месяца (до сейчас)")}</p>
  <p>I<span class="pp">'ve read</span> three books <b>in the last two months</b>. Prices <span class="pp">have gone up</span> <b>over the last few months</b>. ${ru("(over — часто о постепенных изменениях)")}</p>
  <p><b>for the last</b> two years ${ru("= уже два года (длится до сейчас) — акцент на ПЕРИОДЕ")}</p>
  <p>I<span class="pp">'ve lived</span> in Berlin <b>for the last two years</b>. I <span class="pp">haven't had</span> a proper holiday <b>for / in the last two years</b>.</p>
  <h4>FINISHED TIME → PAST SIMPLE</h4>
  <p><b>last month</b> ${ru("= в прошлом месяце (законченный период)")}: I <span class="ps">started</span> a new job <b>last month</b>.</p>
  <p class="small">in the last + число (с the!) · since + момент · but: last month / a week ago / over the summer → past simple: Did you …?</p>`;
const TOPICS = [
  {id:"late", title:"Just a heads-up, I'm running a bit late", sub:"Messages when you're late, and friendly replies", box:()=>BOX_LATE},
  {id:"last", title:"In the last few weeks", sub:"Present perfect with in / over / for the last; last month with past simple", box:()=>BOX_LAST}
];

/* ---------- the practice from the deck ---------- */
/* slides 147–162: rewrite with the word in capitals */
const REWRITE = [
  {"o": "I'll arrive in five minutes.", "k": "THERE", "pre": "I'll ", "post": " five minutes.", "a": "be there in", "acc": ["be there in"], "n": "<i class=\"ru\">буду через 5 минут: через = <b>in</b></i>"},
  {"o": "Don't wait for me — I'll come soon.", "k": "WITHOUT", "pre": "", "post": " — I'll be there soon!", "a": "Start without me", "acc": ["Start without me", "Go ahead without me"], "n": "<i class=\"ru\">начинайте без меня (or: Go ahead without me.)</i>"},
  {"o": "My meeting is taking longer than we planned.", "k": "OVER", "pre": "My meeting is ", "post": ".", "a": "running over", "acc": ["running over"], "n": "<i class=\"ru\">встреча затягивается</i>"},
  {"o": "I'm going to arrive 15 minutes after the start.", "k": "LATE", "pre": "I'll ", "post": ".", "a": "be 15 minutes late", "acc": ["be 15 minutes late", "be fifteen minutes late"], "n": "<span class=\"ipa\">/ˈfɪftiːn ˈmɪnɪts/</span> <i class=\"ru\">опоздаю на 15 минут: <b>be</b> + сколько + late (late — прилагательное)</i>"},
  {"o": "Perhaps I'll be a little late too.", "k": "MIGHT", "pre": "I ", "post": " too.", "a": "might be a bit late", "acc": ["might be a bit late", "might be a little late"], "n": "<i class=\"ru\">может, тоже немного опоздаю (or: might be a little late)</i>"},
  {"o": "I just wanted to tell you in advance: I'll be late.", "k": "HEADS-UP", "pre": "I just wanted to ", "post": ": I'll be late.", "a": "give you a heads-up", "acc": ["give you a heads-up", "give you a heads up"], "n": "<span class=\"ipa\">/ˈhedz ʌp/</span> <i class=\"ru\">предупредить: give somebody <b>a</b> heads-up</i>"},
  {"o": "My train is going to arrive 20 minutes later than planned.", "k": "DELAYED", "pre": "My train ", "post": " 20 minutes.", "a": "has been delayed by", "acc": ["has been delayed by", "is delayed by"], "n": "<span class=\"ipa\">/dɪˈleɪd/</span> <i class=\"ru\">поезд задерживается на 20 минут: на сколько = <b>by</b> (or: is delayed by)</i>"},
  {"o": "If you're very late, half the meeting will be over.", "k": "MISS", "pre": "If you're very late, you'll ", "post": ".", "a": "miss half the meeting", "acc": ["miss half the meeting", "miss half of the meeting"], "n": "<span class=\"ipa\">/hɑːf/</span> <i class=\"ru\">пропустишь полвстречи (or: half of the meeting — тоже правильно)</i>"}
];

/* ---------- Over to you: slide 163, possible answers on slide 164 ---------- */
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>Write a message for each situation:</p>
        <ul>
          <li>You're <b>stuck in traffic</b>. You'll be 15 minutes late for your English lesson.</li>
          <li>Your meeting is <b>running over</b>. You might be late for dinner with friends.</li>
          <li>A friend writes: “Sorry, I'm <b>running a bit late</b>!” Reply.</li>
          <li>Your train <b>has been delayed</b>. Ask your friends <b>not to wait</b> for you.</li>
        </ul>
        <p class="small">Use a different phrase in each message.</p>`;
const PLAN_INSTR = "Tap the phrases you'll use — a different one in each message.";
const PRODUCE_INSTR = "Write your four messages. Then send them to Olya. (Prefer to talk? Tap Record it.)";
const PRODUCE_PH = "1. …&#10;2. …&#10;3. …&#10;4. …";
const PICK_MIN = 4;
const MAP = [
  {h:"Giving a heads-up", items:[["<b>Just a heads-up</b> — I'll be 10 minutes late.","предупреждаю: опоздаю на 10 минут"],["I'm <b>running about 20 minutes late</b>.","уже опаздываю, я в пути"],
    ["Sorry, I'm <b>running a bit late</b>.","немного опаздываю"],["I'll <b>be half an hour late</b> for the meeting.","опоздаю на полчаса"],["I'm <b>stuck in traffic</b>.","стою в пробке"],
    ["My meeting is <b>running over</b>.","встреча затягивается"],["I <b>might be a bit late</b>.","может, немного опоздаю"],["My train <b>has been delayed by</b> 20 minutes.","поезд задерживается на 20 минут"],
    ["<b>Start without me</b> — I'll <b>be there in</b> 5!","начинайте без меня — буду через 5 минут"]]},
  {h:"Replying", items:[["<b>No worries</b>, see you soon!","ничего страшного, до скорого"],["<b>Me too, probably.</b>","я, наверное, тоже"]]}
];
const MODEL_TITLE = "Possible answers (yours can be different, of course!)";
const MODEL = [
  ["1", `${g("Just a heads-up")} — I'm ${g("stuck in traffic")}, so I'll ${g("be 15 minutes late")}. Sorry!`],
  ["2", `Sorry, I ${g("might be a bit late")} — my meeting is ${g("running over")}.`],
  ["3", `${g("No worries")}! See you soon.`],
  ["4", `My train ${g("has been delayed by")} half an hour. ${g("Start without me")} — I'll ${g("be there")} as soon as I can!`]
];

const TASKS = [
  {id:"late-chat", topic:"late", sec:"Extension", title:"Running late: complete the group chat", meta:"1 group chat", kind:"steps", min:5,
   steps:[{type:"dlg", lines:GAPS.late, note:"(5) also possible: is delayed by",
     instr:"Running late: complete the group chat. Use the words in brackets. Say the missing words, then tap Show the answers."}]},
  {id:"late-rewrite", topic:"late", sec:"Extension", title:"Running late: rewrite the sentence", meta:"8 short steps", kind:"steps",
   steps:REWRITE.map((r,i)=>({type:"rewrite", r, first:i===0}))},
  {id:"last-chat", topic:"last", sec:"Extension", title:"In the office kitchen: last, in the last or for the last?", meta:"1 dialogue", kind:"steps", min:5,
   steps:[{type:"dlg", intro:"MONDAY, 9:45 am, in the office kitchen", lines:GAPS.kitchen,
     note:"(4) in a negative: in or for · (6), (8) over — especially for a gradual change; in is fine too · (7) AmE: has gotten · (12) the last few weeks = the subject: no preposition",
     instr:"Put the verbs in the right form. Choose: last / in the last / over the last / for the last. Sometimes two answers are possible. Then tap Show the answers."}]},
  {id:"write", topic:"late", sec:"Over to you!", title:"Your messages: running late", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const TENSES = "";
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
