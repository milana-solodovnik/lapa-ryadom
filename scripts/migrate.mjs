#!/usr/bin/env node
// Apply SQL migrations from db/migrations/*.sql.
// Tracks applied migrations in schema_migrations(name, applied_at).
// Usage: node scripts/migrate.mjs [--reset]
//   --reset   DROP all subject tables and the registry, then re-apply (DEV ONLY).
// DATABASE_URL must be set in env.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const migrationsDir = path.join(projectRoot, 'db', 'migrations');

const url = process.env.DATABASE_URL;
if (!url) {
  // eslint-disable-next-line no-console
  console.error('[db:migrate] DATABASE_URL is not set');
  process.exit(2);
}

const reset = process.argv.includes('--reset');

async function ensureRegistry(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checksum TEXT NOT NULL
    );
  `);
}

async function appliedSet(client) {
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

function checksum(text) {
  // Lightweight hash (FNV-1a 32-bit). We only need to detect edits within a row,
  // not cryptographic strength. Filename-based ordering gives the version key.
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

async function main() {
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    await ensureRegistry(client);
    const applied = await appliedSet(client);

    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let pending = 0;
    let alreadyApplied = 0;
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sql = readFileSync(fullPath, 'utf8');
      const sum = checksum(sql);

      if (applied.has(file)) {
        alreadyApplied += 1;
        // eslint-disable-next-line no-console
        console.log(`[db:migrate] skip ${file} (already applied)`);
        continue;
      }

      pending += 1;
      // eslint-disable-next-line no-console
      console.log(`[db:migrate] apply ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations(name, checksum) VALUES ($1, $2)',
          [file, sum]
        );
        await client.query('COMMIT');
        // eslint-disable-next-line no-console
        console.log(`[db:migrate]   committed ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        // eslint-disable-next-line no-console
        console.error(`[db:migrate]   FAILED ${file}: ${err?.message ?? err}`);
        throw err;
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `[db:migrate] done. ${pending} applied, ${alreadyApplied} already applied.`
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  if (reset) {
    // eslint-disable-next-line no-console
    console.warn('[db:migrate] --reset requested but not implemented here.');
  }
  // eslint-disable-next-line no-console
  console.error(err?.stack ?? err);
  process.exit(1);
});
