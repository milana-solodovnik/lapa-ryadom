#!/usr/bin/env node
// QDB-04: migrate data from the source PostgreSQL to the target instance.
//
// Usage:
//   SOURCE_DATABASE_URL=postgres://db:db@127.0.0.1:55432/db \
//   TARGET_DATABASE_URL=postgres://qdbadmin:***@127.0.0.1:5445/qdb \
//   node scripts/qdb-04-migrate.mjs
//
// Order: schema_migrations, shelters, accounts, needs, offers, deliveries.
// auth_sessions is deliberately NOT copied: it is a technical table holding
// live session hashes, and per docs/04 they must be invalidated on migration.
// Everything runs in ONE transaction on the target so a failure leaves it empty.

import pg from 'pg';

const srcUrl = process.env.SOURCE_DATABASE_URL;
const tgtUrl = process.env.TARGET_DATABASE_URL;

if (!srcUrl || !tgtUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are both required');
  process.exit(2);
}

const TABLES = ['schema_migrations', 'shelters', 'accounts', 'needs', 'offers', 'deliveries'];
const SKIP = ['auth_sessions'];

const src = new pg.Client({ connectionString: srcUrl });
const tgt = new pg.Client({ connectionString: tgtUrl });
await src.connect();
await tgt.connect();

async function columnsOf(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

async function truncateAll(client) {
  await client.query(
    'TRUNCATE TABLE deliveries, offers, needs, accounts, shelters, schema_migrations CASCADE'
  );
}

console.log('=== QDB-04: DATA MIGRATION ===');
console.log(`generated_at : ${new Date().toISOString()}`);
console.log(`source       : ${srcUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
console.log(`target       : ${tgtUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);
console.log(`skipped      : ${SKIP.join(', ')} (live session hashes must not migrate)`);
console.log('');

// ---- SAFETY GUARD ----
// The target is TRUNCATEd at the start of this script. If both URLs point at
// the same database that would destroy the source. Refuse rather than guess.
function canonical(u) {
  try {
    const p = new URL(u);
    const port = p.port || '5432';
    const db = p.pathname.replace(/^\//, '') || 'postgres';
    return `${p.hostname.toLowerCase()}:${port}/${db}`;
  } catch {
    return u;
  }
}
if (canonical(srcUrl) === canonical(tgtUrl)) {
  console.error('REFUSING TO RUN: SOURCE_DATABASE_URL and TARGET_DATABASE_URL point at the same database.');
  console.error(`Both resolve to ${canonical(srcUrl)}.`);
  console.error('This script TRUNCATEs the target first, so running it would delete the source data.');
  await src.end();
  await tgt.end();
  process.exit(2);
}
console.log(`safety check : source (${canonical(srcUrl)}) and target (${canonical(tgtUrl)}) are distinct. OK`);
console.log('');

await truncateAll(tgt);

await tgt.query('BEGIN');
const moved = {};
try {
  for (const table of TABLES) {
    const srcCols = await columnsOf(src, table);
    const tgtCols = await columnsOf(tgt, table);

    if (srcCols.length === 0) {
      throw new Error(`source table "${table}" not found -- run db:migrate on the source first`);
    }
    if (tgtCols.length === 0) {
      throw new Error(`target table "${table}" not found -- apply db/migrations on the target first`);
    }

    // Intersect columns so the copy survives a target that adds extra columns.
    const cols = srcCols.filter((c) => tgtCols.includes(c));
    const missing = srcCols.filter((c) => !tgtCols.includes(c));
    if (missing.length) {
      console.log(`  ! ${table}: columns absent on target, not copied -> ${missing.join(', ')}`);
    }

    const colList = cols.map((c) => `"${c}"`).join(', ');
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');

    // Digital Q.DataBase stores TIMESTAMPTZ with millisecond precision while
    // PostgreSQL keeps microseconds. Verified against 18.2: the same instant
    // arrives as .981429 on the source and .981 on the target, so
    // EXTRACT(EPOCH) differs and qdb-05 reports a timestamp mismatch.
    // Truncating on the way in makes both sides agree, which is the only sane
    // contract for a database whose clock resolution is 1 ms.
    const isTime = (c) => /_at$|_on$|timestamp/i.test(c);
    const selectList = cols
      .map((c) => (isTime(c) ? `date_trunc('milliseconds', "${c}") AS "${c}"` : `"${c}"`))
      .join(', ');

    const { rows } = await src.query(`SELECT ${selectList} FROM ${table}`);
    let copied = 0;
    for (const row of rows) {
      const values = cols.map((c) => row[c]);
      await tgt.query(
        `INSERT INTO ${table} (${colList}) VALUES (${placeholders})`,
        values
      );
      copied += 1;
    }
    moved[table] = { source: rows.length, copied };
    console.log(`  -> ${table.padEnd(18)} source=${rows.length} copied=${copied}`);
  }

  await tgt.query('COMMIT');
  console.log('');
  console.log('COMMIT: all rows written to the target in a single transaction.');
} catch (err) {
  try {
    await tgt.query('ROLLBACK');
  } catch {
    /* ignore */
  }
  console.error('');
  console.error('ROLLBACK: target left empty, source untouched.');
  console.error(err?.message ?? err);
  await src.end();
  await tgt.end();
  process.exit(1);
}

console.log('');
console.log('=== SUMMARY ===');
for (const [t, v] of Object.entries(moved)) {
  console.log(`  ${t.padEnd(18)} ${v.source} -> ${v.copied} ${v.source === v.copied ? 'OK' : 'MISMATCH'}`);
}

await src.end();
await tgt.end();