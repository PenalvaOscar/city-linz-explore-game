import { distanceM, headingDiff, headingTurn } from './geo';

const hauptplatz = { lat: 48.30601368, lng: 14.28628506 };
const mariendom = { lat: 48.3005623, lng: 14.28674828 };

describe('distanceM', () => {
  it('Hauptplatz to Mariendom is about 610 m', () => {
    const d = distanceM(hauptplatz, mariendom);
    expect(d).toBeGreaterThan(610 * 0.95);
    expect(d).toBeLessThan(610 * 1.05);
  });
  it('is zero for the same point', () => {
    expect(distanceM(hauptplatz, hauptplatz)).toBe(0);
  });
  it('is symmetric', () => {
    expect(distanceM(hauptplatz, mariendom)).toBeCloseTo(distanceM(mariendom, hauptplatz), 6);
  });
});

describe('headingDiff', () => {
  it.each([
    [350, 10, 20],
    [0, 180, 180],
    [90, 90, 0],
    [359, 1, 2],
  ])('(%i, %i) -> %i', (a, b, expected) => {
    expect(headingDiff(a, b)).toBe(expected);
  });
});

describe('headingTurn', () => {
  it.each([
    [10, 40, 30],
    [350, 10, 20],
    [10, 350, -20],
    [90, 90, 0],
    [0, 180, -180],
    [180, 0, -180],
    [270, 0, 90],
  ])('facing %i, target %i -> turn %i', (heading, target, expected) => {
    expect(headingTurn(heading, target)).toBe(expected);
  });
  it('agrees with headingDiff in magnitude', () => {
    expect(Math.abs(headingTurn(350, 10))).toBe(headingDiff(350, 10));
    expect(Math.abs(headingTurn(359, 1))).toBe(headingDiff(359, 1));
  });
});
