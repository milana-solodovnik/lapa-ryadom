import argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

/**
 * Argon2id verification of a plaintext password against a stored hash.
 *
 * The seed (`scripts/seed.mjs`) writes `accounts.password_hash` produced by
 * `argon2.hash(plain, { type: argon2.argon2id })`. This is the matching
 * `argon2.verify(...)` call.
 */
export async function verifyPassword(
  storedHash: string,
  plain: string
): Promise<boolean> {
  try {
    return await argon2.verify(storedHash, plain);
  } catch {
    // Malformed hash, mismatched encoding, etc. — treat as failure rather than
    // a server error.
    return false;
  }
}

/**
 * Fresh opaque session token. 32 bytes from a CSPRNG, hex-encoded so it travels
 * safely in a cookie. The DB stores its SHA-256; the raw value never lands on
 * disk.
 */
export function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** SHA-256 of the cookie value — what we actually store in `auth_sessions.id_hash`. */
export function hashSessionId(token: string): Buffer {
  return createHash('sha256').update(token, 'utf8').digest();
}

/** A CSRF token per session, kept in the cookie alongside the session id. */
export function newCsrfToken(): Buffer {
  return randomBytes(32);
}
