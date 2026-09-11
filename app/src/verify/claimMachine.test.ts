import { initialClaimState, transition, type ClaimEvent, type ClaimState } from './claimMachine';
import { DEFAULT_THRESHOLDS, RELAXED_THRESHOLDS } from './thresholds';
import type { Spot } from '../data/types';

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

const metresSouth = (m: number) => ({ lat: spot.lat - m / 111_000, lng: spot.lng });
const at = (m: number, accuracyM = 10): ClaimEvent => ({ type: 'position', position: metresSouth(m), accuracyM });
const tick: ClaimEvent = { type: 'tick' };
const run = (state: ClaimState, events: ClaimEvent[]) => events.reduce(transition, state);

const start = initialClaimState({ spot, thresholds: DEFAULT_THRESHOLDS, hasName: true });
const ticks = (n: number) => Array.from({ length: n }, () => tick);
/** In range, dwelt for 10 s, facing the right way: ready to capture. */
const atCamera = run(start, [at(5), { type: 'heading', heading: 30 }, ...ticks(10)]);

describe('claim machine: start', () => {
  it('asks for a name first when none is stored', () => {
    expect(initialClaimState({ spot, thresholds: DEFAULT_THRESHOLDS, hasName: false }).step).toBe('name');
  });
  it('goes straight to settling when the name is known', () => {
    expect(start.step).toBe('settling');
  });
  it('moves from name to settling once the name is set', () => {
    const s = initialClaimState({ spot, thresholds: DEFAULT_THRESHOLDS, hasName: false });
    expect(transition(s, { type: 'nameSet' }).step).toBe('settling');
  });
});

describe('claim machine: walking in from 60 m', () => {
  it('shows approaching with the distance while outside range', () => {
    const s = transition(start, at(60));
    expect(s.step).toBe('approaching');
    expect(s.distanceM).toBeGreaterThan(55);
    expect(s.distanceM).toBeLessThan(65);
  });
  it('starts dwelling once inside 40 m', () => {
    expect(run(start, [at(60), at(45), at(30)]).step).toBe('dwelling');
  });
  it('settles when the accuracy is worse than 60 m, at any distance', () => {
    expect(run(start, [at(60), at(30, 90)]).step).toBe('settling');
    expect(run(start, [at(30), at(30, 61)]).step).toBe('settling');
  });
  it('leaves settling when the accuracy recovers', () => {
    expect(run(start, [at(30, 90), at(30, 20)]).step).toBe('dwelling');
  });
});

describe('claim machine: dwell', () => {
  it('counts a second per tick while dwelling', () => {
    const s = run(start, [at(5), ...ticks(3)]);
    expect(s.step).toBe('dwelling');
    expect(s.dwellS).toBe(3);
  });
  it('does not count ticks outside range', () => {
    expect(run(start, [at(60), ...ticks(3)]).dwellS).toBe(0);
  });
  it('unlocks the capture step after 10 s in range', () => {
    expect(run(start, [at(5), ...ticks(9)]).step).toBe('dwelling');
    expect(run(start, [at(5), ...ticks(10)]).step).toBe('camera');
  });
  it('resets on leaving range', () => {
    const s = run(start, [at(5), ...ticks(6), at(50)]);
    expect(s.step).toBe('approaching');
    expect(s.dwellS).toBe(0);
    expect(run(s, [at(5), ...ticks(9)]).step).toBe('dwelling');
  });
  it('resets when the accuracy degrades mid-dwell', () => {
    expect(run(start, [at(5), ...ticks(6), at(5, 90)]).dwellS).toBe(0);
  });
  it('unlocks after 2 s with relaxed thresholds, from anywhere, ignoring accuracy', () => {
    const relaxed = initialClaimState({ spot, thresholds: RELAXED_THRESHOLDS, hasName: true });
    expect(run(relaxed, [at(3000, 500), ...ticks(2)]).step).toBe('camera');
  });
});

