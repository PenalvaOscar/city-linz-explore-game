export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Wrap-safe absolute difference between two compass headings, in degrees (0..180). See ADR-0002. */
export function headingDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

/** Signed turn from `heading` to `target` in degrees, −180 (exclusive) to 180: positive is clockwise (right). */
export function headingTurn(heading: number, target: number): number {
  return ((target - heading + 540) % 360) - 180;
}
