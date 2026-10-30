/**
 * @OnlyCurrentDoc
 *
 * Homework progress — Olya's private table.
 * The homework pages send each student's ticks here, and read them back,
 * so the ticks are the same on a phone and a computer.
 * "@OnlyCurrentDoc" means this script can open this one table and nothing else.
 */

const TZ = "Europe/Berlin";
const STUDENTS = "Students";   // Code | Name | Group | Last visit
const STATE = "State";         // hidden: one row per student + page + task
const WORK = "Work";           // everything students send from "Over to you" + your feedback
const WORK_HEAD = ["ID", "Sent", "Student", "Group", "Homework", "Task", "Type", "Text", "Phrases they used", "Feedback", "Seen", "Key"];
const W = { id: 1, sent: 2, student: 3, group: 4, homework: 5, task: 6, type: 7, text: 8, phrases: 9, feedback: 10, seen: 11, key: 12 };
const SETTINGS = "Settings";   // the group goal: frames 🎞 (minutes of homework) towards a series lesson
const SETTINGS_HEAD = ["Group", "Goal (frames)", "Frames before the pages", "Season start", "Reward", "Frames now (auto)", "Reached on (auto)"];
// worked out from the homework spreadsheets (30.09–21.10 for B2, 14.10–21.10 for C1): about two months to the goal at the current pace
const SETTINGS_DEFAULTS = [["B2", 2700, 1182, new Date(2026, 8, 30), "a series lesson", "", ""],
                           ["C1", 1800, 364, new Date(2026, 9, 14), "a series lesson", "", ""]];
const STATE_HEAD = ["Key", "Code", "Page", "Task", "Done", "Time", "Title", "Frames"];
const TEACHER = "TEACHER";     // a Students row with Group = Teacher: Olya's own code, opens the teacher view on the pages
const REACT = "Reactions";      // Easy / OK / Hard after each task
const DISC = "Discussed";       // what Olya went through in class ("Where they got stuck"): Key (page|task) | Page | Task | Data | Date
const DISC_HEAD = ["Key", "Page", "Task", "Data (marks gone through)", "Date"];
const LIVE = "Live";           // lesson tools, live version: what Olya changed during a lesson (one row per tool page)
const LIVE_HEAD = ["Page", "Changes (JSON)", "Updated"];
const LIVELOG = "Live log";    // every change she made, for the lesson debrief: what didn't work
const LIVELOG_HEAD = ["Time", "Page", "Change", "Item", "Text"];
const PUB = "Published";        // drafts ("listed": false) Olya published with the button on the page: Page | Published | Date
const PUB_HEAD = ["Page", "Published", "Date"];
const LWORK = "Lesson work";    // lesson tools (-live pages, 30.10): what each group types during the lesson, one row per device + chat
const LWORK_HEAD = ["Key", "Page", "Chat", "Device", "Name", "Group", "Text", "Status", "Started", "Updated", "Started (ms)", "Updated (ms)"];
const LNOTES = "Lesson notes";  // Olya's quick notes to a group while they are still typing (the group sees them above their input)
const LNOTES_HEAD = ["ID", "Time", "Page", "Chat", "Device", "Name", "Words she pointed at", "Mark", "Note / correction", "Seen", "Time (ms)"];
const LN_MARKS = ["good", "change", "fix", "note", "go", "say"];   // her homework feedback buttons (✓ Good, ✗ Change, ✎ Correction, 💬 Comment); go = "move on to …" (the group may say Not yet), say = 📢 a message to the room
const LDECK = "Lesson decks";   // card pages (-live): per device, how often each card went back into the deck (↺ Again) and which were ✓ Got it
const LDECK_HEAD = ["Key", "Page", "Device", "Name", "Again (card: times)", "Got it (cards)", "Updated", "Updated (ms)"];
const LROOMS = "Lesson rooms";  // revision pages (30.10): where each screen is (stage), since when; who sits at it (her roster) and the moves
const LROOMS_HEAD = ["Key", "Page", "Device", "Name (code)", "Where", "Where since", "First seen", "People (her roster)", "Moves", "Updated", "Where since (ms)", "First seen (ms)", "Updated (ms)"];
const LSIG = "Lesson signals";  // revision pages: ✓/≈/✗ after "Show the answer", 🔖 on a gap, box phrases they ticked — one row per screen + item
const LSIG_HEAD = ["Key", "Page", "Device", "Kind", "Item", "Value", "Updated", "Updated (ms)"];
const LSIG_KINDS = ["check", "gap", "box", "reply"];   // reply = the group's answer to her "move on" / 📢 (go · later · ok)   // her homework feedback buttons: ✓ Good, ✗ Change, ✎ Correction, 💬 Comment
const LEVELS = { easy: "easy", ok: "ok", hard: "hard" };
const FIRST_STUDENT_ROW = 4;   // progress tabs: row 1 hidden keys, row 2 date, row 3 task names
const WORDS = ["apple","berry","cloud","daisy","eagle","fern","grape","honey","iris","kite",
  "lemon","maple","olive","pear","river","sun","tulip","wave","coral","comet","frost","grove",
  "pine","plum","robin","sage","star","tiger","violet","willow","amber","bay","cedar","dove"];

/* ---------- menu ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Homework")
    .addItem("Set up the table", "setUp")
    .addItem("Make codes for new students", "makeCodes")
    .addSeparator()
    .addItem("Apply imported feedback", "applyImportedFeedback")
    .addItem("Apply imported ticks (old homework)", "applyImportedTicks")
    .addToUi();
}

function setUp() {
  const st = sheet_(STUDENTS, ["Code", "Name", "Group", "Last visit"]);
  st.setColumnWidth(1, 110); st.setColumnWidth(2, 160); st.setColumnWidth(3, 70); st.setColumnWidth(4, 140);
  sheet_(STATE, STATE_HEAD).hideSheet();
  settings_();
  const has = st.getLastRow() > 1 && st.getRange(2, 3, st.getLastRow() - 1, 1).getValues().some(r => String(r[0]).trim().toUpperCase() === TEACHER);
  if (!has) st.appendRow([strongCode_({}), "Olya", "Teacher", ""]);
  progress_("B2"); progress_("C1");
  work_();
  say_("Ready. On the Students tab, add each student's name and group (B2 or C1; Self for someone studying on their own, who never shows up in your views), then choose Homework → Make codes for new students. The row with Group = Teacher holds YOUR code: type it on any homework page to see the teacher view. Keep it to yourself.");
}

function makeCodes() {
  const st = sheet_(STUDENTS, ["Code", "Name", "Group", "Last visit"]);
  const n = st.getLastRow() - 1;
  if (n < 1) { say_("Add the students' names on the Students tab first."); return; }
  const rows = st.getRange(2, 1, n, 3).getValues();
  const used = {};
  rows.forEach(r => { if (r[0]) used[String(r[0]).trim().toLowerCase()] = true; });
  let made = 0;
  rows.forEach(r => {
    if (!r[0] && String(r[1]).trim()) {
      let code;
      if (String(r[2]).trim().toUpperCase() === TEACHER) code = strongCode_(used);
      else do { code = WORDS[Math.floor(Math.random() * WORDS.length)] + (10 + Math.floor(Math.random() * 90)); } while (used[code]);
      used[code] = true; r[0] = code; made++;
    }
  });
  st.getRange(2, 1, n, 1).setValues(rows.map(r => [r[0]]));
  say_(made ? "Made " + made + " new code(s). Send each student their own code." : "Everyone already has a code.");
}

// a long code for the teacher, e.g. maple-comet-river-4821
function strongCode_(used) {
  let c;
  do { c = [0, 1, 2].map(() => WORDS[Math.floor(Math.random() * WORDS.length)]).join("-") + "-" + (1000 + Math.floor(Math.random() * 9000)); } while (used[c]);
  return c;
}

/* ---------- the homework pages talk to these ---------- */
function doGet(e) {           // open the web app address in a browser to check it works
  return json_({ ok: true, hello: "Homework progress is running." });
}

function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents); } catch (err) {}
  let res;
  try { res = sync_(p); } catch (err) { res = { ok: false, error: "server", detail: String(err) }; }
  return json_(res);
}

