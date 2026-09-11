import { headingGlyph } from './headingGlyph';

describe('headingGlyph', () => {
  it('is nothing when the heading is unknown', () => {
    expect(headingGlyph(null)).toBeNull();
  });
  it.each([
    [0, 0],
    [90, 90],
    [214, 214],
    [359.6, 359.6],
  ])('%s° -> rotation %s', (heading, rotation) => {
    expect(headingGlyph(heading)).toEqual({ rotation });
  });
  it('wraps headings outside 0..360 from unvalidated data', () => {
    expect(headingGlyph(360)).toEqual({ rotation: 0 });
    expect(headingGlyph(-90)).toEqual({ rotation: 270 });
  });
});
