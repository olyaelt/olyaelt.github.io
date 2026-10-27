const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = __TQ__;   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-c1-2026-10-16";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;

/* ---------- content of this page: the 14.10 and 16.10 homework (deck "Lesson 1–2", slides 15–18, 20, 22–33, 41–70; TubeQuizard quizzes 1–3) ---------- */
const LESSON = { date:"16.10.26", sub:"" };
/* the Useful language box, slide 20 */
const MAP = [
  {h:"Catching up", items:[
    ["<b>Long time no see!</b> / <b>It's been ages!</b>","сто лет не виделись!"],
    ["So, <b>what have you been up to?</b>","что нового?"],
    ["<b>Last I heard</b>, you were…","насколько я слышал(а)"],
    ["<b>I've been meaning to get in touch.</b>","всё собирался написать"],
    ["<b>We should catch up properly!</b>","надо нормально пообщаться"]]},
  {h:"With anyone", items:[
    ["I <b>split my time between</b> A and B.","живу на два города"],
    ["I'm <b>on the road</b> a lot.","часто в разъездах"],
    ["→ <b>That must keep you busy!</b>","скучать некогда"],
    ["I'm <b>in the middle of</b> relocating.","как раз переезжаю"],
    ["…and I <b>ended up</b> staying.","в итоге остался"]]},
  {h:"Getting to know someone", items:[
    ["<b>Have you two met?</b>","вы знакомы?"],
    ["So, <b>where are you based?</b>","где ты живёшь?"],
    ["→ In Munich, but <b>I'm originally from</b> Minsk.","родом из"],
    ["<b>How long have you been in</b> Germany?","давно ты в Германии?"],
    ["→ <b>How are you finding it?</b>","как тебе там?"],
    ["<b>How did you end up</b> here?","как ты тут оказался?"],
    ["→ <b>It's a bit of a long story.</b>","долгая история"],
    ["<b>What brings you</b> here?","что тебя привело?"],
    ["<b>What made you choose</b> Canada?","почему именно Канада?"],
    ["→ <b>A job came up.</b>","подвернулась работа"],
    ["<b>Small world!</b>","мир тесен! (совпадение)"]]}
];
const TENSES = `an ongoing period of time → <b>present perfect</b> / <b>present perfect continuous</b> · a period of time in the past → <b>past simple</b> · an event with no time reference → <b>present perfect</b> · an event with a clear time reference → <b>past simple</b>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");
const MAP_NUMBERED = false;
const mapBox = (withRu=true) => box(mapInner(MAP, withRu, MAP_NUMBERED, TENSES));
const BOX_CU = mapInner([MAP[0], MAP[1]]);     /* the half of the box on the answer slides */
const BOX_GK = mapInner([MAP[2]]);
const BOX_CLOCKS = "", BOX_SHARE = "";
const TOPICS = [
  {id:"meet", title:"Getting to know someone and catching up", sub:"Meeting someone new, and catching up with someone you haven't seen for ages", box:()=>mapInner(MAP)}
];
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const phraseBox = items => `<h4>ONE PHRASE IS EXTRA</h4>${items.map(([en,r])=>`<p><b>${esc(en)}</b> ${ru(esc(r))}</p>`).join("")}`;

/* Over to you (slides of 16.10 homework, Olya's success criteria) */
const READ_INTRO = "A conference coffee break in Berlin: Paul bumps into Nina, whom he hasn't seen for ages. A few minutes later, he introduces her to Sam.";
const boldParts = parts => parts.map(x => typeof x === "string" ? esc(x) : (x.o ? "" : `<b>${esc(x.f + x.r)}</b>`)).join("").replace(/<\/b>(\s*)<b>/g, "$1");
const MODEL = [...GAPS.coffee.lines, ...GAPS.later.lines].map(l => [l.s, boldParts(l.p)]);
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <ol>
          <li>Think of a situation where you might <b>get to know someone</b> (e.g. your first day at a new job, a conference, a hotel). Write the conversation you might have.</li>
          <li>Think of someone in your life you'd like to <b>catch up with</b>. Write how the conversation might go.</li>
        </ol>
        <p class="small"><b>Success criteria:</b> I've used at least four new expressions from class. · I've checked my use of the Present Perfect and Past Simple.</p>`;
