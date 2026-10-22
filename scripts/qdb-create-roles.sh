#!/bin/sh
# QDB helper: create the demo roles and database on Digital Q.DataBase.
# Runs inside the container, connecting over the local socket / loopback so we
# never depend on pg_hba from outside.
#
# Usage: docker exec qdatabase-18 sh /qdb-create-roles.sh

set -e

PEARL_PORT=5432
PSQL=/opt/qdatabase-18/pearl/bin/psql
PSQL_PEARL=/opt/qdb/bin/psql

run() {
  "$@"
}

echo "=== [pearl] создаём роли и БД ==="
"$PSQL" -U postgres -h 127.0.0.1 -p "$PEARL_PORT" -v ON_ERROR_STOP=0 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'qdbadmin') THEN
    CREATE ROLE qdbadmin LOGIN SUPERUSER PASSWORD 'qdbadmin';
  END IF;
END
$$;
SQL

"$PSQL" -U postgres -h 127.0.0.1 -p "$PEARL_PORT" -tAc "SELECT rolname FROM pg_roles ORDER BY 1"