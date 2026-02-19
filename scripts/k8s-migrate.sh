#!/usr/bin/env bash
# k8s-migrate.sh — Run database migration Job in K8s
#
# Usage:
#   ./scripts/k8s-migrate.sh
#
# Creates a timestamped migration Job to avoid name conflicts.
# The Job is automatically cleaned up after 5 minutes (ttlSecondsAfterFinished=300).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
K8S_DIR="${PROJECT_DIR}/k8s"
NAMESPACE="dcim"
TIMESTAMP=$(date +%s)
JOB_NAME="dcim-db-migrate-${TIMESTAMP}"

echo "==> Creating migration job: ${JOB_NAME}"

# Apply migration job with a unique name derived from the template
kubectl create job "${JOB_NAME}" \
    --from=job/dcim-db-migrate \
    -n "${NAMESPACE}" 2>/dev/null || {
    # First run: apply the base job from YAML then create from it
    echo "    (First run: applying base job template...)"
    kubectl apply -f "${K8S_DIR}/app/migration-job.yaml" -n "${NAMESPACE}"
    # Delete it immediately, we'll run via create from template pattern
    kubectl delete job dcim-db-migrate -n "${NAMESPACE}" --ignore-not-found=true

    # Re-apply template and create timestamped copy
    kubectl apply -f "${K8S_DIR}/app/migration-job.yaml" -n "${NAMESPACE}"
    kubectl wait --for=condition=complete job/dcim-db-migrate \
        -n "${NAMESPACE}" --timeout=120s
    echo "==> Migration job complete"
    exit 0
}

echo "==> Waiting for migration job to complete..."
kubectl wait --for=condition=complete "job/${JOB_NAME}" \
    -n "${NAMESPACE}" --timeout=120s

echo ""
echo "==> Migration logs:"
kubectl logs "job/${JOB_NAME}" -n "${NAMESPACE}" || true

echo ""
echo "==> Migration complete"
