#!/bin/bash
# render_seq.sh clip frames(comma) view out.png [extra args]
clip=$1; frames=$2; view=$3; out=$4; shift 4
mkdir -p /tmp/rs; rm -f /tmp/rs/*.png
for f in ${frames//,/ }; do
  blender -b $(dirname "$0")/player.blend --python $(dirname "$0")/preview.py -- /tmp/rs/f_$(printf %04d $f).png view=$view frame=$f samples=10 res=360 action=$clip "$@" 2>&1 | grep -E "Error|Traceback" &
  while [ $(jobs -r | wc -l) -ge 4 ]; do sleep .2; done
done; wait
montage /tmp/rs/f_*.png -tile 8x -geometry +1+1 $out
