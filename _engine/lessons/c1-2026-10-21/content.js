const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-10-21";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;

/* ---------- content of this page: the 21.10 homework (deck "Lesson 3–4", slides 31–32, 34–40; YouGlish) ---------- */
const LESSON = { date:"21.10.26", sub:"" };
/* the Useful language box, slide 40 (Russian as in the glossaries on slides 35 and 38) */
const MAP = [
  {h:"Ask", items:[
    ["<b>So, what do you do?</b>","а чем ты занимаешься?"],
    ["<b>How did you get into that</b>, then?","как ты к этому пришёл?","how did you start doing it? (then = so: shows interest)"],
    ["<b>Have you always been a</b> teacher?","ты всегда была учителем?"],
    ["<b>Was it worth it</b>, though? <span class=\"ipa\">/wɜːθ/</span>","и как, оно того стоило?","about something that took time, money or effort"]]},
  {h:"How you started", items:[
    ["I <b>did</b> economics <b>at uni</b>. <span class=\"small\">or: I studied…</span>","учился на экономиста","studied it · AmE: majored in … in college"],
    ["That's <b>just what everyone did</b>.","так было принято"],
    ["I <b>trained as</b> a teacher.","выучилась на учителя","did teacher training"],
    ["I <b>did a course in</b> project management.","прошла курс по…","one programme = a course (not courses) · AmE also: took a course in…"],
    ["<b>A job came up</b> in Dublin.","подвернулась работа","became available"]]},
  {h:"Was it useful?", items:[
    ["It <b>gave me a good grounding in</b> statistics. <span class=\"ipa\">/ˈɡraʊndɪŋ/</span>","дал(а) хорошую базу по…","a solid foundation in"],
    ["I <b>learned most of it on the job</b>.","научилась уже на работе","while working"],
    ["The chemistry <b>is the easy part</b>. <b>It's the</b> parents' evenings <b>I find hard</b>.","химия — это просто, а вот встречи с родителями мне даются тяжело"]]}
];
const TENSES = "";
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");
const MAP_NUMBERED = false;
const mapBox = (withRu=true) => box(mapInner(MAP, withRu, MAP_NUMBERED, TENSES));
const TOPICS = [
  {id:"career", title:"How did you get into that?", sub:"Talking about your studies and your career path", box:()=>mapInner(MAP)}
];
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
/* the box on slide 31, with its pronunciation notes */
const BOX_TRAPS = `
  <h4>HOW YOU STARTED</h4>
  <p>I <b>did</b> economics <b>at uni</b>. <span class="small">or: I studied…</span></p>
  <p>That's <b>just what everyone did</b>.</p>
  <p>I <b>trained as</b> a teacher.</p>
  <p>I <b>did a course in</b> project management.</p>
  <p><b>A job came up</b> in Dublin.</p>
  <h4>WAS IT USEFUL?</h4>
  <p>It <b>gave me a good grounding in</b> statistics.</p>
  <p>I <b>learned most of it on the job</b>.</p>
  <p>The chemistry <b>is the easy part</b>.</p>
  <p><b>It's the</b> parents' evenings <b>I find hard</b>.</p>
  <h4>ASK</h4>
  <p><b>How did you get into that</b>, then?</p>
  <p><b>Have you always been</b> a teacher?</p>
  <p><b>Was it worth it</b>, though?</p>
  <h4>PRONUNCIATION</h4>
  <p>uni ${ipa("/ˈjuːni/")} · grounding ${ipa("/ˈɡraʊndɪŋ/")}</p>
  <p>worth ${ipa("/wɜːθ/")} · evenings ${ipa("/ˈiːvnɪŋz/")} two syllables</p>
  <p>chemistry ${ipa("/ˈkemɪstri/")}</p>`;
const BOX_CLOCKS = "", BOX_SHARE = "";
const READ_INTRO = "A friend's birthday dinner. Sophie has just moved to the area and only knows the host, so over dinner she chats to the people sitting near her.";
const MODEL = [];
const TASK_HTML = "", PLAN_INSTR = "", PRODUCE_INSTR = "", PRODUCE_NOTE = "";
const TQ_STEPS = [];

