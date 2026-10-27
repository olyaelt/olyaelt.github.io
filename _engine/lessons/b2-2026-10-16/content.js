const IMG_A = "__IMG_A__";
const IMG_B = "__IMG_B__";
const STICKER = "__STICKER__";
const GAPS = __GAPS__;
const TQ = {};   /* clips from the TubeQuizard quizzes: [videoId, start, duration, parts] */
/* Link to the group's homework spreadsheet. Leave empty and the page simply says where to write. */
const SHEET_URL = "";
const PAGE_KEY = "hw-ge-b2-2026-10-16";

const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const g = t => `<b class="g">${t}</b>`;
const ru = t => `<i class="ru">${t}</i>`;
const ipa = t => `<span class="ipa">${t}</span>`;
const box = inner => `<aside class="box" aria-label="Useful language"><img class="sticker" src="${STICKER}" alt="Useful language">${inner}</aside>`;
const mapInner = (map, withRu=true, numbered=false, tenses="") => map.map((g,i)=>`<h4>${numbered?(i+1)+" · ":""}${g.h.toUpperCase()}</h4>${g.items.map(it=>{ const [en,r,mean] = it; return `<p>${en}${mean&&withRu?` <span class="mean">— ${mean}</span>`:""}${withRu&&r?` ${ru(r)}`:""}</p>`; }).join("")}`).join("")
  + (tenses?`<h4>TENSES</h4><p>${tenses}</p>`:"");

/* ---------- content of this page: the 16.10 homework (deck "Lesson 6", slides 27–50, 51–56, 57–76, 77–94) ---------- */
const LESSON = { date:"16.10.26", sub:"" };
/* the moves: slide 37 and the green row of the spreadsheet */
const BOX_MOVES = `
  <h4>A QUESTION FIRST, THEN YOUR POINT</h4>
  <p><span class="n">1</span><b>Do you think so?</b> I found it a bit… / I thought…</p>
  <h4>AGREE A LITTLE, THEN MAKE YOUR POINT</h4>
  <p><span class="n">2</span><b>Yeah, I suppose so. But</b>…</p>
  <h4>KEEP YOUR OPINION — GENTLY</h4>
  <p><span class="n">3</span><b>Maybe, but I still think</b>…</p>
  <h4>OFFER ANOTHER VIEW, DON'T PUSH IT</h4>
  <p><span class="n">4</span><b>But I guess you could say</b>…</p>
  <h4>AGREE AND ADD</h4>
  <p><span class="n">5</span><b>That's true, and</b>…</p>
  <p><span class="n">6</span><b>Exactly. And</b>…</p>
  <h4>TO FINISH</h4>
  <p><span class="n">7</span><b>Fair enough.</b> / <b>OK, fair point.</b></p>`;
const BOX_MOVES_FULL = `
  <h4>A QUESTION FIRST, THEN YOUR POINT</h4>
  <p><span class="n">1</span><b>Do you think so?</b> I found it a bit [long / boring / predictable / dark / …] · I thought it was a bit…</p>
  <h4>AGREE A LITTLE, THEN MAKE YOUR POINT</h4>
  <p><span class="n">2</span><b>Yeah, I suppose so. But</b> [the ending was terrible / three hours is too long / …]</p>
  <h4>KEEP YOUR OPINION — GENTLY</h4>
  <p><span class="n">3</span><b>Maybe, but I still think</b>… [the book is better / it's a waste of time / …]</p>
  <h4>OFFER ANOTHER VIEW, DON'T PUSH IT</h4>
  <p><span class="n">4</span><b>But I guess you could say</b>… [it's just entertainment / every series is like that now / …]</p>
  <h4>AGREE AND ADD</h4>
  <p><span class="n">5</span><b>That's true, and</b>… · <span class="n">6</span><b>Exactly. And</b>…</p>
  <h4>TO FINISH</h4>
  <p><span class="n">7</span><b>Fair enough.</b> / <b>OK, fair point.</b></p>`;
