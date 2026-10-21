import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { getPool } from '../db/pool.js';
import {
  hashOfferCode,
  isWellFormed,
  normaliseCode,
} from '../services/offer-code.js';
import type { CreateDeliveryBody } from '../schemas/deliveries.js';

/**
 * Result of POST /api/v1/deliveries.
 *
 * The closure is the same shape used by createOffer: a discriminant union of
 * `ok: true` (the happy path) and `ok: false` with a stable `reason` that the
 * route layer maps to an HTTP status code.
 */
export type CreateDeliveryResult =
  | {
      ok: true;
      deliveryId: string;
      offerId: string;
      needId: string;
      needTitle: string;
      needUnit: string;
      offerQty: string;
      receivedQty: string;
      receivedAt: string;
      remaining: string;
    }
  | {
      ok: false;
      reason:
        | 'INVALID_CODE'
        | 'OFFER_NOT_FOUND'
        | 'OFFER_NOT_RESERVED'
        | 'OFFER_EXPIRED'
        | 'OVER_RECEIVE'
        | 'DELIVERY_EXISTS'
        | 'ACCOUNT_NOT_FOUND'
        | 'ACCOUNT_INACTIVE'
        | 'WRONG_SHELTER';
      message: string;
      available?: string;
    };

interface AccountRow {
  id: string;
  role: string;
  shelter_id: string | null;
  is_active: boolean;
}

interface OfferRow {
  id: string;
  need_id: string;
  quantity: string;
  status: string;
  expires_at: Date;
}

interface NeedRow {
  id: string;
  title: string;
  unit: string;
  status: string;
  shelter_id: string;
}

/**
 * Find the offer keyed by the human-readable code, locking the row so the
 * "accept delivery" call cannot race with status changes (cancel, expire, or a
 * second shelter rep).
 *
 * We DO NOT iterate over the whole offers table: every code is hashed the same
 * way and the UNIQUE constraint on code_hash makes a single-row lookup safe.
 */
async function lockOfferByCode(
  client: PoolClient,
  codeHash: Buffer
): Promise<OfferRow | null> {
  const { rows } = await client.query<OfferRow>(
    `SELECT id, need_id, quantity::text AS quantity, status, expires_at
       FROM offers
      WHERE code_hash = $1
        FOR UPDATE`,
    [codeHash]
  );
  return rows[0] ?? null;
}

async function lockNeed(
  client: PoolClient,
  needId: string
): Promise<NeedRow | null> {
  const { rows } = await client.query<NeedRow>(
    `SELECT id, title, unit, status, shelter_id
       FROM needs
      WHERE id = $1
        FOR UPDATE`,
    [needId]
  );
  return rows[0] ?? null;
}

