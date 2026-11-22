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

-- Team membership needs both sides: the team's owner lists the player on the team, and the player's own card
-- lists "<owner id>:<team id>" in "teamsJoined" (the Join button in Squad). Being listed alone gives no access, so no
-- one can see a player's card by putting them on a team they never joined.
create or replace function public.is_team_member(team_owner text, team jsonb, who text)
returns boolean language sql stable security definer set search_path = public as $$
  select who = team_owner or (
    (jsonb_path_exists(team, '$.slots.* ? (@ == $u)', jsonb_build_object('u', who))
     or coalesce(team->'subs', '[]'::jsonb) ? who)
    and exists (select 1 from public.docs j
                where j.path = 'players/' || who
                  and coalesce(j.data->'teamsJoined', '[]'::jsonb) ? (team_owner || ':' || coalesce(team->>'id', ''))))
$$;

-- Who can read a player card (players/<id>): the owner, anyone the owner lists as a friend, people the owner put on
-- one of the owner's teams or invited to an event, members of a team the player has joined, and everyone only if
-- the owner set the card to public (never for under-18s).
create or replace function public.can_see_player(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select target = auth.uid() or exists (
    select 1 from public.docs c
    where c.path = 'players/' || target::text and (
      (c.data->>'vis' = 'public' and coalesce((c.data->>'minor')::boolean, false) = false)
      or coalesce(c.data->'friends', '[]'::jsonb) ? auth.uid()::text
      or jsonb_path_exists(c.data, '$.teams[*].slots.* ? (@ == $u)', jsonb_build_object('u', auth.uid()::text))
      or jsonb_path_exists(c.data, '$.teams[*].subs[*] ? (@ == $u)', jsonb_build_object('u', auth.uid()::text))
      or jsonb_path_exists(c.data, '$.meets[*].inv[*] ? (@ == $u)', jsonb_build_object('u', auth.uid()::text))))
  -- teammates on a team both of them have joined can see each other
  or exists (
    select 1 from public.docs t, jsonb_array_elements(coalesce(t.data->'teams', '[]'::jsonb)) team
    where t.path like 'players/%' and t.path not like 'players/%/%'
      and public.is_team_member(t.owner::text, team, auth.uid()::text)
      and public.is_team_member(t.owner::text, team, target::text))
$$;

-- Who can read a chat thread. Threads: d:<a>:<b> (direct), t:<owner>:<team id> (team), e:<host>:<event id> (event).
create or replace function public.can_read_thread(th text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare k text := split_part(th, ':', 1); a text := split_part(th, ':', 2); b text := split_part(th, ':', 3); me text := auth.uid()::text;
begin
  if me is null then return false; end if;
  if k = 'd' then return me = a or me = b; end if;
  if k = 't' then
    return me = a or exists (select 1 from public.docs c, jsonb_array_elements(coalesce(c.data->'teams', '[]'::jsonb)) team
      where c.path = 'players/' || a and team->>'id' = b and public.is_team_member(a, team, me));
  end if;
  if k = 'e' then
    return me = a or exists (select 1 from public.docs c, jsonb_array_elements(coalesce(c.data->'meets', '[]'::jsonb)) m
      where c.path = 'players/' || a and m->>'id' = b and coalesce(m->'inv', '[]'::jsonb) ? me);
  end if;
  return false;
end $$;
revoke execute on function public.is_team_member(text, jsonb, text) from public, anon;
grant execute on function public.is_team_member(text, jsonb, text) to authenticated;
revoke execute on function public.can_see_player(uuid) from public, anon;
revoke execute on function public.can_read_thread(text) from public, anon;
grant execute on function public.can_see_player(uuid) to authenticated;
grant execute on function public.can_read_thread(text) to authenticated;

drop policy if exists "read own data and player cards" on public.docs;
drop policy if exists "read own data, visible cards and own threads" on public.docs;
create policy "read own data, visible cards and own threads" on public.docs for select to authenticated
  using (
    owner = (select auth.uid())
    -- player cards and their pictures
    or (path like 'players/%' and path not like 'players/%/m/%' and public.can_see_player(split_part(path, '/', 2)::uuid))
    -- chat: players/<sender>/m/<thread>, readable only by people in that thread
    or (path like 'players/%/m/%' and public.can_read_thread(data->>'th')));

drop policy if exists "create own docs" on public.docs;
create policy "create own docs" on public.docs for insert to authenticated
  with check (
    owner = (select auth.uid()) and (
      path = 'players/' || (select auth.uid())::text
      or (path like 'players/' || (select auth.uid())::text || '/%' and path not like 'players/%/m/%')
      -- chat: only into a thread the sender belongs to
      or (path like 'players/' || (select auth.uid())::text || '/m/%' and public.can_read_thread(data->>'th'))
      or path like 'data/users/' || (select auth.uid())::text || '/%'));

drop policy if exists "update own docs" on public.docs;
create policy "update own docs" on public.docs for update to authenticated
  using (owner = (select auth.uid()))
  with check (
    owner = (select auth.uid()) and (
      path = 'players/' || (select auth.uid())::text
      or (path like 'players/' || (select auth.uid())::text || '/%' and path not like 'players/%/m/%')
      -- chat: only into a thread the sender belongs to
      or (path like 'players/' || (select auth.uid())::text || '/m/%' and public.can_read_thread(data->>'th'))
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
alter table public.profiles add column if not exists minor boolean not null default false;
alter table public.profiles enable row level security;

-- Names are visible only for yourself and players whose card you can see (friends, teammates, event invites,
-- public cards). Finding new people goes through find_players below, which keeps under-18s hidden.
drop policy if exists "signed-in users can see names" on public.profiles;
drop policy if exists "see names of players you can see" on public.profiles;
create policy "see names of players you can see" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.can_see_player(id));

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
    -- under-18s can only be found by someone who types their exact email
    and (lower(u.email) = lower(trim(q)) or (not p.minor and p.name ilike replace(replace(trim(q), '%', ''), '_', '') || '%'))
  order by p.name
  limit 6
$$;
revoke execute on function public.find_players(text) from public, anon;
grant execute on function public.find_players(text) to authenticated;

-- 4. Live updates for Squad (team changes and chat show up without refreshing).
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 5. Delete my account: removes the login and, through "on delete cascade", every document and profile row.
create or replace function public.delete_my_account()
returns void language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