/* ---------- the practice from the deck ---------- */
/* slides 31–32: common traps (grey = the one thing to change) */
const TRAPS = [
  {rows:[[`<span class="en">I have a <span class="trap">diploma</span> in physics.</span> ${ru("(законченное высшее по физике)")}`, `I have a ${g("degree")} in physics. / I ${g("did")} physics ${g("at uni")}.`]], html:true,
   note:`I have a <s class="fb-del">diploma</s> <b class="fb-good">in physics</b>.<br>Диплом о высшем — degree. Diploma тоже бывает: в AmE это сам документ, в BrE — другие, обычно более короткие квалификации.<br>AmE: I majored in physics in college.<br><span class="small">green = good · grey = the one thing to change</span>`},
  {rows:[[`<span class="en">I studied <span class="trap">at the faculty of mathematics</span>.</span> ${ru("(учился на матфаке)")}`, `I studied ${g("maths")}. / I did ${g("maths at uni")}.`]], html:true,
   note:`<b class="fb-good">I studied</b> <s class="fb-del">at the faculty of mathematics</s>.<br>Факультет в разговоре обычно не называют — называют предмет.<br>AmE: math`},
  {rows:[[`<span class="en">Last year I did <span class="trap">courses</span> in automated testing — four months, online.</span> ${ru("(одна программа на четыре месяца)")}`, `Last year I did ${g("a course")} in automated testing — four months, online.`]], html:true,
   note:`<b class="fb-good">Last year I did</b> <s class="fb-del">courses</s> in automated testing — four months, online.<br>Одна программа — a course. Courses — несколько разных курсов. Можно и так: I took a course in…`},
  {rows:[[`<span class="en">Nobody taught me how to talk to clients — I learned it <span class="trap">in practice</span>.</span> ${ru("(научилась в процессе работы)")}`, `Nobody taught me how to talk to clients — I learned it ${g("on the job")}.`]], html:true,
   note:`<b class="fb-good">Nobody taught me how to talk to clients</b> — I learned it <s class="fb-del">in practice</s>.<br>In practice — «на деле, в реальности». Научилась в процессе работы — on the job; шире: through experience / by doing it.`}
];
const DLG_GLOSS = "Remember the missing words and how to say them. Tap the yellow and orange boxes to check.";
const DLG_PLAIN = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";
const textSteps = (k, intro) => [{type:"dlg", intro, lines:GAPS[k].lines_g, gloss:GAPS[k].gloss, instr:DLG_GLOSS},
                                 {type:"dlg", intro, lines:GAPS[k].lines, instr:DLG_PLAIN}];
const YG = (expr, first) => `<p>${first ? `Look at 5–7 more examples of <b>“${expr}”</b> in authentic contexts.` : `Same for <b>“${expr}”</b>: look at 5–7 more examples.`} In what other contexts can you use ${first ? "this expression" : "it"}?</p>`;
const YG_AFTER = "Anything new or surprising? You can tell Olya: tap “I've done it”, then “I have a question”.";
const TASKS = [
  {id:"traps", topic:"career", sec:"Revision", title:"Common traps: what would Dan or Ruth say?", meta:"4 sentences", kind:"steps",
   steps:TRAPS.map((s,i)=>({type:"sayit", s, box:BOX_TRAPS, boxAlways:true,
     instr: i===0 ? "Russian speakers often say the grey part. What would Dan or Ruth say instead? Use the box. Say it aloud, then tap the yellow box to check." : "What would Dan or Ruth say instead?"}))},
  {id:"dan-text", topic:"career", sec:"Revision", title:"Dan's story: the missing words", meta:"With the glossary, then without", kind:"steps",
   steps:textSteps("dan", READ_INTRO)},
  {id:"ruth-text", topic:"career", sec:"Revision", title:"Ruth's story: the missing words", meta:"With the glossary, then without", kind:"steps",
   steps:textSteps("ruth", "")},
  {id:"yg-get", topic:"career", sec:"Extension", title:"YouGlish: How did you get into that?", meta:"5–7 real examples", kind:"link", min:5,
   url:"https://youglish.com/pronounce/How_did_you_get_into_that/english", cta:"Open YouGlish", body:YG("How did you get into that?", true), after:YG_AFTER},
  {id:"yg-easy", topic:"career", sec:"Extension", title:"YouGlish: the easy part", meta:"5–7 real examples", kind:"link", min:5,
   url:"https://youglish.com/pronounce/%22is_the_easy_part%22/english", cta:"Open YouGlish", body:YG("the easy part", false), after:YG_AFTER},
  {id:"yg-training", topic:"career", sec:"Extension", title:"YouGlish: by training", meta:"5–7 real examples", kind:"link", min:5,
   url:"https://youglish.com/pronounce/%22by_training%22/english", cta:"Open YouGlish", body:YG("by training", false), after:YG_AFTER}
];
