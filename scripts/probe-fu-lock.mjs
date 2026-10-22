#!/usr/bin/env node
// DEV-10 diagnostic: why does the "last pack" reservation race let both win?
//
// The production code (apps/api/src/repositories/offers.ts) locks the need row
// and counts reserved stock in the SAME statement:
//
//   SELECT ... FROM needs n WHERE n.id = $1 FOR UPDATE
//   -- with reserved_qty / received_qty as correlated sub-selects
//
// Under READ COMMITTED the statement snapshot is taken when the statement
// STARTS. If this statement blocks on the row lock, the snapshot is not
// refreshed: the sub-selects keep reading the state that was committed before
// the winner finished. So the loser can see stale "available" stock and both
// reservations succeed -> over-reservation.
//
// This probe reproduces that deterministically against whatever database the
// URL points at, so the same script can be run on reference PostgreSQL and on
// Digital Q.DataBase for comparison.
//
// Usage:
//   PROBE_DATABASE_URL=postgres://... node scripts/probe-fu-lock.mjs
//
// It creates its own throwaway shelter/need and deletes them afterwards.

import pg from 'pg';
import { randomUUID } from 'node:crypto';

const url = process.env.PROBE_DATABASE_URL;
if (!url) {
  console.error('PROBE_DATABASE_URL is required');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHELTER = '90000000-0000-4000-a000-00000000f001';
const NEED = '90000000-0000-4000-a000-0000000000ff';

// Current production pattern: lock and count in one statement.
const SQL_ONE_STATEMENT = `
  SELECT n.target_qty::text AS target_qty,
         COALESCE((
           SELECT SUM(o.quantity) FROM offers o
            WHERE o.need_id = n.id
              AND o.status = 'reserved'
              AND o.expires_at > statement_timestamp()
         ), 0)::text AS reserved_qty
    FROM needs n
   WHERE n.id = $1
   FOR UPDATE`;

// Proposed pattern: take the lock in its own statement, then count in a second
// statement so that the counter read runs on a snapshot taken AFTER we own the
// lock.
const SQL_LOCK_ONLY = 'SELECT id FROM needs WHERE id = $1 FOR UPDATE';
const SQL_COUNT_AFTER_LOCK = `
  SELECT COALESCE((
    SELECT SUM(o.quantity) FROM offers o
     WHERE o.need_id = $1
       AND o.status = 'reserved'
       AND o.expires_at > statement_timestamp()
  ), 0)::text AS reserved_qty`;

function availableFrom(targetQty, reservedQty) {
  return BigInt(targetQty) - BigInt(reservedQty);
}

async function freshNeed(pool) {
  await pool.query(
    `INSERT INTO shelters (id, name, city, address, receiving_hours, is_published)
     VALUES ($1, 'probe', 'probe', 'probe', 'probe', FALSE)
     ON CONFLICT (id) DO NOTHING`,
    [SHELTER]
  );
  await pool.query('DELETE FROM offers WHERE need_id = $1', [NEED]);
  await pool.query('DELETE FROM needs WHERE id = $1', [NEED]);
  await pool.query(
    `INSERT INTO needs (id, shelter_id, category, title, target_qty, unit, priority, status)
     VALUES ($1, $2, 'food', 'probe', 1, 'pack', 'normal', 'active')`,
    [NEED, SHELTER]
  );
}

async function cleanup(pool) {
  await pool.query('DELETE FROM offers WHERE need_id = $1', [NEED]);
  await pool.query('DELETE FROM needs WHERE id = $1', [NEED]);
  await pool.query('DELETE FROM shelters WHERE id = $1', [SHELTER]);
}

/**
 * A holds the need lock, reserves the single unit, and commits while B is
 * already parked on the same lock. B must observe the committed reservation.
 */
async function scenario(pool, label, loserRead) {
  await freshNeed(pool);

  const a = await pool.connect();
  const b = await pool.connect();
  let loserAvailable = null;
  let targetQty = '1';

  try {
    // Winner takes the need lock and holds it.
    await a.query('BEGIN');
    const lockRes = await a.query(lockerSql(), [NEED]);
    targetQty = lockerTarget(lockRes);

    // Loser parks on the same lock. Its read must happen AFTER the winner's
    // COMMIT if the lock is doing its job, but its statement snapshot was taken
    // the moment the blocking statement started.
    const loserPromise = (async () => {
      await b.query('BEGIN');
      return loserRead(b);
    })();

    // Give the loser time to actually reach the lock and block on it.
    await sleep(250);

    const aBlocked = await inTransaction(a, 'SELECT count(*)::int AS n FROM needs WHERE id = $1', [NEED]);
    if (aBlocked !== 1) throw new Error('winner lost the lock unexpectedly');

    await a.query(
      `INSERT INTO offers (id, need_id, quantity, idempotency_key, code_hash, status, created_at, expires_at)
       VALUES ($1, $2, 1, $3, $4, 'reserved', statement_timestamp(),
               statement_timestamp() + interval '14 days')`,
      [randomUUID(), NEED, randomUUID(), Buffer.alloc(32, 7)]
    );
    await a.query('COMMIT');

    loserAvailable = await loserPromise;
    await b.query('ROLLBACK');

    const reservedNow = await pool.query(
      `SELECT COALESCE(SUM(quantity),0)::text AS q FROM offers
        WHERE need_id = $1 AND status = 'reserved'`,
      [NEED]
    );

    return {
      label,
      loserSawAvailable: loserAvailable,
      reservedInTable: reservedNow.rows[0].q,
      overReserved: loserAvailable === '1',
    };
  } finally {
    a.release();
    b.release();
  }
}

/** Run a query and wait, but tolerate the loser still being blocked. */
async function inTransaction(client, sql, params) {
  const { rows } = await client.query(sql, params);
  return rows[0].n;
}

const MODE = process.env.PROBE_MODE ?? 'both';

let locker = SQL_ONE_STATEMENT;
function lockerSql() {
  return locker;
}
function lockerTarget(res) {
  return res.rows[0]?.target_qty ?? '1';
}

async function readOneStatement(client) {
  const { rows } = await client.query(SQL_ONE_STATEMENT, [NEED]);
  return availableFrom(rows[0].target_qty, rows[0].reserved_qty).toString();
}

async function readTwoStatements(client) {
  await client.query(SQL_LOCK_ONLY, [NEED]);
  const { rows } = await client.query(SQL_COUNT_AFTER_LOCK, [NEED]);
  return availableFrom('1', rows[0].reserved_qty).toString();
}

const pool = new pg.Pool({ connectionString: url, max: 6 });
const results = [];
try {
  const iso = await pool.query('SHOW transaction_isolation');
  const ver = await pool.query('SELECT version()');
  console.log('target      :', ver.rows[0].version.split(' on ')[0]);
  console.log('isolation   :', iso.rows[0].transaction_isolation);
  console.log('');

  if (MODE === 'both' || MODE === 'one') {
    locker = SQL_ONE_STATEMENT;
    results.push(await scenario(pool, 'lock+count in ONE statement (current code)', readOneStatement));
  }
  if (MODE === 'both' || MODE === 'two') {
    locker = SQL_LOCK_ONLY;
    results.push(await scenario(pool, 'lock, then count in a SECOND statement', readTwoStatements));
  }

  for (const r of results) {
    console.log(`${r.label}`);
    console.log(`  loser saw available = ${r.loserSawAvailable}   (correct: 0)`);
    console.log(`  reserved in table   = ${r.reservedInTable}        (correct: 1)`);
    console.log(`  => ${r.overReserved ? 'OVER-RESERVATION, second reader was blind' : 'correct'}`);
    console.log('');
  }

  await cleanup(pool);
  const bad = results.filter((r) => r.overReserved).length;
  console.log(bad === 0 ? 'VERDICT: no stale read' : `VERDICT: ${bad} scenario(s) read stale stock`);
  process.exit(0);
} finally {
  await pool.end().catch(() => {});
}