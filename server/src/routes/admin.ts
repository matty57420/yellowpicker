import type { AdminSession } from '@yellowpicker/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  createSession,
  deleteSession,
  findSession,
  requireAdmin,
  SESSION_COOKIE,
  verifyPassword,
} from '../auth.ts';
import { createCharacter, deleteCharacter, deletePick, updateCharacter } from '../characters.ts';
import type { Db } from '../db.ts';
import { HttpProblem } from '../problem.ts';
import { readMultipart, type ImageStore } from '../uploads.ts';

import { idParams } from './public.ts';

const loginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

const characterSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(80),
  description: z.string().trim().max(500).default(''),
  maxSlots: z.coerce.number().int().min(1, 'Au moins 1 place').max(500).default(1),
});

export function adminRoutes(db: Db, images: ImageStore, secureCookies: boolean) {
  return async (app: FastifyInstance): Promise<void> => {
    app.post(
      '/login',
      { config: { rateLimit: { max: 10, timeWindow: '5 minutes' } } },
      async (request, reply) => {
        const { username, password } = loginSchema.parse(request.body);
        const admin = db
          .prepare('SELECT id, password_hash FROM admins WHERE username = ?')
          .get(username) as { id: number; password_hash: string } | undefined;
        if (!admin || !(await verifyPassword(password, admin.password_hash))) {
          throw new HttpProblem(401, 'Identifiants invalides');
        }
        const { token, expiresAt } = createSession(db, admin.id);
        const body: AdminSession = { username };
        return reply
          .setCookie(SESSION_COOKIE, token, {
            path: '/api',
            httpOnly: true,
            sameSite: 'strict',
            secure: secureCookies,
            expires: expiresAt,
          })
          .send(body);
      },
    );

    app.post('/logout', async (request, reply) => {
      const token = request.cookies[SESSION_COOKIE];
      if (token) {
        deleteSession(db, token);
      }
      return reply.clearCookie(SESSION_COOKIE, { path: '/api' }).status(204).send();
    });

    app.get('/me', async (request) => {
      const session = findSession(db, request.cookies[SESSION_COOKIE]);
      if (!session) {
        throw new HttpProblem(401, 'Authentification requise');
      }
      return session;
    });

    // Toutes les routes ci-dessous exigent une session admin.
    await app.register(async (secured) => {
      secured.addHook('preHandler', requireAdmin(db));

      secured.post('/characters', async (request, reply) => {
        const { fields, file } = await readMultipart(request);
        const input = characterSchema.parse(fields);
        const imageFile = file ? await images.save(file) : null;
        const id = createCharacter(db, input, imageFile);
        return reply.status(201).send({ id });
      });

      secured.put('/characters/:id', async (request, reply) => {
        const { id } = idParams.parse(request.params);
        const { fields, file } = await readMultipart(request);
        const input = characterSchema.parse(fields);
        const imageFile = file ? await images.save(file) : null;
        try {
          await images.remove(updateCharacter(db, id, input, imageFile));
        } catch (error) {
          await images.remove(imageFile);
          throw error;
        }
        return reply.status(204).send();
      });

      secured.delete('/characters/:id', async (request, reply) => {
        const { id } = idParams.parse(request.params);
        await Promise.all(deleteCharacter(db, id).map((f) => images.remove(f)));
        return reply.status(204).send();
      });

      secured.delete('/picks/:id', async (request, reply) => {
        const { id } = idParams.parse(request.params);
        await images.remove(deletePick(db, id));
        return reply.status(204).send();
      });
    });
  };
}