/* slide 78 */
const BOX_SHARE = `
  <h4>USE SHORT REPLIES</h4>
  <p>Did you hear…? — <b>Yes, I did!</b> / <b>No, what happened?</b></p>
  <p>Have you seen…? — <b>I have!</b> / <b>No, I haven't.</b></p>
  <h4>YOU BOTH KNOW → SHARE A FEELING ↘</h4>
  <p>It's freezing, <b>isn't it?</b> — <b>It really is!</b> / <b>I know!</b></p>
  <p>It was lovely, <b>wasn't it?</b> — <b>It really was!</b></p>
  <h4>IT'S NEWS TO YOU → REACT AND ASK</h4>
  <p><b>Oh no, that's awful!</b> Are you OK?</p>
  <p><b>Oh, that's great!</b> When did you find out?</p>
  <h4>EMOTIONS</h4>
  <p>awful · scary · crazy · annoying · stressful · exhausting · weird · a shame · a nightmare · a relief · lovely · amazing</p>`;
/* slide 86: a smaller box */
const BOX_SMALL = `
  <h4>YOU BOTH KNOW → SHARE ↘</h4>
  <p><b>I know!</b> It's so …, <b>isn't it?</b> / It was …, <b>wasn't it?</b></p>
  <h4>IT'S NEWS TO YOU → REACT AND ASK</h4>
  <p><b>Oh no! / Oh, that's …!</b> + a question</p>
  <h4>EMOTIONS</h4>
  <p>awful · scary · crazy · annoying · stressful · exhausting · weird · a shame · a nightmare · a relief · lovely · amazing</p>`;
const TOPICS = [
  {id:"opinions", title:"Do you think so? I thought…", sub:"Disagreeing about films and shows — and staying friends", box:()=>BOX_MOVES_FULL},
  {id:"share", title:"Share or ask?", sub:"Tag questions to share a feeling, or react and ask", box:()=>BOX_SHARE}
];

/* ---------- slides 29–36: You can also say… ---------- */
const ALSO = [{"frame": "Do you think so? I found it a bit …", "rows": [["Думаешь? Мне показалось скучновато.", "Do you think so? I found it a bit boring."], ["Думаешь? По-моему, затянуто.", "Do you think so? I found it a bit long."], ["Думаешь? Мне показалось, как-то предсказуемо.", "Do you think so? I found it a bit predictable."], ["Думаешь? А мне было мрачновато.", "Do you think so? I found it a bit dark."]]}, {"frame": "Yeah, I suppose so. But …", "rows": [["Ну да, наверное. Но концовка ужасная.", "Yeah, I suppose so. But the ending <span class=\"ps\">was</span> terrible."], ["Ну да, наверное. Но главный герой бесит.", "Yeah, I suppose so. But the main character <span class=\"ps\">is/was</span> so annoying."], ["Ну да, наверное. Но три часа — это слишком.", "Yeah, I suppose so. But three hours is too long."], ["Ну да, наверное. Но там же ничего настоящего.", "Yeah, I suppose so. But none of it is real."]]}, {"frame": "Maybe, but I still think …", "rows": [["Может быть, но я всё-таки считаю, что книга лучше.", "Maybe, but I still think the book is better."], ["Может быть, но я всё-таки считаю, что это пустая трата времени.", "Maybe, but I still think it's a waste of time."], ["Может быть, но я всё-таки считаю, что такие шоу вредны.", "Maybe, but I still think shows like that are bad for people."], ["Может быть, но я всё-таки считаю, что со стариком обошлись нечестно.", "Maybe, but I still think it was unfair on the old man."]]}, {"frame": "But I guess you could say …", "rows": [["Хотя, пожалуй, можно сказать, что это просто развлечение.", "But I guess you could say it's just entertainment."], ["Хотя, пожалуй, можно сказать, что люди сами на это подписались.", "But I guess you could say people signed up for it."], ["Хотя, пожалуй, можно сказать, что это полезно: видно, как работают мошенники.", "But I guess you could say it's useful — you see how scams work."], ["Хотя, пожалуй, можно сказать, что сейчас все сериалы такие.", "But I guess you could say every series is like that now."]]}];

