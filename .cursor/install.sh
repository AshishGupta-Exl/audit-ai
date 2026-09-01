#!/usr/bin/env bash
# Idempotent dependency setup for the audit-ai monorepo.
# Safe to run repeatedly: it refreshes deps without mutating source or lockfiles.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Backend: create venv and install dependencies"
cd "$REPO_ROOT/backend"
# The default image ships Python without ensurepip, so venv creation fails
# until python3-venv is present. Install it once, only when missing.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  echo "==> Installing python3-venv (system package)"
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3-venv
fi
if [ ! -x ".venv/bin/python" ]; then
  python3 -m venv .venv
fi
.venv/bin/pip install --upgrade pip --quiet
.venv/bin/pip install -r requirements-dev.txt --quiet

echo "==> Frontend: install dependencies"
cd "$REPO_ROOT/frontend"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Install complete"
