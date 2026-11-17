# Lessons — Pièges rencontrés et remèdes

Mémoire durable du projet. À mettre à jour **après chaque correction non triviale** ou découverte qui aurait évité du temps perdu si on l'avait su plus tôt.

> Règle : si tu as buté plus de 30 minutes sur quelque chose, ça mérite une entrée ici. Si quelqu'un peut buter sur la même chose dans 6 mois, ça mérite une entrée ici.

---

## Format d'une entrée

```
### <Titre court de la leçon>

**Contexte** : Quand est-ce que ça arrive ?
**Symptôme** : Comment se manifeste le problème ?
**Cause** : Pourquoi ça arrive ?
**Remède** : Quoi faire concrètement.
**Référence** : <fichier:ligne, commit, lien doc> si pertinent.
```

---

## Entrées

> Ajouter les entrées les plus récentes en haut.

### Un rate-limit derrière un reverse proxy sans `trustProxy` protège l'attaquant, pas le service

**Contexte** : mise en production derrière Caddy (`docs/deployment.md`). Vaut pour tout ajout de
reverse proxy devant le serveur Fastify.
**Symptôme** : aucun, en apparence — le rate-limit du login « fonctionne ». Mais dix requêtes depuis
une seule machine suffisent à renvoyer 429 à **tous** les visiteurs, et un brute-force distribué
n'est jamais ralenti.
**Cause** : sans `trustProxy`, `request.ip` vaut l'IP du proxy (`127.0.0.1`) pour tout le monde.
`@fastify/rate-limit` clé par `request.ip` : un seul compteur partagé au lieu d'un par client.
**Remède** : `TRUST_PROXY=true` dans l'environnement **uniquement** quand un proxy de confiance est
devant (exposé en direct, ça laisserait falsifier son IP via `X-Forwarded-For`). Le défaut reste
`false`. Test de non-régression : `describe('rate limit du login derrière un proxy')` dans
`server/test/api.test.ts` — vérifié en remettant `trustProxy: false`, il échoue bien.
**Référence** : `server/src/config.ts`, `server/src/app.ts`.

### Un cookie `secure` fait du HTTPS une dépendance fonctionnelle, pas un durcissement

**Contexte** : tout déploiement en `NODE_ENV=production`.
**Symptôme** : le login admin « réussit » (200 + Set-Cookie) mais la page suivante renvoie 401 — le
navigateur a silencieusement jeté le cookie.
**Cause** : `secure: isProduction` dans `server/src/routes/admin.ts` : en HTTP simple le navigateur
refuse de stocker le cookie de session.
**Remède** : jamais de prod sans TLS, et ne pas exposer le port du serveur Node en direct — sinon on
« contourne » le proxy sans comprendre pourquoi l'admin ne marche plus. D'où `HOST=127.0.0.1` et le
port 3000 jamais ouvert dans ufw.
**Référence** : `docs/deployment.md`, section « Choix d'architecture ».
