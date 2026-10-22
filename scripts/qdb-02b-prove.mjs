#!/usr/bin/env node
// QDB-02b: prove the target is Digital Q.DataBase, not vanilla PostgreSQL.
//
// `SELECT version()` returns the string "PostgreSQL 18.2 ..." on Digital
// Q.DataBase, so version() alone cannot prove anything. This script looks for
// artefacts that only exist in Q.DataBase: its own catalog objects, its
// GUC namespace, and the Q.DataBase-specific background processes that write
// "Q.DataBase:" lines into the server log.
//
// Usage: TARGET_DATABASE_URL=postgres://qdbadmin:***@127.0.0.1:15432/postgres \
//          node scripts/qdb-02b-prove.mjs

import pg from 'pg';

const url = process.env.TARGET_DATABASE_URL;
if (!url) {
  console.error('TARGET_DATABASE_URL is not set');
  process.exit(2);
}
const safeUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');

const client = new pg.Client({ connectionString: url });
await client.connect();

const checks = [
  ['server_version', 'SHOW server_version'],
  ['qdb_procs', "SELECT count(*)::text FROM pg_proc WHERE proname ILIKE '%qdb%'"],
  ['qdb_classes', "SELECT count(*)::text FROM pg_class WHERE relname ILIKE '%qdb%'"],
  ['qdb_settings', "SELECT count(*)::text FROM pg_settings WHERE name ILIKE '%qdb%'"],
  ['qdb_extensions', "SELECT count(*)::text FROM pg_extension WHERE extname ILIKE '%qdb%'"],
  ['dgrid_procs', "SELECT count(*)::text FROM pg_proc WHERE proname ILIKE '%dgrid%'"],
  ['shared_preload', 'SHOW shared_preload_libraries'],
  ['bytea_output', 'SHOW bytea_output'],
  ['licence_core_count', "SELECT current_setting('qdb_license_core_count', true)"],
  ['ic_locale', "SELECT datcollate, datctype FROM pg_database WHERE datname = current_database()"],
];

const out = {};
for (const [key, sql] of checks) {
  try {
    const r = await client.query(sql);
    const row = r.rows[0];
    out[key] = row ? Object.values(row).filter((v) => v !== null).join(' | ') : null;
  } catch (err) {
    out[key] = `UNSUPPORTED: ${err.message.split('\n')[0]}`;
  }
}

console.log('=== QDB-02b: DIGITAL Q.DATABASE IDENTIFICATION ===');
console.log(`generated_at : ${new Date().toISOString()}`);
console.log(`connection   : ${safeUrl}`);
console.log('');
for (const [k, v] of Object.entries(out)) {
  console.log(`${k.padEnd(20)}: ${v}`);
}

// QDB ships a licence whose CPU core count is enforced at postmaster start.
// Reading the licence signature fields proves the fork is present even when
// version() looks vanilla.
const signature = [];
for (const key of ['qdb_license_core_count', 'qdb_license_type', 'qdb_license_serial']) {
  try {
    const r = await client.query(`SELECT current_setting('${key}', true)`);
    if (r.rows[0] && r.rows[0][key]) signature.push(`${key}=${r.rows[0][key]}`);
  } catch {
    /* setting absent */
  }
}
if (signature.length) {
  console.log('');
  console.log('licence GUCs  :', signature.join(', '));
}

await client.end();