#!/usr/bin/env bash
# Cloud Agent bootstrap for hercule.dev.
# Idempotent: safe to re-run against cached or partially prepared state.
set -euo pipefail

# Resolve repo root (parent of the .cursor directory holding this script).
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. Node dependencies (Next.js app + tsx scripts). pnpm is provided via corepack.
corepack pnpm install --frozen-lockfile

# 2. Python virtualenv for the Streamlit operator tools under lib/backend/streamlit_*.
#    The default image ships python3 without the venv module, so ensure it once.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3-venv
fi

python3 -m venv .venv
.venv/bin/pip install --upgrade pip >/dev/null
.venv/bin/pip install -r lib/backend/requirements-outreach.txt
