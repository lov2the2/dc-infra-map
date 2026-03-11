# Codebase Map

> Part of: DCIM Project
> See [CLAUDE.md](../../CLAUDE.md) for project overview.

---

## Layout Chain

`app/layout.tsx` wraps all pages with `ThemeProvider` → `SiteHeader` → `main` → `SiteFooter`.

---

## Instrumentation

`instrumentation.ts` (project root) — Next.js instrumentation hook; initializes the report scheduler on Node.js server startup. Uses `output: 'standalone'` for container deployment, compatible with server-side features (cron scheduling, SSE streaming, node-cron).

---

## Scripts

Located in `scripts/`:

- `server-start.sh` — Starts `npm run dev` in background; checks port 3000 availability; polls for readiness (max 15s); saves PID to `.server.pid`, logs to `.server.log`
- `server-stop.sh` — Stops server via PID file or port 3000 process lookup; SIGTERM then SIGKILL if needed; cleans up PID file
- `server-restart.sh` — Sequentially runs stop → 1s delay → start
- `k8s-build.sh` — Build Docker images for Kubernetes: `dc-infra-map:latest` (Next.js BFF), `dc-infra-map:migrate` (DB migration), `dc-infra-map-go:latest` (Power Service), `dc-infra-map-core:latest` (Core API), `dc-infra-map-netops:latest` (Network Ops); uses local docker-desktop daemon (no registry push needed); outputs "Next: npm run helm:install:dev"
- `k8s-setup-ingress.sh` — Install nginx-ingress controller; enables Ingress-based domain routing

---

## Key Conventions

**`proxy.ts`** — **Next.js 16 middleware file** (replaces `middleware.ts`). Handles auth guard, admin-only routes, and `x-internal-secret` header injection for all Go microservice proxy routes (power-service, core-api, network-ops). **NEVER create `middleware.ts`** — Next.js 16 build fails if both files exist. See [.claude/rules/pitfalls.md](./pitfalls.md) for details.

**`next.config.ts`** — Contains `output: 'standalone'` for container deployment and `rewrites()` mapping all `/api/*` paths to Go microservices (Core API, Power Service, Network Ops). This is the sole routing mechanism for Go service proxying — there are no Next.js `route.ts` files for proxied endpoints.

**`config/site.ts`** — Centralized site metadata, nav links (NAV_GROUPS with grouped menu structure), CTA links, footer config.

**Path alias**: `@/*` maps to project root.

**Custom container**: Defined as `@utility container` in `globals.css` (max-width: 1280px, auto margins, 2rem inline padding). Pages should not add redundant `container`/`max-w-*` classes.

---

## Type Definitions

### `types/index.ts`

Shared TypeScript interfaces (includes NavGroup for navigation menu grouping).

### `types/entities.ts`

Entity type definitions (Site, Rack, Device, Tenant, etc.).

### `types/cable.ts`

Cable, interface, and port type definitions.

### `types/alerts.ts`

Alert type definitions.

### `types/next-auth.d.ts`

NextAuth type augmentation (session user with role).

---

## Utilities

### `lib/utils.ts`

`cn()` utility (clsx + tailwind-merge).

### `lib/api.ts`

API client utility.

### `lib/auth/rbac.ts`

RBAC permission matrix and check functions (`checkPermission`, `isAdmin`, `canWrite`, `canDelete`).

### `lib/auth/with-auth.ts`

`withAuth(resource, action, handler)` HOF for API route auth+RBAC boilerplate; `withAuthOnly(handler)` for auth-only routes.

### `lib/audit.ts`

Centralized audit logging (`logAudit`, `logLoginEvent`, `logExportEvent`).

### `lib/validators/`

Zod validation schemas (device, rack, tenant, location, access, power, cable, site, manufacturer):
- `shared.ts` — Shared Zod schema primitives (slugSchema) used across validators
- `manufacturer.ts` — Manufacturer schema with duplicate name detection

### `lib/export/`

Export/import utilities (excel.ts, xml.ts, csv-import.ts, csv-templates.ts) — **legacy**: used by tests, no longer serves API routes directly.

### `lib/data-formatters.ts`

Date/null/status formatting utilities (`formatDate`, `formatDateTime`, `formatNullable`, `formatStatus`, `formatUnit`).

### `lib/rate-limit.ts`

In-memory sliding window rate limiter (`checkRateLimit`, `getClientIdentifier`, `rateLimitResponse`, `RATE_LIMITS` presets: auth 10/min, exportImport 20/min, api 200/min).

### `lib/alerts/`

