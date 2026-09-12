---
status: accepted
---

# Gems are generated per location-day from the festival export, not hand-picked

A gem is one outdoor festival location on one festival day. `app/scripts/build-gems.js` reads the Ars Electronica export and the allowlist `data/gem-locations.csv` (festival `canonical_id`, reference photo, coordinates, heading, optional teaser and story overrides) and writes `data/gems.json`: per allowlisted location with a photo, one gem per date it has calendar slots, with the window running from the earliest slot start to the latest slot end that day, 50 points when a highlighted slot runs there, else 30. The script is run by hand and its output committed; the bundled data test is the contract on that output.

## Considered options

- **Slot-level windows**: too short to walk to, and 51 near-identical guided-tour slots at one meeting point.
- **One gem per location for the whole festival**: owned on day one, boring after.
- **Hand-picked gems in `spots.json`**: what the six purple pins were; nothing tied them to what is happening in the city, and a regeneration could erase hand-written content.

## Consequences

- Generated gems live in `data/gems.json`, apart from the hand-written `data/spots.json`; the spots module merges the two and validates the union. Only gems carry a window; remote spots load as `linz` whatever the row says.
- Coordinates, heading and photo come from the allowlist row, not the festival's location pin, so verification checks where the photographer stood. A row without a photo produces no gem.
- The export only ever says MESZ, so windows are written with a fixed `+02:00` offset; the script fails on a slot that crosses midnight.
- Each location-day has its own holdings row: a player may hold the same location on several days.
