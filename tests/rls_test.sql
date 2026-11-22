-- Security rule tests. Run with tests/run-rls.sh. Every check raises an error if a rule lets the wrong person in.
\set ON_ERROR_STOP on
\set QUIET on
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.docs, public.profiles to authenticated;
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','attacker@x.com'),
 ('00000000-0000-0000-0000-00000000000b','kid@x.com'),
 ('00000000-0000-0000-0000-00000000000c','coach@x.com'),
 ('00000000-0000-0000-0000-00000000000d','d@x.com'),
 ('00000000-0000-0000-0000-00000000000e','e@x.com');

create function pg_temp.as_user(u text) returns void language sql as $$ select set_config('req.uid', u, false) $$;
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin if not ok then raise exception 'FAILED: %', what; end if; raise notice 'ok  %', what; end $$;
create function pg_temp.blocked(q text) returns boolean language plpgsql as $$
begin execute q; return false; exception when insufficient_privilege or check_violation then return true; end $$;

set role authenticated;
-- the kid (under 18, friends-only card) and a profile row
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000b','{"vis":"friends","minor":true,"friends":["00000000-0000-0000-0000-00000000000c"],"teamsJoined":[]}');
insert into public.profiles(id,name,minor) values ('00000000-0000-0000-0000-00000000000b','Kid Player',true);
-- the coach: a team with the kid and d in it
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000c','{"vis":"friends","friends":["00000000-0000-0000-0000-00000000000b","00000000-0000-0000-0000-00000000000d"],"teams":[{"id":"t1","slots":{"S":"00000000-0000-0000-0000-00000000000b","OH1":"00000000-0000-0000-0000-00000000000d"},"subs":[]}]}');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000d','{"vis":"friends","friends":["00000000-0000-0000-0000-00000000000c"],"teamsJoined":["00000000-0000-0000-0000-00000000000c:t1"]}');
-- e and d have a direct thread
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000e','{"vis":"friends","friends":[]}');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000e/m/dm','{"th":"d:00000000-0000-0000-0000-00000000000d:00000000-0000-0000-0000-00000000000e","msgs":[]}');

-- 1. Putting someone on your own team does not let you read their card
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000a','{"vis":"friends","teams":[{"id":"x","slots":{"OH1":"00000000-0000-0000-0000-00000000000b"},"subs":[]}]}');
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000b')=0, 'a stranger who lists the kid on a team cannot read the kid''s card');
-- even if the attacker also lists himself as "joined" on the kid's team at the coach
update public.docs set data = data || '{"teamsJoined":["00000000-0000-0000-0000-00000000000c:t1"]}' where path='players/00000000-0000-0000-0000-00000000000a';
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000b')=0, 'claiming to have joined a team you are not on gives no access');

-- 2. The profiles table does not list strangers (or reveal who is under 18)
select pg_temp.check((select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000b')=0, 'a stranger cannot list the kid''s name or under-18 flag');
select pg_temp.check((select count(*) from public.find_players('Kid'))=0, 'name search does not find under-18s');
select pg_temp.check((select count(*) from public.find_players('kid@x.com'))=1, 'exact email search still finds them');

-- 3. You cannot post into a thread you are not part of
select pg_temp.check(pg_temp.blocked($q$insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000a/m/inj','{"th":"d:00000000-0000-0000-0000-00000000000d:00000000-0000-0000-0000-00000000000e","msgs":[]}')$q$), 'a stranger cannot write into someone else''s direct thread');
select pg_temp.check(pg_temp.blocked($q$insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000a/m/inj2','{"th":"t:00000000-0000-0000-0000-00000000000c:t1","msgs":[]}')$q$), 'a stranger cannot write into a team thread');
select pg_temp.check((pg_temp.blocked($q$insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000a/m/ok','{"th":"d:00000000-0000-0000-0000-00000000000a:00000000-0000-0000-0000-00000000000e","msgs":[]}')$q$))=false, 'you can start a direct thread you are part of');
select pg_temp.check(pg_temp.blocked($q$update public.docs set data='{"th":"d:00000000-0000-0000-0000-00000000000d:00000000-0000-0000-0000-00000000000e","msgs":[]}' where path='players/00000000-0000-0000-0000-00000000000a/m/ok'$q$), 'you cannot move your message into someone else''s thread');
select pg_temp.check(pg_temp.blocked($q$insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000b','{}')$q$), 'you cannot create someone else''s card');
select pg_temp.check((select count(*) from public.docs where path like 'data/users/%')=0, 'nobody else''s private journey is readable');

-- 4. Real teams keep working once players join
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000b')=0, 'a teammate cannot see the kid before the kid joins the team');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
update public.docs set data = jsonb_set(data,'{teamsJoined}','["00000000-0000-0000-0000-00000000000c:t1"]') where path='players/00000000-0000-0000-0000-00000000000b';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000b')=1, 'after joining, teammates see each other');
select pg_temp.check((select count(*) from public.profiles where id='00000000-0000-0000-0000-00000000000b')=1, 'after joining, teammates see each other''s name');
select pg_temp.check((pg_temp.blocked($q$insert into public.docs(path,data) values ('players/00000000-0000-0000-0000-00000000000d/m/team','{"th":"t:00000000-0000-0000-0000-00000000000c:t1","msgs":[]}')$q$))=false, 'a joined teammate can post in team chat');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000d/m/team')=1, 'the team owner reads team chat');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from public.docs where path='players/00000000-0000-0000-0000-00000000000d/m/team')=0, 'outsiders cannot read team chat');
reset role;
\echo 'All security rule tests passed.'
