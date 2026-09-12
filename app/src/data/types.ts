export type SpotKind = 'linz' | 'gem';

export type Localized = { en: string; de?: string };

export type SpotWindow = { start: string; end: string; locationId: string };

export type Spot = {
  id: string;
  name: Localized;
  teaser: Localized;
  story: Localized;
  lat: number;
  lng: number;
  heading: number | null;
  radius?: number;
  kind: SpotKind;
  points: number;
  photo: string;
  window: SpotWindow | null;
};

export type Holding = { spot_id: string; player: string; points: number; held_since: string };

export type PinState = 'free' | 'mine' | 'theirs' | 'gem';
