"""Lesson tools: pages students open during a lesson (not homework, not in any homework list).
   python3 build_tools.py [SITE_DIR]
Each tools/<lesson>/<page>.json (written in the lesson chat, "type" = the task type) + its template (engine chat)
-> <SITE_DIR>/tools/<lesson>/<page>.html, one self-contained file (the site font is shared from /fonts/).
Types (details in ../README.md, "Lesson tools"): "dice-council" (Reasons -> Decide -> Extra speaking; ?dice=3|4|6),
"say-it-another-way" (Cards -> Speaking; "review": {"from": "<page>", "n": 4} adds cards from an earlier part,
switched on in Settings or with ?review=1). A new type is an engine request."""
import base64, glob, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(HERE, 'tools')
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
VERSION = open(os.path.join(T, 'VERSION')).read().strip()
base_css = open(os.path.join(T, 'tool_base.css'), encoding='utf-8').read()
base_js = open(os.path.join(T, 'tool_base.js'), encoding='utf-8').read()
sticker = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(T, 'sticker.png'), 'rb').read()).decode()
js = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
# each task type has its own mechanic (template); the lesson chat names the type in its handoff, and each new type is built and reviewed with Olya on its own
TYPES = {'dice-council': 'council_template.html', 'say-it-another-way': 'cards_template.html', 'dice-situations': 'situations_template.html',
         'situation-cards': 'situation_cards_template.html'}   # tools 12
# the live version (tools 7, her wish 28.10): every page is also built as <page>-live.html, which asks her table for the changes
# she makes during the lesson; the plain page never contacts the table and stays exactly as it was. The table's address is the
# one the homework pages use (engine/page_template.html).
m = re.search(r'const SYNC_URL = "([^"]*)"', open(os.path.join(HERE, 'engine', 'page_template.html'), encoding='utf-8').read())
SYNC = m.group(1) if m else ''
built = []
pages = []   # for tools/index.html, her list of all lesson pages
for path in sorted(glob.glob(os.path.join(T, '*', '*.json'))):
    lesson, name = os.path.basename(os.path.dirname(path)), os.path.splitext(os.path.basename(path))[0]
    d = json.load(open(path, encoding='utf-8'))
    if d.get('type') not in TYPES:
        sys.exit('%s: unknown task type %r. Types so far: %s. A new type is an engine request (homework-html-page, "Who changes what").' % (path, d.get('type'), ', '.join(TYPES)))
    html = open(os.path.join(T, TYPES[d['type']]), encoding='utf-8').read()
    review = None
    if d.get('review'):
        src = json.load(open(os.path.join(T, lesson, d['review']['from'] + '.json'), encoding='utf-8'))
        review = {'page': lesson + '/' + d['review']['from'], 'part': src.get('part', 'last time'), 'n': d['review'].get('n', 4), 'cards': src['cards']}
    for k, v in [('__BASE_CSS__', base_css), ('__BASE_JS__', base_js), ('__TITLE__', d['title'] + (' · ' + d['part'] if d.get('part') else '')),
                 ('__DATA__', js(d)), ('__REVIEW__', js(review)), ('__STICKER__', sticker), ('__TOOLS_VERSION__', VERSION),
                 ('__PAGE_ID__', lesson + '/' + name)]:
        html = html.replace(k, v)
    out_dir = os.path.join(site, 'tools', lesson); os.makedirs(out_dir, exist_ok=True)
    pages.append({'lesson': lesson, 'name': name, 'title': d['title'], 'part': d.get('part', ''), 'type': d['type']})
    for suffix, live in (('', False), ('-live', True)):
        page = html.replace('__LIVE__', 'true' if live else 'false').replace('__SYNC_URL__', SYNC if live else '')
        left = [k for k in ('__BASE_CSS__', '__BASE_JS__', '__DATA__', '__REVIEW__', '__STICKER__', '__PAGE_ID__', '__LIVE__', '__SYNC_URL__') if k in page]
        assert not left, 'placeholder left in %s: %s' % (path, left)
        if live and not SYNC: print('WARNING: no SYNC_URL found, %s-live works like the plain page' % name)
        open(os.path.join(out_dir, name + suffix + '.html'), 'w', encoding='utf-8').write(page)
        built.append('tools/%s/%s%s.html' % (lesson, name, suffix))
