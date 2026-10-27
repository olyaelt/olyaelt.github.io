const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-10-23";

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
  {id:"career", title:"How did you get into that?", sub:"Talking about your studies and your career path", box:()=>mapInner(MAP, true, false, TENSES)}
];
const READ_INTRO = "A friend's birthday dinner. Sophie has just moved to the area and only knows the host, so over dinner she chats to the people sitting near her.";
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>At a dinner, you meet someone new.</p>
        <ul>
          <li><b>They ask:</b> “So, what do you do?” and “How did you get into that?”</li>
          <li><b>You:</b> tell your story in about a minute — then ask “And what about you?”</li>
        </ul>
        <p class="small">Retired? They'll ask: “What did you do before?” · Record it or write it.</p>`;
const PLAN_INSTR = "Tap the phrases you'll use — three or four are enough.";
const PRODUCE_INSTR = "Write your story — a short paragraph is enough. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const PRODUCE_NOTE = `<p class="small">Listen to it once. Not happy? Record a better version.</p>`;
const MAP_NUMBERED = false;
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
/* Over to you: the box for the story (English meaning, then Russian, as in the C1 glossaries) */
const MAP = [
  {h:"Ask", items:[
    ["<b>So, what do you do?</b>","а чем ты занимаешься?"],
    ["<b>How did you get into that</b>, then?","как ты к этому пришёл?","how did you start doing it? (then = so: shows interest)"],
    ["<b>Have you always been a</b> teacher?","ты всегда была учителем?"],
    ["<b>Was it worth it</b>, though? <span class=\"ipa\">/wɜːθ/</span>","и как, оно того стоило?","about something that took time, money or effort"],
    ["<b>What about you?</b>","а ты?"]]},
  {h:"How you started", items:[
    ["I <b>did</b> economics <b>at uni</b>.","учился на экономиста","studied it · neutral: at university · AmE: majored in … in college"],
    ["That's <b>just what everyone did</b>.","так было принято"],
    ["I <b>trained as</b> a teacher.","выучилась на учителя","did teacher training"],
    ["I'm an economist <b>by training</b>.","по образованию экономист","what you studied or trained as"],
    ["I <b>did a course in</b> project management.","прошла курс по…","one programme = a course (not courses)"],
    ["<b>A job came up</b> in Dublin.","подвернулась работа","became available"]]},
  {h:"Was it useful?", items:[
    ["It <b>gave me a good grounding in</b> statistics. <span class=\"ipa\">/ˈɡraʊndɪŋ/</span>","дал(а) хорошую базу по…","a solid foundation in"],
    ["I <b>learned most of it on the job</b>.","научилась уже на работе","while working"],
    ["The chemistry <b>is the easy part</b>. <b>It's the</b> parents' evenings <b>I find hard</b>.","химия — это просто, а вот встречи с родителями мне даются тяжело"]]}
];
const TENSES = `Still true → <b>present perfect</b>: I've been teaching for 22 years now. · A finished step → <b>past simple</b>: A job came up three years ago.`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");
const mapBox = (withRu=true) => box(mapInner(MAP, withRu, MAP_NUMBERED, TENSES));
const CHECKS = [
  ["What you studied and why","I did … at uni because… / That's just what everyone did"],
  ["Was it any use?","It gave me a good grounding in… — or not really?"],
  ["How you really learned to do it","on the job? a course?"],
  ["How you got the job","did one just come up?"],
  ["The easy part and the hard part",""],
  ["A personal detail","or a little joke, if you like"],
  ["A question back","And what about you?"]
];
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;

