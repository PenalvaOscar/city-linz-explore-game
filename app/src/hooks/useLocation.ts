import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '../verify/geo';

export type LocationState = { granted: boolean; position: LatLng | null };

/** Asks for foreground location once; after grant, watches position at low frequency. */
export function useLocation(): LocationState {
  const [granted, setGranted] = useState(false);
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      setGranted(true);
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 5 },
        (loc) => setPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude }),
      );
    })().catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { granted, position };
}
