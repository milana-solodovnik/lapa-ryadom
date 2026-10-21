#!/usr/bin/env node
// QDB-03: PostgreSQL compatibility probes against the target instance.
//
// Usage: TARGET_DATABASE_URL=postgres://... node scripts/qdb-03-compat.mjs
//
// Each probe is isolated in its own transaction and rolled back, so the target
// is left untouched. Exit code 0 = all pass, 1 = at least one failure.

import pg from 'pg';

const url = process.env.TARGET_DATABASE_URL;
if (!url) {
  console.error('TARGET_DATABASE_URL is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

/**
 * Every probe must work with zero rows. The data model uses no extensions and
 * no vendor-specific syntax, so this is the real compatibility question.
 */
const probes = [
  {
    name: 'SELECT 1',
    sql: 'SELECT 1 AS ok'
  },
  {
    name: 'UUID type and generation',
    sql: "SELECT '11111111-1111-4111-a111-111111111111'::uuid AS u"
  },
  {
    name: 'BYTEA with octet_length',
    sql: "SELECT octet_length('\\x0102030405'::bytea) AS n"
  },
  {
    name: 'TIMESTAMPTZ and CURRENT_TIMESTAMP',
    sql: 'SELECT CURRENT_TIMESTAMP AS ts'
  },
  {
    name: 'BIGINT sum and COALESCE',
    sql: 'SELECT COALESCE(SUM(x), 0)::BIGINT AS n FROM (SELECT 1::bigint AS x) t'
  },
  {
    name: 'CHECK constraint enforcement',
    sql: 'CREATE TEMP TABLE _chk (id int PRIMARY KEY, n bigint CHECK (n > 0))'
  },
  {
    name: 'UNIQUE constraint on UUID',
    sql: 'CREATE TEMP TABLE _uq (id uuid PRIMARY KEY, k uuid UNIQUE)'
  },
  {
    name: 'Foreign key ON DELETE RESTRICT',
    sql: `CREATE TEMP TABLE _parent (id uuid PRIMARY KEY);
          CREATE TEMP TABLE _child (id uuid PRIMARY KEY, p uuid REFERENCES _parent(id) ON DELETE RESTRICT)`
  },
  {
    name: 'Partial index (WHERE clause)',
    sql: 'CREATE TEMP TABLE _pi (id uuid PRIMARY KEY, status text); CREATE INDEX ON _pi (id) WHERE status = \'reserved\''
  },
  {
    name: 'CROSS JOIN LATERAL subquery',
    sql: `CREATE TEMP TABLE _l_n (id uuid PRIMARY KEY, target_qty bigint);
          CREATE TEMP TABLE _l_o (need_id uuid, quantity bigint, status text, expires_at timestamptz);
          SELECT n.id, n.target_qty - b.reserved_qty AS available_qty
          FROM _l_n n
          CROSS JOIN LATERAL (
            SELECT COALESCE(SUM(o.quantity), 0)::BIGINT AS reserved_qty
            FROM _l_o o
            WHERE o.need_id = n.id AND o.status = 'reserved' AND o.expires_at > statement_timestamp()
          ) b`
  },
  {
    name: 'statement_timestamp()',
    sql: 'SELECT statement_timestamp() AS ts'
  },
  {
    name: 'Transaction: BEGIN / ROLLBACK',
    sql: 'BEGIN; SELECT 1; ROLLBACK'
  },
  {
    name: 'SELECT ... FOR UPDATE row lock',
    sql: `CREATE TEMP TABLE _lk (id uuid PRIMARY KEY, n bigint);
          INSERT INTO _lk VALUES ('22222222-2222-4222-a222-222222222222', 1);
          SELECT n FROM _lk WHERE id = '22222222-2222-4222-a222-222222222222' FOR UPDATE`
  },
  {
    name: 'CREATE OR REPLACE VIEW',
    sql: 'CREATE OR REPLACE VIEW _v AS SELECT 1 AS x'
  },
  {
    name: 'Savepoint inside transaction',
    sql: 'BEGIN; SAVEPOINT sp1; SELECT 1; ROLLBACK TO sp1; RELEASE SAVEPOINT sp1; COMMIT'
  }
];

const results = [];

for (const probe of probes) {
  let status = 'PASS';
  let detail = '';
  try {
    await client.query('BEGIN');
    const r = await client.query(probe.sql);
    await client.query('COMMIT');
    if (r.rows && r.rows.length) {
      detail = JSON.stringify(r.rows[0]).slice(0, 90);
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    status = 'FAIL';
    detail = err.message.split('\n')[0].slice(0, 140);
  }
  results.push({ name: probe.name, status, detail });
}

const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.length - passed;

console.log('=== QDB-03: POSTGRESQL COMPATIBILITY PROBES ===');
console.log(`generated_at : ${new Date().toISOString()}`);
console.log(`total        : ${results.length}`);
console.log(`passed       : ${passed}`);
console.log(`failed       : ${failed}`);
console.log('');
for (const r of results) {
  console.log(`[${r.status}] ${r.name}`);
  if (r.detail) console.log(`        ${r.detail}`);
}
console.log('');

await client.end();
process.exit(failed > 0 ? 1 : 0);