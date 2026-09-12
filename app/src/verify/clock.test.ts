import { createClock } from './clock';

/** An elapsed-time source under test control: real elapsed time stands in as a settable number. */
const ticker = (start = 1_000) => {
  let ticks = start;
  return { ticks: () => ticks, advance: (ms: number) => { ticks += ms; } };
};

describe('createClock', () => {
  it('starts at the demo instant when one is set', () => {
    const clock = createClock('2026-09-12T14:00:00+02:00', ticker().ticks);
    expect(clock.now().toISOString()).toBe('2026-09-12T12:00:00.000Z');
  });
});

describe('createClock, advancing', () => {
  it('advances the demo instant by the elapsed time', () => {
    const time = ticker();
    const clock = createClock('2026-09-12T14:00:00+02:00', time.ticks);
    time.advance(90 * 60 * 1000);
    expect(clock.now().toISOString()).toBe('2026-09-12T13:30:00.000Z');
  });
  it('counts elapsed time from creation, not from zero', () => {
    const time = ticker(5_000_000);
    const clock = createClock('2026-09-12T14:00:00+02:00', time.ticks);
    expect(clock.now().toISOString()).toBe('2026-09-12T12:00:00.000Z');
  });
});

describe('createClock, wall clock', () => {
  it('is the wall clock when no demo instant is set', () => {
    const time = ticker(Date.parse('2026-09-12T12:00:00Z'));
    const clock = createClock(undefined, time.ticks);
    expect(clock.now().toISOString()).toBe('2026-09-12T12:00:00.000Z');
    time.advance(60_000);
    expect(clock.now().toISOString()).toBe('2026-09-12T12:01:00.000Z');
  });
  it('treats an empty demo instant as unset', () => {
    const time = ticker(Date.parse('2026-09-12T12:00:00Z'));
    expect(createClock('', time.ticks).now().toISOString()).toBe('2026-09-12T12:00:00.000Z');
  });
});

describe('createClock, bad input', () => {
  it('falls back to the wall clock when the demo instant does not parse', () => {
    const time = ticker(Date.parse('2026-09-12T12:00:00Z'));
    expect(createClock('yesterday', time.ticks).now().toISOString()).toBe('2026-09-12T12:00:00.000Z');
  });
});
