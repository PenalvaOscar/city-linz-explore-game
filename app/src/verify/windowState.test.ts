import { windowState } from './windowState';
import type { Spot } from '../data/types';

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
const at = (iso: string) => new Date(iso);

describe('windowState', () => {
  it('is always open for a Linz spot', () => {
    expect(windowState(base, at('2020-01-01T00:00:00Z'))).toBe('open');
    expect(windowState(base, at('2030-01-01T00:00:00Z'))).toBe('open');
  });
});

describe('windowState, gem inside its window', () => {
  it('is open at start', () => {
    expect(windowState(gem, at('2026-09-12T10:00:00Z'))).toBe('open');
  });
  it('is open one second before end', () => {
    expect(windowState(gem, at('2026-09-12T15:59:59Z'))).toBe('open');
  });
  it('is closed at end', () => {
    expect(windowState(gem, at('2026-09-12T16:00:00Z'))).toBe('closed');
  });
});

describe('windowState, gem outside its window', () => {
  it('is upcoming earlier on the same local day', () => {
    expect(windowState(gem, at('2026-09-12T09:59:59Z'))).toBe('upcoming');
  });
  it('is upcoming from local midnight, which is 22:00 UTC the evening before', () => {
    expect(windowState(gem, at('2026-09-11T22:00:00Z'))).toBe('upcoming');
  });
  it('is closed on the previous day, one second before local midnight', () => {
    expect(windowState(gem, at('2026-09-11T21:59:59Z'))).toBe('closed');
  });
  it('is closed on the next day', () => {
    expect(windowState(gem, at('2026-09-13T10:00:00Z'))).toBe('closed');
  });
});

// Regression guard: windowState must never reach for a local-time API, so the device zone cannot change the answer.
describe('windowState, device time zone', () => {
  const instants = ['2026-09-11T21:59:59Z', '2026-09-11T22:00:00Z', '2026-09-12T09:59:59Z', '2026-09-12T10:00:00Z', '2026-09-12T16:00:00Z'];
  const original = process.env.TZ;
  afterAll(() => { process.env.TZ = original; });

  it('gives the same answer in Auckland, Los Angeles and Linz', () => {
    const answers = ['Pacific/Auckland', 'America/Los_Angeles', 'Europe/Vienna'].map((zone) => {
      process.env.TZ = zone;
      return instants.map((iso) => windowState(gem, at(iso)));
    });
    expect(answers[0]).toEqual(['closed', 'upcoming', 'upcoming', 'open', 'closed']);
    expect(answers[1]).toEqual(answers[0]);
    expect(answers[2]).toEqual(answers[0]);
  });
});

describe('windowState, malformed window', () => {
  it('is closed rather than claimable when the window does not parse', () => {
    const broken: Spot = { ...gem, window: { start: 'noon', end: 'evening', locationId: 'loc' } };
    expect(windowState(broken, at('2026-09-12T12:00:00Z'))).toBe('closed');
  });
});
