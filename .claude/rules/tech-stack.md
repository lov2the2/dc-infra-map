# Tech Stack & Tooling

> Part of: DCIM Project
> See [CLAUDE.md](../../CLAUDE.md) for project overview.

---

## Dependencies

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

---

## Tailwind 4 Specifics

- CSS-first configuration in `app/globals.css` (no `tailwind.config.ts`)
- Color tokens use `oklch()` via CSS custom properties (`:root` and `.dark`)
- Dark mode variant: `@custom-variant dark (&:is(.dark, .dark *))` — both `.dark` and `.dark *` are required

---

## shadcn/ui

- Installed components: alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, navigation-menu, popover, progress, scroll-area, select, separator, sheet, skeleton, switch, table, tabs, textarea, tooltip
- Style: new-york | Base color: neutral | CSS variables: enabled
- Must install components before importing: `npx shadcn@latest add <component> -y`
- Use correct Radix UI props: `onOpenChange` (not `onClose`), `onCheckedChange` (not `onChange`), `onValueChange` (not `onSelect`)

---

## Vitest

- Configuration file: `vitest.config.ts` (node environment, globals enabled, path alias support)
- Test files location: `tests/` directory (mirrors `lib/` and `components/` structure)
- Coverage measurement available with `npm run test:coverage`
- Unit tests cover: validators (device, rack, tenant, access, cable, location, power), RBAC permission matrix, export/import utilities (csv-templates, xml, csv-import), and alert evaluators (power threshold, warranty expiry, rack capacity)

---

## Playwright (E2E)

- Configuration file: `playwright.config.ts` (chromium, webServer auto-start on port 3000)
- Test files location: `e2e/` directory (auth.spec.ts, dashboard.spec.ts, devices.spec.ts)
- Setup: `npx playwright install` to download browser binaries

---

## Database Migrations

- `drizzle/0001_timescaledb_setup.sql` — TimescaleDB hypertable setup for `power_readings` (applied via `npm run db:timescale` or `npm run db:setup`)
- `drizzle/README.md` — Migration documentation and instructions

---

## Related Documentation

- [Codebase Map](./codebase-map.md) — File structure and conventions
- [Kubernetes & Helm Deployment](./kubernetes.md) — Deployment tools
- [Environment Variables](./environment.md) — Configuration