Alert evaluation engine and notification service — **legacy**: used by tests, no longer serves API routes directly.

### `lib/scheduler/report-scheduler.ts`

Cron-based report scheduler (initScheduler, stopScheduler, reloadSchedule); loads active schedules from DB on startup — **legacy**: referenced by `instrumentation.ts`, may be removed in future cleanup.

### `lib/mailer/report-mailer.ts`

Nodemailer SMTP mailer for scheduled report email delivery with Excel attachments — **legacy**: referenced by scheduler, may be removed in future cleanup.

### `lib/swagger/openapi.ts`

OpenAPI 3.1.1 specification for all API routes.

### `lib/power/mock-generator.ts`

Power mock data generator for development.

---

## Hooks

- `hooks/use-search-params-filter.ts` — URL query parameter filter management hook
- `hooks/use-cascading-select.ts` — Dependent select data fetching hook
- `hooks/use-api-mutation.ts` — Form submission API call wrapper hook
- `hooks/use-delete-mutation.ts` — Delete API call wrapper hook

---

## Components

### `components/ui/`

shadcn/ui primitives (install new ones with `npx shadcn@latest add <name> -y`).
- `searchable-select.tsx` — Popover+Command combobox for searchable dropdowns with keyboard navigation

### `components/layout/`

Site-wide layout components (header, footer, desktop-nav, mobile nav, user-nav); desktop-nav provides grouped navigation menus via shadcn NavigationMenu.

### `components/theme/`

Theme provider and toggle.

### `components/providers/`

Context providers (session-provider).

### `components/common/`

Shared components (page-header, status-badge, confirm-dialog, data-table, export-button, audit-log-table, command-palette, route-error, table-loading, status-badge-factory):
- `route-error.tsx` — Shared error boundary for route `error.tsx` files (props: `title`, `error`, `reset`)
- `table-loading.tsx` — Shared table skeleton loading for table-based route `loading.tsx` files (props: `rows`, `columns`)
- `status-badge-factory.tsx` — Factory for creating typed status badge components
- `export-button.tsx` — Export functionality wrapper with format selection (xlsx/xml); displays error state when export fails

### `components/admin/`

Admin components (user-table, user-form, user-role-badge).

### `components/devices/`

Device management components (device-table with bulk select/status-change/delete, device-filters, device-form with SearchableSelect and quick-create buttons for Tenant/Site/Rack, quick-create-dialog wrapper, device-audit-log).

### `components/tenants/`

Tenant management components (tenant-table, tenant-form, tenant-delete-button).

### `components/manufacturers/`

Manufacturer management components (manufacturer-table, manufacturer-form with duplicate name validation).

### `components/floor-plan/`

Floor plan visualization with rack selection and responsive views:
- `floor-plan-client.tsx` — Server component wrapper; manages `selectedRackId` state and rack positions via `useState(racks)`; `handlePositionChange` updates state on PATCH success and propagates changes to all tabs
- `floor-plan-grid.tsx` — Horizontal scrollable rack card row (responsive layout); user-configurable racks-per-view setting (localStorage: `dcim:floor-plan:racks-per-view`, default 4); settings bar position toggle (localStorage: `dcim:floor-plan:settings-pos`); selected rack smooth-scrolls to center
- `rack-card.tsx` — Displays rack details with posX/posY coordinates; highlights selected state with ring border; "View Elevation →" link visible when selected; renders `EditPositionForm` sub-component for position editing with Enter key support
- `floor-plan-canvas.tsx` — 2D SVG drag-and-drop visualization (useMemo-based derived state); includes "Saving..." badge during PATCH request; syncs cross-tab rack selection via `selectedRackId` prop
- floor space management: `floor-space-manager.tsx` (3-tab UI with Grid View, 2D Map, Floor Spaces), `floor-space-config-form.tsx` (grid size configuration), `floor-space-grid.tsx` (cell visualization), `floor-space-cell-dialog.tsx` (context-aware placement dialog)

### `components/rack/`

Rack elevation components (rack-elevation-client, multi-rack-elevation-client, rack-face-toggle, rack-grid, rack-slot, device-block, rack-header); multi-rack-elevation-client provides a single DndContext for cross-rack drag-and-drop; rack-grid/rack-slot/device-block accept rackId props for multi-rack context.

### `components/access/`

Access management components (access-log-list, check-in-form, check-out-dialog, equipment-movement-list/form, movement-approval-dialog).

### `components/power/`

Power monitoring components (power-dashboard, power-panel-list/form, power-feed-list/form, power-gauge, rack-power-grid, sse-connection-indicator).

### `components/cables/`

