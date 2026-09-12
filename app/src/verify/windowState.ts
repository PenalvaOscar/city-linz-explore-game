import type { Spot } from '../data/types';

export type WindowState = 'upcoming' | 'open' | 'closed';

/** Date prefix and UTC offset of an ISO string such as `2026-09-12T12:00:00+02:00`. */
const WINDOW_ISO = /^(\d{4}-\d{2}-\d{2})T.*(Z|[+-]\d{2}:\d{2})$/;

/**
 * Where `now` stands relative to a spot's window. A Linz spot has no window and is always open. A gem
 * is open from `start` up to but not including `end`, upcoming earlier on the window's local date and
 * closed otherwise, including earlier and later days. The local date is the date prefix of the window
 * string with its own offset, never the device time zone, so every phone gets the same answer.
 */
export function windowState(spot: Spot, now: Date): WindowState {
  if (spot.window === null) return 'open';
  const t = now.getTime();
  const start = Date.parse(spot.window.start);
  const end = Date.parse(spot.window.end);
  if (start <= t && t < end) return 'open';
  const match = WINDOW_ISO.exec(spot.window.start);
  if (match === null) return 'closed';
  const dayStart = Date.parse(`${match[1]}T00:00:00${match[2]}`);
  if (dayStart <= t && t < start) return 'upcoming';
  return 'closed';
}
