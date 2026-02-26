# Environment Variables

> Part of: DCIM Project
> See [CLAUDE.md](../../CLAUDE.md) for project overview.

---

## Next.js BFF

- `CORE_API_URL` — Core API service URL (e.g., `http://dcim-core-api.dcim.svc.cluster.local:8081` in K8s, `http://localhost:8081` in dev)
- `NETWORK_OPS_URL` — Network Ops service URL (e.g., `http://dcim-network-ops.dcim.svc.cluster.local:8082` in K8s, `http://localhost:8082` in dev)
- `POWER_SERVICE_URL` — Power Service URL (e.g., `http://dcim-power-service.dcim.svc.cluster.local:8080` in K8s, `http://localhost:8080` in dev)
- `X_INTERNAL_SECRET` — Shared secret for inter-service authentication (injected by `proxy.ts`)

---

## SMTP Configuration

For scheduled report email delivery:

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP server port
- `SMTP_USER` — SMTP authentication username
- `SMTP_PASS` — SMTP authentication password
- `SMTP_FROM` — Sender email address for scheduled report emails

---

## Go Microservices

Configured via Helm chart ConfigMap:

- `DATABASE_URL` — Postgres connection string (shared across all services)
- `PORT` — Service port (8080 for power-service, 8081 for core-api, 8082 for network-ops)
- `X_INTERNAL_SECRET` — Shared secret for verifying inter-service requests

---

## Configuration Template

See `.env.example` for Next.js configuration template.

---

## Related Documentation

- [Kubernetes & Helm Deployment](./kubernetes.md) — Helm chart configuration
- [Go Microservices Architecture](./go-microservices.md) — Service configuration details
