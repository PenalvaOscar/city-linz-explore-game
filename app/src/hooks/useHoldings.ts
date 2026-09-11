import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../../utils/supabase';
import type { Holding } from '../data/types';

export type HoldingsState = { holdings: Holding[]; available: boolean; refresh: () => void };

/** Reads the holdings table on mount and whenever the app returns to the foreground. On any error, holdings are empty and `available` is false. */
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

  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { holdings, available, refresh };
}
