import type { Spot } from '../../data/types';

/** Contract of the capture step, implemented by `capture/CameraCaptureStep`. */
export type CaptureStepProps = {
  spot: Spot;
  /** Latest compass reading, null when the device gives none. */
  heading: number | null;
  /** Called with the photo's file URI, or null when no photo was taken. */
  onCapture: (photoUri: string | null) => void;
  onCancel: () => void;
};
