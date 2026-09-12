import type { Holding } from '../data/types';

/** Days an owner has to reclaim before the spot decays and shows as free. */
export const DECAY_DAYS = 14;

const DECAY_MS = DECAY_DAYS * 24 * 60 * 60 * 1000;

/**
 * The holdings still in force at `now`: those whose `held_since` is strictly less than the decay
 * period old. A holding exactly 14 days old has decayed; one whose `held_since` does not parse is
 * dropped. Gems get no special case. The server row is left alone; the next passing claim overwrites it.
 */
export function applyDecay(holdings: Holding[], now: Date): Holding[] {
  return holdings.filter((h) => {
    const since = Date.parse(h.held_since);
    return Number.isFinite(since) && now.getTime() - since < DECAY_MS;
  });
}
