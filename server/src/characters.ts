import type { Character, Pick } from '@yellowpicker/shared';

import { hashToken } from './auth.ts';
import { transaction, type Db } from './db.ts';
import { HttpProblem } from './problem.ts';
import { uploadUrl } from './uploads.ts';

interface CharacterRow {
  id: number;
  name: string;
  description: string;
  image_file: string | null;
  max_slots: number;
}

interface PickRow {
  id: number;
  character_id: number;
  first_name: string;
  last_name: string;
  photo_file: string;
  created_at: string;
}

export interface CharacterInput {
  name: string;
  description: string;
  maxSlots: number;
}

export interface PickInput {
  firstName: string;
  lastName: string;
}

/** Clé d'unicité d'une personne : insensible à la casse, aux accents et aux espaces. */
export function personKey({ firstName, lastName }: PickInput): string {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replaceAll(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replaceAll(/\s+/g, ' ')
      .trim();
  return `${normalize(firstName)}|${normalize(lastName)}`;
}

function toPick(row: PickRow): Pick {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    photoUrl: uploadUrl(row.photo_file),
    createdAt: row.created_at,
  };
}

export function listCharacters(db: Db): Character[] {
  const characters = db
    .prepare(
      'SELECT id, name, description, image_file, max_slots FROM characters ORDER BY name COLLATE NOCASE',
    )
    .all() as unknown as CharacterRow[];
  const picks = db
    .prepare(
      'SELECT id, character_id, first_name, last_name, photo_file, created_at FROM picks ORDER BY id',
    )
    .all() as unknown as PickRow[];

  return characters.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    imageUrl: c.image_file ? uploadUrl(c.image_file) : null,
    maxSlots: c.max_slots,
    picks: picks.filter((p) => p.character_id === c.id).map(toPick),
  }));
}

function getCharacterRow(db: Db, id: number): CharacterRow {
  const row = db
    .prepare('SELECT id, name, description, image_file, max_slots FROM characters WHERE id = ?')
    .get(id) as CharacterRow | undefined;
  if (!row) {
    throw new HttpProblem(404, 'Personnage introuvable');
  }
  return row;
}

export function createCharacter(db: Db, input: CharacterInput, imageFile: string | null): number {
  const result = db
    .prepare(
      'INSERT INTO characters (name, description, image_file, max_slots) VALUES (?, ?, ?, ?)',
    )
    .run(input.name, input.description, imageFile, input.maxSlots);
  return Number(result.lastInsertRowid);
}

/** Met à jour un personnage ; renvoie l'ancienne image à supprimer si elle a été remplacée. */
export function updateCharacter(
  db: Db,
  id: number,
  input: CharacterInput,
  imageFile: string | null,
): string | null {
  return transaction(db, () => {
    const current = getCharacterRow(db, id);
    const { taken } = db
      .prepare('SELECT COUNT(*) AS taken FROM picks WHERE character_id = ?')
      .get(id) as { taken: number };
    if (input.maxSlots < taken) {
      throw new HttpProblem(
        409,
        'Places insuffisantes',
        `${taken} personne(s) ont déjà choisi ce personnage.`,
      );
    }
    db.prepare(
      'UPDATE characters SET name = ?, description = ?, max_slots = ?, image_file = ? WHERE id = ?',
    ).run(input.name, input.description, input.maxSlots, imageFile ?? current.image_file, id);
    return imageFile ? current.image_file : null;
  });
}

/** Supprime un personnage et ses choix ; renvoie les fichiers à effacer. */
export function deleteCharacter(db: Db, id: number): string[] {
  return transaction(db, () => {
    const current = getCharacterRow(db, id);
    const photos = db.prepare('SELECT photo_file FROM picks WHERE character_id = ?').all(id) as {
      photo_file: string;
    }[];
    db.prepare('DELETE FROM characters WHERE id = ?').run(id);
    return [current.image_file, ...photos.map((p) => p.photo_file)].filter(
      (f): f is string => f !== null,
    );
  });
}

/**
 * Réserve une place sur un personnage. Le driver étant synchrone, la vérification des places
 * et l'insertion sont atomiques : premier arrivé, premier servi.
 */
export function createPick(
  db: Db,
  characterId: number,
  input: PickInput,
  photoFile: string,
  editToken: string,
): Pick {
  return transaction(db, () => {
    const character = getCharacterRow(db, characterId);
    const { taken } = db
      .prepare('SELECT COUNT(*) AS taken FROM picks WHERE character_id = ?')
      .get(characterId) as { taken: number };
    if (taken >= character.max_slots) {
      throw new HttpProblem(409, 'Personnage déjà pris', `${character.name} n'a plus de place.`);
    }
    const key = personKey(input);
    if (db.prepare('SELECT 1 FROM picks WHERE person_key = ?').get(key)) {
      throw new HttpProblem(
        409,
        'Déjà inscrit',
        `${input.firstName} ${input.lastName} a déjà choisi un personnage.`,
      );
    }
    const result = db
      .prepare(
        `INSERT INTO picks (character_id, first_name, last_name, person_key, photo_file, edit_token_hash)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(characterId, input.firstName, input.lastName, key, photoFile, hashToken(editToken));
    const row = db
      .prepare(
        'SELECT id, character_id, first_name, last_name, photo_file, created_at FROM picks WHERE id = ?',
      )
      .get(result.lastInsertRowid) as unknown as PickRow;
    return toPick(row);
  });
}

/**
 * Supprime un choix. Sans `editToken` (appel admin) la suppression est inconditionnelle.
 * Renvoie la photo à effacer.
 */
export function deletePick(db: Db, pickId: number, editToken?: string): string {
  const row = db
    .prepare('SELECT photo_file, edit_token_hash FROM picks WHERE id = ?')
    .get(pickId) as { photo_file: string; edit_token_hash: string } | undefined;
  if (!row) {
    throw new HttpProblem(404, 'Choix introuvable');
  }
  if (editToken !== undefined && hashToken(editToken) !== row.edit_token_hash) {
    throw new HttpProblem(403, 'Ce choix ne vous appartient pas');
  }
  db.prepare('DELETE FROM picks WHERE id = ?').run(pickId);
  return row.photo_file;
}
