# Volleyball Training Journey

A personal volleyball training app: onboarding, a 3D body and technique court, film analysis, programs, progress tracking, a drill library (including off-court wall drills), exercise motion demos, a Squad for friends and teams, a daily readiness check-in, player levels and daily challenges, and a courtside Toolkit (interval timer, match stat tracker, rotation viewer, plays library, calculators, rules and glossary).

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
| `js/v3.js`, `css/v3.css` | Today screen, guided session mode, the calendar model (`VB.cal`: events, multi-day tournaments, training days, what each day holds, calendar-file export) and tapering, soreness check, jump load, milestones, coach tools, Film comparison, privacy controls, reminders, dark theme |
| `js/v5-home.js`, `css/v5.css` | Home screen redesign: broadcast-style HUD (readiness ring, week, streak, vertical trend, level and XP), session ticket with time per block, daily challenge, quick actions, 12-week training map, tip of the day; readiness check-in that sets the day's session; XP and levels; Progress additions (26-week training map, readiness trend, XP breakdown) |
| `js/v5-tools.js` | The Toolkit view (`#tools`, with deep links such as `#tools/match` or `#tools/plays`): interval timer (presets, EMOM, stopwatch, beeps, floating pill while running), match stat tracker (hitting %, pass rating, season totals, CSV), rotation viewer (5-1, 6-2, 4-2; serve-receive formations checked against the overlap rule, animated switch to base, rotate and walk-through, libero swaps through the replacement zone, FIVB 2025-28 or in-order serving rules, overlap pairs, and a 'spot the overlap' quiz), plays library (animated offence, serve-receive, defence, coverage and transition plays, with set calls), calculators (touch over the net, jump from air time, hitting %, pass rating, session load, units), rules (by category, what changed in 2025, referee signals, myths, a scenario quiz, indoor/beach/sitting comparison, glossary) with search |
| `js/data-v5.js` | 18 more drills (mostly solo and partner), 24 daily challenges, readiness questions, level names, tips, 14 rules summaries and a 39-term glossary |
| `js/data-tech-more.js` | More techniques with their own 3D clips: quick attack, shoot and go, roll shot, cut shot, tooling the block, setter dump, collapse dig, side dive and roll, overhead dig (the tip and the overhead pass also got their own clips) |
| `js/data-plays.js` | The plays library: offence, serve receive, serving, defence, coverage and transition. Each play has options to choose between (which set, where the attack or serve goes), timed captions and a job for every player; plus the set calls |
| `js/v6-calendar.js` | The calendar on Progress: month view, week timetable and list, a day panel to add or edit games, tournaments (with an end date), team practices and other events (time, place, note), and per-event or all-games calendar files. Shows sessions, match results, jump tests, Squad events, program phases and the jump-goal date, and what the plan does each day (training, light, game, recovery, rest). Also the dated timeline on the active program |
| `js/data-rules.js` | Rules by category (FIVB 2025-2028, with USA Volleyball, college and school differences), what changed, referee signals, myths, rule quiz, indoor/beach/sitting table and extra glossary terms. Replaces the short rule list in `data-v5.js` |
| `js/demo3d.js` | Puts the 3D player into exercise demos (retargets the 2D motion data onto the rig) |
| `js/i18n.js`, `js/i18n-fr.js` | Interface translation. French covers the interface; exercise and drill instructions are still English |
| `sw.js`, `manifest.webmanifest`, `img/icon-*` | Offline support and install-to-home-screen |
| `img/og.png` | Preview image shown when the link is shared |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Publish with GitHub Pages

1. Push this folder to a public GitHub repository.
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.
4. In Supabase: **Authentication → URL Configuration**. Set **Site URL** to that address (with the trailing slash) and add it to **Redirect URLs**.

Every push to `main` republishes the site automatically.

## Publish with Vercel instead

Import the repository at vercel.com (**Add New → Project**), keep the framework preset as **Other**, no build command, and deploy. Then put the Vercel address in Supabase's URL Configuration the same way.

## Every time you publish

1. **Bump `VERSION` in `sw.js`** (for example `vbj-v5-1` to `vbj-v5-2`). Phones cache the app for offline use and only pick up new files when this changes. If you add a new file, add it to the `CORE` list too.
2. If `supabase/schema.sql` changed, **run it again** in Supabase > SQL Editor. It is safe to re-run. This release changed it: player-card visibility (friends and teammates by default), hidden search for under-18s, private message threads, and the `delete_my_account` function behind the Delete my account button.

## Adding a language

Copy `js/i18n-fr.js` to `js/i18n-xx.js`, translate the values, load it in `index.html` before `js/i18n.js`, and add a `data-lang-set="xx"` button in Profile > Appearance and language. Phrases containing numbers are handled by the patterns in `js/i18n.js`.

## Security notes

- Only the **publishable/anon** key belongs in `js/config.js`. Never commit the `service_role` or secret key.
- Children under 13 can use the app on their device but cannot create an account or use Squad. Players under 18 are only visible to friends and teammates. Check this against the rules where you operate; it is not legal advice.
- The row level security rules in `supabase/schema.sql` make sure each person can only change their own data.
