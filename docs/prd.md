# Zwergerl — hackathon PRD

Hackathon slice only. The full product vision is in `docs/brief/zwergerl-hackathon-brief.pdf`. Vocabulary: `CONTEXT.md`. Decisions: `docs/adr/`.

## Problem

The city and the festival publish data, not reasons to go anywhere. Everyone walks the same 800 m of Linz and nobody sees the rest. Existing apps (Visit Linz, Geocaching, Pokémon Go, Actionbound) combine exploration or points, but none makes a place *belong* to someone and lets another person take it.

## Users

- **Primary**: international students and people with a close connection to Linz who like walking and exploring. Pain: "not enough things to do in Linz". Motivation: competing and connecting with friends, collecting places.
- **Secondary (pitch audience)**: city / festival marketing. Value: dispersal of footfall to less-visited districts, verified and timestamped visits, return visits, a photo archive of the city in current conditions.

## Core loop

1. Open the map. Grey pins are free spots, coloured pins are owned. Gems show only inside their window.
2. Walk to a spot. The app checks GPS distance and makes you dwell a few seconds.
3. The camera unlocks with the heading the reference photo was taken at.
4. You reproduce the framing. Verification checks distance, accuracy, heading, dwell (ADR-0002).
5. Pass → you own the spot and its points. If someone owned it, that is a steal.
6. Don't reclaim within 14 days → decay → the spot is free again.
7. A leaderboard ranks players by currently owned points.

## Scope

### Day 1 (today, until 18:00) — must work

- Expo app running in Expo Go on a team phone.
- Map of Linz with ~20 spots pinned at correct coordinates, each with a heading indicator.
- Tap a pin → sheet with photo, name, teaser, distance from the player.
- Player's own location shown.
- `spots.json` generated from the photos + CSV by script.
- Unit tests for distance and wrap-safe heading difference.

### Day 2 (tomorrow, 09:30–14:00) — the loop

- Claim flow: distance gate → dwell → heading gate → capture photo → result screen.
- Player identity: device id + display name, local storage.
- Shared ownership + leaderboard (Supabase hosted, ADR-0003).
- Steal and reclaim.
- Gems from festival calendar with a demo time override.
- Teasers and unlock stories written into the data.

### Not in the hackathon

- AI image comparison (ADR-0002).
- Accounts, auth, push notifications.
- Decay job (client-side computed; cannot fire within the hackathon).
- Live Linz open-data queries (data.linz.gv.at); Linz spots are hand-picked.
- German UI; the data schema is bilingual, the content is EN.
- Anti-spoofing beyond the sensor gates.
- The A0 Stadtplan rasters in `docs/map/`.
- Web export / Vercel, EAS builds, store binaries: the hackathon runs entirely in Expo Go (ADR-0001).

## Data

- **Festival**: `data/ars-electronica-notion-export.json` (152 geocoded locations, 27 outdoor; 795 calendar slots 8–13 Sept 2026 with start/end and linked location). Gems come from calendar slots at outdoor locations.
- **Linz**: ~20 hand-picked spots photographed by the team with location on; heading from EXIF where present, otherwise typed into `data/spots.csv` from a compass app.
- **Test fixtures**: 3 photos — right spot/right heading, right spot/heading off > 60°, wrong spot ~100 m away.

## Verification thresholds (from the brief)

| Gate | Pass | Review |
|---|---|---|
| GPS distance | ≤ 40 m | 40–80 m |
| GPS accuracy | reading ≤ 60 m, otherwise ask to retry | |
| Heading difference | ≤ 35° | ≤ 60° |
| Dwell | ≥ 10 s | |

## Requirements that are easy to forget

- Attribution line in the app: "Data: Ars Electronica Festival 2026 · Stadt Linz (CC-BY) · © OpenStreetMap contributors" (web map only for OSM).
- Festival records with `link_allowed = false` are displayed but never linked.
- Compass on iOS needs a permission request from a tap handler; on Android heading may be −1 until calibrated.
- Camera and location need HTTPS on web; irrelevant in Expo Go.

## Success criterion

One stranger, with no explanation, walks to a pin and successfully claims it. Backup: a 60-second recorded video of a successful claim.

## Open (decided later, in feature specs)

- Whether the challenger sees the reference photo (ghost overlay, blurred until in range, or heading only).
- Which 5 gems go on the map.
- Pitch format and submission requirements.
