#!/usr/bin/env bash
# k8s-forward.sh — Port-forward all three Go microservices for local Next.js dev
#
# Usage: npm run k8s:forward
#
# Forwards:
#   Power Service  → localhost:8080
#   Core API       → localhost:8081
#   Network Ops    → localhost:8082
#
# Press Ctrl+C to stop all port-forwards.

set -e

NAMESPACE="dcim"

echo "Starting port-forwards for Go microservices (namespace: $NAMESPACE)..."
echo "  Power Service  → localhost:8080"
echo "  Core API       → localhost:8081"
echo "  Network Ops    → localhost:8082"
echo ""
echo "Press Ctrl+C to stop all port-forwards."
echo ""

# Cleanup function: kill all background port-forward processes on exit
cleanup() {
    echo ""
    echo "Stopping port-forwards..."
    kill "$PID_POWER" "$PID_CORE" "$PID_NETOPS" 2>/dev/null || true
    wait "$PID_POWER" "$PID_CORE" "$PID_NETOPS" 2>/dev/null || true
    echo "Done."
}
trap cleanup EXIT INT TERM

kubectl port-forward "svc/dcim-go-service"    8080:8080 -n "$NAMESPACE" &
PID_POWER=$!

kubectl port-forward "svc/dcim-core-api"      8081:8081 -n "$NAMESPACE" &
PID_CORE=$!

kubectl port-forward "svc/dcim-network-ops"   8082:8082 -n "$NAMESPACE" &
PID_NETOPS=$!

# Wait for any child process to exit (e.g., if a service is unavailable)
wait
