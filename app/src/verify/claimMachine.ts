import type { Spot } from '../data/types';
import { evaluateClaim, type ClaimReading, type ClaimResult } from './evaluateClaim';
import { distanceM, type LatLng } from './geo';
import type { Thresholds } from './thresholds';

export type ClaimStep =
  | 'name'
  | 'settling'
  | 'approaching'
  | 'dwelling'
  | 'camera'
  | 'evaluating'
  | 'passed'
  | 'failed'
  | 'saveError'
  | 'closed';

export type SavedClaim = { claimId: string; previousOwner: string | null };

export type ClaimState = {
  spot: Spot;
  thresholds: Thresholds;
  step: ClaimStep;
  /** Latest high-rate position sample; null until the first one arrives. */
  sample: { position: LatLng; accuracyM: number } | null;
  distanceM: number | null;
  /** Latest compass reading; null when the device gave none. */
  heading: number | null;
  /** Consecutive seconds in range with usable accuracy. */
  dwellS: number;
  photoUri: string | null;
  /** The readings and verdict frozen at capture; a save retry re-sends these unchanged. */
  reading: ClaimReading | null;
  result: ClaimResult | null;
  saved: SavedClaim | null;
};

export type ClaimEvent =
  | { type: 'nameSet' }
  | { type: 'position'; position: LatLng; accuracyM: number }
  | { type: 'heading'; heading: number | null }
  | { type: 'tick' }
  | { type: 'capture'; photoUri: string | null }
  | { type: 'saved'; claimId: string; previousOwner: string | null }
  | { type: 'saveFailed' }
  | { type: 'tryAgain' }
  | { type: 'retrySave' }
  | { type: 'abandon' };

export function initialClaimState(args: { spot: Spot; thresholds: Thresholds; hasName: boolean }): ClaimState {
  return {
    spot: args.spot,
    thresholds: args.thresholds,
    step: args.hasName ? 'settling' : 'name',
    sample: null,
    distanceM: null,
    heading: null,
    dwellS: 0,
    photoUri: null,
    reading: null,
    result: null,
    saved: null,
  };
}

const BEFORE_CAMERA: ReadonlySet<ClaimStep> = new Set(['settling', 'approaching', 'dwelling']);

/** The claim flow's rules as a pure reducer; the flow component renders the state and forwards sensor events. */
export function transition(state: ClaimState, event: ClaimEvent): ClaimState {
  if (state.step === 'closed') return state;

  switch (event.type) {
    case 'abandon':
      return { ...state, step: 'closed' };

    case 'nameSet':
      return state.step === 'name' ? { ...state, step: 'settling' } : state;

    case 'heading':
      return { ...state, heading: event.heading };

    case 'position': {
      const sample = { position: event.position, accuracyM: event.accuracyM };
      const distance = distanceM(event.position, state.spot);
      const next = { ...state, sample, distanceM: distance };
      if (!BEFORE_CAMERA.has(state.step)) return next;
      if (event.accuracyM > state.thresholds.accuracyMaxM) return { ...next, step: 'settling', dwellS: 0 };
      if (distance > state.thresholds.distancePassM) return { ...next, step: 'approaching', dwellS: 0 };
      return { ...next, step: next.dwellS >= state.thresholds.dwellMinS ? 'camera' : 'dwelling' };
    }

    case 'tick': {
      if (state.step !== 'dwelling') return state;
      const dwellS = state.dwellS + 1;
      return { ...state, dwellS, step: dwellS >= state.thresholds.dwellMinS ? 'camera' : 'dwelling' };
    }

    case 'capture': {
      if (state.step !== 'camera' || !state.sample) return state;
      const reading: ClaimReading = { ...state.sample, heading: state.heading, dwellS: state.dwellS };
      const result = evaluateClaim(state.spot, reading, state.thresholds);
      return { ...state, step: 'evaluating', photoUri: event.photoUri, reading, result, saved: null };
    }

    case 'saved':
      if (state.step !== 'evaluating' || !state.result) return state;
      return {
        ...state,
        step: state.result.pass ? 'passed' : 'failed',
        saved: { claimId: event.claimId, previousOwner: event.previousOwner },
      };

    case 'saveFailed':
      return state.step === 'evaluating' ? { ...state, step: 'saveError' } : state;

    case 'tryAgain':
      if (state.step !== 'failed') return state;
      return { ...state, step: 'camera', photoUri: null, reading: null, result: null, saved: null };

    case 'retrySave':
      return state.step === 'saveError' ? { ...state, step: 'evaluating' } : state;
  }
}
