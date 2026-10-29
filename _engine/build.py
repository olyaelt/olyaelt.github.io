"""Build one homework page.
   python3 build.py lessons/b2-2026-10-30            -> writes ../b2/2026-10-30.html (the site folder is the parent of _engine)
   python3 build.py lessons/b2-2026-10-30 SITE_DIR   -> writes SITE_DIR/b2/2026-10-30.html
The page = the shared engine (engine/page_template.html, version in engine/VERSION) + this lesson's
content.js (what goes between LESSON CONTENT: START and END) + page.json (title, group, file, assets;
"listed": false = an unlisted page, left out of the lists until set to true;
"earlier_only": [phrases] = look-back items only where the target contains one of them — what the whole group did in class).
Also writes lessons/<name>/build/preview.html for the Claude artifact preview."""
import base64, json, mimetypes, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
lesson = sys.argv[1] if os.path.isabs(sys.argv[1]) else os.path.join(HERE, sys.argv[1]) if not os.path.isdir(sys.argv[1]) else sys.argv[1]
site = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(HERE)
cfg = json.load(open(os.path.join(lesson, 'page.json'), encoding='utf-8'))
def assemble(lesson_dir):
    """the full page source of a lesson (before its assets are filled in)"""
    c = json.load(open(os.path.join(lesson_dir, 'page.json'), encoding='utf-8'))
    tpl = open(os.path.join(HERE, 'engine', 'page_template.html'), encoding='utf-8').read()
    content = open(os.path.join(lesson_dir, 'content.js'), encoding='utf-8').read()
    if not content.endswith('\n'): content += '\n'
    version = open(os.path.join(HERE, 'engine', 'VERSION'), encoding='utf-8').read().strip()
    return (tpl.replace('@@LESSON_CONTENT@@\n', content, 1).replace('<title>__TITLE__</title>', '<title>%s</title>' % c['title'], 1)
               .replace('__ENGINE_VERSION__', version, 1))
t = assemble(lesson)
for key, fname in cfg['assets'].items():
    path = os.path.join(lesson, fname)
    if os.path.splitext(fname)[1].lower() in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'):
        val = 'data:%s;base64,%s' % (mimetypes.guess_type(fname)[0], base64.b64encode(open(path, 'rb').read()).decode())
    else:
        val = open(path, encoding='utf-8').read().strip()
    t = t.replace('__%s__' % key, val)
# "From earlier lessons": a few rewrite / say-it items from this group's earlier homework, at growing intervals
if '__EARLIER__' in t:
    picked = []
    name = os.path.basename(os.path.normpath(lesson)); m = re.match(r'(\w+)-(\d{4}-\d{2}-\d{2})$', name)
    if m and cfg.get('earlier', True):
        lessons_dir = os.path.dirname(os.path.normpath(lesson))
        listed = lambda d: json.load(open(os.path.join(lessons_dir, d, 'page.json'), encoding='utf-8')).get('listed', True) is not False
        older = sorted(d for d in os.listdir(lessons_dir) if re.match(m.group(1) + r'-\d{4}-\d{2}-\d{2}$', d) and d < name and listed(d))   # unlisted = not given yet
        chosen = []
        for k in (1, 2, 4, 8):                      # the last lesson, the one before, two weeks back, a month back
            if len(older) >= k and older[-k] not in chosen: chosen.append(older[-k])
        if chosen:
            import subprocess, random
            data = json.loads(subprocess.run(['node', os.path.join(HERE, 'earlier.js')] + [os.path.join(lessons_dir, d, 'content.js') for d in chosen],
                                             capture_output=True, text=True, check=True).stdout)
            rnd = random.Random(name); want = int(cfg.get('earlier_count', 4))
            pools = [[dict(it, frm=d['date']) for it in d['items']] for d in data if d['items']]
            only = [str(x).lower().replace('\u2019', "'") for x in cfg.get('earlier_only') or []]
            if only:   # engine 41 (her rule 29.10): only what the whole group did in class — the target must contain one of these phrases
                def target(it):
                    txt = it['r'].get('a', '') if it['type'] == 'rewrite' else (it['s']['rows'][0][1] if it['s'].get('rows') else '')
                    return re.sub(r'<[^>]+>|\$\{g\("|"\)\}', '', str(txt)).lower().replace('\u2019', "'")
                pools = [[it for it in pool if any(o in target(it) for o in only)] for pool in pools]
                print('look back limited to the whitelist in page.json:', sum(len(p) for p in pools), 'items fit')
            for pool in pools: rnd.shuffle(pool); pool.sort(key=lambda it: it['type'] != 'rewrite')   # rewrite first, then say-it
            while len(picked) < want and any(pools):
                for pool in pools:
                    if pool and len(picked) < want: picked.append(pool.pop(0))
    t = t.replace('__EARLIER__', json.dumps(picked, ensure_ascii=False).replace('</', '<\\/'))
    print('from earlier lessons:', len(picked), 'items', sorted(set(i['frm'] for i in picked)))
left = sorted(set(re.findall(r'__[A-Z][A-Z0-9_]*__', t)))
if left: sys.exit('Unfilled placeholders: ' + ', '.join(left))
os.makedirs(os.path.join(lesson, 'build'), exist_ok=True)
open(os.path.join(lesson, 'build', 'preview.html'), 'w', encoding='utf-8').write(t)
head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<style>body{margin:0}img{max-width:100%}</style>\n')
if cfg.get('listed', True) is False:   # an unlisted page: built and uploadable, opens by its link, left out of the lists and the start page
    head += '<meta name="hw-unlisted" content="1">\n<meta name="robots" content="noindex">\n'
    print('unlisted: students don\'t see it in their list until Olya taps 📢 Publish on the page (her teacher view shows it with 🔒); run build_index.py too')
i = t.index('<div class="wrap" id="app"></div>')
out_dir = os.path.join(site, cfg['group']); os.makedirs(out_dir, exist_ok=True)
out = os.path.join(out_dir, cfg['file'])
open(out, 'w', encoding='utf-8').write(head + t[:i] + '</head>\n<body>\n' + t[i:] + '\n</body>\n</html>\n')
print('built', out, os.path.getsize(out), 'bytes')
