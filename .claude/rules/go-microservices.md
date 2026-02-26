# Go Microservices Architecture

> Part of: DCIM Project
> See [CLAUDE.md](../../CLAUDE.md) for project overview.

---

## Project Structure

The Go microservices are organized as a monorepo in `go-services/`:

```
go-services/
├── cmd/
│   ├── power-service/main.go        # Starts power-service on port 8080
│   ├── core-api/main.go             # Starts core-api on port 8081
│   └── network-ops/main.go          # Starts network-ops on port 8082
├── internal/
│   ├── shared/                      # Shared utilities
│   │   ├── db/                      # Database connection (Postgres with TimescaleDB)
│   │   ├── middleware/              # Auth + logging middleware
│   │   ├── response/                # Standard response formatters
│   │   ├── audit/                   # Audit logging
│   │   └── crud/                    # CRUD helpers
│   ├── power/handler/               # Power service HTTP handlers
│   ├── core/handler/                # Core API HTTP handlers
│   └── netops/handler/              # Network Ops HTTP handlers
├── Dockerfile                       # Multi-stage build (compiles all 3 services)
├── go.mod, go.sum                   # Go module dependencies
└── ...
```

---

## Service Responsibilities

| Service | Port | Responsibility | Key Endpoints |
| --- | --- | --- | --- |
| **Power Service** | 8080 | Power monitoring, readings, real-time SSE | `/power/panels`, `/power/feeds`, `/power/readings`, `/power/sse`, `/power/summary` |
| **Core API** | 8081 | Infrastructure core entities | `/sites`, `/regions`, `/racks`, `/devices`, `/device-types`, `/manufacturers`, `/tenants`, `/locations` |
| **Network Ops** | 8082 | Network, access, alerts, reports | `/interfaces`, `/cables`, `/access-logs`, `/equipment-movements`, `/alerts`, `/reports`, `/audit-logs`, `/export`, `/import` |

---

## Database

All services connect to shared Postgres database (with TimescaleDB extension for power readings). Schema definitions remain in Next.js `db/schema/` (Drizzle ORM); Go services receive schema via SQL migrations.

---

## Authentication

Services receive `x-internal-secret` header from Next.js `proxy.ts` for inter-service verification (BFF → microservice trust). Session/user auth remains Next.js responsibility.

---

## Docker Build

Located at `go-services/Dockerfile`:

- Multi-stage build compiles all 3 services from `go-services/` monorepo
- Produces 3 images: `dc-infra-map-go:latest` (Power Service), `dc-infra-map-core:latest` (Core API), `dc-infra-map-netops:latest` (Network Ops)
- Build uses `--build-arg SERVICE=<name>` to select which binary to include
- No registry push needed for docker-desktop development

---

## Related Documentation

- [Codebase Map](./codebase-map.md) — Next.js BFF structure and API routes
- [Kubernetes & Helm Deployment](./kubernetes.md) — Service deployment
- [Environment Variables](./environment.md) — Service configuration
