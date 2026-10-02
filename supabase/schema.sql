-- Zwergerl hackathon schema
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Destructive reset: this script drops and recreates game tables. Do not rerun
-- against a project whose data you need to keep; use migrations instead.

create extension if not exists pgcrypto;

drop function if exists public.claim_spot(text, text, integer, boolean, real, real, real, integer);
drop view if exists leaderboard;
drop table if exists spots;
drop table if exists claims;
drop table if exists holdings;

create table spots (
  id       text primary key,
  name     text not null,
  lat      double precision not null,
  lng      double precision not null,
  heading  real,
  radius   real not null default 40,
  kind     text not null default 'gem',
  photo    text not null
);

alter table spots enable row level security;
create policy spots_authenticated on spots for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------
-- claims: every attempt, passed or failed. This is your real data.
-- ---------------------------------------------------------------
create table claims (
  id            uuid primary key default gen_random_uuid(),
  spot_id       text        not null,   -- id in data/spots.json
  player        text        not null,
  points        int         not null default 0,
  passed        boolean     not null default true,
  distance_m    real,
  heading_delta real,
  gps_accuracy  real,
  dwell_seconds int,
  photo_url     text,
  created_at    timestamptz not null default now()
);

create index claims_spot_idx   on claims (spot_id);
create index claims_player_idx on claims (player);
create index claims_time_idx   on claims (created_at desc);

-- ---------------------------------------------------------------
-- holdings: who owns what right now. One row per spot.
-- A new claim overwrites the row — that is the steal.
-- points is copied from spots.json at claim time so the
-- leaderboard can be computed here.
-- ---------------------------------------------------------------
create table holdings (
  spot_id    text primary key,
  player     text        not null,
  points     int         not null default 0,
  held_since timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- leaderboard: a view, not a table. Never gets out of sync.
-- Sum of currently held spots, not lifetime claims: a steal
-- moves points from victim to thief.
-- ---------------------------------------------------------------
create view leaderboard as
select
  player,
  sum(points)              as points,
  count(*)                 as spots,
  max(held_since)          as last_claim
from holdings
group by player
order by points desc;

-- ---------------------------------------------------------------
-- Hackathon access: any signed-in player can read and write shared game data.
-- Production should add per-player ownership policies and server-side validation.
-- ---------------------------------------------------------------
alter table claims   enable row level security;
alter table holdings enable row level security;

create policy claims_authenticated on claims
  for all to authenticated using (true) with check (true);
create policy holdings_authenticated on holdings
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on spots to authenticated;
grant select, insert, update on claims to authenticated;
grant select, insert, update, delete on holdings to authenticated;
grant select on leaderboard to authenticated;
revoke all on spots, claims, holdings, leaderboard from anon;

-- ---------------------------------------------------------------
-- claim_spot: the one write path of the claim flow.
-- Always logs the attempt in claims; when passed, takes ownership in the
-- same transaction (insert or overwrite the holdings row: claim, steal or
-- reclaim). Returns the new claim id and who held the spot before, so the
-- app can word the result (null → Claimed, me → Reclaimed, other → Stolen).
-- ---------------------------------------------------------------

create or replace function claim_spot(
  spot_id       text,
  player        text,
  points        integer,
  passed        boolean,
  distance_m    real,
  heading_delta real,
  gps_accuracy  real,
  dwell_seconds integer
) returns json
language plpgsql
as $$
declare
  v_claim_id       uuid;
  v_previous_owner text;
begin
  select h.player into v_previous_owner
  from holdings h
  where h.spot_id = $1
  for update;  -- two simultaneous claims on one spot serialise, so previous_owner is exact

  insert into claims (spot_id, player, points, passed, distance_m, heading_delta, gps_accuracy, dwell_seconds)
  values (
    $1, $2, $3, $4, $5, $6, $7, $8
  )
  returning id into v_claim_id;

  if $4 then
    insert into holdings (spot_id, player, points, held_since)
    values ($1, $2, $3, now())
    on conflict (spot_id) do update
      set player = excluded.player, points = excluded.points, held_since = excluded.held_since;
  end if;

  return json_build_object('claim_id', v_claim_id, 'previous_owner', v_previous_owner);
end;
$$;

revoke all on function claim_spot(text, text, integer, boolean, real, real, real, integer) from public, anon;
grant execute on function claim_spot(text, text, integer, boolean, real, real, real, integer) to authenticated;

-- ---------------------------------------------------------------
-- Photo storage: public bucket "photos"; only authenticated players may upload or update.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists photos_open on storage.objects;
drop policy if exists photos_authenticated on storage.objects;
create policy photos_authenticated on storage.objects
  for all to authenticated using (bucket_id = 'photos') with check (bucket_id = 'photos');

-- ---------------------------------------------------------------
-- Two demo rows (real spot ids) so the map and leaderboard are
-- not empty on first load. Delete before the pitch.
-- ---------------------------------------------------------------
insert into claims (spot_id, player, points, distance_m, heading_delta, dwell_seconds)
values
  ('lentos',    'lena', 10, 22.4, 11.0, 21),
  ('mariendom', 'tobi', 10, 31.8, 24.5, 19);

insert into holdings (spot_id, player, points) values
  ('lentos',    'lena', 10),
  ('mariendom', 'tobi', 10);
