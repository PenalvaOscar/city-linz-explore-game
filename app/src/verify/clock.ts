/** The app's only source of `now`; created once at the app root and read wherever a rule depends on the time. */
export type Clock = { now: () => Date };

/**
 * The wall clock when `demoNow` is empty or does not parse. Otherwise the demo clock: `now` is `demoNow` plus the real
 * time elapsed since the clock was created, so countdowns keep ticking and windows open from the
 * chosen instant. `ticks` is the time source in epoch milliseconds, `Date.now` in the app and a
 * controlled value under test.
 */
export function createClock(demoNow: string | undefined, ticks: () => number): Clock {
  const origin = demoNow ? Date.parse(demoNow) : NaN;
  if (!Number.isFinite(origin)) return { now: () => new Date(ticks()) };
  const startTicks = ticks();
  return { now: () => new Date(origin + (ticks() - startTicks)) };
}
