import type { PoolClient } from 'pg';
import { getPool } from '../db/pool.js';
import {
  hashSessionId,
  newCsrfToken,
  newSessionToken,
} from '../services/auth.js';

export interface AccountRow {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'shelter_rep';
  shelter_id: string | null;
  is_active: boolean;
}

export interface PublicAccount {
  id: string;
  username: string;
  role: 'admin' | 'shelter_rep';
  shelterId: string | null;
  isActive: boolean;
}

/**
 * Lookup account by its unique username (case-insensitive; the table already
 * only stores lower-case).
 */
export async function findAccountByUsername(
  username: string
): Promise<AccountRow | null> {
  const pool = getPool();
  if (!pool) return null;
  const { rows } = await pool.query<AccountRow>(
    `SELECT id, username, password_hash, role, shelter_id, is_active
       FROM accounts
      WHERE username = $1`,
    [username],
  );
  return rows[0] ?? null;
}

/**
 * Create a session row inside a transaction so a partial failure does not leak
 * a cookie value that has no DB entry (or vice versa).
 *
 * Returns the raw token to put into Set-Cookie. The hash is what's stored.
 */
export async function createSession(
  accountId: string,
  ttlHours: number
): Promise<{ token: string; csrfToken: string; expiresAt: Date }> {
  const pool = getPool();
  if (!pool) throw new Error('DB pool is not configured');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const token = newSessionToken();
    const idHash = hashSessionId(token);
    const csrf = newCsrfToken();
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    await client.query(
      `INSERT INTO auth_sessions (id_hash, account_id, csrf_token, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [idHash, accountId, csrf, expiresAt],
    );

    await client.query('COMMIT');
    return {
      token,
      csrfToken: csrf.toString('hex'),
      expiresAt,
    };
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Revoke a session by its raw token. Idempotent.
 */
export async function destroySession(token: string): Promise<void> {
  const pool = getPool();
  if (!pool) return;
  await pool.query(
    `UPDATE auth_sessions
        SET revoked_at = statement_timestamp()
      WHERE id_hash = $1
        AND revoked_at IS NULL`,
    [hashSessionId(token)],
  );
}

/**
 * Resolve the account that holds an active session for the given cookie value.
 * Returns null if the cookie is missing, revoked, expired, or mismatched.
 */
export async function findAccountBySessionToken(
  token: string
): Promise<PublicAccount | null> {
  const pool = getPool();
  if (!pool) return null;
  const idHash = hashSessionId(token);
  const { rows } = await pool.query<PublicAccount>(
    `SELECT a.id,
            a.username,
            a.role,
            a.shelter_id AS "shelterId",
            a.is_active AS "isActive"
       FROM auth_sessions s
       JOIN accounts a ON a.id = s.account_id
      WHERE s.id_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > statement_timestamp()
      LIMIT 1`,
    [idHash],
  );
  return rows[0] ?? null;
}