function work_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(WORK);
  if (!sh) {
    sh = ss.insertSheet(WORK);
    sh.getRange(1, 1, 1, WORK_HEAD.length).setValues([WORK_HEAD]).setFontWeight("bold");
    sh.setFrozenRows(1);
    [50, 90, 110, 50, 80, 150, 80, 320, 160, 320, 90].forEach((w, i) => sh.setColumnWidth(i + 1, w));
    sh.getRange(1, 1, 1000, WORK_HEAD.length).setWrap(true).setVerticalAlignment("top");
    sh.hideColumns(W.key);
  }
  return sh;
}

function fmtDate_(ms) { return Utilities.formatDate(new Date(ms), TZ, "dd.MM HH:mm"); }

// what students send from "Over to you": text, or a note that a recording went to Telegram
function submit_(stu, page, p) {
  const sh = work_();
  const task = clean_(p.task, 60);
  if (!task) return { ok: false, error: "no-task" };
  const type = p.type === "recording" ? "🎙 recording (in Telegram)" : p.type === "question" ? "❓ question" : p.type === "marked" ? "🔖 marked" : "✍️ text";
  const text = String(p.text == null ? "" : p.text).replace(/\r/g, "").slice(0, 20000);
  const phrases = (Array.isArray(p.phrases) ? p.phrases : []).map(x => clean_(x, 120)).filter(Boolean).join("\n");
  const key = stu.code + "|" + page + "|" + task;
  const n = sh.getLastRow() - 1;
  const rows = n > 0 ? sh.getRange(2, 1, n, WORK_HEAD.length).getValues() : [];
  let maxId = 1000, row = 0;
  rows.forEach((r, i) => {
    maxId = Math.max(maxId, Number(r[W.id - 1]) || 0);
    if (p.type !== "question" && p.type !== "marked" && r[W.key - 1] === key && !String(r[W.feedback - 1]).trim() && String(r[W.type - 1]) === type) row = i + 2;   // not answered yet → replace with the new version (questions are all kept)
  });
  const now = Date.now();
  const values = [row ? rows[row - 2][W.id - 1] : maxId + 1, fmtDate_(now), stu.name, stu.group, clean_(p.date, 20),
    clean_(p.title, 120) || task, type, safeText_(text), phrases, "", "", key];
  if (row) sh.getRange(row, 1, 1, WORK_HEAD.length).setValues([values]);
  else sh.appendRow(values);
  return { ok: true, id: values[0] };
}

// the student opened your feedback on their page
function seen_(stu, id) {
  const sh = work_();
  const n = sh.getLastRow() - 1; if (n < 1) return;
  const rows = sh.getRange(2, 1, n, WORK_HEAD.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][W.id - 1]) === String(id) && String(rows[i][W.key - 1]).indexOf(stu.code + "|") === 0) {
      if (!rows[i][W.seen - 1]) sh.getRange(i + 2, W.seen).setValue(fmtDate_(Date.now()));
      return;
    }
  }
}

// a note the student adds to something they marked with "?"
function note_(stu, id, text) {
  const sh = work_(); const n = sh.getLastRow() - 1; if (n < 1) return { ok: false, error: "not-found" };
  const rows = sh.getRange(2, 1, n, WORK_HEAD.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][W.id - 1]) === String(id) && String(rows[i][W.key - 1]).indexOf(stu.code + "|") === 0) {
      const old = String(rows[i][W.text - 1]).split("\n"), link = old.filter(l => /^https?:/.test(l));
      const keep = old.filter(l => !/^https?:/.test(l));
      sh.getRange(i + 2, W.text).setValue(safeText_(keep.concat(["— " + String(text || "").slice(0, 2000)], link).join("\n")));
      return { ok: true };
    }
  }
  return { ok: false, error: "not-found" };
}