/* ---------- slides 37–48: rescue the conversation ---------- */
const RESCUE_I = "Rescue the conversation! B sounds cold. Make B's reply friendly: use the move — and the word in capitals, when you get one. Say it aloud, then tap Check.";
const RESCUE = [
  {i:RESCUE_I, ctx:"Two colleagues, Monday morning.", a:"That nature documentary last night was amazing, wasn't it?",
   sit:"B sounds cold: “No. It was boring.” B wants to: ask a question first, then make your point.", use:"THINK",
   s:"Do you think so? I found it a bit slow, to be honest.", next:"Slow? Those jellyfish, though!",
   notes:["«No.» в начале — как дверь захлопнуть. Вопрос + «a bit» — и можно спокойно не соглашаться."]},
  {i:"Rescue the conversation!", ctx:"Two friends leaving the new café on the corner.", a:"That place is great, isn't it?",
   sit:"B sounds cold: “The coffee is OK. It's too expensive.” B wants to: agree a little, then make your point.", use:"SUPPOSE",
   s:"Yeah, I suppose so. But four euros for a coffee is a bit much.", next:"Fair enough. The cake's good, though.",
   notes:["Сначала немного соглашаемся — тогда «but» не звучит как атака."]},
  {i:"Rescue the conversation!", ctx:"After a long meeting.", a:"That could have been an email, couldn't it?",
   sit:"B sounds cold: “Yes.” B wants to: agree and add.", use:"EXACTLY",
   s:"Exactly. And it went on for an hour and a half!", next:"Don't remind me.",
   notes:["Просто «Yes.» закрывает разговор. Согласились — и подкинули что-то своё."]},
  {i:"Rescue the conversation!", ctx:"Flatmates, about a reality show.", a:"Come on, it's just a reality show. Nobody takes it seriously, do they?",
   sit:"B sounds cold: “That's not true. It's bad for people.” B wants to: keep your opinion — gently.",
   s:"Maybe, but I still think it sends the wrong message.", next:"OK, OK. Let's agree to disagree.",
   notes:["Остаёмся при своём без нажима: сначала «Maybe», потом «I still think». send the wrong message — «как будто говорит людям, что так можно»."]},
  {i:"Rescue the conversation!", ctx:"Two friends, about cooking shows.", a:"I don't get cooking shows. You can't even taste the food, can you?",
   sit:"B sounds cold: “They're useful. You learn recipes.” B wants to: offer another view, don't push it.",
   s:"Hmm. But I guess you could say you learn a few recipes.", next:"I suppose so. Have you ever actually cooked one, though?",
   notes:["«you could say» = это один из взглядов, а не истина. Поэтому не спорим в лоб."]},
  {i:"Rescue the conversation!", ctx:"Colleagues, Friday, about a series.", pre:[["a","The new season is much weaker, isn't it?"],["b","Do you think so? I quite liked it."]],
   a:"Nothing happens for three episodes!",
   sit:"B sounds cold: “OK. You are right.” B wants to: finish kindly.",
   s:"OK, fair point. It does take a while to get going.", next:"Thank you! I'll keep watching it anyway.",
   notes:["Сухое «OK. You are right.» звучит так, будто ты обиделся и сдался. «Fair point» — принял аргумент, и разговор продолжается. take a while to get going — «долго раскачивается»."]}
];

