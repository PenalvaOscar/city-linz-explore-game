import raw from '../../../data/spots.json';
import gems from '../../../data/gems.json';
import { photos } from './photos';
import type { Spot } from './types';
import { validateSpots } from './validate';

// Hand-written Linz spots plus the gems generated from the festival export (scripts/build-gems.js).
export const spots = [...raw, ...gems] as Spot[];

validateSpots(spots, photos);
