/** Rotation, in degrees clockwise from north, of a white arrow drawn on the pin. */
export type HeadingGlyph = { rotation: number };

/**
 * The one rule for the heading arrow on a spot pin: an unknown heading draws nothing, a known one
 * draws the arrow turned to that heading. Both the iOS marker and the Android page consume this.
 */
export function headingGlyph(heading: number | null): HeadingGlyph | null {
  if (heading === null) return null;
  return { rotation: ((heading % 360) + 360) % 360 };
}
