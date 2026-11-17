#!/usr/bin/env bash
#
# Déploie Yellow Picker sur le VPS : git pull, build, redémarrage, smoke test.
# Le provisioning (deploy/bootstrap.sh) doit avoir été joué une fois avant.
#
#   YP_HOST=yellowpicker@picker.exemple.fr YP_DOMAIN=picker.exemple.fr ./scripts/deploy.sh
#
# Variables : YP_HOST (cible SSH), YP_DOMAIN (domaine public),
#             YP_REF (ref git à déployer, défaut origin/main).

set -euo pipefail

: "${YP_HOST:?YP_HOST manquant (ex. YP_HOST=yellowpicker@picker.exemple.fr)}"
: "${YP_DOMAIN:?YP_DOMAIN manquant (ex. YP_DOMAIN=picker.exemple.fr)}"
YP_REF=${YP_REF:-origin/main}

echo "==> Déploiement de ${YP_REF} sur ${YP_HOST}"

ssh "$YP_HOST" "YP_REF='${YP_REF}' bash -euo pipefail -s" <<'REMOTE'
cd /srv/yellowpicker
git fetch --prune origin
# reset --hard et pas merge : le serveur n'est pas un espace de travail, son
# état doit refléter exactement la ref déployée.
git reset --hard "$YP_REF"
echo "==> $(git log -1 --format='%h %s')"
npm ci                   # devDeps incluses : vite et tsc sont nécessaires au build
npm run build            # client/dist puis server/dist
sudo /usr/bin/systemctl restart yellowpicker
REMOTE

# Un déploiement n'est terminé que s'il répond : sans ça, un déploiement cassé
# passerait pour un succès.
echo "==> Smoke test https://${YP_DOMAIN}"
for attempt in $(seq 1 10); do
	if curl -fsS --max-time 5 "https://${YP_DOMAIN}/api/characters" >/dev/null; then
		echo "déployé — https://${YP_DOMAIN}"
		exit 0
	fi
	echo "   pas encore prêt (${attempt}/10)…"
	sleep 2
done

echo "ÉCHEC : l'application ne répond pas sur https://${YP_DOMAIN}" >&2
echo "Diagnostic : ssh ${YP_HOST} 'sudo systemctl status yellowpicker; journalctl -u yellowpicker -n 50'" >&2
exit 1
