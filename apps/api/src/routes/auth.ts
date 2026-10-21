import type { FastifyInstance, FastifyRequest } from 'fastify';
import { LoginBodySchema } from '../schemas/auth.js';
import {
  createSession,
  destroySession,
  findAccountBySessionToken,
  findAccountByUsername,
  type PublicAccount,
} from '../repositories/auth.js';
import { verifyPassword } from '../services/auth.js';

const COOKIE_PATH = '/';

function readSessionCookie(req: FastifyRequest, name: string): string | undefined {
  return (req as unknown as { cookies?: Record<string, string> }).cookies?.[name];
}

/**
 * Look up the currently logged-in account via the session cookie, or null.
 * Use inside any route that wants to require auth.
 */
export async function currentAccount(req: FastifyRequest): Promise<PublicAccount | null> {
  const token = readSessionCookie(req, req.server.env.SESSION_COOKIE_NAME);
  if (!token) return null;
  return findAccountBySessionToken(token);
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  void app;

  /**
   * POST /api/v1/auth/login — public.
   * Trade credentials for a session cookie. The cookie is HttpOnly so a
   * compromised page cannot leak it; SameSite=Lax covers the basic CSRF case.
   * Secure flag stays off because the dev/demo deployment is HTTP. Real
   * production must enable it.
   */
  app.post('/auth/login', async (req, reply) => {
    const parsed = LoginBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_BODY',
        message: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
      });
    }

    const account = await findAccountByUsername(parsed.data.username);
    if (
      !account ||
      !account.is_active ||
      !(await verifyPassword(account.password_hash, parsed.data.password))
    ) {
      return reply.code(401).send({
        error: 'INVALID_CREDENTIALS',
        message: 'Неверный логин или пароль.',
      });
    }

    const { token, expiresAt } = await createSession(
      account.id,
      req.server.env.SESSION_TTL_HOURS,
    );

    reply.setCookie(req.server.env.SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: COOKIE_PATH,
      expires: expiresAt,
      secure: false,
    });

    return reply.code(200).send({
      account: {
        id: account.id,
        username: account.username,
        role: account.role,
        shelterId: account.shelter_id,
      },
      expiresAt: expiresAt.toISOString(),
    });
  });

  /**
   * POST /api/v1/auth/logout — revoke the current session and clear the cookie.
   * Always 204, even when there was no session — never echoes information.
   */
  app.post('/auth/logout', async (req, reply) => {
    const token = readSessionCookie(req, req.server.env.SESSION_COOKIE_NAME);
    if (token) await destroySession(token);
    reply.clearCookie(req.server.env.SESSION_COOKIE_NAME, { path: COOKIE_PATH });
    return reply.code(204).send();
  });

  /**
   * GET /api/v1/auth/me — currently logged-in account, or 401. Used by the web
   * client to decide whether to show the shelter receive form.
   */
  app.get('/auth/me', async (req, reply) => {
    const account = await currentAccount(req);
    if (!account) return reply.code(401).send({ error: 'NOT_AUTHENTICATED' });
    return reply.code(200).send({
      id: account.id,
      username: account.username,
      role: account.role,
      shelterId: account.shelterId,
    });
  });
}
