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
const gem: Spot = { ...base, id: 'gem-1', kind: 'gem', points: 30 };
const holdings: Holding[] = [
  { spot_id: 'lentos', player: 'lena', points: 10, held_since: '2026-09-11T10:00:00Z' },
  { spot_id: 'mariendom', player: 'tobi', points: 10, held_since: '2026-09-11T10:00:00Z' },
];

describe('pinState', () => {
  it('is free when nobody holds the spot', () => {
    expect(pinState({ ...base, id: 'poestlingberg' }, holdings, 'lena')).toBe('free');
  });
  it('is mine when I hold it', () => {
    expect(pinState(base, holdings, 'lena')).toBe('mine');
  });
  it('is theirs when someone else holds it', () => {
    expect(pinState(base, holdings, 'tobi')).toBe('theirs');
  });
  it('is gem for a gem spot regardless of holdings', () => {
    expect(pinState(gem, holdings, 'lena')).toBe('gem');
    expect(pinState(gem, [], 'lena')).toBe('gem');
  });
  it('is free for a spot id unknown to holdings', () => {
    expect(pinState({ ...base, id: 'nope' }, holdings, 'lena')).toBe('free');
  });
  it('is free with empty holdings', () => {
    expect(pinState(base, [], 'lena')).toBe('free');
  });
});