// this student's work on this page, with your feedback turned into simple marks the page understands
function workFor_(stu, page) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WORK);
  if (!sh || sh.getLastRow() < 2) return {};
  const n = sh.getLastRow() - 1;
  const rows = sh.getRange(2, 1, n, WORK_HEAD.length).getValues();
  const prefix = stu.code + "|" + page + "|";
  const out = {};
  let rich = null;
  rows.forEach((r, i) => {
    const key = String(r[W.key - 1]);
    if (key.indexOf(prefix) !== 0) return;
    let fb = String(r[W.feedback - 1] || "");
    if (fb.trim()) {
      if (!rich) rich = sh.getRange(2, W.feedback, n, 1).getRichTextValues();
      fb = marks_(rich[i][0]) || fb;
    }
    const task = key.slice(prefix.length);
    (out[task] = out[task] || []).push({ id: r[W.id - 1], sent: String(r[W.sent - 1]), type: String(r[W.type - 1]).indexOf("recording") > -1 ? "recording" : String(r[W.type - 1]).indexOf("question") > -1 ? "question" : String(r[W.type - 1]).indexOf("marked") > -1 ? "marked" : "text",
      text: String(r[W.text - 1] || "").replace(/^'/, ""), feedback: fb, seen: !!r[W.seen - 1] });
  });
  return out;
}

// bold → **good**, strikethrough → ~~to change~~, coloured text → {your words}
function marks_(rtv) {
  if (!rtv) return "";
  let runs;
  try { runs = rtv.getRuns(); } catch (err) { return ""; }
  return runs.map(run => {
    let s = run.getText();
    if (!s) return "";
    const st = run.getTextStyle();
    const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
    let core = s.trim();
    if (!core) return s;
    if (st.isStrikethrough()) core = "~~" + core + "~~";
    else if (coloured_(st)) core = "{" + core + "}";
    if (st.isBold()) core = "**" + core + "**";
    return lead + core + trail;
  }).join("");
}

function coloured_(st) {
  let c = null;
  try { c = st.getForegroundColor(); } catch (err) {}
  if (!c) { try { c = st.getForegroundColorObject().asRgbColor().asHexString(); } catch (err) {} }
  if (!c) return false;
  c = String(c).toLowerCase();
  return !(c === "#000000" || c === "#000" || c === "#000000ff" || c === "black");
}

// paste a feedback file from Claude: File → Import → Upload → "Insert new sheet(s)", then Homework → Apply imported feedback
function applyImportedFeedback() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const imports = ss.getSheets().filter(s => /^import/i.test(s.getName()) && String(s.getRange(1, 1).getValue()).trim() !== "Type");
  if (!imports.length) { say_("No Import tab found. Import Claude's feedback file first: File → Import → Upload → Insert new sheet(s)."); return; }
  const sh = work_();
  const n = sh.getLastRow() - 1;
  const ids = n > 0 ? sh.getRange(2, W.id, n, 1).getValues().map(r => String(r[0])) : [];
  const fbs = n > 0 ? sh.getRange(2, W.feedback, n, 1).getValues().map(r => String(r[0])) : [];
  let put = 0; const skipped = [], missing = [];
  imports.forEach(imp => {
    const m = imp.getLastRow();
    if (m < 2) return;
    imp.getRange(2, 1, m - 1, 2).getValues().forEach(r => {
      const id = String(r[0]).trim(); const fb = String(r[1] || "").replace(/ ¶ /g, "\n").trim();
      if (!id || !fb) return;
      const i = ids.indexOf(id);
      if (i < 0) { missing.push(id); return; }
      if (fbs[i].trim()) { skipped.push(id); return; }
      sh.getRange(i + 2, W.feedback).setValue(fb); fbs[i] = fb; put++;
    });
  });
  if (!skipped.length && !missing.length) imports.forEach(imp => ss.deleteSheet(imp));
  say_("Feedback added: " + put + "." +
    (skipped.length ? " Already had feedback, so left as it was: ID " + skipped.join(", ") + "." : "") +
    (missing.length ? " Not found in Work: ID " + missing.join(", ") + "." : "") +
    (!skipped.length && !missing.length ? " The Import tab is removed." : " The Import tab is kept so you can check."));
}

// old homework moved onto the pages: a file from Claude with what each student had done in the old spreadsheet.
// File → Import → Upload → "Insert new sheet(s)", then Homework → Apply imported ticks (old homework).
// Rows: Type = task (a column in the Progress tab) · tick (a done task) · text (a student's text, with your feedback).
// Safe to run twice: what is already in the table is left as it is.
function applyImportedTicks() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const imports = ss.getSheets().filter(s => /^import/i.test(s.getName()) && String(s.getRange(1, 1).getValue()).trim() === "Type");
  if (!imports.length) { say_("No Import tab with old ticks found. Import Claude's file first: File → Import → Upload → Insert new sheet(s)."); return; }
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const st = ss.getSheetByName(STUDENTS);
    const people = {};
    if (st && st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, 3).getValues().forEach((r, i) => {
      const name = String(r[1]).trim(), group = String(r[2]).trim().toUpperCase();
      if (name) people[group + "|" + name.toLowerCase()] = { row: i + 2, code: String(r[0]).trim().toLowerCase(), name: name, group: group };
    });
    const state = sheet_(STATE, STATE_HEAD);
    const sn = state.getLastRow() - 1;
    const have = {};
    (sn > 0 ? state.getRange(2, 1, sn, 1).getValues() : []).forEach(r => { have[r[0]] = true; });
    const work = work_();
    const wn = work.getLastRow() - 1;
    const wrows = wn > 0 ? work.getRange(2, 1, wn, WORK_HEAD.length).getValues() : [];
    let maxId = 1000; wrows.forEach(r => { maxId = Math.max(maxId, Number(r[W.id - 1]) || 0); });
    const noon = d => { const t = parseDate_(d); return t ? t + 12 * 3600000 : Date.now(); };
    let ticks = 0, texts = 0, kept = 0; const unknown = {}, nocode = {}, fewer = {};
    imports.forEach(imp => {
      const head = imp.getRange(1, 1, 1, imp.getLastColumn()).getValues()[0].map(h => String(h).trim());
      const c = name => head.indexOf(name);
      const rows = imp.getLastRow() > 1 ? imp.getRange(2, 1, imp.getLastRow() - 1, head.length).getValues() : [];
      const val = (r, name) => c(name) < 0 ? "" : r[c(name)];
      // 1. the Progress columns, in the pages' own task order
      const pages = {};
      rows.filter(r => String(val(r, "Type")).trim() === "task").forEach(r => {
        const page = String(val(r, "Homework")).trim();
        (pages[page] = pages[page] || { group: String(val(r, "Group")).trim().toUpperCase(), date: val(r, "Date"), tasks: [] })
          .tasks.push({ id: String(val(r, "Task")).trim(), title: String(val(r, "Title")).trim() });
      });
      Object.keys(pages).forEach(page => {
        const d = pages[page].date;
        ensureColumns_(progress_(pages[page].group), page, d instanceof Date ? Utilities.formatDate(d, TZ, "dd.MM.yy") : String(d), pages[page].tasks);
      });
      // 2. ticks and texts
      rows.forEach(r => {
        const type = String(val(r, "Type")).trim();
        if (type !== "tick" && type !== "text") return;
        const group = String(val(r, "Group")).trim().toUpperCase(), name = String(val(r, "Student")).trim();
        const stu = people[group + "|" + name.toLowerCase()];
        if (!stu) { unknown[name + " (" + group + ")"] = true; return; }
        if (!stu.code) { nocode[stu.name] = true; return; }
        const page = String(val(r, "Homework")).trim(), task = String(val(r, "Task")).trim();
        const key = stu.code + "|" + page + "|" + task;
        if (type === "tick") {
          if (have[key]) { kept++; return; }
          const ts = noon(val(r, "Date")), frames = Number(val(r, "Frames")) || 0;
          state.appendRow([key, stu.code, page, task, true, ts, String(val(r, "Title")).trim() || task, frames]); have[key] = true;
          const prog = progress_(group), col = colsByKey_(prog)[page + "|" + task];
          if (col) {
            const cell = prog.getRange(ensureRow_(prog, stu.name), col);
            cell.setValue("✓ " + Utilities.formatDate(new Date(ts), TZ, "dd.MM")); cell.setBackground("#D9F2D0");
          }
          if (/^y/i.test(String(val(r, "In old count")))) fewer[group] = (fewer[group] || 0) + frames;
          ticks++;
        } else {
          const text = String(val(r, "Text")).replace(/\r/g, "");
          if (wrows.some(w => w[W.key - 1] === key && String(w[W.text - 1]).replace(/^'/, "") === text)) { kept++; return; }
          const d = val(r, "Date");
          const values = [++maxId, fmtDate_(Date.now()), stu.name, stu.group, d instanceof Date ? Utilities.formatDate(d, TZ, "dd.MM.yy") : String(d),
            String(val(r, "Title")).trim() || task, "✍️ text", safeText_(text), "", String(val(r, "Feedback") || ""), "", key];
          work.appendRow(values); wrows.push(values); texts++;
        }
      });
    });
    // 3. the old spreadsheet's frames are now real ticks: take them off "Frames before the pages", so nothing counts twice
    const set = settings_();
    const sr = set.getRange(2, 1, Math.max(1, set.getLastRow() - 1), 3).getValues();
    const changed = [];
    Object.keys(fewer).forEach(g => {
      const i = sr.findIndex(r => String(r[0]).trim().toUpperCase() === g);
      if (i < 0) return;
      const before = Number(sr[i][2]) || 0, now = Math.max(0, before - fewer[g]);
      set.getRange(i + 2, 3).setValue(now);
      changed.push(g + ": " + before + " → " + now);
      groupStats_(g);
    });
    const left = Object.keys(unknown), noCodes = Object.keys(nocode);
    if (!left.length && !noCodes.length) imports.forEach(imp => ss.deleteSheet(imp));
    say_("Ticks added: " + ticks + ". Texts added: " + texts + "." + (kept ? " Already in the table, left as they were: " + kept + "." : "") +
      (changed.length ? " Frames before the pages, " + changed.join(", ") + " (the old ticks are counted on the pages now)." : "") +
      (left.length ? " Not found on the Students tab: " + left.join(", ") + " — fix the name on the Import tab (or on Students) and run this again." : "") +
      (noCodes.length ? " No code yet: " + noCodes.join(", ") + " — choose Homework → Make codes for new students, then run this again." : "") +
      (!left.length && !noCodes.length ? " The Import tab is removed." : " The Import tab is kept."));
  } finally { lock.releaseLock(); }
}

// for the list of all homework: what this student has done on each page, and any feedback waiting
function summary_(stu, pages) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const want = {}; (Array.isArray(pages) ? pages.slice(0, 200) : []).forEach(k => { want[clean_(k, 80)] = true; });
  const out = {};
  const state = ss.getSheetByName(STATE);
  if (state && state.getLastRow() > 1) {
    state.getRange(2, 1, state.getLastRow() - 1, 6).getValues().forEach(r => {
      if (r[1] !== stu.code || !want[r[2]]) return;
      const o = out[r[2]] = out[r[2]] || { done: [], fb: 0, fbNew: 0, sent: 0 };
      if (r[4] === true) o.done.push(String(r[3]));
    });
  }
  const work = ss.getSheetByName(WORK);
  if (work && work.getLastRow() > 1) {
    work.getRange(2, 1, work.getLastRow() - 1, WORK_HEAD.length).getValues().forEach(r => {
      const key = String(r[W.key - 1]).split("|");
      if (key[0] !== stu.code || !want[key[1]]) return;
      const o = out[key[1]] = out[key[1]] || { done: [], fb: 0, fbNew: 0, sent: 0 };
      o.sent++;
      if (String(r[W.feedback - 1]).trim()) { o.fb++; if (!r[W.seen - 1]) o.fbNew++; }
    });
  }
  const own = isGroup_(stu.group);
  return { ok: true, name: stu.name, gid: own ? stu.group.toLowerCase() : "", pages: out, group: own ? groupStats_(stu.group) : null, me: own ? null : meStats_(stu.code), published: published_(pages) };
}

// Easy / OK / Hard after a task: one row per student + task in Reactions, and shown next to the tick in Progress
function react_(stu, page, p) {
  const task = clean_(p.task, 60), level = LEVELS[String(p.level || "").toLowerCase()];
  if (!task || !level) return { ok: false, error: "bad-reaction" };
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = sheet_(REACT, ["Date", "Student", "Group", "Homework", "Task", "How was it", "Key"]);
  const key = stu.code + "|" + page + "|" + task;
  const n = sh.getLastRow() - 1;
  if (n < 1) sh.hideColumns(7);
  const keys = n > 0 ? sh.getRange(2, 7, n, 1).getValues().map(r => String(r[0])) : [];
  const values = [fmtDate_(Date.now()), stu.name, stu.group, clean_(p.date, 20) || page, clean_(p.title, 120) || task, level, key];
  const i = keys.indexOf(key);
  if (i > -1) sh.getRange(i + 2, 1, 1, values.length).setValues([values]); else sh.appendRow(values);
  // next to the tick
  const prog = progress_(stu.group), col = colsByKey_(prog)[page + "|" + task];
  if (col) {
    const row = ensureRow_(prog, stu.name), cell = prog.getRange(row, col);
    const v = String(cell.getValue()).replace(/ · (easy|ok|hard)$/, "");
    if (v) { cell.setValue(v + " · " + level); cell.setFontColor(level === "hard" ? "#B3261E" : null); }
  }
  return { ok: true };
}

function reactionsFor_(stu, page) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(REACT);
  const out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  const prefix = stu.code + "|" + page + "|";
  sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues().forEach(r => { const k = String(r[6]); if (k.indexOf(prefix) === 0) out[k.slice(prefix.length)] = r[5]; });
  return out;
}

