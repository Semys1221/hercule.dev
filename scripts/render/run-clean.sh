#!/usr/bin/env bash
# Run MyEmailVerifier clean pipeline headlessly (Render / local parity).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
# shellcheck source=/dev/null
if [ -z "${RENDER:-}" ] && [ -f "$ROOT/.env" ]; then
  source "$ROOT/scripts/render/load-render-env.sh"
fi
export PYTHONPATH="${PYTHONPATH:-$ROOT}"
export HERCULE_DATA_ROOT="${HERCULE_DATA_ROOT:-/var/data}"

cd "$ROOT/app/streamlit_clean"

LIST_ID="${CLEAN_LIST_ID:?CLEAN_LIST_ID is required}"
MODE="${CLEAN_MODE:-test_50}"

args=(run --list-id "$LIST_ID" --mode "$MODE")
if [ -n "${CLEAN_CAMPAIGN_ID:-}" ]; then
  args+=(--campaign-id "$CLEAN_CAMPAIGN_ID")
fi
if [ "${CLEAN_SKIP_PUSH:-0}" = "1" ]; then
  args+=(--skip-push)
fi
if [ -n "${CLEAN_RESUME_PREFIX:-}" ]; then
  args+=(--resume-prefix "$CLEAN_RESUME_PREFIX")
fi
if [ -n "${CLEAN_ALLOWED_STATUSES:-}" ]; then
  args+=(--allowed-statuses "$CLEAN_ALLOWED_STATUSES")
fi

echo "[run-clean] list=$LIST_ID mode=$MODE data_root=$HERCULE_DATA_ROOT"
python cli.py "${args[@]}"
