import { initialRegion, regionToBounds } from './region';

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

describe('regionToBounds', () => {
  it('returns [[south, west], [north, east]] around the region centre', () => {
    const b = regionToBounds({ latitude: 48.3, longitude: 14.28, latitudeDelta: 0.02, longitudeDelta: 0.04 });
    expect(b[0][0]).toBeCloseTo(48.29, 10);
    expect(b[0][1]).toBeCloseTo(14.26, 10);
    expect(b[1][0]).toBeCloseTo(48.31, 10);
    expect(b[1][1]).toBeCloseTo(14.3, 10);
  });
  it('round-trips initialRegion so every spot lies inside the bounds', () => {
    const [[south, west], [north, east]] = regionToBounds(initialRegion(pts));
    for (const p of pts) {
      expect(p.lat).toBeGreaterThan(south);
      expect(p.lat).toBeLessThan(north);
      expect(p.lng).toBeGreaterThan(west);
      expect(p.lng).toBeLessThan(east);
    }
  });
});
