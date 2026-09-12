const strings = {
  appName: 'Zwergerl',
  tagline: 'Linz Awaits You. Explore. Claim. Collect.',
  free: 'Free',
  yours: 'Yours',
  ownedBy: 'Owned by',
  gem: 'Gem',
  ownershipUnavailable: 'Ownership unavailable',
  distanceUnknown: '—',
  headingUnknown: 'heading unknown',
  points: 'pts',
  claim: 'Claim this spot',
  retakePhoto: 'Retake photo',
  takingPhoto: 'Taking photo…',
  cameraPermissionTitle: 'Camera access needed',
  cameraPermissionMessage: 'Allow camera access so you can take a proof photo for this claim.',
  claimUnavailable: 'Location unavailable',
  claimRequireLocation: 'We need your location before you can claim a spot.',
  captureFailed: 'Could not capture the photo. Please try again.',
  claimTooFar: 'Move closer to the spot before submitting this photo.',
  claimAccuracy: 'Your location is not accurate enough yet. Please wait and try again.',
  claimHeadingUnavailable: 'Compass heading is unavailable. Calibrate your phone and try again.',
  claimWrongHeading: 'Turn your phone to match the reference direction and try again.',
  addSpot: 'Add a new spot',
  spotName: 'Spot name',
  takePhoto: 'Take photo',
  saveSpot: 'Save spot',
  saving: 'Saving…',
  spotSaveFailed: 'Could not save spot',
  spotSaveFailedMessage: 'Check your connection and Supabase setup, then try again.',
  moreInfo: 'More info',
  close: 'Close',
  attribution: 'Data: Ars Electronica Festival 2026 · Stadt Linz (CC-BY) ·',
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
  return strings[key];
}
