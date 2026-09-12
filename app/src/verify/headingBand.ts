import type { Thresholds } from './thresholds';

/** Colour band of the heading indicator: on target, near miss, wrong way, or no compass reading. */
export type HeadingBand = 'green' | 'amber' | 'red' | 'none';

/**
 * The one rule for the capture step's heading indicator, cut at the same limits as the heading
 * gate so the shutter unlocks exactly where the claim would pass. The theme maps bands to colours.
 */
export function headingBand(
  diff: number | null,
  thresholds: Pick<Thresholds, 'headingPassDeg' | 'headingReviewDeg'>,
): HeadingBand {
  if (diff === null) return 'none';
  if (diff <= thresholds.headingPassDeg) return 'green';
  if (diff <= thresholds.headingReviewDeg) return 'amber';
  return 'red';
}
