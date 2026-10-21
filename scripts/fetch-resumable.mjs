#!/usr/bin/env node
// Resumable, retrying downloader for large vendor archives.
//
// The browser keeps restarting the Digital Q.DataBase Docker image from zero
// and discarding the partial file, so this script instead uses HTTP Range to
// continue where it stopped, with exponential backoff between attempts.
//
// Usage:
//   node scripts/fetch-resumable.mjs --url <direct-url> --out <path> [--max-attempts 40]
//                                    [--noproxy '*']
//
// Why this exists: a sing-box proxy is active on 127.0.0.1:12334 and was
// measuring 265 KB/s to the vendor host versus 965 KB/s on a direct
// connection, and the browser was restarting the transfer from zero each time
// it broke. Pass --noproxy '*' to bypass the proxy for this transfer.
//
// Notes:
// - If the server replies 200 instead of 206 on resume, the partial file is
//   discarded and restarted, because the server ignored the Range header.
// - The partial file keeps a .part suffix so an interrupted run can be picked
//   up again with the same --out path.

import { createWriteStream, existsSync, statSync, unlinkSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { request } from 'node:undici';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const url = arg('url');
const out = arg('out');
const maxAttempts = Number(arg('max-attempts', '40'));
const sleepMs = Number(arg('sleep', '3000'));
const noProxy = arg('noproxy');

if (!url || !out) {
  console.error('Usage: node scripts/fetch-resumable.mjs --url <direct-url> --out <path>');
  process.exit(2);
}

const target = resolve(out);
const part = `${target}.part`;
mkdirSync(dirname(target), { recursive: true });

function human(n) {
  return `${(n / 1048576).toFixed(1)} MB`;
}

function have() {
  return existsSync(part) ? statSync(part).size : 0;
}

let attempt = 0;
let total = 0;

while (attempt < maxAttempts) {
  attempt += 1;
  const from = have();

  const headers = {};
  if (from > 0) headers.Range = `bytes=${from}-`;

  try {
    const res = await request(url, {
      method: 'GET',
      headers,
      maxRedirections: 10,
      dispatcher: noProxy
        ? new (await import('undici')).Agent({
            connect: { timeout: 20_000 },
          })
        : undefined,
    });

    // Server ignored Range: restart cleanly.
    if (from > 0 && res.statusCode === 200) {
      console.log(`[fetch] server ignored Range, restarting from zero (was ${human(from)})`);
      unlinkSync(part);
      res.body.dump();
      continue;
    }
    if (res.statusCode !== 200 && res.statusCode !== 206) {
      console.error(`[fetch] attempt ${attempt}: HTTP ${res.statusCode}`);
      res.body.dump();
      await new Promise((r) => setTimeout(r, sleepMs * Math.min(attempt, 5)));
      continue;
    }

    total = Number(res.headers['content-length'] ?? 0) + from;
    console.log(
      `[fetch] attempt ${attempt}: ${res.statusCode}, have ${human(from)}` +
        (total ? ` of ${human(total)}` : '')
    );

    await new Promise((resolvePromise, reject) => {
      const outStream = createWriteStream(part, { flags: from > 0 ? 'a' : 'w' });
      let received = from;
      let lastPrint = Date.now();

      res.body.on('data', (chunk) => {
        received += chunk.length;
        const now = Date.now();
        if (now - lastPrint > 3000) {
          lastPrint = now;
          const pct = total ? ((received / total) * 100).toFixed(1) : '?';
          console.log(`[fetch] ${pct}%  ${human(received)}${total ? ` / ${human(total)}` : ''}`);
        }
      });
      res.body.on('error', (err) => {
        outStream.destroy();
        reject(err);
      });
      res.body.pipe(outStream);
      outStream.on('finish', () => resolvePromise());
      outStream.on('error', reject);
    });

    if (total > 0 && have() >= total) {
      renameSync(part, target);
      console.log(`[fetch] DONE: ${target} (${human(have())})`);
      process.exit(0);
    }
    console.log(`[fetch] stream ended early at ${human(have())}; resuming.`);
  } catch (err) {
    console.error(`[fetch] attempt ${attempt} failed: ${err?.message ?? err}`);
  }

  await new Promise((r) => setTimeout(r, sleepMs * Math.min(attempt, 5)));
}

console.error(`[fetch] gave up after ${maxAttempts} attempts, ${human(have())} downloaded.`);
console.error(`[fetch] partial file kept at ${part}`);
process.exit(1);