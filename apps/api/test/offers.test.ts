import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { closePool, configurePool, getPool } from '../src/db/pool.js';
import {
  generateOfferCode,
  hashOfferCode,
  normaliseCode,
  verifyOfferCode,
  isWellFormed,
} from '../src/services/offer-code.js';

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgres://db:db@127.0.0.1:55432/db';
const SECRET = 'test-secret-key-for-offer-codes-0123456789';

const NEED_URGENT = '10000001-0000-4000-a000-000000000001'; // target 50

let app: FastifyInstance;

beforeAll(async () => {
  configurePool(DB_URL);
  app = await buildApp({
    env: {
      NODE_ENV: 'test',
      PORT: 4001,
      DATABASE_URL: DB_URL,
      TARGET_DATABASE_URL: '',
      SERVER_OFFER_SECRET: SECRET,
      SESSION_COOKIE_NAME: 'lapa_sid',
      SESSION_TTL_HOURS: 8,
      WEB_ORIGIN: 'http://localhost:5173',
    },
  });
});

afterAll(async () => {
  // Leave the development database exactly as we found it. Integration tests
  // share the dev database, so leftover reservations would corrupt the next
  // live demo run (they show up as reserved stock that nobody actually promised).
  await resetNeed();
  await app.close();
  await closePool();
});

/** Return a need to its pristine D0 state so each test is independent. */
async function resetNeed(needId = NEED_URGENT): Promise<void> {
  const pool = getPool()!;
  // The deliveries test shares the dev DB and may leave child rows behind.
  await pool.query(
    `DELETE FROM deliveries WHERE offer_id IN (SELECT id FROM offers WHERE need_id = $1)`,
    [needId]
  );
  await pool.query('DELETE FROM offers WHERE need_id = $1', [needId]);
}

beforeEach(async () => {
  await resetNeed();
});

async function post(body: unknown) {
  return app.inject({ method: 'POST', url: '/api/v1/offers', payload: body as object });
}

describe('offer codes', () => {
  it('generates 16 symbols from the unambiguous alphabet', () => {
    const code = generateOfferCode();
    expect(isWellFormed(code)).toBe(true);
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/);
  });

  it('does not repeat itself across many draws', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) seen.add(generateOfferCode());
    expect(seen.size).toBe(500);
  });

  it('normalises separators and lowercase', () => {
    expect(normaliseCode('k7qm-2x9d-bt4h-rn6w')).toBe('K7QM2X9DBT4HRN6W');
  });

  it('hashes to 32 bytes and verifies in constant time', () => {
    const code = generateOfferCode();
    const hash = hashOfferCode(code, SECRET);
    expect(hash.length).toBe(32);
    expect(verifyOfferCode(code, hash, SECRET)).toBe(true);
    expect(verifyOfferCode(code, hash, 'other-secret')).toBe(false);
  });

  it('rejects a wrong code of the same length', () => {
    const hash = hashOfferCode(generateOfferCode(), SECRET);
    expect(verifyOfferCode(generateOfferCode(), hash, SECRET)).toBe(false);
  });
});

describe('POST /api/v1/offers', () => {
  it('reserves stock and returns a one-time code', async () => {
    const res = await post({ needId: NEED_URGENT, quantity: 5, idempotencyKey: randomUUID() });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.code).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
    expect(body.remaining).toBe('45');
    expect(body.need.title).toBeTruthy();
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('never stores the plaintext code', async () => {
    const res = await post({ needId: NEED_URGENT, quantity: 1, idempotencyKey: randomUUID() });
    const code: string = res.json().code;

    const pool = getPool()!;
    const { rows } = await pool.query(
      'SELECT encode(code_hash, \'hex\') AS hex FROM offers WHERE need_id = $1',
      [NEED_URGENT]
    );
    expect(rows.length).toBe(1);

    // The stored value must be a hash, not the code in any encoding.
    const bare = code.replace(/-/g, '');
    expect(rows[0].hex).toHaveLength(64); // 32 bytes hex
    expect(rows[0].hex).not.toContain(bare);
    expect(Buffer.from(rows[0].hex, 'hex').toString('utf8')).not.toContain(bare);

    // And the hash must actually match the issued code.
    expect(verifyOfferCode(code, Buffer.from(rows[0].hex, 'hex'), SECRET)).toBe(true);
  });

  it('is idempotent: the same key never creates two offers', async () => {
    const key = randomUUID();
    const first = await post({ needId: NEED_URGENT, quantity: 3, idempotencyKey: key });
    expect(first.statusCode).toBe(201);

    const second = await post({ needId: NEED_URGENT, quantity: 3, idempotencyKey: key });
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('IDEMPOTENCY_REPLAY');

    const pool = getPool()!;
    const { rows } = await pool.query(
      'SELECT count(*)::int AS n FROM offers WHERE need_id = $1',
      [NEED_URGENT]
    );
    expect(rows[0].n).toBe(1);
  });

  it('refuses more than the free remainder', async () => {
    const res = await post({ needId: NEED_URGENT, quantity: 51, idempotencyKey: randomUUID() });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('NOT_ENOUGH_AVAILABLE');
    expect(res.json().available).toBe('50');
  });

  it('accepts exactly the free remainder', async () => {
    const res = await post({ needId: NEED_URGENT, quantity: 50, idempotencyKey: randomUUID() });
    expect(res.statusCode).toBe(201);
    expect(res.json().remaining).toBe('0');
  });

  it('returns 404 for an unknown need', async () => {
    const res = await post({
      needId: '00000000-0000-4000-a000-000000000000',
      quantity: 1,
      idempotencyKey: randomUUID(),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('NEED_NOT_FOUND');
  });

  it('rejects non-positive and fractional quantities', async () => {
    for (const quantity of [0, -1, 1.5]) {
      const res = await post({ needId: NEED_URGENT, quantity, idempotencyKey: randomUUID() });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('INVALID_BODY');
    }
  });

  it('rejects a malformed idempotency key', async () => {
    const res = await post({ needId: NEED_URGENT, quantity: 1, idempotencyKey: 'nope' });
    expect(res.statusCode).toBe(400);
  });

  it('serialises two visitors racing for the last pack', async () => {
    // 49 reserved first, so exactly one unit remains.
    await post({ needId: NEED_URGENT, quantity: 49, idempotencyKey: randomUUID() });

    const [a, b] = await Promise.all([
      post({ needId: NEED_URGENT, quantity: 1, idempotencyKey: randomUUID() }),
      post({ needId: NEED_URGENT, quantity: 1, idempotencyKey: randomUUID() }),
    ]);

    const codes = [a.statusCode, b.statusCode].sort();
    expect(codes).toEqual([201, 409]);

    const pool = getPool()!;
    const { rows } = await pool.query(
      `SELECT COALESCE(SUM(o.quantity),0)::bigint AS reserved
       FROM offers o WHERE o.need_id = $1 AND o.status = 'reserved'`,
      [NEED_URGENT]
    );
    expect(rows[0].reserved).toBe('50');
  });
});