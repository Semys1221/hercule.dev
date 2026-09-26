#!/usr/bin/env bash
# Export all n8n workflows to lib/backend/n8n/workflows/ (JSON).
#
# Usage: bash lib/backend/scripts/n8n/export-workflows.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
N8N_DIR="$REPO_ROOT/lib/backend/scripts/n8n"
OUT_DIR="$REPO_ROOT/lib/backend/n8n/workflows"
ENV_FILE="$N8N_DIR/.env"
CONTAINER_EXPORT="/tmp/n8n-workflow-export"

COMPOSE=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "[export-workflows] missing $ENV_FILE — run install-local.sh first" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

cd "$N8N_DIR"
if ! "${COMPOSE[@]}" ps --status running n8n 2>/dev/null | grep -q n8n; then
  echo "[export-workflows] n8n container not running" >&2
  exit 1
fi

"${COMPOSE[@]}" exec -T n8n sh -c "rm -rf ${CONTAINER_EXPORT} && mkdir -p ${CONTAINER_EXPORT} && n8n export:workflow --all --output=${CONTAINER_EXPORT}/"

TMP="$(mktemp -d)"
docker cp "hercule-n8n:${CONTAINER_EXPORT}/." "$TMP/"
"${COMPOSE[@]}" exec -T n8n rm -rf "${CONTAINER_EXPORT}" 2>/dev/null || true

shopt -s nullglob
files=("$TMP"/*.json)
if [ "${#files[@]}" -eq 0 ]; then
  rm -rf "$TMP"
  echo "[export-workflows] no workflows exported (empty instance?). Create a workflow in the UI and retry." >&2
  exit 1
fi

for f in "${files[@]}"; do
  cp "$f" "$OUT_DIR/$(basename "$f")"
done
rm -rf "$TMP"

echo "[export-workflows] wrote ${#files[@]} file(s) under $OUT_DIR"
