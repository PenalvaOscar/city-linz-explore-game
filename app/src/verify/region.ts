import type { LatLng } from './geo';

export type Region = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

const PADDING = 1.3; // 15 % margin on each side
const MIN_DELTA = 0.01; // never zoom tighter than roughly 1 km

/** Map region that fits every point with padding. */
export function initialRegion(points: LatLng[]): Region {
  if (points.length === 0) throw new Error('initialRegion needs at least one point');
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * PADDING, MIN_DELTA),
    longitudeDelta: Math.max((maxLng - minLng) * PADDING, MIN_DELTA),
  };
}

export type Bounds = [[number, number], [number, number]];

/** Leaflet-style `[[south, west], [north, east]]` bounds for a region. */
export function regionToBounds(r: Region): Bounds {
  const halfLat = r.latitudeDelta / 2;
  const halfLng = r.longitudeDelta / 2;
  return [
    [r.latitude - halfLat, r.longitude - halfLng],
    [r.latitude + halfLat, r.longitude + halfLng],
  ];
}
