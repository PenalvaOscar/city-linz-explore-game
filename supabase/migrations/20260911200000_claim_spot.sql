-- claim_spot: the one write path of the claim flow (issue #9).
-- Always logs the attempt in claims; when passed, takes ownership in the
-- same transaction (insert or overwrite the holdings row: claim, steal or
-- reclaim). Returns the new claim id and who held the spot before, so the
-- app can word the result (null → Claimed, me → Reclaimed, other → Stolen).

create or replace function claim_spot(
  spot_id       text,
  player        text,
  points        int,
  passed        boolean,
  distance_m    real,
  heading_delta real,
  gps_accuracy  real,
  dwell_seconds int
) returns json
language plpgsql
as $$
-- Parameters share names with columns; unqualified names are columns, parameters are always qualified.
#variable_conflict use_column
declare
  v_claim_id       uuid;
  v_previous_owner text;
begin
  select h.player into v_previous_owner
  from holdings h
  where h.spot_id = claim_spot.spot_id
  for update;  -- two simultaneous claims on one spot serialise, so previous_owner is exact

  insert into claims (spot_id, player, points, passed, distance_m, heading_delta, gps_accuracy, dwell_seconds)
  values (
    claim_spot.spot_id, claim_spot.player, claim_spot.points, claim_spot.passed,
    claim_spot.distance_m, claim_spot.heading_delta, claim_spot.gps_accuracy, claim_spot.dwell_seconds
  )
  returning id into v_claim_id;

  if claim_spot.passed then
    insert into holdings (spot_id, player, points, held_since)
    values (claim_spot.spot_id, claim_spot.player, claim_spot.points, now())
    on conflict (spot_id) do update
      set player = excluded.player, points = excluded.points, held_since = excluded.held_since;
  end if;

  return json_build_object('claim_id', v_claim_id, 'previous_owner', v_previous_owner);
end;
$$;

grant execute on function claim_spot(text, text, int, boolean, real, real, real, int) to anon, authenticated;
