import type { FastifyInstance } from 'fastify';
import { CreateOfferBodySchema } from '../schemas/offers.js';
import { createOffer } from '../repositories/offers.js';

const STATUS_BY_REASON: Record<string, number> = {
  NEED_NOT_FOUND: 404,
  NEED_CLOSED: 409,
  NOT_ENOUGH_AVAILABLE: 409,
  IDEMPOTENCY_REPLAY: 409,
  CODE_COLLISION: 500,
};

export async function registerOfferRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Public endpoint: a visitor offers help without an account.
   * No authentication, no rate limiting yet (DEV-15), but the idempotency key
   * and the row lock already make double submits harmless.
   */
  app.post('/offers', async (req, reply) => {
    const parsed = CreateOfferBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_BODY',
        message: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      });
    }

    const secret = req.server.env.SERVER_OFFER_SECRET;
    const result = await createOffer(parsed.data, secret);

    if (!result.ok) {
      return reply.code(STATUS_BY_REASON[result.reason] ?? 400).send({
        error: result.reason,
        message: result.message,
        ...(result.available ? { available: result.available } : {}),
      });
    }

    return reply.code(201).send({
      offerId: result.offerId,
      code: result.code,
      expiresAt: result.expiresAt,
      remaining: result.remaining,
      need: result.need,
      notice: 'Код показывается один раз. Сохраните его.',
    });
  });
}