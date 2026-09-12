export const PLAYER_NAME_MAX = 20;

/** The display name as stored, or null when the input is not a valid name (1–20 characters after trimming). */
export function validatePlayerName(raw: string): string | null {
  const name = raw.trim();
  if (name.length === 0 || name.length > PLAYER_NAME_MAX) return null;
  return name;
}
