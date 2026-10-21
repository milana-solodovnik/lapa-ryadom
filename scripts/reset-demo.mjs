#!/usr/bin/env node
// Reset the demo dataset to its pristine D0 state.
//
//   node scripts/reset-demo.mjs
//
// Removes offers and deliveries so every need returns to
// required = target, promised = 0, received = 0, available = target.
// Shelter, accounts and needs are left untouched.
//
// Run this before a live demo and after running the integration tests,
// which write real rows into the same development database.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');

for (const candidate of [
  path.resolve(projectRoot, '.env'),
  path.resolve(process.cwd(), '.env'),
]) {
  if (existsSync(candidate)) dotenv.config({ path: candidate });
}
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[db:reset] DATABASE_URL is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const d = await client.query('DELETE FROM deliveries');
  const o = await client.query('DELETE FROM offers');
  console.log(`[db:reset] deleted deliveries=${d.rowCount} offers=${o.rowCount}`);

  const { rows } = await client.query(`
    SELECT n.title, b.target_qty::text AS target,
           b.reserved_qty::text AS reserved,
           b.received_qty::text AS received,
           b.available_qty::text AS available
    FROM need_balances b
    JOIN needs n ON n.id = b.need_id
    ORDER BY n.title
  `);
  console.log(`[db:reset] ${rows.length} needs back to D0:`);
  for (const r of rows) {
    console.log(
      `  ${r.title.padEnd(42)} target=${r.target} reserved=${r.reserved} received=${r.received} available=${r.available}`
    );
  }
} finally {
  await client.end();
}