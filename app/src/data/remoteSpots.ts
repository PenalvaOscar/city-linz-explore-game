import { supabase } from '../../utils/supabase';
import type { Spot } from './types';

type RemoteSpot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  heading: number | null;
  radius: number;
  kind: 'linz' | 'gem';
  photo: string;
};

function publicPhotoUrl(photo: string): string {
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  return supabase.storage.from('photos').getPublicUrl(photo.replace(/^\/+/, '')).data.publicUrl;
}

export async function loadRemoteSpots(): Promise<Spot[]> {
  const { data, error } = await supabase.from('spots').select('*');
  if (error) throw error;
  // Remote rows have no window, so they are always Linz spots whatever their stored kind; only generated gems carry a window.
  return (data as RemoteSpot[]).map((row) => ({
    ...row,
    kind: 'gem',
    photo: publicPhotoUrl(row.photo),
    name: { en: row.name },
    teaser: { en: '' },
    story: { en: '' },
    points: 10,
    window: null,
  }));
}

export async function saveNewSpot(input: {
  name: string;
  lat: number;
  lng: number;
  heading: number;
  photoUri: string;
}): Promise<Spot> {
  const id = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`;
  const path = `gems/${id}.jpg`;
  const response = await fetch(input.photoUri);
  if (!response.ok) throw new Error(`Could not read captured photo (${response.status})`);
  const bytes = await response.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from('photos').upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from('photos').getPublicUrl(path);
  const row: RemoteSpot = {
    id,
    name: input.name.trim(),
    lat: input.lat,
    lng: input.lng,
    heading: Math.round(input.heading),
    radius: 40,
    kind: 'gem',
    photo: publicUrl.publicUrl,
  };
  const { error } = await supabase.from('spots').insert(row);
  if (error) throw error;

  return {
    ...row,
    name: { en: row.name },
    teaser: { en: '' },
    story: { en: '' },
    points: 10,
    window: null,
  };
}
