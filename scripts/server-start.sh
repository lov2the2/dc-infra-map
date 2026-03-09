#!/usr/bin/env bash
# server-start.sh — Start Docker Postgres + Next.js development server

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

# ── Docker Postgres config ────────────────────────────────────────────────────
CONTAINER_NAME="dcim-postgres"
POSTGRES_IMAGE="timescale/timescaledb:latest-pg16"
POSTGRES_USER="dcim"
POSTGRES_PASSWORD="dcim_local_password"
POSTGRES_DB="dcim"
POSTGRES_PORT=5432
VOLUME_NAME="dcim-postgres-data"

# ── Helper functions ──────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[server-start]${NC} $*"; }
warn()    { echo -e "${YELLOW}[server-start]${NC} $*"; }
error()   { echo -e "${RED}[server-start]${NC} $*" >&2; }

port_in_use() {
    lsof -ti tcp:"${PORT}" > /dev/null 2>&1
}

pid_alive() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
}

# ── Ensure .env.local exists ─────────────────────────────────────────────────
if [[ ! -f "${PROJECT_DIR}/.env.local" ]]; then
    warn ".env.local not found — copying from .env.example"
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env.local"
    info ".env.local created. Edit it if you need custom settings."
fi

# ── Ensure Colima is running ──────────────────────────────────────────────────
if command -v colima &> /dev/null; then
    if ! colima status 2>/dev/null | grep -qi "running"; then
        info "Colima is not running — starting Colima..."
        colima start
    else
        info "Colima is already running."
    fi
fi

# ── Start Docker Postgres ─────────────────────────────────────────────────────
info "Checking Docker Postgres container (${CONTAINER_NAME})..."

if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH."
    exit 1
fi

if docker ps --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "Postgres container is already running."
elif docker ps -a --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "Starting existing Postgres container..."
    docker start "${CONTAINER_NAME}" > /dev/null
else
    info "Creating Postgres container..."
    docker run -d \
        --name "${CONTAINER_NAME}" \
        -e POSTGRES_USER="${POSTGRES_USER}" \
        -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
        -e POSTGRES_DB="${POSTGRES_DB}" \
        -p "${POSTGRES_PORT}:5432" \
        -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
        "${POSTGRES_IMAGE}" > /dev/null
    info "Postgres container created."
fi

# ── Wait for Postgres to be ready ────────────────────────────────────────────
info "Waiting for Postgres to be ready..."
MAX_PG_WAIT=30
PG_WAITED=0

until docker exec "${CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" > /dev/null 2>&1; do
    if [[ ${PG_WAITED} -ge ${MAX_PG_WAIT} ]]; then
        error "Postgres did not become ready within ${MAX_PG_WAIT} seconds."
        exit 1
    fi
    sleep 1
    (( PG_WAITED++ ))
done

info "Postgres is ready. (waited ${PG_WAITED}s)"

# ── Guard: Next.js already running ───────────────────────────────────────────
if [[ -f "${PID_FILE}" ]]; then
    existing_pid="$(cat "${PID_FILE}")"
    if pid_alive "${existing_pid}"; then
        warn "Development server is already running (PID ${existing_pid})."
        warn "Use 'npm run server:stop' to stop it first."
        exit 1
    else
        warn "Stale PID file found. Removing and continuing..."
        rm -f "${PID_FILE}"
    fi
fi

if port_in_use; then
    occupant="$(lsof -ti tcp:"${PORT}")"
    error "Port ${PORT} is already in use by PID ${occupant}."
    exit 1
fi

# ── Start Next.js ─────────────────────────────────────────────────────────────
info "Starting development server..."
info "Project: ${PROJECT_DIR}"
info "Log file: ${LOG_FILE}"

cd "${PROJECT_DIR}"

npm run dev > "${LOG_FILE}" 2>&1 &
SERVER_PID=$!
echo "${SERVER_PID}" > "${PID_FILE}"

# ── Wait up to 15s for Next.js to be ready ───────────────────────────────────
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
info "  PID      : ${SERVER_PID}"
info "  URL      : http://localhost:${PORT}"
info "  Postgres : ${CONTAINER_NAME} (localhost:${POSTGRES_PORT})"
info ""
info "Logs : tail -f ${LOG_FILE}"
info "Stop : npm run server:stop"
