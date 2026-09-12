import { spots } from './spots';
import { photos } from './photos';
import { validateSpots } from './validate';
import festival from '../../../data/ars-electronica-notion-export.json';

const gems = spots.filter((s) => s.kind === 'gem');
const linz = spots.filter((s) => s.kind === 'linz');
const OFFSET = /\+02:00$/;

describe('bundled spot data', () => {
  it('is valid against the photo index', () => {
    expect(() => validateSpots(spots, photos)).not.toThrow();
    expect(spots.length).toBeGreaterThanOrEqual(6);
  });
  it('has no window on any Linz spot', () => {
    expect(linz.length).toBeGreaterThanOrEqual(6);
    for (const s of linz) expect(s.window).toBeNull();
  });
});

describe('generated gems', () => {
  it('exist for Main Square Linz on every festival day it has slots, 9 to 13 September', () => {
    const ids = gems.map((g) => g.id).sort();
    expect(ids).toEqual([
      'gem-main-square-linz-0909',
      'gem-main-square-linz-0910',
      'gem-main-square-linz-0911',
      'gem-main-square-linz-0912',
      'gem-main-square-linz-0913',
    ]);
  });
  it('carry a window with start before end on the same local date, at +02:00', () => {
    for (const g of gems) {
      expect(g.window).not.toBeNull();
      const { start, end } = g.window!;
      expect(start).toMatch(OFFSET);
      expect(end).toMatch(OFFSET);
      expect(start.slice(0, 10)).toBe(end.slice(0, 10));
      expect(Date.parse(start)).toBeLessThan(Date.parse(end));
      expect(g.id.endsWith(start.slice(5, 7) + start.slice(8, 10))).toBe(true);
    }
  });
  it('point at a location present in the festival export', () => {
    const locationIds = new Set(festival.locations.map((l) => l.canonical_id));
    for (const g of gems) expect(locationIds.has(g.window!.locationId)).toBe(true);
  });
  it('are worth 30 points, or 50 on a day with a highlighted slot', () => {
    for (const g of gems) expect([30, 50]).toContain(g.points);
    // Main Square has a highlighted OpenDemocracyLab slot on every day of the festival.
    for (const g of gems.filter((g) => g.window!.locationId === '34238ddb450c81ac8432eab6e4831002')) {
      expect(g.points).toBe(50);
    }
  });
  it('carry the festival name with a day suffix, the window as teaser and a programme story', () => {
    const nameOf = new Map(festival.locations.map((l) => [l.canonical_id, l['Name EN']]));
    for (const g of gems) {
      expect(g.name.en).toBe(`${nameOf.get(g.window!.locationId)} · ${g.teaser.en.slice(0, 3)} ${Number(g.window!.start.slice(8, 10))}`);
      expect(g.teaser.en).toMatch(/^(Wed|Thu|Fri|Sat|Sun) \d{2}:\d{2} to \d{2}:\d{2}$/);
      expect(g.story.en.length).toBeGreaterThan(0);
    }
  });
});
