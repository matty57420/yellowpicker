# 0001 — Backend Node (Fastify) + SQLite + stockage disque des photos

- **Status** : Accepted
- **Date** : 2026-10-11
- **Decision-makers** : Matthieu

---

## Context and Problem Statement

Yellow Picker permet aux invités d'une soirée déguisée de réserver un personnage du film et d'y associer leur photo. Les choix doivent être partagés entre tous les appareils et la réservation doit être fiable : un personnage exclusif ne peut pas être pris deux fois, même si deux personnes valident en même temps. Un écran d'administration protégé gère les personnages.

Volume : quelques dizaines à centaines d'invités, un seul événement, hébergement simple.

## Decision Drivers

- Garantir l'exclusivité côté serveur (pas seulement dans l'UI)
- Zéro service tiers : maîtrise des données et des photos des invités
- Déploiement en un seul process / un seul conteneur
- Pas de dépendance native à compiler (installation sans friction)

## Considered Options

### Option 1 : BaaS (Supabase / Firebase)

Pas de serveur à écrire, mais données et photos chez un tiers, et règles d'exclusivité à exprimer en RLS / security rules.

### Option 2 : Node (Fastify) + SQLite (`node:sqlite`) + photos sur disque

Un seul process qui sert l'API, les photos et le build du client.

### Option 3 : Node + Postgres + stockage objet (S3)

Robuste mais surdimensionné pour un événement ponctuel.

## Decision Outcome

**Option retenue** : Option 2.

Le driver SQLite intégré à Node (`node:sqlite`) est synchrone : la vérification des places et l'insertion du choix s'exécutent dans une transaction sans `await` intermédiaire, ce qui rend la réservation atomique (premier arrivé, premier servi). Aucune dépendance native, une base = un fichier facile à sauvegarder.

### Conséquences positives

- Exclusivité garantie par le serveur ; unicité d'une personne via une contrainte `UNIQUE` (prénom + nom normalisés)
- Déploiement trivial : `npm run build && npm start`, un dossier `data/` à persister

### Conséquences négatives

- Pas de scalabilité horizontale (un seul process écrit dans la base) — acceptable pour le volume visé
- Le dossier `data/` (base + photos) doit être sauvegardé et monté en volume en conteneur
- `node:sqlite` impose Node ≥ 22.13
