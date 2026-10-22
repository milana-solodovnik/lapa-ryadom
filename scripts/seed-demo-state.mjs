#!/usr/bin/env node
// Build a realistic D1/D2 state on the SOURCE database so the migration proof
// has something to carry: three reserved offers and one accepted delivery.
//
// Usage: DATABASE_URL=postgres://db:db@127.0.0.1:55850/db node scripts/seed-demo-state.mjs

import pg from 'pg';
import { createHmac, randomInt, randomUUID } from 'node:crypto';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(2);
}

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const normalise = (s) =>
  s.toUpperCase().split('').filter((c) => ALPHABET.includes(c)).join('');
const hash = (code, secret) =>
  createHmac('sha256', secret).update(normalise(code), 'utf8').digest();
const newCode = () =>
  [0, 1, 2, 3]
    .map(() => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''))
    .join('-');

const secret = process.env.SERVER_OFFER_SECRET;
if (!secret) {
  console.error('SERVER_OFFER_SECRET is not set');
  process.exit(2);
}

// [needId, quantity] — two shelters, three needs
const PLAN = [
  ['10000001-0000-4000-a000-000000000001', 5], // Сухой корм
  ['10000001-0000-4000-a000-000000000002', 12], // Наполнитель
  ['10000002-0000-4000-a000-000000000001', 8], // Консервы
  ['10000002-0000-4000-a000-000000000002', 4], // Переноски
];
const REP_A = 'aaaaaaaa-bbbb-4ccc-aaaa-aaaaaaaaaa01';

const client = new pg.Client({ connectionString: url });
await client.connect();

const made = [];
for (const [needId, qty] of PLAN) {
  const code = newCode();
  const id = randomUUID();
  await client.query(
    `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'reserved', statement_timestamp() + interval '7 days')`,
    [id, needId, qty, randomUUID(), hash(code, secret)],
  );
  made.push({ id, code, qty, needId });
}

// D2: the first offer becomes an accepted delivery.
const accepted = made[0];
await client.query(
  `INSERT INTO deliveries (id, offer_id, received_qty, accepted_by)
   VALUES ($1, $2, $3, $4)`,
  [randomUUID(), accepted.id, accepted.qty, REP_A],
);
await client.query(`UPDATE offers SET status = 'received' WHERE id = $1`, [accepted.id]);

console.log('=== DEMO STATE BUILT ON SOURCE ===');
for (const m of made) {
  console.log(
    `  offer ${m.code}  need=${m.needId.slice(0, 8)}…  qty=${m.qty}` +
      (m.id === accepted.id ? '   <- delivered (D2)' : ''),
  );
}
console.log('');
console.log(`OFFER_CODES=${made.map((m) => m.code).join(',')}`);
console.log(`DELIVERED_CODE=${accepted.code}`);

const { rows } = await client.query(
  `SELECT n.title,
          b.target_qty::text AS target,
          b.reserved_qty::text AS reserved,
          b.received_qty::text AS received,
          b.available_qty::text AS available
     FROM need_balances b
     JOIN needs n ON n.id = b.need_id
    WHERE b.reserved_qty > 0 OR b.received_qty > 0
    ORDER BY n.title`,
);
console.log('');
console.log('=== BALANCES (source) ===');
for (const r of rows) {
  console.log(
    `  ${r.title.padEnd(40)} target=${r.target} reserved=${r.reserved} received=${r.received} available=${r.available}`,
  );
}

await client.end();