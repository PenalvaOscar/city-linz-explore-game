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
  gem_id        text        not null,
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

create index claims_gem_idx    on claims (gem_id);
create index claims_player_idx on claims (player);
create index claims_time_idx   on claims (created_at desc);

-- ---------------------------------------------------------------
-- holdings: who owns what right now. One row per gem.
-- A new claim overwrites the row — that is the steal.
-- ---------------------------------------------------------------
create table holdings (
  gem_id     text primary key,
  player     text        not null,
  held_since timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- leaderboard: a view, not a table. Never gets out of sync.
-- ---------------------------------------------------------------
create view leaderboard as
select
  player,
  sum(points)              as points,
  count(*)                 as claims,
  max(created_at)          as last_claim
from claims
where passed
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
-- Two demo rows so the leaderboard is not empty on first load.
-- Delete before the pitch.
-- ---------------------------------------------------------------
insert into claims (gem_id, player, points, distance_m, heading_delta, dwell_seconds)
values
  ('klosterhof', 'lena', 30, 22.4, 11.0, 21),
  ('hofgasse',   'tobi', 18, 31.8, 24.5, 19);

insert into holdings (gem_id, player) values
  ('klosterhof', 'lena'),
  ('hofgasse',   'tobi');