// ---------- the group goal ----------
function settings_() {
  const sh = sheet_(SETTINGS, SETTINGS_HEAD);
  if (sh.getLastRow() < 2) {
    sh.getRange(2, 1, SETTINGS_DEFAULTS.length, SETTINGS_HEAD.length).setValues(SETTINGS_DEFAULTS);
    [70, 110, 170, 110, 160, 140, 140].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  }
  return sh;
}

function parseDate_(v) {
  if (v instanceof Date) return v.getTime();
  const m = String(v || "").trim().match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})$/);
  if (m) return new Date(Number(m[3]) < 100 ? 2000 + Number(m[3]) : Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();
  return Date.parse(v) || 0;
}

// frames now = frames before the pages + every ticked task since the season start (its minutes; Over to you counts double)
function groupStats_(group) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const set = settings_();
  const rows = set.getRange(2, 1, Math.max(1, set.getLastRow() - 1), SETTINGS_HEAD.length).getValues();
  const i = rows.findIndex(r => String(r[0]).trim().toUpperCase() === group);
  if (i < 0) return null;
  const goal = Number(rows[i][1]) || 0, before = Number(rows[i][2]) || 0, start = parseDate_(rows[i][3]);
  const reward = String(rows[i][4] || "a series lesson").trim();
  const codes = {}; let size = 0;
  const st = ss.getSheetByName(STUDENTS);
  if (st && st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, 3).getValues().forEach(r => {
    if (String(r[0]).trim() && String(r[1]).trim() && String(r[2]).trim().toUpperCase() === group) { codes[String(r[0]).trim().toLowerCase()] = true; size++; }
  });
  let total = before; const weekAgo = Date.now() - 7 * 86400000, active = {};
  const state = ss.getSheetByName(STATE);
  if (state && state.getLastRow() > 1) state.getRange(2, 1, state.getLastRow() - 1, 8).getValues().forEach(r => {
    if (!codes[r[1]] || r[4] !== true) return;
    const ts = Number(r[5]);
    if (ts >= start) total += Number(r[7]) || 0;
    if (ts >= weekAgo) active[r[1]] = true;
  });
  total = Math.round(total);
  set.getRange(i + 2, 6).setValue(total);
  if (goal && total >= goal && !rows[i][6]) set.getRange(i + 2, 7).setValue(new Date());
  return { total: total, goal: goal, reward: reward, week: Object.keys(active).length, size: size, reached: goal > 0 && total >= goal };
}

// a student outside the groups (Group = Self, for people studying on their own): their own film, by their code only.
// Nothing of theirs reaches Olya's views or a group's meter (those count only B2 / C1 codes).
function meStats_(code) {
  const state = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STATE);
  let total = 0, week = 0; const weekAgo = Date.now() - 7 * 86400000;
  if (state && state.getLastRow() > 1) state.getRange(2, 1, state.getLastRow() - 1, 8).getValues().forEach(r => {
    if (r[1] !== code || r[4] !== true) return;
    const f = Number(r[7]) || 0; total += f; if (Number(r[5]) >= weekAgo) week += f;
  });
  return { total: Math.round(total), week: Math.round(week) };
}

// ---------- the teacher view ----------
const groupOfPage_ = page => (String(page || "").split("-")[2] || "").toUpperCase();
// a real group is one with a row in Settings (B2, C1); a student works only on their own group's pages
function isGroup_(g) {
  const set = settings_();
  return set.getRange(2, 1, Math.max(1, set.getLastRow() - 1), 1).getValues().some(r => String(r[0]).trim().toUpperCase() === g);
}
const typeKey_ = s => { s = String(s); return s.indexOf("recording") > -1 ? "recording" : s.indexOf("question") > -1 ? "question" : s.indexOf("marked") > -1 ? "marked" : "text"; };

