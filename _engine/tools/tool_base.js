/* shared by the lesson tools: the Useful language box, shuffling, small helpers */
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const store = { get(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const params = new URLSearchParams(location.search);
/* **box phrase** in a speaking task or a follow-up = shown like the box phrases in the examples (checklist 8.07) */
const boxMarks = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="bx">$1</b>');
const calm = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
/* a small "pop" on whatever was just tapped (tactile feedback) */
const pop = el => { if(!el || calm()) return; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); };

/* "If you're done": speaking tasks for fast finishers, one at a time (her rule, 27.10: a page can't be changed during the lesson,
   so every tool ends with plenty of talk, and after it the task starts over — it never runs out) */
let spk = 0;
/* the dots under a run of tasks: each one is a button that opens that task */
const dotsHTML = (n, i, attr, what) => `<span class="speak-dots">${Array.from({length: n}, (_, k) =>
  `<button class="${k === i ? "on" : k < i ? "was" : ""}" ${attr}="${k}" aria-label="${what} ${k + 1}" ${k === i ? `aria-current="step"` : ""}></button>`).join("")}</span>`;
function speakHTML(list, endButtons, label = "Speaking task"){
  if(!list || !list.length) return "";
  const i = Math.min(spk, list.length - 1), last = i === list.length - 1;
  return `<section class="speak" aria-live="polite"><div class="speak-top"><span class="speak-h">💬 ${esc(label)}</span>
      ${dotsHTML(list.length, i, "data-speak-go", "Speaking task")}</div>
    <p class="speak-task">${boxMarks(list[i])}</p>
    <div class="row-actions">${i ? `<button class="btn" data-speak-prev>← Previous task</button>` : ""}${last ? endButtons : `<button class="btn primary" data-speak-next>Next task →</button>`}</div></section>`;
}
function wireSpeak(root, rerender){
  const go = k => { spk = k; rerender(); const t = document.querySelector(".speak"); if(t) pop(t); };
  root.querySelectorAll("[data-speak-next]").forEach(b => b.addEventListener("click", () => go(spk + 1)));
  root.querySelectorAll("[data-speak-prev]").forEach(b => b.addEventListener("click", () => go(Math.max(0, spk - 1))));
  root.querySelectorAll("[data-speak-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.speakGo)));
}

/* the stages of the task (her rule, 27.10: every tool has stages — at least the practice and the speaking —
   and a group can move between them at any time without clicking through) */
const stagesHTML = (list, cur) => `<nav class="stages" aria-label="Stages">${list.map(([id, label], i) =>
  `${i ? `<span class="stage-arrow" aria-hidden="true">→</span>` : ""}<button class="stage-btn" data-stage="${id}" ${id === cur ? `aria-current="step"` : ""}>${label}</button>`).join("")}</nav>`;

/* 📋 everything on one screen, folded: to show a card or an example again later in the lesson */
let allOpen = false;
const allHTML = (title, inner) => `<details class="all" ${allOpen ? "open" : ""}><summary>📋 ${esc(title)}</summary><div class="all-in">${inner}</div></details>`;
function wireAll(root){ root.querySelectorAll("details.all").forEach(d => d.addEventListener("toggle", () => { allOpen = d.open; })); }

/* the box: tap a phrase when you've said it (it lights up green); "clickable:false" = a plain list.
   A line may carry a short Russian gloss after " – " (as on her slides: grey italics) and **bold** key words. */
const phHTML = t => { const k = t.indexOf(" – "), en = k < 0 ? t : t.slice(0, k), ru = k < 0 ? "" : t.slice(k + 3);
  return boxMarks(en) + (ru ? ` <span class="gloss">– ${esc(ru)}</span>` : ""); };
const usedPhrases = new Set();
function boxHTML(box, {clickable = true, collapsible = false, open = true} = {}){
  const items = box.map((g, gi) => `<h4>${esc(g.h)}</h4>` + g.items.map((t, ti) => clickable
      ? `<button class="ph ${usedPhrases.has(gi + "." + ti) ? "used" : ""}" data-ph="${gi}.${ti}" aria-pressed="${usedPhrases.has(gi + "." + ti)}">${phHTML(t)}</button>`
      : `<p class="ph">${phHTML(t)}</p>`).join("")).join("");
  return `<aside class="box ${clickable ? "" : "static"}" aria-label="Useful language">
    <div class="box-top"><img class="sticker" src="${STICKER}" alt="Useful language">${collapsible ? `<button class="linkish" data-box-toggle>Hide</button>` : ""}</div>
    ${open ? items : ""}</aside>`;
}
function wireBox(root, rerender){
  root.querySelectorAll("[data-ph]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.ph; usedPhrases.has(k) ? usedPhrases.delete(k) : usedPhrases.add(k);
    b.classList.toggle("used", usedPhrases.has(k)); b.setAttribute("aria-pressed", usedPhrases.has(k)); if(usedPhrases.has(k)) pop(b);
  }));
}
