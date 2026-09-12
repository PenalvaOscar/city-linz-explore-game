import type { Holding, PinState, Spot } from '../data/types';
import { windowState } from './windowState';

/**
 * Pin colour state for a spot given the current holdings, the local player's name and the app clock's
 * `now`. A gem before its window is `upcoming` whoever holds it; inside the window it takes the ordinary
 * ownership state like a Linz spot. Closed gems never reach here: the app root filters them out.
 */
export function pinState(spot: Spot, holdings: Holding[], me: string, now: Date): PinState {
  if (windowState(spot, now) === 'upcoming') return 'upcoming';
  const holding = holdings.find((h) => h.spot_id === spot.id);
  if (!holding) return 'free';
  return holding.player === me ? 'mine' : 'theirs';
}
