import type { PinState } from '../data/types';

// linz.at-inspired palette; hex values eyeballed from docs/design (see README there).
export const theme = {
  primary: '#1E3FAE',
  accentYellow: '#FFD500',
  background: '#FAFAFC',
  text: '#1A1A1A',
  muted: '#666666',
  white: '#FFFFFF',
  surface: 'rgba(255,255,255,0.92)',
  border: '#E3E6EE',
  badgePoints: '#FFF4B8',
  badgeOwnership: '#E8EDFB',
  disabledOpacity: 0.45,
} as const;

/** The only mapping from pin state to colour; components must not decide colours themselves. */
export const pinColor: Record<PinState, string> = {
  free: '#9E9E9E',
  mine: theme.primary,
  theirs: '#D32F2F',
  gem: '#7B1FA2',
};
