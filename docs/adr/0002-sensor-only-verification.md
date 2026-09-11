---
status: accepted
---

# Verification is sensor-only; no AI image comparison

The original brief proposed CLIP image similarity as a fourth verification gate. We verify a claim with GPS distance, GPS accuracy, compass heading and dwell time only, and store the photo as proof without comparing it. Image comparison cannot run on-device inside Expo Go, a server-side model or vision API adds a backend, an API key and 3–6 s of latency, and the brief itself rates it the riskiest piece.

## Consequences

- No runtime AI calls and no API key ships in the app. The only AI use is offline content generation (teasers, unlock stories) written into the data files.
- The pitch line is the brief's fallback: "Presence is verified by GPS, heading and dwell time; automated image matching is the next step."
- Gates are evaluated independently and never blended into one score. Compass differences must use the wrap-safe formula `|((a − b + 540) mod 360) − 180|`.
- Photographing a screen from the right spot defeats verification; accepted, per the brief ("make winning boring").
