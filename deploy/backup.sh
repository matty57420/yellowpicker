#!/usr/bin/env bash
#
# Sauvegarde le seul état non reproductible du système : la base SQLite et les
# photos. Joué chaque jour par yellowpicker-backup.timer.
#
# La base tourne en WAL (cf. server/src/db.ts) : copier le fichier .db à chaud
# donnerait une sauvegarde potentiellement corrompue. `.backup` de sqlite3 est
# cohérent même pendant une écriture concurrente.

set -euo pipefail

DATA_DIR=${DATA_DIR:-/srv/yellowpicker/server/data}
BACKUP_DIR=${BACKUP_DIR:-/srv/yellowpicker/backups}
KEEP_DAYS=${KEEP_DAYS:-7}

stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$BACKUP_DIR"

db="${DATA_DIR}/yellowpicker.db"
if [[ ! -f $db ]]; then
	echo "Pas de base à ${db} — rien à sauvegarder." >&2
	exit 0
fi

dest="${BACKUP_DIR}/yellowpicker-${stamp}.db"
sqlite3 "$db" ".backup '${dest}'"

# Une sauvegarde non vérifiée n'est pas une sauvegarde.
if [[ $(sqlite3 "$dest" 'PRAGMA integrity_check;') != "ok" ]]; then
	echo "Sauvegarde ${dest} corrompue, abandon." >&2
	rm -f "$dest"
	exit 1
fi

if [[ -d ${DATA_DIR}/uploads ]]; then
	tar -czf "${BACKUP_DIR}/uploads-${stamp}.tar.gz" -C "$DATA_DIR" uploads
fi

find "$BACKUP_DIR" -maxdepth 1 -type f -mtime "+${KEEP_DAYS}" -delete

echo "Sauvegarde OK : ${dest} ($(du -h "$dest" | cut -f1))"
