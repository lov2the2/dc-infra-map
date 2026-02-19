# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Center Infrastructure Map (DCIM) — a Next.js 16 web application for data center infrastructure management and visualization. Currently in early development (starter kit scaffold). See [ROADMAP.md](./docs/ROADMAP.md) for the complete project vision, technical strategy, and implementation phases.

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

**Instrumentation**: `instrumentation.ts` (project root) — Next.js instrumentation hook; initializes the report scheduler on Node.js server startup.

**Scripts** (`scripts/`):

- `server-start.sh` — Starts `npm run dev` in background; checks port 3000 availability; polls for readiness (max 15s); saves PID to `.server.pid`, logs to `.server.log`
- `server-stop.sh` — Stops server via PID file or port 3000 process lookup; SIGTERM then SIGKILL if needed; cleans up PID file
- `server-restart.sh` — Sequentially runs stop → 1s delay → start

**Key conventions**:

- `config/site.ts` — Centralized site metadata, nav links, CTA links, footer config
- `types/index.ts` — Shared TypeScript interfaces
- `types/entities.ts` — Entity type definitions (Site, Rack, Device, Tenant, etc.)
- `types/cable.ts` — Cable, interface, and port type definitions
- `types/alerts.ts` — Alert type definitions
- `types/next-auth.d.ts` — NextAuth type augmentation (session user with role)
- `lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `lib/api.ts` — API client utility
- `lib/auth/rbac.ts` — RBAC permission matrix and check functions (`checkPermission`, `isAdmin`, `canWrite`, `canDelete`)
- `lib/auth/with-auth.ts` — `withAuth(resource, action, handler)` HOF for API route auth+RBAC boilerplate; `withAuthOnly(handler)` for auth-only routes
- `lib/audit.ts` — Centralized audit logging (`logAudit`, `logLoginEvent`, `logExportEvent`)
- `lib/validators/` — Zod validation schemas (device, rack, tenant, location, access, power, cable)
- `lib/export/` — Export/import utilities (excel.ts, xml.ts, csv-import.ts, csv-templates.ts)
- `tests/lib/validators/` — Unit tests for Zod validators (device, rack, tenant, access, cable, location, power)
- `tests/lib/auth/` — Unit tests for RBAC permission matrix
- `tests/lib/export/` — Unit tests for export/import utilities (csv-templates, xml, csv-import)
- `tests/lib/alerts/` — Unit tests for alert evaluators (power threshold, warranty expiry, rack capacity)
- `lib/rate-limit.ts` — In-memory sliding window rate limiter (`checkRateLimit`, `getClientIdentifier`, `rateLimitResponse`, `RATE_LIMITS` presets: auth 10/min, exportImport 20/min, api 200/min)
- `lib/alerts/` — Alert evaluation engine and notification service
- `lib/scheduler/report-scheduler.ts` — Cron-based report scheduler (initScheduler, stopScheduler, reloadSchedule); loads active schedules from DB on startup
- `lib/mailer/report-mailer.ts` — Nodemailer SMTP mailer for scheduled report email delivery with Excel attachments
- `lib/swagger/openapi.ts` — OpenAPI 3.1.1 specification for all API routes
- `lib/power/mock-generator.ts` — Power mock data generator for development
- `components/ui/` — shadcn/ui primitives (install new ones with `npx shadcn@latest add <name> -y`)
- `components/layout/` — Site-wide layout components (header, footer, mobile nav, user-nav)
- `components/theme/` — Theme provider and toggle
- `components/providers/` — Context providers (session-provider)
- `components/common/` — Shared components (page-header, status-badge, confirm-dialog, data-table, export-button, audit-log-table, command-palette)
- `components/admin/` — Admin components (user-table, user-form, user-role-badge)
- `components/devices/` — Device management components (device-table with bulk select/status-change/delete, device-filters, device-form, device-audit-log)
- `components/tenants/` — Tenant management components (tenant-table, tenant-form, tenant-delete-button)
- `components/floor-plan/` — Floor plan visualization (floor-plan-grid, rack-card)
- `components/rack/` — Rack elevation components (rack-elevation-client, multi-rack-elevation-client, rack-face-toggle, rack-grid, rack-slot, device-block, rack-header); multi-rack-elevation-client provides a single DndContext for cross-rack drag-and-drop; rack-grid/rack-slot/device-block accept rackId props for multi-rack context
- `components/access/` — Access management components (access-log-list, check-in-form, check-out-dialog, equipment-movement-list/form, movement-approval-dialog)
- `components/power/` — Power monitoring components (power-dashboard, power-panel-list/form, power-feed-list/form, power-gauge, rack-power-grid, sse-connection-indicator)
- `components/cables/` — Cable management components (table, filters, form, status badge, trace view, termination select, interface/port lists)
- `components/reports/` — Reports page components (export-card, export-filters, import-dialog, import-preview, import-result, schedule-table, schedule-form)
- `components/topology/` — Network topology visualization (accurate per-interface port utilization via cable terminations, patch panel tracing with front/rear port lookup and dashed-line rendering)
- `components/alerts/` — Alert components (severity-badge, alert-stats-card, alert-rules-table, alert-rule-form, alert-history-table, channel-config)

**Database schema** (`db/schema/`):

- `enums.ts` — Enums include: `userRoleEnum` (admin/operator/viewer/tenant_viewer), `auditActionTypeEnum` (login/api_call/asset_view/export), `cableTypeEnum`, `cableStatusEnum`, `interfaceTypeEnum`, `portSideEnum`, `alertRuleTypeEnum` (power_threshold/warranty_expiry/rack_capacity), `alertSeverityEnum` (critical/warning/info), `notificationChannelTypeEnum` (slack_webhook/email/in_app), `conditionOperatorEnum`
- `auth.ts` — Tables: `users`, `accounts`, `sessions`, `verificationTokens`
- `core.ts` — Tables: `manufacturers`, `tenants`, `sites`, `locations`, `racks`
- `devices.ts` — Tables: `deviceTypes`, `devices` (devices includes `warrantyExpiresAt` nullable timestamp)
- `access.ts` — Tables: `accessLogs`, `equipmentMovements`
- `power.ts` — Tables: `powerPanels`, `powerFeeds`, `powerPorts`, `powerOutlets`, `powerReadings`
- `cables.ts` — Tables: `interfaces`, `consolePorts`, `rearPorts`, `frontPorts`, `cables`
- `audit.ts` — `auditLogs` table with `actionType`, `ipAddress`, `userAgent` columns for enhanced audit
- `alerts.ts` — Tables: `alertRules`, `alertHistory`, `notificationChannels`
- `reports.ts` — Tables: `reportSchedules`
- `relations.ts` — Drizzle ORM relation definitions (includes `powerReadingsRelations`)
- `index.ts` — Schema barrel export

**API routes**:

- `/api/auth/[...nextauth]` — NextAuth authentication (login/logout/session)
- `/api/sites` — Site CRUD
- `/api/sites/[id]` — Single site GET/PATCH/DELETE
- `/api/regions` — Region CRUD
- `/api/regions/[id]` — Single region GET/PATCH/DELETE
- `/api/racks` — Rack CRUD
- `/api/racks/[id]` — Single rack GET/PATCH/DELETE
- `/api/devices` — Device CRUD
- `/api/devices/[id]` — Single device GET/PATCH/DELETE
- `/api/device-types` — Device type CRUD
- `/api/device-types/[id]` — Single device type GET/PATCH/DELETE
- `/api/manufacturers` — Manufacturer listing
- `/api/tenants` — Tenant CRUD
- `/api/tenants/[id]` — Single tenant GET/PATCH/DELETE
- `/api/locations` — Location CRUD
- `/api/locations/[id]` — Single location GET/PATCH/DELETE
- `/api/access-logs` — Access log CRUD
- `/api/access-logs/[id]` — Single access log GET/PATCH/DELETE
- `/api/equipment-movements` — Equipment movement CRUD
- `/api/equipment-movements/[id]` — Single equipment movement GET/PATCH/DELETE
- `/api/power/panels` — Power panel CRUD
- `/api/power/panels/[id]` — Single power panel GET/PATCH/DELETE
- `/api/power/feeds` — Power feed CRUD
- `/api/power/feeds/[id]` — Single power feed GET/PATCH/DELETE
- `/api/power/readings` — Power readings CRUD (POST inserts to DB, GET queries DB with mock fallback)
- `/api/power/sse` — Power SSE real-time streaming
- `/api/power/summary` — Power summary GET
- `/api/interfaces` — Interface CRUD
- `/api/interfaces/[id]` — Single interface GET/PATCH/DELETE
- `/api/console-ports` — Console port CRUD
- `/api/console-ports/[id]` — Single console port GET/PATCH/DELETE
- `/api/front-ports` — Front port CRUD
- `/api/front-ports/[id]` — Single front port GET/PATCH/DELETE
- `/api/rear-ports` — Rear port CRUD
- `/api/rear-ports/[id]` — Single rear port GET/PATCH/DELETE
- `/api/cables` — Cable CRUD
- `/api/cables/[id]` — Single cable GET/PATCH/DELETE
- `/api/cables/trace/[id]` — Cable path tracing
- `/api/audit-logs` — Audit log listing
- `/api/export/{racks,devices,cables,access,power}` — Excel export endpoints
- `/api/export/xml/{racks,devices}` — XML export endpoints
- `/api/import/{devices,cables}` — CSV import endpoints
- `/api/import/templates/[type]` — CSV template downloads
- `/api/admin/users` — User management CRUD (admin only)
- `/api/admin/users/[id]` — Single user GET/PATCH/DELETE (admin only)
- `/api/alerts/rules` — Alert rule CRUD
- `/api/alerts/rules/[id]` — Single alert rule GET/PATCH/DELETE
- `/api/alerts/history` — Alert history GET
- `/api/alerts/history/[id]/acknowledge` — Acknowledge alert PATCH
- `/api/alerts/channels` — Notification channel CRUD
- `/api/alerts/channels/[id]` — Single channel GET/PATCH/DELETE
- `/api/alerts/evaluate` — Manual alert evaluation trigger POST
- `/api/reports/schedules` — Report schedule CRUD (GET list, POST create)
- `/api/reports/schedules/[id]` — Single schedule GET/PATCH/DELETE
- `/api/reports/schedules/[id]/run` — Immediate schedule execution POST
- `/api-docs` — Interactive API reference (Scalar UI, serves OpenAPI spec)

**State management**:

- `stores/use-site-store.ts` — Site management Zustand store
- `stores/use-rack-store.ts` — Rack management Zustand store (multi-rack support: `racks[]`, `setRacks()`, `moveDeviceBetweenRacks()` with optimistic update and rollback)
- `stores/use-device-store.ts` — Device management Zustand store
- `stores/use-access-store.ts` — Access management Zustand store
- `stores/use-power-store.ts` — Power monitoring Zustand store
- `stores/use-cable-store.ts` — Cable management Zustand store
- `stores/use-alert-store.ts` — Alert management Zustand store

**RBAC**: All API routes use `withAuth(resource, action, handler)` from `lib/auth/with-auth.ts`, which wraps auth + RBAC permission checking. Permission matrix (in `lib/auth/rbac.ts`) covers 13 resources × 4 roles. Admin routes (`/admin/*`, `/api/admin/*`) are protected by middleware role check. Alert resources: `alert_rules` (admin/operator/viewer), `alert_channels` (admin only), `alert_history` (admin/operator/viewer).

**Route UX boundaries**: All major route groups have `loading.tsx` (Skeleton-based) and `error.tsx` (Card with Try Again + Go Back) for streaming suspense and error recovery. All dynamic route segments have `not-found.tsx` for 404 handling.

**Pages**: `/` (landing), `/(auth)/login` (authentication), `/dashboard` (overview), `/sites` (site management), `/regions` (region management), `/devices` (device management), `/tenants` (tenant management), `/access` (access log management), `/power` (power monitoring dashboard), `/cables` (cable management), `/topology` (network topology), `/reports` (export/import reports), `/admin/users` (user management, admin only), `/alerts` (alert dashboard with Rules/History/Channels tabs), `/api-docs` (interactive API reference)

**Path alias**: `@/*` maps to project root.

**Custom container**: Defined as `@utility container` in `globals.css` (max-width: 1280px, auto margins, 2rem inline padding). Pages should not add redundant `container`/`max-w-*` classes.

## Tailwind 4 Specifics

- CSS-first configuration in `app/globals.css` (no `tailwind.config.ts`)
- Color tokens use `oklch()` via CSS custom properties (`:root` and `.dark`)
- Dark mode variant: `@custom-variant dark (&:is(.dark, .dark *))` — both `.dark` and `.dark *` are required

## shadcn/ui

- Installed components: alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, tooltip
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

**SMTP Configuration** (for scheduled report email delivery):

- `SMTP_HOST` — SMTP server hostname
- `SMTP_PORT` — SMTP server port
- `SMTP_USER` — SMTP authentication username
- `SMTP_PASS` — SMTP authentication password
- `SMTP_FROM` — Sender email address for scheduled report emails

See `.env.example` for configuration template.

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
