import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { Holding } from '../data/types';

export type HoldingsState = { holdings: Holding[]; available: boolean; refresh: () => void };

/** Reads the holdings table. On any error, holdings are empty and `available` is false. */
export function useHoldings(): HoldingsState {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [available, setAvailable] = useState(false);

  const refresh = useCallback(() => {
    Promise.resolve(supabase.from('holdings').select())
      .then(({ data, error }) => {
        if (error || !data) {
          setAvailable(false);
          return;
        }
        setHoldings(data as Holding[]);
        setAvailable(true);
      })
      .catch(() => setAvailable(false));
  }, []);

  useEffect(refresh, [refresh]);

  return { holdings, available, refresh };
}
