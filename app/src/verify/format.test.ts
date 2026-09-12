import { formatDistance, formatRemaining, ownershipLabel, windowLabel } from './format';
import type { Spot } from '../data/types';

describe('formatDistance', () => {
  it('is a dash without a distance', () => {
    expect(formatDistance(null)).toBe('—');
  });
  it('rounds metres below 1 km', () => {
    expect(formatDistance(0)).toBe('0 m');
    expect(formatDistance(612.4)).toBe('612 m');
    expect(formatDistance(999.6)).toBe('1.0 km');
  });
  it('uses km with one decimal from 1 km', () => {
    expect(formatDistance(1000)).toBe('1.0 km');
    expect(formatDistance(1234)).toBe('1.2 km');
  });
});

describe('ownershipLabel', () => {
  it('reads unavailable when holdings could not be loaded', () => {
    expect(ownershipLabel('free', null, false)).toBe('Ownership unavailable');
  });
  it('reads unavailable even with a stale owner after the backend went away', () => {
    expect(ownershipLabel('theirs', 'lena', false)).toBe('Ownership unavailable');
  });
  it('reads Free for a free spot', () => {
    expect(ownershipLabel('free', null, true)).toBe('Free');
  });
  it('names the owner for theirs', () => {
    expect(ownershipLabel('theirs', 'lena', true)).toBe('Owned by lena');
  });
  it('reads Yours for mine', () => {
    expect(ownershipLabel('mine', 'me', true)).toBe('Yours');
  });
  it('reads Free for an upcoming gem: the app gates claims before the window, so no holding is expected', () => {
    expect(ownershipLabel('upcoming', null, true)).toBe('Free');
  });
  it('reads unavailable for an upcoming gem when holdings could not be loaded', () => {
    expect(ownershipLabel('upcoming', null, false)).toBe('Ownership unavailable');
  });
});

describe('windowLabel', () => {
  const linz: Spot = {
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
    ...linz,
    id: 'gem-main-square-linz-0912',
    kind: 'gem',
    points: 30,
    window: { start: '2026-09-12T12:00:00+02:00', end: '2026-09-12T18:00:00+02:00', locationId: 'loc' },
  };

  it('is absent for a Linz spot', () => {
    expect(windowLabel(linz, new Date('2026-09-12T11:00:00Z'))).toBeNull();
  });
  it('names the opening time in Linz time while the gem is upcoming', () => {
    expect(windowLabel(gem, new Date('2026-09-12T08:00:00Z'))).toBe('Opens at 12:00');
  });
  it('names the closing time in Linz time while the gem is open', () => {
    expect(windowLabel(gem, new Date('2026-09-12T11:00:00Z'))).toBe('Open until 18:00');
  });
  it('is absent once the gem is closed', () => {
    expect(windowLabel(gem, new Date('2026-09-12T16:00:00Z'))).toBeNull();
  });
  it('takes the time from the window string, not the device time zone', () => {
    const original = process.env.TZ;
    process.env.TZ = 'Pacific/Auckland';
    try {
      expect(windowLabel(gem, new Date('2026-09-12T08:00:00Z'))).toBe('Opens at 12:00');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('formatRemaining', () => {
  const h = 60 * 60 * 1000;
  it('shows days and hours from one day on', () => {
    expect(formatRemaining(14 * 24 * h + 3 * h + 20 * 60 * 1000)).toBe('14 d 3 h');
    expect(formatRemaining(24 * h)).toBe('1 d 0 h');
  });
  it('shows hours and minutes below a day', () => {
    expect(formatRemaining(5 * h + 7 * 60 * 1000 + 59 * 1000)).toBe('5 h 7 min');
    expect(formatRemaining(23 * h + 59 * 60 * 1000 + 59 * 1000)).toBe('23 h 59 min');
  });
  it('shows minutes only below an hour, down to zero', () => {
    expect(formatRemaining(12 * 60 * 1000)).toBe('12 min');
    expect(formatRemaining(0)).toBe('0 min');
  });
});
