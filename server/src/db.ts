import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS characters (
  id          INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL DEFAULT '',
  image_file  TEXT,
  max_slots   INTEGER NOT NULL DEFAULT 1 CHECK (max_slots >= 1),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS picks (
  id              INTEGER PRIMARY KEY,
  character_id    INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  first_name      TEXT    NOT NULL,
  last_name       TEXT    NOT NULL,
  -- prénom + nom normalisés : une personne = un seul personnage
  person_key      TEXT    NOT NULL UNIQUE,
  photo_file      TEXT    NOT NULL,
  edit_token_hash TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS picks_character_id ON picks(character_id);

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT    PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL
);
`;

export type Db = DatabaseSync;

export function openDb(dbPath: string): Db {
  if (dbPath !== ':memory:') {
    mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  return db;
}

/** Exécute `fn` dans une transaction (le driver est synchrone : pas d'await à l'intérieur). */
export function transaction<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
