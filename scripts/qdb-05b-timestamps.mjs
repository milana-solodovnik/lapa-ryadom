#!/usr/bin/env node
// Diagnostic for the QDB-05 timestamp mismatch.
//
// The verifier compares `created_at::text` on both sides. Q.DataBase renders
// TIMESTAMPTZ with a different textual form than vanilla PostgreSQL (it honours
// the ICU collation locale and may print a different offset or precision), so a
// string compare reports a difference even when the instants are identical.
//
// This script compares the instants numerically and prints both renderings so
// the real cause is visible instead of guessed at.
//
// Usage:
//   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... node scripts/qdb-05b-timestamps.mjs

import pg from 'pg';

const srcUrl = process.env.SOURCE_DATABASE_URL;
const tgtUrl = process.env.TARGET_DATABASE_URL;
if (!srcUrl || !tgtUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are required');
  process.exit(2);
}

const src = new pg.Client({ connectionString: srcUrl });
const tgt = new pg.Client({ connectionString: tgtUrl });
await src.connect();
await tgt.connect();

const TABLES = {
  shelters: ['created_at', 'updated_at'],
  accounts: ['created_at', 'updated_at'],
  needs: ['created_at', 'updated_at'],
  offers: ['created_at', 'expires_at', 'cancelled_at'],
  deliveries: ['received_at'],
};

let mismatches = 0;

for (const [table, cols] of Object.entries(TABLES)) {
  console.log(`\n=== ${table} (${cols.join(', ')}) ===`);

  const selText = `id::text, ${cols.map((c) => `${c}::text AS ${c}_txt, ${c}::timestamptz AS ${c}_ts`).join(', ')}`;
  const s = await src.query(`SELECT ${selText} FROM ${table} ORDER BY id`);
  const g = await tgt.query(`SELECT ${selText} FROM ${table} ORDER BY id`);

  let tableMismatch = 0;

  for (let i = 0; i < s.rows.length; i += 1) {
    for (const c of cols) {
      const a = s.rows[i][`${c}_txt`];
      const b = g.rows[i][`${c}_txt`];
      if (a !== b) {
        tableMismatch += 1;
        // Compare as instants to see whether the values are actually equal.
        const epochSql = `SELECT EXTRACT(EPOCH FROM ${c})::text AS e FROM ${table} WHERE id = $1`;
        const sa = await src.query(epochSql, [s.rows[i].id]);
        const ta = await tgt.query(epochSql, [g.rows[i].id]);
        const eq = sa.rows[0]?.e === ta.rows[0]?.e;
        console.log(`  ${s.rows[i].id.slice(0, 8)}…  ${c}`);
        console.log(`    source : ${a}`);
        console.log(`    target : ${b}`);
        console.log(`    epoch  : source=${sa.rows[0]?.e} target=${ta.rows[0]?.e}  -> ${eq ? 'РАВНЫ как моменты времени' : 'РЕАЛЬНО РАЗНЫЕ'}`);
      }
    }
  }

  if (tableMismatch === 0) {
    console.log('  все текстовые представления совпадают');
  } else {
    console.log(`  расхождений в тексте: ${tableMismatch}`);
    mismatches += tableMismatch;
  }
}

console.log('');
console.log(
  mismatches === 0
    ? 'VERDICT: TIMESTAMPS IDENTICAL'
    : `VERDICT: ${mismatches} textual mismatches (see epoch comparison above for real differences)`,
);

await src.end();
await tgt.end();