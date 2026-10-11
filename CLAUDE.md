# CLAUDE.md — Yellow Picker

Picker de personnages pour une soirée déguisée : les invités réservent un personnage du film avec prénom, nom et photo ; un admin gère les personnages.

## Engineering Doctrine

Le projet suit [`config-dev/policies/engineering-doctrine.md`](~/dev/config-dev/policies/engineering-doctrine.md).
**Exceptions** : side-project (profil `sandbox`). Pas d'observabilité externe (Sentry/RUM), pas de Playwright ni d'objectif de couverture, pas de work item lié aux PR.

## Stack

- **Monorepo** npm workspaces : `client/`, `server/`, `shared/`
- **client** : React 19 (function components) + Vite + TS strict + Tailwind 4 (`@theme` dans `src/index.css`) + TanStack Query v5 + React Router (`react-router`)
- **server** : Fastify 5 + `node:sqlite` (synchrone) + zod + `@fastify/multipart` ; photos sur disque dans `DATA_DIR/uploads`
- **shared** : types du contrat d'API **uniquement** (aucun export à l'exécution, importés en `import type`)
- **Node ≥ 22.13** (nvm : `~/.nvm/versions/node/v24.*`). TypeScript fixé en `~6.0` et ESLint en v9 (contraintes de peer deps de `typescript-eslint`, `eslint-plugin-import` et `unicorn`)
- ADR : [`docs/adr/0001-backend-node-sqlite.md`](docs/adr/0001-backend-node-sqlite.md)

## Règles métier (à ne pas casser)

- `characters.max_slots` : `1` = exclusif, `N` = rôle partagé (STAFF…). Vérification **côté serveur** dans `createPick` (transaction, aucun `await` dedans).
- Une personne = un personnage : `picks.person_key` UNIQUE (prénom + nom normalisés, voir `personKey`).
- L'annulation publique exige le header `x-edit-token` (stocké hashé en base, et en `localStorage` côté client). L'admin peut tout supprimer.
- Impossible de réduire `max_slots` sous le nombre de choix existants (409).
- Images : JPEG/PNG/WebP vérifiés par **magic bytes**, 5 Mo max ; le client redimensionne en JPEG avant upload (`lib/resize-image.ts`).

## Conventions

- Fichiers en **kebab-case** (règle `unicorn/filename-case`), composants en PascalCase.
- Serveur : imports relatifs avec extension `.ts` (réécrite en `.js` au build).
- Erreurs API en **RFC 7807** : lever `HttpProblem(status, title, detail)` ; zod → 400 automatique.
- Client : tout appel backend passe par un hook dans `src/api/` (`http()` lève `ApiError`). Pas de `fetch` dans les composants.
- Routes admin : enregistrées dans le sous-scope `secured` de `routes/admin.ts` (preHandler `requireAdmin`).
- Session admin : cookie `yp_session` httpOnly, `sameSite=strict`, `path=/api`, token hashé en base.
- Textes UI en français, tutoiement pour les invités.

## Guardrails

- Jamais de logique d'exclusivité uniquement côté client.
- Jamais d'`await` dans une fonction passée à `transaction()`.
- Jamais de secret dans une variable `VITE_*` ; `.env` jamais commité (voir `server/.env.example`).
- Ne pas exporter de valeur runtime depuis `shared/` (le serveur buildé ne le compile pas).
- Pas de `dangerouslySetInnerHTML`, pas de `// @ts-ignore`.

## Commandes

```bash
npm install
npm run dev          # server :3000 + client :5173 (proxy /api, /uploads)
npm run build        # client puis server
npm start            # prod : sert API + photos + SPA
```

## Verification

> **Claude DOIT lancer cette séquence après tout changement non trivial.**

```bash
npm run type-check && npm run lint && npm test && npm run build
```

Changement d'UI : lancer `npm run dev` et vérifier dans le navigateur (mobile compris, la plupart des invités utiliseront leur téléphone).

## Task Management

- Plan : `tasks/todo.md` · Leçons : `tasks/lessons.md` (puis enrichir CE fichier)
- Commits : Conventional Commits avec scope (`feat(picker): ...`, `fix(server): ...`)
