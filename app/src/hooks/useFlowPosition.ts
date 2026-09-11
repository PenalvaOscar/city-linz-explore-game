import { useEffect } from 'react';
import * as Location from 'expo-location';
import type { LatLng } from '../verify/geo';

export type PositionSample = { position: LatLng; accuracyM: number };

/** Unknown accuracy is treated as the worst case so the flow keeps settling rather than passing on a blind fix. */
const UNKNOWN_ACCURACY_M = Number.POSITIVE_INFINITY;

/**
 * High-accuracy position watcher sampling every second for the duration of the claim flow.
 * Separate from the map's 5 s watcher; permission was already granted before the flow opens.
 */
export function useFlowPosition(onSample: (sample: PositionSample) => void): void {
  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
      (loc) =>
        onSample({
          position: { lat: loc.coords.latitude, lng: loc.coords.longitude },
          accuracyM: loc.coords.accuracy ?? UNKNOWN_ACCURACY_M,
        }),
    )
      .then((watcher) => {
        if (cancelled) watcher.remove();
        else sub = watcher;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [onSample]);
}
