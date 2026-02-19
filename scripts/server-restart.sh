#!/usr/bin/env bash
# server-restart.sh — Restart the Next.js development server

set -euo pipefail

# ── Color codes ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Helper function ───────────────────────────────────────────────────────────
info() { echo -e "${GREEN}[server-restart]${NC} $*"; }

# ── Stop ──────────────────────────────────────────────────────────────────────
info "Stopping development server..."
bash "${SCRIPT_DIR}/server-stop.sh"

# ── Brief pause to let OS release the port ───────────────────────────────────
info "Waiting 1 second before restarting..."
sleep 1

# ── Start ─────────────────────────────────────────────────────────────────────
info "Starting development server..."
bash "${SCRIPT_DIR}/server-start.sh"
