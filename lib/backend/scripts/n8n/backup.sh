#!/usr/bin/env bash
# Backup n8n Postgres + optional metadata. Archives under lib/backend/scripts/n8n/backups/
#
# Usage: bash lib/backend/scripts/n8n/backup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
N8N_DIR="$REPO_ROOT/lib/backend/scripts/n8n"
ENV_FILE="$N8N_DIR/.env"
BACKUP_ROOT="$N8N_DIR/backups"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$BACKUP_ROOT/$STAMP"

COMPOSE=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[backup-n8n] missing $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

mkdir -p "$DEST"

cd "$N8N_DIR"
if ! "${COMPOSE[@]}" ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "[backup-n8n] postgres container not running" >&2
  exit 1
fi

"${COMPOSE[@]}" exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl \
  | gzip -9 > "$DEST/postgres.sql.gz"

cp "$ENV_FILE" "$DEST/env.redacted"
sed 's/=.*/=***REDACTED***/' "$ENV_FILE" > "$DEST/env.redacted"

tar -czf "$BACKUP_ROOT/n8n-backup-${STAMP}.tar.gz" -C "$BACKUP_ROOT" "$STAMP"
rm -rf "$DEST"

echo "[backup-n8n] created $BACKUP_ROOT/n8n-backup-${STAMP}.tar.gz"
