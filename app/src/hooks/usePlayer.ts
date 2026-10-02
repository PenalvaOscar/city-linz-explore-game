import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';

export type PlayerState = {
  name: string | null;
  id: string | null;
  email: string | null;
  authError: string | null;
  authenticated: boolean;
  loaded: boolean;
  setName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

/** Keeps the game player identity in sync with the signed-in Supabase account. */
export function usePlayer(): PlayerState {
  const [name, setNameState] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const applyUser = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!active) return;
      setAuthError(null);
      setId(user?.id ?? null);
      setEmail(user?.email ?? null);
      const displayName = user?.user_metadata?.display_name;
      setNameState(typeof displayName === 'string' && displayName.trim() ? displayName.trim() : null);
      setLoaded(true);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        applyUser(data.session?.user ?? null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setAuthError(cause instanceof Error ? cause.message : 'Could not restore the saved account session.');
        setLoaded(true);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const setName = useCallback(async (next: string) => {
    const displayName = next.trim();
    if (!displayName) throw new Error('Display name cannot be empty.');
    const { data, error } = await supabase.auth.updateUser({ data: { display_name: displayName } });
    if (error) throw error;
    const savedName = data.user.user_metadata.display_name;
    setNameState(typeof savedName === 'string' ? savedName : displayName);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { name, id, email, authError, authenticated: id !== null, loaded, setName, signOut };
}
