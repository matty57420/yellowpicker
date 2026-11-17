# Déploiement — VPS Hetzner Cloud

Yellow Picker tourne en un **seul process Node** derrière Caddy : le serveur Fastify sert l'API,
les photos (`/uploads`) et le build du client sur le même port. Pas de base externe, pas de Docker.

```
Internet ──► Caddy (:80/:443, TLS Let's Encrypt automatique)
                 └─► reverse_proxy 127.0.0.1:3000
                          └─► systemd yellowpicker.service
                                   node /srv/yellowpicker/server/dist/main.js
                                   ├─ /api/*     API
                                   ├─ /uploads/* photos
                                   └─ /*         SPA (client/dist)
```

| | |
| --- | --- |
| Code | `/srv/yellowpicker` (clone git, propriétaire `yellowpicker`) |
| Données | `/srv/yellowpicker/server/data` — **le seul dossier à sauvegarder** |
| Secrets | `/etc/yellowpicker.env` (hors du dépôt, `chmod 640`) |
| Sauvegardes | `/srv/yellowpicker/backups`, 7 jours glissants |

> **HTTPS obligatoire.** Le cookie de session admin est posé avec `secure` en production
> (`server/src/routes/admin.ts`). En HTTP simple, le navigateur le refuse et **le login admin ne
> fonctionne pas**. Un domaine et un certificat ne sont donc pas un confort.

## 1. Créer le serveur

Hetzner Cloud → nouveau serveur :

- Image **Ubuntu 24.04 LTS**
- Type **CX22** (2 vCPU / 4 Go) — le build Vite + `tsc` tient sans swap.
  Sur un CPX11 (2 Go), ajouter 2 Go de swap avant le premier build.
- Localisation Nuremberg ou Falkenstein
- Y attacher sa clé SSH publique (sinon tout le reste est à faire au mot de passe)

## 2. DNS

Créer un enregistrement `A` (et `AAAA` si IPv6) du (sous-)domaine vers l'IP du serveur, puis vérifier :

```bash
dig +short picker.exemple.fr
```

