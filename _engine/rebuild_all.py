"""Rebuild every homework page and the lists after a change to the engine (engine/page_template.html):
   python3 rebuild_all.py            -> the site folder is the parent of _engine
   python3 rebuild_all.py SITE_DIR
Then checks that every page carries the current engine version (check_site.py)."""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
site = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(HERE)
lessons = sorted(d for d in os.listdir(os.path.join(HERE, 'lessons')) if os.path.isfile(os.path.join(HERE, 'lessons', d, 'content.js')))
for d in lessons:
    r = subprocess.run([sys.executable, os.path.join(HERE, 'build.py'), os.path.join(HERE, 'lessons', d), site], capture_output=True, text=True)
    if r.returncode: sys.exit('FAILED %s\n%s' % (d, r.stderr or r.stdout))
print('built', len(lessons), 'pages')
subprocess.run([sys.executable, os.path.join(HERE, 'build_index.py'), site], check=True, capture_output=True)
print('lists rebuilt')
sys.exit(subprocess.run([sys.executable, os.path.join(HERE, 'check_site.py'), site]).returncode)
