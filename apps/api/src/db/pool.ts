import pg, { type Pool } from 'pg';
import { loadEnv } from '../config/env.js';

let pool: Pool | undefined;

export function configurePool(url: string): Pool {
  if (pool) return pool;
  pool = new pg.Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  pool.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[pg-pool] idle client error', err);
  });
  return pool;
}

export function getPool(): Pool | undefined {
  if (pool) return pool;
  try {
    const env = loadEnv();
    if (!env.DATABASE_URL) return undefined;
    return configurePool(env.DATABASE_URL);
  } catch {
    return undefined;
  }
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  if (!p) throw new Error('DB pool is not configured');
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
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
