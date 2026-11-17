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

## Session 2026-11-17 — Déploiement VPS Hetzner

- **Chantier** : mise en production sur un VPS Hetzner Cloud (Ubuntu 24.04)
- **Choix** : un seul process Node derrière Caddy (TLS auto), systemd, `git pull` + build sur le
  serveur. Pas de Docker : un process + un volume de données, il n'apporterait que des pièces.

### Fait

- [x] `TRUST_PROXY` (défaut `false`) dans `server/src/config.ts`, passé à `Fastify()` — sans ça le
      rate-limit du login était global au lieu d'être par IP, donc verrouillable par n'importe qui
      en 10 requêtes
- [x] Test du rate-limit par IP à travers `X-Forwarded-For` (vérifié : il échoue bien si on remet
      `trustProxy: false`)
- [x] `deploy/` : `bootstrap.sh` (provisioning idempotent), unité systemd durcie, `Caddyfile`,
      `env.example`, `backup.sh` + timer quotidien
- [x] `scripts/deploy.sh` : fetch + reset + `npm ci` + build + restart + smoke test HTTPS
- [x] `docs/deployment.md` : runbook (création VPS, DNS, secrets, exploitation, restauration)

### À faire par l'utilisateur (hors code)

- [ ] Créer le VPS (CX22, Ubuntu 24.04) avec sa clé SSH
- [ ] Acheter le domaine et créer l'enregistrement A/AAAA (stopgap : `<ip>.sslip.io`)
- [ ] `bootstrap.sh`, coller la deploy key dans GitHub, relancer
- [ ] Remplir `ADMIN_PASSWORD` dans `/etc/yellowpicker.env`
- [ ] `./scripts/deploy.sh`, puis la vérification depuis un téléphone (cf. runbook)
