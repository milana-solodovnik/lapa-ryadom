import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * One-time offer codes.
 *
 * Rules from docs/03_DATA_MODEL.md:
 *  - the code is shown to the visitor exactly once and typed by the shelter rep;
 *  - only a hash is stored in offers.code_hash, never the code itself;
 *  - the hash is produced with the server secret so a leaked database cannot be
 *    used to verify guessed codes offline.
 *
 * Alphabet excludes 0/O and 1/I/L so the code survives being read aloud across
 * a shelter reception desk. 32 symbols, 16 positions => 80 bits of entropy.
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const GROUPS = 4;
const GROUP_LEN = 4;

/** Generate a fresh human-readable code, e.g. `K7QM-2X9D-BT4H-RN6W`. */
export function generateOfferCode(): string {
  const parts: string[] = [];
  for (let g = 0; g < GROUPS; g += 1) {
    let chunk = '';
    for (let i = 0; i < GROUP_LEN; i += 1) {
      chunk += ALPHABET[randomInt(ALPHABET.length)];
    }
    parts.push(chunk);
  }
  return parts.join('-');
}

/** Normalise user input: uppercase, strip anything not in the alphabet. */
export function normaliseCode(input: string): string {
  return input
    .toUpperCase()
    .split('')
    .filter((ch) => ALPHABET.includes(ch))
    .join('');
}

/** HMAC-SHA256 of the normalised code, 32 bytes, keyed by SERVER_OFFER_SECRET. */
export function hashOfferCode(code: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(normaliseCode(code), 'utf8').digest();
}

/** Constant-time comparison of a candidate code against a stored hash. */
export function verifyOfferCode(candidate: string, storedHash: Buffer, secret: string): boolean {
  const actual = hashOfferCode(candidate, secret);
  if (actual.length !== storedHash.length) return false;
  return timingSafeEqual(actual, storedHash);
}

/**
 * The storage format of a normalised code is 16 characters with no separators.
 * Used to reject obviously malformed input before touching the database.
 */
export function isWellFormed(code: string): boolean {
  return normaliseCode(code).length === GROUPS * GROUP_LEN;
}