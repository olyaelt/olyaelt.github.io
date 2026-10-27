"""Build the list of all homework for each group: python3 build_index.py [SITE_DIR]
   Reads every YYYY-MM-DD.html in SITE_DIR/b2 and SITE_DIR/c1, writes SITE_DIR/<group>/index.html (newest first)."""
import glob, json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
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
for group in ('b2', 'c1'):
    folder = os.path.join(site, group)
    pages = sorted([p for p in glob.glob(os.path.join(folder, '*.html')) if re.match(r'\d{4}-\d{2}-\d{2}\.html$', os.path.basename(p))], reverse=True)
    if not pages: continue
    items, syncs = zip(*[meta(p) for p in pages])
    sync = next((s for s in syncs if s), '')
    if len(set(s for s in syncs if s)) > 1: print('WARNING: pages in', group, 'have different SYNC_URL values')
    html = TPL.replace('__HW_JSON__', json.dumps(list(items), ensure_ascii=False).replace('</', '<\\/')).replace('__SYNC_URL__', sync)
    open(os.path.join(folder, 'index.html'), 'w', encoding='utf-8').write(html)
    print(group, 'index:', len(items), 'homework, newest', items[0]['date'], '| sync', 'on' if sync else 'off')