/* ---------- content (from the deck, slides 38, 40–55, 71, 110–133, 23–24) ---------- */
const REWRITE = [
  {o:"Is ten o'clock still OK for you?", k:"WORK", pre:"Does ten o'clock ", post:"?", a:"still work for you", acc:["still work for you"],
   n:`${ipa("/wɜːk/")}<br>After does: work, no -s.<br>${ru("тебе всё ещё удобно в десять?")}`},
  {o:"From next week, our call will start at two your time instead of one.", k:"LATER", pre:"From next week, our call will be ", post:".", a:"an hour later for you", acc:["an hour later for you","an hour later your time"],
   n:`later = at a later time; late = not on time.<br>${ru("на час позже по твоему времени")}<br>${ru("or: an hour later your time")}`},
  {o:"My degree is in physics.", k:"DID", pre:"I ", post:" university.", a:"did physics at", acc:["did physics at","did a physics degree at"],
   n:`${ipa("/ˈfɪzɪks/")}<br>do + subject, no article; at university.<br>${ru("учился на физика")}<br>${ru("or: did a physics degree at")}<br>${ru("AmE: I majored in physics in college.")}`},
  {o:"Why did you decide to work in HR?", k:"GET", pre:"How ", post:" HR?", a:"did you get into", acc:["did you get into","did you get started in"],
   n:`How did you get into…? sounds interested, not suspicious.<br>${ru("а как ты к этому пришёл?")}<br>${ru("or: did you get started in")}`},
  {o:"I really can't wait to see you next week.", k:"FORWARD", pre:"I'm really ", post:" you next week.", a:"looking forward to seeing", acc:["looking forward to seeing"],
   n:`look forward to + -ing: to is a preposition here.<br>${ru("очень жду встречи")}`},
  {o:"The course taught me the basics of statistics.", k:"GROUNDING", pre:"The course gave ", post:" statistics.", a:"me a good grounding in",
   acc:["me a good grounding in","me a solid grounding in","me a thorough grounding in","me a basic grounding in","me a grounding in"],
   n:`${ipa("/ˈɡraʊndɪŋ/")}<br>a good grounding in + subject.<br>${ru("дал мне хорошую базу по статистике")}<br>${ru("or: me a solid / thorough / basic grounding in")}<br>${ru("or: me a grounding in")}`},
  {o:"I did a course to become a yoga teacher too.", k:"TRAINED", pre:"I ", post:" a yoga teacher too.", a:"trained as", acc:["trained as","trained to be"],
   n:`trained as — active: I trained (I did it myself).<br>${ru("я ещё и выучилась на преподавателя йоги")}<br>${ru("or: trained to be")}`},
  {o:"I moved to Melbourne ten years ago, and I still love it here.", k:"LIVED", pre:"I ", post:" ten years, and I still love it here.", a:"have lived in Melbourne for",
   acc:["have lived in Melbourne for","have been living in Melbourne for"],
   n:`Melbourne ${ipa("/ˈmelbən/")}<br>Still there → present perfect + for.<br>${ru("я живу в Мельбурне уже десять лет")}`},
  {o:"Back then, you couldn't earn enough to live on as a teacher.", k:"LIVING", pre:"Back then, you couldn't ", post:" a teacher.", a:"make a living as", acc:["make a living as","earn a living as"],
   n:`${ipa("/ˈlɪvɪŋ/")}<br>make a living as + job.<br>${ru("прокормиться учительской зарплатой")}<br>${ru("or: earn a living as")}`},
  {o:"It's a pity she spent all those years as a governess — she was capable of so much more.", k:"HAVE", pre:"It's a pity she spent all those years as a governess — she ", post:" so much more.",
   a:"could have done", acc:["could have done","could have achieved","could have been"],
   n:`could have done ${ipa("/kʊd əv ˈdʌn/")} · governess ${ipa("/ˈɡʌvənəs/")}<br>could have + past participle: it was possible, but it didn't happen.<br>${ru("она могла бы сделать гораздо больше")}<br>${ru("or: could have achieved / could have been")}`}
];
const FINISH = [
  {pre:"The clocks go back on Sunday, so ", hint:"мы поспим на час дольше", post:"!", a:"we'll get an extra hour of sleep",
   acc:["we'll get an extra hour of sleep","we'll get an extra hour's sleep","we get an extra hour of sleep","we can sleep an hour longer","we get an extra hour in bed"],
   n:`sleep is a noun here: an extra hour of sleep / an extra hour's sleep.<br>${ru("or: we can sleep an hour longer / we get an extra hour in bed")}<br>${ru("AmE: the clocks fall back")}`},
  {pre:"", hint:"У нас часы не переводят", post:", so I can never remember whether our calls move earlier or later.", a:"We don't change the clocks here",
   acc:["We don't change the clocks here","The clocks don't change here","We don't have daylight saving here","We don't have daylight saving time here"],
   n:`change the clocks — the clocks, plural.<br>${ru("or: The clocks don't change here / We don't have daylight saving (time) here")}`},
  {pre:"He's a brilliant programmer, but ", hint:"у него нет высшего образования", post:".", a:"he doesn't have a degree",
   acc:["he doesn't have a degree","he hasn't got a degree","he never went to university","he never went to college"],
   n:`${ipa("/dɪˈɡriː/")}<br>a degree = higher education; education = any schooling.<br>${ru("A diploma is usually a lower qualification than a degree.")}<br>${ru("or: he hasn't got a degree / he never went to university")}<br>${ru("AmE: he never went to college")}`},
  {pre:"I was never ", hint:"силён в математике в школе", post:".", a:"good at maths at school", acc:["good at maths at school","good at math in school"],
   n:`maths ${ipa("/mæθs/")}<br>good at + subject; at school, no article.<br>${ru("AmE: good at math in school")}`},
  {pre:"I'm ", hint:"по образованию экономист", post:", but I've worked in IT for years.", a:"an economist by training",
   acc:["an economist by training","a trained economist","an economist by education"],
   n:`economist ${ipa("/ɪˈkɒnəmɪst/")}<br>X by training = what you studied or trained as.<br>${ru("or: a trained economist / an economist by education (less common)")}`},
  {pre:"Then a job came up at a logistics company, so ", hint:"я перешла к ним", post:", and I learned the rest on the job.", a:"I joined them",
   acc:["I joined them","I took it","I went to work for them"],
   n:`A story in the past → past simple: joined.<br>${ru("or: I took it / I went to work for them")}`},
  {pre:"And what does your husband do, ", hint:"если не секрет", post:"?", a:"if you don't mind me asking", acc:["if you don't mind me asking","if you don't mind my asking"],
   n:`A polite way to ask something personal.<br>${ru("or: if you don't mind my asking")}`},
  {pre:"— How are you doing?\n— ", hint:"Да ничего, спасибо", post:". You?", a:"Not too bad, thanks", acc:["Not too bad, thanks","Not bad, thanks","Pretty good, thanks"],
   n:`The usual friendly answer.<br>${ru("or: Not bad, thanks / Pretty good, thanks")}`},
  {pre:"", hint:"Я учу английский уже 30 лет", post:", and I'm still not fluent!", a:"I've been learning English for 30 years now",
   acc:["I've been learning English for 30 years now","I've been learning English for 30 years","I've been learning English for thirty years now","I've been learning English for thirty years",
        "I've been studying English for 30 years now","I've been studying English for 30 years","I've studied English for 30 years now","I've studied English for 30 years"],
   n:`30 years ${ipa("/ˈθɜːti ˈjɪəz/")}<br>Still learning → present perfect (continuous); now is optional.<br>${ru("or: I've been studying / I've studied English for 30 years")}`},
  {pre:"If she had stayed in Warsaw, she ", hint:"никогда не смогла бы получить высшее", post:".", a:"could never have got a degree",
   acc:["could never have got a degree","would never have got a degree","would never have been able to get a degree","could never have gone to university","could never have gotten a degree"],
   n:`could never have got ${ipa("/kʊd ˈnevər əv ˈɡɒt/")}<br>if + past perfect → could have + past participle.<br>${ru("or: would never have got a degree")}<br>${ru("or: would never have been able to get a degree / could never have gone to university")}<br>${ru("AmE: could never have gotten a degree")}`}
];
const MODEL = [
  ["Sophie","So, what do you do?"],
  ["Dan","Me? I'm in finance."],
  ["Sophie","Oh, right. <b>How did you get into that</b>, then?"],
  ["Dan","I went to uni because <b>that's just what everyone did</b>, and I <b>did economics</b> because my dad said it was “safe”. And to be fair, it <b>gave me a good grounding in</b> statistics, which I still use. I started in audit, at one of the big firms — lots of travelling, lots of hotels, lots of spreadsheets at two in the morning."],
  ["Sophie","Two in the morning?!"],
  ["Dan","Oh yes, regularly. And on top of that, I spent my evenings studying for my accountancy exams, which was horrible, but in my field you can't really get anywhere without them. Then I moved into financial analysis, which is much more my thing. Three years ago <b>a job came up</b> in Dublin, so we packed up and went. For the last couple of years I've been looking after the numbers for a few of our European offices."],
  ["Sophie","<b>Was it worth it</b>, though? All those evenings?"],
  ["Dan","For the job, definitely. For my marriage — you'd have to ask my wife."],
  ["Sophie","What about you, Ruth?"],
  ["Ruth","I teach chemistry at an international school — so, teenagers and small explosions, basically."],
  ["Sophie","Ha! Brave woman. <b>Have you always been a teacher</b>?"],
  ["Ruth","Pretty much. I did chemistry at uni, and then I <b>trained as a teacher</b>, which I'd always sort of known I'd do. My mum was a teacher too. The degree gave me a good grounding in the subject, but the actual teaching? I <b>learned most of that on the job</b>, from the people in the classroom next door. About ten years ago I <b>did a course in</b> teaching kids whose first language isn't English — online, a year of evenings, and it cost a fortune."],
  ["Sophie","Ouch!"],
  ["Ruth","I know. But it completely changed how I teach. Anyway, I've been teaching for twenty-two years now, and <b>the chemistry is the easy part</b>. <b>It's the parents' evenings I find hard</b>."],
  ["Sophie","Really? Why?"],
  ["Ruth","In the lab, at least I know what's going to explode."]
];
const TQ_STEPS = [];
const RW_FIRST = "Rewrite it with the word in capitals (2–5 words). Type the missing part or say it aloud, then tap Check.";
const FIN_FIRST = "Finish the sentence in English. Type it or say it aloud, then tap Check.";
const TASKS = [
  {id:"clocks-text", topic:"clocks", sec:"Revision", title:"The clock change chat: the missing words", meta:"Say the missing words, then check", kind:"gaps",
   lead:"Now without the glossary.", instr:"Say the missing words. Then tap the yellow boxes to check.", lines:GAPS.clocks},
  {id:"clock-listen", topic:"clocks", sec:"Extension", title:"Listening: the clock change", meta:"10 short clips from real videos", kind:"steps",
   steps:TQ.tq1.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"clock-practice", topic:"clocks", sec:"Extension", title:"Practice: rewrite and finish", meta:"4 sentences", kind:"steps",
   steps:[{type:"rewrite",r:REWRITE[0],first:true,instrFirst:RW_FIRST},{type:"rewrite",r:REWRITE[1]},
          {type:"rewrite",r:FINISH[0],first:true,instrFirst:FIN_FIRST},{type:"rewrite",r:FINISH[1],instr:"Finish the sentence in English."}]},
  {id:"career-rewrite", topic:"career", sec:"Revision", title:"Rewrite the sentence", meta:"8 sentences about studies and work", kind:"steps",
   steps:REWRITE.slice(2).map((r,i)=>({type:"rewrite",r,first:i===0,instrFirst:RW_FIRST}))},
  {id:"career-finish", topic:"career", sec:"Revision", title:"Finish it in English", meta:"8 sentences", kind:"steps",
   steps:FINISH.slice(2).map((r,i)=>({type:"rewrite",r,first:i===0,instrFirst:FIN_FIRST,instr:"Finish the sentence in English."}))},
  {id:"career-listen", topic:"career", sec:"Extension", title:"Listening: how did you get into that?", meta:"15 short clips from real videos", kind:"steps",
   takeaway:"Takeaways? Anything you've realised about how the expressions are used? Any other expressions you've picked up?",
   steps:TQ.career.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"write", topic:"career", sec:"Over to you!", title:"So, how did you get into that?", meta:"Your task · plan · record and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];

