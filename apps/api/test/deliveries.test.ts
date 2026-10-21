import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { closePool, configurePool, getPool } from '../src/db/pool.js';
import { hashOfferCode } from '../src/services/offer-code.js';

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgres://db:db@127.0.0.1:55432/db';
const SECRET = 'test-secret-key-for-offer-codes-0123456789';

// Stable IDs from db/seed/data.mjs
const NEED_URGENT = '10000001-0000-4000-a000-000000000001'; // target 50
const NEED_OTHER = '10000002-0000-4000-a000-000000000001'; // different shelter
const REP_A = 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa01';
const REP_B = 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa02';
const REP_A_USER = 'rep_a';
const REP_B_USER = 'rep_b';
const REP_A_PASS = 'dev-rep-a-pwd-123';
const REP_B_PASS = 'dev-rep-b-pwd-123';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'dev-admin-pwd-123';

let app: FastifyInstance;

beforeAll(async () => {
  // Seed reads these env vars to produce Argon2id hashes; mirror them so
  // production seed and test login use the same plaintext.
  process.env.DEMO_ADMIN_PASSWORD = ADMIN_PASS;
  process.env.DEMO_REP_A_PASSWORD = REP_A_PASS;
  process.env.DEMO_REP_B_PASSWORD = REP_B_PASS;
  process.env.DEMO_REP_C_PASSWORD = 'dev-rep-c-pwd-123';
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
  await resetNeed(NEED_URGENT);
  await resetNeed(NEED_OTHER);
  await app.close();
  await closePool();
});

async function resetNeed(needId: string): Promise<void> {
  const pool = getPool()!;
  await pool.query(
    `DELETE FROM deliveries WHERE offer_id IN (SELECT id FROM offers WHERE need_id = $1)`,
    [needId],
  );
  await pool.query('DELETE FROM offers WHERE need_id = $1', [needId]);
}

beforeEach(async () => {
  await resetNeed(NEED_URGENT);
  await resetNeed(NEED_OTHER);
  await getPool()!.query('DELETE FROM auth_sessions');
});

/**
 * Insert a reserved offer directly so the deliveries test can focus on D2,
 * not on the createOffer flow. Returns the row's id and the chosen code.
 */
async function seedReservedOffer(
  needId: string,
  quantity: number,
  code: string,
): Promise<{ offerId: string }> {
  const pool = getPool()!;
  const offerId = randomUUID();
  const codeHash = hashOfferCode(code, SECRET);
  const expires = new Date(Date.now() + 86400000);
  await pool.query(
    `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'reserved', $6)`,
    [offerId, needId, quantity, randomUUID(), codeHash, expires],
  );
  return { offerId };
}

/**
 * Login as a known seeded user. Returns a `Cookie: lapa_sid=...` header value
 * that can be passed verbatim to subsequent requests.
 */
async function loginCookie(
  username: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { username, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`login failed: ${res.statusCode} ${res.body}`);
  }
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) throw new Error('no Set-Cookie on login response');
  // `set-cookie` may be string or string[]; extract `name=value` only.
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const match = /^([^=]+)=([^\s;]+)/.exec(first);
  if (!match) throw new Error(`could not parse Set-Cookie: ${first}`);
  return `${match[1]}=${match[2]}`;
}

async function loginAsRepA(): Promise<string> {
  return loginCookie(REP_A_USER, REP_A_PASS);
}

async function loginAsRepB(): Promise<string> {
  return loginCookie(REP_B_USER, REP_B_PASS);
}

async function loginAsAdmin(): Promise<string> {
  return loginCookie(ADMIN_USER, ADMIN_PASS);
}

async function postDelivery(body: unknown, cookie?: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/deliveries',
    payload: body as object,
    headers: cookie ? { cookie } : {},
  });
}

