import type { Holding, PinState, Spot } from '../data/types';

/** No player identity exists yet (roadmap ticket 4), so `mine` cannot occur. */
export const NO_PLAYER = '';

/** Pin colour state for a spot given the current holdings and the local player id. */
export function pinState(spot: Spot, holdings: Holding[], me: string): PinState {
  if (spot.kind === 'gem') return 'gem';
  const holding = holdings.find((h) => h.spot_id === spot.id);
  if (!holding) return 'free';
  return holding.player === me ? 'mine' : 'theirs';
}
