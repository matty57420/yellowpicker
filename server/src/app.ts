import { existsSync, mkdirSync } from 'node:fs';

import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';

import { seedAdmin } from './auth.ts';
import type { Config } from './config.ts';
import { openDb } from './db.ts';
import { registerProblemHandler } from './problem.ts';
import { adminRoutes } from './routes/admin.ts';
import { publicRoutes } from './routes/public.ts';
import { ImageStore, MAX_IMAGE_BYTES } from './uploads.ts';

export async function buildApp(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.isProduction ? true : { level: process.env.LOG_LEVEL ?? 'info' },
  });
  const db = openDb(config.dbPath);
  app.addHook('onClose', () => db.close());

  if (config.admin) {
    await seedAdmin(db, config.admin.username, config.admin.password);
  } else {
    app.log.warn('ADMIN_USERNAME / ADMIN_PASSWORD non définis : aucun compte admin créé.');
  }

  mkdirSync(config.uploadsDir, { recursive: true });
  const images = new ImageStore(config.uploadsDir);

  registerProblemHandler(app);
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: MAX_IMAGE_BYTES } });
  await app.register(rateLimit, { global: false });

  await app.register(publicRoutes(db, images), { prefix: '/api' });
  await app.register(adminRoutes(db, images, config.isProduction), { prefix: '/api/admin' });

  await app.register(fastifyStatic, {
    root: config.uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  // En production, le serveur sert aussi le build du client (SPA).
  if (config.isProduction && existsSync(config.clientDist)) {
    await app.register(fastifyStatic, { root: config.clientDist, wildcard: false });
    app.setNotFoundHandler((request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply
        .status(404)
        .type('application/problem+json')
        .send({ type: 'about:blank', title: 'Introuvable', status: 404 });
    });
  }

  return app;
}