function teacher_(stu, p) {
  if (p.action === "summary") { const g = groupOfPage_((p.pages || [])[0]); return { ok: true, role: "teacher", name: stu.name, pages: {}, group: g ? groupStats_(g) : null, published: published_(p.pages) }; }
  if (p.action === "overview") return overview_(p);
  if (p.action === "liveOp") return liveOp_(clean_(p.tool, 80), p.op || {});
  if (p.action === "toolNote") return toolNote_(stu, p);
  if (p.action === "toolRoster") return toolRoster_(p);
  const page = clean_(p.page, 80);
  if (!page) return { ok: false, error: "no-page" };
  if (p.action === "feedback") return setFeedback_(p.id, p.text);
  if (p.action === "discussed") return discussed_(page, p);
  if (p.action === "publish") return publish_(page, p.on === true);
  if (p.action !== "sync") return { ok: true, role: "teacher" };     // the teacher's own ticks, reactions and marks are not recorded
  const G = groupOfPage_(page), ss = SpreadsheetApp.getActiveSpreadsheet();
  const students = [], idx = {};
  const st = ss.getSheetByName(STUDENTS);
  if (st && st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, 3).getValues().forEach(r => {
    const code = String(r[0]).trim().toLowerCase(), name = String(r[1]).trim();
    if (code && name && String(r[2]).trim().toUpperCase() === G) { idx[code] = students.length; students.push({ name: name }); }
  });
  const done = {};
  const state = ss.getSheetByName(STATE);
  if (state && state.getLastRow() > 1) state.getRange(2, 1, state.getLastRow() - 1, 5).getValues().forEach(r => {
    if (r[2] === page && r[4] === true && r[1] in idx) (done[r[3]] = done[r[3]] || []).push(idx[r[1]]);
  });
  const work = [];
  const wk = ss.getSheetByName(WORK);
  if (wk && wk.getLastRow() > 1) {
    const n = wk.getLastRow() - 1, rows = wk.getRange(2, 1, n, WORK_HEAD.length).getValues();
    let rich = null;
    rows.forEach((r, i) => {
      const k = String(r[W.key - 1]).split("|");
      if (k[1] !== page || !(k[0] in idx)) return;
      let fb = String(r[W.feedback - 1] || "");
      if (fb.trim()) { if (!rich) rich = wk.getRange(2, W.feedback, n, 1).getRichTextValues(); fb = marks_(rich[i][0]) || fb; }
      work.push({ id: r[W.id - 1], s: idx[k[0]], task: k.slice(2).join("|"), type: typeKey_(r[W.type - 1]), text: String(r[W.text - 1] || "").replace(/^'/, ""),
                  phrases: String(r[W.phrases - 1] || ""), feedback: fb, sent: String(r[W.sent - 1]), seen: !!r[W.seen - 1] });
    });
  }
  const reactions = {};
  const rc = ss.getSheetByName(REACT);
  if (rc && rc.getLastRow() > 1) rc.getRange(2, 1, rc.getLastRow() - 1, 7).getValues().forEach(r => {
    const k = String(r[6]).split("|");
    if (k[1] !== page || !(k[0] in idx)) return;
    const task = k.slice(2).join("|"), lv = String(r[5]);
    reactions[task] = reactions[task] || { easy: [], ok: [], hard: [] };
    if (reactions[task][lv]) reactions[task][lv].push(idx[k[0]]);
  });
  const discussed = {};
  const ds = ss.getSheetByName(DISC);
  if (ds && ds.getLastRow() > 1) ds.getRange(2, 1, ds.getLastRow() - 1, 4).getValues().forEach(r => {
    if (String(r[1]) !== page) return;
    try { discussed[String(r[2])] = JSON.parse(String(r[3])); } catch (err) {}
  });
  st_touch_(stu);
  return { ok: true, role: "teacher", name: stu.name, students: students, done: done, work: work, reactions: reactions, discussed: discussed, published: published_([page]).length > 0, group: groupStats_(G) };
}

// the start page and the group lists: what waits for Olya on every homework, in ONE request
// (each sheet is read once, whatever the number of homeworks; texts are not sent, only the numbers)
function overview_(p) {
  const keys = (Array.isArray(p.pages) ? p.pages : []).map(k => clean_(k, 80)).filter(Boolean).slice(0, 500);
  const ss = SpreadsheetApp.getActiveSpreadsheet(), pages = {}, groupOf = {}, size = {};
  const set = settings_(), real = {};
  set.getRange(2, 1, Math.max(1, set.getLastRow() - 1), 1).getValues().forEach(r => { const g = String(r[0]).trim().toUpperCase(); if (g) real[g] = true; });
  const st = ss.getSheetByName(STUDENTS);
  if (st && st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, 3).getValues().forEach(r => {
    const code = String(r[0]).trim().toLowerCase(), name = String(r[1]).trim(), g = String(r[2]).trim().toUpperCase();
    if (code && name && real[g]) { groupOf[code] = g; size[g] = (size[g] || 0) + 1; }
  });
  keys.forEach(k => { pages[k] = { toAnswer: 0, marked: 0, questions: 0, work: 0, started: 0, students: size[groupOfPage_(k)] || 0 }; });
  const started = {};
  const state = ss.getSheetByName(STATE);
  if (state && state.getLastRow() > 1) state.getRange(2, 1, state.getLastRow() - 1, 5).getValues().forEach(r => {
    const k = String(r[2]);
    if (!pages[k] || r[4] !== true || groupOf[r[1]] !== groupOfPage_(k)) return;
    (started[k] = started[k] || {})[r[1]] = true;
  });
  Object.keys(started).forEach(k => { pages[k].started = Object.keys(started[k]).length; });
  const wk = ss.getSheetByName(WORK);
  if (wk && wk.getLastRow() > 1) wk.getRange(2, 1, wk.getLastRow() - 1, WORK_HEAD.length).getValues().forEach(r => {
    const k = String(r[W.key - 1]).split("|"), c = pages[k[1]];
    if (!c || groupOf[k[0]] !== groupOfPage_(k[1])) return;
    const t = typeKey_(r[W.type - 1]);
    // a 🔖 mark waits for an answer only when the student added a note ("— …" after the marked line)
    if (!String(r[W.feedback - 1] || "").trim() && (t !== "marked" || /\n— /.test(String(r[W.text - 1] || "")))) c.toAnswer++;
    if (t === "marked") c.marked++; else if (t === "question") c.questions++; else c.work++;
  });
  const groups = {};
  if (p.stats) Object.keys(real).forEach(g => { if (keys.some(k => groupOfPage_(k) === g)) groups[g] = groupStats_(g); });
  return { ok: true, role: "teacher", pages: pages, groups: groups, published: published_(keys) };
}

// drafts she published with the button ("🔒 Not published yet" → Publish): which of these pages are published now
function published_(keys) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PUB), on = {};
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(r => { if (r[1] === true) on[String(r[0])] = true; });
  return (Array.isArray(keys) ? keys : []).map(k => clean_(k, 80)).filter(k => on[k]);
}
function publish_(page, on) {
  const sh = sheet_(PUB, PUB_HEAD), n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const i = keys.indexOf(page), row = [page, on === true, fmtDate_(Date.now())];
  sh.getRange((i > -1 ? i : Math.max(n, 0)) + 2, 1, 1, 3).setValues([row]);   // her row for this page, or a new one
  return { ok: true, saved: true, published: on === true };
}

// ---------- lesson tools, live version (28.10): Olya removes, moves or corrects items during a lesson; the groups' pages pick it up ----------
// changes = { hide: [path], last: [path], text: { path: text }, order: { list: [item numbers] } }; a path names an item in the page's data,
// e.g. "speaking.2", "cards.4.1"; order = the order she dragged a list into (speaking tasks, follow-ups)
function liveRow_(tool) {
  const sh = sheet_(LIVE, LIVE_HEAD), n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  return { sh: sh, row: (keys.indexOf(tool) > -1 ? keys.indexOf(tool) : Math.max(n, 0)) + 2, found: keys.indexOf(tool) > -1 };
}
function liveGet_(tool) {
  const empty = { hide: [], last: [], text: {}, order: {} };
  if (!tool) return empty;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LIVE);
  if (!sh || sh.getLastRow() < 2) return empty;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === tool) { try { const v = JSON.parse(String(rows[i][1])); return { hide: v.hide || [], last: v.last || [], text: v.text || {}, order: v.order || {} }; } catch (err) { return empty; } }
  return empty;
}
function liveOp_(tool, op) {
  if (!tool) return { ok: false, error: "no-tool" };
  const kind = String(op.kind || ""), path = clean_(op.path, 80), text = String(op.text == null ? "" : op.text).slice(0, 2000);
  if (kind !== "reset" && !/^[a-zA-Z]+(\.[a-zA-Z0-9]+)*$/.test(path)) return { ok: false, error: "bad-path" };
  const v = liveGet_(tool), drop = (a, x) => a.filter(y => y !== x);
  if (kind === "hide") { v.hide = drop(v.hide, path).concat([path]); }
  else if (kind === "unhide") { v.hide = drop(v.hide, path); }
  else if (kind === "last") { v.last = drop(v.last, path).concat([path]); }
  else if (kind === "unlast") { v.last = drop(v.last, path); }
  else if (kind === "text") { v.text[path] = text; }
  else if (kind === "untext") { delete v.text[path]; }
  else if (kind === "order") {
    let a = []; try { a = JSON.parse(text); } catch (err) {}
    if (!Array.isArray(a) || a.length > 200 || a.some(x => !Number.isInteger(x) || x < 0)) return { ok: false, error: "bad-order" };
    v.order[path] = a; v.last = v.last.filter(x => x.indexOf(path + ".") !== 0);
  }
  else if (kind === "reset") { v.hide = []; v.last = []; v.text = {}; v.order = {}; }
  else return { ok: false, error: "bad-op" };
  const r = liveRow_(tool);
  r.sh.getRange(r.row, 1, 1, 3).setValues([[tool, JSON.stringify(v), fmtDate_(Date.now())]]);
  sheet_(LIVELOG, LIVELOG_HEAD).appendRow([fmtDate_(Date.now()), tool, kind, path, safeText_(text)]);
  return { ok: true, live: v };
}

