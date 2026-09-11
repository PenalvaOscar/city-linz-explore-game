import { t } from '../ui/strings';
import type { ClaimReading, ClaimResult } from './evaluateClaim';
import type { Thresholds } from './thresholds';

/** Result title from the owner before the claim: nobody → Claimed, me → Reclaimed, anyone else → Stolen from them. */
export function outcomeLabel(previousOwner: string | null, me: string): string {
  if (previousOwner === null) return t('claimed');
  if (previousOwner === me) return t('reclaimed');
  return t('stolenFrom', { name: previousOwner });
}

/** One line per non-passing gate, with the reading and the limit; near misses read "Nearly", wide ones "Wrong place/way". */
export function gateFailureLines(result: ClaimResult, reading: ClaimReading, thresholds: Thresholds): string[] {
  const lines: string[] = [];
  const { gates } = result;

  if (gates.distance !== 'pass') {
    const prefix = gates.distance === 'review' ? t('failNearly') : t('failWrongPlace');
    lines.push(prefix + t('failDistance', { distance: Math.round(result.distanceM), range: thresholds.distancePassM }));
  }
  if (gates.accuracy !== 'pass') {
    lines.push(t('failAccuracy', { accuracy: Math.round(reading.accuracyM), limit: thresholds.accuracyMaxM }));
  }
  if (gates.heading === 'review' || gates.heading === 'fail') {
    if (result.headingDiff === null) {
      lines.push(t('failNoCompass'));
    } else {
      const prefix = gates.heading === 'review' ? t('failNearly') : t('failWrongWay');
      lines.push(prefix + t('failHeading', { diff: Math.round(result.headingDiff), limit: thresholds.headingPassDeg }));
    }
  }
  if (gates.dwell !== 'pass') {
    lines.push(t('failDwell', { dwell: reading.dwellS, limit: thresholds.dwellMinS }));
  }
  return lines;
}
