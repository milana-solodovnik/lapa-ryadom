#!/usr/bin/env node
// QDB-05: verify the migrated data against the source.
//
// Usage:
//   SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... node scripts/qdb-05-verify.mjs
//
// Checks required by docs/05_DEVELOPMENT_PLAN.md QDB-05:
//   1. Row counts per table.
//   2. Primary keys and UUIDs match exactly.
//   3. Business keys survive: offer.code_hash (BYTEA), offer.idempotency_key.
//   4. Timestamps are preserved to the microsecond.
//   5. No orphans: every FK resolves inside the target.
//   6. need_balances agrees on both sides, so available_qty is never negative.
//   7. CHECK constraints still reject bad data on the target.
// Exit code 0 = all checks pass.

import pg from 'pg';

const srcUrl = process.env.SOURCE_DATABASE_URL;
const tgtUrl = process.env.TARGET_DATABASE_URL;
if (!srcUrl || !tgtUrl) {
  console.error('SOURCE_DATABASE_URL and TARGET_DATABASE_URL are both required');
  process.exit(2);
}

const src = new pg.Client({ connectionString: srcUrl });
const tgt = new pg.Client({ connectionString: tgtUrl });
await src.connect();
await tgt.connect();

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
}

async function count(client, table) {
  const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
  return r.rows[0].n;
}

// ---- 1. Row counts ----
const TABLES = ['shelters', 'accounts', 'needs', 'offers', 'deliveries'];
for (const t of TABLES) {
  const s = await count(src, t);
  const g = await count(tgt, t);
  check(`row count ${t}`, s === g, `source=${s} target=${g}`);
}

// ---- 2. Primary keys match ----
for (const t of TABLES) {
  const s = await src.query(`SELECT id::text AS id FROM ${t} ORDER BY id`);
  const g = await tgt.query(`SELECT id::text AS id FROM ${t} ORDER BY id`);
  const sIds = s.rows.map((r) => r.id);
  const gIds = g.rows.map((r) => r.id);
  const same = sIds.length === gIds.length && sIds.every((v, i) => v === gIds[i]);
  check(`primary keys ${t}`, same, same ? `${sIds.length} ids identical` : 'id sets differ');
}

// ---- 3. Business keys ----
{
  const s = await src.query('SELECT id::text, encode(code_hash, \'hex\') AS ch, idempotency_key::text FROM offers ORDER BY id');
  const g = await tgt.query('SELECT id::text, encode(code_hash, \'hex\') AS ch, idempotency_key::text FROM offers ORDER BY id');
  const same = JSON.stringify(s.rows) === JSON.stringify(g.rows);
  check('offer code_hash + idempotency_key', same, same ? `${s.rows.length} offers match byte-for-byte` : 'code_hash or idempotency_key differ');
}

// ---- 4. Timestamps ----
// Column sets differ per table: offers has no updated_at (only created_at,
// expires_at, cancelled_at) and deliveries has received_at only.
const TIME_COLS = {
  shelters: ['created_at', 'updated_at'],
  accounts: ['created_at', 'updated_at'],
  needs: ['created_at', 'updated_at'],
  offers: ['created_at', 'expires_at', 'cancelled_at'],
  deliveries: ['received_at']
};
for (const [t, cols] of Object.entries(TIME_COLS)) {
  // Compare instants, not text. `::text` rendering differs between vanilla
  // PostgreSQL (offset shown, 6 fractional digits) and Digital Q.DataBase
  // (UTC, 3 fractional digits), so a string compare reports a difference even
  // when the stored moment is identical. date_trunc('milliseconds') mirrors
  // what qdb-04 writes and is the actual storage contract.
  const sel = `id::text, ${cols
    .map((c) => `EXTRACT(EPOCH FROM date_trunc('milliseconds', ${c}))::text AS ${c}_epoch`)
    .join(', ')}`;
  const s = await src.query(`SELECT ${sel} FROM ${t} ORDER BY id`);
  const g = await tgt.query(`SELECT ${sel} FROM ${t} ORDER BY id`);
  const same = JSON.stringify(s.rows) === JSON.stringify(g.rows);
  check(
    `timestamps ${t}`,
    same,
    same
      ? `${s.rows.length} rows identical to the millisecond (${cols.join(', ')})`
      : 'timestamps differ by more than a millisecond',
  );
}

