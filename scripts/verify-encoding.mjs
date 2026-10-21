import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set');
  process.exit(2);
}
const c = new pg.Client({ connectionString: url });
await c.connect();

const r = await c.query("SELECT current_setting('server_encoding') AS enc");
console.log('server_encoding:', r.rows[0].enc);

await c.query('CREATE TABLE IF NOT EXISTS _utf8_check (id int PRIMARY KEY, v text NOT NULL)');
await c.query("INSERT INTO _utf8_check(id, v) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET v = EXCLUDED.v", ['Привет, мир! Лапа рядом 🐾']);

const r2 = await c.query('SELECT v FROM _utf8_check WHERE id = 1');
console.log('roundtrip:', JSON.stringify(r2.rows[0].v));

await c.query('DROP TABLE _utf8_check');
await c.end();
