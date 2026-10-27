# Engine changelog

One line per version. Raise `VERSION`, add a line here, `python3 rebuild_all.py`, `python3 check_site.py`.
Details of each feature: `../README.md`.

- **27** (27.10.26) — 📢 Publish / Unpublish on a draft's page (teacher view, the "🔒 Not published yet" box): a row in her table (sheet "Published", Code.gs `publish_`); the students' group list asks the table (`summary` → `published`; without a code `{action:"published"}`, page keys only) and shows published drafts at once, no upload; her lists and the start page drop the 🔒. page.json `listed` stays as it was, so look-back on later pages still leaves the draft out (not decided yet). Needs the new Code.gs (New version).
- **26** (27.10.26) — unlisted drafts are visible to her: in her teacher view the group list and the start page show them with "🔒 Not published" (dashed frame), and the page itself says "🔒 Not published yet" on top; students still don't see them in their list. `build_index.py` keeps them flagged `unlisted` instead of dropping them; the list data is `HW_ALL` (students get `HW`, published only).
- **25** (27.10.26, request from «Методика ДЗ») — `modes:["write"]` on a produce step (or its task) = writing only: no Record tab, no "Prefer to talk?" hint (dialogues); `"listed": false` in page.json = an unlisted page: built and uploadable, opens by its link (teacher view works), left out of the group list, the start page and other pages' look-back; `"listed": true` + rebuild the page and `build_index.py` to publish. `tests/unlisted_check.js`.
- **24** (27.10.26) — the engine is one file (`page_template.html`); each homework keeps only `content.js` + `page.json` (title added). `ENGINE_VERSION` in every page; `rebuild_all.py`, `check_site.py`. Old full pages → `_old_pages/`.
- **23** (26.10.26) — brought back the feedback look made in the feedback chat: "💬 Overall" / "🎯 Follow-up" boxes (first / last whole `[[…]]` lines), comments dark-blue ink on light blue (`--note-ink`, `--note-bg`); `fbMarks` + `fbHTML`.
- **22** (26.10.26) — comment colours in dark mode (replaced by 23).
- **21** (26.10.26) — listening clips start without subtitles (`cc_load_policy: 0`, captions module unloaded once per video).
- **20** (26.10.26) — "Where they got stuck" opens the task itself at the first marked step; marked lines framed red with who/notes, "Hard for them:" bar, ✓ Discussed / undo / All discussed (sheet "Discussed").
- **19** (26.10.26) — first review view of marked lines (replaced by 20); Code.gs `discussed_`.
- **18** (26.10.26) — a bare 🔖 mark doesn't wait for an answer (only marks with a note do).
- **17** (26.10.26) — students see new feedback: red box on the list and the homework page, "✓ I've read it"; teacher panel "read ✓ / not read yet".
- **16** (26.10.26) — `{correction}` blue on yellow, `[[comment]]` blue on light blue; ✎ Correction / 💬 Comment buttons.
- **15** (26.10.26) — the task title opens the task in the teacher view; teacher strip on top of every task screen.
- **14** (26.10.26) — the feedback box is editable straight away; 📋 Copy / Copy all for Claude.
- **13** (26.10.26) — the task wording above the students' texts.
- **12** (26.10.26) — "💬 Waiting for your answer"; a tap on a task opens its panel; teacher Finish counts nothing.
- **11** (26.10.26) — listening lines play from a second before to a second after (TubeQuizard `offset = 1`).
- **10** (26.10.26) — B2's old homework moved onto pages: share/dlg step options, `MODEL_TITLE`, look-back carries `instr`.
- **≤ 9** — see `../README.md` and `_old/`.