describe('POST /api/v1/deliveries (cookie auth)', () => {
  it('records the delivery and updates need balances', async () => {
    const { offerId } = await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const cookie = await loginAsRepA();
    const res = await postDelivery({ code: 'ABC23456DEF78923', receivedQty: 5 }, cookie);
    expect(res.statusCode).toBe(201);

    const body = res.json();
    expect(body.deliveryId).toBeTruthy();
    expect(body.offerId).toBe(offerId);
    expect(body.needId).toBe(NEED_URGENT);
    expect(body.receivedQty).toBe('5');
    expect(body.offerQty).toBe('5');
    expect(body.needTitle).toBeTruthy();

    const pool = getPool()!;
    const offer = await pool.query<{ status: string }>(
      `SELECT status FROM offers WHERE id = $1`,
      [offerId],
    );
    expect(offer.rows[0].status).toBe('received');

    const bal = await pool.query<{ received_qty: string }>(
      `SELECT received_qty::text AS received_qty FROM need_balances WHERE need_id = $1`,
      [NEED_URGENT],
    );
    expect(bal.rows[0].received_qty).toBe('5');
  });

  it('returns 401 without a session cookie', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const res = await postDelivery({ code: 'ABC23456DEF78923', receivedQty: 5 });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('NOT_AUTHENTICATED');
  });

  it('returns 401 with a fabricated session cookie', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 5 },
      'lapa_sid=0000000000000000000000000000000000000000000000000000000000000000',
    );
    expect(res.statusCode).toBe(401);
  });

  it('rejects a malformed code without touching the database', async () => {
    const cookie = await loginAsRepA();
    const res = await postDelivery({ code: 'abc', receivedQty: 1 }, cookie);
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_BODY');
  });

  it('rejects a code that contains forbidden characters', async () => {
    const cookie = await loginAsRepA();
    const res = await postDelivery(
      { code: '0000-0000-0000-0000', receivedQty: 1 },
      cookie,
    );
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_CODE');
  });

  it('returns 404 for an unknown code', async () => {
    const cookie = await loginAsRepA();
    const res = await postDelivery(
      { code: 'XXXX2222XXXX2222', receivedQty: 1 },
      cookie,
    );
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('OFFER_NOT_FOUND');
  });

  it('refuses an admin (only shelter_rep may accept)', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const cookie = await loginAsAdmin();
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 5 },
      cookie,
    );
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('WRONG_SHELTER');
  });

  it('refuses a rep from another shelter', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const cookie = await loginAsRepB();
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 5 },
      cookie,
    );
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe('WRONG_SHELTER');
  });

  it('refuses to receive more than the offer quantity', async () => {
    await seedReservedOffer(NEED_URGENT, 3, 'ABC23456DEF78923');
    const cookie = await loginAsRepA();
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 4 },
      cookie,
    );
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('OVER_RECEIVE');
    expect(res.json().available).toBe('3');
  });

  it('rejects a second delivery for the same offer', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const cookie = await loginAsRepA();
    const first = await postDelivery({ code: 'ABC23456DEF78923', receivedQty: 5 }, cookie);
    expect(first.statusCode).toBe(201);
    const second = await postDelivery({ code: 'ABC23456DEF78923', receivedQty: 1 }, cookie);
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('DELIVERY_EXISTS');
  });

  it('refuses an explicitly cancelled offer', async () => {
    const pool = getPool()!;
    const offerId = randomUUID();
    const codeHash = hashOfferCode('ABC23456DEF78923', SECRET);
    await pool.query(
      `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at, cancelled_at)
       VALUES ($1, $2, 5, $3, $4, 'cancelled', statement_timestamp() + interval '1 day', statement_timestamp())`,
      [offerId, NEED_URGENT, randomUUID(), codeHash],
    );
    const cookie = await loginAsRepA();
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 5 },
      cookie,
    );
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('OFFER_NOT_RESERVED');
  });

  it('rejects non-positive and fractional receivedQty', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    const cookie = await loginAsRepA();
    for (const qty of [0, -1, 1.5]) {
      const res = await postDelivery(
        { code: 'ABC23456DEF78923', receivedQty: qty },
        cookie,
      );
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('INVALID_BODY');
    }
    const pool = getPool()!;
    const still = await pool.query<{ status: string }>(
      `SELECT status FROM offers WHERE code_hash = $1`,
      [hashOfferCode('ABC23456DEF78923', SECRET)],
    );
    expect(still.rows[0].status).toBe('reserved');
  });

  it('records a partial receipt (fewer items than the offer)', async () => {
    await seedReservedOffer(NEED_URGENT, 10, 'ABC23456DEF78923');
    const cookie = await loginAsRepA();
    const res = await postDelivery(
      { code: 'ABC23456DEF78923', receivedQty: 7 },
      cookie,
    );
    expect(res.statusCode).toBe(201);
    expect(res.json().receivedQty).toBe('7');
    expect(res.json().offerQty).toBe('10');

    const pool = getPool()!;
    const bal = await pool.query<{ received_qty: string; reserved_qty: string }>(
      `SELECT received_qty::text AS received_qty,
              reserved_qty::text AS reserved_qty
         FROM need_balances
        WHERE need_id = $1`,
      [NEED_URGENT],
    );
    expect(bal.rows[0].received_qty).toBe('7');
    expect(bal.rows[0].reserved_qty).toBe('0');
  });

  it('tracks deliveries per shelter independently', async () => {
    await seedReservedOffer(NEED_URGENT, 3, 'ABC23456DEF78923');
    await seedReservedOffer(NEED_OTHER, 3, 'XYZ98765ABC45678');

    const cookieA = await loginAsRepA();
    const cookieB = await loginAsRepB();
    const a = await postDelivery({ code: 'ABC23456DEF78923', receivedQty: 3 }, cookieA);
    const b = await postDelivery({ code: 'XYZ98765ABC45678', receivedQty: 3 }, cookieB);
    expect(a.statusCode).toBe(201);
    expect(b.statusCode).toBe(201);

    const pool = getPool()!;
    const bal = await pool.query<{ need_id: string; received_qty: string }>(
      `SELECT need_id, received_qty::text AS received_qty
         FROM need_balances
        WHERE need_id IN ($1, $2)`,
      [NEED_URGENT, NEED_OTHER],
    );
    const byNeed = Object.fromEntries(bal.rows.map((r) => [r.need_id, r.received_qty]));
    expect(byNeed[NEED_URGENT]).toBe('3');
    expect(byNeed[NEED_OTHER]).toBe('3');
  });

  it('serialises two reps racing on the same code', async () => {
    await seedReservedOffer(NEED_URGENT, 5, 'ABC23456DEF78923');
    // Two distinct sessions for the same rep — second login issues a separate
    // cookie so the race resolves at the row lock, not the session.
    const c1 = await loginAsRepA();
    const c2 = await loginAsRepA();
    const [a, b] = await Promise.all([
      postDelivery({ code: 'ABC23456DEF78923', receivedQty: 5 }, c1),
      postDelivery({ code: 'ABC23456DEF78923', receivedQty: 5 }, c2),
    ]);
    const codes = [a.statusCode, b.statusCode].sort();
    expect(codes).toEqual([201, 409]);

    const pool = getPool()!;
    const cnt = await pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM deliveries d
        JOIN offers o ON o.id = d.offer_id
        WHERE o.need_id = $1`,
      [NEED_URGENT],
    );
    expect(cnt.rows[0].n).toBe('1');
  });
});
