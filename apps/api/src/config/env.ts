import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Load .env from monorepo root (../../../../.env), if present.
const here = path.dirname(fileURLToPath(import.meta.url));
const candidates = [
  path.resolve(here, '..', '..', '..', '..', '.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const candidate of candidates) {
  if (existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TARGET_DATABASE_URL: z.string().optional().default(''),
  SERVER_OFFER_SECRET: z
    .string()
    .min(32, 'SERVER_OFFER_SECRET must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('lapa_sid'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | undefined;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function resetEnvCacheForTests(): void {
  cached = undefined;
}
