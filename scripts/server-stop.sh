#!/usr/bin/env bash
# server-stop.sh — Stop the Next.js development server

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

# ── Helper functions ──────────────────────────────────────────────────────────
info()    { echo -e "${GREEN}[server-stop]${NC} $*"; }
warn()    { echo -e "${YELLOW}[server-stop]${NC} $*"; }
error()   { echo -e "${RED}[server-stop]${NC} $*" >&2; }

# Check whether a process ID is alive
pid_alive() {
    local pid="$1"
    kill -0 "${pid}" 2>/dev/null
}

# Gracefully terminate a PID, then force-kill if still running after timeout
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

# ── Strategy 1: use PID file ──────────────────────────────────────────────────
if [[ -f "${PID_FILE}" ]]; then
    stored_pid="$(cat "${PID_FILE}")"

    if pid_alive "${stored_pid}"; then
        terminate_pid "${stored_pid}" "development server"
        rm -f "${PID_FILE}"
        info "PID file removed."
        exit 0
    else
        warn "PID file exists but process ${stored_pid} is no longer running."
        warn "Cleaning up stale PID file..."
        rm -f "${PID_FILE}"
    fi
fi

# ── Strategy 2: find process by port ─────────────────────────────────────────
port_pids="$(lsof -ti tcp:"${PORT}" 2>/dev/null || true)"

if [[ -z "${port_pids}" ]]; then
    warn "No process found on port ${PORT}. Server may already be stopped."
    exit 0
fi

info "No PID file found. Stopping process(es) on port ${PORT}..."

all_stopped=true
while IFS= read -r pid; do
    [[ -z "${pid}" ]] && continue
    terminate_pid "${pid}" "port-${PORT} process" || all_stopped=false
done <<< "${port_pids}"

if ${all_stopped}; then
    info "All processes on port ${PORT} have been stopped."
else
    error "One or more processes could not be stopped."
    exit 1
fi