/* ---------- slides 57–76: disagree and stay friends ---------- */
const H = (a, b) => `<span class="s">[${a}]</span>${b?` <span class="a">[${b}]</span>`:""}`;
const DISAGREE = [
  {i:"Disagree and stay friends. Write or say B's reply. Use the moves in the yellow boxes. Then tap Check.", ctx:"Two friends are leaving the cinema.",
   a:"That was brilliant, wasn't it?", hint:H("Question first","Your point") + ` ${ru("(= мне показалось мрачновато)")}`,
   s:"Do you think so?", q:"I found it a bit dark.", next:"Dark? It's a crime film! But OK, it wasn't exactly light-hearted.",
   notes:["or: …a bit depressing.", "dark — мрачный; противоположное — light-hearted (лёгкий, весёлый)."]},
  {i:"Write B's reply. Use the moves in the yellow boxes.", ctx:"Two colleagues are talking about a series.",
   a:"The new season's amazing, isn't it?", hint:H("Agree a little","But…") + ` ${ru("(= главный герой бесит)")}`,
   s:"Yeah, I suppose so.", q:"But the main character is so annoying.", next:"He is, isn't he? That's exactly why I can't stop watching!",
   notes:[`<span class="pp">(or: <b>a bit</b> annoying)</span>`, "главный герой — the main character (так говорят о героях фильмов, сериалов и книг)."]},
  {i:"Write B's reply. Use the moves in the yellow boxes.", ctx:"Two friends have just watched a three-hour film.",
   pre:[["b","Phew, that was long! I can't feel my legs."]], a:"Oh, come on, three hours flew by!",
   hint:H("Keep your opinion — gently") + ` ${ru("(= три часа — это всё-таки слишком)")}`,
   s:"Maybe, but I still think three hours is too long.", next:"Fair enough. Next time you choose the film — under two hours!",
   notes:["flew by — пролетели незаметно. three hours — один отрезок времени, поэтому is."]},
  {i:"Write B's reply. Use the move in red.", ctx:"Flatmates are watching a reality show.",
   pre:[["b","Oh, poor guy! Everyone's laughing at him."]], a:"Come on, it's just a bit of fun.",
   sit:"B wants to: keep your opinion — gently (это нечестно по отношению к участникам).",
   s:"Maybe, but I still think it's unfair on the people in it.", next:"Fair point. But I still want to know who goes home tonight!",
   notes:["or: …unfair on the contestants.", "unfair on someone — нечестно по отношению к кому-то."]},
  {i:"Write B's reply. Use the move in red.", ctx:"Two colleagues at lunch.",
   a:"Honestly, I don't get true crime shows. What's the point?",
   sit:"B wants to: offer another view (можно сказать, что они полезны: узнаёшь, как действуют мошенники). Start with Well, …",
   s:"Well, I guess you could say they're useful — you learn how scammers work.", next:"OK, fair point. Maybe I'll watch one with my parents.",
   notes:["or: …you see how scams work.", "Well, … — мягкое начало, когда вы не совсем согласны. how scammers work — прямой порядок слов (не how do scammers work)."]},
  {i:"Write B's reply. Use the move in red.", ctx:"Two friends have seen the film. They've both read the book too.",
   a:"The book had so much more detail.",
   sit:"B wants to: agree and add (и концовка совсем другая).",
   s:"That's true, and the ending was completely different.", next:"Exactly! Why do they always change the ending?",
   notes:["or: Exactly. And the ending was completely different.", "Соглашаемся и добавляем своё — так разговор идёт дальше."]},
  {i:"Now B only thinks it. Choose a move and write B's friendly reply.", ctx:"Two friends are talking about a series.",
   a:"It's so slow! Nothing happens for three episodes.",
   sit:"B thinks: ну да, долго раскачивается, но потом очень интересно. Подсказка: «долго раскачивается» можно сказать простыми словами.",
   s:"Yeah, I suppose it's <b>a bit</b> slow at the beginning.", q:"But after that, it's really good.", next:"OK, OK. I'll give it one more episode.",
   notes:["or: Yeah, I suppose it takes a while to get going (= долго раскачивается). But…", "Сложное русское — простыми словами: a bit slow at the beginning. Сначала немного соглашаемся, потом своё But."]},
  {i:"B only thinks it. Choose a move and write B's friendly reply.", ctx:"A colleague loves a series you didn't really like.",
   a:"I binge-watched the whole season at the weekend! Isn't it brilliant?",
   sit:"B thinks: снято хорошо (well made), но, честно говоря, это не моё.",
   s:"Yeah, it's really well made.", q:"But honestly, I'm not a fan.", next:"Fair enough. So what are you watching at the moment?",
   notes:["or: …but to be honest, it's not really my thing.", "binge-watch — смотреть запоем. Сначала что-то хорошее, потом But — так не обидно."]},
  {i:"B only thinks it. Choose a move and write B's friendly reply.", ctx:"Two friends are choosing a film for the evening.",
   a:"Shall we watch it dubbed? Subtitles are so tiring after a long day.",
   sit:"B thinks: справедливо, но мне всё-таки больше нравятся настоящие голоса (the original voices).",
   s:"Fair enough, but I still prefer the original voices.", next:"Fine — subtitles it is. But you're making the popcorn.",
   notes:["or: Fair enough. But I still think the original voices are better.", "Fair enough можно сказать и в начале: «справедливо», а потом своё but. subtitles — субтитры; dubbed — с дубляжом."]}
];

