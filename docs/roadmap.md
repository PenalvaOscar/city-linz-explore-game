# Roadmap

Two blocks: today 14:20–18:00, tomorrow 09:30–14:00. Three lanes, fixed interfaces, no shared files.

## Lanes

| Lane | Owns | Needs |
|---|---|---|
| **A — App** | `app/` (Expo, TS, Expo Router), `<SpotMap>`, spot sheet | React/TS |
| **B — Data** | `data/`, `scripts/build-spots.py`, photos, `spots.csv`, gems shortlist | Python basics, a phone, walking |
| **C — Verify + pitch** | `app/src/verify/` (pure TS, Jest), pitch, backup video, tester recruiting | TS basics, writing |

Interfaces, frozen now:

- **B → A**: `app/assets/spots.json`, schema below.
- **C → A**: `evaluateClaim(spot, reading): ClaimResult` with `{ pass, distanceM, headingDiff, gates: { distance, accuracy, heading, dwell } }`.
- A stubs both with dummy data until they land.

## Day 1 — today

| Time | A — App | B — Data | C — Verify + pitch |
|---|---|---|---|
| 14:20–15:00 | `npx create-expo-app` (TS, Router), Expo Go on a phone, `react-native-maps` with 3 dummy pins centred on Linz | Shoot the 20 spots with location on; note heading from a compass app per shot | Jest via `jest-expo`; `haversine`, `headingDiff` + tests |
| 15:00–16:30 | Pins from `spots.json`, heading arrow on pin, player location dot | `build-spots.py`: EXIF → lat/lng/heading, merge `spots.csv`, downscale to 1024 px into `app/assets/photos/` | `evaluateClaim` + gate tests using the 3 fixture photos' EXIF as readings |
| 16:30–17:30 | Spot sheet: photo, name, teaser, distance | QA every pin on A's phone; fix coordinates/headings in CSV | Draft pitch outline; map judging criteria if known |
| 17:30–18:00 | Commit, run on a second phone | Commit `spots.json` + photos | Record 30 s video of the map on a phone |

**18:00 DoD**: map on a phone, ~20 photos pinned correctly with heading shown, tap → sheet.

## Day 2 — tomorrow

| Time | A — App | B — Data | C — Verify + pitch |
|---|---|---|---|
| 09:30–11:00 | Claim flow screen: distance → dwell → heading → camera → result, using `evaluateClaim` | Gems: script filters calendar slots at outdoor locations for 12–13 Sept → `gems.json`; pick 5 | Player identity (id + name, local storage); Supabase hosted project, `players` + `claims` tables, `current_owners` view, public `photos` bucket |
| **11:00 checkpoint** | Scope check: is the claim flow writing to Supabase? If not, cut gems and leaderboard polish. | | |
| 11:00–12:30 | Ownership on the map (coloured pins), steal/reclaim writes to Supabase | Teasers + stories into `spots.csv` (written in-session with Claude Code, no API) | Leaderboard screen; `DEMO_NOW` override for gems |
| 12:30–13:30 | Go outside: claim 3 spots for real; fix what breaks | Recruit 3–5 strangers to claim one | Record 60 s backup video of a successful claim |
| 13:30–14:00 | Freeze. Rehearse pitch once out loud. | | |

**Scope rule (from the brief)**: if the claim flow isn't working by 12:30, stop adding and demo the map + verification helpers with the honest pitch line.

## Feature tickets (in order; spec each with `/to-spec`, then `/to-tickets`)

1. Map with spots — day 1
2. Verification helpers — day 1
3. Claim flow (includes the ghost-photo decision)
4. Player identity
5. Shared ownership + steal + reclaim (Supabase)
6. Leaderboard
7. Gems with time window + demo override
8. Teasers and unlock stories
9. Decay (client-computed, `DECAY_DAYS` constant)

After the hackathon: web export + Vercel, EAS Android build (ADR-0001).

## Spot schema

```json
{
  "id": "dreifaltigkeitssaeule",
  "name": { "en": "Trinity Column", "de": "Dreifaltigkeitssäule" },
  "teaser": { "en": "" },
  "story": { "en": "" },
  "lat": 48.3059,
  "lng": 14.2863,
  "heading": 214,
  "kind": "linz",
  "points": 10,
  "photo": "dreifaltigkeitssaeule.jpg",
  "window": null
}
```

`kind` is `"linz" | "gem"`; `points` 10 for linz, 30 for gems; `window` is `{ "start": ISO, "end": ISO, "locationId": "<festival canonical_id>" }` for gems. CSV values win over EXIF.

## Repo layout

```
app/            Expo project (assets/spots.json, assets/photos/, src/verify/)
data/           festival export, spots.csv, photos-original/ (gitignored)
scripts/        build-spots.py, build-gems.py
docs/           prd.md, roadmap.md, brief/, adr/
CONTEXT.md      glossary
```

## Known risks

- Android EXIF often lacks heading → CSV column is the source of truth.
- Venue Wi-Fi may block phone↔laptop → `npx expo start --tunnel`.
- Indoor GPS won't settle → all spots outdoors; demo video as backup.
- Google Maps on a standalone Android build needs a key; Expo Go doesn't. Only matters after the hackathon.
- Supabase anon key ships in the app bundle with RLS off; acceptable for a demo, not beyond it.
