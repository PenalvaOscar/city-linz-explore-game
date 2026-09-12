/**
 * A fresh device-local player identifier: 128 random bits as 32 hex characters. Uses the runtime's
 * CSPRNG when present and `Math.random` otherwise, so no dependency is needed for a stable id
 * that is only ever compared, never used as a secret.
 */
export function newDeviceId(): string {
  const bytes = new Uint8Array(16);
  const crypto = globalThis.crypto;
  if (crypto?.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
