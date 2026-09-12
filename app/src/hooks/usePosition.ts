import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '../verify/geo';

export type PositionState = { granted: boolean; denied: boolean; position: LatLng | null };

/** Asks for foreground location once; after grant, watches position at low frequency. */
export function usePosition(): PositionState {
  const [granted, setGranted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setDenied(true);
        return;
      }
      setGranted(true);
      const watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 5 },
        (loc) =>
          setPosition({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading,
            accuracy: loc.coords.accuracy,
          }),
      );
      if (cancelled) {
        watcher.remove();
        return;
      }
      sub = watcher;
    })().catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { granted, denied, position };
}
