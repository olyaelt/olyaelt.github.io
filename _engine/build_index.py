"""Build the list of all homework for each group: python3 build_index.py [SITE_DIR]
   Reads every YYYY-MM-DD.html in SITE_DIR/b2 and SITE_DIR/c1 (unlisted ones flagged: only her teacher view shows them), writes SITE_DIR/<group>/index.html (newest first)."""
import glob, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
NAMES = {'b2': 'Wed Fri 18.30', 'c1': 'Wed Fri 20.15'}   # what students and Olya see; folders and keys stay b2 / c1
TPL = open(os.path.join(HERE, 'index_template.html'), encoding='utf-8').read()
def meta(path):
    t = open(path, encoding='utf-8').read()
    key = re.search(r'const PAGE_KEY = "([^"]+)"', t).group(1)
    date = re.search(r'const LESSON = \{ date:"([^"]+)"', t).group(1)
    tb = t[t.index('const TOPICS = ['):]; tb = tb[:tb.index('];')]
    topics = [{'title': m.group(1), 'sub': m.group(2)} for m in re.finditer(r'title:"([^"]+)", sub:"([^"]+)"', tb)]
    kb = t[t.index('const TASKS = ['):]; kb = kb[:kb.index('\n];')]
    tasks = re.findall(r'^\s*\{id:"([\w-]+)"', kb, re.M)
    sync = re.search(r'const SYNC_URL = "([^"]*)"', t).group(1)
    return {'file': os.path.basename(path), 'key': key, 'date': date, 'topics': topics, 'tasks': tasks}, sync
ALL = {}
for group in ('b2', 'c1'):
    folder = os.path.join(site, group)
    pages = sorted([p for p in glob.glob(os.path.join(folder, '*.html')) if re.match(r'\d{4}-\d{2}-\d{2}\.html$', os.path.basename(p))], reverse=True)
    hidden = [p for p in pages if '<meta name="hw-unlisted"' in open(p, encoding='utf-8').read(3000)]   # unlisted: students don't see it; Olya's teacher view does (🔒)
    if hidden: print(group, 'unlisted (only in her teacher view):', ', '.join(os.path.basename(p) for p in hidden))
    if not pages: continue
    items, syncs = zip(*[meta(p) for p in pages])
    items = [dict(it, unlisted=True) if p in hidden else it for it, p in zip(items, pages)]
    sync = next((s for s in syncs if s), '')
    if len(set(s for s in syncs if s)) > 1: print('WARNING: pages in', group, 'have different SYNC_URL values')
    html = TPL.replace('__HW_JSON__', json.dumps(list(items), ensure_ascii=False).replace('</', '<\\/')).replace('__SYNC_URL__', sync).replace('__GROUP_NAME__', NAMES.get(group, group.upper()))
    open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8').write(html)
    ALL[group] = (list(items), sync)
    pub = [it for it in items if not it.get('unlisted')]
    print(group, 'index:', len(pub), 'homework' + (' + %d unlisted' % (len(items) - len(pub)) if len(items) > len(pub) else ''), ', newest', pub[0]['date'] if pub else '-', '| sync', 'on' if sync else 'off')

# the start page for both groups (Olya's teacher overview; students just pick their group)
if ALL:
    root = open(os.path.join(HERE, 'root_template.html'), encoding='utf-8').read()
    sync = next((s for _, s in ALL.values() if s), '')
    html = root.replace('__GROUPS_JSON__', json.dumps({g: v[0] for g, v in ALL.items()}, ensure_ascii=False).replace('</', '<\\/')).replace('__SYNC_URL__', sync).replace('__NAMES_JSON__', json.dumps(NAMES, ensure_ascii=False))
    open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(html)
    print('start page: index.html with', ', '.join(ALL))

# the font lives on the site itself, so no page contacts a font service
fdir = os.path.join(site, 'fonts'); os.makedirs(fdir, exist_ok=True)
for f in ('homework-sans.css', 'OFL.txt'): shutil.copyfile(os.path.join(HERE, 'fonts', f), os.path.join(fdir, f))
# Impressum and Datenschutz: written only when missing, because Olya fills in her details there herself
for f in ('impressum.html', 'datenschutz.html'):
    dst = os.path.join(site, f)
    if not os.path.exists(dst): shutil.copyfile(os.path.join(HERE, 'legal', f), dst); print('legal page written:', f)
    elif f == 'impressum.html' and 'VORNAME NACHNAME' in open(dst, encoding='utf-8').read(): print('NOTE: impressum.html still has the placeholders (name, address, e-mail)')
