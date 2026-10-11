import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { Character, CreatedPick } from '@yellowpicker/shared';
import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.ts';
import { personKey } from '../src/characters.ts';
import type { Config } from '../src/config.ts';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function multipart(fields: Record<string, string>, file?: Buffer) {
  const boundary = '----yp-test';
  const chunks: Buffer[] = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }
  if (file) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="p.png"\r\nContent-Type: image/png\r\n\r\n`,
      ),
      file,
      Buffer.from('\r\n'),
    );
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    payload: Buffer.concat(chunks),
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

let app: FastifyInstance;
let dataDir: string;
let adminCookie: string;

async function createCharacter(name: string, maxSlots = 1): Promise<number> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/characters',
    cookies: { yp_session: adminCookie },
    ...multipart({ name, maxSlots: String(maxSlots) }),
  });
  expect(res.statusCode).toBe(201);
  return res.json<{ id: number }>().id;
}

function pick(characterId: number, firstName: string, lastName: string, photo: Buffer = PNG) {
  return app.inject({
    method: 'POST',
    url: `/api/characters/${characterId}/picks`,
    ...multipart({ firstName, lastName }, photo),
  });
}

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), 'yp-'));
  const config: Config = {
    isProduction: false,
    host: '127.0.0.1',
    port: 0,
    dbPath: ':memory:',
    uploadsDir: path.join(dataDir, 'uploads'),
    clientDist: dataDir,
    admin: { username: 'admin', password: 'super-secret-pwd' },
  };
  process.env.LOG_LEVEL = 'silent';
  app = await buildApp(config);
  const login = await app.inject({
    method: 'POST',
    url: '/api/admin/login',
    payload: { username: 'admin', password: 'super-secret-pwd' },
  });
  expect(login.statusCode).toBe(200);
  const cookie = login.cookies.find((c) => c.name === 'yp_session');
  expect(cookie?.httpOnly).toBe(true);
  adminCookie = cookie?.value ?? '';
});

afterEach(async () => {
  await app.close();
  await rm(dataDir, { recursive: true, force: true });
});

describe('admin', () => {
  it('refuse la création de personnage sans session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/characters',
      ...multipart({ name: 'Intrus' }),
    });
    expect(res.statusCode).toBe(401);
    expect(res.headers['content-type']).toContain('application/problem+json');
  });

  it('refuse un mauvais mot de passe', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/login',
      payload: { username: 'admin', password: 'nope' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('interdit de réduire les places sous le nombre de choix existants', async () => {
    const id = await createCharacter('Staff', 3);
    await pick(id, 'Ada', 'Lovelace');
    await pick(id, 'Alan', 'Turing');
    const res = await app.inject({
      method: 'PUT',
      url: `/api/admin/characters/${id}`,
      cookies: { yp_session: adminCookie },
      ...multipart({ name: 'Staff', maxSlots: '1' }),
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('choix de personnage', () => {
  it('un personnage exclusif ne peut être pris qu’une fois', async () => {
    const id = await createCharacter('Héros');
    expect((await pick(id, 'Ada', 'Lovelace')).statusCode).toBe(201);
    const second = await pick(id, 'Alan', 'Turing');
    expect(second.statusCode).toBe(409);
  });

  it('un rôle partagé accepte plusieurs personnes jusqu’à sa limite', async () => {
    const id = await createCharacter('Staff', 2);
    expect((await pick(id, 'Ada', 'Lovelace')).statusCode).toBe(201);
    expect((await pick(id, 'Alan', 'Turing')).statusCode).toBe(201);
    expect((await pick(id, 'Grace', 'Hopper')).statusCode).toBe(409);

    const list = (await app.inject({ url: '/api/characters' })).json<Character[]>();
    expect(list[0]?.picks.map((p) => p.firstName)).toEqual(['Ada', 'Alan']);
  });

  it('une même personne ne peut choisir qu’un personnage (casse et accents ignorés)', async () => {
    const a = await createCharacter('A');
    const b = await createCharacter('B');
    expect((await pick(a, 'Zoé', 'Martin')).statusCode).toBe(201);
    expect((await pick(b, ' zoe ', 'MARTIN')).statusCode).toBe(409);
  });

  it('refuse un fichier qui n’est pas une image', async () => {
    const id = await createCharacter('Héros');
    const res = await pick(id, 'Ada', 'Lovelace', Buffer.from('<script>alert(1)</script>'));
    expect(res.statusCode).toBe(415);
  });

  it('seul le détenteur du token peut annuler son choix', async () => {
    const id = await createCharacter('Héros');
    const created = (await pick(id, 'Ada', 'Lovelace')).json<CreatedPick>();
    const url = `/api/picks/${created.pick.id}`;

    const forbidden = await app.inject({ method: 'DELETE', url, headers: { 'x-edit-token': 'x' } });
    expect(forbidden.statusCode).toBe(403);

    const ok = await app.inject({
      method: 'DELETE',
      url,
      headers: { 'x-edit-token': created.editToken },
    });
    expect(ok.statusCode).toBe(204);
    expect((await pick(id, 'Alan', 'Turing')).statusCode).toBe(201);
  });

  it('sert la photo uploadée', async () => {
    const id = await createCharacter('Héros');
    const created = (await pick(id, 'Ada', 'Lovelace')).json<CreatedPick>();
    const photo = await app.inject({ url: created.pick.photoUrl });
    expect(photo.statusCode).toBe(200);
  });
});

describe('personKey', () => {
  it('normalise casse, accents et espaces', () => {
    expect(personKey({ firstName: '  Zoé  Anne', lastName: 'MARTIN ' })).toBe('zoe anne|martin');
  });
});
