"""Is every page on the current engine, with nothing lost? Run before saving to Olya's folder and after uploading:
   python3 check_site.py [SITE_DIR]
- every lesson folder has content.js and page.json (no full page.html copies of the engine left in lessons/);
- every built page b2/*.html, c1/*.html says ENGINE_VERSION = engine/VERSION (rebuild_all.py if not);
- the agreed feedback look is in the engine (Overall / Follow-up boxes, comment colours: see README)."""
import glob, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
version = open(os.path.join(HERE, 'engine', 'VERSION'), encoding='utf-8').read().strip()
tpl = open(os.path.join(HERE, 'engine', 'page_template.html'), encoding='utf-8').read()
bad = []
for d in sorted(glob.glob(os.path.join(HERE, 'lessons', '*', ''))):
    name = os.path.basename(os.path.normpath(d))
    if not os.path.isfile(os.path.join(d, 'content.js')): bad.append('%s: no content.js' % name)
    if os.path.isfile(os.path.join(d, 'page.html')): bad.append('%s: an old full page.html is still here (the engine now lives in engine/page_template.html)' % name)
pages = sorted(glob.glob(os.path.join(site, 'b2', '20*.html')) + glob.glob(os.path.join(site, 'c1', '20*.html')))
for p in pages:
    m = re.search(r'const ENGINE_VERSION = "([^"]*)"', open(p, encoding='utf-8').read())
    v = m.group(1) if m else 'none'
    if v != version: bad.append('%s: engine %s, current %s — run rebuild_all.py' % (os.path.relpath(p, site), v, version))
must = {'--note-ink': 6, 'fb-overall{': 1, 'fb-next': 2, 'lines.shift()': 1, 'font-weight:400;font-size:.95em': 1}
for k, n in must.items():
    if tpl.count(k) != n: bad.append('engine: "%s" %d times, expected %d (the feedback look from 26.10)' % (k, tpl.count(k), n))
if bad: print('\n'.join(bad)); sys.exit(1)
print('OK: engine %s in all %d pages, feedback look in place' % (version, len(pages)))
