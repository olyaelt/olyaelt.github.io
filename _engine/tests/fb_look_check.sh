#!/bin/sh
# Replaced by check_site.py (since engine 24 the engine is one file: engine/page_template.html). Run from _engine:
#   sh tests/fb_look_check.sh ..
python3 "$(dirname "$0")/../check_site.py" "${1:-..}"