// ---------- lesson tools, live version (30.10, «Running late»): Olya sees what the groups type and can leave them a quick note ----------
// A group's page sends its text while they type (a draft) and when they press Send; one row per device + chat, the latest text wins.
// The device is a random id kept on that device; the name only if a student's code is saved on it (else the group stays anonymous).
// No code is needed to send (the groups often work on someone's laptop without a code); a cap per page keeps the sheet small.
const LW_TOOL = /^[a-z0-9-]{1,40}\/[a-z0-9-]{1,40}$/, LW_DEV = /^[a-z0-9]{12,40}$/;
function lwRows_(tool) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LWORK);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, LWORK_HEAD.length).getValues().map((r, i) => ({ row: i + 2, r: r })).filter(x => String(x.r[1]) === tool);
}
function lnRows_(tool, dev) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LNOTES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, LNOTES_HEAD.length).getValues().map((r, i) => ({ row: i + 2, r: r }))
    .filter(x => String(x.r[2]) === tool && (!dev || String(x.r[4]) === dev));
}
const lnOut_ = x => ({ id: String(x.r[0]), chat: Number(x.r[3]), dev: String(x.r[4]), q: String(x.r[6] || "").replace(/^'/, ""), k: String(x.r[7] || "note"), c: String(x.r[8] || "").replace(/^'/, ""), seen: !!x.r[9], ts: Number(x.r[10]) || 0 });
function toolPost_(p) {
  const tool = String(p.tool || ""), dev = String(p.dev || ""), chat = Number(p.chat);
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev) || !Number.isInteger(chat) || chat < 0 || chat > 40) return { ok: false, error: "bad-input" };
  const text = String(p.text == null ? "" : p.text).replace(/\r/g, "").slice(0, 1000), now = Date.now();
  const sh = sheet_(LWORK, LWORK_HEAD), rows = lwRows_(tool), key = tool + "|" + chat + "|" + dev;
  const old = rows.filter(x => String(x.r[0]) === key)[0];
  if (!old && !text.trim()) return { ok: true, notes: toolNotesFor_(tool, dev) };
  if (!old && rows.length >= 400) return { ok: false, error: "full" };
  const stu = p.code ? findStudent_(p.code) : null;
  const name = stu ? stu.name : old ? String(old.r[4]) : "", group = stu ? stu.group : old ? String(old.r[5]) : "";
  const started = old ? Number(old.r[10]) || now : now;
  const row = [key, tool, chat, dev, name, group, safeText_(text), p.sent === true ? "sent" : "typing", fmtDate_(started), fmtDate_(now), started, now];
  sh.getRange(old ? old.row : Math.max(sh.getLastRow(), 1) + 1, 1, 1, row.length).setValues([row]);
  return { ok: true, saved: true, notes: toolNotesFor_(tool, dev) };
}
// the group's page asks for Olya's notes (by its device id, no code); "seen" = the notes it has shown
function toolNotesFor_(tool, dev) { return lnRows_(tool, dev).map(lnOut_).map(n => ({ id: n.id, chat: n.chat, q: n.q, k: n.k, c: n.c, ts: n.ts })); }
function toolSeen_(tool, dev, ids) {
  const want = (Array.isArray(ids) ? ids : []).map(String).slice(0, 50);
  if (!want.length) return;
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LNOTES);
  lnRows_(tool, dev).forEach(x => { if (!x.r[9] && want.indexOf(String(x.r[0])) > -1) sh.getRange(x.row, 10).setValue(fmtDate_(Date.now())); });
}
// a group's deck on a cards page: card number → times it went back into the deck, and the cards they got (one row per device, latest wins)
function toolDeck_(p) {
  const tool = String(p.tool || ""), dev = String(p.dev || "");
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev)) return { ok: false, error: "bad-input" };
  const card = x => { const i = Number(x); return Number.isInteger(i) && i >= 0 && i < 500 ? i : -1; };
  const again = {}, got = [], a = p.again && typeof p.again === "object" ? p.again : {};
  Object.keys(a).slice(0, 300).forEach(k => { const i = card(k), n = Number(a[k]); if (i > -1 && Number.isInteger(n) && n > 0 && n < 1000) again[i] = n; });
  (Array.isArray(p.got) ? p.got : []).slice(0, 500).forEach(x => { const i = card(x); if (i > -1 && got.indexOf(i) < 0) got.push(i); });
  const sh = sheet_(LDECK, LDECK_HEAD), n = sh.getLastRow() - 1, key = tool + "|" + dev;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const i = keys.indexOf(key);
  if (i < 0 && keys.filter(k => k.indexOf(tool + "|") === 0).length >= 200) return { ok: false, error: "full" };
  const stu = p.code ? findStudent_(p.code) : null, now = Date.now();
  const name = stu ? stu.name : i > -1 ? String(sh.getRange(i + 2, 4).getValue()) : "";
  sh.getRange(i > -1 ? i + 2 : n + 2, 1, 1, LDECK_HEAD.length).setValues([[key, tool, dev, name, JSON.stringify(again), JSON.stringify(got), fmtDate_(now), now]]);
  return { ok: true, saved: true };
}
function deckRows_(tool) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LDECK);
  if (!sh || sh.getLastRow() < 2) return [];
  const js = (v, d) => { try { return JSON.parse(String(v)) || d; } catch (err) { return d; } };
  return sh.getRange(2, 1, sh.getLastRow() - 1, LDECK_HEAD.length).getValues().filter(r => String(r[1]) === tool)
    .map(r => ({ dev: String(r[2]), name: String(r[3] || ""), again: js(r[4], {}), got: js(r[5], []), ts: Number(r[7]) || 0 }));
}

// where a screen is now (a stage of a revision page): no code; her own device never counts (the rooms open with the first group's screen)
function toolWhere_(p) {
  const tool = String(p.tool || ""), dev = String(p.dev || ""), at = String(p.at == null ? "" : p.at).replace(/[\r\n]+/g, " ").trim().slice(0, 80);
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev)) return { ok: false, error: "bad-input" };
  const stu = p.code ? findStudent_(p.code) : null;
  if (stu && stu.group === TEACHER) return { ok: true, skipped: true };
  const sh = sheet_(LROOMS, LROOMS_HEAD), n = sh.getLastRow() - 1, key = tool + "|" + dev, now = Date.now();
  const rows = n > 0 ? sh.getRange(2, 1, n, LROOMS_HEAD.length).getValues() : [];
  let i = -1; for (let k = 0; k < rows.length; k++) if (String(rows[k][0]) === key) { i = k; break; }
  if (i < 0 && rows.filter(r => String(r[1]) === tool).length >= 100) return { ok: false, error: "full" };
  const stale = old0 => !old0 || now - (Number(old0[12]) || 0) > 3 * 3600000;   // nothing from this screen for 3 hours: a new lesson (her rooms and list start again)
  const old = i > -1 ? rows[i] : null, fresh = stale(old), first = !fresh ? Number(old[11]) || now : now;
  const since = !fresh && String(old[4]) === at ? Number(old[10]) || now : now;
  const name = stu ? stu.name : old ? String(old[3]) : "";
  const row = [key, tool, dev, name, safeText_(at), fmtDate_(since), fmtDate_(first), old && !fresh ? old[7] : "", old && !fresh ? old[8] : "", fmtDate_(now), since, first, now];
  sh.getRange(i > -1 ? i + 2 : n + 2, 1, 1, row.length).setValues([row]);
  return { ok: true, saved: true };
}
// one tap of a group: ✓/≈/✗ after "Show the answer" (check), 🔖 on a gap (gap), a box phrase ticked (box); latest wins
function toolSignal_(p) {
  const tool = String(p.tool || ""), dev = String(p.dev || ""), kind = String(p.kind || "");
  const item = String(p.item == null ? "" : p.item).replace(/[\r\n]+/g, " ").trim().slice(0, 120), value = String(p.value == null ? "" : p.value).trim().slice(0, 20);
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev) || LSIG_KINDS.indexOf(kind) < 0 || !item) return { ok: false, error: "bad-input" };
  const sh = sheet_(LSIG, LSIG_HEAD), n = sh.getLastRow() - 1, key = tool + "|" + dev + "|" + kind + "|" + item, now = Date.now();
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const i = keys.indexOf(key);
  if (i < 0 && keys.filter(k => k.indexOf(tool + "|") === 0).length >= 3000) return { ok: false, error: "full" };
  sh.getRange(i > -1 ? i + 2 : n + 2, 1, 1, LSIG_HEAD.length).setValues([[key, tool, dev, kind, safeText_(item), safeText_(value), fmtDate_(now), now]]);
  return { ok: true, saved: true };
}
// her roster: who sits at which screen in this activity (tap a name, then a room); every move is kept with its time
function toolRoster_(p) {
  const tool = String(p.tool || ""), dev = String(p.dev || "");
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev)) return { ok: false, error: "bad-input" };
  const names = (Array.isArray(p.names) ? p.names : []).map(x => clean_(x, 40)).filter(Boolean).slice(0, 8);
  const move = clean_(p.move, 120);
  const sh = sheet_(LROOMS, LROOMS_HEAD), n = sh.getLastRow() - 1, key = tool + "|" + dev, now = Date.now();
  const rows = n > 0 ? sh.getRange(2, 1, n, LROOMS_HEAD.length).getValues() : [];
  let i = -1; for (let k = 0; k < rows.length; k++) if (String(rows[k][0]) === key) { i = k; break; }
  const old = i > -1 ? rows[i] : null;
  let moves = []; try { moves = JSON.parse(String(old ? old[8] : "") || "[]") || []; } catch (err) {}
  if (move) moves = moves.concat([move]).slice(-60);
  const row = old ? old.slice() : [key, tool, dev, "", "", "", "", "", "", "", "", "", ""];
  row[7] = JSON.stringify(names); row[8] = JSON.stringify(moves); row[9] = fmtDate_(now); row[12] = now;
  sh.getRange(i > -1 ? i + 2 : n + 2, 1, 1, row.length).setValues([row]);
  return toolList_(tool);
}
function roomRows_(tool) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LROOMS);
  if (!sh || sh.getLastRow() < 2) return [];
  const js = (v, d) => { try { return JSON.parse(String(v)) || d; } catch (err) { return d; } };
  return sh.getRange(2, 1, sh.getLastRow() - 1, LROOMS_HEAD.length).getValues().filter(r => String(r[1]) === tool)
    .map(r => ({ dev: String(r[2]), name: String(r[3] || ""), at: String(r[4] || "").replace(/^'/, ""), names: js(r[7], []), moves: js(r[8], []), since: Number(r[10]) || 0, first: Number(r[11]) || 0, ts: Number(r[12]) || 0 }));
}
function signalRows_(tool) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LSIG);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, LSIG_HEAD.length).getValues().filter(r => String(r[1]) === tool)
    .map(r => ({ dev: String(r[2]), kind: String(r[3]), item: String(r[4]).replace(/^'/, ""), value: String(r[5]).replace(/^'/, ""), ts: Number(r[7]) || 0 }));
}
// her roster's list: the students of the page's group (b2-… → B2), names only, for her screen
function groupNames_(tool) {
  const g = String(tool).split("-")[0].toUpperCase(), st = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS);
  if (!st || st.getLastRow() < 2 || ["B2", "C1"].indexOf(g) < 0) return [];
  return st.getRange(2, 1, st.getLastRow() - 1, 3).getValues().filter(r => String(r[2]).trim().toUpperCase() === g && String(r[1]).trim()).map(r => String(r[1]).trim());
}

