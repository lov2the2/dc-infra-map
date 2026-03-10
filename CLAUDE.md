# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Center Infrastructure Map (DCIM) — a Next.js 16 + Go microservices system for data center infrastructure management and visualization. Next.js serves as BFF (Backend for Frontend) handling UI and auth, with 3 Go microservices decomposed by domain:
- **Power Service** (port 8080): Power monitoring, readings, SSE streaming
- **Core API** (port 8081): Sites, regions, devices, manufacturers, tenants, dashboard
- **Network Ops** (port 8082): Cables, interfaces, access control, alerts, reports, audit logs

Currently in early development (starter kit scaffold). See [ROADMAP.md](./docs/ROADMAP.md) for the complete project vision, technical strategy, and implementation phases.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run server:start` — Start dev server in background (PID saved to `scripts/.server.pid`, logs to `scripts/.server.log`)
- `npm run server:stop` — Stop the background dev server
- `npm run server:restart` — Restart the dev server (stop + 1s delay + start)
- `npm run build` — Production build (also serves as type-check)
- `npm run lint` — ESLint with Next.js core-web-vitals and TypeScript rules
- `npm test` — Start Vitest in watch mode
- `npm run test:run` — Run all tests once
- `npm run test:coverage` — Run tests with coverage report
- `npm run test:e2e` — Run Playwright E2E tests
- `npm run test:e2e:ui` — Run Playwright E2E tests with UI mode
- `npm run db:timescale` — Apply TimescaleDB hypertable setup via `drizzle/0001_timescaledb_setup.sql` (requires TimescaleDB extension)
- `npm run db:setup` — Full DB initialization: `db:migrate` then `db:timescale` in sequence
- `npm run k8s:build` — Build Docker images for Kubernetes: `dc-infra-map:latest` (Next.js BFF), `dc-infra-map:migrate` (DB migration), `dc-infra-map-go:latest` (Power Service), `dc-infra-map-core:latest` (Core API), `dc-infra-map-netops:latest` (Network Ops) (uses local docker-desktop daemon)
- `npm run k8s:ingress` — Install nginx-ingress controller on docker-desktop (required once before using Ingress)
- `npm run k8s:status` — Show all Kubernetes resources in dcim namespace
- `npm run helm:lint` — Helm chart syntax validation (dev values)
- `npm run helm:install:dev` — Install/upgrade to dev environment
- `npm run helm:install:staging` — Install/upgrade to staging environment
- `npm run helm:install:prod` — Install/upgrade to production environment
- `npm run helm:uninstall` — Uninstall Helm release
- `npm run helm:status` — Show Helm release status
- `npm run helm:template:dev` — Render templates without deploying (dev)
- `npm run helm:template:staging` — Render templates without deploying (staging)
- `npm run helm:template:prod` — Render templates without deploying (prod)

## Tech Stack

- **Next.js 16.1.6** with App Router (React 19, server components by default)
- **Tailwind CSS 4** with `@custom-variant dark (&:is(.dark, .dark *))` for dark mode
- **shadcn/ui** (new-york style, RSC-enabled, Lucide icons)
- **next-themes** for dark/light theme switching (class-based, system default)
- **exceljs** for Excel (.xlsx) file generation
- **node-cron** for server-side cron job scheduling (report automation)
- **nodemailer** for SMTP email delivery with Excel report attachments
- **fast-xml-parser** for XML export
- **@scalar/nextjs-api-reference** for interactive API documentation (OpenAPI 3.1.1)
- **vitest** for unit testing with @vitejs/plugin-react and vite-tsconfig-paths
- **@playwright/test** for E2E testing (chromium; requires `npx playwright install`)

## Architecture

**Layout chain**: `app/layout.tsx` wraps all pages with `ThemeProvider` → `SiteHeader` → `main` → `SiteFooter`.

**Instrumentation**: `instrumentation.ts` (project root) — Next.js instrumentation hook; initializes the report scheduler on Node.js server startup. Uses `output: 'standalone'` for container deployment, compatible with server-side features (cron scheduling, SSE streaming, node-cron).

**Scripts** (`scripts/`):

- `server-start.sh` — Starts `npm run dev` in background; checks port 3000 availability; polls for readiness (max 15s); saves PID to `.server.pid`, logs to `.server.log`
- `server-stop.sh` — Stops server via PID file or port 3000 process lookup; SIGTERM then SIGKILL if needed; cleans up PID file
- `server-restart.sh` — Sequentially runs stop → 1s delay → start
- `k8s-build.sh` — Build Docker images for Kubernetes: `dc-infra-map:latest` (Next.js BFF), `dc-infra-map:migrate` (DB migration), `dc-infra-map-go:latest` (Power Service), `dc-infra-map-core:latest` (Core API), `dc-infra-map-netops:latest` (Network Ops); uses local docker-desktop daemon (no registry push needed); outputs "Next: npm run helm:install:dev"
- `k8s-setup-ingress.sh` — Install nginx-ingress controller; enables Ingress-based domain routing

**Key conventions**:

- `proxy.ts` — **Next.js 16 middleware file** (replaces `middleware.ts`). Handles auth guard, admin-only routes, and `x-internal-secret` header injection for all Go microservice proxy routes (power-service, core-api, network-ops). **NEVER create `middleware.ts`** — Next.js 16 build fails if both files exist. See `.claude/rules/pitfalls.md` for details.
- `next.config.ts` — Contains `output: 'standalone'` for container deployment and `rewrites()` mapping all `/api/*` paths to Go microservices (Core API, Power Service, Network Ops). This is the sole routing mechanism for Go service proxying — there are no Next.js `route.ts` files for proxied endpoints
- `config/site.ts` — Centralized site metadata, nav links (NAV_GROUPS with grouped menu structure), CTA links, footer config
- `types/index.ts` — Shared TypeScript interfaces (includes NavGroup for navigation menu grouping)
- `types/entities.ts` — Entity type definitions (Site, Rack, Device, Tenant, etc.)
- `types/cable.ts` — Cable, interface, and port type definitions
- `types/alerts.ts` — Alert type definitions
- `types/next-auth.d.ts` — NextAuth type augmentation (session user with role)
- `lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `lib/api.ts` — API client utility
- `lib/auth/rbac.ts` — RBAC permission matrix and check functions (`checkPermission`, `isAdmin`, `canWrite`, `canDelete`)
- `lib/auth/with-auth.ts` — `withAuth(resource, action, handler)` HOF for API route auth+RBAC boilerplate; `withAuthOnly(handler)` for auth-only routes
- `lib/audit.ts` — Centralized audit logging (`logAudit`, `logLoginEvent`, `logExportEvent`)
- `lib/validators/` — Zod validation schemas (device, rack, tenant, location, access, power, cable, site, manufacturer)
  - `shared.ts` — Shared Zod schema primitives (slugSchema) used across validators
  - `manufacturer.ts` — Manufacturer schema with duplicate name detection
- `lib/export/` — Export/import utilities (excel.ts, xml.ts, csv-import.ts, csv-templates.ts) — **legacy**: used by tests, no longer serves API routes directly
- `lib/data-formatters.ts` — Date/null/status formatting utilities (`formatDate`, `formatDateTime`, `formatNullable`, `formatStatus`, `formatUnit`)
- `tests/lib/validators/` — Unit tests for Zod validators (device, rack, tenant, access, cable, location, power)
- `tests/lib/auth/` — Unit tests for RBAC permission matrix
- `tests/lib/export/` — Unit tests for export/import utilities (csv-templates, xml, csv-import)
- `tests/lib/alerts/` — Unit tests for alert evaluators (power threshold, warranty expiry, rack capacity)
- `lib/rate-limit.ts` — In-memory sliding window rate limiter (`checkRateLimit`, `getClientIdentifier`, `rateLimitResponse`, `RATE_LIMITS` presets: auth 10/min, exportImport 20/min, api 200/min)
- `lib/alerts/` — Alert evaluation engine and notification service — **legacy**: used by tests, no longer serves API routes directly
- `lib/scheduler/report-scheduler.ts` — Cron-based report scheduler (initScheduler, stopScheduler, reloadSchedule); loads active schedules from DB on startup — **legacy**: referenced by `instrumentation.ts`, may be removed in future cleanup
- `lib/mailer/report-mailer.ts` — Nodemailer SMTP mailer for scheduled report email delivery with Excel attachments — **legacy**: referenced by scheduler, may be removed in future cleanup
- `lib/swagger/openapi.ts` — OpenAPI 3.1.1 specification for all API routes
- `lib/power/mock-generator.ts` — Power mock data generator for development
- `hooks/use-search-params-filter.ts` — URL query parameter filter management hook
- `hooks/use-cascading-select.ts` — Dependent select data fetching hook
- `hooks/use-api-mutation.ts` — Form submission API call wrapper hook
- `hooks/use-delete-mutation.ts` — Delete API call wrapper hook
- `components/ui/` — shadcn/ui primitives (install new ones with `npx shadcn@latest add <name> -y`)
- `components/layout/` — Site-wide layout components (header, footer, desktop-nav, mobile nav, user-nav); desktop-nav provides grouped navigation menus via shadcn NavigationMenu
- `components/theme/` — Theme provider and toggle
- `components/providers/` — Context providers (session-provider)
- `components/common/` — Shared components (page-header, status-badge, confirm-dialog, data-table, export-button, audit-log-table, command-palette, route-error, table-loading, status-badge-factory)
  - `route-error.tsx` — Shared error boundary for route `error.tsx` files (props: `title`, `error`, `reset`)
  - `table-loading.tsx` — Shared table skeleton loading for table-based route `loading.tsx` files (props: `rows`, `columns`)
  - `status-badge-factory.tsx` — Factory for creating typed status badge components
  - `export-button.tsx` — Export functionality wrapper with format selection (xlsx/xml); displays error state when export fails
- `components/admin/` — Admin components (user-table, user-form, user-role-badge)
- `components/devices/` — Device management components (device-table with bulk select/status-change/delete, device-filters, device-form with cascading select reset on parent change, device-audit-log)
- `components/tenants/` — Tenant management components (tenant-table, tenant-form, tenant-delete-button)
- `components/manufacturers/` — Manufacturer management components (manufacturer-table, manufacturer-form with duplicate name validation)
- `components/locations/` — Location management components (location-form, location-actions)
- `components/floor-plan/` — Floor plan visualization with rack selection and responsive views:
  - `floor-plan-client.tsx` — Server component wrapper; manages `selectedRackId` state and rack positions via `useState(racks)`; handles Grid View (FloorPlanGrid) and Floor Map (FloorSpaceManager) tabs; propagates `handlePositionChange` to both FloorPlanGrid and FloorSpaceManager for synchronized position editing across views, and `onCellSelect` to FloorSpaceManager
  - `floor-plan-grid.tsx` — Horizontal scrollable rack card row (responsive layout); user-configurable racks-per-view setting (localStorage: `dcim:floor-plan:racks-per-view`, default 4); settings bar position toggle (localStorage: `dcim:floor-plan:settings-pos`); selected rack smooth-scrolls to center; supports optional `onPositionChange` prop for in-grid rack position editing synchronized with Floor Map
  - `rack-card.tsx` — Displays rack details with posX/posY coordinates; highlights selected state with ring border; "View Elevation →" link visible when selected; accepts optional `onPositionChange` callback — when provided and rack is selected, renders `EditPositionForm` sub-component (which initializes state from rack props and resets via `key` prop) with compact X/Y position editor, Apply (Check) button, and Enter key support to prevent lint warnings
  - `floor-plan-canvas.tsx` — **legacy** — 2D SVG drag-and-drop visualization (no longer used in active views; retained for reference only); was previously the Floor Map tab before integration into FloorSpaceManager
  - floor space management: `floor-space-manager.tsx` (2-tab UI: Grid View, Floor Map; controlled component with `cells`, `gridCols`, `gridRows` props), `floor-space-config-form.tsx` (grid size configuration), `floor-space-grid.tsx` (cell visualization with HTML5 drag-and-drop for rack repositioning), `floor-space-cell-dialog.tsx` (context-aware placement dialog)
- `components/rack/` — Rack elevation components (rack-elevation-client, multi-rack-elevation-client, rack-face-toggle, rack-grid, rack-slot, device-block, rack-header); multi-rack-elevation-client provides a single DndContext for cross-rack drag-and-drop; rack-grid/rack-slot/device-block accept rackId props for multi-rack context
- `components/access/` — Access management components (access-log-list, check-in-form, check-out-dialog, equipment-movement-list/form, movement-approval-dialog)
- `components/power/` — Power monitoring components (power-dashboard, power-panel-list/form, power-feed-list/form, power-gauge, rack-power-grid, sse-connection-indicator)
- `components/cables/` — Cable management components (table, filters, form, status badge, trace view, termination select, interface/port lists)
- `components/reports/` — Reports page components (export-card, export-filters, import-dialog [sends CSV file via FormData with `file` field to `/api/bulk-import/*` endpoints], import-preview, import-result, schedule-table, schedule-form)
- `components/topology/` — Network topology visualization (accurate per-interface port utilization via cable terminations, patch panel tracing with front/rear port lookup and dashed-line rendering); device nodes are draggable with position persistence in localStorage; includes Auto Layout and Reset Layout buttons
- `components/alerts/` — Alert components (severity-badge, alert-stats-card, alert-rules-table, alert-rule-form, alert-history-table, channel-config)

**Database schema** (`db/schema/`):

- `enums.ts` — Enums include: `userRoleEnum` (admin/operator/viewer/tenant_viewer), `auditActionTypeEnum` (login/api_call/asset_view/export), `cableTypeEnum`, `cableStatusEnum`, `interfaceTypeEnum`, `portSideEnum`, `alertRuleTypeEnum` (power_threshold/warranty_expiry/rack_capacity), `alertSeverityEnum` (critical/warning/info), `notificationChannelTypeEnum` (slack_webhook/email/in_app), `conditionOperatorEnum`
- `auth.ts` — Tables: `users`, `accounts`, `sessions`, `verificationTokens`
- `core.ts` — Tables: `manufacturers`, `tenants`, `sites`, `locations` (includes `gridCols` default 10, `gridRows` default 10 for floor space grid), `racks`, `locationFloorCells` (posX, posY, name, isUnavailable, notes — floor space cell management)
- `devices.ts` — Tables: `deviceTypes`, `devices` (devices includes `warrantyExpiresAt` nullable timestamp)
- `access.ts` — Tables: `accessLogs`, `equipmentMovements`
- `power.ts` — Tables: `powerPanels`, `powerFeeds`, `powerPorts`, `powerOutlets`, `powerReadings`
- `cables.ts` — Tables: `interfaces`, `consolePorts`, `rearPorts`, `frontPorts`, `cables`
- `audit.ts` — `auditLogs` table with `actionType`, `ipAddress`, `userAgent` columns for enhanced audit
- `alerts.ts` — Tables: `alertRules`, `alertHistory`, `notificationChannels`
- `reports.ts` — Tables: `reportSchedules`
- `relations.ts` — Drizzle ORM relation definitions (includes `powerReadingsRelations`, `locationFloorCellsRelations`)
- `index.ts` — Schema barrel export

**API routes**: Next.js BFF proxies to Go microservices via `next.config.ts` rewrites. All proxied requests flow through `proxy.ts` which injects the `x-internal-secret` header. The `app/api/` directory only contains Next.js-native route handlers listed below; all other `/api/*` endpoints are handled entirely by Go microservices via rewrites (no `route.ts` files in Next.js).

**Next.js route handlers** (files in `app/api/`, using Drizzle ORM directly):

- `/api/auth/[...nextauth]` — NextAuth authentication (login/logout/session)
- `/api/auth/register` — User self-registration (creates viewer role account with bcrypt password hashing)
- `/api/auth/forgot-password` — Generate password reset token (stored in verificationTokens table with 1hr TTL; returns token in development mode)
- `/api/auth/reset-password` — Validate token and update user password
- `/api/admin/users` — User management CRUD (admin only)
- `/api/admin/users/[id]` — Single user GET/PATCH/DELETE (admin only)
- `/api/sites` — GET list + POST create (Drizzle ORM)
- `/api/sites/[siteId]` — GET + PATCH + DELETE (Drizzle ORM)
- `/api/locations` — GET list (supports `?siteId=` filter) + POST create (Drizzle ORM)
- `/api/locations/[locationId]` — GET + PATCH + DELETE (Drizzle ORM)
- `/api/floor-cells/[locationId]` — GET floor space config + cells list, PUT grid size configuration
- `/api/floor-cells/[locationId]/cells` — POST create floor cell
- `/api/floor-cells/[locationId]/cells/[cellId]` — PATCH update floor cell, DELETE floor cell
- `/api/manufacturers` — GET list + POST create (Drizzle ORM)
- `/api/manufacturers/[id]` — GET + PATCH + DELETE (Drizzle ORM)
- `/api/manufacturers/search?q=&excludeId=` — GET search manufacturers by similar name (excludeId for edit form duplicate check)
- `/api/bulk-import/sites` — POST bulk import sites via CSV (accepts `multipart/form-data` with `file` field or JSON body with `csv` string for backward compatibility; `?confirm=true` to commit, `?confirm=false` for validation-only)
- `/api/bulk-import/tenants` — POST bulk import tenants via CSV (same protocol as sites)

**Proxied to Go microservices** (via `next.config.ts` rewrites, no Next.js route files):

- **Core API** (port 8081): `/api/sites`, `/api/regions`, `/api/locations`, `/api/racks`, `/api/devices`, `/api/device-types`, `/api/manufacturers`, `/api/tenants`, `/api/dashboard` — see Go Microservices Architecture for endpoint details
- **Power Service** (port 8080): `/api/power/panels`, `/api/power/feeds`, `/api/power/readings`, `/api/power/sse`, `/api/power/summary`, `/api/export/*` — see Go Microservices Architecture for endpoint details
- **Network Ops** (port 8082): `/api/cables`, `/api/interfaces`, `/api/console-ports`, `/api/front-ports`, `/api/rear-ports`, `/api/access-logs`, `/api/equipment-movements`, `/api/alerts/*`, `/api/reports/*`, `/api/audit-logs`, `/api/import/*` — see Go Microservices Architecture for endpoint details

**Documentation** (Next.js page, not API route):

- `/api-docs` — Interactive API reference (Scalar UI, serves OpenAPI spec)

**State management**:

- `stores/use-site-store.ts` — Site management Zustand store
- `stores/use-rack-store.ts` — Rack management Zustand store (multi-rack support: `racks[]`, `setRacks()`, `moveDeviceBetweenRacks()` with optimistic update and rollback)
- `stores/use-device-store.ts` — Device management Zustand store
- `stores/use-access-store.ts` — Access management Zustand store
- `stores/use-power-store.ts` — Power monitoring Zustand store
- `stores/use-cable-store.ts` — Cable management Zustand store
- `stores/use-alert-store.ts` — Alert management Zustand store

**RBAC**: Next.js admin API routes use `withAuth(resource, action, handler)` from `lib/auth/with-auth.ts` for auth + RBAC permission checking. Permission matrix (in `lib/auth/rbac.ts`) covers 13 resources x 4 roles. Admin routes (`/admin/*`, `/api/admin/*`) are protected by `proxy.ts` role check. Go microservices verify requests via the `x-internal-secret` header injected by `proxy.ts`.

**Route UX boundaries**: All major route groups have `loading.tsx` (Skeleton-based) and `error.tsx` (Card with Try Again + Go Back) for streaming suspense and error recovery. All dynamic route segments have `not-found.tsx` for 404 handling.

**Pages**: `/` (landing), `/(auth)/login` (authentication), `/(auth)/register` (user self-registration with viewer role), `/(auth)/forgot-password` (password recovery via email token), `/(auth)/reset-password` (password reset with URL token), `/dashboard` (overview), `/sites` (site management), `/sites/[siteId]` (site detail with location CRUD), `/regions` (region management), `/devices` (device management), `/manufacturers` (manufacturer management), `/manufacturers/new` (create manufacturer), `/manufacturers/[id]` (manufacturer detail), `/manufacturers/[id]/edit` (edit manufacturer), `/tenants` (tenant management), `/access` (access log management), `/power` (power monitoring dashboard), `/cables` (cable management), `/topology` (network topology), `/reports` (export/import reports), `/admin/users` (user management, admin only), `/alerts` (alert dashboard with Rules/History/Channels tabs), `/api-docs` (interactive API reference)

**Path alias**: `@/*` maps to project root.

**Custom container**: Defined as `@utility container` in `globals.css` (max-width: 1280px, auto margins, 2rem inline padding). Pages should not add redundant `container`/`max-w-*` classes.

## Go Microservices Architecture

**Project structure** (`go-services/` monorepo):

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

**Service responsibilities**:

| Service | Port | Responsibility | Key Endpoints |
| --- | --- | --- | --- |
| **Power Service** | 8080 | Power monitoring, readings, real-time SSE | `/power/panels`, `/power/feeds`, `/power/readings`, `/power/sse`, `/power/summary` |
| **Core API** | 8081 | Infrastructure core entities | `/sites`, `/regions`, `/racks`, `/devices`, `/device-types`, `/manufacturers`, `/tenants`, `/locations` |
| **Network Ops** | 8082 | Network, access, alerts, reports | `/interfaces`, `/cables`, `/access-logs`, `/equipment-movements`, `/alerts`, `/reports`, `/audit-logs`, `/export`, `/import` |

**Database**: All services connect to shared Postgres database (with TimescaleDB extension for power readings). Schema definitions remain in Next.js `db/schema/` (Drizzle ORM); Go services receive schema via SQL migrations.

**Authentication**: Services receive `x-internal-secret` header from Next.js `proxy.ts` for inter-service verification (BFF → microservice trust). Session/user auth remains Next.js responsibility.

**Docker build** (`go-services/Dockerfile`):

- Multi-stage build compiles all 3 services from `go-services/` monorepo
- Produces 3 images: `dc-infra-map-go:latest` (Power Service), `dc-infra-map-core:latest` (Core API), `dc-infra-map-netops:latest` (Network Ops)
- Build uses `--build-arg SERVICE=<name>` to select which binary to include
- No registry push needed for docker-desktop development

## Kubernetes Deployment

**Docker containerization** (`Dockerfile`, `.dockerignore`):

- Multi-stage build: compile Next.js with `output: 'standalone'`, copy only runtime files to minimal distroless image
- `.dockerignore` excludes unnecessary files (git, node_modules, build artifacts)
- Result: lightweight production image suitable for Kubernetes

**All Kubernetes resources are managed via the Helm chart** (`helm/dcim/`). There are no raw `k8s/` manifests — see the Helm Chart Deployment section below for resource details.

**Deployment workflow**:

1. `npm run k8s:ingress` — Install nginx-ingress controller on docker-desktop (one-time setup; required before Ingress features work)
2. `npm run k8s:build` — Build Docker images using local docker-desktop daemon: `dc-infra-map:latest`, `dc-infra-map:migrate`, `dc-infra-map-go:latest`, `dc-infra-map-core:latest`, `dc-infra-map-netops:latest` (no registry required)
3. `npm run helm:install:dev` — Deploy all resources via Helm (namespace, postgres, power-service, core-api, network-ops, app, ingress, migration)
4. `npm run helm:status` or `npm run k8s:status` — View deployment status
5. `npm run helm:uninstall` — Remove Helm release and all managed resources

**Database migration**:

- Migration runs automatically via Helm post-install/post-upgrade hook
- No manual migration step needed — Helm handles it during `helm:install:*`

**Network topology** (managed by Helm templates):

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

## Helm Chart Deployment

**Chart location**: `helm/dcim/`

**Environment-specific values**:

- `helm/dcim/values.yaml` — Default values (shared across all environments)
- `helm/dcim/values.dev.yaml` — Dev overrides (gitignored, copy from example)
- `helm/dcim/values.staging.yaml` — Staging overrides (gitignored, copy from example)
- `helm/dcim/values.prod.yaml` — Production overrides (gitignored, copy from example)
- `helm/dcim/values.*.example.yaml` — Sample files for each environment (committed to git)

**Setup**:

1. Copy example files: `cp helm/dcim/values.dev.example.yaml helm/dcim/values.dev.yaml`
2. Edit credentials and configuration in `values.dev.yaml`
3. Deploy: `npm run helm:install:dev`

**Environment differences** (dev → staging → prod):

| Aspect | Dev | Staging | Prod |
| --- | --- | --- | --- |
| Replicas | 1 | 2 | 3 |
| Resources | minimal | medium | production-grade |
| Domain | dcim-dev.local | dcim-staging.example.com | dcim.example.com |
| TLS | disabled | disabled | enabled |
| CPU (request/limit) | 100m/500m | 250m/1000m | 500m/2000m |
| Memory (request/limit) | 256Mi/512Mi | 512Mi/1Gi | 1Gi/2Gi |
| DB Storage | 10Gi | 20Gi | 50Gi |

**Automatic Pod Rolling Restart**:

- Deployment and StatefulSet pod templates include checksum annotations (`checksum/config` and `checksum/secret`) that hash ConfigMap and Secret contents
- When `helm upgrade` is executed, checksum changes automatically trigger a rolling restart of pods, ensuring configuration updates take effect without manual pod deletion
- This pattern guarantees that configuration changes (database credentials, feature flags, etc.) are propagated immediately across all instances

## Tailwind 4 Specifics

- CSS-first configuration in `app/globals.css` (no `tailwind.config.ts`)
- Color tokens use `oklch()` via CSS custom properties (`:root` and `.dark`)
- Dark mode variant: `@custom-variant dark (&:is(.dark, .dark *))` — both `.dark` and `.dark *` are required

## shadcn/ui

- Installed components: alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, navigation-menu, popover, progress, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, tooltip
- Style: new-york | Base color: neutral | CSS variables: enabled
- Must install components before importing: `npx shadcn@latest add <component> -y`
- Use correct Radix UI props: `onOpenChange` (not `onClose`), `onCheckedChange` (not `onChange`), `onValueChange` (not `onSelect`)

## Vitest

- Configuration file: `vitest.config.ts` (node environment, globals enabled, path alias support)
- Test files location: `tests/` directory (mirrors `lib/` and `components/` structure)
- Coverage measurement available with `npm run test:coverage`
- Unit tests cover: validators (device, rack, tenant, access, cable, location, power), RBAC permission matrix, export/import utilities (csv-templates, xml, csv-import), and alert evaluators (power threshold, warranty expiry, rack capacity)

## Playwright (E2E)

- Configuration file: `playwright.config.ts` (chromium, webServer auto-start on port 3000)
- Test files location: `e2e/` directory (auth.spec.ts, dashboard.spec.ts, devices.spec.ts)
- Setup: `npx playwright install` to download browser binaries

## Database Migrations

- `drizzle/0001_timescaledb_setup.sql` — TimescaleDB hypertable setup for `power_readings` (applied via `npm run db:timescale` or `npm run db:setup`)
- `drizzle/README.md` — Migration documentation and instructions

## Environment Variables

**Next.js BFF**:

- `CORE_API_URL` — Core API service URL (e.g., `http://dcim-core-api.dcim.svc.cluster.local:8081` in K8s, `http://localhost:8081` in dev)
- `NETWORK_OPS_URL` — Network Ops service URL (e.g., `http://dcim-network-ops.dcim.svc.cluster.local:8082` in K8s, `http://localhost:8082` in dev)
- `POWER_SERVICE_URL` — Power Service URL (e.g., `http://dcim-power-service.dcim.svc.cluster.local:8080` in K8s, `http://localhost:8080` in dev)
- `X_INTERNAL_SECRET` — Shared secret for inter-service authentication (injected by `proxy.ts`)

**SMTP Configuration** (for scheduled report email delivery):

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP server port
- `SMTP_USER` — SMTP authentication username
- `SMTP_PASS` — SMTP authentication password
- `SMTP_FROM` — Sender email address for scheduled report emails

**Go Microservices** (configured via Helm chart ConfigMap):

- `DATABASE_URL` — Postgres connection string (shared across all services)
- `PORT` — Service port (8080 for power-service, 8081 for core-api, 8082 for network-ops)
- `X_INTERNAL_SECRET` — Shared secret for verifying inter-service requests

See `.env.example` for Next.js configuration template.

## Documentation Index

- **[ROADMAP.md](./docs/ROADMAP.md)** — Project vision, technical stack decisions, data models, implementation roadmap, and risk analysis (Korean)
- **[CLAUDE.md](./CLAUDE.md)** (this file) — Technical architecture and development guidance (English)
- **[.claude/rules/pitfalls.md](./.claude/rules/pitfalls.md)** — Common bug patterns and prevention checklists
- **[.claude/rules/development-workflow.md](./.claude/rules/development-workflow.md)** — Feature development procedures

## Pitfalls Reference

See `.claude/rules/pitfalls.md` for detailed checklists on:

- Radix UI component prop names
- SSR hydration (use `'use client'` + `useEffect` for browser APIs)
- Page layout consistency (avoid duplicate container classes)
- Open redirect prevention patterns
- Tailwind 4 dark mode variant configuration
- Route not-found pages for dynamic segments
