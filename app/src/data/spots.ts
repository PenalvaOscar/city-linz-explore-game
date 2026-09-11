import raw from '../../../data/spots.json';
import { photos } from './photos';
import type { Spot } from './types';
import { validateSpots } from './validate';

export const spots = raw as Spot[];

validateSpots(spots, photos);
