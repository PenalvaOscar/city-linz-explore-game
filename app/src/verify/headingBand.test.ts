import { headingBand } from './headingBand';
import { DEFAULT_THRESHOLDS } from './thresholds';

describe('headingBand', () => {
  it('is none without a compass reading', () => {
    expect(headingBand(null, DEFAULT_THRESHOLDS)).toBe('none');
  });
  it.each([
    [0, 'green'],
    [35, 'green'],
    [35.1, 'amber'],
    [60, 'amber'],
    [61, 'red'],
    [180, 'red'],
  ])('%s° off -> %s', (diff, band) => {
    expect(headingBand(diff, DEFAULT_THRESHOLDS)).toBe(band);
  });
  it('follows the thresholds it is given', () => {
    expect(headingBand(50, { headingPassDeg: 50, headingReviewDeg: 90 })).toBe('green');
    expect(headingBand(51, { headingPassDeg: 50, headingReviewDeg: 90 })).toBe('amber');
  });
});
