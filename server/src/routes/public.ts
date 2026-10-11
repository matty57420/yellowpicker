import type { CreatedPick } from '@yellowpicker/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { newToken } from '../auth.ts';
import { createPick, deletePick, listCharacters } from '../characters.ts';
import type { Db } from '../db.ts';
import { HttpProblem } from '../problem.ts';
import { readMultipart, type ImageStore } from '../uploads.ts';

export const idParams = z.object({ id: z.coerce.number().int().positive() });

const pickSchema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(50),
  lastName: z.string().trim().min(1, 'Nom requis').max(50),
});

export function publicRoutes(db: Db, images: ImageStore) {
  return async (app: FastifyInstance): Promise<void> => {
    app.get('/characters', async () => listCharacters(db));

    app.post('/characters/:id/picks', async (request, reply) => {
      const { id } = idParams.parse(request.params);
      const { fields, file } = await readMultipart(request);
      const input = pickSchema.parse(fields);
      if (!file) {
        throw new HttpProblem(400, 'Photo requise');
      }
      const photoFile = await images.save(file);
      const editToken = newToken();
      try {
        const pick = createPick(db, id, input, photoFile, editToken);
        const body: CreatedPick = { pick, characterId: id, editToken };
        return await reply.status(201).send(body);
      } catch (error) {
        await images.remove(photoFile);
        throw error;
      }
    });

    app.delete('/picks/:id', async (request, reply) => {
      const { id } = idParams.parse(request.params);
      const token = request.headers['x-edit-token'];
      if (typeof token !== 'string' || token === '') {
        throw new HttpProblem(401, 'Token d’édition manquant');
      }
      await images.remove(deletePick(db, id, token));
      return reply.status(204).send();
    });
  };
}
