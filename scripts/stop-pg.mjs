#!/usr/bin/env node
// Stops the embedded PostgreSQL started by start-pg.mjs using a marker file.
// The start script holds the process; running stop simply kills the holder.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const pidFile = path.join(projectRoot, '.pg-runtime', 'start-pg.pid');

if (!existsSync(pidFile)) {
  // eslint-disable-next-line no-console
  console.log('[db:down] no PID file; nothing to stop.');
  process.exit(0);
}

try {
  const { readFileSync, unlinkSync } = await import('node:fs');
  const pid = Number(readFileSync(pidFile, 'utf8').trim());
  if (!pid) throw new Error('empty PID file');
  process.kill(pid, 'SIGTERM');
  unlinkSync(pidFile);
  // eslint-disable-next-line no-console
  console.log(`[db:down] sent SIGTERM to pid ${pid}`);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[db:down] failed', err?.message ?? err);
  process.exit(1);
}