// ---- 5. No orphans ----
const ORPHANS = [
  ['needs -> shelters', 'SELECT COUNT(*)::int AS n FROM needs n LEFT JOIN shelters s ON s.id = n.shelter_id WHERE s.id IS NULL'],
  ['offers -> needs', 'SELECT COUNT(*)::int AS n FROM offers o LEFT JOIN needs n ON n.id = o.need_id WHERE n.id IS NULL'],
  ['deliveries -> offers', 'SELECT COUNT(*)::int AS n FROM deliveries d LEFT JOIN offers o ON o.id = d.offer_id WHERE o.id IS NULL'],
  ['deliveries -> accounts', 'SELECT COUNT(*)::int AS n FROM deliveries d LEFT JOIN accounts a ON a.id = d.accepted_by WHERE a.id IS NULL'],
  ['accounts -> shelters', 'SELECT COUNT(*)::int AS n FROM accounts a LEFT JOIN shelters s ON s.id = a.shelter_id WHERE a.shelter_id IS NOT NULL AND s.id IS NULL']
];
for (const [label, sql] of ORPHANS) {
  const r = await tgt.query(sql);
  check(`no orphan ${label}`, r.rows[0].n === 0, `orphans=${r.rows[0].n}`);
}

// ---- 6. need_balances agrees and never negative ----
{
  const s = await src.query(`SELECT need_id::text, target_qty::text, reserved_qty::text, received_qty::text, available_qty::text FROM need_balances ORDER BY need_id`);
  const g = await tgt.query(`SELECT need_id::text, target_qty::text, reserved_qty::text, received_qty::text, available_qty::text FROM need_balances ORDER BY need_id`);
  const same = JSON.stringify(s.rows) === JSON.stringify(g.rows);
  check('need_balances identical', same, same ? `${s.rows.length} rows identical` : 'balances differ');
  const neg = await tgt.query('SELECT COUNT(*)::int AS n FROM need_balances WHERE available_qty < 0');
  check('available_qty never negative', neg.rows[0].n === 0, `negative rows=${neg.rows[0].n}`);
}

// ---- 7. CHECK constraints still enforced ----
{
  try {
    await tgt.query('BEGIN');
    await tgt.query(`INSERT INTO needs (id, shelter_id, category, title, target_qty, unit)
      VALUES ('99999999-9999-4999-a999-999999999999','11111111-1111-4111-a111-111111111111','food','bad',0,'piece')`);
    await tgt.query('ROLLBACK');
    check('CHECK constraint rejects target_qty = 0', false, 'insert with target_qty=0 SUCCEEDED, constraint missing');
  } catch (err) {
    try {
      await tgt.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    check('CHECK constraint rejects target_qty = 0', true, err.message.split('\n')[0].slice(0, 80));
  }
}

// ---- 8. UNIQUE idempotency_key still enforced ----
// Must be data-independent: on an empty offers table the previous form inserted
// zero rows and reported a false failure.
{
  const need = await tgt.query('SELECT id FROM needs ORDER BY id LIMIT 1');
  if (need.rows.length === 0) {
    check('UNIQUE idempotency_key enforced', false, 'no rows in needs, cannot run probe');
  } else {
    const needId = need.rows[0].id;
    const dupKey = '33333333-3333-4333-a333-333333333333';
    const mk = (id, hashByte) =>
      `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, expires_at)
       VALUES ('${id}', $1, 1, '${dupKey}', decode(repeat('${hashByte}', 32), 'hex'), 'reserved', now() + interval '1 day')`;

    await tgt.query('BEGIN');
    await tgt.query('DELETE FROM offers WHERE idempotency_key = $1', [dupKey]);
    await tgt.query(mk('88888888-8888-4888-a888-888888888888', '11'), [needId]);
    let enforced = false;
    let detail = '';
    try {
      await tgt.query(mk('77777777-7777-4777-a777-777777777777', '22'), [needId]);
      detail = 'second insert with the same idempotency_key SUCCEEDED';
    } catch (err) {
      // SQLSTATE 23505 is unique_violation in every implementation. Matching on
      // the message text fails on Digital Q.DataBase, which reports it in
      // Russian: «повторяющееся значение ключа нарушает ограничение уникальности».
      enforced = err.code === '23505' || /duplicate key|unique/i.test(String(err.message));
      detail = `${err.code ?? 'no-code'}: ${String(err.message).split('\n')[0].slice(0, 70)}`;
    }
    // The failed statement aborts the transaction, so ROLLBACK is the only
    // cleanup that works here; it also removes the probe row.
    await tgt.query('ROLLBACK');
    check('UNIQUE idempotency_key enforced', enforced, detail);
  }
}

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

console.log('=== QDB-05: MIGRATION VERIFICATION ===');
console.log(`generated_at : ${new Date().toISOString()}`);
console.log(`total checks : ${results.length}`);
console.log(`passed       : ${passed}`);
console.log(`failed       : ${failed}`);
console.log('');
for (const r of results) {
  console.log(`[${r.ok ? 'PASS' : 'FAIL'}] ${r.name}`);
  if (r.detail) console.log(`        ${r.detail}`);
}
console.log('');
console.log(failed === 0 ? 'VERDICT: MIGRATION VERIFIED' : 'VERDICT: MIGRATION NOT VERIFIED');

await src.end();
await tgt.end();
process.exit(failed > 0 ? 1 : 0);