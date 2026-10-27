"""Lesson tools: pages students open during a lesson (not homework, not in any homework list).
   python3 build_tools.py [SITE_DIR]
Each tools/<lesson>/<page>.json (written in the lesson chat, "type" = the task type) + its template (engine chat)
-> <SITE_DIR>/tools/<lesson>/<page>.html, one self-contained file (the site font is shared from /fonts/).
Types (details in ../README.md, "Lesson tools"): "dice-council" (Reasons -> Decide -> Extra speaking; ?dice=3|4|6),
"say-it-another-way" (Cards -> Speaking; "review": {"from": "<page>", "n": 4} adds cards from an earlier part,
switched on in Settings or with ?review=1). A new type is an engine request."""
import base64, glob, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
T = os.path.join(HERE, 'tools')
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
VERSION = open(os.path.join(T, 'VERSION')).read().strip()
base_css = open(os.path.join(T, 'tool_base.css'), encoding='utf-8').read()
base_js = open(os.path.join(T, 'tool_base.js'), encoding='utf-8').read()
sticker = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(T, 'sticker.png'), 'rb').read()).decode()
js = lambda o: json.dumps(o, ensure_ascii=False).replace('</', '<\\/')
# each task type has its own mechanic (template); the lesson chat names the type in its handoff, and each new type is built and reviewed with Olya on its own
TYPES = {'dice-council': 'council_template.html', 'say-it-another-way': 'cards_template.html'}
built = []
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
    for k, v in [('__BASE_CSS__', base_css), ('__BASE_JS__', base_js), ('__TITLE__', '%s · %s' % (d['title'], d['part'])),
                 ('__DATA__', js(d)), ('__REVIEW__', js(review)), ('__STICKER__', sticker), ('__TOOLS_VERSION__', VERSION),
                 ('__PAGE_ID__', lesson + '/' + name)]:
        html = html.replace(k, v)
    left = [k for k in ('__BASE_CSS__', '__BASE_JS__', '__DATA__', '__REVIEW__', '__STICKER__', '__PAGE_ID__') if k in html]
    assert not left, 'placeholder left in %s: %s' % (path, left)
    out_dir = os.path.join(site, 'tools', lesson); os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, name + '.html')
    open(out, 'w', encoding='utf-8').write(html)
    built.append('tools/%s/%s.html' % (lesson, name))
print('tools %s: built %d pages' % (VERSION, len(built)))
for b in built: print('  https://olyaelt.github.io/' + b)
