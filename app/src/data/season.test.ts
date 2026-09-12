import { PRIZES, SEASON_END, prizeFor, seasonStatus } from './season';

const end = new Date('2026-09-26T22:00:00Z');

describe('seasonStatus', () => {
  it('is not over before the end, with positive remaining time', () => {
    const status = seasonStatus(new Date('2026-09-25T22:00:00Z'), end);
    expect(status.over).toBe(false);
    expect(status.remainingMs).toBe(24 * 60 * 60 * 1000);
  });
  it('is over exactly at the end, with zero remaining', () => {
    expect(seasonStatus(end, end)).toEqual({ over: true, remainingMs: 0 });
  });
  it('is over after the end, with zero remaining rather than negative', () => {
    expect(seasonStatus(new Date('2026-10-01T00:00:00Z'), end)).toEqual({ over: true, remainingMs: 0 });
  });
  it('defaults to the configured season end', () => {
    expect(seasonStatus(new Date(SEASON_END.getTime() - 1)).over).toBe(false);
    expect(seasonStatus(SEASON_END).over).toBe(true);
  });
});

describe('prizeFor', () => {
  it('labels ranks 1 to 3 in prize order', () => {
    expect([1, 2, 3].map(prizeFor)).toEqual(PRIZES);
  });
  it('has no prize from rank 4 onward', () => {
    expect(prizeFor(4)).toBeNull();
    expect(prizeFor(100)).toBeNull();
  });
});
