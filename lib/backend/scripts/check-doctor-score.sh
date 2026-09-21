#!/usr/bin/env bash
# Fail when react-doctor health score drops below REACT_DOCTOR_MIN_SCORE.
# Baseline 49 (2026-03) — ratchet toward 85 as issues are fixed.
set -euo pipefail

MIN_SCORE="${REACT_DOCTOR_MIN_SCORE:-49}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAW="$(npx react-doctor@latest --score -y 2>&1)"
SCORE="$(echo "$RAW" | tail -n1 | tr -d '[:space:]')"

if ! [[ "$SCORE" =~ ^[0-9]+$ ]]; then
  echo "react-doctor: could not parse score from output:"
  echo "$RAW"
  exit 1
fi

echo "react-doctor score: $SCORE (minimum: $MIN_SCORE)"

if (( SCORE < MIN_SCORE )); then
  echo "Score $SCORE is below minimum $MIN_SCORE — run pnpm doctor for details."
  exit 1
fi
