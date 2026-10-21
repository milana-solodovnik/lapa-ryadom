import pg from 'pg';

const c = new pg.Client({ connectionString: 'postgres://db:db@127.0.0.1:55432/db' });
await c.connect();
const s = await c.query('SELECT count(*)::int AS n FROM shelters');
const n = await c.query('SELECT count(*)::int AS n FROM needs');
const v = await c.query('SELECT version() AS v');
console.log('source alive:', v.rows[0].v.split(' on ')[0]);
console.log('shelters=' + s.rows[0].n, 'needs=' + n.rows[0].n);
await c.end();