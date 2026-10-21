#!/usr/bin/env node
// Idempotent demo seeder.
//   node scripts/seed.mjs           -- only seeds when shelters is empty
//   node scripts/seed.mjs --reset   -- wipes subject tables first
//
// Accounts require DEMO_*_PASSWORD env vars. Passwords are Argon2id-hashed.
// No plaintext password is ever stored.

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import pg from 'pg';
import argon2 from 'argon2';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');

// Try to load monorepo .env first, then cwd .env.
for (const candidate of [
  path.resolve(projectRoot, '.env'),
  path.resolve(process.cwd(), '.env'),
]) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}
dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[db:seed] DATABASE_URL is not set');
  process.exit(2);
}

const dataUrl = pathToFileURL(
  path.join(projectRoot, 'db', 'seed', 'data.mjs')
).href;
const { SHELTERS, ACCOUNTS, NEEDS } = await import(dataUrl);

const RESET = process.argv.includes('--reset');

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    if (RESET) {
      console.log('[db:seed] --reset: clearing subject tables');
      await client.query(
        'TRUNCATE TABLE deliveries, offers, needs, accounts, shelters, auth_sessions RESTART IDENTITY CASCADE'
      );
    }

    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM shelters');
    if (!RESET && rows[0].n > 0) {
      console.log('[db:seed] already seeded (shelters > 0); nothing to do.');
      return;
    }

    await client.query('BEGIN');

    for (const s of SHELTERS) {
      await client.query(
        `INSERT INTO shelters (id, name, city, description, address, receiving_hours, is_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           city = EXCLUDED.city,
           description = EXCLUDED.description,
           address = EXCLUDED.address,
           receiving_hours = EXCLUDED.receiving_hours,
           is_published = EXCLUDED.is_published,
           updated_at = CURRENT_TIMESTAMP`,
        [
          s.id,
          s.name,
          s.city,
          s.description,
          s.address,
          s.receiving_hours,
          s.is_published,
        ]
      );
    }

    for (const a of ACCOUNTS) {
      const password = process.env[a.envPasswordKey];
      if (!password || password.length < 8) {
        throw new Error(
          `[db:seed] account ${a.username} requires ${a.envPasswordKey} env var >= 8 chars`
        );
      }
      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
      await client.query(
        `INSERT INTO accounts (id, username, password_hash, role, shelter_id, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           shelter_id = EXCLUDED.shelter_id,
           is_active = TRUE,
           updated_at = CURRENT_TIMESTAMP`,
        [a.id, a.username, passwordHash, a.role, a.shelter_id]
      );
    }

    for (const n of NEEDS) {
      await client.query(
        `INSERT INTO needs (id, shelter_id, category, title, details, target_qty, unit, priority, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
         ON CONFLICT (id) DO UPDATE SET
           shelter_id = EXCLUDED.shelter_id,
           category = EXCLUDED.category,
           title = EXCLUDED.title,
           details = EXCLUDED.details,
           target_qty = EXCLUDED.target_qty,
           unit = EXCLUDED.unit,
           priority = EXCLUDED.priority,
           updated_at = CURRENT_TIMESTAMP`,
        [
          n.id,
          n.shelter_id,
          n.category,
          n.title,
          n.details,
          n.target_qty,
          n.unit,
          n.priority,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(
      `[db:seed] OK: ${SHELTERS.length} shelters, ${ACCOUNTS.length} accounts, ${NEEDS.length} needs.`
    );
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error('[db:seed] FAILED:', err?.message ?? err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
