#!/usr/bin/env bash
# server-stop.sh — Stop the Next.js development server and Docker Postgres

set -euo pipefail

# ── Color codes ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="${SCRIPT_DIR}/.server.pid"
PORT=3000

# ── Docker config ─────────────────────────────────────────────────────────────
CONTAINER_NAME="dcim-postgres"

# ── Helper functions ──────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[server-stop]${NC} $*"; }
warn()    { echo -e "${YELLOW}[server-stop]${NC} $*"; }
error()   { echo -e "${RED}[server-stop]${NC} $*" >&2; }

pid_alive() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
}

terminate_pid() {
    local pid="$1"
    local label="${2:-process}"

    info "Sending SIGTERM to ${label} (PID ${pid})..."
    kill -TERM "${pid}" 2>/dev/null || true

    local waited=0
    while pid_alive "${pid}"; do
        if [[ ${waited} -ge 5 ]]; then
            warn "${label} did not exit after 5 s — sending SIGKILL..."
            kill -KILL "${pid}" 2>/dev/null || true
            break
        fi
        sleep 1
        (( waited++ ))
    done

    if pid_alive "${pid}"; then
        error "Failed to stop ${label} (PID ${pid})."
        return 1
    fi

    info "${label} (PID ${pid}) stopped."
}

# ── Stop Next.js ──────────────────────────────────────────────────────────────
if [[ -f "${PID_FILE}" ]]; then
    stored_pid="$(cat "${PID_FILE}")"

    if pid_alive "${stored_pid}"; then
        terminate_pid "${stored_pid}" "development server"
        rm -f "${PID_FILE}"
        info "PID file removed."
    else
        warn "PID file exists but process ${stored_pid} is no longer running."
        warn "Cleaning up stale PID file..."
        rm -f "${PID_FILE}"
    fi
else
    port_pids="$(lsof -ti tcp:"${PORT}" 2>/dev/null || true)"

    if [[ -n "${port_pids}" ]]; then
        info "No PID file found. Stopping process(es) on port ${PORT}..."
        all_stopped=true
        while IFS= read -r pid; do
            [[ -z "${pid}" ]] && continue
            terminate_pid "${pid}" "port-${PORT} process" || all_stopped=false
        done <<< "${port_pids}"
        ${all_stopped} || { error "One or more processes could not be stopped."; exit 1; }
    else
        warn "No Next.js process found on port ${PORT}."
    fi
fi

# ── Stop Docker Postgres ──────────────────────────────────────────────────────
if docker ps --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "Stopping Postgres container (${CONTAINER_NAME})..."
    docker stop "${CONTAINER_NAME}" > /dev/null
    info "Postgres container stopped. (data preserved in volume)"
elif docker ps -a --filter "name=^${CONTAINER_NAME}$" --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
    info "Postgres container is already stopped."
else
    warn "Postgres container (${CONTAINER_NAME}) not found — skipping."
fi

info "Done."
