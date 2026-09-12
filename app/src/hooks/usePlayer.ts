import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { newDeviceId } from '../verify/deviceId';

const PLAYER_NAME_KEY = 'zwergerl.playerName';
const PLAYER_ID_KEY = 'zwergerl.playerId';

export type PlayerState = {
  /** The stored display name; null until loaded or while none is stored. */
  name: string | null;
  /**
   * Random device-local identifier, generated on first launch and kept for the device's lifetime.
   * Not sent anywhere yet: it is here so every device carries a stable id before the backend
   * gains a `player_id` column. Null until loaded.
   */
  id: string | null;
  /** False until the stored name and id have been read once. */
  loaded: boolean;
  setName: (name: string) => Promise<void>;
};

/** The device-local player identity: one display name, asked once, and one random id, both kept in AsyncStorage. */
export function usePlayer(): PlayerState {
  const [name, setNameState] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.multiGet([PLAYER_NAME_KEY, PLAYER_ID_KEY])
      .then(([[, storedName], [, storedId]]) => {
        // The id is written even when the effect was cancelled so the first launch always persists one.
        const deviceId = storedId ?? newDeviceId();
        if (!storedId) AsyncStorage.setItem(PLAYER_ID_KEY, deviceId).catch(() => {});
        if (cancelled) return;
        if (storedName) setNameState(storedName);
        setId(deviceId);
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

  return { name, id, loaded, setName };
}
