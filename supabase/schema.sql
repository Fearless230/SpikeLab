-- Volleyball Training Journey: database setup for Supabase.
-- Paste all of this into Supabase > SQL Editor > New query, then click Run. Safe to run more than once.

-- 1. Documents: each user's private journey and media, plus public player cards for Squad.
--    Paths look like  data/users/<user id>/journey   or   players/<user id>   or   players/<user id>/media/img
create table if not exists public.docs (
  path text primary key,
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.docs enable row level security;

drop policy if exists "read own data and player cards" on public.docs;
create policy "read own data and player cards" on public.docs for select to authenticated
  using (owner = (select auth.uid()) or path like 'players/%');

drop policy if exists "create own docs" on public.docs;
create policy "create own docs" on public.docs for insert to authenticated
  with check (
    owner = (select auth.uid()) and (
      path = 'players/' || (select auth.uid())::text
      or path like 'players/' || (select auth.uid())::text || '/%'
      or path like 'data/users/' || (select auth.uid())::text || '/%'));

drop policy if exists "update own docs" on public.docs;
create policy "update own docs" on public.docs for update to authenticated
  using (owner = (select auth.uid()))
  with check (
    owner = (select auth.uid()) and (
      path = 'players/' || (select auth.uid())::text
      or path like 'players/' || (select auth.uid())::text || '/%'
      or path like 'data/users/' || (select auth.uid())::text || '/%'));

drop policy if exists "delete own docs" on public.docs;
create policy "delete own docs" on public.docs for delete to authenticated
  using (owner = (select auth.uid()));

-- 2. Profiles: the display name friends see. Emails stay private.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "signed-in users can see names" on public.profiles;
create policy "signed-in users can see names" on public.profiles for select to authenticated using (true);

drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 3. Friend search: finds people by exact email or by the start of their name.
--    It only reveals an email when the searcher typed that exact email.
create or replace function public.find_players(q text)
returns table (id uuid, name text, email text)
language sql stable security definer set search_path = public as $$
  select p.id, p.name,
         case when lower(u.email) = lower(trim(q)) then u.email::text else null end
  from public.profiles p join auth.users u on u.id = p.id
  where auth.uid() is not null
    and length(trim(q)) >= 2
    and (lower(u.email) = lower(trim(q)) or p.name ilike replace(replace(trim(q), '%', ''), '_', '') || '%')
  order by p.name
  limit 6
$$;
revoke execute on function public.find_players(text) from public, anon;
grant execute on function public.find_players(text) to authenticated;

-- 4. Live updates for Squad (team changes and chat show up without refreshing).
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
