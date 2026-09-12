/**
 * Season content: when the season ends and what the top ranks win. Editing a prize or the end
 * date is a data edit here, not a code change; no other module carries either.
 */

/** Placeholder for the demo: the season ends with the festival, so it runs through 26 September, Linz time (exclusive end). */
export const SEASON_END = new Date('2026-09-27T00:00:00+02:00');

/** Prize labels for ranks 1 to 3, in rank order. */
export const PRIZES: readonly string[] = ['Festival ticket', 'Coworking pass', 'Museum entry'];

/** The prize label for a 1-based rank; null from rank 4 onward. */
export function prizeFor(rank: number): string | null {
  return PRIZES[rank - 1] ?? null;
}

/** Whether the season is over at `now` (it is from the end instant itself) and the time left, never negative. */
export function seasonStatus(now: Date, end: Date = SEASON_END): { over: boolean; remainingMs: number } {
  const remainingMs = Math.max(0, end.getTime() - now.getTime());
  return { over: remainingMs === 0, remainingMs };
}
