-- Zwergerl hackathon schema
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Safe to re-run: drops and recreates everything.

drop view if exists leaderboard;
drop table if exists claims;
drop table if exists holdings;

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
-- Open access. There is no auth in this build, so RLS must allow
-- anonymous reads and writes or every insert fails silently.
-- This is fine for one day. Do not ship it.
-- ---------------------------------------------------------------
alter table claims   enable row level security;
alter table holdings enable row level security;

create policy claims_open   on claims   for all using (true) with check (true);
create policy holdings_open on holdings for all using (true) with check (true);

-- ---------------------------------------------------------------
-- Photo storage: public bucket "photos", anonymous upload allowed.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists photos_open on storage.objects;
create policy photos_open on storage.objects
  for all using (bucket_id = 'photos') with check (bucket_id = 'photos');

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
