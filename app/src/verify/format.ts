import type { PinState, Spot } from '../data/types';
import { t } from '../ui/strings';
import { windowState } from './windowState';

/** Straight-line distance for display: metres below 1 km, km with one decimal above, dash when unknown. */
export function formatDistance(metres: number | null): string {
  if (metres === null) return t('distanceUnknown');
  if (metres < 999.5) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Time left for the season countdown: days and hours from a day on, hours and minutes below, minutes only below an hour. */
export function formatRemaining(ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
}

/** Ownership line for the spot sheet. `available` is false when the holdings read failed. */
export function ownershipLabel(state: PinState, owner: string | null, available: boolean): string {
  if (!available) return t('ownershipUnavailable');
  if (state === 'mine') return t('yours');
  if (state === 'theirs') return `${t('ownedBy')} ${owner ?? ''}`.trim();
  return t('free');
}

/** `HH:MM` as written in the window string, whose offset is Linz time; never the device zone. */
const clockTime = (iso: string) => /T(\d{2}:\d{2})/.exec(iso)?.[1] ?? iso;

/** Window line for the spot sheet: the opening time while a gem is upcoming, the closing time while open, nothing otherwise. */
export function windowLabel(spot: Spot, now: Date): string | null {
  if (spot.window === null) return null;
  const state = windowState(spot, now);
  if (state === 'upcoming') return t('opensAt', { time: clockTime(spot.window.start) });
  if (state === 'open') return t('openUntil', { time: clockTime(spot.window.end) });
  return null;
}