// her screen: everything the groups typed on this page, with her notes (and the groups' decks on a cards page)
function toolList_(tool) {
  if (!LW_TOOL.test(tool)) return { ok: false, error: "bad-input" };
  const notes = lnRows_(tool, "").map(lnOut_);
  const rows = lwRows_(tool).map(x => ({ chat: Number(x.r[2]), dev: String(x.r[3]), name: String(x.r[4] || ""), text: String(x.r[6] || "").replace(/^'/, ""),
    status: String(x.r[7]), started: Number(x.r[10]) || 0, ts: Number(x.r[11]) || 0 }));
  rows.forEach(w => { w.notes = notes.filter(n => n.dev === w.dev && n.chat === w.chat).map(n => ({ id: n.id, q: n.q, k: n.k, c: n.c, seen: n.seen, ts: n.ts })); });
  return { ok: true, rows: rows, notes: notes, decks: deckRows_(tool), rooms: roomRows_(tool), signals: signalRows_(tool), students: groupNames_(tool), now: Date.now() };
}
function toolNote_(stu, p) {
  const tool = String(p.tool || ""), dev = String(p.dev || ""), chat = Number(p.chat);
  if (!LW_TOOL.test(tool) || !LW_DEV.test(dev) || !Number.isInteger(chat) || chat < 0 || chat > 40) return { ok: false, error: "bad-input" };
  const c = String(p.note == null ? "" : p.note).replace(/[\r\n]+/g, " ").trim().slice(0, 300), q = String(p.quote == null ? "" : p.quote).replace(/[\r\n]+/g, " ").trim().slice(0, 160);
  const k = LN_MARKS.indexOf(p.mark) > -1 ? p.mark : "note";
  if ((k === "note" || k === "fix" || k === "go" || k === "say") && !c) return { ok: false, error: "empty" };
  if ((k === "good" || k === "change" || k === "fix") && !q) return { ok: false, error: "no-words" };
  const w = lwRows_(tool).filter(x => String(x.r[0]) === tool + "|" + chat + "|" + dev)[0];
  const now = Date.now(), id = now.toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  sheet_(LNOTES, LNOTES_HEAD).appendRow([id, fmtDate_(now), tool, chat, dev, w ? String(w.r[4]) : "", safeText_(q), k, safeText_(c), "", now]);
  return toolList_(tool);
}

// "Where they got stuck" → ✓ Discussed: the marks and questions she went through in class (by work ID), and how many "hard" she has seen
function discussed_(page, p) {
  const task = clean_(p.task, 80);
  if (!task) return { ok: false, error: "no-task" };
  const sh = sheet_(DISC, DISC_HEAD), key = page + "|" + task, n = sh.getLastRow() - 1;
  const keys = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const i = keys.indexOf(key);
  let d = { ids: [], hard: 0 };
  if (i > -1) { try { d = JSON.parse(String(sh.getRange(i + 2, 4).getValue())) || d; } catch (err) {} }
  const add = (Array.isArray(p.ids) ? p.ids : []).map(String).slice(0, 500);
  const undo = (Array.isArray(p.undo) ? p.undo : []).map(String);
  const ids = {}; (d.ids || []).map(String).concat(add).forEach(x => { if (undo.indexOf(x) < 0) ids[x] = true; });
  d = { ids: Object.keys(ids), hard: p.hard != null ? Math.max(0, Number(p.hard) || 0) : (Number(d.hard) || 0) };
  const row = [key, page, task, JSON.stringify(d), fmtDate_(Date.now())];
  if (i > -1) sh.getRange(i + 2, 1, 1, row.length).setValues([row]); else sh.getRange(n + 2, 1, 1, row.length).setValues([row]);
  return { ok: true, saved: true, discussed: d };
}

// the teacher writes or edits feedback from the page; the marks (**good**, ~~change~~, {her words}) stay as typed
function setFeedback_(id, text) {
  const sh = work_(), n = sh.getLastRow() - 1;
  if (n < 1) return { ok: false, error: "not-found" };
  const ids = sh.getRange(2, W.id, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) {
    sh.getRange(i + 2, W.feedback).setValue(safeText_(String(text || "").replace(/\r/g, "").slice(0, 20000)));
    return { ok: true };
  }
  return { ok: false, error: "not-found" };
}

function safeText_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

// read-only questions skip the lock, so the groups' pages and her screen don't queue behind each other during a lesson
function readOnly_(p) {
  if (p.action === "live") return { ok: true, live: liveGet_(clean_(p.tool, 80)) };          // a lesson tool (live version) asks for Olya's changes: no code, no personal data
  if (p.action === "toolNotes" && !(Array.isArray(p.seen) && p.seen.length)) {                 // a group's page asks for her notes to this device
    const tool = String(p.tool || ""), dev = String(p.dev || "");
    return LW_TOOL.test(tool) && LW_DEV.test(dev) ? { ok: true, notes: toolNotesFor_(tool, dev) } : { ok: false, error: "bad-input" };
  }
  if (p.action === "toolList") {                                                                // her screen: what the groups typed (her code only)
    const stu = findStudent_(p.code);
    if (!stu) return { ok: false, error: "unknown-code" };
    return stu.group === TEACHER ? toolList_(String(p.tool || "")) : { ok: false, error: "not-teacher" };
  }
  return null;
}

function sync_(p) {
  const quick = readOnly_(p);
  if (quick) return quick;
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: "busy" }; }
  try {
    if (p.action === "published") return { ok: true, published: published_(p.pages) };   // the group list without a code: page keys only
    if (p.action === "toolPost") return toolPost_(p);
    if (p.action === "toolDeck") return toolDeck_(p);
    if (p.action === "toolWhere") return toolWhere_(p);                                        // where a group's screen is now (revision pages)
    if (p.action === "toolSignal") return toolSignal_(p);                                      // ✓/≈/✗, 🔖 on a gap, a box phrase                                          // a group's ↺ Again / ✓ Got it on a cards page (-live): no code needed                                          // a group's text from a lesson tool (-live page): no code needed
    if (p.action === "toolNotes") { const tool = String(p.tool || ""), dev = String(p.dev || "");   // her notes, and which ones the group has seen
      if (!LW_TOOL.test(tool) || !LW_DEV.test(dev)) return { ok: false, error: "bad-input" };
      toolSeen_(tool, dev, p.seen); return { ok: true, notes: toolNotesFor_(tool, dev) }; }
    const stu = findStudent_(p.code);
    if (!stu) return { ok: false, error: "unknown-code" };
    if (stu.group === TEACHER) return teacher_(stu, p);
    const asked = groupOfPage_(p.action === "summary" ? (Array.isArray(p.pages) ? p.pages[0] : "") : p.page);
    if (asked && asked !== stu.group && isGroup_(stu.group)) return { ok: false, error: "other-group", gid: stu.group.toLowerCase() };
    if (p.action === "summary") { st_touch_(stu); return summary_(stu, p.pages); }
    const page = clean_(p.page, 80);
    if (!page) return { ok: false, error: "no-page" };

    if (p.action === "submit") { const r = submit_(stu, page, p); st_touch_(stu); return r; }
    if (p.action === "seen") { seen_(stu, p.id); return { ok: true }; }
    if (p.action === "note") return note_(stu, p.id, p.text);
    if (p.action === "react") { const r = react_(stu, page, p); st_touch_(stu); return r; }

    const prog = progress_(stu.group);
    if (Array.isArray(p.tasks)) ensureColumns_(prog, page, clean_(p.date, 20), p.tasks.slice(0, 60));
    const row = ensureRow_(prog, stu.name);

    // apply the ticks that are newer than what the table has
    const state = sheet_(STATE, STATE_HEAD);
    const n = state.getLastRow() - 1;
    const data = n > 0 ? state.getRange(2, 1, n, 8).getValues() : [];
    const at = {};
    data.forEach((r, i) => { at[r[0]] = i; });
    const titles = {};
    const frames = {};
    (p.tasks || []).forEach(t => { titles[clean_(t.id, 60)] = clean_(t.title, 120); frames[clean_(t.id, 60)] = Math.max(0, Math.min(200, Number(t.frames) || 0)); });
    const now = Date.now();
    const keyCols = colsByKey_(prog);
    let reacts = null;

    (Array.isArray(p.events) ? p.events.slice(0, 100) : []).forEach(ev => {
      const task = clean_(ev.task, 60);
      const ts = Number(ev.ts);
      if (!task || !isFinite(ts) || ts <= 0 || ts > now + 86400000) return;
      const done = ev.done === true || ev.done === 1;
      const key = stu.code + "|" + page + "|" + task;
      if (key in at) {
        const r = data[at[key]];
        if (ts <= Number(r[5])) return;           // the table already has something newer
        r[4] = done; r[5] = ts; if (task in frames) r[7] = frames[task];
        state.getRange(at[key] + 2, 5, 1, 4).setValues([[done, ts, r[6], r[7] || 0]]);
      } else {
        const r = [key, stu.code, page, task, done, ts, titles[task] || task, frames[task] || 0];
        state.appendRow(r); data.push(r); at[key] = data.length - 1;
      }
      const col = keyCols[page + "|" + task];
      if (col) {
        const cell = prog.getRange(row, col);
        if (done) { const lv = (reacts || (reacts = reactionsFor_(stu, page)))[task];
          cell.setValue("✓ " + Utilities.formatDate(new Date(ts), TZ, "dd.MM") + (lv ? " · " + lv : "")); cell.setBackground("#D9F2D0"); cell.setFontColor(lv === "hard" ? "#B3261E" : null); }
        else { cell.setValue(""); cell.setBackground(null); }
      }
    });

    st_touch_(stu);
    const tasks = {};
    data.forEach(r => { if (r[1] === stu.code && r[2] === page) tasks[r[3]] = { done: r[4] === true, ts: Number(r[5]) }; });
    const own = isGroup_(stu.group);
    return { ok: true, name: stu.name, gid: own ? stu.group.toLowerCase() : "", tasks: tasks, work: workFor_(stu, page), group: own ? groupStats_(stu.group) : null, me: own ? null : meStats_(stu.code) };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */
function findStudent_(code) {
  code = String(code || "").trim().toLowerCase();
  if (!code) return null;
  const st = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS);
  if (!st || st.getLastRow() < 2) return null;
  const rows = st.getRange(2, 1, st.getLastRow() - 1, 3).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === code && String(rows[i][1]).trim()) {
      return { row: i + 2, code: code, name: String(rows[i][1]).trim(),
               group: String(rows[i][2] || "").trim().toUpperCase() || "Other" };
    }
  }
  return null;
}

