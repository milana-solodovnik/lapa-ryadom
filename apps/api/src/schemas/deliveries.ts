import { z } from 'zod';

/**
 * POST /api/v1/deliveries body.
 *
 * The shelter rep types the human-readable code from the donor's slip. The code
 * is normalised and HMAC-hashed on the server, only the hash is ever stored.
 *
 * Authentication (DEV-09) will replace `accountId` with a session cookie; for
 * the demo we identify the accepting rep by account id and verify the role /
 * shelter binding inside the repository.
 */
export const CreateDeliveryBodySchema = z.object({
  code: z
    .string()
    .min(4, 'code is too short')
    .max(32, 'code is too long'),
  receivedQty: z.coerce
    .number()
    .int('receivedQty must be a whole number')
    .positive('receivedQty must be greater than zero')
    .max(1_000_000, 'receivedQty is unrealistically large'),
  accountId: z.string().uuid('accountId must be a UUID'),
});

export type CreateDeliveryBody = z.infer<typeof CreateDeliveryBodySchema>;
