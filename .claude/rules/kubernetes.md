# Kubernetes & Helm Deployment

> Part of: DCIM Project
> See [CLAUDE.md](../../CLAUDE.md) for project overview.

---

## Docker Containerization

Defined in `Dockerfile` and `.dockerignore`:

- Multi-stage build: compile Next.js with `output: 'standalone'`, copy only runtime files to minimal distroless image
- `.dockerignore` excludes unnecessary files (git, node_modules, build artifacts)
- Result: lightweight production image suitable for Kubernetes

---

## Deployment Architecture

All Kubernetes resources are managed via the Helm chart (`helm/dcim/`). There are no raw `k8s/` manifests — see the Helm Chart Deployment section below for resource details.

---

## Deployment Workflow

```
1. npm run k8s:ingress
   ↓ Install nginx-ingress controller on docker-desktop (one-time setup; required before Ingress features work)

2. npm run k8s:build
   ↓ Build Docker images using local docker-desktop daemon:
   - dc-infra-map:latest (Next.js BFF)
   - dc-infra-map:migrate (DB migration)
   - dc-infra-map-go:latest (Power Service)
   - dc-infra-map-core:latest (Core API)
   - dc-infra-map-netops:latest (Network Ops)
   (no registry required)

3. npm run helm:install:dev
   ↓ Deploy all resources via Helm (namespace, postgres, power-service, core-api, network-ops, app, ingress, migration)

4. npm run helm:status or npm run k8s:status
   ↓ View deployment status

5. npm run helm:uninstall
   ↓ Remove Helm release and all managed resources
```

---

## Database Migration

Migration runs automatically via Helm post-install/post-upgrade hook. No manual migration step needed — Helm handles it during `helm:install:*`.

---

## Network Topology

Managed by Helm templates:

- postgres StatefulSet (ClusterIP) accessible at `postgres.dcim.svc.cluster.local:5432`
- power-service Deployment (ClusterIP) accessible at `dcim-power-service.dcim.svc.cluster.local:8080` (internal routing only)
- core-api Deployment (ClusterIP) accessible at `dcim-core-api.dcim.svc.cluster.local:8081` (internal routing only)
- network-ops Deployment (ClusterIP) accessible at `dcim-network-ops.dcim.svc.cluster.local:8082` (internal routing only)
- Next.js app Deployment (BFF) proxies all microservice routes via `proxy.ts` (injects `x-internal-secret` header for authentication between services)
- Next.js app Deployment accessible via:
  - Ingress domain: `http://dcim.local` (requires `npm run k8s:ingress` setup and `/etc/hosts` entry)
  - kubectl port-forward: `kubectl port-forward svc/dcim-app 3000:3000 -n dcim`
  - NodePort: port 30300
- All components share `dcim` namespace
- Ingress enables domain-based routing for cleaner access and SSE streaming compatibility
- Target pod count: 5 (1 app, 1 power-service, 1 core-api, 1 network-ops, 1 postgres)

---

## Helm Chart Deployment

### Chart Location

`helm/dcim/`

### Environment-Specific Values

- `helm/dcim/values.yaml` — Default values (shared across all environments)
- `helm/dcim/values.dev.yaml` — Dev overrides (gitignored, copy from example)
- `helm/dcim/values.staging.yaml` — Staging overrides (gitignored, copy from example)
- `helm/dcim/values.prod.yaml` — Production overrides (gitignored, copy from example)
- `helm/dcim/values.*.example.yaml` — Sample files for each environment (committed to git)

### Setup

1. Copy example files: `cp helm/dcim/values.dev.example.yaml helm/dcim/values.dev.yaml`
2. Edit credentials and configuration in `values.dev.yaml`
3. Deploy: `npm run helm:install:dev`

### Environment Differences

| Aspect | Dev | Staging | Prod |
| --- | --- | --- | --- |
| Replicas | 1 | 2 | 3 |
| Resources | minimal | medium | production-grade |
| Domain | dcim-dev.local | dcim-staging.example.com | dcim.example.com |
| TLS | disabled | disabled | enabled |
| CPU (request/limit) | 100m/500m | 250m/1000m | 500m/2000m |
| Memory (request/limit) | 256Mi/512Mi | 512Mi/1Gi | 1Gi/2Gi |
| DB Storage | 10Gi | 20Gi | 50Gi |

### Automatic Pod Rolling Restart

Deployment and StatefulSet pod templates include checksum annotations (`checksum/config` and `checksum/secret`) that hash ConfigMap and Secret contents. When `helm upgrade` is executed, checksum changes automatically trigger a rolling restart of pods, ensuring configuration updates take effect without manual pod deletion. This pattern guarantees that configuration changes (database credentials, feature flags, etc.) are propagated immediately across all instances.

---

## Related Documentation

- [Go Microservices Architecture](./go-microservices.md) — Service details
- [Environment Variables](./environment.md) — Service configuration
- [Tech Stack & Tooling](./tech-stack.md) — Database and deployment tools
