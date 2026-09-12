import { pinState } from './pinState';
import type { Holding, Spot } from '../data/types';

const base: Spot = {
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
// Main Square on Sat 12 September: 12:00 to 18:00 Linz time (10:00 to 16:00 UTC).
const gem: Spot = {
  ...base,
  id: 'gem-main-square-linz-0912',
  kind: 'gem',
  points: 30,
  window: { start: '2026-09-12T12:00:00+02:00', end: '2026-09-12T18:00:00+02:00', locationId: 'loc' },
};
const holdings: Holding[] = [
  { spot_id: 'lentos', player: 'lena', points: 10, held_since: '2026-09-11T10:00:00Z' },
  { spot_id: 'mariendom', player: 'tobi', points: 10, held_since: '2026-09-11T10:00:00Z' },
  { spot_id: gem.id, player: 'lena', points: 30, held_since: '2026-09-12T10:30:00Z' },
];
const beforeWindow = new Date('2026-09-12T08:00:00Z');
const inWindow = new Date('2026-09-12T11:00:00Z');

describe('pinState, Linz spot', () => {
  it('is free when nobody holds the spot', () => {
    expect(pinState({ ...base, id: 'poestlingberg' }, holdings, 'lena', inWindow)).toBe('free');
  });
  it('is mine when I hold it', () => {
    expect(pinState(base, holdings, 'lena', inWindow)).toBe('mine');
  });
  it('is theirs when someone else holds it', () => {
    expect(pinState(base, holdings, 'tobi', inWindow)).toBe('theirs');
  });
  it('is free for a spot id unknown to holdings', () => {
    expect(pinState({ ...base, id: 'nope' }, holdings, 'lena', inWindow)).toBe('free');
  });
  it('is free with empty holdings', () => {
    expect(pinState(base, [], 'lena', inWindow)).toBe('free');
  });
  it('ignores the time: a Linz spot has no window', () => {
    expect(pinState(base, holdings, 'lena', new Date('2020-01-01T00:00:00Z'))).toBe('mine');
  });
});

describe('pinState, gem before its window', () => {
  it('is upcoming with no holding', () => {
    expect(pinState(gem, [], 'lena', beforeWindow)).toBe('upcoming');
  });
  it('is upcoming when I hold it', () => {
    expect(pinState(gem, holdings, 'lena', beforeWindow)).toBe('upcoming');
  });
  it('is upcoming when someone else holds it', () => {
    expect(pinState(gem, holdings, 'tobi', beforeWindow)).toBe('upcoming');
  });
});

describe('pinState, gem inside its window', () => {
  it('is free with no holding', () => {
    expect(pinState(gem, [], 'lena', inWindow)).toBe('free');
  });
  it('is mine when I hold it', () => {
    expect(pinState(gem, holdings, 'lena', inWindow)).toBe('mine');
  });
  it('is theirs when someone else holds it', () => {
    expect(pinState(gem, holdings, 'tobi', inWindow)).toBe('theirs');
  });
});
