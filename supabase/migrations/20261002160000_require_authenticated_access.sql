-- Require a signed-in Supabase account for all game data writes and reads.
-- Shared game data is still visible to every authenticated player; per-player
-- authorization is a separate production-hardening step.

drop policy if exists spots_open on public.spots;
drop policy if exists spots_authenticated on public.spots;
create policy spots_authenticated on public.spots
  for all to authenticated using (true) with check (true);

drop policy if exists claims_open on public.claims;
drop policy if exists claims_authenticated on public.claims;
create policy claims_authenticated on public.claims
  for all to authenticated using (true) with check (true);

drop policy if exists holdings_open on public.holdings;
drop policy if exists holdings_authenticated on public.holdings;
create policy holdings_authenticated on public.holdings
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.spots to authenticated;
grant select, insert, update on public.claims to authenticated;
grant select, insert, update, delete on public.holdings to authenticated;
grant select on public.leaderboard to authenticated;
revoke all on public.spots, public.claims, public.holdings, public.leaderboard from anon;

revoke all on function public.claim_spot(text, text, integer, boolean, real, real, real, integer) from public, anon;
grant execute on function public.claim_spot(text, text, integer, boolean, real, real, real, integer) to authenticated;

drop policy if exists photos_open on storage.objects;
drop policy if exists photos_authenticated on storage.objects;
create policy photos_authenticated on storage.objects
  for all to authenticated using (bucket_id = 'photos') with check (bucket_id = 'photos');
