-- Ensures existing Supabase projects have the table used by the add-spot flow.
-- Safe to run after the original init migration; it does not remove existing data.

create table if not exists public.spots (
  id       text primary key,
  name     text not null,
  lat      double precision not null,
  lng      double precision not null,
  heading  real,
  radius   real not null default 40,
  kind     text not null default 'gem',
  photo    text not null
);

alter table public.spots enable row level security;

drop policy if exists spots_open on public.spots;
create policy spots_open on public.spots
  for all using (true) with check (true);
