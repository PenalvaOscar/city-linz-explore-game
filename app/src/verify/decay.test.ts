import { applyDecay } from './decay';
import { ownershipLabel } from './format';
import { pinState } from './pinState';
import type { Holding, Spot } from '../data/types';

const now = new Date('2026-09-15T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const holding = (spot_id: string, held_since: string): Holding => ({ spot_id, player: 'lena', points: 10, held_since });
const lentos: Spot = {
  id: 'lentos',
  name: { en: 'Lentos' },
  teaser: { en: '' },
  story: { en: '' },
  lat: 48.3,
  lng: 14.28,
  heading: null,
  kind: 'linz',
  points: 10,
  photo: 'lentos.jpg',
  window: null,
};

describe('applyDecay', () => {
  it('keeps a holding 13 days 23 hours old', () => {
    const h = holding('lentos', daysAgo(13 + 23 / 24));
    expect(applyDecay([h], now)).toEqual([h]);
  });
  it('drops a holding exactly 14 days old', () => {
    expect(applyDecay([holding('lentos', daysAgo(14))], now)).toEqual([]);
  });
  it('drops a holding 15 days old', () => {
    expect(applyDecay([holding('lentos', daysAgo(15))], now)).toEqual([]);
  });
  it('treats a gem holding the same as any other', () => {
    expect(applyDecay([holding('gem-1', daysAgo(15))], now)).toEqual([]);
    const fresh = holding('gem-1', daysAgo(1));
    expect(applyDecay([fresh], now)).toEqual([fresh]);
  });
  it('returns empty for empty input', () => {
    expect(applyDecay([], now)).toEqual([]);
  });
  it('parses the timestamptz shape Supabase returns (microseconds, +00:00 offset)', () => {
    const h = holding('lentos', '2026-09-14T12:00:00.123456+00:00');
    expect(applyDecay([h], now)).toEqual([h]);
  });
  it('drops a holding whose held_since does not parse', () => {
    expect(applyDecay([holding('lentos', 'not a date')], now)).toEqual([]);
  });
  it('keeps only the live holdings of a mixed list, in order', () => {
    const a = holding('a', daysAgo(0));
    const b = holding('b', daysAgo(20));
    const c = holding('c', daysAgo(13));
    expect(applyDecay([a, b, c], now)).toEqual([a, c]);
  });
  it('makes pinState and the ownership label decay-aware once the array is filtered', () => {
    const live = applyDecay([holding('lentos', daysAgo(15))], now);
    const state = pinState(lentos, live, 'tobi', now);
    expect(state).toBe('free');
    expect(ownershipLabel(state, live.find((h) => h.spot_id === 'lentos')?.player ?? null, true)).toBe('Free');
  });
});
