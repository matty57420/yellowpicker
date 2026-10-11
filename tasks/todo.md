# Tasks — Session en cours

## Session courante

- **Date** : 2026-10-11
- **Chantier** : Scaffolding Yellow Picker (picker de personnages pour soirée déguisée)
- **Branche** : `main` (repo vierge)

## Plan

- [x] Bootstrap config-dev (`react-frontend`, profil `sandbox`, configs, hooks, ADR)
- [x] Monorepo npm workspaces : `client/` (Vite + React + TS + Tailwind + TanStack Query + React Router), `server/` (Fastify + TS + SQLite `node:sqlite`), `shared/` (types API)
- [x] Modèle : `characters` (name, description, image, `max_slots` ≥ 1 — 1 = exclusif, N = rôle type STAFF), `picks` (prénom, nom, photo, token d'édition hashé), `admins`, `sessions`
- [x] API publique : liste des persos + picks, choisir un perso (multipart + photo), annuler son choix (token)
- [x] API admin : login/logout (cookie httpOnly), CRUD personnages, suppression d'un pick
- [x] Front : grille de cards sélectionnables, formulaire prénom/nom/photo, écran admin protégé
- [x] Tests serveur (règles de places) + type-check + lint + build
- [x] ADR 0001 : choix backend Node maison + SQLite ; CLAUDE.md adapté

## Notes en cours

- Une personne (prénom + nom, insensible à la casse) = un seul personnage.
- Places vérifiées en transaction côté serveur (premier arrivé, premier servi).
- Photos stockées sur disque (`server/data/uploads/`), type vérifié par magic bytes, 5 Mo max.

## Critères de fin de session

- [x] `npm run type-check && npm run lint && npm test && npm run build` passent