const PLAN_INSTR = "Tap the phrases you'll use — at least four.";
const PICK_MIN = 4;
const PRODUCE_INSTR = "Write both conversations — a few lines each is enough. Then send them to Olya. (Prefer to talk? Tap Record it.)";
const PRODUCE_NOTE = `<p class="small">Listen to it once. Not happy? Record a better version.</p>`;
const TQ_STEPS = [];

/* ---------- the practice from the deck ---------- */
const DLG_GLOSS = "Remember the missing words and how to say them. Tap the yellow and orange boxes to check.";
const DLG_PLAIN = "Now without the glossary. Say the missing words, then tap the yellow boxes to check.";
const textSteps = k => [{type:"dlg", intro:GAPS[k].intro, lines:GAPS[k].lines, gloss:GAPS[k].gloss, instr:DLG_GLOSS},
                        {type:"dlg", intro:GAPS[k].intro, lines:GAPS[k].lines, instr:DLG_PLAIN}];
const convSteps = (k, i) => [
  {type:"dlg", intro:GAPS[k].intro, lines:GAPS[k].box_lines, box:phraseBox(GAPS[k].box),
   instr: i === 0 ? "Complete the gaps with five of the six phrases in the box — say them aloud. Then tap the yellow boxes to check." : "Complete the gaps with five of the six phrases in the box."},
  {type:"dlg", intro:GAPS[k].intro, lines:GAPS[k].lines,
   instr: i === 0 ? "Now without the box: remember the missing phrases. Use the first letters, then tap the yellow boxes to check." : "Now without the box: remember the missing phrases."}];
