#!/usr/bin/env node
// Apply SQL migrations from db/migrations against DATABASE_URL.
// TODO(DEV-03): implement real runner with schema_migrations bookkeeping.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
// eslint-disable-next-line no-console
console.log('[db:migrate] placeholder — migrator lands in DEV-03.', { projectRoot });
process.exit(0);
