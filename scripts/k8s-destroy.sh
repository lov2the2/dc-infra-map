#!/usr/bin/env bash
# k8s-destroy.sh — Remove DCIM application from local K8s
#
# Usage:
#   ./scripts/k8s-destroy.sh [--all]
#
# Flags:
#   --all    Also delete the namespace and PersistentVolumeClaims (data loss!)
#
# Without --all: removes deployments, services, jobs but keeps PVCs (data safe).

set -euo pipefail

NAMESPACE="dcim"
DELETE_ALL=false

for arg in "$@"; do
    case $arg in
        --all) DELETE_ALL=true ;;
    esac
done

echo "==> Removing DCIM application from K8s (namespace: ${NAMESPACE})"

if [ "$DELETE_ALL" = true ]; then
    echo "    WARNING: --all flag deletes the entire namespace including PVC data!"
    read -r -p "    Are you sure? [y/N] " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "    Aborted."
        exit 0
    fi
    kubectl delete namespace "${NAMESPACE}" --ignore-not-found=true
    echo "==> Namespace '${NAMESPACE}' deleted (including all data)"
else
    # Remove app resources (keep PVCs for data safety)
    kubectl delete deployment dcim-app -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete service dcim-app -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete configmap app-config -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete secret app-secret -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete jobs -l app=dcim-migrate -n "${NAMESPACE}" --ignore-not-found=true

    # Remove postgres resources (keep PVC)
    kubectl delete statefulset postgres -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete service postgres -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete configmap postgres-init-scripts -n "${NAMESPACE}" --ignore-not-found=true
    kubectl delete secret postgres-secret -n "${NAMESPACE}" --ignore-not-found=true

    echo "==> Resources removed. PVCs preserved (data safe)."
    echo "    To also delete data: ./scripts/k8s-destroy.sh --all"
fi