/* ---------- slides 78–93: share or ask? ---------- */
const BOTH = `<span class="pp">You both know → share a feeling ↘</span>`, NEWS = `<span class="ps">It's news to you → react and ask</span>`;
const SHARE = [
  {i:"Share a feeling, or react and ask? Write or say your reply. Then tap Check.", ctx:"You and your colleague Megan have just finished a three-hour training session.",
   a:"Three hours! On a Friday afternoon!", hint:`<span class="a">[short reaction]</span> <span class="s">[share a feeling ↘]</span>`,
   s:"I know! It was exhausting, wasn't it?", next:"It really was. My brain went home at about three o'clock.", nextHtml:`<span class="pp">It really was.</span> My brain went home at about three o'clock.`,
   notes:[BOTH, "Тренинг уже закончился → It was …, wasn't it?"]},
  {i:"Share a feeling, or react and ask?", ctx:"Joe had a job interview last week. You don't know how it went.",
   a:"Guess what? I got the job!", hint:`<span class="s">[react]</span> <span class="a">[ask a question]</span>`,
   s:"Oh, that's amazing! Congratulations!", q:"When do you start?", next:"In two weeks. I'm so nervous!",
   notes:[NEWS, "or: No way! That's great! When do you start?"]},
  {i:"Share a feeling, or react and ask?", ctx:"You and your flatmate Alex were both kept awake by the neighbours' dog.",
   a:"Did you hear that dog last night?", s:"I did! It was a nightmare, wasn't it?", next:"It really was. First I counted sheep. Then I counted barks.", nextHtml:`<span class="pp">It really was.</span> First I counted sheep. Then I counted barks.`,
   notes:[BOTH]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't heard anything about it.",
   a:"You won't believe what happened. Someone broke into my car last night!", s:"Oh no, that's awful!", q:"Did they take anything?",
   next:"Just my old sunglasses. They smashed a window for five-euro sunglasses!", notes:[NEWS, "or: That's horrible! Are you OK?"]},
  {i:"A smaller box now. Share a feeling, or react and ask?", ctx:"You and your friend Nick are on a train. It stopped in the middle of nowhere half an hour ago.",
   a:"We haven't moved for half an hour!", s:"I know! It's so annoying, isn't it?", next:"It really is. And of course there's no Wi-Fi.", nextHtml:`<span class="pp">It really is.</span> And of course there's no Wi-Fi.`, notes:[BOTH]},
  {i:"Share a feeling, or react and ask?", ctx:"You haven't heard anything about it.",
   a:"Just a heads-up: there's a fake parcel text going around. My mum nearly clicked on the link.", s:"Oh no, that's scary!", q:"What does it say?",
   next:"That your parcel's waiting and you need to pay two euros. Don't click on anything!",
   notes:[NEWS, "or: Thanks for the heads-up! (= Спасибо, что предупредила!) What does it look like?"]},
  {i:"Now without the box! Share a feeling, or react and ask?", ctx:"You and your colleague Tim both got the same email this morning.",
   a:"Did you see the email? They've cancelled the Christmas party.", s:"I did. It's a shame, isn't it?", next:"It really is. I'd already bought a new shirt!", nextHtml:`<span class="pp">It really is.</span> I'd already bought a new shirt!`,
   notes:[BOTH, "or: I know! What a shame."]},
  {i:"Share a feeling, or react and ask?", ctx:"Yesterday your friend Maya lost her wallet. You haven't heard anything since then.",
   a:"Good news! Someone found my wallet and handed it in at the station.", s:"Oh, that's a relief!", q:"Was everything still in it?",
   next:"Everything — even the cash! There are still honest people out there.", notes:[NEWS, "or: Phew! Was anything missing?"]}
];

/* ---------- Over to you (spreadsheet: a conversation about a film, a podcast or a show you might disagree about) ---------- */
const TASK_HTML = `
        <p class="task-h">Your task</p>
        <p>Imagine a conversation about a film, a podcast or a show you might disagree about. Write the conversation.</p>
        <ul>
          <li>Disagree — and stay friends: use the moves.</li>
          <li>Finish kindly.</li>
        </ul>
        <p class="small">Need an idea? Films are far too long these days. · A series is best watched in one night. · A film can never be as good as the book. · Reality shows are harmless fun. · Subtitles are better than dubbing. · Nobody needs a TV any more — a laptop is enough.</p>`;
