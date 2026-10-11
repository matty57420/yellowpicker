# Yellow Picker

Picker de personnages pour une soirée déguisée : chaque invité choisit un personnage du film, saisit son prénom et son nom, et ajoute sa photo. Un écran d'administration permet de gérer les personnages.

- Les personnages sont **exclusifs** par défaut (1 place). Un rôle **partagé** (ex. STAFF) accepte N personnes.
- Une personne (prénom + nom, sans tenir compte de la casse ni des accents) ne peut choisir qu'un personnage.
- L'invité peut annuler son choix depuis le même appareil (un token est gardé dans le navigateur). L'admin peut retirer n'importe quel choix.

## Stack

| Dossier   | Contenu                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| `client/` | React 19 + Vite + TypeScript + Tailwind 4 + TanStack Query + React Router                                     |
| `server/` | Fastify 5 + SQLite (`node:sqlite`) + photos sur disque — cf. [ADR 0001](docs/adr/0001-backend-node-sqlite.md) |
| `shared/` | Types du contrat d'API (types uniquement)                                                                     |

## Démarrage

Prérequis : Node ≥ 22.13.

```bash
npm install
cp server/.env.example server/.env   # puis renseigner ADMIN_PASSWORD
npm run dev                          # API sur :3000, front sur :5173 (proxy /api et /uploads)
```

- Site : http://localhost:5173
- Admin : http://localhost:5173/admin

## Production

```bash
npm run build
NODE_ENV=production ADMIN_USERNAME=admin ADMIN_PASSWORD=... npm start
```

Le serveur sert l'API, les photos (`/uploads`) et le build du client sur le même port. Les données (base SQLite + photos) vivent dans `server/data/` (`DATA_DIR`), le dossier à sauvegarder.

## Qualité

```bash
npm run type-check && npm run lint && npm test && npm run build
```
