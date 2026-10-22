#!/usr/bin/env node
// Put the demo database back into a pristine D0 state and print the opening
// balances. Run this before every rehearsal and before the live demo on
// 27.10.2026 — otherwise leftover reservations from an earlier run show up as
// promised stock that nobody actually promised.
//
// Usage: DATABASE_URL=postgres://qdbadmin:qdbadmin@127.0.0.1:15432/postgres node scripts/demo-reset.mjs
//
// It only touches offers and deliveries. Shelters, accounts and needs are the
// reference data and are left alone, so a reset can never desynchronise the
// demo from the migrated dataset.

import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

// One transaction: either the demo starts clean or it does not start at all.
await client.query('BEGIN');

const before = await client.query(
  `SELECT (SELECT count(*) FROM deliveries)::int AS deliveries,
          (SELECT count(*) FROM offers)::int AS offers`,
);

await client.query('DELETE FROM deliveries');
await client.query('DELETE FROM offers');

const after = await client.query(
  `SELECT (SELECT count(*) FROM deliveries)::int AS deliveries,
          (SELECT count(*) FROM offers)::int AS offers`,
);

await client.query('COMMIT');

const { rows } = await client.query(
  `SELECT n.title, n.status, n.priority,
          b.target_qty::text AS target,
          b.reserved_qty::text AS reserved,
          b.received_qty::text AS received,
          b.available_qty::text AS available
     FROM need_balances b
     JOIN needs n ON n.id = b.need_id
    ORDER BY n.priority DESC, n.title`,
);

console.log('=== DEMO RESET ===');
console.log(`  cleared ${before.rows[0].offers} offers, ${before.rows[0].deliveries} deliveries`);
console.log(`  now     ${after.rows[0].offers} offers, ${after.rows[0].deliveries} deliveries`);
console.log('');
console.log('=== D0 OPENING BALANCES ===');
for (const r of rows) {
  console.log(
    `  ${r.title.padEnd(42)} ${r.status.padEnd(6)} ${r.priority.padEnd(7)}` +
      ` требуется=${r.target}  обещано=${r.reserved}  получено=${r.received}  свободно=${r.available}`,
  );
}
console.log('');

const negative = rows.filter((r) => BigInt(r.available) < 0n);
if (negative.length > 0) {
  console.error(`INCONSISTENT: ${negative.length} need(s) have negative available_qty`);
  process.exit(1);
}
console.log('VERDICT: D0 IS CLEAN');

await client.end();