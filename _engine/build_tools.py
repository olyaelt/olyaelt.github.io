"""Lesson tools: pages students open during a lesson (not homework, not in any homework list).
   python3 build_tools.py [SITE_DIR]
Each tools/<lesson>/<page>.json (written in the lesson chat, "type" = the task type) + its template (engine chat)
-> <SITE_DIR>/tools/<lesson>/<page>.html, one self-contained file (the site font is shared from /fonts/).
Types (details in ../README.md, "Lesson tools"): "dice-council" (Reasons -> Decide -> Extra speaking; ?dice=3|4|6),
"say-it-another-way" (Cards -> Speaking; "review": {"from": "<page>", "n": 4} adds cards from an earlier part,
switched on in Settings or with ?review=1). A new type is an engine request."""
import base64, glob, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(HERE, 'tools')
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
VERSION = open(os.path.join(T, 'VERSION')).read().strip()
base_css = open(os.path.join(T, 'tool_base.css'), encoding='utf-8').read() + '\n' + open(os.path.join(T, 'game.css'), encoding='utf-8').read()   # tools 14: the game pieces
base_js = open(os.path.join(T, 'tool_base.js'), encoding='utf-8').read() + '\n' + open(os.path.join(T, 'game.js'), encoding='utf-8').read()
# lesson work (tools 13): what the groups type, her notes, rooms — shared by the templates that have __LW_CSS__ / __LW_JS__
lw_css = open(os.path.join(T, 'lesson_work.css'), encoding='utf-8').read()
lw_js = open(os.path.join(T, 'lesson_work.js'), encoding='utf-8').read()
sticker = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(T, 'sticker.png'), 'rb').read()).decode()
js = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
# tools 17 (f-seen, the secret-card game): a QR code for the phone card, drawn here (OpenCV's encoder) as an inline SVG — the page makes no
# outside requests. Without OpenCV the page just shows the link.
def qr_svg(text):
    try:
        import cv2
    except ImportError:
        return ''
    m = cv2.QRCodeEncoder.create().encode(text)
    n = m.shape[0]
    path = ''.join('M%d %dh1v1h-1z' % (x, y) for y in range(n) for x in range(n) if m[y][x] == 0)
    return '<svg viewBox="-2 -2 %d %d" role="img" aria-label="QR code: the secret card on a phone"><rect x="-2" y="-2" width="%d" height="%d" fill="#FFFFFF"/><path d="%s" fill="#000000"/></svg>' % (n + 4, n + 4, n + 4, n + 4, path)
