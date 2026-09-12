import { useCallback, useEffect, useReducer } from 'react';
import { claimSpot } from '../data/claimSpot';
import { uploadClaimPhoto } from '../data/uploadClaimPhoto';
import type { Spot } from '../data/types';
import { initialClaimState, transition } from '../verify/claimMachine';
import type { Thresholds } from '../verify/thresholds';
import { useFlowPosition, type PositionSample } from './useFlowPosition';
import { useHeading } from './useHeading';

type Args = {
  spot: Spot;
  /** The stored display name, or null when the flow must ask for it first. */
  player: string | null;
  thresholds: Thresholds;
  /** Fires once the flow reaches `closed` (Back to map from any step). */
  onClose: () => void;
  /** Fires after a passing claim is saved, so the map can refresh ownership. */
  onSaved: () => void;
};

/**
 * Drives the claim state machine: feeds it the dedicated position and heading watchers, a 1 s tick
 * while dwelling, the `claim_spot` call while evaluating, and the photo upload once the claim row
 * exists. Holds no rules of its own.
 */
export function useClaimFlow({ spot, player, thresholds, onClose, onSaved }: Args) {
  const [state, dispatch] = useReducer(transition, { spot, thresholds, hasName: player !== null }, initialClaimState);

  const onSample = useCallback((s: PositionSample) => dispatch({ type: 'position', ...s }), []);
  const onHeading = useCallback((heading: number | null) => dispatch({ type: 'heading', heading }), []);
  useFlowPosition(onSample);
  useHeading(onHeading);

  // Dwell advances on a wall-clock tick rather than per sample: iOS stops delivering position
  // updates while the phone is still, which is exactly when a player is dwelling.
  const dwelling = state.step === 'dwelling';
  useEffect(() => {
    if (!dwelling) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [dwelling]);

  const evaluating = state.step === 'evaluating';
  useEffect(() => {
    if (!evaluating || !state.reading || !state.result || player === null) return;
    let cancelled = false;
    claimSpot({
      spot_id: spot.id,
      player,
      points: spot.points,
      passed: state.result.pass,
      distance_m: state.result.distanceM,
      heading_delta: state.result.headingDiff,
      gps_accuracy: Number.isFinite(state.reading.accuracyM) ? state.reading.accuracyM : null,
      dwell_seconds: state.reading.dwellS,
    })
      .then((saved) => {
        if (cancelled) return;
        dispatch({ type: 'saved', ...saved });
        if (state.result?.pass) onSaved();
        // Photo proof for every saved attempt, passed or not, rides behind the result: a failed
        // upload is logged and the claim stands.
        if (state.photoUri) {
          uploadClaimPhoto(saved.claimId, state.photoUri).catch((e) => console.warn('photo upload failed', e));
        }
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'saveFailed' });
      });
    return () => {
      cancelled = true;
    };
    // The reading and result are frozen while evaluating; only entering the step should send.
  }, [evaluating]);

  useEffect(() => {
    if (state.step === 'closed') onClose();
  }, [state.step, onClose]);

  return { state, dispatch };
}