Pas encore de domaine ? `<ip-avec-tirets>.sslip.io` (ex. `203-0-113-9.sslip.io`) résout vers l'IP et
Let's Encrypt sait délivrer un certificat dessus : utilisable pour tester, à remplacer ensuite
(cf. [Changer de domaine](#changer-de-domaine)).

## 3. Provisionner

```bash
scp deploy/bootstrap.sh root@<ip>:/root/
ssh root@<ip> 'YP_DOMAIN=picker.exemple.fr bash /root/bootstrap.sh'
```

Le script installe Node 24, Caddy, le pare-feu, l'utilisateur `yellowpicker`, le service systemd et
le timer de sauvegarde. Il est **idempotent** : relançable sans casse.

Au premier passage il s'arrête en affichant une clé publique SSH. La coller dans
GitHub → dépôt → **Settings → Deploy keys → Add deploy key**, **sans** cocher *Allow write access*
(le serveur n'a besoin que de lire), puis **relancer la même commande**.

## 4. Mot de passe admin

```bash
ssh root@<ip> sudoedit /etc/yellowpicker.env   # renseigner ADMIN_PASSWORD (>= 10 caractères)
```

Tant que cette variable est vide, aucun compte admin n'existe et le démarrage logue
`ADMIN_USERNAME / ADMIN_PASSWORD non définis`.

## 5. Premier déploiement

Depuis le Mac, à la racine du dépôt :

```bash
export YP_HOST=yellowpicker@picker.exemple.fr
export YP_DOMAIN=picker.exemple.fr
./scripts/deploy.sh
```

Le script fait `git fetch` + `reset --hard origin/main`, `npm ci`, `npm run build`, redémarre le
service, puis **vérifie que le site répond** — il sort en erreur sinon. C'est la seule commande à
relancer pour chaque mise à jour ultérieure.

Déployer une autre ref : `YP_REF=origin/ma-branche ./scripts/deploy.sh`.

## Exploitation

```bash
# Journaux en direct
ssh $YP_HOST 'journalctl -u yellowpicker -f'

# État du service
ssh $YP_HOST 'sudo systemctl status yellowpicker'

# Sauvegarde immédiate (sinon : chaque jour, via yellowpicker-backup.timer)
ssh $YP_HOST 'sudo systemctl start yellowpicker-backup && ls -lh /srv/yellowpicker/backups'

# Prochaine sauvegarde programmée
ssh $YP_HOST 'systemctl list-timers yellowpicker-backup'
```

### Changer le mot de passe admin

`seedAdmin` fait un `INSERT … ON CONFLICT DO UPDATE` à **chaque** démarrage : modifier
`ADMIN_PASSWORD` dans `/etc/yellowpicker.env` puis redémarrer **est** la procédure.

```bash
ssh root@<ip> 'sudoedit /etc/yellowpicker.env && systemctl restart yellowpicker'
```

À l'inverse, vider la variable ne supprime pas le compte existant : ça laisse juste l'ancien mot de
passe en place.

### Restaurer une sauvegarde

```bash
ssh $YP_HOST
sudo systemctl stop yellowpicker
cd /srv/yellowpicker/server/data
cp /srv/yellowpicker/backups/yellowpicker-<stamp>.db yellowpicker.db
rm -f yellowpicker.db-wal yellowpicker.db-shm     # restes de l'ancienne base
tar -xzf /srv/yellowpicker/backups/uploads-<stamp>.tar.gz
sudo systemctl start yellowpicker
```

La base et les photos se restaurent **ensemble** : un `picks.photo_file` sans fichier
correspondant donne une image cassée dans la grille.

### Changer de domaine

```bash
ssh root@<ip>
echo 'YP_DOMAIN=nouveau.exemple.fr' > /etc/default/caddy
systemctl restart caddy          # Caddy obtient le nouveau certificat seul
```

Penser à mettre à jour `YP_DOMAIN` en local pour le smoke test de `scripts/deploy.sh`.

### Retour arrière

```bash
YP_REF=<sha-du-commit-précédent> ./scripts/deploy.sh
```

Les données ne sont pas touchées par un déploiement : seul le code change.

## Choix d'architecture

**Caddy plutôt que nginx + certbot** : le TLS automatique tient en trois lignes, sans cron de
renouvellement à surveiller — ce qui compte pour un site qui ne sera regardé qu'autour d'une date.

**`HOST=127.0.0.1` + port 3000 jamais ouvert dans ufw** : le serveur Node n'est joignable que par
Caddy, donc impossible de contourner le TLS en tapant `http://<ip>:3000` (ce qui casserait le login
admin de façon déroutante au lieu de refuser la connexion).

**`TRUST_PROXY=true` uniquement ici** : le défaut est `false`. Derrière un proxy, sans ce réglage,
le rate-limit du login (`max: 10` / 5 min) voit toutes les requêtes comme venant de `127.0.0.1` :
son quota devient global, et dix requêtes suffisent à verrouiller le login admin pour tout le monde.
Exposé en direct, l'inverse serait vrai : un client pourrait usurper son IP via `X-Forwarded-For`.

**`node dist/main.js` plutôt que `npm start`** : pas de process wrapper, donc `SIGTERM` arrive
réellement au serveur et le hook `onClose` ferme la base proprement.

**Chemins absolus dans `/etc/yellowpicker.env`** : `loadConfig` fait un `path.resolve()` sur
`DATA_DIR` et `CLIENT_DIST`. En relatif, la résolution dépend du `WorkingDirectory` de l'unité
systemd — un changement d'unité créerait silencieusement une base vide ailleurs.

**`sqlite3 .backup` plutôt qu'un `cp`** : la base tourne en WAL, copier le `.db` à chaud donne une
sauvegarde potentiellement corrompue. Le script vérifie en plus l'`integrity_check` du résultat.