const REWRITE = [
  {o:"We haven't seen each other for a very long time!", k:"AGES", pre:"It's ", post:" we last saw each other!", a:"been ages since", acc:["been ages since"],
   n:`${ru("= сто лет не виделись")}<br>or just: It's been ages! ${ipa("/ˈeɪdʒɪz/")}`, box:BOX_CU},
  {o:"Where do you live and work these days?", k:"BASED", pre:"Where ", post:" these days?", a:"are you based", acc:["are you based"],
   n:`${ru("= где ты живёшь / работаешь?")}<br>based ${ipa("/beɪst/")}`, box:BOX_GK},
  {o:"When did you move to Germany?", k:"BEEN", pre:"How long ", post:" Germany?", a:"have you been in", acc:["have you been in"],
   n:`${ru("= давно ты в Германии?")}<br>present perfect: you're still there`, box:BOX_GK},
  {o:"Tell me all your news since we last met!", k:"UP", pre:"So, what ", post:" since we last met?", a:"have you been up to", acc:["have you been up to"],
   n:`${ru("= что нового? чем занимался(-ась)?")}`, box:BOX_CU},
  {o:"Do you like living in Canada so far?", k:"FINDING", pre:"How ", post:" so far?", a:"are you finding Canada", acc:["are you finding Canada","are you finding it"],
   n:`${ru("= как тебе там?")}<br>or: are you finding it`, box:BOX_GK},
  {o:"Why did you choose Canada?", k:"MADE", pre:"What ", post:" Canada?", a:"made you choose", acc:["made you choose"],
   n:`${ru("= почему ты выбрал(а)?")}<br>make sb do sth: no to`, box:BOX_GK},
  {o:"I've wanted to contact you for ages, but I never did!", k:"MEANING", pre:"I've ", post:" for ages!", a:"been meaning to get in touch", acc:["been meaning to get in touch"],
   n:`${ru("= давно собирался(-ась) связаться")}`, box:BOX_CU},
  {o:"What brought you to Munich in the end?", k:"END", pre:"How ", post:" Munich?", a:"did you end up in", acc:["did you end up in"],
   n:`${ru("= как ты оказался(-ась) в Мюнхене?")}<br>Munich ${ipa("/ˈmjuːnɪk/")}`, box:BOX_GK},
  {o:"I'm moving to Canada right now — half my things are in boxes.", k:"MIDDLE", pre:"I'm ", post:" to Canada.", a:"in the middle of moving", acc:["in the middle of moving","in the middle of relocating"],
   n:`${ru("= как раз переезжаю")}<br>of + -ing; or: in the middle of relocating ${ipa("/ˌriːləʊˈkeɪtɪŋ/")}`, box:BOX_CU},
  {o:"I only came for six months, but in the end I stayed for twenty years.", k:"ENDED", pre:"I only came for six months, but I ", post:" twenty years.", a:"ended up staying for", acc:["ended up staying for","ended up staying"],
   n:`${ru("= в итоге остался(-ась)")}<br>end up + -ing; for is optional`, box:BOX_CU}
];
const SAY = [
  {html:true, rows:[["At a conference, you see a colleague you last saw five years ago.",`${g("Long time no see")}! ${g("It's been ages")}!`]], note:`<b>Catching up</b> ${ru("= сто лет не виделись!")}`, box:BOX_CU},
  {rows:[["Someone told you your old friend Jane was moving to Spain. You've bumped into Jane and want to check.",`${g("Last I heard")}, you were moving to Spain! Did you?`]], html:true, note:`<b>Catching up</b> ${ru("= насколько я слышал(а)")}`, box:BOX_CU},
  {rows:[["Someone tells you they live in Prague. Ask how long.",`${g("How long have you been")} in Prague?`]], html:true, note:`<b>Someone new</b> ${ru("= давно ты в Праге?")} present perfect`, box:BOX_GK},
  {rows:[["Someone moved to Oslo three months ago. Ask about their impressions.",`${g("How are you finding it")} so far?`]], html:true, note:`<b>Someone new</b> ${ru("= как тебе там?")} (their impressions so far)`, box:BOX_GK},
  {rows:[["You've wanted to message an old colleague for months. You finally write.",`Hi Max! ${g("I've been meaning to get in touch")} for ages.`]], html:true, note:`<b>Catching up</b> ${ru("= давно собирался(-ась) написать")}`, box:BOX_CU}
];
const RW_FIRST = "Rewrite the sentence. Use the word in capitals. Type the missing part or say it aloud, then tap Check.";
const TAKEAWAY = "Takeaways? Anything you've realised about how the expressions are used? Any other expressions you've picked up?";
const TASKS = [
  {id:"coffee-text", topic:"meet", sec:"Revision", title:"The coffee break chat: the missing words", meta:"From 14.10 · with the glossary, then without", kind:"steps",
   steps:textSteps("coffee")},
  {id:"later-text", topic:"meet", sec:"Revision", title:"A few minutes later: the missing words", meta:"From 14.10 · with the glossary, then without", kind:"steps",
   steps:textSteps("later")},
  {id:"practice", topic:"meet", sec:"Revision", title:"Rewrite it, then say what you'd say", meta:"10 sentences + 5 situations", kind:"steps",
   steps:[...REWRITE.map((r,i)=>({type:"rewrite", r, box:r.box, first:i===0, instrFirst:RW_FIRST})),
          ...SAY.map((s,i)=>({type:"sayit", s, box:s.box, instr: i===0 ? "What would you say? Say it aloud, then tap the yellow box to check." : "What would you say?"}))]},
  {id:"convos", topic:"meet", sec:"Extension", title:"Four conversations: the missing phrases", meta:"With the box, then from memory", kind:"steps",
   steps:["conv1","conv2","conv3","conv4"].flatMap((k,i)=>convSteps(k,i))},
  {id:"listen1", topic:"meet", sec:"Extension", title:"Listening: long time no see!", meta:"14 short clips from real videos", kind:"steps", takeaway:TAKEAWAY,
   steps:TQ.q1.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"listen2", topic:"meet", sec:"Extension", title:"Listening: how are you finding it?", meta:"16 short clips from real videos", kind:"steps", takeaway:TAKEAWAY,
   steps:TQ.q2.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"listen3", topic:"meet", sec:"Extension", title:"Listening: what brings you here?", meta:"19 short clips from real videos", kind:"steps", takeaway:TAKEAWAY,
   steps:TQ.q3.map((clip,i)=>({type:"listen",clip,first:i===0}))},
  {id:"write", topic:"meet", sec:"Over to you!", title:"Two conversations of your own", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
