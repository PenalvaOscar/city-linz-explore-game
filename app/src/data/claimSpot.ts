import { supabase } from '../../utils/supabase';
import type { SavedClaim } from '../verify/claimMachine';

/** Arguments of the `claim_spot` Postgres function (supabase/migrations). */
export type ClaimPayload = {
  spot_id: string;
  player: string;
  points: number;
  passed: boolean;
  distance_m: number;
  heading_delta: number | null;
  gps_accuracy: number;
  dwell_seconds: number;
};

/** Logs the attempt and, when passed, takes ownership in one transaction. Rejects when the call fails. */
export async function claimSpot(payload: ClaimPayload): Promise<SavedClaim> {
  const { data, error } = await supabase.rpc('claim_spot', payload);
  if (error) throw error;
  const row = data as { claim_id: string; previous_owner: string | null } | null;
  if (!row?.claim_id) throw new Error('claim_spot returned no claim id');
  return { claimId: row.claim_id, previousOwner: row.previous_owner };
}
