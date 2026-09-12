import { boardRows, rankPlayers } from './leaderboard';
import { applyDecay } from './decay';
import type { Holding } from '../data/types';

const at = (day: number) => `2026-09-${String(day).padStart(2, '0')}T12:00:00+00:00`;
const holding = (player: string, spot_id: string, points: number, held_since = at(1)): Holding => ({
  spot_id,
  player,
  points,
  held_since,
});

describe('rankPlayers', () => {
  it('ranks higher points first', () => {
    const rows = rankPlayers([holding('lena', 'lentos', 10), holding('tobi', 'ars', 20)]);
    expect(rows.map((r) => [r.rank, r.player, r.points])).toEqual([
      [1, 'tobi', 20],
      [2, 'lena', 10],
    ]);
  });
  it('sums the points and counts the spots of each player', () => {
    const rows = rankPlayers([holding('lena', 'lentos', 10), holding('lena', 'ars', 15), holding('tobi', 'dom', 20)]);
    expect(rows.map((r) => [r.player, r.points, r.spots])).toEqual([
      ['lena', 25, 2],
      ['tobi', 20, 1],
    ]);
  });
  it('on equal points, ranks more spots first', () => {
    const rows = rankPlayers([holding('tobi', 'dom', 20), holding('lena', 'lentos', 10), holding('lena', 'ars', 10)]);
    expect(rows.map((r) => r.player)).toEqual(['lena', 'tobi']);
  });
  it('on equal points and spots, ranks the earlier most-recent claim first', () => {
    const rows = rankPlayers([
      holding('tobi', 'dom', 10, at(1)),
      holding('tobi', 'ars', 10, at(5)),
      holding('lena', 'lentos', 10, at(3)),
      holding('lena', 'brucknerhaus', 10, at(4)),
    ]);
    expect(rows.map((r) => r.player)).toEqual(['lena', 'tobi']);
  });
  it('sets lastClaim to the max of the player’s held_since', () => {
    const rows = rankPlayers([holding('lena', 'lentos', 10, at(2)), holding('lena', 'ars', 10, at(7)), holding('lena', 'dom', 10, at(4))]);
    expect(rows[0].lastClaim).toBe(at(7));
  });
  it('gives a single player rank 1', () => {
    expect(rankPlayers([holding('lena', 'lentos', 10)])).toEqual([
      { rank: 1, player: 'lena', points: 10, spots: 1, lastClaim: at(1) },
    ]);
  });
  it('returns empty for empty input', () => {
    expect(rankPlayers([])).toEqual([]);
  });
  it('numbers ranks 1..n with no gaps, even on ties', () => {
    const rows = rankPlayers([
      holding('a', 's1', 10, at(1)),
      holding('b', 's2', 10, at(1)),
      holding('c', 's3', 10, at(1)),
      holding('d', 's4', 5, at(1)),
    ]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });
  it('counts a decayed holding for nobody once the array is filtered', () => {
    const now = new Date('2026-09-30T12:00:00Z');
    const live = applyDecay([holding('lena', 'lentos', 10, at(1)), holding('tobi', 'ars', 5, at(29))], now);
    expect(rankPlayers(live).map((r) => [r.rank, r.player, r.points])).toEqual([[1, 'tobi', 5]]);
  });
});

describe('boardRows', () => {
  const twelve = rankPlayers(Array.from({ length: 12 }, (_, i) => holding(`p${i + 1}`, `s${i + 1}`, 100 - i)));

  it('shows the top 10 and appends my row with its true rank when I am below 10', () => {
    const { top, own } = boardRows(twelve, 'p12');
    expect(top.map((r) => r.player)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']);
    expect(own).toEqual({ rank: 12, player: 'p12', points: 89, spots: 1, lastClaim: at(1) });
  });
  it('appends nothing when I am in the top 10', () => {
    expect(boardRows(twelve, 'p3').own).toBeNull();
  });
  it('appends nothing when I hold no spots', () => {
    expect(boardRows(twelve, 'nobody').own).toBeNull();
  });
  it('appends nothing when I have no name', () => {
    expect(boardRows(twelve, '').own).toBeNull();
  });
  it('shows every row when there are 10 or fewer', () => {
    const three = rankPlayers([holding('a', 's1', 3), holding('b', 's2', 2), holding('c', 's3', 1)]);
    expect(boardRows(three, 'c')).toEqual({ top: three, own: null });
  });
});
