import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { loadEnv, type AppEnv } from './config/env.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerDbDiagnosticsRoutes } from './routes/db-diagnostics.js';
import { registerCatalogRoutes } from './routes/catalog.js';

export interface BuildAppOptions {
  env?: AppEnv;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const env = options.env ?? loadEnv();

  const app = Fastify({
    logger:
      env.NODE_ENV === 'test'
        ? false
        : {
            level: env.NODE_ENV === 'production' ? 'info' : 'debug',
            redact: ['req.headers.cookie', 'req.headers.authorization'],
          },
    bodyLimit: 16 * 1024,
    trustProxy: false,
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.SESSION_COOKIE_NAME,
  });

  await app.register(registerHealthRoutes, { prefix: '/api/v1' });
  await app.register(registerDbDiagnosticsRoutes, { prefix: '/api/v1' });
  await app.register(registerCatalogRoutes, { prefix: '/api/v1' });

  app.setNotFoundHandler((_req, reply) => {
    void reply.code(404).send({ error: 'NOT_FOUND', message: 'Route not found' });
  });

  return app;
}
