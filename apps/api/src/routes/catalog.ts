import type { FastifyInstance } from 'fastify';
import {
  NeedsQuerySchema,
  SheltersQuerySchema,
  UuidParamSchema,
} from '../schemas/catalog.js';
import {
  listNeeds,
  getNeed,
  listNeedsByShelter,
  listShelters,
  getShelter,
} from '../repositories/catalog.js';

/**
 * Read-only public catalog. No authentication: these are the pages a visitor
 * sees before offering help, and docs/01 requires them to work without signup.
 * Only published shelters and active needs are exposed.
 */
export async function registerCatalogRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/shelters
  app.get('/shelters', async (req, reply) => {
    const parsed = SheltersQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_QUERY',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }
    return listShelters(parsed.data);
  });

  // GET /api/v1/shelters/:id
  app.get('/shelters/:id', async (req, reply) => {
    const parsed = UuidParamSchema.safeParse(req.params ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'id must be a UUID' });
    }
    const shelter = await getShelter(parsed.data.id);
    if (!shelter) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Shelter not found' });
    }
    const needs = await listNeedsByShelter(parsed.data.id);
    return { ...shelter, needs };
  });

  // GET /api/v1/needs
  app.get('/needs', async (req, reply) => {
    const parsed = NeedsQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_QUERY',
        message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
    }
    return listNeeds(parsed.data);
  });

  // GET /api/v1/needs/:id
  app.get('/needs/:id', async (req, reply) => {
    const parsed = UuidParamSchema.safeParse(req.params ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'INVALID_ID', message: 'id must be a UUID' });
    }
    const need = await getNeed(parsed.data.id);
    if (!need) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Need not found' });
    }
    return need;
  });
}