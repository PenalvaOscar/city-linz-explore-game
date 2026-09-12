import type { PinState } from '../data/types';
import type { HeadingBand } from '../verify/headingBand';

// Palette from docs/design/app-mockup-colour-reference.jpg: linz.at blue, pink accent, yellow highlight.
export const theme = {
  primary: '#2B44C2',
  primaryDark: '#1E3FAE',
  accentPink: '#E5007D',
  pinkSoft: '#F9D3E4',
  accentYellow: '#FFE45C',
  background: '#F3F5FB',
  text: '#1A1A1A',
  muted: '#666666',
  white: '#FFFFFF',
  surface: 'rgba(255,255,255,0.94)',
  border: '#E3E6EE',
  badgePoints: '#FFF4B8',
  badgeOwnership: '#E8EDFB',
  disabledOpacity: 0.45,
  success: '#2E7D32',
  error: '#D32F2F',
  backdrop: 'rgba(0,0,0,0.4)',
} as const;

/** The only mapping from pin state to colour; components must not decide colours themselves. */
export const pinColor: Record<PinState, string> = {
  free: '#9E9E9E',
  mine: '#F5C400',
  theirs: theme.primaryDark,
  gem: theme.accentPink,
};

/** The only mapping from heading band to colour; the capture step looks colours up here. */
export const bandColor: Record<HeadingBand, string> = {
  green: theme.success,
  amber: '#F9A825',
  red: theme.error,
  none: '#9E9E9E',
};
