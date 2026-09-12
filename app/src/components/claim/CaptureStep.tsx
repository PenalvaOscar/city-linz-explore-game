import type { Spot } from '../../data/types';
import type { Thresholds } from '../../verify/thresholds';

/** Contract of the capture step, implemented by `capture/CameraCaptureStep`. */
export type CaptureStepProps = {
  spot: Spot;
  /** Latest compass reading, null when the device gives none. */
  heading: number | null;
  /** Heading limits the indicator bands are cut at, the same the claim is evaluated with. */
  thresholds: Pick<Thresholds, 'headingPassDeg' | 'headingReviewDeg'>;
  /** Called with the photo's file URI, or null when no photo was taken. */
  onCapture: (photoUri: string | null) => void;
  onCancel: () => void;
};
