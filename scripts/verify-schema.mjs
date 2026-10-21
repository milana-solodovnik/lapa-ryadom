import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

const { rows: tables } = await client.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
);
console.log('TABLES:');
for (const r of tables) console.log(' ', r.table_name);

const { rows: migrations } = await client.query(
  'SELECT name, checksum, applied_at FROM schema_migrations ORDER BY name'
);
console.log('MIGRATIONS:');
for (const r of migrations) console.log(' ', r.name, r.applied_at.toISOString());

const { rows: views } = await client.query(
  "SELECT table_name FROM information_schema.views WHERE table_schema='public' ORDER BY table_name"
);
console.log('VIEWS:');
for (const r of views) console.log(' ', r.table_name);

const { rows: nb } = await client.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='need_balances' ORDER BY ordinal_position"
);
console.log('NEED_BALANCES COLUMNS:');
for (const r of nb) console.log(' ', r.column_name, r.data_type);

const { rowCount } = await client.query('SELECT 1 FROM needs');
console.log('needs SELECT OK, rowCount:', rowCount);

await client.end();
