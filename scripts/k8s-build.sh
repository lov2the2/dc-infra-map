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
if [ ! -f "${PROJECT_DIR}/go-service/corporate-ca.pem" ]; then
    echo "ERROR: go-service/corporate-ca.pem not found."
    echo "       Copy from project root:"
    echo "       cp corporate-ca.pem go-service/corporate-ca.pem"
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
echo "==> Building Go service Docker image: dc-infra-map-go:${TAG}"
docker build \
    --tag "dc-infra-map-go:${TAG}" \
    --file "${PROJECT_DIR}/go-service/Dockerfile" \
    "${PROJECT_DIR}/go-service"

echo ""
echo "==> Build complete:"
echo "    ${IMAGE_NAME}:${TAG}"
echo "    ${IMAGE_NAME}:migrate"
echo "    dc-infra-map-go:${TAG}"
echo "    Images are available in docker-desktop K8s cluster"
echo ""
echo "Next: ./scripts/k8s-deploy.sh"
