/** The verification gates' limits (PRD "Verification thresholds"). Passed into the pure helpers, never read from the environment there. */
export type Thresholds = {
  /** Distance gate passes at or under this many metres. Also the range that counts for dwell. */
  distancePassM: number;
  /** Distance gate is a near miss ("review") up to this many metres; beyond is a wide miss. */
  distanceReviewM: number;
  /** GPS accuracy must be this many metres or better; worse readings wait in "settling". */
  accuracyMaxM: number;
  /** Heading gate passes at or under this many degrees off the reference heading. */
  headingPassDeg: number;
  /** Heading gate is a near miss up to this many degrees off; beyond is the wrong way. */
  headingReviewDeg: number;
  /** Seconds a player must stay within range before the capture step unlocks. */
  dwellMinS: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  distancePassM: 40,
  distanceReviewM: 80,
  accuracyMaxM: 60,
  headingPassDeg: 35,
  headingReviewDeg: 60,
  dwellMinS: 10,
};

/** Desk development (`EXPO_PUBLIC_RELAXED_GATES`): distance unlimited, no accuracy wait, 2 s dwell, heading still enforced. */
export const RELAXED_THRESHOLDS: Thresholds = {
  ...DEFAULT_THRESHOLDS,
  distancePassM: Infinity,
  distanceReviewM: Infinity,
  accuracyMaxM: Infinity,
  dwellMinS: 2,
};
