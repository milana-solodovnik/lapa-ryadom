#!/usr/bin/env node
// Idempotent demo seeder. Real implementation lands in DEV-04.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
// eslint-disable-next-line no-console
console.log('[db:seed] placeholder — seeder lands in DEV-04.', { projectRoot });
process.exit(0);
