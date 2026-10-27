const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-09";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 09.10 homework (deck "Lessons 4–5", slides 12–15, 35–44, 45–64; the box on slide 47) ---------- */
const LESSON = { date:"09.10.26", sub:"" };
/* slide 47 and the green rows of the spreadsheet */
const BOX_WHAT = `
  <h4>WHAT HAPPENED</h4>
  <p>My car <b>got broken into</b>. ${ru("вскрыли")}</p>
  <p>Someone <b>broke into</b> our flat. ${ru("вломился")}</p>
  <p><b>burglaries in the area</b> ${ru("кражи со взломом")}</p>
  <p>They <b>stole some jewellery</b>. ${ru("украшения")}</p>
  <p>I've <b>had my phone stolen</b>. ${ru("у меня украли")}</p>
  <p>The shop <b>was robbed</b>. ${ru("ограбили")}</p>
  <p><b>an armed robbery</b> ${ru("с оружием")}</p>
  <p>I <b>got pickpocketed</b>. ${ru("обокрали")}</p>
  <p>He <b>was caught shoplifting</b>. ${ru("поймали")}</p>
  <p>a new <b>scam going round</b> ${ru("ходит схема")}</p>
  <p><b>pretend to be</b> from… ${ru("выдавать себя за")}</p>
  <p><b>report</b> sb <b>to the police</b> ${ru("заявить")}</p>`;
const BOX_CRIME = BOX_WHAT + `
  <h4>REACTING</h4>
  <p><b>Sorry to hear that.</b> · <b>Thanks for the heads-up.</b> · <b>Good to know.</b> · <b>Case closed!</b> ${ru("(= short for 'the case is closed')")}</p>
  <p><b>These days, you have to watch out.</b></p>
  <p class="small">was robbed = got robbed: оба верны</p>`;
const TOPICS = [
  {id:"crime", title:"What's going on on Linden Street?", sub:"Crime and incidents in the neighbourhood: group chats", box:()=>BOX_CRIME}
];

/* ---------- the practice from the deck ---------- */
const REWRITE = [
  {"o": "Someone broke into my office over the weekend.", "k": "GOT", "pre": "My office ", "post": " over the weekend.", "a": "got broken into", "acc": ["got broken into", "was broken into"], "n": "<span class=\"ipa\">/ˈbrəʊkən/</span> <i class=\"ru\">вскрыли, вломились: get + V3 + into (или: was broken into)</i>"},
  {"o": "Someone stole my wallet from my bag while I was on the train.", "k": "GOT", "pre": "I ", "post": " on the train.", "a": "got pickpocketed", "acc": ["got pickpocketed", "got my wallet stolen"], "n": "<span class=\"ipa\">/ˈpɪkpɒkɪtɪd/</span> <i class=\"ru\">меня обокрали (карманник) (или: I got my wallet stolen)</i>"},
  {"o": "Lots of houses around here have been broken into recently.", "k": "AREA", "pre": "There have been a lot of ", "post": " recently.", "a": "burglaries in the area", "acc": ["burglaries in the area", "burglaries around here", "burglaries in our area"], "n": "<span class=\"ipa\">/ˈbɜːɡləriz/ /ˈeəriə/</span> <i class=\"ru\">кражи со взломом в районе (или: around here / in our area)</i>"},
  {"o": "A man with a gun robbed a bank in the city centre yesterday.", "k": "ARMED", "pre": "There was ", "post": " at a bank in the city centre yesterday.", "a": "an armed robbery", "acc": ["an armed robbery"], "n": "<span class=\"ipa\">/ɑːmd ˈrɒbəri/</span> <i class=\"ru\">вооружённое ограбление: <b>an</b> armed</i>"},
  {"o": "A security guard caught two students stealing from the bookshop.", "k": "SHOPLIFTING", "pre": "Two students ", "post": " at the bookshop.", "a": "were caught shoplifting", "acc": ["were caught shoplifting", "got caught shoplifting"], "n": "<span class=\"ipa\">/kɔːt/</span> <i class=\"ru\">их поймали на краже в магазине (или: got caught)</i>"},
  {"o": "Lots of people are getting fake texts about a parcel delivery at the moment.", "k": "GOING", "pre": "There's a new ", "post": " — fake texts about a parcel delivery.", "a": "scam going round", "acc": ["scam going round", "scam going around"], "n": "<span class=\"ipa\">/skæm/</span> <i class=\"ru\">ходит новая схема (или: going around)</i>"},
  {"o": "Be careful — people are calling and saying they're from your bank, but they aren't.", "k": "PRETENDING", "pre": "Be careful — people are calling and ", "post": " from your bank.", "a": "pretending to be", "acc": ["pretending to be", "pretending they're"], "n": "<span class=\"ipa\">/prɪˈtendɪŋ/</span> <i class=\"ru\">выдают себя за (или: pretending they're)</i>"},
  {"o": "If the man next door scratches my car again, I'll tell the police about him.", "k": "REPORT", "pre": "If the man next door scratches my car again, I'll ", "post": " the police.", "a": "report him to", "acc": ["report him to", "report it to"], "n": "<i class=\"ru\">заявлю на него: <b>report</b> sb <b>to</b> the police (или: report it to)</i>"},
  {"o": "Someone has stolen my phone from the changing room at the gym!", "k": "HAD", "pre": "I've ", "post": " from the changing room at the gym!", "a": "had my phone stolen", "acc": ["had my phone stolen"], "n": "<i class=\"ru\">у меня украли телефон: have + что + V3</i>"}
];
const GLOSS_I = "Remember the missing words and how to say them. Tap the yellow and orange boxes to check.";
const PLAIN_I = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";

