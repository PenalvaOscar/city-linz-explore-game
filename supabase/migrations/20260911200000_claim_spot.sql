-- claim_spot: the one write path of the claim flow (issue #9).
-- Always logs the attempt in claims; when passed, takes ownership in the
-- same transaction (insert or overwrite the holdings row: claim, steal or
-- reclaim). Returns the new claim id and who held the spot before, so the
-- app can word the result (null → Claimed, me → Reclaimed, other → Stolen).

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

grant execute on function claim_spot(text, text, integer, boolean, real, real, real, integer) to anon, authenticated;
