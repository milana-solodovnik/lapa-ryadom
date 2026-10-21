-- Migration: 001_initial.sql
-- Subject: five core tables + indexes + need_balances view.
-- Source : docs/03_DATA_MODEL.md §4 and §5.
-- Applied by scripts/migrate.mjs. Idempotency guard: schema_migrations row.

CREATE TABLE shelters (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    city TEXT NOT NULL CHECK (length(btrim(city)) > 0),
    description TEXT,
    address TEXT NOT NULL CHECK (length(btrim(address)) > 0),
    receiving_hours TEXT NOT NULL CHECK (length(btrim(receiving_hours)) > 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL UNIQUE
        CHECK (length(btrim(username)) > 0 AND username = lower(btrim(username))),
    password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
    role TEXT NOT NULL CHECK (role IN ('admin', 'shelter_rep')),
    shelter_id UUID REFERENCES shelters(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT account_role_shelter_ck CHECK (
        (role = 'admin' AND shelter_id IS NULL)
        OR (role = 'shelter_rep' AND shelter_id IS NOT NULL)
    )
);

CREATE TABLE needs (
    id UUID PRIMARY KEY,
    shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE RESTRICT,
    category TEXT NOT NULL CHECK (category IN (
        'food', 'hygiene', 'textile', 'equipment', 'carriers', 'other'
    )),
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    details TEXT,
    target_qty BIGINT NOT NULL CHECK (target_qty > 0),
    unit TEXT NOT NULL CHECK (unit IN ('piece', 'pack', 'kg')),
    priority TEXT NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('normal', 'urgent')),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'fulfilled', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE offers (
    id UUID PRIMARY KEY,
    need_id UUID NOT NULL REFERENCES needs(id) ON DELETE RESTRICT,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    idempotency_key UUID NOT NULL UNIQUE,
    code_hash BYTEA NOT NULL UNIQUE CHECK (octet_length(code_hash) = 32),
    status TEXT NOT NULL DEFAULT 'reserved'
        CHECK (status IN ('reserved', 'received', 'cancelled', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT offer_expiry_ck CHECK (expires_at > created_at),
    CONSTRAINT offer_cancellation_ck CHECK (
        (status = 'cancelled' AND cancelled_at IS NOT NULL)
        OR (status <> 'cancelled' AND cancelled_at IS NULL)
    )
);

CREATE TABLE deliveries (
    id UUID PRIMARY KEY,
    offer_id UUID NOT NULL UNIQUE REFERENCES offers(id) ON DELETE RESTRICT,
    received_qty BIGINT NOT NULL CHECK (received_qty > 0),
    accepted_by UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shelters_public_city
    ON shelters (is_published, city);
CREATE INDEX idx_accounts_shelter
    ON accounts (shelter_id);
CREATE INDEX idx_needs_shelter_status
    ON needs (shelter_id, status, created_at DESC);
CREATE INDEX idx_needs_public_filter
    ON needs (status, category, priority, created_at DESC);
CREATE INDEX idx_offers_need_active
    ON offers (need_id, expires_at) WHERE status = 'reserved';
CREATE INDEX idx_offers_need_status
    ON offers (need_id, status);

-- need_balances view (doc 03 §5).
-- Computes reserved_qty / received_qty / available_qty per need at statement time.
-- The `CROSS JOIN LATERAL` form is required by the data model spec and avoids
-- per-need sub-query repetition downstream.
CREATE OR REPLACE VIEW need_balances AS
SELECT
    n.id AS need_id,
    n.target_qty,
    b.reserved_qty,
    b.received_qty,
    n.target_qty - b.reserved_qty - b.received_qty AS available_qty
FROM needs AS n
CROSS JOIN LATERAL (
    SELECT
      COALESCE((
        SELECT SUM(o.quantity) FROM offers AS o
        WHERE o.need_id = n.id
          AND o.status = 'reserved'
          AND o.expires_at > statement_timestamp()
      ), 0)::BIGINT AS reserved_qty,
      COALESCE((
        SELECT SUM(d.received_qty)
        FROM deliveries AS d
        JOIN offers AS o ON o.id = d.offer_id
        WHERE o.need_id = n.id
      ), 0)::BIGINT AS received_qty
) AS b;
