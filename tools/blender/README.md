# 3D player: Blender source and pipeline

The players in the app (home hero, Skills court, player card, locker preview, team view) are a rigged, skinned character built and animated in Blender, then exported to `js/player-data.js`, which `js/athlete.js` plays in the site's own WebGL engine (`js/gl.js`).

| File | What it is |
|---|---|
| `player.blend` | **The source.** Rig (`PlayerRig`, 33 bones), body and every clothing/hair piece as skinned meshes with `lean`, `power` and `female` shape keys, and one action per technique clip. |
| `export_web.py` | Writes `player.blend` to `js/player-data.js`. |
| `build_all.sh` | Full rebuild: character → scene → baked clips → export. **Overwrites `player.blend`.** |
| `char_geo_head.py`, `char_parts.py`, `mhload.py` | Build the character from the MakeHuman base mesh: body shapes, skeleton, skin weights, and clothing, hair and gear cut from the body surface. |
| `blender_build.py` | Turns those parts into the Blender scene. |
| `anim/solver.py` | Motion solver: technique parameters → every bone (two-bone leg IK, heel–toe roll, shoulder-blade rhythm, forearm twist, finger curl). |
| `anim/choreo.py` | Samples a clip, keeps the feet reachable, smooths every channel. |
| `anim/research.py` | **The technique corrections**, with the reference values at the top of the file. Edit this to change how a technique moves. |
| `anim/research_more.py` | More clips derived from the corrected ones: `quick`, `shoot`, `tip`, `roll`, `cut` (attack variations off the spike), `dump` (off the jump set), `collapse`, `tomahawk` (off the dig) and `sidedive` (off the sprawl). Runs after `research.py`. |
| `anim/clips_base.json` | The original clip timings and foot plants (pulled from the previous `athlete.js` by `extract_clips.js`). |
| `anim/blender_anim.py` | Bakes each clip into a Blender action. |
| `anim/diag.py` | Prints knee and hip angles, trunk lean, jump height and hand height, to check a clip against the research. |
| `preview.py`, `render_seq.sh` | Cycles preview renders. |
| `fetch_assets.sh` | Downloads the CC0 MakeHuman assets (only needed for a full rebuild). |
| `../viewer.html` | Dev viewer in the site engine: `tools/viewer.html?clip=spike&view=side&anim=1` (also `lefty=1`, `look={...}`, `view=face`). |

Requires Blender 4.x, with numpy and scipy available to Blender's Python (on Ubuntu: `apt install blender python3-numpy python3-scipy`).

## Common jobs

**Tweak an animation by hand in Blender.** Open `player.blend`, pick an action on `PlayerRig` (spike, block, set, dig, serve, pipe, slide, float, jumpfloat, sprawl, ready, quick, shoot, tip, roll, cut, dump, collapse, sidedive, tomahawk) and edit the keys. Then export only (don't run `build_all.sh`, which would rebuild the scene):

```
blender -b player.blend --python export_web.py -- ../../js/player-data.js
```

**Change a technique from its parameters.** Edit `anim/research.py` (angles in degrees, times in seconds), check it with `python3 anim/diag.py spike`, then `./build_all.sh`.

**Add or change a clip without Blender.** The exported clips are the solver's local bone rotations plus the hip position, so `solver.py` and `choreo.py` can bake them in plain Python (numpy) by building the `Rig` from the bone data already in `js/player-data.js` (heads, tails and segment frames) instead of the MakeHuman assets. Re-baking an existing clip this way reproduces the exported one to within quantisation. `anim/bake_web.py` does this: `python3 tools/blender/anim/bake_web.py quick,tip` writes those clips into `js/player-data.js` and leaves everything else untouched (`--check spike` compares a re-bake with the exported clip). The clips added by `research_more.py` were made like this and are not in `player.blend` yet. **Before exporting from Blender, run `blender_anim.py` once** so the new actions exist in the .blend; otherwise `export_web.py` writes a `player-data.js` without them.

**Use real motion capture.** Retarget it onto `PlayerRig` in Blender as a new action named after the clip, set the action's custom properties (`fps`, `dur`, `contact`, `hand`, `labels`, as on the existing actions), and export. The site plays any action on the rig.

**Rebuild the character** (new clothing, different body shapes): `./fetch_assets.sh`, edit `char_parts.py` / `char_geo_head.py`, then `./build_all.sh`.

## Clothing and skin

Skin that sits under clothing is not drawn: `export_web.py` flags, for every skin vertex, which pieces cover it (well inside the piece's edges), and `athlete.js` drops a skin triangle when all three corners are covered by something the player is wearing. This stops skin poking through the jersey at the shoulders and the shorts at the waist when the body bends. The exporter also smooths every clothing edge loop (hems, cuffs, collar) so the cut lines are clean.

## Conventions

Clip space is metres with +x toward the net, +y up and +z the player's right. Clips are authored right-handed; `athlete.js` mirrors them for lefties. Ball paths, ball contact and on-screen labels stay in `athlete.js`; contact times come from the export.

Arm parameters in `research.py` are `f` flexion, `a` horizontal abduction, `t` humeral rotation (+ internal), `e` elbow flexion, `w` wrist flexion, `p` pronation (+ palm turns inward) and `c` finger curl. Overhead with the palm facing the net needs `t + p ≈ 180`.

## Sources for the motion

- Fuchs et al. 2019, *Spike jump biomechanics in male versus female elite volleyball players*, J Sports Sci 37(21): approach speed, step lengths, plant knee and hip angles, trunk incline, jump height, arm-swing speed.
- Shoulder kinematics at contact (abduction about 122°, internal rotation about 80°): JSSM 22:488; Reeser et al. 2010, *Upper limb biomechanics during the volleyball serve and spike*, Sports Health.
- Ficklin et al. 2014, JSSM 13:78, and Neves et al. 2011, JSSM 10:452: block approach time, take-off velocity, jump height, time in the air, hand penetration.
- Coleman 1997 and Tant et al. (ISBS proceedings): jump serve hand and ball speed.
- Tant et al. (ISBS proceedings) on the jump set: elbow angles at the low point, contact and release.
- Ridgway & Hamilton (ISBS proceedings): forearm pass kinematics.
- Coaching references (Human Kinetics; USA Volleyball) for float and jump-float toss height and contact.

## Licence of the base mesh

Body, skeleton and weights derive from the MakeHuman 1.x assets, released under CC0 1.0 (no attribution required).
