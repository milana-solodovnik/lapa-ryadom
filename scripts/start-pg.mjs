#!/usr/bin/env node
// Start a local PostgreSQL instance using `embedded-postgres`.
// Downloads the official PostgreSQL binaries on first run and stores them
// inside the project (./.pg-runtime) so no system-wide install is required.
// Connection defaults are 127.0.0.1:55850, user=db, password=db, database=db.
// The port moved off 55432 because Windows reserves 55220-55719 for
// Hyper-V/WSL2 (netsh interface ipv4 show excludedportrange) once Docker
// Desktop is running, and binding a socket there fails with WSAEACCES.
// Override via PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE environment variables.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');

const host = process.env.PGHOST ?? '127.0.0.1';
const port = Number(process.env.PGPORT ?? 55850);
const user = process.env.PGUSER ?? 'db';
const password = process.env.PGPASSWORD ?? 'db';
const database = process.env.PGDATABASE ?? 'db';
const persistDir = process.env.PG_RUNTIME_DIR ?? path.join(projectRoot, '.pg-runtime');
const dataDir = process.env.PG_DATA_DIR ?? path.join(persistDir, 'data');

async function main() {
  const EmbeddedPostgresModule = await import('embedded-postgres');
  const EmbeddedPostgres = EmbeddedPostgresModule.default ?? EmbeddedPostgresModule;
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    user,
    password,
    port,
    host,
    persistent: true,
    initdbFlags: ['--no-locale', '--encoding=UTF8'],
  });

  const log = (msg, extra) => {
    // eslint-disable-next-line no-console
    console.log(`[db:up] ${msg}`, extra ?? '');
  };

  // Detect already-initialised cluster (PG_VERSION marker written by initdb).
  const alreadyInitialised = existsSync(path.join(dataDir, 'PG_VERSION'));
  if (!alreadyInitialised) {
    log('initialising cluster', { dataDir });
    await pg.initialise({ encoding: 'UTF8' });
    log('initialised', { dataDir });
  } else {
    log('cluster already initialised, reusing', { dataDir });
  }

  await pg.start();
  mkdirSync(persistDir, { recursive: true });
  writeFileSync(path.join(persistDir, 'start-pg.pid'), String(process.pid));
  log(`started at ${host}:${port} (pid=${process.pid})`);

  try {
    await pg.createDatabase(database).catch((err) => {
      if (!/already exists/i.test(String(err?.message ?? err))) throw err;
    });
  } catch (err) {
    log('createDatabase warning', String(err?.message ?? err));
  }

  log('ready', {
    url: `postgres://${user}:${password}@${host}:${port}/${database}`,
    env: [
      `DATABASE_URL=postgres://${user}:${password}@${host}:${port}/${database}`,
    ],
  });

  const stop = async (signal) => {
    log(`stopping (${signal})`);
    try {
      await pg.stop();
    } catch (err) {
      log('stop error', String(err?.message ?? err));
    }
    process.exit(0);
  };

  process.on('SIGINT', () => void stop('SIGINT'));
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('uncaughtException', (err) => {
    log('uncaught', String(err?.stack ?? err));
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[db:up] failed to start', err?.stack ?? err);
  process.exit(1);
});
