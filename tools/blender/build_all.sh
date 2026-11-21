#!/bin/bash
# Full pipeline: character -> Blender scene -> baked technique actions -> web export.
set -e
cd "$(dirname "$0")"
OUT=${1:-../../js/player-data.js}
blender -b --python blender_build.py -- player.blend 2>&1 | grep -E "saved|Error|Traceback" 
(cd anim && blender -b ../player.blend --python blender_anim.py 2>&1 | grep -E "baked|Error|Traceback" | tr '\n' ' '); echo
blender -b player.blend --python export_web.py -- "$OUT" 2>&1 | grep -E "wrote|Error|Traceback"
