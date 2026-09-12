import { DEFAULT_THRESHOLDS, RELAXED_THRESHOLDS } from './thresholds';
import { evaluateClaim, type ClaimReading } from './evaluateClaim';
import type { Spot } from '../data/types';

// Tabakfabrik gem: headed spot from data/spots.json.
const spot: Spot = {
  id: 'tabakfabrik-gem',
  name: { en: 'Tabakfabrik' },
  teaser: { en: '' },
  story: { en: '' },
  lat: 48.3124648,
  lng: 14.2993062,
  heading: 23,
  kind: 'gem',
  points: 30,
  photo: 'tabakfabrik.jpg',
  window: null,
};
const headless: Spot = { ...spot, id: 'lentos', heading: null, kind: 'linz', points: 10 };

// 1° of latitude is ~111 km, so 0.0009° ≈ 100 m due south.
const atSpot = { lat: spot.lat, lng: spot.lng };
const metresSouth = (m: number) => ({ lat: spot.lat - m / 111_000, lng: spot.lng });

const good: ClaimReading = { position: atSpot, accuracyM: 12, heading: 30, dwellS: 12 };
const T = DEFAULT_THRESHOLDS;

describe('evaluateClaim: the three fixture cases', () => {
  it('passes at the right spot facing the right way', () => {
    const r = evaluateClaim(spot, good, T);
    expect(r.pass).toBe(true);
    expect(r.gates).toEqual({ distance: 'pass', accuracy: 'pass', heading: 'pass', dwell: 'pass' });
    expect(r.distanceM).toBeCloseTo(0, 3);
    expect(r.headingDiff).toBe(7);
  });
  it('fails at the right spot with the heading off by more than 60°', () => {
    const r = evaluateClaim(spot, { ...good, heading: 110 }, T);
    expect(r.pass).toBe(false);
    expect(r.gates.heading).toBe('fail');
    expect(r.gates.distance).toBe('pass');
    expect(r.headingDiff).toBe(87);
  });
  it('fails at the wrong spot ~100 m away', () => {
    const r = evaluateClaim(spot, { ...good, position: metresSouth(100) }, T);
    expect(r.pass).toBe(false);
    expect(r.gates.distance).toBe('fail');
    expect(r.gates.heading).toBe('pass');
    expect(r.distanceM).toBeGreaterThan(95);
    expect(r.distanceM).toBeLessThan(105);
  });
});

describe('evaluateClaim: band edges', () => {
  it('distance: 40 m passes, just over is review, 80 m is review, over 80 m fails', () => {
    expect(evaluateClaim(spot, { ...good, position: metresSouth(39.9) }, T).gates.distance).toBe('pass');
    expect(evaluateClaim(spot, { ...good, position: metresSouth(41) }, T).gates.distance).toBe('review');
    expect(evaluateClaim(spot, { ...good, position: metresSouth(79.5) }, T).gates.distance).toBe('review');
    expect(evaluateClaim(spot, { ...good, position: metresSouth(81) }, T).gates.distance).toBe('fail');
  });
  it('heading: 35° passes, 35.1° is review, 60° is review, 60.1° fails', () => {
    expect(evaluateClaim(spot, { ...good, heading: 23 + 35 }, T).gates.heading).toBe('pass');
    expect(evaluateClaim(spot, { ...good, heading: 23 + 35.1 }, T).gates.heading).toBe('review');
    expect(evaluateClaim(spot, { ...good, heading: 23 + 60 }, T).gates.heading).toBe('review');
    expect(evaluateClaim(spot, { ...good, heading: 23 + 60.1 }, T).gates.heading).toBe('fail');
  });
  it('heading is wrap-safe across north', () => {
    expect(evaluateClaim(spot, { ...good, heading: 355 }, T).headingDiff).toBe(28);
    expect(evaluateClaim(spot, { ...good, heading: 355 }, T).gates.heading).toBe('pass');
  });
  it('accuracy: 60 m passes, worse fails', () => {
    expect(evaluateClaim(spot, { ...good, accuracyM: 60 }, T).gates.accuracy).toBe('pass');
    expect(evaluateClaim(spot, { ...good, accuracyM: 60.5 }, T).gates.accuracy).toBe('fail');
  });
  it('dwell: 9 s fails, 10 s passes against a 10 s minimum', () => {
    const T10 = { ...T, dwellMinS: 10 };
    expect(evaluateClaim(spot, { ...good, dwellS: 9 }, T10).gates.dwell).toBe('fail');
    expect(evaluateClaim(spot, { ...good, dwellS: 10 }, T10).gates.dwell).toBe('pass');
  });
});

describe('evaluateClaim: heading availability', () => {
  it('skips the heading gate for a spot without a heading and still passes', () => {
    const r = evaluateClaim(headless, { ...good, heading: 180 }, T);
    expect(r.gates.heading).toBe('skipped');
    expect(r.headingDiff).toBeNull();
    expect(r.pass).toBe(true);
  });
  it('fails the heading gate when the compass gives no reading on a headed spot', () => {
    const r = evaluateClaim(spot, { ...good, heading: null }, T);
    expect(r.gates.heading).toBe('fail');
    expect(r.headingDiff).toBeNull();
    expect(r.pass).toBe(false);
  });
});

describe('evaluateClaim: relaxed thresholds', () => {
  it('passes from far away with poor accuracy and a short dwell', () => {
    const r = evaluateClaim(spot, { position: metresSouth(3000), accuracyM: 500, heading: 30, dwellS: 2 }, RELAXED_THRESHOLDS);
    expect(r.pass).toBe(true);
    expect(r.gates).toEqual({ distance: 'pass', accuracy: 'pass', heading: 'pass', dwell: 'pass' });
  });
  it('still enforces the heading', () => {
    const r = evaluateClaim(spot, { position: metresSouth(3000), accuracyM: 500, heading: 200, dwellS: 2 }, RELAXED_THRESHOLDS);
    expect(r.pass).toBe(false);
    expect(r.gates.heading).toBe('fail');
  });
  it('records the real distance even though the gate is unlimited', () => {
    const r = evaluateClaim(spot, { position: metresSouth(3000), accuracyM: 500, heading: 30, dwellS: 2 }, RELAXED_THRESHOLDS);
    expect(r.distanceM).toBeGreaterThan(2900);
  });
});

describe('evaluateClaim: pass is never blended', () => {
  it('is false whenever any gate is review', () => {
    expect(evaluateClaim(spot, { ...good, position: metresSouth(50) }, T).pass).toBe(false);
    expect(evaluateClaim(spot, { ...good, heading: 23 + 45 }, T).pass).toBe(false);
  });
  it('is false when only accuracy fails', () => {
    expect(evaluateClaim(spot, { ...good, accuracyM: 90 }, T).pass).toBe(false);
  });
  it('is false when only dwell fails', () => {
    expect(evaluateClaim(spot, { ...good, dwellS: 3 }, { ...T, dwellMinS: 10 }).pass).toBe(false);
  });
});
