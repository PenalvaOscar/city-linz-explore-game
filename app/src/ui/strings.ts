const strings = {
  appName: 'Zwergerl',
  free: 'Free',
  yours: 'Yours',
  ownedBy: 'Owned by',
  gem: 'Gem',
  ownershipUnavailable: 'Ownership unavailable',
  distanceUnknown: '—',
  headingUnknown: 'heading unknown',
  points: 'pts',
  claim: 'Claim this spot',
  close: 'Close',
  attribution: 'Data: Ars Electronica Festival 2026 · Stadt Linz (CC-BY) ·',
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
  return strings[key];
}
