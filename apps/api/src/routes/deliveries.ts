import type { FastifyInstance } from 'fastify';
import { CreateDeliveryBodySchema } from '../schemas/deliveries.js';
import { createDelivery } from '../repositories/deliveries.js';
import { currentAccount } from './auth.js';

const STATUS_BY_REASON: Record<string, number> = {
  INVALID_BODY: 400,
  INVALID_CODE: 400,
  NOT_AUTHENTICATED: 401,
  ACCOUNT_INACTIVE: 403,
  WRONG_SHELTER: 403,
  ACCOUNT_NOT_FOUND: 404,
  OFFER_NOT_FOUND: 404,
  OFFER_NOT_RESERVED: 409,
  OFFER_EXPIRED: 409,
  OVER_RECEIVE: 409,
  DELIVERY_EXISTS: 409,
};

export async function registerDeliveryRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Shelter-rep endpoint: mark an offer's reserved stock as physically
   * received. Authentication comes from the session cookie set by
   * POST /auth/login. The body only carries the human-readable code and the
   * actual quantity — never an account id.
   */
  app.post('/deliveries', async (req, reply) => {
    const account = await currentAccount(req);
    if (!account) {
      return reply.code(401).send({
        error: 'NOT_AUTHENTICATED',
        message: 'Войдите как представитель приюта.',
      });
    }

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
    const result = await createDelivery(parsed.data, account, secret);

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
