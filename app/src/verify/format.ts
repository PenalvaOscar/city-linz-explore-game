import type { PinState } from '../data/types';
import { t } from '../ui/strings';

/** Straight-line distance for display: metres below 1 km, km with one decimal above, dash when unknown. */
export function formatDistance(metres: number | null): string {
  if (metres === null) return t('distanceUnknown');
  if (metres < 999.5) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Ownership line for the spot sheet. `available` is false when the holdings read failed. */
export function ownershipLabel(state: PinState, owner: string | null, available: boolean): string {
  if (state === 'gem') return t('gem');
  if (!available) return t('ownershipUnavailable');
  if (state === 'mine') return t('yours');
  if (state === 'theirs') return `${t('ownedBy')} ${owner ?? ''}`.trim();
  return t('free');
}
