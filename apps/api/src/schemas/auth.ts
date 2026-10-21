import { z } from 'zod';

/**
 * POST /api/v1/auth/login body.
 *
 * Returns the raw cookie via Set-Cookie on success. The body intentionally
 * carries only credentials — no client-side account id is trusted.
 */
export const LoginBodySchema = z.object({
  username: z
    .string()
    .min(3, 'username is at least 3 characters')
    .max(64, 'username is at most 64 characters')
    .regex(/^[a-z0-9_-]+$/, 'username is lowercase latin, digits, _ or -'),
  password: z.string().min(8, 'password is at least 8 characters').max(256),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;
