import { initialRegion } from './region';

const pts = [
  { lat: 48.32393815, lng: 14.25870585 },
  { lat: 48.30962, lng: 14.28445 },
  { lat: 48.3005623, lng: 14.28674828 },
];

describe('initialRegion', () => {
  it('contains every spot', () => {
    const r = initialRegion(pts);
    for (const p of pts) {
      expect(Math.abs(p.lat - r.latitude)).toBeLessThan(r.latitudeDelta / 2);
      expect(Math.abs(p.lng - r.longitude)).toBeLessThan(r.longitudeDelta / 2);
    }
  });
  it('is centred on the bounding box', () => {
    const r = initialRegion(pts);
    expect(r.latitude).toBeCloseTo((48.32393815 + 48.3005623) / 2, 8);
    expect(r.longitude).toBeCloseTo((14.25870585 + 14.28674828) / 2, 8);
  });
  it('has a minimum span for a single spot', () => {
    const r = initialRegion([pts[0]]);
    expect(r.latitudeDelta).toBeGreaterThan(0);
    expect(r.longitudeDelta).toBeGreaterThan(0);
  });
  it('throws on an empty list', () => {
    expect(() => initialRegion([])).toThrow();
  });
});
