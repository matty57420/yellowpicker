#!/usr/bin/env bash
#
# Provisionne un VPS Hetzner Cloud (Ubuntu 24.04) pour Yellow Picker.
# À jouer en root, une seule fois — mais relançable sans casse (idempotent).
#
#   scp deploy/bootstrap.sh root@<ip>:/root/
#   ssh root@<ip> 'YP_DOMAIN=picker.exemple.fr bash /root/bootstrap.sh'
#
# Au premier passage, le script s'arrête après avoir affiché la clé de
# déploiement à coller dans GitHub : le relancer ensuite termine l'installation.

set -euo pipefail

: "${YP_DOMAIN:?YP_DOMAIN manquant (ex. YP_DOMAIN=picker.exemple.fr)}"
REPO=${REPO:-git@github.com:matty57420/yellowpicker.git}
APP_USER=yellowpicker
APP_DIR=/srv/yellowpicker
ENV_FILE=/etc/yellowpicker.env
NODE_MAJOR=24

if [[ $EUID -ne 0 ]]; then
	echo "À lancer en root." >&2
	exit 1
fi

log() { printf '\n==> %s\n' "$1"; }

log "Paquets de base"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
	ca-certificates curl git gnupg sqlite3 ufw unattended-upgrades \
	debian-keyring debian-archive-keyring apt-transport-https

# Node >= 22.13 est obligatoire : c'est la version où node:sqlite cesse
# d'exiger --experimental-sqlite (cf. "engines" du package.json racine).
log "Node ${NODE_MAJOR}"
if ! command -v node >/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 22 ]]; then
	curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
	apt-get install -y -qq nodejs
fi
node -v

log "Caddy"
if ! command -v caddy >/dev/null; then
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' |
		gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
		>/etc/apt/sources.list.d/caddy-stable.list
	apt-get update -qq
	apt-get install -y -qq caddy
fi
caddy version

log "Utilisateur ${APP_USER}"
# Le même compte non privilégié sert au déploiement SSH et au service systemd :
# root n'intervient jamais dans la boucle de déploiement.
if ! id "$APP_USER" >/dev/null 2>&1; then
	useradd --system --create-home --shell /bin/bash "$APP_USER"
fi
install -d -o "$APP_USER" -g "$APP_USER" -m 755 "$APP_DIR"
install -d -o "$APP_USER" -g "$APP_USER" -m 700 "/home/${APP_USER}/.ssh"

# Reprend les clés SSH utilisées pour se connecter en root : le déploiement se
# fait ensuite avec ce compte non privilégié, sans jamais rouvrir root.
AUTH="/home/${APP_USER}/.ssh/authorized_keys"
if [[ ! -s $AUTH && -s /root/.ssh/authorized_keys ]]; then
	install -o "$APP_USER" -g "$APP_USER" -m 600 /root/.ssh/authorized_keys "$AUTH"
	echo "clés SSH de root recopiées pour ${APP_USER}."
fi

log "Clé de déploiement GitHub (lecture seule)"
KEY="/home/${APP_USER}/.ssh/id_ed25519"
if [[ ! -f $KEY ]]; then
	sudo -u "$APP_USER" ssh-keygen -t ed25519 -N '' -C "${APP_USER}@$(hostname)" -f "$KEY"
fi
sudo -u "$APP_USER" bash -c "ssh-keyscan -t ed25519 github.com 2>/dev/null \
	>> /home/${APP_USER}/.ssh/known_hosts && sort -u -o /home/${APP_USER}/.ssh/known_hosts \
	/home/${APP_USER}/.ssh/known_hosts"

log "Pare-feu"
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw default deny incoming >/dev/null
ufw --force enable
# Le port 3000 n'est jamais ouvert : HOST=127.0.0.1 + ufw, Caddy est la seule porte.

log "Droit de redémarrage du service pour ${APP_USER}"
cat >/etc/sudoers.d/yellowpicker <<EOF
${APP_USER} ALL=(root) NOPASSWD: /usr/bin/systemctl restart yellowpicker, /usr/bin/systemctl status yellowpicker
EOF
chmod 440 /etc/sudoers.d/yellowpicker
visudo -cf /etc/sudoers.d/yellowpicker

log "Fichier d'environnement ${ENV_FILE}"
if [[ ! -f $ENV_FILE ]]; then
	install -o root -g "$APP_USER" -m 640 /dev/null "$ENV_FILE"
	cat >"$ENV_FILE" <<EOF
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
TRUST_PROXY=true
DATA_DIR=${APP_DIR}/server/data
CLIENT_DIST=${APP_DIR}/client/dist
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
EOF
	chmod 640 "$ENV_FILE"
	echo "créé — ADMIN_PASSWORD est VIDE, à remplir avant le premier déploiement."
else
	echo "déjà présent, laissé intact."
fi

log "Dépôt ${REPO}"
if ! sudo -u "$APP_USER" git ls-remote "$REPO" HEAD >/dev/null 2>&1; then
	cat <<EOF

Le serveur n'a pas encore accès au dépôt. Colle cette clé publique dans
GitHub -> le dépôt -> Settings -> Deploy keys -> Add deploy key
(titre libre, NE PAS cocher "Allow write access") :

$(cat "${KEY}.pub")

Puis relance ce script pour terminer l'installation.
EOF
	exit 1
fi

if [[ ! -d ${APP_DIR}/.git ]]; then
	sudo -u "$APP_USER" git clone "$REPO" "$APP_DIR"
else
	sudo -u "$APP_USER" git -C "$APP_DIR" fetch --prune origin
	sudo -u "$APP_USER" git -C "$APP_DIR" reset --hard origin/main
fi
install -d -o "$APP_USER" -g "$APP_USER" -m 755 "${APP_DIR}/server/data" "${APP_DIR}/backups"

log "Service systemd"
install -m 644 "${APP_DIR}/deploy/yellowpicker.service" /etc/systemd/system/
install -m 644 "${APP_DIR}/deploy/yellowpicker-backup.service" /etc/systemd/system/
install -m 644 "${APP_DIR}/deploy/yellowpicker-backup.timer" /etc/systemd/system/
systemctl daemon-reload
systemctl enable yellowpicker >/dev/null
systemctl enable --now yellowpicker-backup.timer >/dev/null

log "Caddy pour ${YP_DOMAIN}"
install -m 644 "${APP_DIR}/deploy/Caddyfile" /etc/caddy/Caddyfile
echo "YP_DOMAIN=${YP_DOMAIN}" >/etc/default/caddy
# Drop-in plutôt que l'unité du paquet : garanti présent quelle que soit sa version.
install -d /etc/systemd/system/caddy.service.d
cat >/etc/systemd/system/caddy.service.d/override.conf <<'EOF'
[Service]
EnvironmentFile=/etc/default/caddy
EOF
install -d -o caddy -g caddy /var/log/caddy
systemctl daemon-reload
systemctl enable caddy >/dev/null
systemctl restart caddy

cat <<EOF

==> Provisioning terminé.

Reste à faire :
  1. Vérifier que ${YP_DOMAIN} pointe (A/AAAA) vers $(curl -fsS https://ipv4.icanhazip.com 2>/dev/null || echo "l'IP de ce serveur").
  2. Remplir ADMIN_PASSWORD (>= 10 caractères) dans ${ENV_FILE} :
       sudoedit ${ENV_FILE}
  3. Depuis le Mac, premier déploiement :
       YP_HOST=${APP_USER}@${YP_DOMAIN} YP_DOMAIN=${YP_DOMAIN} ./scripts/deploy.sh
EOF