# tools 9 (her wish 28.10): tools/index.html, a teacher's page with every lesson page, grouped by group and lesson, the live link
# first (with Copy, for the Zoom chat) and the plain one as the fallback. Shown when her code is on this device (as on the live
# pages: a lock on the door, the list is in the source); noindex, linked from nowhere.
GROUPS = {'b2': 'B2 · Wed Fri 18.30', 'c1': 'C1 · Wed Fri 20.15'}
KIND = {'dice-council': '🎲 dice council', 'say-it-another-way': '🃏 say it another way', 'dice-situations': '🎲 dice situations', 'situation-cards': '🃏 situation cards'}
def esc(t): return str(t).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')
blocks = []
for g in sorted({p['lesson'].split('-')[0] for p in pages}):
    rows = []
    for lesson in sorted({p['lesson'] for p in pages if p['lesson'].split('-')[0] == g}):
        rest = lesson.split('-', 1)[1] if '-' in lesson else lesson
        dm = re.match(r'(\d{4})-(\d{2})-(\d{2})$', rest)   # tools 11: a lesson folder named by its date (b2-2026-10-30)
        nice = 'Lesson of %s.%s.%s' % (dm.group(3), dm.group(2), dm.group(1)[2:]) if dm else rest.replace('-', ' ')
        rows.append('<h3>%s</h3>' % esc(nice[:1].upper() + nice[1:]))
        for p in [x for x in pages if x['lesson'] == lesson]:
            base = 'https://olyaelt.github.io/tools/%s/%s' % (p['lesson'], p['name'])
            rows.append('<div class="pg"><div class="pg-t"><b>%s</b>%s <span class="kind">%s · %s</span></div>'
                        '<div class="pg-a"><a class="btn primary" href="%s/%s-live.html" target="_blank" rel="noopener">Open live</a>'
                        '<button class="btn" data-copy="%s-live.html">Copy link</button>'
                        '<a class="plain" href="%s/%s.html" target="_blank" rel="noopener">plain page</a></div></div>'
                        % (esc(p['title']), (' · ' + esc(p['part'])) if p['part'] else '', esc(KIND.get(p['type'], p['type'])), esc(p['name']),
                           p['lesson'], p['name'], base, p['lesson'], p['name']))
    blocks.append('<section><h2>%s</h2>%s</section>' % (esc(GROUPS.get(g, g.upper())), ''.join(rows)))
index = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Lesson pages</title>
<link rel="stylesheet" href="../fonts/homework-sans.css">
<style>
:root{--ground:#F6F1DC;--card:#FFFFFF;--ink:#1D1D1B;--muted:#6B6B6B;--line:#D9D2B8;--instr:#0693E3;--label:#E00000}
@media (prefers-color-scheme: dark){:root{--ground:#141517;--card:#1E2024;--ink:#ECECEC;--muted:#A4A4A4;--line:#3A3D42}}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font-family:"Homework Sans",system-ui,sans-serif;line-height:1.45}
main{max-width:46rem;margin:0 auto;padding:20px 16px 40px}h1{margin:0 0 4px;font-size:1.6rem}
.note{color:var(--muted);margin:0 0 18px}h2{font-size:1.15rem;margin:22px 0 6px}
h3{font-size:.8rem;letter-spacing:.07em;text-transform:uppercase;color:var(--label);margin:14px 0 6px}
.pg{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 8px;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between}
.kind{color:var(--muted);font-size:.85rem;white-space:nowrap}.pg-a{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{font:inherit;font-weight:700;font-size:.95rem;border-radius:10px;padding:7px 12px;border:2px solid var(--instr);background:transparent;color:var(--instr);cursor:pointer;text-decoration:none}
.btn.primary{background:var(--instr);color:#fff}.plain{color:var(--muted);font-size:.9rem}
.legal{text-align:center;padding:10px 16px 24px;font-size:.85rem}.legal a{color:var(--muted)}
</style></head><body><main>
<h1>Lesson pages</h1>
<p class="note" id="who"></p>
<div id="list" hidden>__BLOCKS__</div>
</main>
<footer class="legal"><a href="../impressum.html">Impressum</a> · <a href="../datenschutz.html">Datenschutz</a></footer>
<script>
const me = (() => { try{ return localStorage.getItem("hw-role") === "teacher" && !!localStorage.getItem("hw-code"); }catch(e){ return false; } })();
const who = document.getElementById("who"), list = document.getElementById("list");
if(me){ list.hidden = false; who.textContent = "Give the groups the live link; if it misbehaves, the plain page. Your code is on this device, so the live pages show your 👩‍🏫 Live bar."; }
else who.textContent = "This page is for Olya. Open any homework page, type your code, then come back here.";
document.addEventListener("click", ev => {
  const b = ev.target.closest("[data-copy]"); if(!b) return;
  const url = b.dataset.copy, done = () => { b.textContent = "Copied ✓"; setTimeout(() => { b.textContent = "Copy link"; }, 1500); };
  const old = () => { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); try{ document.execCommand("copy"); done(); }catch(e){} t.remove(); };
  if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, old); else old();
});
</script></body></html>
""".replace('__BLOCKS__', ''.join(blocks))
open(os.path.join(site, 'tools', 'index.html'), 'w', encoding='utf-8').write(index)
print('tools %s: built %d pages + tools/index.html (her list)' % (VERSION, len(built)))
for b in built: print('  https://olyaelt.github.io/' + b)
