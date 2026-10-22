#!/bin/sh
# QDB helper: allow TCP connections from outside the container.
#
# The stock postgresql.conf ships with `listen_addresses = 'localhost'`, so the
# server only accepts loopback connections. Docker's port publisher forwards to
# the container IP, which the server refuses — hence "connection refused" from
# the host even though the container is healthy.
#
# Usage: docker cp scripts/qdb-listen-all.sh qdatabase-18:/tmp/ \
#          && docker exec qdatabase-18 sh /tmp/qdb-listen-all.sh \
#          && docker restart qdatabase-18

set -e

for M in pearl marble onyx; do
  CONF="/var/lib/qdatabase-18/$M/data/postgresql.conf"
  [ -f "$CONF" ] || continue

  if grep -q '^[[:space:]]*listen_addresses' "$CONF"; then
    sed -i 's/^[[:space:]]*listen_addresses.*/listen_addresses = '"'"'*'"'"'   # lapa-bridge/' "$CONF"
  else
    printf '\n# lapa-bridge: приём подключений снаружи контейнера\nlisten_addresses = '"'"'*'"'"'\n' >> "$CONF"
  fi

  echo "$M -> $(grep '^[[:space:]]*listen_addresses' "$CONF")"
done

# pg_hba: довести правило для внешней сети до конца (уже добавлено, но проверим)
for M in pearl marble onyx; do
  HBA="/var/lib/qdatabase-18/$M/data/pg_hba.conf"
  [ -f "$HBA" ] || continue
  grep -q 'lapa-bridge' "$HBA" || printf '\nhost all all all trust  # lapa-bridge\n' >> "$HBA"
done

echo 'готово — теперь docker restart qdatabase-18'