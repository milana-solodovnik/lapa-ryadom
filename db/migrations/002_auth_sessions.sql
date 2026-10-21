-- Migration: 002_auth_sessions.sql
-- Subject: server-side session registry (technical, not a sixth business entity).
-- Source: docs/04_TECHNICAL_ARCHITECTURE.md §3.2 and §8.1.
-- Note: the cookie carries the raw 32-byte session id; the table only stores its SHA-256.
-- Per docs §8.1, password hashing uses Argon2id; the cookie policy is enforced by the API.

CREATE TABLE auth_sessions (
    id_hash BYTEA PRIMARY KEY CHECK (octet_length(id_hash) = 32),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    csrf_token BYTEA NOT NULL CHECK (octet_length(csrf_token) = 32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT auth_sessions_expiry_ck CHECK (expires_at > created_at),
    CONSTRAINT auth_sessions_revoke_ck CHECK (
        (revoked_at IS NULL)
        OR (revoked_at IS NOT NULL AND revoked_at >= created_at)
    )
);

CREATE INDEX idx_auth_sessions_account
    ON auth_sessions (account_id);
CREATE INDEX idx_auth_sessions_active
    ON auth_sessions (expires_at)
    WHERE revoked_at IS NULL;
