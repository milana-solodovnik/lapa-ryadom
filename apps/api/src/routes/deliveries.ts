import type { FastifyInstance } from 'fastify';
import { CreateDeliveryBodySchema } from '../schemas/deliveries.js';
import { createDelivery } from '../repositories/deliveries.js';

const STATUS_BY_REASON: Record<string, number> = {
  INVALID_CODE: 400,
  ACCOUNT_NOT_FOUND: 404,
  OFFER_NOT_FOUND: 404,
  ACCOUNT_INACTIVE: 403,
  WRONG_SHELTER: 403,
  OFFER_NOT_RESERVED: 409,
  OFFER_EXPIRED: 409,
  OVER_RECEIVE: 409,
  DELIVERY_EXISTS: 409,
};

export async function registerDeliveryRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Shelter-rep endpoint: mark an offer's reserved stock as physically received.
   *
   * The donor shows up at the shelter front desk with the one-time code. The
   * rep types it into the shelter dashboard. This call is intentionally
   * idempotent at the row level (`deliveries.offer_id UNIQUE`) and at the
   * status level (`offers.status = 'received'`).
   *
   * Authentication is by accountId in the body for the demo; production will
   * replace this with a session cookie and a server-side lookup (DEV-09).
   */
  app.post('/deliveries', async (req, reply) => {
    const parsed = CreateDeliveryBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_BODY',
        message: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      });
    }

    const secret = req.server.env.SERVER_OFFER_SECRET;
    const result = await createDelivery(parsed.data, secret);

    if (!result.ok) {
      return reply.code(STATUS_BY_REASON[result.reason] ?? 400).send({
        error: result.reason,
        message: result.message,
        ...(result.available ? { available: result.available } : {}),
      });
    }

    return reply.code(201).send({
      deliveryId: result.deliveryId,
      offerId: result.offerId,
      needId: result.needId,
      needTitle: result.needTitle,
      needUnit: result.needUnit,
      offerQty: result.offerQty,
      receivedQty: result.receivedQty,
      receivedAt: result.receivedAt,
      remaining: result.remaining,
      notice: 'Принято. Спасибо!',
    });
  });
}
