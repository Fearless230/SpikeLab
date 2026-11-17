# Volleyball Training Journey

A personal volleyball training app: onboarding, a 3D body and technique court, film analysis, programs, progress tracking, a drill library (including off-court wall drills), exercise motion demos, and a Squad for friends and teams.

It is a static site (plain HTML, CSS and JavaScript, no build step). Accounts and cloud saving use [Supabase](https://supabase.com).

## Files

| Path | What it is |
|---|---|
| `index.html` | The app |
| `js/` | App code and training data |
| `js/config.js` | Supabase project URL and publishable key (safe to be public) |
| `js/backend.js` | Login screen and Supabase saving |
| `supabase/schema.sql` | Database tables and security rules: run once in Supabase > SQL Editor |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Publish with GitHub Pages

1. Push this folder to a public GitHub repository.
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
3. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.
4. In Supabase: **Authentication → URL Configuration**. Set **Site URL** to that address (with the trailing slash) and add it to **Redirect URLs**.

Every push to `main` republishes the site automatically.

## Publish with Vercel instead

Import the repository at vercel.com (**Add New → Project**), keep the framework preset as **Other**, no build command, and deploy. Then put the Vercel address in Supabase's URL Configuration the same way.

## Security notes

- Only the **publishable/anon** key belongs in `js/config.js`. Never commit the `service_role` or secret key.
- The row level security rules in `supabase/schema.sql` make sure each person can only change their own data.
