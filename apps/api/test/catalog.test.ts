import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { closePool, configurePool } from '../src/db/pool.js';

const DB_URL = process.env.TEST_DATABASE_URL ?? 'postgres://db:db@127.0.0.1:55432/db';

let app: FastifyInstance;

beforeAll(async () => {
  configurePool(DB_URL);
  app = await buildApp({
    env: {
      NODE_ENV: 'test',
      PORT: 4001,
      DATABASE_URL: DB_URL,
      TARGET_DATABASE_URL: '',
      SERVER_OFFER_SECRET: 'a'.repeat(48),
      SESSION_COOKIE_NAME: 'lapa_sid',
      SESSION_TTL_HOURS: 8,
      WEB_ORIGIN: 'http://localhost:5173',
    },
  });
});

afterAll(async () => {
  await app.close();
  await closePool();
});

describe('GET /api/v1/shelters', () => {
  it('lists only published shelters with active need counts', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/shelters' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.total).toBe(body.items.length);
    for (const s of body.items) {
      expect(s.name).toBeTruthy();
      expect(s.receivingHours).toBeTruthy();
      expect(typeof s.activeNeedsCount).toBe('number');
      expect(s.activeNeedsCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('filters by city', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/shelters?city=Москва' });
    expect(res.statusCode).toBe(200);
    for (const s of res.json().items) {
      expect(s.city).toBe('Москва');
    }
  });

  it('rejects a non-numeric limit', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/shelters?limit=abc' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('INVALID_QUERY');
  });
});

describe('GET /api/v1/shelters/:id', () => {
  it('returns a shelter with its active needs', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/shelters' });
    const first = list.json().items[0];
    const res = await app.inject({ method: 'GET', url: `/api/v1/shelters/${first.id}` });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(first.id);
    expect(Array.isArray(body.needs)).toBe(true);
    expect(body.activeNeedsCount).toBe(body.needs.length);
  });

  it('returns 400 for a non-UUID id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/shelters/not-a-uuid' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a well-formed but unknown UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/shelters/00000000-0000-4000-a000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/needs', () => {
  it('returns computed counters that satisfy the formula', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items.length).toBeGreaterThan(0);

    for (const n of body.items) {
      const target = BigInt(n.targetQty);
      const reserved = BigInt(n.reservedQty);
      const received = BigInt(n.receivedQty);
      const available = BigInt(n.availableQty);
      expect(available).toBe(target - reserved - received);
      expect(available).toBeGreaterThanOrEqual(0n);
    }
  });

  it('sorts urgent needs first', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs' });
    const items = res.json().items;
    const firstNormalIndex = items.findIndex((n: { priority: string }) => n.priority === 'normal');
    if (firstNormalIndex >= 0) {
      const urgentAfterNormal = items
        .slice(firstNormalIndex)
        .some((n: { priority: string }) => n.priority === 'urgent');
      expect(urgentAfterNormal).toBe(false);
    }
  });

  it('filters by category', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs?category=food' });
    expect(res.statusCode).toBe(200);
    for (const n of res.json().items) {
      expect(n.category).toBe('food');
    }
  });

  it('filters by city', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs?city=Омск' });
    expect(res.statusCode).toBe(200);
    for (const n of res.json().items) {
      expect(n.shelter.city).toBe('Омск');
    }
  });

  it('searches by title and shelter name', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs?q=корм' });
    expect(res.statusCode).toBe(200);
    for (const n of res.json().items) {
      const haystack = `${n.title} ${n.shelter.name}`.toLowerCase();
      expect(haystack).toContain('корм');
    }
  });

  it('paginates and reports a stable total', async () => {
    const page1 = await app.inject({ method: 'GET', url: '/api/v1/needs?limit=3&offset=0' });
    const page2 = await app.inject({ method: 'GET', url: '/api/v1/needs?limit=3&offset=3' });
    expect(page1.statusCode).toBe(200);
    expect(page1.json().items.length).toBeLessThanOrEqual(3);
    expect(page1.json().total).toBe(page2.json().total);

    const ids1 = page1.json().items.map((n: { id: string }) => n.id);
    const ids2 = page2.json().items.map((n: { id: string }) => n.id);
    for (const id of ids2) expect(ids1).not.toContain(id);
  });

  it('rejects an unknown category', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs?category=weapons' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a limit above the maximum', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/needs?limit=1000' });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/needs/:id', () => {
  it('returns a single need with counters', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/v1/needs' });
    const first = list.json().items[0];
    const res = await app.inject({ method: 'GET', url: `/api/v1/needs/${first.id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(first.id);
  });

  it('returns 404 for an unknown UUID', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/needs/00000000-0000-4000-a000-000000000000',
    });
    expect(res.statusCode).toBe(404);
  });
});