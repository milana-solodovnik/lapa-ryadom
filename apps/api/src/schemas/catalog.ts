import { z } from 'zod';

/** Query parameters for GET /api/v1/needs. */
export const NeedsQuerySchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  category: z
    .enum(['food', 'hygiene', 'textile', 'equipment', 'carriers', 'other'])
    .optional(),
  priority: z.enum(['normal', 'urgent']).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type NeedsQuery = z.infer<typeof NeedsQuerySchema>;

/** Query parameters for GET /api/v1/shelters. */
export const SheltersQuerySchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type SheltersQuery = z.infer<typeof SheltersQuerySchema>;

export const UuidParamSchema = z.object({
  id: z.string().uuid('must be a valid UUID'),
});

/**
 * A need as shown in the public catalog. The counters are computed by the
 * need_balances view rather than stored, so "promised" and "received" can
 * never drift apart. BigInt columns arrive as strings over the wire.
 */
export const NeedPublicSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  details: z.string().nullable(),
  category: z.string(),
  unit: z.string(),
  priority: z.string(),
  status: z.string(),
  targetQty: z.string(),
  reservedQty: z.string(),
  receivedQty: z.string(),
  availableQty: z.string(),
  shelter: z.object({
    id: z.string().uuid(),
    name: z.string(),
    city: z.string(),
    receivingHours: z.string(),
  }),
});

export const ShelterPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
  description: z.string().nullable(),
  address: z.string(),
  receivingHours: z.string(),
  activeNeedsCount: z.number().int(),
});

export const PagedSchema = z.object({
  items: z.array(z.unknown()),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});