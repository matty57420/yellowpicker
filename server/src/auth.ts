import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { AdminSession } from '@yellowpicker/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';

import type { Db } from './db.ts';
import { HttpProblem } from './problem.ts';

const scryptAsync = promisify(scrypt) as (
  pwd: string,
  salt: Buffer,
  len: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'yp_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Les tokens (session, édition) ne sont stockés que hashés. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(':');
  if (!saltHex || !keyHex) {
    return false;
  }
  const key = await scryptAsync(password, Buffer.from(saltHex, 'hex'), 64);
  return timingSafeEqual(key, Buffer.from(keyHex, 'hex'));
}

/** Crée ou met à jour le compte admin défini par ADMIN_USERNAME / ADMIN_PASSWORD. */
export async function seedAdmin(db: Db, username: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  db.prepare(
    `INSERT INTO admins (username, password_hash) VALUES (?, ?)
     ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash`,
  ).run(username, passwordHash);
}

export function createSession(db: Db, adminId: number): { token: string; expiresAt: Date } {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString());
  db.prepare('INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    adminId,
    expiresAt.toISOString(),
  );
  return { token, expiresAt };
}

export function deleteSession(db: Db, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function findSession(db: Db, token: string | undefined): AdminSession | null {
  if (!token) {
    return null;
  }
  const row = db
    .prepare(
      `SELECT a.username FROM sessions s JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), new Date().toISOString()) as { username: string } | undefined;
  return row ? { username: row.username } : null;
}

/** preHandler Fastify : refuse la requête sans session admin valide. */
export function requireAdmin(db: Db) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!findSession(db, request.cookies[SESSION_COOKIE])) {
      throw new HttpProblem(401, 'Authentification requise');
    }
  };
}
