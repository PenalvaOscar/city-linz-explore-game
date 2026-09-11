import type { Spot } from '../data/types';
import { distanceM, headingDiff, type LatLng } from './geo';
import type { Thresholds } from './thresholds';

/** The sensor readings at the moment of capture. */
export type ClaimReading = {
  position: LatLng;
  accuracyM: number;
  /** Compass heading in degrees, null when the device gave no reading. */
  heading: number | null;
  /** Consecutive seconds spent within range before capture. */
  dwellS: number;
};

export type BandGate = 'pass' | 'review' | 'fail';
export type ClaimGates = {
  distance: BandGate;
  accuracy: 'pass' | 'fail';
  heading: BandGate | 'skipped';
  dwell: 'pass' | 'fail';
};

export type ClaimResult = {
  /** True only when every gate is pass or skipped; gates are never blended (ADR-0002). */
  pass: boolean;
  distanceM: number;
  /** Degrees off the reference heading, null when the spot has none or the compass gave no reading. */
  headingDiff: number | null;
  gates: ClaimGates;
};

function band(value: number, pass: number, review: number): BandGate {
  if (value <= pass) return 'pass';
  if (value <= review) return 'review';
  return 'fail';
}

/** Verifies a claim against the four independent gates. Pure: thresholds come from the caller. */
export function evaluateClaim(spot: Spot, reading: ClaimReading, thresholds: Thresholds): ClaimResult {
  const distance = distanceM(reading.position, spot);
  const diff = spot.heading === null || reading.heading === null ? null : headingDiff(reading.heading, spot.heading);

  let heading: ClaimGates['heading'];
  if (spot.heading === null) heading = 'skipped';
  else if (diff === null) heading = 'fail';
  else heading = band(diff, thresholds.headingPassDeg, thresholds.headingReviewDeg);

  const gates: ClaimGates = {
    distance: band(distance, thresholds.distancePassM, thresholds.distanceReviewM),
    accuracy: reading.accuracyM <= thresholds.accuracyMaxM ? 'pass' : 'fail',
    heading,
    dwell: reading.dwellS >= thresholds.dwellMinS ? 'pass' : 'fail',
  };
  const pass = Object.values(gates).every((g) => g === 'pass' || g === 'skipped');
  return { pass, distanceM: distance, headingDiff: diff, gates };
}
