---
status: accepted
---

# Expo (React Native) with Expo Go as the runtime, not a web app

The product must be a phone app, not a website, but the development Mac has no Xcode.app and no Android SDK, and the hackathon gives ~8 hours. We build with Expo SDK 57 in TypeScript and run it in the Expo Go app on team phones, which needs no native toolchain. Native modules outside Expo Go's bundled set (on-device ML, MapLibre, `expo-maps`) are therefore off the table until a dev build via EAS exists.

## Considered options

- **PWA (Vite + React)**: zero-install for judges, but not a mobile app; rejected by the product owner.
- **Next.js**: same objection plus a server we don't need.
- **Flutter**: also Xcode-free for Android, but nobody on the team writes Dart.
- **Capacitor around a web app**: real binaries at the end, but needs Xcode for iOS.

## Consequences

- Map is `react-native-maps` (works in Expo Go without a key). MapLibre is the better long-term choice and should be revisited when a dev build exists; keep the map behind one `<SpotMap>` component so the swap is contained.
  - **Amended 11 Sept 2026 (issue #4):** the no-key claim holds on iOS only. Expo Go's embedded Google Maps key is rejected on SDK 55+, so Android resolves to `SpotMap.android.tsx`: Leaflet + OpenStreetMap tiles inside `react-native-webview` (bundled in Expo Go), same props, attribution "© OpenStreetMap contributors". This is the one WebView code path; it exists because the native path is broken upstream, not as a step towards a web export. **Amended 11 Sept 2026 (issue #7):** the tile layer is CARTO Positron (`light_all`, OSM data) for a muted look closer to iOS; attribution "© OpenStreetMap contributors · © CARTO". **Amended 12 Sept 2026:** Positron read as black and white on phones, so the layer is CARTO Voyager (`rastertiles/voyager`), coloured, same CDN and attribution.
- **All in on Expo Go for the hackathon (decided 11 Sept 2026).** No web export, no Vercel, no EAS build. Judges see the app on team phones or install Expo Go and scan the QR. Native-only code paths; no `Map.web.tsx`, no compass shim.
- After the hackathon: web export (`expo export -p web`) is possible from the same codebase with a `Map.web.tsx` (react-leaflet) and a compass shim. An iOS binary needs a paid Apple Developer account; an Android APK needs an EAS cloud build.