const PLAN_INSTR = "Tap the moves you'll use — three or four are enough.";
const PRODUCE_INSTR = "Write your conversation — both parts. Then send it to Olya. (Prefer to talk? Tap Record it.)";
const MAP = [
  {h:"Disagree gently", items:[["<b>Do you think so?</b> I found it a bit [long / boring / predictable / dark]…","Думаешь? А мне показалось, немного…"],
    ["<b>Yeah, I suppose so. But</b> [the ending was terrible]…","Ну да, наверное. Но…"],["<b>Maybe, but I still think</b> [the book is better]…","Может быть, но я всё-таки считаю…"],
    ["<b>But I guess you could say</b> [it's just entertainment]…","Хотя, пожалуй, можно сказать…"]]},
  {h:"Agree and add", items:[["<b>That's true, and</b> …","Это правда, и ещё…"],["<b>Exactly. And</b> …","Вот именно, и…"]]},
  {h:"Share a feeling", items:[["It was crazy, <b>wasn't it?</b> ↘","С ума сойти, да?"],["<b>I didn't see it coming!</b>","Вот этого я не ожидал(а)!"]]},
  {h:"To finish", items:[["<b>Fair enough.</b> / <b>OK, fair point.</b>","Ну ладно, справедливо."]]}
];
const MODEL_TITLE = "The conversation from this homework (the office kitchen)";
const READ_INTRO = GAPS.k1.intro;
const filled = p => p.map(x=>typeof x==="string"?esc(x):x.b?`<b>${esc(x.b)}</b>`:x.o?"":`<b>${esc(x.f+x.r)}</b>`).join("");
const MODEL = [...GAPS.k1.lines, ...GAPS.k2.lines.slice(3)].map(l=>[l.s, filled(l.p)]);

const TASKS = [
  {id:"crime-show", topic:"opinions", sec:"Revision", title:"A reality crime show: the missing words", meta:"Say the missing words, then check", kind:"gaps",
   lead:"Now without the glossary.", instr:"Say the missing words. Then tap the yellow boxes to check.", lines:GAPS.paul},
  {id:"also-say", topic:"opinions", sec:"Revision", title:"You can also say…: Russian → English", meta:"16 sentences in 4 steps", kind:"steps",
   steps:ALSO.map((x,i)=>({type:"sayit", s:{rows:x.rows, html:true}, box:"",
     instr:(i===0?"Say it in English — aloud. Then tap the yellow boxes to check. ":"Say it in English. ") + "Use: " + x.frame}))},
  {id:"rescue", topic:"opinions", sec:"Revision", title:"Rescue the conversation: make B friendly", meta:"6 short conversations", kind:"steps",
   steps:RESCUE.map(s=>({type:"share", s, box:BOX_MOVES}))},
  {id:"office-kitchen", topic:"opinions", sec:"Extension", title:"In the office kitchen: phrases from the glossary", meta:"A conversation in 2 parts", kind:"steps",
   steps:[{type:"dlg", intro:GAPS.k1.intro, lines:GAPS.k1.lines, gloss:GAPS.k1.gloss,
           instr:"Fill the gaps with phrases from the glossary. Then tap Show the answers and read the conversation aloud — both parts!"},
          {type:"dlg", lines:GAPS.k2.lines, gloss:GAPS.k2.gloss,
           instr:"The conversation goes on. Fill the gaps, then tap Show the answers. Read it aloud — both parts!"}]},
  {id:"disagree", topic:"opinions", sec:"Extension", title:"Disagree and stay friends: B's reply", meta:"9 short conversations", kind:"steps",
   steps:DISAGREE.map(s=>({type:"share", s, box:BOX_MOVES}))},
  {id:"share-ask", topic:"share", sec:"Extension", title:"Share a feeling, or react and ask?", meta:"8 short conversations", kind:"steps",
   steps:SHARE.map((s,i)=>({type:"share", s, box: i < 4 ? BOX_SHARE : i < 6 ? BOX_SMALL : ""}))},
  {id:"write", topic:"opinions", sec:"Over to you!", title:"Your conversation: a film, a podcast or a show", meta:"Your task · plan · write and send", kind:"steps",
   steps:[{type:"task"},{type:"plan"},{type:"produce"}]}
];
const TENSES = "";
const PRODUCE_NOTE = ``;
const BOX_CLOCKS = "";
const LOOKBACK = [];
const MAP_NUMBERED = false;
const TQ_STEPS = ["click on the top line to hear the context","click on the line with the gap and try to catch what's in the gap","check","listen again — how did the expression sound?","optional: pronounce the expression like the speaker"];
