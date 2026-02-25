#!/usr/bin/env bash
# k8s-build.sh — Build Docker image for local K8s (docker-desktop)
#
# Usage:
#   ./scripts/k8s-build.sh [TAG]
#
# Defaults:
#   TAG = latest
#
# Since docker-desktop shares the Docker daemon, images built here are
# immediately available inside the K8s cluster without a registry push.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE_NAME="dc-infra-map"
TAG="${1:-latest}"

# --- Validate corporate CA certificate ---
if [ ! -f "${PROJECT_DIR}/corporate-ca.pem" ]; then
    echo "ERROR: corporate-ca.pem not found in project root."
    echo "       Export corporate CA certs first:"
    echo "       security find-certificate -a -p /Library/Keychains/System.keychain > corporate-ca.pem"
    exit 1
fi
if [ ! -f "${PROJECT_DIR}/go-services/corporate-ca.pem" ]; then
    echo "ERROR: go-services/corporate-ca.pem not found."
    echo "       Copy from project root:"
    echo "       cp corporate-ca.pem go-services/corporate-ca.pem"
    exit 1
fi

echo "==> Building Docker image: ${IMAGE_NAME}:${TAG}"
echo "    Context: ${PROJECT_DIR}"
echo ""

docker build \
    --target runner \
    --tag "${IMAGE_NAME}:${TAG}" \
    --file "${PROJECT_DIR}/Dockerfile" \
    "${PROJECT_DIR}"

docker build \
    --target migrator \
    --tag "${IMAGE_NAME}:migrate" \
    --file "${PROJECT_DIR}/Dockerfile" \
    "${PROJECT_DIR}"

echo ""
echo "==> Building Go services from monorepo: go-services/"

echo "    Power Service: dc-infra-map-go:${TAG}"
docker build \
    --build-arg SERVICE=power-service \
    --tag "dc-infra-map-go:${TAG}" \
    --file "${PROJECT_DIR}/go-services/Dockerfile" \
    "${PROJECT_DIR}/go-services"

echo "    Core API: dc-infra-map-core:${TAG}"
docker build \
    --build-arg SERVICE=core-api \
    --tag "dc-infra-map-core:${TAG}" \
    --file "${PROJECT_DIR}/go-services/Dockerfile" \
    "${PROJECT_DIR}/go-services"

echo "    Network Ops: dc-infra-map-netops:${TAG}"
docker build \
    --build-arg SERVICE=network-ops \
    --tag "dc-infra-map-netops:${TAG}" \
    --file "${PROJECT_DIR}/go-services/Dockerfile" \
    "${PROJECT_DIR}/go-services"

echo ""
echo "==> Build complete:"
echo "    ${IMAGE_NAME}:${TAG}"
echo "    ${IMAGE_NAME}:migrate"
echo "    dc-infra-map-go:${TAG}     (Power Service)"
echo "    dc-infra-map-core:${TAG}   (Core API)"
echo "    dc-infra-map-netops:${TAG} (Network Ops)"
echo "    Images are available in docker-desktop K8s cluster"
echo ""
echo "Next: npm run helm:install:dev"