Cable management components (table, filters, form, status badge, trace view, termination select, interface/port lists).

### `components/reports/`

Reports page components (export-card, export-filters, import-dialog [sends CSV file via FormData with `file` field to `/api/bulk-import/*` endpoints], import-preview, import-result, schedule-table, schedule-form).

### `components/topology/`

Network topology visualization (accurate per-interface port utilization via cable terminations, patch panel tracing with front/rear port lookup and dashed-line rendering); device nodes are draggable with position persistence in localStorage; includes Auto Layout and Reset Layout buttons.

### `components/alerts/`

Alert components (severity-badge, alert-stats-card, alert-rules-table, alert-rule-form, alert-history-table, channel-config).

---

## Database Schema

Located in `db/schema/`:

### `enums.ts`

Enums include:
- `userRoleEnum` (admin/operator/viewer/tenant_viewer)
- `auditActionTypeEnum` (login/api_call/asset_view/export)
- `cableTypeEnum`
- `cableStatusEnum`
- `interfaceTypeEnum`
- `portSideEnum`
- `alertRuleTypeEnum` (power_threshold/warranty_expiry/rack_capacity)
- `alertSeverityEnum` (critical/warning/info)
- `notificationChannelTypeEnum` (slack_webhook/email/in_app)
- `conditionOperatorEnum`

### `auth.ts`

Tables: `users`, `accounts`, `sessions`, `verificationTokens`.

### `core.ts`

Tables: `manufacturers`, `tenants`, `sites`, `locations` (includes `gridCols` default 10, `gridRows` default 10 for floor space grid), `racks`, `locationFloorCells` (posX, posY, name, isUnavailable, notes — floor space cell management).

### `devices.ts`

Tables: `deviceTypes`, `devices` (devices includes `warrantyExpiresAt` nullable timestamp).

### `access.ts`

Tables: `accessLogs`, `equipmentMovements`.

### `power.ts`

Tables: `powerPanels`, `powerFeeds`, `powerPorts`, `powerOutlets`, `powerReadings`.

### `cables.ts`

Tables: `interfaces`, `consolePorts`, `rearPorts`, `frontPorts`, `cables`.

### `audit.ts`

`auditLogs` table with `actionType`, `ipAddress`, `userAgent` columns for enhanced audit.

### `alerts.ts`

Tables: `alertRules`, `alertHistory`, `notificationChannels`.

### `reports.ts`

Tables: `reportSchedules`.

### `relations.ts`

Drizzle ORM relation definitions (includes `powerReadingsRelations`, `locationFloorCellsRelations`).

### `index.ts`

Schema barrel export.

---

## API Routes

Next.js BFF proxies to Go microservices via `next.config.ts` rewrites. All proxied requests flow through `proxy.ts` which injects the `x-internal-secret` header. The `app/api/` directory only contains Next.js-native route handlers; all other `/api/*` endpoints are handled entirely by Go microservices via rewrites (no `route.ts` files in Next.js).

### Next.js Route Handlers

Files in `app/api/`:

- `/api/auth/[...nextauth]` — NextAuth authentication (login/logout/session)
- `/api/auth/register` — User self-registration (creates viewer role account with bcrypt password hashing)
- `/api/auth/forgot-password` — Generate password reset token (stored in verificationTokens table with 1hr TTL; returns token in development mode)
- `/api/auth/reset-password` — Validate token and update user password
- `/api/admin/users` — User management CRUD (admin only)
- `/api/admin/users/[id]` — Single user GET/PATCH/DELETE (admin only)
- `/api/tenants` — GET list + POST create (Drizzle ORM; quick-create endpoint)
- `/api/floor-cells/[locationId]` — GET floor space config + cells list, PUT grid size configuration
- `/api/floor-cells/[locationId]/cells` — POST create floor cell
- `/api/floor-cells/[locationId]/cells/[cellId]` — PATCH update floor cell, DELETE floor cell
- `/api/racks` — GET list + POST create (Drizzle ORM; quick-create endpoint)
- `/api/manufacturers` — GET list + POST create (Drizzle ORM)
- `/api/manufacturers/[id]` — GET + PATCH + DELETE (Drizzle ORM)
- `/api/manufacturers/search?q=&excludeId=` — GET search manufacturers by similar name (excludeId for edit form duplicate check)
- `/api/bulk-import/sites` — POST bulk import sites via CSV (accepts `multipart/form-data` with `file` field or JSON body with `csv` string for backward compatibility; `?confirm=true` to commit, `?confirm=false` for validation-only)
- `/api/bulk-import/tenants` — POST bulk import tenants via CSV (same protocol as sites)

