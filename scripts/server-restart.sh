#!/usr/bin/env bash
# server-restart.sh — Restart Docker Postgres + Next.js development server

set -euo pipefail

# ── Color codes ─────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Helper function ───────────────────────────────────────────────────────────
info() { echo -e "${GREEN}[server-restart]${NC} $*"; }

# ── Stop ──────────────────────────────────────────────────────────────────────
info "Stopping server and database..."
bash "${SCRIPT_DIR}/server-stop.sh"

# ── Brief pause ───────────────────────────────────────────────────────────────
info "Waiting 1 second before restarting..."
sleep 1

# ── Start ─────────────────────────────────────────────────────────────────────
info "Starting server and database..."
bash "${SCRIPT_DIR}/server-start.sh"
