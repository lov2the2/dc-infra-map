#!/usr/bin/env bash
# k8s-setup-ingress.sh — Install nginx-ingress controller on docker-desktop
#
# Run this ONCE before deploying with Ingress support:
#   ./scripts/k8s-setup-ingress.sh
#
# After setup, add to /etc/hosts:
#   127.0.0.1 dcim.local
#
# Then access the app at:
#   http://dcim.local

set -euo pipefail

INGRESS_NGINX_VERSION="v1.12.0"
INGRESS_NGINX_URL="https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-${INGRESS_NGINX_VERSION}/deploy/static/provider/cloud/deploy.yaml"

CONTEXT="docker-desktop"
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
if [ "$CURRENT_CONTEXT" != "$CONTEXT" ]; then
    echo "==> Switching kubectl context to ${CONTEXT}..."
    kubectl config use-context "${CONTEXT}"
fi

echo "==> Installing nginx-ingress controller (${INGRESS_NGINX_VERSION})..."
kubectl apply -f "${INGRESS_NGINX_URL}"

echo "==> Waiting for nginx-ingress controller to be ready (this may take 60s)..."
kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=180s

echo ""
echo "==> nginx-ingress controller is ready!"
echo ""
echo "    Add the following line to /etc/hosts (requires sudo):"
echo "    127.0.0.1 dcim.local"
echo ""
echo "    On macOS/Linux:"
echo "      sudo sh -c 'echo \"127.0.0.1 dcim.local\" >> /etc/hosts'"
echo ""
echo "    After adding the hosts entry, deploy the app:"
echo "      npm run k8s:deploy"
echo ""
echo "    Then access the app at:"
echo "      http://dcim.local         (via Ingress)"
echo "      http://localhost:30300    (via NodePort fallback)"
echo ""
