import { supabase } from '../../utils/supabase';

const BUCKET = 'photos';

/**
 * Photo proof: puts the captured JPEG in the public `photos` bucket as `<claimId>.jpg`, then points
 * `claims.photo_url` at it. Rejects on any failure; the caller logs and leaves the claim as it is.
 */
export async function uploadClaimPhoto(claimId: string, uri: string): Promise<void> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Could not read captured claim photo (${response.status})`);
  const bytes = await response.arrayBuffer();
  const path = `${claimId}.jpg`;
  const bucket = supabase.storage.from(BUCKET);

  const { error: uploadError } = await bucket.upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw uploadError;

  const { data } = bucket.getPublicUrl(path);
  const { error: updateError } = await supabase.from('claims').update({ photo_url: data.publicUrl }).eq('id', claimId);
  if (updateError) throw updateError;
}
