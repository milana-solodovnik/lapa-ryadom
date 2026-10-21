import pg from 'pg';
import argon2 from 'argon2';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(2);
}
const c = new pg.Client({ connectionString: url });
await c.connect();

const { rows: shelters } = await c.query(
  'SELECT id, name, city, is_published FROM shelters ORDER BY name'
);
console.log('SHELTERS:');
for (const s of shelters) console.log(' ', s.id, s.name, s.city, s.is_published);

const { rows: accounts } = await c.query(
  'SELECT id, username, role, shelter_id FROM accounts ORDER BY username'
);
console.log('ACCOUNTS:');
for (const a of accounts) console.log(' ', a.username, a.role, a.shelter_id);

const { rows: needs } = await c.query(
  `SELECT n.title, n.category, n.target_qty, n.unit, n.priority, s.name AS shelter
   FROM needs n JOIN shelters s ON s.id = n.shelter_id
   ORDER BY s.name, n.priority DESC, n.title`
);
console.log('NEEDS:');
for (const n of needs) console.log(' ', n.shelter, '|', n.title, '|', n.target_qty, n.unit, '[' + n.priority + ']');

const { rows: nb } = await c.query(`
  SELECT s.name AS shelter, n.title, n.target_qty, b.reserved_qty, b.received_qty, b.available_qty
  FROM need_balances b
  JOIN needs n ON n.id = b.need_id
  JOIN shelters s ON s.id = n.shelter_id
  ORDER BY s.name
`);
console.log('NEED_BALANCES:');
for (const r of nb) console.log(' ', r.shelter, '|', r.title, '| target', r.target_qty, 'reserved', r.reserved_qty, 'received', r.received_qty, 'available', r.available_qty);

// Verify that admin password matches what we set in env.
const adminPwd = process.env.DEMO_ADMIN_PASSWORD;
if (!adminPwd) {
  console.error('set DEMO_ADMIN_PASSWORD to verify');
  process.exit(2);
}
const { rows: hashRows } = await c.query(
  'SELECT password_hash FROM accounts WHERE username = $1',
  ['admin']
);
if (!hashRows.length) {
  console.error('admin account missing!');
  process.exit(1);
}
const ok = await argon2.verify(hashRows[0].password_hash, adminPwd);
console.log('admin password verify:', ok);

await c.end();
