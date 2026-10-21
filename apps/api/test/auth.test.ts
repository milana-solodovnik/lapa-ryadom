import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { closePool, configurePool, getPool } from '../src/db/pool.js';

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgres://db:db@127.0.0.1:55432/db';
const REP_A_USER = 'rep_a';
const REP_B_USER = 'rep_b';
const REP_A_PASS = 'dev-rep-a-pwd-123';
const REP_B_PASS = 'dev-rep-b-pwd-123';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'dev-admin-pwd-123';

let app: FastifyInstance;

beforeAll(async () => {
  process.env.DEMO_ADMIN_PASSWORD = ADMIN_PASS;
  process.env.DEMO_REP_A_PASSWORD = REP_A_PASS;
  process.env.DEMO_REP_B_PASSWORD = REP_B_PASS;
  process.env.DEMO_REP_C_PASSWORD = 'dev-rep-c-pwd-123';
  configurePool(DB_URL);
  app = await buildApp({
    env: {
      NODE_ENV: 'test',
      PORT: 4002,
      DATABASE_URL: DB_URL,
      TARGET_DATABASE_URL: '',
      SERVER_OFFER_SECRET: 'test-secret-key-for-offer-codes-0123456789',
      SESSION_COOKIE_NAME: 'lapa_sid',
      SESSION_TTL_HOURS: 8,
      WEB_ORIGIN: 'http://localhost:5173',
    },
  });
});

afterAll(async () => {
  await getPool()!.query('DELETE FROM auth_sessions');
  await app.close();
  await closePool();
});

beforeEach(async () => {
  await getPool()!.query('DELETE FROM auth_sessions');
});

async function post(body: unknown, headers: Record<string, string> = {}) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: body as object,
    headers,
  });
}

async function getMe(cookie?: string) {
  return app.inject({
    method: 'GET',
    url: '/api/v1/auth/me',
    headers: cookie ? { cookie } : {},
  });
}

async function logout(cookie?: string) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/auth/logout',
    headers: cookie ? { cookie } : {},
  });
}

function extractCookie(setCookie: string | string[] | undefined): string | undefined {
  if (!setCookie) return undefined;
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const m = /^([^=]+)=([^\s;]+)/.exec(first);
  return m ? `${m[1]}=${m[2]}` : undefined;
}

describe('POST /api/v1/auth/login', () => {
  it('returns 200 and a session cookie on valid credentials', async () => {
    const res = await post({ username: REP_A_USER, password: REP_A_PASS });
    expect(res.statusCode).toBe(200);
    expect(extractCookie(res.headers['set-cookie'])).toMatch(/^lapa_sid=[0-9a-f]+$/);
    const body = res.json();
    expect(body.account.role).toBe('shelter_rep');
    expect(body.account.shelterId).toBe('11111111-1111-4111-a111-111111111111');
    expect(body.expiresAt).toBeTruthy();
  });

  it('returns 401 for an unknown username', async () => {
    const res = await post({ username: 'rep_unknown', password: REP_A_PASS });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for a wrong password', async () => {
    const res = await post({ username: REP_A_USER, password: 'wrong-password' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when the body is malformed', async () => {
    const res = await post({ username: 'X', password: 'short' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_BODY');
  });

  it('admin account can authenticate (role check is enforced downstream)', async () => {
    const res = await post({ username: ADMIN_USER, password: ADMIN_PASS });
    expect(res.statusCode).toBe(200);
    expect(res.json().account.role).toBe('admin');
  });

  it('two logins produce two distinct session rows', async () => {
    const r1 = await post({ username: REP_A_USER, password: REP_A_PASS });
    const r2 = await post({ username: REP_A_USER, password: REP_A_PASS });
    expect(r1.statusCode).toBe(200);
    expect(r2.statusCode).toBe(200);
    const pool = getPool()!;
    const cnt = await pool.query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM auth_sessions`,
    );
    expect(cnt.rows[0].n).toBe('2');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 200 with the account for a valid session', async () => {
    const login = await post({ username: REP_B_USER, password: REP_B_PASS });
    const cookie = extractCookie(login.headers['set-cookie']);
    const res = await getMe(cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe(REP_B_USER);
    expect(res.json().role).toBe('shelter_rep');
    expect(res.json().shelterId).toBe('22222222-2222-4222-a222-222222222222');
  });

  it('returns 401 without a session', async () => {
    const res = await getMe();
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 after logout', async () => {
    const login = await post({ username: REP_A_USER, password: REP_A_PASS });
    const cookie = extractCookie(login.headers['set-cookie']);
    const out = await logout(cookie);
    expect(out.statusCode).toBe(204);
    const me = await getMe(cookie);
    expect(me.statusCode).toBe(401);
  });

  it('returns 401 if the session row was deleted underneath', async () => {
    const login = await post({ username: REP_A_USER, password: REP_A_PASS });
    const cookie = extractCookie(login.headers['set-cookie']);
    await getPool()!.query('DELETE FROM auth_sessions');
    const res = await getMe(cookie);
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('always returns 204, even without a session', async () => {
    const res = await logout();
    expect(res.statusCode).toBe(204);
  });

  it('revokes only the matching session', async () => {
    const r1 = await post({ username: REP_A_USER, password: REP_A_PASS });
    const r2 = await post({ username: REP_A_USER, password: REP_A_PASS });
    const c1 = extractCookie(r1.headers['set-cookie'])!;
    const c2 = extractCookie(r2.headers['set-cookie'])!;
    const out = await logout(c1);
    expect(out.statusCode).toBe(204);
    expect((await getMe(c1)).statusCode).toBe(401);
    expect((await getMe(c2)).statusCode).toBe(200);
  });
});