function st_touch_(stu) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(STUDENTS).getRange(stu.row, 4).setValue(new Date());
}

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function progress_(group) {
  const name = "Progress " + group;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 3, 1).setValues([["key"], [""], ["Student"]]);
    sh.getRange(3, 1).setFontWeight("bold");
    sh.setFrozenRows(3); sh.setFrozenColumns(1);
    sh.setColumnWidth(1, 150);
    sh.hideRows(1);
  }
  return sh;
}

function colsByKey_(sh) {
  const last = sh.getLastColumn();
  const keys = last > 1 ? sh.getRange(1, 2, 1, last - 1).getValues()[0] : [];
  const out = {};
  keys.forEach((k, i) => { if (k) out[k] = i + 2; });
  return out;
}

// new homework goes on the left, so the newest is always first
function ensureColumns_(sh, page, date, tasks) {
  const have = colsByKey_(sh);
  const list = tasks.map(t => ({ id: clean_(t.id, 60), title: clean_(t.title, 120) })).filter(t => t.id);
  const missing = list.filter(t => !have[page + "|" + t.id]);
  if (!missing.length) return;
  const pageCols = Object.keys(have).filter(k => k.indexOf(page + "|") === 0).map(k => have[k]);
  const dateOf = key => String(key).split("|")[0].slice(-10);          // hw-ge-c1-2026-10-16 → 2026-10-16
  const newer = Object.keys(have).filter(k => dateOf(k) > dateOf(page)).map(k => have[k]);
  const after = pageCols.length ? Math.max.apply(null, pageCols) : newer.length ? Math.max.apply(null, newer) : 1;
  sh.insertColumnsAfter(after, missing.length);
  const firstNew = after + 1;
  sh.getRange(1, firstNew, 3, missing.length).setValues([
    missing.map(t => page + "|" + t.id),
    missing.map((t, i) => (!pageCols.length && i === 0) ? date : ""),
    missing.map(t => t.title)
  ]);
  sh.getRange(2, firstNew, 1, missing.length).setFontWeight("bold");
  sh.getRange(3, firstNew, 1, missing.length).setWrap(true).setFontSize(9).setVerticalAlignment("top");
  for (let i = 0; i < missing.length; i++) sh.setColumnWidth(firstNew + i, 110);
}

function ensureRow_(sh, name) {
  const last = sh.getLastRow();
  if (last >= FIRST_STUDENT_ROW) {
    const names = sh.getRange(FIRST_STUDENT_ROW, 1, last - FIRST_STUDENT_ROW + 1, 1).getValues();
    for (let i = 0; i < names.length; i++) if (String(names[i][0]).trim() === name) return FIRST_STUDENT_ROW + i;
  }
  const row = Math.max(last + 1, FIRST_STUDENT_ROW);
  sh.getRange(row, 1).setValue(name);
  return row;
}

function clean_(s, max) {
  s = String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;     // never let text turn into a formula
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function say_(msg) {
  try { SpreadsheetApp.getUi().alert(msg); } catch (err) { Logger.log(msg); }
}
