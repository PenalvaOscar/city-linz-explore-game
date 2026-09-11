import { spots } from './spots';
import { photos } from './photos';
import { validateSpots } from './validate';

describe('bundled spot data', () => {
  it('is valid against the photo index', () => {
    expect(() => validateSpots(spots, photos)).not.toThrow();
    expect(spots.length).toBeGreaterThanOrEqual(6);
  });
});
