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

echo "==> Building Docker image: ${IMAGE_NAME}:${TAG}"
echo "    Context: ${PROJECT_DIR}"
echo ""

docker build \
    --tag "${IMAGE_NAME}:${TAG}" \
    --file "${PROJECT_DIR}/Dockerfile" \
    "${PROJECT_DIR}"

echo ""
echo "==> Build complete: ${IMAGE_NAME}:${TAG}"
echo "    Image is available in docker-desktop K8s cluster"
echo ""
echo "Next: ./scripts/k8s-deploy.sh"
