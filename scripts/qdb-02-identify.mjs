#!/usr/bin/env node
// QDB-02: identify the target instance and capture a secret-free report.
//
// Usage: TARGET_DATABASE_URL=postgres://qdbadmin:***@127.0.0.1:5445/qdb node scripts/qdb-02-identify.mjs
//
// Prints version, build, encoding and dialect information needed as evidence
// for the presentation. Never prints credentials.

import pg from 'pg';

const url = process.env.TARGET_DATABASE_URL;
if (!url) {
  console.error('TARGET_DATABASE_URL is not set');
  process.exit(2);
}

const safeUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');

const client = new pg.Client({ connectionString: url });
await client.connect();

const probes = [
  ['SELECT version()', 'version'],
  ['SHOW server_version', 'server_version'],
  ['SHOW server_encoding', 'server_encoding'],
  ['SHOW lc_collate', 'lc_collate'],
  ['SHOW integer_datetimes', 'integer_datetimes'],
  ["SELECT current_database() AS db", 'current_database'],
  ['SELECT current_user AS usr', 'current_user'],
  ['SELECT inet_server_port() AS port', 'inet_server_port'],
  ['SELECT version() ~* \'diasoft|qdata|digital q\' AS is_digital_q', 'is_digital_q'],
  ['SHOW max_connections', 'max_connections'],
  ['SHOW shared_buffers', 'shared_buffers'],
  ['SHOW transaction_isolation', 'transaction_isolation'],
  ['SHOW default_transaction_isolation', 'default_transaction_isolation'],
  ['SHOW bytea_output', 'bytea_output'],
  ['SHOW server_encoding', 'server_encoding_again']
];

const out = {};
for (const [sql, key] of probes) {
  try {
    const r = await client.query(sql);
    out[key] = r.rows[0] ? Object.values(r.rows[0])[0] : null;
  } catch (err) {
    out[key] = `UNSUPPORTED: ${err.message.split('\n')[0]}`;
  }
}

console.log('=== QDB-02: TARGET INSTANCE REPORT ===');
console.log(`generated_at      : ${new Date().toISOString()}`);
console.log(`connection        : ${safeUrl}`);
console.log('');
for (const [k, v] of Object.entries(out)) {
  console.log(`${k.padEnd(28)}: ${v}`);
}
console.log('');

await client.end();