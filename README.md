# Volleyball Training Journey

A personal volleyball training app: onboarding, a 3D body and technique court, film analysis, programs, progress tracking, a drill library (including off-court wall drills), exercise motion demos, a Squad for friends and teams, a daily readiness check-in, player levels and daily challenges, a courtside Toolkit (interval timer, match stat tracker, rotation viewer, plays library, calculators, rules and glossary, arm load counter, serve target practice, reaction drills and a mindset kit), team readiness and season stats for coaches, and film clips kept offline on the device.

It is a static site (plain HTML, CSS and JavaScript, no build step). Accounts and cloud saving use [Supabase](https://supabase.com).

## Files

| Path | What it is |
|---|---|
| `index.html` | The app |
| `js/` | App code and training data |
| `js/athlete.js`, `js/player-data.js` | The 3D players: a rigged character with technique animations, built and animated in Blender |
| `tools/blender/` | Blender source (`player.blend`) and the pipeline that exports `js/player-data.js`. See its README |
| `tools/viewer.html` | Dev viewer for the 3D players and clips |
| `js/config.js` | Supabase project URL and publishable key (safe to be public) |
| `js/backend.js` | Login screen and Supabase saving |
| `supabase/schema.sql` | Database tables and security rules: run once in Supabase > SQL Editor |
| `js/app-features.js`, `css/app.css` | Today screen, guided session mode, the calendar model (`VB.cal`: events, multi-day tournaments, training days, what each day holds, calendar-file export) and tapering, soreness check, jump load, milestones, coach tools, Film comparison, privacy controls, reminders, dark theme |
| `js/home.js`, `css/home-toolkit.css` | Home screen redesign: broadcast-style HUD (readiness ring, week, streak, vertical trend, level and XP), session ticket with time per block, daily challenge, quick actions, 12-week training map, tip of the day; readiness check-in that sets the day's session; XP and levels; Progress additions (26-week training map, readiness trend, XP breakdown) |
| `js/toolkit.js` | The Toolkit view (other files add tabs with `VB.tools.add`) (`#tools`, with deep links such as `#tools/match` or `#tools/plays`): interval timer (presets, EMOM, stopwatch, beeps, floating pill while running), match stat tracker (hitting %, pass rating, season totals, CSV, share a match with a Squad team), rotation viewer (5-1, 6-2, 4-2; serve-receive formations checked against the overlap rule, animated switch to base, rotate and walk-through, libero swaps through the replacement zone, FIVB 2025-28 or in-order serving rules, overlap pairs, and a 'spot the overlap' quiz), plays library (animated offence, serve-receive, defence, coverage and transition plays, with set calls), calculators (touch over the net, jump from air time, hitting %, pass rating, session load, units), rules (by category, what changed in 2025, referee signals, myths, a scenario quiz, indoor/beach/sitting comparison, glossary) with search |
| `js/toolkit-plus.js` | Four more Toolkit tabs. **Arm load** (`#tools/arm`): count attack swings and serves, this week against your usual 4-week average with a warning on big jumps, 8-week chart, daily shoulder pain check that points to arm care or a physio. **Serve targets** (`#tools/serve`): call a zone (or get a random one), serve, tap where it landed or the error (net, long, wide); on-target and in-play %, accuracy per zone, heat map, history by serve type. **Reaction** (`#tools/react`): 5-try reaction-time test and a "Read and go" footwork drill with random direction, zone or colour cues. **Mindset** (`#tools/mind`): editable pre-serve routine with a rehearse mode, a guided 10-second reset after errors, and a post-match reflection journal |
| `js/crows.js`, `css/crows.css` | The secret Crow's Nest: secret code box on Profile, unlock moment, welcome-back boot screen, Karasuno skin, kits, balls, effects, titles, backgrounds, mini-games, quiz, daily camp, badges and shop (progress in `VB.state.crow`) |
| `js/team-plus.js` | Opt-in "Share readiness with my coaches" (readiness score, load against usual, swings this week, sore spots shown in Coach tools) and team season stats built from matches players share with a team |
| `js/film.js`, `js/film-pose.js` | Film analysis. `film-pose.js` runs the MediaPipe pose model on every frame of the trimmed clip (video mode, with a zoomed second pass for frames where nobody was found), keeps left and right consistent, removes outliers, fills short gaps and smooths each joint with a zero-lag Butterworth filter. `film.js` finds the phases, times take-off and landing against the floor level just before and after the jump, scales by segment lengths and scores the form. Also: slow-motion setting, approach and hand speed, clip quality checks, joint-angle graph, compare with an earlier clip, measure tool, keyboard shortcuts, and export of a half-speed video with the feedback burned in. Placing dots by hand is still there as a fallback |
| `js/vendor/mediapipe/`, `models/` | MediaPipe Tasks Vision 0.10.35 (WebAssembly) and the pose_landmarker_full model, self-hosted (Apache 2.0). Loaded only when someone analyses a clip, then kept in the offline cache |
| `fonts/`, `css/fonts.css` | Barlow and Barlow Condensed, self-hosted (SIL Open Font License), so the site makes no request to Google |
| `js/clips.js` | Film clips kept on the device in IndexedDB (Keep clip, Watch, Delete clip in Film history). Never uploaded |
| `js/vendor/` | Pinned copies of supabase-js 2.119.2, Chart.js 4.4.1 and jsQR 1.4.0, so no outside code can change under you (licences alongside) |
| `js/data-extras.js` | 18 more drills (mostly solo and partner), 24 daily challenges, readiness questions, level names, tips, 14 rules summaries and a 39-term glossary |
| `js/data-tech-more.js` | More techniques with their own 3D clips: quick attack, shoot and go, roll shot, cut shot, tooling the block, setter dump, collapse dig, side dive and roll, overhead dig (the tip and the overhead pass also got their own clips) |
| `js/data-plays.js` | The plays library: offence, serve receive, serving, defence, coverage and transition. Each play has options to choose between (which set, where the attack or serve goes), timed captions and a job for every player; plus the set calls |
| `js/calendar.js` | The calendar on Progress: month view, week timetable and list, a day panel to add or edit games, tournaments (with an end date), team practices and other events (time, place, note), and per-event or all-games calendar files. Shows sessions, match results, jump tests, Squad events, program phases and the jump-goal date, and what the plan does each day (training, light, game, recovery, rest). Also the dated timeline on the active program |
| `js/data-rules.js` | Rules by category (FIVB 2025-2028, with USA Volleyball, college and school differences), what changed, referee signals, myths, rule quiz, indoor/beach/sitting table and extra glossary terms. Replaces the short rule list in `data-extras.js` |
| `js/demo3d.js` | Puts the 3D player into exercise demos (retargets the 2D motion data onto the rig) |
| `js/i18n.js`, `js/i18n-fr.js`, `js/i18n-fr-content.js` | Translation. French covers the interface, plus the names of every drill and exercise and each drill's set-up. Drill steps, coaching points and exercise cues are still English; add them by id in `i18n-fr-content.js` |
| `sw.js`, `manifest.webmanifest`, `img/icon-*` | Offline support and install-to-home-screen |
| `img/og.png` | Preview image shown when the link is shared |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `tools/release.mjs` | Run before publishing: bumps the offline-cache version, rebuilds the cached file list, updates the security policy hash, and (with `--site`) the share-preview address |
| `tests/` | `run-rls.sh` tests the database security rules on a local Postgres; `smoke.mjs` opens every screen and Toolkit tab in a headless browser; `film-bench/` measures the Film analysis against rendered clips with known answers (results in its README) |
| `.github/workflows/checks.yml` | Runs the syntax check, release check, security rule tests and smoke test on every push |

Some files were renamed by what they do: `v3.js` → `app-features.js`, `v4.js` → `week-gameday.js`, `v5-home.js` → `home.js`, `v5-tools.js` → `toolkit.js`, `v6-calendar.js` → `calendar.js`, `data-v5.js` → `data-extras.js`, `v3.css` → `app.css`, `v5.css` → `home-toolkit.css`. Internal names such as `VB.v3` and `data-v5ready` were kept.

## Publish with GitHub Pages

1. Push this folder to a public GitHub repository.
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.
4. In Supabase: **Authentication → URL Configuration**. Set **Site URL** to that address (with the trailing slash) and add it to **Redirect URLs**.

Every push to `main` republishes the site automatically.

## Publish with Vercel instead

Import the repository at vercel.com (**Add New → Project**), keep the framework preset as **Other**, no build command, and deploy. Then put the Vercel address in Supabase's URL Configuration the same way.

## Every time you publish

1. Run **`node tools/release.mjs --site https://<your-username>.github.io/<repository-name>/`** (Node 18 or newer, nothing to install). It bumps `VERSION` in `sw.js` so phones pick up the new files, lists every file in `CORE` for offline use, updates the Content-Security-Policy hash in `index.html`, and makes the share-preview image address absolute so link previews show it. `node tools/release.mjs --check` changes nothing and fails if something is out of date.
2. If `supabase/schema.sql` changed, **run it again** in Supabase > SQL Editor. It is safe to re-run.

### This release (v8.4): two secret editions and a deeper Crow's Nest

- **Secret codes now belong to people.** `PEOPLE` at the top of `js/crows.js` holds each person: name, code (hashed), edition, note, colours, daily lines, boot-screen lines, starting kit/ball/effect/title/background and focus (defence or attack). Two are set up: Augustin Dias (Guardian edition, black and orange, defence focus) and Theodore Dias (Fearless edition, black and gold, attack focus). Each keeps his own feathers, badges, bests and season. Entering the other code on the same device switches to that person; progress is kept per person.
- **Deeper Crow's Nest:** a third mini-game, **Jump Serve** (lock power inside the band, then aim at the lit zone for an ace); a **Season** tab with a 10-match season road against invented rival teams, a **skill chart** (Receive, Attack, Serve, Volleyball IQ, Grit, Energy) built from the scores, and a **weekly goal**; 15 badges (up from 9); a 9-item shop; 26 quiz questions (8 per round, half from the person's focus); 21 camp drills (two for the person's position plus one for everyone each day) and a 14-day camp strip; a third secret background, **Night sky court**.
- **3D player:** seven jersey designs for everyone (plain, chest band, sash, lightning, chevrons, pinstripes, fade), a shorts colour row, a **Fearless white** kit and a secret **Ace** ball.

### This release (v8.3): more to customise, and a secret

- **Secret code on the Profile page.** Under the player card there is a "Secret code" box. The right code (stored only as a hash in `js/crows.js`, never in plain text) unlocks Karasuno mode for the player:
  - a black and orange skin for the whole site (with an "Original colours" switch), crow orange on the home arena, the player card and the profile header;
  - two kits for the 3D player, **Crow black** and **Guardian orange**, shown everywhere the player appears;
  - three volleyballs (Crow, Sunset spike, Rolling thunder), two ball effects (Crow feathers, Rolling thunder), two profile backgrounds (Crow gym, Orange court) and eight titles shown on the profile and the player card;
  - **the Crow's Nest** (`#nest`, with its own nav link): a personal welcome-back boot screen every time it opens (greeting by name and time of day, a spoken hello where the browser supports it, live stats), a "Rolling Thunder!" button, a note from the family, and tabs for **Dig Defence** (tap the landing ring before a spike lands; keys 1 to 6 dig by court zone), **Freak Quick** (time the swing to the set, with an eyes-closed mode), **Volleyball IQ** (8 random questions from 14 on libero rules and the game), a **daily training camp** of three home drills, **badges** that unlock the rewards, a **feather shop** and a **Style** tab with a one-tap "full Karasuno look".
  - To change the name, the note or the code, edit the top of `js/crows.js` (`OWNER`, `NOTE`, and `CODE`, made with `VB.crow.hash("newcode")` in the browser console).
- **More customising for everyone.** Orange headband, knee pads, arm sleeve and shoes; gold shoes; a sock colour row; a Retro ball (30 sessions) and a Confetti effect (10 hours of training); a Karasuno orange card colour once unlocked.
- **Safer shared cards.** Looks from other players' cards are now checked (colours must be hex, words must be known values) before they reach the 3D player, and the card title is length-limited.

### Fix (v8.2): staying signed in

- Squad no longer shows "Log in to use Squad" to someone who is signed in. Before, one failed refresh (no signal, or a phone or laptop waking up with an expired sign-in token) switched Squad to the logged-out screen until the page was reloaded, and the Log in button then appeared to do nothing. Now an expired token is renewed and the request retried, refreshes pause in hidden tabs and catch up when you come back, and a failed refresh shows a short "reconnecting" note instead.
- If the session really ends without the player logging out, the app asks them to log in again and keeps everything on the device. Before, it wiped all on-device data. Logging out on purpose still clears the device.
- Logging in again reconnects Squad and cloud saving straight away.
- `tests/auth/auth_test.py` runs these scenarios against a scripted stand-in for Supabase.

### This release (v8)

- **Film analysis rebuilt for accuracy.** One tap analyses the clip; the pose model now tracks every frame instead of seeding a few dots and following pixels. On the benchmark clips, joint position error fell from 17–55% of body height to about 2–3%, knee angle error from 24–60° to 3–4°, and jump height went from badly wrong (a 38 cm jump read as 111 cm) to within about 1 cm. See `tests/film-bench/README.md`.
- New in Film: slow-motion setting, approach and hand speed, clip quality checks, joint-angle graph, compare with an earlier clip, tap-to-measure angles and distances, download a video with the feedback, keyboard shortcuts (space, arrows, `[` `]`).
- Fonts, the pose model and MediaPipe are self-hosted. The page now loads nothing from other sites except Supabase, and the Content-Security-Policy says so. The service worker keeps the big files (about 20 MB, downloaded only when someone first analyses a clip) in a cache that survives releases, and no longer deletes the reminder settings on update.
- Polish: cards no longer spill past the screen edge on small phones, the Toolkit tabs wrap into a grid on phones, colour contrast fixes for small accent-coloured text, accessibility fixes from an axe-core audit, French for the new screens and correct French counts on the start and Skills headers.

### Previous release (v7)

- **Run `supabase/schema.sql` again.** It closes three holes: anyone could read a private card (including an under-18's) by listing that player on a team of their own; anyone signed in could list every name in `profiles` with the under-18 flag; and anyone could write messages into chat threads they were not part of. Team membership now needs both sides: the owner lists the player and the player taps **Join team**. **Players already on teams will see an invitation in Squad › Teams and need to tap Join once**; until they do, teammates (other than the owner) cannot see their card.
- Squad is now open from age 12 (it was 13). Sign-up asks for a parent or guardian's agreement for players aged 12 and 13.
- Other players' cards, photos and messages are cleaned before they reach the page, so a doctored card cannot inject markup or scripts.
- Supabase, Chart.js and jsQR load from `js/vendor/` instead of a CDN, and a Content-Security-Policy limits where code can load from. If you move Supabase to a custom domain, add it to `connect-src` in the policy at the top of `index.html`.

## Tests

```
tests/run-rls.sh                     # database security rules (needs psql and a Postgres server; PGHOST etc. are respected)
npm i --no-save playwright@1 && npx playwright install chromium
node tests/smoke.mjs                 # every screen and Toolkit tab, fails on any page error; --no-gl is faster
```

The same checks run on GitHub for every push (`.github/workflows/checks.yml`).

## Large files

`tools/blender/player.blend` is 19 MB. `.gitattributes` routes `.blend` files through [Git LFS](https://git-lfs.com) so the repository stays quick to clone. Once on your computer: `git lfs install`, then `git lfs migrate import --include="*.blend" --everything` and force-push. The site itself never loads it.

## Load time

The pose model and MediaPipe (about 20 MB) are not part of the first load; they download the first time someone analyses a clip. The home screen shows the 3D player straight away, so `js/player-data.js` (2.7 MB, about 1.3 MB compressed) is needed on first load; after that it comes from the offline cache. With 3D turned off the app is interactive in under a second on a desktop. `js/body-mesh.js` (3 MB) only loads when the 3D body view opens.

## Adding a language

Copy `js/i18n-fr.js` to `js/i18n-xx.js`, translate the values, load it in `index.html` before `js/i18n.js`, and add a `data-lang-set="xx"` button in Profile > Appearance and language. Phrases containing numbers are handled by the patterns in `js/i18n.js`.

## Security notes

- Only the **publishable/anon** key belongs in `js/config.js`. Never commit the `service_role` or secret key.
- Children under 12 can use the app on their device but cannot create an account or use Squad. From 12, players can create an account and use Squad; players aged 12 and 13 confirm that a parent or guardian agreed (stored as `guardian_ok` in the account's metadata). Players under 18 are only visible to friends and teammates who joined the same team, and can't be found by name search.
- **Check the age rules where you operate; this is not legal advice.** For example, in the United States COPPA requires verifiable parental consent before collecting personal information from children under 13, and in Quebec, Law 25 requires a parent's consent for under-14s. A checkbox may not be enough for those rules; to raise the minimum age, change `VB.SQUAD_MIN_AGE` in `js/core.js` and the matching wording in `js/backend.js` and `js/squad.js`.
- Readiness sharing with coaches is off until the player turns it on, and team match stats are only shared for matches the player assigns to a team.
- The row level security rules in `supabase/schema.sql` make sure each person can only change their own data, and `tests/rls_test.sql` checks the holes above stay closed.
