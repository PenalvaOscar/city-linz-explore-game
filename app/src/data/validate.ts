import type { Spot, SpotKind } from './types';

/** Rough bounding box around the city of Linz. */
export const LINZ_BOUNDS = { minLat: 48.22, maxLat: 48.40, minLng: 14.18, maxLng: 14.40 };

const KINDS: SpotKind[] = ['linz', 'gem'];

/** Throws a readable error if the spot data is inconsistent. Called once at startup. */
export function validateSpots(spots: Spot[], photoIndex: Record<string, unknown>): void {
  const seen = new Set<string>();
  for (const s of spots) {
    if (seen.has(s.id)) throw new Error(`spots.json: duplicate spot id "${s.id}"`);
    seen.add(s.id);
    if (!KINDS.includes(s.kind)) throw new Error(`spots.json: spot "${s.id}" has unknown kind "${s.kind}"`);
    if (!(s.points > 0)) throw new Error(`spots.json: spot "${s.id}" must have positive points, got ${s.points}`);
    if (
      s.lat < LINZ_BOUNDS.minLat || s.lat > LINZ_BOUNDS.maxLat ||
      s.lng < LINZ_BOUNDS.minLng || s.lng > LINZ_BOUNDS.maxLng
    ) {
      throw new Error(`spots.json: spot "${s.id}" is outside Linz (${s.lat}, ${s.lng})`);
    }
    if (!(s.photo in photoIndex)) {
      throw new Error(
        `spots.json: spot "${s.id}" references photo "${s.photo}" which is not in the photo index. ` +
          `Put it in data/photos/ and run "npm run build:photos" in app/.`,
      );
    }
  }
}