# the phone page: one big button, a random card (no repeat until all were drawn, kept on the phone), only its front
CARD_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>__T__</title><style>
:root{--ground:#F7F1E1;--card:#FFFFFF;--ink:#1D1D1B;--muted:#6B6B6B;--blue:#0693E3}
@media (prefers-color-scheme: dark){:root{--ground:#121416;--card:#1C1F23;--ink:#ECECEA;--muted:#A4A7AB;--blue:#1578C0}}
*{box-sizing:border-box}body{margin:0;background:var(--ground);color:var(--ink);font:18px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;min-height:100vh;display:grid;place-items:start center;padding:24px 16px}
main{width:100%;max-width:440px;display:grid;gap:16px;text-align:center}h1{margin:0;font-size:1.5rem}
button{font:inherit;font-weight:800;font-size:1.25rem;border:0;border-radius:14px;padding:16px 20px;background:var(--blue);color:#FFFFFF;cursor:pointer;width:100%}
button.again{background:none;color:var(--blue);border:2px solid var(--blue);font-size:1.05rem;padding:12px}
.card{background:#FFFFFF;color:#1D1D1B;border:3px solid #1D1D1B;border-radius:16px;box-shadow:0 5px 0 #1D1D1B;padding:18px;display:grid;gap:8px;text-align:left}
.n{font-size:3rem;font-weight:900;line-height:1;color:#0693E3;text-align:center}.card p{margin:0;font-size:1.2rem;font-weight:700}
.hint{margin:0;color:var(--muted)}.legal{font-size:.8rem;color:var(--muted)}.legal a{color:inherit}
</style></head><body><main id="m"></main><script>
const D = __D__, KEY = "secret-card-" + D.page;
const get = () => { try{ return JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){ return null; } }, put = v => { try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let st = get() || {left: [], cur: null};
function draw(){ if(!st.left.length){ st.left = D.cards.map((_, i) => i).filter(i => i !== st.cur); for(let i = st.left.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [st.left[i], st.left[j]] = [st.left[j], st.left[i]]; } }
  st.cur = st.left.shift(); put(st); render(); }
function render(){ const c = st.cur != null ? D.cards[st.cur] : null;
  document.getElementById("m").innerHTML = `<h1>${esc(D.phone.title)}</h1>` + (c ? `<div class="card"><div class="n">${st.cur + 1}</div>${c.map(l => `<p>${esc(l)}</p>`).join("")}</div><p class="hint">${esc(D.phone.hint)}</p><button class="again" id="b">${esc(D.phone.again)}</button>`
    : `<button id="b">${esc(D.phone.draw)}</button><p class="hint">${esc(D.phone.hint)}</p>`) + `<p class="legal"><a href="../../impressum.html">Impressum</a> · <a href="../../datenschutz.html">Datenschutz</a></p>`;
  document.getElementById("b").addEventListener("click", draw); }
render();
</script></body></html>"""
# each task type has its own mechanic (template); the lesson chat names the type in its handoff, and each new type is built and reviewed with Olya on its own
TYPES = {'dice-council': 'council_template.html', 'say-it-another-way': 'cards_template.html', 'dice-situations': 'situations_template.html',
         'situation-cards': 'situation_cards_template.html',   # tools 12
         'chat-scenes': 'chat_scenes_template.html',   # tools 13
         'revision-board': 'revision_board_template.html', 'revision-field': 'revision_field_template.html'}   # tools 13, B2 revision 30.10
# the live version (tools 7, her wish 28.10): every page is also built as <page>-live.html, which asks her table for the changes
# she makes during the lesson; the plain page never contacts the table and stays exactly as it was. The table's address is the
# one the homework pages use (engine/page_template.html).
m = re.search(r'const SYNC_URL = "([^"]*)"', open(os.path.join(HERE, 'engine', 'page_template.html'), encoding='utf-8').read())
SYNC = m.group(1) if m else ''
built = []
pages = []   # for tools/index.html, her list of all lesson pages

# ---------- permanent numbers (tools 13, her decision 30.10 07:30): every card, chat, speaking task and block keeps the number it got at
# its first build, whatever is inserted, moved or corrected later; a new item gets the next free number, a removed item's number is never
# given again. Her table keys everything by these numbers (Again counts, the groups' texts, her notes, her live ✏️ / Hide / order), so
# a rebuild never moves anyone's work onto another card. The register is tools/<lesson>/<page>.ids.json (no personal data).
import difflib, unicodedata
def _plain(x):
    if isinstance(x, dict): x = ' '.join(_plain(v) for k, v in sorted(x.items()) if k not in ('id', 'support', 'instr', 'instr_next', 'hint'))
    elif isinstance(x, list): x = ' '.join(_plain(v) for v in x)
    t = re.sub(r'\*\*|\(\(|\)\)|~~|</?g>|\{\{|\}\}|##', '', str(x))
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', t)).strip().lower()
def _change(a, b):
    """where two texts differ: "…the meeting is [runing → running] over…" """
    i = 0
    while i < min(len(a), len(b)) and a[i] == b[i]: i += 1
    j = 0
    while j < min(len(a), len(b)) - i and a[-1 - j] == b[-1 - j]: j += 1
    return '"…%s[%s → %s]%s…"' % (a[max(0, i - 25):i], a[i:len(a) - j], b[i:len(b) - j], a[len(a) - j:len(a) - j + 20])
def assign_ids(reg, key, items, report, sig=_plain):
    """items in their new order → their permanent numbers; reg[key] = [{pid, sig, gone}]"""
    old = reg.setdefault(key, [])
    first = not old
    sigs = [sig(it) for it in items]
    out = [None] * len(items); taken = set()
    if first:
        out = list(range(len(items)))
    else:
        for i, it in enumerate(items):           # 1) an id the lesson chat kept in the data
            if isinstance(it, dict) and isinstance(it.get('id'), int) and any(e['pid'] == it['id'] for e in old) and it['id'] not in taken:
                out[i] = it['id']; taken.add(it['id'])
        for i in range(len(items)):              # 2) the same text
            if out[i] is None:
                e = next((e for e in old if e['sig'] == sigs[i] and e['pid'] not in taken), None)
                if e: out[i] = e['pid']; taken.add(e['pid'])
        pairs = []                               # 3) a corrected text (very similar): the same item, shown in the report — best pairs first
        for i in range(len(items)):
            if out[i] is not None: continue
            for e in old:
                if e['pid'] in taken: continue
                r = difflib.SequenceMatcher(None, e['sig'], sigs[i]).ratio()
                if r >= 0.75: pairs.append((r, i, e))
        for r, i, e in sorted(pairs, key=lambda x: -x[0]):
            if out[i] is None and e['pid'] not in taken:
                out[i] = e['pid']; taken.add(e['pid']); report.append('  %s #%d corrected: %s' % (key, e['pid'], _change(e['sig'], sigs[i])))
        nxt = max([e['pid'] for e in old] + [-1]) + 1
        for i in range(len(items)):              # 4) new
            if out[i] is None:
                out[i] = nxt; nxt += 1; report.append('  %s #%d new: "%s"' % (key, out[i], sigs[i][:60]))
    by = {e['pid']: e for e in old}
    for i, pid in enumerate(out):
        by[pid] = {'pid': pid, 'sig': sigs[i], 'gone': False}
    for e in old:
        if e['pid'] not in out and not e.get('gone'):
            by[e['pid']] = dict(e, gone=True); report.append('  %s #%d removed (its work stays in her table): "%s"' % (key, e['pid'], e['sig'][:60]))
    reg[key] = sorted(by.values(), key=lambda e: e['pid'])
    return out
def page_ids(lesson, name, d, save=True):
    """D._pids for the lists that carry identity, per type"""
    path = os.path.join(T, lesson, name + '.ids.json')
    reg = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    before = json.dumps(reg, ensure_ascii=False, sort_keys=True)
    report, pids = [], {}
    t = d['type']
    if t in ('say-it-another-way', 'situation-cards'):
        pids['cards'] = assign_ids(reg, 'cards', d.get('cards', []), report)
    if t == 'chat-scenes':
        pids['scenes'] = assign_ids(reg, 'scenes', d.get('scenes', []), report, sig=lambda sc: _plain([sc.get('contact', ''), sc.get('context', []), sc.get('msgs', [])]))
    if t == 'dice-council':
        for li, l in enumerate(d.get('lists', [])):
            pids['lists.%d.items' % li] = assign_ids(reg, 'lists.%d.items' % li, l.get('items', []), report, sig=lambda it: _plain(it.get('t', '')))
        if d.get('followUp'): pids['followUp'] = assign_ids(reg, 'followUp', d['followUp'], report)
    if t in ('say-it-another-way', 'situation-cards', 'chat-scenes', 'dice-council', 'dice-situations') and d.get('speaking'):
        pids['speaking'] = assign_ids(reg, 'speaking', d['speaking'], report)
    if t == 'revision-field':
        blocks = [b for st in d['stages'] for b in st['blocks']]
        pids['blocks'] = assign_ids(reg, 'blocks', blocks, report, sig=lambda b: _plain([b.get('kind', ''), b.get('instr', ''), b.get('page', ''), b.get('img', '')]))
        pids['cards'] = assign_ids(reg, 'cards', [c for b in blocks for c in (b['cards'] if b.get('kind') == 'cards' else b.get('tasks', []) if b.get('kind') == 'game' else [])], report)   # tools 16: a game's squares count as cards
        pids['write'] = assign_ids(reg, 'write', [it for b in blocks if b.get('kind') == 'write' for it in b['items']], report)
        for b, bp in zip(blocks, pids['blocks']):
            if b.get('kind') == 'questions': pids['questions.%d' % bp] = assign_ids(reg, 'questions.%d' % bp, b['items'], report)
    if not save: return pids
    if json.dumps(reg, ensure_ascii=False, sort_keys=True) != before:
        json.dump(reg, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    if report: print('%s/%s — permanent numbers:\n%s' % (lesson, name, '\n'.join(report)))
    # a template that doesn't read the numbers yet must not get a page whose items moved (council, dice situations: parked)
    if t in ('dice-council', 'dice-situations') and any(v != list(range(len(v))) for v in pids.values()):
        sys.exit('%s/%s: items were inserted, moved or removed, and the %s template keeps work by position — an engine request first.' % (lesson, name, t))
    return pids
for path in sorted(p for p in glob.glob(os.path.join(T, '*', '*.json')) if not p.endswith('.ids.json')):   # .ids.json = the permanent numbers
    lesson, name = os.path.basename(os.path.dirname(path)), os.path.splitext(os.path.basename(path))[0]
    d = json.load(open(path, encoding='utf-8'))
    if d.get('type') not in TYPES:
        sys.exit('%s: unknown task type %r. Types so far: %s. A new type is an engine request (homework-html-page, "Who changes what").' % (path, d.get('type'), ', '.join(TYPES)))
    html = open(os.path.join(T, TYPES[d['type']]), encoding='utf-8').read()
    d['_pids'] = page_ids(lesson, name, d)
    out_dir = os.path.join(site, 'tools', lesson); os.makedirs(out_dir, exist_ok=True)
    if d['type'] == 'revision-field':
        # its cell on the lesson's board (for "Rooms opened … closed" with her ✓ Done / ▶ Now), and the chat pages shown inside it (her 📥 Groups)
        for bp in sorted(p for p in glob.glob(os.path.join(T, lesson, '*.json')) if not p.endswith('.ids.json')):
            bd = json.load(open(bp, encoding='utf-8'))
            if bd.get('type') == 'revision-board' and d.get('board') and d['board'].get('col') in bd['cols']:
                d['boardPage'] = os.path.splitext(os.path.basename(bp))[0]; d['cell'] = 'c%dv%d' % (bd['cols'].index(d['board']['col']), d['board']['value'])
            elif bd.get('type') == 'revision-board' and d.get('board', {}).get('button'):   # f-demo (handoff 0920): a button on top of the board, not a cell
                d['boardPage'] = os.path.splitext(os.path.basename(bp))[0]
        d['embeds'] = {}
        for st in d['stages']:
            for b in st['blocks']:
                if b.get('kind') == 'tool':
                    ed = json.load(open(os.path.join(T, lesson, b['page'] + '.json'), encoding='utf-8'))
                    if ed.get('type') == 'chat-scenes':   # her 📥 Groups names its chats; their texts are kept by the chats' permanent numbers
                        ep = page_ids(lesson, b['page'], ed, save=False).get('scenes', [])
                        d['embeds'][b['page']] = {'title': ed['title'], 'chats': {str(pid): x.get('contact', '') for pid, x in zip(ep, ed['scenes'])}}
                if b.get('kind') == 'picture' and b.get('img'):
                    shutil.copyfile(os.path.join(T, lesson, b['img']), os.path.join(out_dir, b['img']))
                if b.get('kind') == 'game' and b.get('piece') == 'secret' and b.get('phone'):   # tools 17: the phone card
                    b['_cardUrl'] = 'https://olyaelt.github.io/tools/%s/%s-card.html' % (lesson, name)
                    b['_qr'] = qr_svg(b['_cardUrl'])
                    open(os.path.join(out_dir, name + '-card.html'), 'w', encoding='utf-8').write(
                        CARD_PAGE.replace('__T__', b['phone']['title']).replace('__D__', js({'page': lesson + '/' + name, 'phone': b['phone'], 'cards': [c['front'] for c in b['cards']]})))
                    built.append('tools/%s/%s-card.html' % (lesson, name))
                if b.get('kind') == 'scenes':   # Maple Road scene by scene (handoff 30.10 15:15): the street and each close-up
                    for im in [b.get('street')] + [x.get('img') for x in b.get('scenes', [])]:
                        if im: shutil.copyfile(os.path.join(T, lesson, im), os.path.join(out_dir, im))
    if d['type'] == 'revision-board':
        # the lesson's pages with a button on the board (f-demo, "🎓 How the game works", handoff 0920)
        d['buttons'] = []
        for fp in sorted(p for p in glob.glob(os.path.join(T, lesson, '*.json')) if not p.endswith('.ids.json')):
            fd = json.load(open(fp, encoding='utf-8'))
            if fd.get('type') == 'revision-field' and fd.get('board', {}).get('button'):
                d['buttons'].append({'label': fd['board']['button'], 'page': os.path.splitext(os.path.basename(fp))[0]})
    review = None
    if d.get('review'):
        src = json.load(open(os.path.join(T, lesson, d['review']['from'] + '.json'), encoding='utf-8'))
        review = {'page': lesson + '/' + d['review']['from'], 'part': src.get('part', 'last time'), 'n': d['review'].get('n', 4), 'cards': src['cards']}
    for k, v in [('__BASE_CSS__', base_css), ('__BASE_JS__', base_js), ('__LW_CSS__', lw_css), ('__LW_JS__', lw_js), ('__TITLE__', d['title'] + (' · ' + d['part'] if d.get('part') else '')),
                 ('__DATA__', js(d)), ('__REVIEW__', js(review)), ('__STICKER__', sticker), ('__TOOLS_VERSION__', VERSION),
                 ('__PAGE_ID__', lesson + '/' + name)]:
        html = html.replace(k, v)
    pages.append({'lesson': lesson, 'name': name, 'title': d['title'], 'part': d.get('part', ''), 'type': d['type']})
    for suffix, live in (('', False), ('-live', True)):
        page = html.replace('__LIVE__', 'true' if live else 'false').replace('__SYNC_URL__', SYNC if live else '')
        left = [k for k in ('__BASE_CSS__', '__BASE_JS__', '__LW_CSS__', '__LW_JS__', '__DATA__', '__REVIEW__', '__STICKER__', '__PAGE_ID__', '__LIVE__', '__SYNC_URL__') if k in page]
        assert not left, 'placeholder left in %s: %s' % (path, left)
        if live and not SYNC: print('WARNING: no SYNC_URL found, %s-live works like the plain page' % name)
        open(os.path.join(out_dir, name + suffix + '.html'), 'w', encoding='utf-8').write(page)
        built.append('tools/%s/%s%s.html' % (lesson, name, suffix))
# shared pictures of the lesson pages (tools/assets → <site>/tools/): the blue cloud of her stage slides (her 13:29)
for f in sorted(glob.glob(os.path.join(T, 'assets', '*'))):
    shutil.copyfile(f, os.path.join(site, 'tools', os.path.basename(f)))
# tools 9 (her wish 28.10): tools/index.html, a teacher's page with every lesson page, grouped by group and lesson, the live link
# first (with Copy, for the Zoom chat) and the plain one as the fallback. Shown when her code is on this device (as on the live
# pages: a lock on the door, the list is in the source); noindex, linked from nowhere.
GROUPS = {'b2': 'B2 · Wed Fri 18.30', 'c1': 'C1 · Wed Fri 20.15'}
KIND = {'dice-council': '🎲 dice council', 'say-it-another-way': '🃏 say it another way', 'dice-situations': '🎲 dice situations', 'situation-cards': '🃏 situation cards', 'chat-scenes': '💬 chat scenes',
        'revision-board': '🟦 Jeopardy board', 'revision-field': '🟨 revision field'}
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
