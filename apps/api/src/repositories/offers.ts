import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import { getPool } from '../db/pool.js';
import { generateOfferCode, hashOfferCode } from '../services/offer-code.js';
import { RESERVATION_DAYS, type CreateOfferBody } from '../schemas/offers.js';

export type CreateOfferResult =
  | {
      ok: true;
      offerId: string;
      code: string;
      expiresAt: string;
      remaining: string;
      need: { id: string; title: string; unit: string };
    }
  | {
      ok: false;
      reason:
        | 'NEED_NOT_FOUND'
        | 'NEED_CLOSED'
        | 'NOT_ENOUGH_AVAILABLE'
        | 'IDEMPOTENCY_REPLAY'
        | 'CODE_COLLISION';
      message: string;
      available?: string;
    };

/**
 * Recompute the live counters inside the transaction, using the same formula as
 * the need_balances view but evaluated against locked state.
 *
 * The lock and the counting MUST be two separate statements. Under READ
 * COMMITTED a blocking `SELECT ... FOR UPDATE` keeps the snapshot it started
 * with: when the loser of a race unblocks, the correlated sub-selects in that
 * same statement still read the state that was committed before the winner
 * finished, so the loser sees free stock that is already gone and both
 * reservations succeed. Splitting the statements means the count runs on a
 * snapshot taken after we own the lock, i.e. after the previous holder
 * committed.
 *
 * Verified by scripts/probe-fu-lock.mjs on both reference PostgreSQL 17.10
 * and Digital Q.DataBase 18.2.
 */
async function readNeedForUpdate(
  client: PoolClient,
  needId: string
): Promise<{ id: string; title: string; unit: string; status: string; available: string } | null> {
  const locked = await client.query('SELECT id FROM needs WHERE id = $1 FOR UPDATE', [needId]);
  if (locked.rows.length === 0) return null;

  const { rows } = await client.query<{
    id: string;
    title: string;
    unit: string;
    status: string;
    target_qty: string;
    reserved_qty: string;
    received_qty: string;
  }>(
    `SELECT n.id, n.title, n.unit, n.status,
            n.target_qty::text AS target_qty,
            COALESCE((
              SELECT SUM(o.quantity) FROM offers o
               WHERE o.need_id = n.id
                 AND o.status = 'reserved'
                 AND o.expires_at > statement_timestamp()
            ), 0)::text AS reserved_qty,
            COALESCE((
              SELECT SUM(d.received_qty)
              FROM deliveries d
              JOIN offers o ON o.id = d.offer_id
              WHERE o.need_id = n.id
            ), 0)::text AS received_qty
     FROM needs n
     WHERE n.id = $1
     FOR UPDATE`,
    [needId]
  );

  const row = rows[0];
  if (!row) return null;
  const available =
    BigInt(row.target_qty) - BigInt(row.reserved_qty) - BigInt(row.received_qty);
  return {
    id: row.id,
    title: row.title,
    unit: row.unit,
    status: row.status,
    available: available.toString(),
  };
}

export async function createOffer(
  body: CreateOfferBody,
  serverSecret: string
): Promise<CreateOfferResult> {
  const pool = getPool();
  if (!pool) throw new Error('DB pool is not configured');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency first: a replay must not consume a slot or touch the need.
    const replay = await client.query<{ id: string }>(
      'SELECT id FROM offers WHERE idempotency_key = $1',
      [body.idempotencyKey]
    );
    if (replay.rows.length > 0) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'IDEMPOTENCY_REPLAY',
        message:
          'Заявка с таким idempotencyKey уже создана. Код был показан один раз и в базе не хранится.',
      };
    }

    const need = await readNeedForUpdate(client, body.needId);
    if (!need) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'NEED_NOT_FOUND', message: 'Потребность не найдена' };
    }
    if (need.status !== 'active') {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'NEED_CLOSED',
        message: 'Потребность больше не принимает помощь',
      };
    }

    const available = BigInt(need.available);
    const requested = BigInt(body.quantity);
    if (requested > available) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'NOT_ENOUGH_AVAILABLE',
        message: `Свободно только ${need.available}, запрошено ${body.quantity}`,
        available: need.available,
      };
    }

    const code = generateOfferCode();
    const codeHash = hashOfferCode(code, serverSecret);
    const offerId = randomUUID();

    try {
      await client.query(
        `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'reserved', statement_timestamp() + ($6 || ' days')::interval)`,
        [offerId, need.id, body.quantity, body.idempotencyKey, codeHash, String(RESERVATION_DAYS)]
      );
    } catch (err) {
      // Two visitors can in principle draw the same 80-bit code. The UNIQUE
      // constraint catches it; retry once with a fresh code rather than failing
      // the visitor for something that is not their fault.
      const code_ = err as { code?: string };
      if (code_.code !== '23505') throw err;
      const retryCode = generateOfferCode();
      await client.query(
        `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'reserved', statement_timestamp() + ($6 || ' days')::interval)`,
        [
          offerId,
          need.id,
          body.quantity,
          body.idempotencyKey,
          hashOfferCode(retryCode, serverSecret),
          String(RESERVATION_DAYS),
        ]
      );
      await client.query('COMMIT');
      return {
        ok: true,
        offerId,
        code: retryCode,
        expiresAt: new Date(Date.now() + RESERVATION_DAYS * 86400000).toISOString(),
        remaining: (available - requested).toString(),
        need: { id: need.id, title: need.title, unit: need.unit },
      };
    }

    const expires = await client.query<{ expires_at: Date }>(
      'SELECT expires_at FROM offers WHERE id = $1',
      [offerId]
    );
    await client.query('COMMIT');

    return {
      ok: true,
      offerId,
      code,
      expiresAt: (expires.rows[0]?.expires_at ?? new Date()).toISOString(),
      remaining: (available - requested).toString(),
      need: { id: need.id, title: need.title, unit: need.unit },
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