### Proxied to Go Microservices

Via `next.config.ts` rewrites (no Next.js route files):

**Core API** (port 8081): `/api/sites`, `/api/regions`, `/api/locations`, `/api/racks`, `/api/devices`, `/api/device-types`, `/api/manufacturers`, `/api/tenants`, `/api/dashboard` — see [Go Microservices Architecture](./go-microservices.md) for endpoint details.

**Power Service** (port 8080): `/api/power/panels`, `/api/power/feeds`, `/api/power/readings`, `/api/power/sse`, `/api/power/summary`, `/api/export/*` — see [Go Microservices Architecture](./go-microservices.md) for endpoint details.

**Network Ops** (port 8082): `/api/cables`, `/api/interfaces`, `/api/console-ports`, `/api/front-ports`, `/api/rear-ports`, `/api/access-logs`, `/api/equipment-movements`, `/api/alerts/*`, `/api/reports/*`, `/api/audit-logs`, `/api/import/*` — see [Go Microservices Architecture](./go-microservices.md) for endpoint details.

### Documentation

**Interactive API reference** (Next.js page, not API route):

- `/api-docs` — Scalar UI, serves OpenAPI spec

---

## State Management

Zustand stores in `stores/`:

- `stores/use-site-store.ts` — Site management Zustand store
- `stores/use-rack-store.ts` — Rack management Zustand store (multi-rack support: `racks[]`, `setRacks()`, `moveDeviceBetweenRacks()` with optimistic update and rollback)
- `stores/use-device-store.ts` — Device management Zustand store
- `stores/use-access-store.ts` — Access management Zustand store
- `stores/use-power-store.ts` — Power monitoring Zustand store
- `stores/use-cable-store.ts` — Cable management Zustand store
- `stores/use-alert-store.ts` — Alert management Zustand store

---

## RBAC

Next.js admin API routes use `withAuth(resource, action, handler)` from `lib/auth/with-auth.ts` for auth + RBAC permission checking. Permission matrix (in `lib/auth/rbac.ts`) covers 13 resources x 4 roles. Admin routes (`/admin/*`, `/api/admin/*`) are protected by `proxy.ts` role check. Go microservices verify requests via the `x-internal-secret` header injected by `proxy.ts`.

---

## Route UX Boundaries

All major route groups have `loading.tsx` (Skeleton-based) and `error.tsx` (Card with Try Again + Go Back) for streaming suspense and error recovery. All dynamic route segments have `not-found.tsx` for 404 handling.

---

## Pages

- `/` (landing)
- `/(auth)/login` (authentication)
- `/(auth)/register` (user self-registration with viewer role)
- `/(auth)/forgot-password` (password recovery via email token)
- `/(auth)/reset-password` (password reset with URL token)
- `/dashboard` (overview)
- `/sites` (site management)
- `/regions` (region management)
- `/devices` (device management)
- `/manufacturers` (manufacturer management)
- `/manufacturers/new` (create manufacturer)
- `/manufacturers/[id]` (manufacturer detail)
- `/manufacturers/[id]/edit` (edit manufacturer)
- `/tenants` (tenant management)
- `/access` (access log management)
- `/power` (power monitoring dashboard)
- `/cables` (cable management)
- `/topology` (network topology)
- `/reports` (export/import reports)
- `/admin/users` (user management, admin only)
- `/alerts` (alert dashboard with Rules/History/Channels tabs)
- `/api-docs` (interactive API reference)

---

## Tests

Located in `tests/` directory (mirrors `lib/` and `components/` structure):

- `tests/lib/validators/` — Unit tests for Zod validators (device, rack, tenant, access, cable, location, power)
- `tests/lib/auth/` — Unit tests for RBAC permission matrix
- `tests/lib/export/` — Unit tests for export/import utilities (csv-templates, xml, csv-import)
- `tests/lib/alerts/` — Unit tests for alert evaluators (power threshold, warranty expiry, rack capacity)

End-to-end tests in `e2e/`:

- `e2e/auth.spec.ts`
- `e2e/dashboard.spec.ts`
- `e2e/devices.spec.ts`

---

## Related Documentation

- [Tech Stack & Tooling](./tech-stack.md) — Detailed tooling reference
- [Go Microservices Architecture](./go-microservices.md) — Microservices overview
- [Kubernetes & Helm Deployment](./kubernetes.md) — Deployment architecture
- [Pitfalls](./pitfalls.md) — Common bug patterns
- [Development Workflow](./development-workflow.md) — Feature development procedures
