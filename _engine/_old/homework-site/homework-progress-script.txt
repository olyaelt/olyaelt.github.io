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
  say_("Ready. On the Students tab, add each student's name and group (B2 or C1), then choose Homework → Make codes for new students. The row with Group = Teacher holds YOUR code: type it on any homework page to see the teacher view. Keep it to yourself.");
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
  const imports = ss.getSheets().filter(s => /^import/i.test(s.getName()));
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
  return { ok: true, name: stu.name, pages: out, group: groupStats_(stu.group) };
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

// ---------- the teacher view ----------
const groupOfPage_ = page => (String(page || "").split("-")[2] || "").toUpperCase();
const typeKey_ = s => { s = String(s); return s.indexOf("recording") > -1 ? "recording" : s.indexOf("question") > -1 ? "question" : s.indexOf("marked") > -1 ? "marked" : "text"; };

function teacher_(stu, p) {
  if (p.action === "summary") { const g = groupOfPage_((p.pages || [])[0]); return { ok: true, role: "teacher", name: stu.name, pages: {}, group: g ? groupStats_(g) : null }; }
  const page = clean_(p.page, 80);
  if (!page) return { ok: false, error: "no-page" };
  if (p.action === "feedback") return setFeedback_(p.id, p.text);
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
  st_touch_(stu);
  return { ok: true, role: "teacher", name: stu.name, students: students, done: done, work: work, reactions: reactions, group: groupStats_(G) };
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

function sync_(p) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (err) { return { ok: false, error: "busy" }; }
  try {
    const stu = findStudent_(p.code);
    if (!stu) return { ok: false, error: "unknown-code" };
    if (stu.group === TEACHER) return teacher_(stu, p);
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
    return { ok: true, name: stu.name, tasks: tasks, work: workFor_(stu, page), group: groupStats_(stu.group) };
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
  const after = pageCols.length ? Math.max.apply(null, pageCols) : 1;
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
