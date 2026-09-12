import type { Holding } from '../data/types';

export type LeaderboardRow = {
  /** 1-based, no gaps. */
  rank: number;
  player: string;
  /** Summed points of the player's live holdings. */
  points: number;
  /** Number of live holdings. */
  spots: number;
  /** The player's most recent `held_since`. */
  lastClaim: string;
};

/**
 * Ranks players by the summed points of their live holdings. Pass the decayed array the map
 * consumes so board and pins never disagree. Order: points (higher first), then spots (more first),
 * then the earlier `lastClaim` (whoever reached their standing first wins).
 */
export function rankPlayers(holdings: Holding[]): LeaderboardRow[] {
  const byPlayer = new Map<string, Omit<LeaderboardRow, 'rank'>>();
  for (const h of holdings) {
    const row = byPlayer.get(h.player);
    if (!row) {
      byPlayer.set(h.player, { player: h.player, points: h.points, spots: 1, lastClaim: h.held_since });
      continue;
    }
    row.points += h.points;
    row.spots += 1;
    if (Date.parse(h.held_since) > Date.parse(row.lastClaim)) row.lastClaim = h.held_since;
  }
  return [...byPlayer.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.spots - a.spots ||
        Date.parse(a.lastClaim) - Date.parse(b.lastClaim),
    )
    .map((row, i) => ({ rank: i + 1, ...row }));
}

/** Rows the sheet shows before the local player's own row is appended. */
export const BOARD_SIZE = 10;

/**
 * The top rows the sheet lists, plus the local player's own row when it falls below them (null when
 * it is already listed, when `player` holds nothing, or when no name is stored).
 */
export function boardRows(rows: LeaderboardRow[], player: string): { top: LeaderboardRow[]; own: LeaderboardRow | null } {
  const top = rows.slice(0, BOARD_SIZE);
  const mine = player ? rows.find((r) => r.player === player) ?? null : null;
  return { top, own: mine && mine.rank > BOARD_SIZE ? mine : null };
}
