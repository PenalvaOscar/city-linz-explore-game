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
- Web export (`expo export -p web`) to Vercel is possible from the same codebase but needs a `Map.web.tsx` (react-leaflet) and a compass shim; deferred, decided at the day-2 checkpoint.
- An iOS binary is not achievable without a paid Apple Developer account; an Android APK via EAS cloud build is a stretch goal only.