export async function createDelivery(
  body: CreateDeliveryBody,
  serverSecret: string
): Promise<CreateDeliveryResult> {
  const pool = getPool();
  if (!pool) throw new Error('DB pool is not configured');

  // Pre-flight: malformed codes never touch the database.
  const normalised = normaliseCode(body.code);
  if (!isWellFormed(normalised)) {
    return {
      ok: false,
      reason: 'INVALID_CODE',
      message: 'Код должен состоять из 16 символов без 0/O/1/I/L.',
    };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const codeHash = hashOfferCode(normalised, serverSecret);

    // Validate the accepting account.
    const acct = await client.query<AccountRow>(
      `SELECT id, role, shelter_id, is_active
         FROM accounts
        WHERE id = $1`,
      [body.accountId]
    );
    const account = acct.rows[0];
    if (!account) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'ACCOUNT_NOT_FOUND',
        message: 'Аккаунт не найден.',
      };
    }
    if (!account.is_active) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'ACCOUNT_INACTIVE',
        message: 'Аккаунт деактивирован.',
      };
    }
    if (account.role !== 'shelter_rep' || account.shelter_id === null) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'WRONG_SHELTER',
        message: 'Только представитель приюта может принять помощь.',
      };
    }

    // Lock the offer row.
    const offer = await lockOfferByCode(client, codeHash);
    if (!offer) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_NOT_FOUND',
        message: 'Код не найден или уже погашен.',
      };
    }

    // Status / expiry checks BEFORE any update. expires_at is checked here
    // because the visitor is acting now, not at booking time.
    if (offer.status === 'received') {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'DELIVERY_EXISTS',
        message: 'Помощь по этому коду уже принята.',
      };
    }
    if (offer.status === 'cancelled') {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_NOT_RESERVED',
        message: 'Заявка отменена дарителем.',
      };
    }
    if (offer.status === 'expired') {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_EXPIRED',
        message: 'Срок бронирования истёк.',
      };
    }
    if (offer.status !== 'reserved') {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_NOT_RESERVED',
        message: `Заявка в статусе «${offer.status}», приём невозможен.`,
      };
    }
    if (offer.expires_at.getTime() <= Date.now()) {
      // Mark expired so subsequent reads see the truth.
      await client.query(
        `UPDATE offers SET status = 'expired' WHERE id = $1 AND status = 'reserved'`,
        [offer.id]
      );
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_EXPIRED',
        message: 'Срок бронирования истёк.',
      };
    }

    // Verify the need and the shelter binding.
    const need = await lockNeed(client, offer.need_id);
    if (!need) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OFFER_NOT_FOUND',
        message: 'Потребность, к которой относится код, больше не существует.',
      };
    }
    if (need.shelter_id !== account.shelter_id) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'WRONG_SHELTER',
        message: 'Код принадлежит другому приюту.',
      };
    }

    // Quantity guard: cannot physically receive more than was promised.
    const offerQty = BigInt(offer.quantity);
    const receivedQty = BigInt(body.receivedQty);
    if (receivedQty > offerQty) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        reason: 'OVER_RECEIVE',
        message: `Заявлено ${offer.quantity} ${need.unit}, получить можно не больше.`,
        available: offer.quantity,
      };
    }

    // Mark offer received and insert delivery in one transaction. The UNIQUE
    // constraint on deliveries.offer_id is a belt-and-braces duplicate guard.
    const deliveryId = randomUUID();
    await client.query(
      `UPDATE offers SET status = 'received' WHERE id = $1`,
      [offer.id]
    );
    try {
      await client.query(
        `INSERT INTO deliveries (id, offer_id, received_qty, accepted_by)
         VALUES ($1, $2, $3, $4)`,
        [deliveryId, offer.id, body.receivedQty, account.id]
      );
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === '23505') {
        // A parallel worker already inserted a delivery for this offer.
        await client.query('ROLLBACK');
        return {
          ok: false,
          reason: 'DELIVERY_EXISTS',
          message: 'Помощь по этому коду уже принята.',
        };
      }
      throw err;
    }

    const recv = await client.query<{ received_at: Date }>(
      `SELECT received_at FROM deliveries WHERE id = $1`,
      [deliveryId]
    );

    // Live available qty for the need, computed the same way as need_balances
    // so the page refresh in the donor's browser shows consistent numbers.
    const remainingRow = await client.query<{ available: string }>(
      `SELECT (n.target_qty - COALESCE((
         SELECT SUM(o.quantity) FROM offers o
          WHERE o.need_id = n.id AND o.status = 'reserved'
            AND o.expires_at > statement_timestamp()
        ), 0) - COALESCE((
         SELECT SUM(d.received_qty)
           FROM deliveries d JOIN offers o ON o.id = d.offer_id
          WHERE o.need_id = n.id
        ), 0))::text AS available
       FROM needs n WHERE n.id = $1`,
      [need.id]
    );

    await client.query('COMMIT');

    const receivedAt = recv.rows[0]?.received_at ?? new Date();
    return {
      ok: true,
      deliveryId,
      offerId: offer.id,
      needId: need.id,
      needTitle: need.title,
      needUnit: need.unit,
      offerQty: offer.quantity,
      receivedQty: body.receivedQty.toString(),
      receivedAt: new Date(receivedAt).toISOString(),
      remaining: remainingRow.rows[0]?.available ?? '0',
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
