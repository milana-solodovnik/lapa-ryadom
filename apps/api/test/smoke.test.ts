import { describe, it, expect } from 'vitest';
import { buildApp } from '../src/app.js';

describe('smoke', () => {
  it('GET /api/v1/health returns ok', async () => {
    const app = await buildApp({
      env: {
        NODE_ENV: 'test',
        PORT: 4001,
        DATABASE_URL: 'postgres://lapa:lapa@127.0.0.1:55432/lapa',
        TARGET_DATABASE_URL: '',
        SERVER_OFFER_SECRET: 'a'.repeat(48),
        SESSION_COOKIE_NAME: 'lapa_sid',
        SESSION_TTL_HOURS: 8,
        WEB_ORIGIN: 'http://localhost:5173',
      },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/health' });
    expect(res.statusCode).toBe(200);
    const json = res.json();
    expect(json.status).toBe('ok');
    expect(json.service).toBe('lapa-api');
    await app.close();
  });

  it('returns 404 for unknown routes', async () => {
    const app = await buildApp({
      env: {
        NODE_ENV: 'test',
        PORT: 4001,
        DATABASE_URL: 'postgres://lapa:lapa@127.0.0.1:55432/lapa',
        TARGET_DATABASE_URL: '',
        SERVER_OFFER_SECRET: 'a'.repeat(48),
        SESSION_COOKIE_NAME: 'lapa_sid',
        SESSION_TTL_HOURS: 8,
        WEB_ORIGIN: 'http://localhost:5173',
      },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/nonexistent' });
    expect(res.statusCode).toBe(404);
    await app.close();
  });
});
