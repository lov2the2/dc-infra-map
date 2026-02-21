#!/usr/bin/env bash
# k8s-start.sh — Full K8s environment setup and deployment
#
# Usage:
#   ./scripts/k8s-start.sh [OPTIONS]
#
# Options:
#   --skip-ingress   Skip nginx-ingress controller installation
#   --skip-build     Skip Docker image build
#   --skip-migrate   Skip database migration job
#   --hosts          Auto-add dcim.local to /etc/hosts (requires sudo)
#
# What this script does:
#   1. Verify prerequisites (Docker, kubectl, docker-desktop context)
#   2. Install nginx-ingress controller (if not already installed)
#   3. Build Docker image
#   4. Deploy PostgreSQL + DCIM app to K8s
#   5. Run database migration
#   6. Print access URLs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONTEXT="docker-desktop"
NAMESPACE="dcim"
HOSTS_ENTRY="127.0.0.1 dcim.local"
HOSTS_FILE="/etc/hosts"

# --- Parse flags ---
SKIP_INGRESS=false
SKIP_BUILD=false
SKIP_MIGRATE=false
ADD_HOSTS=false

for arg in "$@"; do
    case $arg in
        --skip-ingress) SKIP_INGRESS=true ;;
        --skip-build)   SKIP_BUILD=true ;;
        --skip-migrate) SKIP_MIGRATE=true ;;
        --hosts)        ADD_HOSTS=true ;;
    esac
done

# --- Helpers ---
info()    { echo "==> $*"; }
success() { echo "    ✓ $*"; }
warn()    { echo "    ! $*"; }

# --- Step 1: Prerequisites check ---
info "Checking prerequisites..."

if ! command -v docker &>/dev/null; then
    echo "ERROR: docker not found. Install Docker Desktop first."
    exit 1
fi
success "docker found"

if ! docker info &>/dev/null; then
    echo "ERROR: Docker daemon is not running. Start Docker Desktop."
    exit 1
fi
success "Docker daemon running"

if ! command -v kubectl &>/dev/null; then
    echo "ERROR: kubectl not found. Install kubectl or enable it in Docker Desktop."
    exit 1
fi
success "kubectl found"

CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
if [ "$CURRENT_CONTEXT" != "$CONTEXT" ]; then
    info "Switching kubectl context to ${CONTEXT}..."
    kubectl config use-context "${CONTEXT}"
fi
success "kubectl context: ${CONTEXT}"

echo ""

# --- Step 2: nginx-ingress controller ---
if [ "$SKIP_INGRESS" = false ]; then
    if kubectl get ingressclass nginx &>/dev/null 2>&1; then
        info "nginx-ingress already installed, skipping."
    else
        info "Installing nginx-ingress controller..."
        bash "${SCRIPT_DIR}/k8s-setup-ingress.sh"
    fi
else
    info "Skipping nginx-ingress installation (--skip-ingress)"
fi

echo ""

# --- Step 3: Docker image build ---
if [ "$SKIP_BUILD" = false ]; then
    info "Building Docker image..."
    bash "${SCRIPT_DIR}/k8s-build.sh"
else
    info "Skipping Docker build (--skip-build)"
fi

echo ""

# --- Step 4: Deploy to K8s ---
info "Deploying to Kubernetes..."
DEPLOY_FLAGS=""
[ "$SKIP_MIGRATE" = true ] && DEPLOY_FLAGS="--skip-migrate"
bash "${SCRIPT_DIR}/k8s-deploy.sh" --skip-build ${DEPLOY_FLAGS}

echo ""

# --- Step 5: /etc/hosts entry ---
if [ "$ADD_HOSTS" = true ]; then
    if grep -q "dcim.local" "${HOSTS_FILE}" 2>/dev/null; then
        info "/etc/hosts already contains dcim.local, skipping."
    else
        info "Adding dcim.local to /etc/hosts (requires sudo)..."
        echo "${HOSTS_ENTRY}" | sudo tee -a "${HOSTS_FILE}" > /dev/null
        success "Added: ${HOSTS_ENTRY}"
    fi
else
    if ! grep -q "dcim.local" "${HOSTS_FILE}" 2>/dev/null; then
        warn "/etc/hosts does not contain dcim.local"
        warn "Add it manually or re-run with --hosts flag:"
        warn "  sudo sh -c 'echo \"${HOSTS_ENTRY}\" >> ${HOSTS_FILE}'"
    fi
fi

echo ""

# --- Done ---
info "All done!"
echo ""
echo "    Access URLs:"
echo "      http://localhost:30300    (NodePort — always available)"
echo "      http://dcim.local         (Ingress — requires /etc/hosts entry)"
echo ""
echo "    Useful commands:"
echo "      npm run k8s:status        Show all K8s resources"
echo "      npm run k8s:destroy       Tear down all resources"
echo "      kubectl logs -f deployment/dcim-app -n ${NAMESPACE}"
echo ""
