import type { FastifyInstance } from 'fastify';
import { getPool } from '../db/pool.js';

export async function registerDbDiagnosticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/db/ping', async (_req, reply) => {
    const pool = getPool();
    if (!pool) {
      return reply.code(503).send({
        error: 'DB_UNAVAILABLE',
        message: 'Database connection pool is not configured',
      });
    }
    try {
      const { rows } = await pool.query('SELECT 1 AS ok');
      return {
        status: 'ok',
        result: rows[0]?.ok ?? null,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      app.log.error({ err }, 'db ping failed');
      return reply.code(503).send({
        error: 'DB_UNAVAILABLE',
        message: 'Database did not respond to SELECT 1',
      });
    }
  });

  app.get('/health/detail', async (_req) => {
    const pool = getPool();
    let db = false;
    if (pool) {
      try {
        await pool.query('SELECT 1');
        db = true;
      } catch {
        db = false;
      }
    }
    return { status: 'ok' as const, db, timestamp: new Date().toISOString() };
  });
}
