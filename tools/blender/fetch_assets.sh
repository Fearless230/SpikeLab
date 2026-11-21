#!/bin/bash
# Download the CC0 MakeHuman assets the character builder needs (base mesh, skeleton, skin weights, body-shape targets)
# into tools/blender/mh_assets. Only needed to rebuild the character; editing animations only needs player.blend.
set -e
cd "$(dirname "$0")"; mkdir -p mh_assets/t
R=https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data
curl -sSf -o mh_assets/base.obj $R/3dobjs/base.obj
curl -sSf -o mh_assets/default.mhskel $R/rigs/default.mhskel
curl -sSf -o mh_assets/default_weights.mhw $R/rigs/default_weights.mhw
T=$R/targets
for p in macrodetails/{african,asian,caucasian}-{male,female}-young.target macrodetails/universal-{male,female}-young-{maxmuscle,averagemuscle,minmuscle}-{minweight,averageweight,maxweight}.target macrodetails/height/{male,female}-young-{maxmuscle,averagemuscle}-averageweight-{maxheight,minheight}.target macrodetails/proportions/{male,female}-young-{maxmuscle,averagemuscle}-averageweight-idealproportions.target; do
  curl -sSf -o "mh_assets/t/$(echo $p | tr / _)" "$T/$p"
done
echo "MakeHuman assets (CC0) in $(pwd)/mh_assets"
