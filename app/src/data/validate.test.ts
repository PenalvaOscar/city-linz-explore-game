import { LINZ_BOUNDS, validateSpots } from './validate';
import type { Spot } from './types';

const spot = (over: Partial<Spot>): Spot => ({
  id: 'lentos',
  name: { en: 'Lentos' },
  teaser: { en: '' },
  story: { en: '' },
  lat: 48.30863,
  lng: 14.28884,
  heading: null,
  kind: 'linz',
  points: 10,
  photo: 'lentos.jpg',
  window: null,
  ...over,
});
const index = { 'lentos.jpg': 1, 'mariendom.jpg': 2 };

describe('validateSpots', () => {
  it('accepts valid data', () => {
    expect(() => validateSpots([spot({}), spot({ id: 'mariendom', photo: 'mariendom.jpg' })], index)).not.toThrow();
  });
  it('rejects duplicate ids', () => {
    expect(() => validateSpots([spot({}), spot({ photo: 'mariendom.jpg' })], index)).toThrow(/duplicate.*lentos/i);
  });
  it('rejects a photo missing from the index', () => {
    expect(() => validateSpots([spot({ photo: 'nope.jpg' })], index)).toThrow(/nope\.jpg/);
  });
  it('rejects coordinates outside Linz', () => {
    expect(() => validateSpots([spot({ lat: 48.2 })], index)).toThrow(/outside/i);
    expect(() => validateSpots([spot({ lng: LINZ_BOUNDS.maxLng + 1 })], index)).toThrow(/outside/i);
  });
  it('rejects an unknown kind', () => {
    expect(() => validateSpots([spot({ kind: 'moon' as Spot['kind'] })], index)).toThrow(/kind/i);
  });
  it('rejects non-positive points', () => {
    expect(() => validateSpots([spot({ points: 0 })], index)).toThrow(/points/i);
  });
});
