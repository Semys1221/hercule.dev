#!/usr/bin/env bash
# Start n8n Community + Postgres on this machine (Docker Desktop).
# Usage: bash lib/backend/scripts/n8n/install-local.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
N8N_DIR="$REPO_ROOT/lib/backend/scripts/n8n"
ENV_FILE="$N8N_DIR/.env"
EXAMPLE="$N8N_DIR/.env.example"

rand_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    head -c 32 /dev/urandom | xxd -p -c 64
  fi
}

rand_pass() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 24 | tr -d '/+=' | head -c 24
  else
    head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 24
  fi
}

echo "[install-n8n-local] dir=$N8N_DIR"

if ! command -v docker >/dev/null 2>&1; then
  DOCKER_BIN="/Applications/Docker.app/Contents/Resources/bin/docker"
  if [ -x "$DOCKER_BIN" ]; then
    export PATH="$(dirname "$DOCKER_BIN"):$PATH"
  fi
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "[install-n8n-local] Docker not found. Install Docker Desktop first." >&2
  exit 1
fi

COMPOSE=(docker compose)
if ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
  else
    echo "[install-n8n-local] docker compose plugin missing" >&2
    exit 1
  fi
fi

if [ ! -f "$ENV_FILE" ]; then
  if [ ! -f "$EXAMPLE" ]; then
    echo "[install-n8n-local] missing $EXAMPLE" >&2
    exit 1
  fi
  cp "$EXAMPLE" "$ENV_FILE"
  PG_PASS="$(rand_pass)"
  BASIC_PASS="$(rand_pass)"
  ENC_KEY="$(rand_hex)"
  if [[ "$OSTYPE" == darwin* ]]; then
    sed -i '' "s/change-me-postgres/${PG_PASS}/" "$ENV_FILE"
    sed -i '' "s/change-me-64-hex-chars/${ENC_KEY}/" "$ENV_FILE"
    sed -i '' "s/change-me-basic-auth/${BASIC_PASS}/" "$ENV_FILE"
  else
    sed -i "s/change-me-postgres/${PG_PASS}/" "$ENV_FILE"
    sed -i "s/change-me-64-hex-chars/${ENC_KEY}/" "$ENV_FILE"
    sed -i "s/change-me-basic-auth/${BASIC_PASS}/" "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE"
  echo "[install-n8n-local] created $ENV_FILE with generated secrets"
  echo "[install-n8n-local] HTTP Basic Auth user: admin  password: (see .env N8N_BASIC_AUTH_PASSWORD)"
else
  echo "[install-n8n-local] reusing existing $ENV_FILE"
fi

cd "$N8N_DIR"
"${COMPOSE[@]}" up -d

echo "[install-n8n-local] waiting for n8n health..."
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:5678/healthz" 2>/dev/null; then
    echo "[install-n8n-local] n8n healthy"
    echo ""
    echo "  open http://127.0.0.1:5678"
    echo "  Basic auth: grep N8N_BASIC_AUTH $ENV_FILE"
    exit 0
  fi
  sleep 2
done

echo "[install-n8n-local] WARN: health check timed out — run: cd $N8N_DIR && docker compose logs n8n" >&2
exit 1
