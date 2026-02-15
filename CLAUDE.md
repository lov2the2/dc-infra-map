# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Data Center Infrastructure Map (DCIM) — a Next.js 16 web application for data center infrastructure management and visualization. Currently in early development (starter kit scaffold). See [ROADMAP.md](./ROADMAP.md) for the complete project vision, technical strategy, and implementation phases.

## Commands

- `npm run dev` — Start development server (http://localhost:3000)
- `npm run build` — Production build (also serves as type-check)
- `npm run lint` — ESLint with Next.js core-web-vitals and TypeScript rules
- No test framework is configured yet

## Tech Stack

- **Next.js 16.1.6** with App Router (React 19, server components by default)
- **Tailwind CSS 4** with `@custom-variant dark (&:is(.dark, .dark *))` for dark mode
- **shadcn/ui** (new-york style, RSC-enabled, Lucide icons)
- **next-themes** for dark/light theme switching (class-based, system default)
- **exceljs** for Excel (.xlsx) file generation
- **fast-xml-parser** for XML export

## Architecture

**Layout chain**: `app/layout.tsx` wraps all pages with `ThemeProvider` → `SiteHeader` → `main` → `SiteFooter`.

**Key conventions**:

- `config/site.ts` — Centralized site metadata, nav links, CTA links, footer config
- `types/index.ts` — Shared TypeScript interfaces
- `types/cable.ts` — Cable, interface, and port type definitions
- `lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `lib/export/` — Export/import utilities (excel.ts, xml.ts, csv-import.ts, csv-templates.ts)
- `components/ui/` — shadcn/ui primitives (install new ones with `npx shadcn@latest add <name> -y`)
- `components/layout/` — Site-wide layout components (header, footer, mobile nav)
- `components/theme/` — Theme provider and toggle
- `components/common/` — Shared components (page-header, status-badge, confirm-dialog, data-table, export-button, audit-log-table)
- `components/cables/` — Cable management components (table, filters, form, status badge, trace view, termination select, interface/port lists)
- `components/reports/` — Reports page components (export-card, export-filters, import-dialog, import-preview, import-result)
- `components/topology/` — Network topology visualization

**Database schema** (`db/schema/`):

- `cables.ts` — Tables: `interfaces`, `consolePorts`, `rearPorts`, `frontPorts`, `cables`
- `enums.ts` — Enums include: `cableTypeEnum`, `cableStatusEnum`, `interfaceTypeEnum`, `portSideEnum`

**API routes**:

- `/api/interfaces` — Interface CRUD
- `/api/console-ports` — Console port CRUD
- `/api/front-ports` — Front port CRUD
- `/api/rear-ports` — Rear port CRUD
- `/api/cables` — Cable CRUD
- `/api/cables/trace/[id]` — Cable path tracing
- `/api/export/{racks,devices,cables,access,power}` — Excel export endpoints
- `/api/export/xml/{racks,devices}` — XML export endpoints
- `/api/import/{devices,cables}` — CSV import endpoints
- `/api/import/templates/[type]` — CSV template downloads

**State management**:

- `stores/use-cable-store.ts` — Cable management Zustand store

**Pages**: `/cables` (cable management), `/topology` (network topology), `/reports` (export/import reports)

**Path alias**: `@/*` maps to project root.

**Custom container**: Defined as `@utility container` in `globals.css` (max-width: 1280px, auto margins, 2rem inline padding). Pages should not add redundant `container`/`max-w-*` classes.

## Tailwind 4 Specifics

- CSS-first configuration in `app/globals.css` (no `tailwind.config.ts`)
- Color tokens use `oklch()` via CSS custom properties (`:root` and `.dark`)
- Dark mode variant: `@custom-variant dark (&:is(.dark, .dark *))` — both `.dark` and `.dark *` are required

## shadcn/ui

- Installed components: alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, table, tabs, textarea, tooltip
- Style: new-york | Base color: neutral | CSS variables: enabled
- Must install components before importing: `npx shadcn@latest add <component> -y`
- Use correct Radix UI props: `onOpenChange` (not `onClose`), `onCheckedChange` (not `onChange`), `onValueChange` (not `onSelect`)

## Documentation Index

- **[ROADMAP.md](./ROADMAP.md)** — Project vision, technical stack decisions, data models, implementation roadmap, and risk analysis (Korean)
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