describe('claim machine: capture and result', () => {
  it('keeps the latest heading and position while in the camera step', () => {
    const s = run(atCamera, [{ type: 'heading', heading: 40 }, at(8)]);
    expect(s.step).toBe('camera');
    expect(s.heading).toBe(40);
    expect(s.distanceM).toBeGreaterThan(6);
  });
  it('evaluates on capture with the readings at that moment', () => {
    const s = transition(atCamera, { type: 'capture', photoUri: null });
    expect(s.step).toBe('evaluating');
    expect(s.result?.pass).toBe(true);
    expect(s.reading).toEqual({ position: metresSouth(5), accuracyM: 10, heading: 30, dwellS: 10 });
  });
  it('is passed after the save when the gates passed', () => {
    const s = run(atCamera, [{ type: 'capture', photoUri: null }, { type: 'saved', claimId: 'c1', previousOwner: 'lena' }]);
    expect(s.step).toBe('passed');
    expect(s.saved).toEqual({ claimId: 'c1', previousOwner: 'lena' });
  });
  it('is failed after the save when a gate did not pass', () => {
    const s = run(atCamera, [{ type: 'heading', heading: 200 }, { type: 'capture', photoUri: null }, { type: 'saved', claimId: 'c2', previousOwner: null }]);
    expect(s.step).toBe('failed');
    expect(s.result?.gates.heading).toBe('fail');
  });
  it('returns to the camera from failed keeping the dwell', () => {
    const failed = run(atCamera, [{ type: 'heading', heading: 200 }, { type: 'capture', photoUri: null }, { type: 'saved', claimId: 'c2', previousOwner: null }]);
    const s = transition(failed, { type: 'tryAgain' });
    expect(s.step).toBe('camera');
    expect(s.dwellS).toBe(10);
    expect(s.result).toBeNull();
  });
});

describe('claim machine: save errors', () => {
  const evaluated = transition(atCamera, { type: 'capture', photoUri: null });
  it('enters saveError keeping the result', () => {
    const s = transition(evaluated, { type: 'saveFailed' });
    expect(s.step).toBe('saveError');
    expect(s.result).toBe(evaluated.result);
  });
  it('retries the save with the same evaluation, even if the sensors moved on', () => {
    const errored = run(evaluated, [{ type: 'saveFailed' }, at(500), { type: 'heading', heading: 200 }]);
    const s = transition(errored, { type: 'retrySave' });
    expect(s.step).toBe('evaluating');
    expect(s.result).toBe(evaluated.result);
    expect(s.reading).toBe(evaluated.reading);
  });
});

describe('claim machine: abandon', () => {
  it.each(['name', 'settling', 'approaching', 'dwelling', 'camera', 'evaluating', 'passed', 'failed', 'saveError'] as const)(
    'closes from %s',
    (step) => {
      const states: Record<typeof step, ClaimState> = {
        name: initialClaimState({ spot, thresholds: DEFAULT_THRESHOLDS, hasName: false }),
        settling: start,
        approaching: transition(start, at(60)),
        dwelling: transition(start, at(5)),
        camera: atCamera,
        evaluating: transition(atCamera, { type: 'capture', photoUri: null }),
        passed: run(atCamera, [{ type: 'capture', photoUri: null }, { type: 'saved', claimId: 'c', previousOwner: null }]),
        failed: run(atCamera, [{ type: 'heading', heading: 200 }, { type: 'capture', photoUri: null }, { type: 'saved', claimId: 'c', previousOwner: null }]),
        saveError: run(atCamera, [{ type: 'capture', photoUri: null }, { type: 'saveFailed' }]),
      };
      expect(states[step].step).toBe(step);
      expect(transition(states[step], { type: 'abandon' }).step).toBe('closed');
    },
  );
  it('ignores sensor events once closed', () => {
    const closed = transition(start, { type: 'abandon' });
    expect(run(closed, [at(5), tick]).step).toBe('closed');
  });
});
