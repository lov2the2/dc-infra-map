#!/usr/bin/env bash
# k8s-deploy.sh — Deploy DCIM application to local K8s (docker-desktop)
#
# Usage:
#   ./scripts/k8s-deploy.sh [--skip-migrate] [--skip-build]
#
# Flags:
#   --skip-migrate   Skip database migration job
#   --skip-build     Skip Docker image build step
#
# Prerequisites:
#   - docker-desktop K8s cluster running
#   - kubectl context set to docker-desktop

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
K8S_DIR="${PROJECT_DIR}/k8s"
CONTEXT="docker-desktop"
NAMESPACE="dcim"

SKIP_MIGRATE=false
SKIP_BUILD=false

for arg in "$@"; do
    case $arg in
        --skip-migrate) SKIP_MIGRATE=true ;;
        --skip-build)   SKIP_BUILD=true ;;
    esac
done

# Verify kubectl context
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
if [ "$CURRENT_CONTEXT" != "$CONTEXT" ]; then
    echo "==> Switching kubectl context to ${CONTEXT}..."
    kubectl config use-context "${CONTEXT}"
fi

# Build Docker image
if [ "$SKIP_BUILD" = false ]; then
    echo "==> Building Docker image..."
    bash "${SCRIPT_DIR}/k8s-build.sh"
fi

# Create namespace
echo "==> Applying namespace..."
kubectl apply -f "${K8S_DIR}/namespace.yaml"

# Deploy PostgreSQL
echo "==> Deploying PostgreSQL (TimescaleDB)..."
kubectl apply -f "${K8S_DIR}/postgres/secret.yaml"
kubectl apply -f "${K8S_DIR}/postgres/configmap.yaml"
kubectl apply -f "${K8S_DIR}/postgres/statefulset.yaml"
kubectl apply -f "${K8S_DIR}/postgres/service.yaml"

# Wait for PostgreSQL to be ready
echo "==> Waiting for PostgreSQL to be ready..."
kubectl rollout status statefulset/postgres -n "${NAMESPACE}" --timeout=120s

# Deploy application
echo "==> Deploying DCIM application..."
kubectl apply -f "${K8S_DIR}/app/secret.yaml"
kubectl apply -f "${K8S_DIR}/app/configmap.yaml"
kubectl apply -f "${K8S_DIR}/app/deployment.yaml"
kubectl apply -f "${K8S_DIR}/app/service.yaml"

# Run database migration
if [ "$SKIP_MIGRATE" = false ]; then
    echo "==> Running database migration..."
    bash "${SCRIPT_DIR}/k8s-migrate.sh"
fi

# Wait for app deployment
echo "==> Waiting for application to be ready..."
kubectl rollout status deployment/dcim-app -n "${NAMESPACE}" --timeout=120s

# Deploy Ingress (if nginx-ingress controller is installed)
if kubectl get ingressclass nginx &>/dev/null 2>&1; then
    echo "==> Deploying Ingress resource..."
    kubectl apply -f "${K8S_DIR}/app/ingress.yaml"
else
    echo "==> Skipping Ingress (nginx-ingress controller not installed)"
    echo "    Run: npm run k8s:ingress to install nginx-ingress controller"
fi

echo ""
echo "==> Deployment complete!"
echo ""
echo "    NodePort URL:  http://localhost:30300"
echo "    Ingress URL:   http://dcim.local (requires nginx-ingress + /etc/hosts entry)"
echo ""
echo "    Useful commands:"
echo "      kubectl get all -n ${NAMESPACE}"
echo "      kubectl logs -f deployment/dcim-app -n ${NAMESPACE}"
echo "      kubectl logs -f statefulset/postgres -n ${NAMESPACE}"
