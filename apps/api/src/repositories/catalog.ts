import type { Pool } from 'pg';
import { getPool } from '../db/pool.js';
import type { NeedsQuery, SheltersQuery } from '../schemas/catalog.js';

/** Numeric strings are used on the wire so BigInt never loses precision in JS. */
function toNum(v: string | number): string {
  return typeof v === 'number' ? String(v) : v;
}

interface NeedRow {
  id: string;
  title: string;
  details: string | null;
  category: string;
  unit: string;
  priority: string;
  status: string;
  target_qty: string;
  reserved_qty: string;
  received_qty: string;
  available_qty: string;
  shelter_id: string;
  shelter_name: string;
  city: string;
  receiving_hours: string;
}

function mapNeed(r: NeedRow) {
  return {
    id: r.id,
    title: r.title,
    details: r.details,
    category: r.category,
    unit: r.unit,
    priority: r.priority,
    status: r.status,
    targetQty: toNum(r.target_qty),
    reservedQty: toNum(r.reserved_qty),
    receivedQty: toNum(r.received_qty),
    availableQty: toNum(r.available_qty),
    shelter: {
      id: r.shelter_id,
      name: r.shelter_name,
      city: r.city,
      receivingHours: r.receiving_hours,
    },
  };
}

const NEED_SELECT = `
  SELECT n.id, n.title, n.details, n.category, n.unit, n.priority, n.status,
         b.target_qty::text, b.reserved_qty::text, b.received_qty::text, b.available_qty::text,
         s.id AS shelter_id, s.name AS shelter_name, s.city, s.receiving_hours
  FROM needs n
  JOIN need_balances b ON b.need_id = n.id
  JOIN shelters s ON s.id = n.shelter_id
`;

function pool(): Pool {
  const p = getPool();
  if (!p) throw new Error('DB pool is not configured');
  return p;
}

export async function listNeeds(q: NeedsQuery) {
  const where = [
    'n.status = $1',
    's.is_published = TRUE',
  ];
  const params: unknown[] = ['active'];
  const push = (val: unknown): string => {
    params.push(val);
    return `$${params.length}`;
  };

  if (q.city) where.push(`s.city = ${push(q.city)}`);
  if (q.category) where.push(`n.category = ${push(q.category)}`);
  if (q.priority) where.push(`n.priority = ${push(q.priority)}`);
  if (q.q) {
    const p = push(`%${q.q}%`);
    where.push(`(n.title ILIKE ${p} OR s.name ILIKE ${p})`);
  }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const limitP = push(q.limit);
  const offsetP = push(q.offset);

  // Urgent needs first, then newest. Stable tiebreak on id keeps pagination
  // deterministic when several needs share created_at.
  const orderSql = `ORDER BY (n.priority = 'urgent') DESC, n.created_at DESC, n.id`;

  const [items, total] = await Promise.all([
    pool().query<NeedRow>(
      `${NEED_SELECT} ${whereSql} ${orderSql} LIMIT ${limitP} OFFSET ${offsetP}`,
      params
    ),
    pool().query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM needs n JOIN shelters s ON s.id = n.shelter_id ${whereSql}`,
      params.slice(0, params.length - 2)
    ),
  ]);

  return {
    items: items.rows.map(mapNeed),
    total: total.rows[0]?.n ?? 0,
    limit: q.limit,
    offset: q.offset,
  };
}

export async function getNeed(id: string) {
  const { rows } = await pool().query<NeedRow>(
    `${NEED_SELECT} WHERE n.id = $1 AND s.is_published = TRUE`,
    [id]
  );
  const row = rows[0];
  return row ? mapNeed(row) : null;
}

export async function listNeedsByShelter(shelterId: string, limit = 50) {
  const { rows } = await pool().query<NeedRow>(
    `${NEED_SELECT} WHERE n.shelter_id = $1 AND n.status = 'active'
     ORDER BY (n.priority = 'urgent') DESC, n.created_at DESC, n.id LIMIT $2`,
    [shelterId, limit]
  );
  return rows.map(mapNeed);
}

interface ShelterRow {
  id: string;
  name: string;
  city: string;
  description: string | null;
  address: string;
  receiving_hours: string;
  active_needs_count: number;
}

function mapShelter(r: ShelterRow) {
  return {
    id: r.id,
    name: r.name,
    city: r.city,
    description: r.description,
    address: r.address,
    receivingHours: r.receiving_hours,
    activeNeedsCount: Number(r.active_needs_count),
  };
}

const SHELTER_SELECT = `
  SELECT s.id, s.name, s.city, s.description, s.address, s.receiving_hours,
         (SELECT COUNT(*)::int FROM needs n
           WHERE n.shelter_id = s.id AND n.status = 'active') AS active_needs_count
  FROM shelters s
`;

export async function listShelters(q: SheltersQuery) {
  const params: unknown[] = [];
  const push = (val: unknown): string => {
    params.push(val);
    return `$${params.length}`;
  };

  const where = ['s.is_published = TRUE'];
  if (q.city) where.push(`s.city = ${push(q.city)}`);
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const limitP = push(q.limit);
  const offsetP = push(q.offset);

  const [items, total] = await Promise.all([
    pool().query<ShelterRow>(
      `${SHELTER_SELECT} ${whereSql} ORDER BY s.name LIMIT ${limitP} OFFSET ${offsetP}`,
      params
    ),
    pool().query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM shelters s ${whereSql}`,
      params.slice(0, params.length - 2)
    ),
  ]);

  return {
    items: items.rows.map(mapShelter),
    total: total.rows[0]?.n ?? 0,
    limit: q.limit,
    offset: q.offset,
  };
}

export async function getShelter(id: string) {
  const { rows } = await pool().query<ShelterRow>(
    `${SHELTER_SELECT} WHERE s.id = $1 AND s.is_published = TRUE`,
    [id]
  );
  const row = rows[0];
  return row ? mapShelter(row) : null;
}