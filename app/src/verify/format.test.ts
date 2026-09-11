import { formatDistance, ownershipLabel } from './format';

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
  it('reads Gem for a gem', () => {
    expect(ownershipLabel('gem', null, true)).toBe('Gem');
  });
});
