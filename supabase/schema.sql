-- Zwergerl hackathon schema. Run once in the Supabase SQL editor.
-- RLS is off for the hackathon (ADR-0003); the anon key can read and write everything.

create table if not exists players (
  id          uuid primary key,                  -- generated on the device, stored locally
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists claims (
  id          uuid primary key default gen_random_uuid(),
  spot_id     text not null,                     -- matches data/spots.json id
  player_id   uuid not null references players (id),
  photo_url   text,                              -- public URL in the "photos" bucket
  lat         double precision not null,
  lng         double precision not null,
  accuracy_m  double precision,
  heading     double precision,
  distance_m  double precision,                  -- computed on device at claim time
  heading_diff double precision,
  created_at  timestamptz not null default now()
);

create index if not exists claims_spot_created_idx on claims (spot_id, created_at desc);

-- Current owner of each spot = most recent claim. Decay is computed on the device
-- from created_at (DECAY_DAYS); a decayed spot simply shows as free.
create or replace view current_owners as
select distinct on (c.spot_id)
  c.spot_id,
  c.player_id,
  p.name        as player_name,
  c.photo_url,
  c.heading,
  c.created_at  as claimed_at
from claims c
join players p on p.id = c.player_id
order by c.spot_id, c.created_at desc;

-- Leaderboard = sum of points of currently owned spots. Points live in spots.json,
-- so the app joins current_owners with its bundled spots; no spots table needed yet.

-- Storage: create a PUBLIC bucket named "photos" in Dashboard -> Storage.