/* ---------- Over to you (spreadsheet: a similar chat about incidents in your town) ---------- */
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>Write a chat like the Linden Street chat: neighbours talk about incidents that happened in <b>your</b> town.</p>
        <ul>
          <li>at least 5 crime expressions</li>
          <li>friendly reactions to the news (look at the chats in this homework)</li>
          <li>present perfect or past simple? Check before you send.</li>
        </ul>`;
const PLAN_INSTR = "Tap the phrases you'll use — at least five crime expressions and some reactions.";
const PRODUCE_INSTR = "Write your chat. Check the tenses: present perfect or past simple? Then send it to Olya. (Prefer to talk? Tap Record it.)";
const PRODUCE_PH = "Anna: …&#10;Tom: …";
const PICK_MIN = 5;
const MAP = [
  {h:"Start", items:[["<b>Heads up, everyone</b> — …","внимание всем (предупреждение)"],["<b>Did you hear about</b> the petrol station?","слышали про…?"],["<b>UPDATE:</b> …","новости по теме"]]},
  {h:"What happened", items:[["My car <b>got broken into</b>.","вскрыли"],["Someone <b>broke into</b> our flat.","вломился"],["There have been a lot of <b>burglaries in the area</b>.","кражи со взломом в районе"],
    ["They <b>stole some jewellery</b>.","украшения"],["I've <b>had my phone stolen</b>.","у меня украли"],["The shop <b>was robbed</b>.","ограбили"],["<b>an armed robbery</b>","вооружённое ограбление"],
    ["I <b>got pickpocketed</b>.","обокрали"],["He <b>was caught shoplifting</b>.","поймали на краже в магазине"],["There's a new <b>scam going round</b>.","ходит новая схема"],
    ["Someone <b>pretends to be</b> from the gas company.","выдаёт себя за"],["<b>report</b> sb <b>to the police</b>","заявить в полицию"]]},
  {h:"Reacting", items:[["<b>Sorry to hear that.</b>","жаль это слышать"],["<b>Same here</b>, actually.","у меня тоже"],["<b>Thanks for the heads-up.</b>","спасибо, что предупредил(а)"],
    ["<b>Good to know.</b>","буду знать"],["<b>Watch out</b> — …","будьте осторожны"],["<b>Case closed!</b>","дело закрыто"]]}
];
const TENSES = `news, no exact time → <b>present perfect</b>: there <b>have been</b> a lot of burglaries recently · details (when? what happened?) → <b>past simple</b>: someone <b>broke into</b> the flat last month`;
const MODEL_TITLE = "The Linden Street chat (this homework)";
const filled = p => p.map(x=>typeof x==="string"?esc(x):x.b?`<b>${esc(x.b)}</b>`:x.o?"":`<b>${esc(x.f+x.r)}</b>`).join("").replace(/<\/b> <b>/g," ");
const MODEL = [...GAPS.lin1.lines, ...GAPS.lin2.lines].map(l=>[l.s, filled(l.p)]);

const TASKS = [
  {id:"linden-text", topic:"crime", sec:"Revision", title:"The Linden Street chat: the missing words", meta:"Two parts: with the glossary, then without", kind:"steps",
   steps:[{type:"dlg", intro:GAPS.lin1.intro, lines:GAPS.lin1.lines, gloss:GAPS.lin1.gloss, instr:GLOSS_I},
          {type:"dlg", intro:GAPS.lin1.intro, lines:GAPS.lin1.lines, instr:PLAIN_I},
          {type:"dlg", lines:GAPS.lin2.lines, gloss:GAPS.lin2.gloss, instr:"The chat goes on. " + GLOSS_I},
          {type:"dlg", lines:GAPS.lin2.lines, instr:PLAIN_I}]},
  {id:"parents-chat", topic:"crime", sec:"Extension", title:"The parents' group chat: use the words in brackets", meta:"4 short parts", kind:"steps",
   steps:GAPS.parents.map((x,i)=>({type:"dlg", intro:x.intro, lines:x.lines, note:x.note,
     instr: i===0 ? "Complete the parents' chat. Use the words in brackets. Say the missing words, then tap Show the answers." : "The chat goes on. Complete it."}))},
  {id:"crime-rewrite", topic:"crime", sec:"Extension", title:"Crime and incidents: rewrite the sentence", meta:"9 short steps", kind:"steps",
   steps:REWRITE.map((r,i)=>({type:"rewrite", r, first:i===0, box:BOX_WHAT}))},
  {id:"write", topic:"crime", sec:"Over to you!", title:"Your chat about incidents in your town", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const READ_INTRO = "";
const PRODUCE_NOTE = ``;
const BOX_SHARE = "";
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
