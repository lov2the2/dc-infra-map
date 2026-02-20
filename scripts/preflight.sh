#!/bin/bash
# scripts/preflight.sh
# Pre-session environment verification script
#
# Usage:
#   bash scripts/preflight.sh            # Full check (default)
#   bash scripts/preflight.sh --no-db   # Skip PostgreSQL check
#   bash scripts/preflight.sh --k8s     # Include kubectl cluster check
#
# Each failed check prints an exact fix command. No auto-fixes are applied.

set -uo pipefail

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
NO_DB=false
K8S=false

for arg in "$@"; do
    case "$arg" in
        --no-db) NO_DB=true ;;
        --k8s)   K8S=true ;;
        *)       echo "Unknown flag: $arg (supported: --no-db, --k8s)"; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Counters and helper functions
# ---------------------------------------------------------------------------
PASS=0
FAIL=0

pass() {
    echo "  ✅ $1"
    PASS=$((PASS + 1))
}

fail() {
    echo "  ❌ $1"
    echo "     Fix: $2"
    FAIL=$((FAIL + 1))
}

skip() {
    echo "  ⏭️  $1"
}

# ---------------------------------------------------------------------------
# Check 1: node_modules
# ---------------------------------------------------------------------------
echo "=== DCIM Preflight Check ==="
echo ""
echo "[1/6] node_modules"
if [ -d "node_modules" ]; then
    pass "node_modules exists"
else
    fail "node_modules missing" "npm install"
fi

# ---------------------------------------------------------------------------
# Check 2: .env file
# ---------------------------------------------------------------------------
echo "[2/6] .env file"
if [ -f ".env" ]; then
    pass ".env exists"
else
    fail ".env missing" "cp .env.example .env  (then fill in required values)"
fi

# ---------------------------------------------------------------------------
# Check 3: Port 3000 status (managed vs stale)
# ---------------------------------------------------------------------------
echo "[3/6] Port 3000"
if command -v lsof &>/dev/null; then
    PORT_PID=$(lsof -ti:3000 2>/dev/null | head -1 || true)
    if [ -z "$PORT_PID" ]; then
        pass "Port 3000 is free"
    else
        SERVER_PID_FILE="scripts/.server.pid"
        if [ -f "$SERVER_PID_FILE" ]; then
            MANAGED_PID=$(cat "$SERVER_PID_FILE" 2>/dev/null || echo "")
            if [ "$PORT_PID" = "$MANAGED_PID" ]; then
                pass "Port 3000 in use by managed dev server (PID $PORT_PID)"
            else
                fail "Port 3000 stale occupation (PID $PORT_PID, not our managed server)" \
                     "kill $PORT_PID   # or: npm run server:stop"
            fi
        else
            fail "Port 3000 occupied by unknown process (PID $PORT_PID)" \
                 "kill $PORT_PID   # or: lsof -i:3000 to inspect first"
        fi
    fi
else
    fail "lsof command not found (cannot check port 3000)" "brew install lsof"
fi

# ---------------------------------------------------------------------------
# Check 4: Docker daemon
# ---------------------------------------------------------------------------
echo "[4/6] Docker daemon"
if docker info &>/dev/null 2>&1; then
    pass "Docker daemon is running"
else
    fail "Docker daemon not running" "open -a Docker   # then wait ~30 seconds"
fi

# ---------------------------------------------------------------------------
# Check 5: PostgreSQL (skipped with --no-db)
# ---------------------------------------------------------------------------
echo "[5/6] PostgreSQL"
if [ "$NO_DB" = true ]; then
    skip "Skipped (--no-db flag)"
else
    DB_HOST="${PGHOST:-localhost}"
    DB_PORT="${PGPORT:-5432}"
    if command -v pg_isready &>/dev/null; then
        if pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; then
            pass "PostgreSQL ready at ${DB_HOST}:${DB_PORT}"
        else
            fail "PostgreSQL not ready at ${DB_HOST}:${DB_PORT}" \
                 "docker compose up -d postgres   # or start your DB service"
        fi
    else
        # Fallback: TCP port check if pg_isready is not installed
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            pass "PostgreSQL port ${DB_HOST}:${DB_PORT} reachable (pg_isready not installed)"
        else
            fail "PostgreSQL port ${DB_HOST}:${DB_PORT} not reachable" \
                 "docker compose up -d postgres   # Install pg_isready: brew install libpq"
        fi
    fi
fi

# ---------------------------------------------------------------------------
# Check 6: kubectl cluster (only with --k8s)
# ---------------------------------------------------------------------------
echo "[6/6] kubectl cluster"
if [ "$K8S" = true ]; then
    if kubectl cluster-info --request-timeout=5s &>/dev/null 2>&1; then
        pass "kubectl cluster reachable"
    else
        fail "kubectl cannot reach cluster" \
             "kubectl config current-context   # Ensure docker-desktop context is active"
    fi
else
    skip "Skipped (use --k8s flag to enable)"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo "================================"
echo "Results: ✅ $PASS passed, ❌ $FAIL failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo "⚠️  Fix the failed checks above before starting your session."
    exit 1
else
    echo "✅ All checks passed. Environment is ready."
    exit 0
fi
