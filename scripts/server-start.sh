#!/usr/bin/env bash
# server-start.sh — Start the Next.js development server in the background

set -euo pipefail

# ── Color codes ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${SCRIPT_DIR}/.server.pid"
LOG_FILE="${SCRIPT_DIR}/.server.log"
PORT=3000

# ── Helper functions ──────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[server-start]${NC} $*"; }
warn()    { echo -e "${YELLOW}[server-start]${NC} $*"; }
error()   { echo -e "${RED}[server-start]${NC} $*" >&2; }

# Check whether the port is already occupied
port_in_use() {
    lsof -ti tcp:"${PORT}" > /dev/null 2>&1
}

# Check whether the PID stored in the PID file is still alive
pid_alive() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
}

# ── Guard: already running via PID file ──────────────────────────────────────
if [[ -f "${PID_FILE}" ]]; then
    existing_pid="$(cat "${PID_FILE}")"
    if pid_alive "${existing_pid}"; then
        warn "Development server is already running (PID ${existing_pid})."
        warn "Use 'npm run server:stop' to stop it first."
        exit 1
    else
        # Stale PID file — remove it and continue
        warn "Stale PID file found. Removing and continuing..."
        rm -f "${PID_FILE}"
    fi
fi

# ── Guard: port already in use by another process ────────────────────────────
if port_in_use; then
    occupant="$(lsof -ti tcp:"${PORT}")"
    error "Port ${PORT} is already in use by PID ${occupant}."
    error "Stop that process or use a different port before starting the server."
    exit 1
fi

# ── Start the server ─────────────────────────────────────────────────────────
info "Starting development server..."
info "Project: ${PROJECT_DIR}"
info "Log file: ${LOG_FILE}"

cd "${PROJECT_DIR}"

# Launch npm run dev in the background; redirect stdout+stderr to log file
npm run dev > "${LOG_FILE}" 2>&1 &
SERVER_PID=$!

# Persist the PID
echo "${SERVER_PID}" > "${PID_FILE}"

# ── Wait up to 15 s for the server to become ready ───────────────────────────
MAX_WAIT=15
WAITED=0
info "Waiting for server to be ready on port ${PORT}..."

while ! port_in_use; do
    if ! pid_alive "${SERVER_PID}"; then
        error "Server process (PID ${SERVER_PID}) exited unexpectedly."
        error "Check the log file for details: ${LOG_FILE}"
        rm -f "${PID_FILE}"
        exit 1
    fi

    if [[ ${WAITED} -ge ${MAX_WAIT} ]]; then
        error "Server did not become ready within ${MAX_WAIT} seconds."
        error "Check the log file for details: ${LOG_FILE}"
        rm -f "${PID_FILE}"
        kill "${SERVER_PID}" 2>/dev/null || true
        exit 1
    fi

    sleep 1
    (( WAITED++ ))
done

# ── Success ───────────────────────────────────────────────────────────────────
info "Development server is running."
info "  PID : ${SERVER_PID}"
info "  URL : http://localhost:${PORT}"
info ""
info "Logs : tail -f ${LOG_FILE}"
info "Stop : npm run server:stop"
