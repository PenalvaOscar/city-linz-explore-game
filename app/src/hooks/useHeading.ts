import { useEffect } from 'react';
import * as Location from 'expo-location';

/**
 * Compass watcher for the claim flow: true heading in degrees, or null when the device gives no
 * reading (expo-location reports −1 while the compass is unavailable or uncalibrated).
 */
export function useHeading(onHeading: (heading: number | null) => void): void {
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    Location.watchHeadingAsync((h) => onHeading(h.trueHeading >= 0 ? h.trueHeading : null))
      .then((watcher) => {
        if (cancelled) watcher.remove();
        else sub = watcher;
      })
      .catch(() => onHeading(null));

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [onHeading]);
}
