import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYER_NAME_KEY = 'zwergerl.playerName';

export type PlayerState = {
  /** The stored display name; null until loaded or while none is stored. */
  name: string | null;
  /** False until the stored name has been read once. */
  loaded: boolean;
  setName: (name: string) => Promise<void>;
};

/** The device-local player identity: one display name, asked once and kept in AsyncStorage. */
export function usePlayer(): PlayerState {
  const [name, setNameState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(PLAYER_NAME_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored) setNameState(stored);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setName = useCallback(async (next: string) => {
    setNameState(next);
    await AsyncStorage.setItem(PLAYER_NAME_KEY, next).catch(() => {});
  }, []);

  return { name, loaded, setName };
}
