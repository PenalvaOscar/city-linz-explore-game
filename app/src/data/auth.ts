import { supabase } from '../../utils/supabase';

export async function registerWithEmail(email: string, password: string, displayName: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName.trim() } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Supabase did not return a user for the new account.');
  return data.session !== null;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}
