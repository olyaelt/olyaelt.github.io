# Homework pages — engine

Not published (GitHub Pages skips folders that start with `_`). Used by Claude's **homework-html-page** skill.

- `lessons/<group>-<YYYY-MM-DD>/` — the source of each homework page: `page.html` (lesson content between the
  LESSON CONTENT markers + the engine), its pictures and data, and `page.json`.
- `build.py lessons/<name>` → writes `../<group>/<YYYY-MM-DD>.html`.
- `earlier.js` — used by build.py to pick sentences from earlier homework for the "From earlier lessons" block.
- `build_index.py` → rebuilds `../b2/index.html` and `../c1/index.html` (the list of all homework).
- `Code.gs` — the script in Olya's private Google table (progress, students' work, feedback, reactions, the group goal).
- `tests/smoke.js`, `tests/sync_check.js`, `tests/goal_check.js`, `tests/marks_check.js`, `tests/teacher_check.js` — checks before delivery (Node + Playwright).
