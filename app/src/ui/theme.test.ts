import { gemMarkerColor, pinColor, pinOutlineColor, theme } from './theme';

// Issue #21: the map pins follow docs/design/app-mockup-colour-reference.jpg.
describe('pinColor', () => {
  it('gives every pin state its own colour', () => {
    expect(new Set(Object.values(pinColor)).size).toBe(Object.keys(pinColor).length);
  });
  it('paints mine yellow and theirs the linz.at blue', () => {
    expect(pinColor.mine.toUpperCase()).toBe('#FFD21F');
    expect(pinColor.theirs).toBe(theme.primary);
  });
  it('mutes upcoming below free', () => {
    expect(pinColor.upcoming.toUpperCase()).toBe('#D3D6DF');
    expect(pinColor.free.toUpperCase()).toBe('#8E93A3');
  });
});

describe('pinOutlineColor', () => {
  it('outlines gem pins in the gem colour and the rest in white', () => {
    expect(pinOutlineColor(true)).toBe(gemMarkerColor);
    expect(pinOutlineColor(false)).toBe(theme.white);
  });
});

describe('gemMarkerColor', () => {
  it('is the pink accent and no ownership colour', () => {
    expect(gemMarkerColor).toBe(theme.accentPink);
    expect(Object.values(pinColor)).not.toContain(gemMarkerColor);
  });
});
