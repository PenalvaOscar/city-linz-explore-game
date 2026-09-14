# Zwergerl

**A city exploration game where places can be owned.**

Every spot in Linz can have one owner. To claim it, a player walks to the spot, waits within range, faces the reference direction, and takes a photo. The app verifies the player’s location, GPS accuracy, compass heading, and dwell state.

A successful claim gives the player ownership and points. Another player can steal the spot by completing the same verification flow. If an owner does not reclaim a spot, its ownership decays after 14 days.

---

## The problem

Linz publishes the coordinates of monuments, fountains, public artworks, and other places. The Ars Electronica Festival and other Festivals publish a detailed programme. Neither automatically gives people a reason to visit those places.

People tend to walk the same routes and visit the same headline locations. International students can spend a semester in Linz knowing only the route between their accommodation and university. Local knowledge disappears when students graduate and leave.

Information is not the missing piece. Motivation is.

Zwergerl turns places into a competitive exploration game. Players discover spots, claim them, defend them, steal them, and build a living map of the city.

---

## How it works

1. Open the map and browse the available spots.
2. Spots show their current state: free, owned by you, owned by another player, or upcoming.
3. Select a spot to see its name, reference photo, points, heading, and distance.
4. Walk to the spot and wait until the GPS position is accurate enough.
5. Stay within the required range until the claim flow unlocks the camera.
6. Align the phone with the reference heading.
7. Take the claim photo.
8. The app evaluates the GPS distance, GPS accuracy, compass heading, and dwell time.
9. If all gates pass, the spot becomes yours or is transferred to you as a steal.
10. The claim and proof photo are saved to Supabase.

The camera also shows the reference photo as a ghost overlay to help the player reproduce the original framing.

Players can also create a new spot from the map. They provide a name and take a reference photo. The app stores the spot’s GPS coordinates, compass heading, radius, type, and photo in Supabase.

---

## Three things that make it work

|  |  |
| --- | --- |
| **Proof** | A check-in is only a tap. Zwergerl verifies that the player was physically present. |
| **Ownership** | A place belongs to one player at a time and can be stolen through a full verified claim. |
| **Impermanence** | Ownership decays after 14 days without a reclaim. Festival gems can also be limited by their availability window. |

---

## Technical

### Stack

- **Expo SDK 57**
- **React Native**
- **TypeScript**
- **Expo Camera** for the in-app camera claim flow
- **Expo Image Picker** for camera capture when creating a new spot
- **Expo Location** for GPS position and accuracy
- **React Native Maps** on iOS
- **Leaflet in a React Native WebView** on Android
- CARTO Positron tiles with OpenStreetMap attribution on Android
- **Supabase** for shared claims, holdings, leaderboard data, spot records, and photo storage
- **AsyncStorage** for device-local player identity
- **Jest with jest-expo** for automated tests

The app entry point is `app/App.tsx`. It runs in Expo Go during development and is designed for physical Android and iOS devices.

There is currently no web export, Vercel deployment, Expo Router, or `react-leaflet` implementation.

### Main modules

- `app/App.tsx` — application composition and screen-level state
- `app/src/components/SpotMap.tsx` — iOS map implementation
- `app/src/components/SpotMap.android.tsx` — Android WebView/Leaflet map implementation
- `app/src/components/SpotSheet.tsx` — selected spot details and claim entry point
- `app/src/components/claim/` — multi-step claim flow
- `app/src/components/capture/` — camera view, heading indicator, and reference-photo overlay
- `app/src/components/LeaderboardSheet.tsx` — leaderboard display
- `app/src/components/AddSpotSheet.tsx` — new spot creation flow
- `app/src/data/` — bundled data, Supabase access, claims, and photo uploads
- `app/src/hooks/` — GPS, compass, player identity, claim flow, and holdings state
- `app/src/verify/` — pure verification, leaderboard, decay, season, and map-state logic
- `supabase/schema.sql` — complete database setup for a new Supabase project
- `supabase/migrations/` — incremental database migrations

---

## Verification

Verification is sensor-based. **The app does not compare the captured image with an AI or computer-vision model.**

The photo is captured and stored as proof. The current verification gates are:

| Signal | Purpose |
| --- | --- |
| GPS distance | Confirms that the player is within the spot’s range |
| GPS accuracy | Ensures that the location reading is reliable |
| Compass heading | Confirms that the player is facing the reference direction |
| Dwell state | Ensures that the player has remained within range before capture |

The default thresholds are:

- Distance: up to 40 metres
- GPS accuracy: 60 metres or better
- Heading difference: up to 35 degrees
- Dwell threshold: currently 0 seconds in the default app configuration, so the camera unlocks as soon as the distance and accuracy gates pass

The verification logic is implemented in pure TypeScript and covered by automated tests.

Compass bearings wrap around. For example, `350°` and `10°` are 20° apart:

```ts
Math.abs(((a - b + 540) % 360) - 180)
```

---

## License

This repository is publicly available for viewing and evaluation only. The
code, documentation, design, data, and related project materials may not be
copied, reused, modified, or distributed without prior written permission.

For permission requests, contact: **[eiman.swe@gmail.com]** **[oscarpenalva@gmail.com]** 

See [`LICENSE.md`](LICENSE.md) for the full terms.
