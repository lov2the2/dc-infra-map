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

## Architecture

**Layout chain**: `app/layout.tsx` wraps all pages with `ThemeProvider` → `SiteHeader` → `main` → `SiteFooter`.

**Key conventions**:

- `config/site.ts` — Centralized site metadata, nav links, CTA links, footer config
- `types/index.ts` — Shared TypeScript interfaces
- `lib/utils.ts` — `cn()` utility (clsx + tailwind-merge)
- `components/ui/` — shadcn/ui primitives (install new ones with `npx shadcn@latest add <name> -y`)
- `components/layout/` — Site-wide layout components (header, footer, mobile nav)
- `components/theme/` — Theme provider and toggle

**Path alias**: `@/*` maps to project root.

**Custom container**: Defined as `@utility container` in `globals.css` (max-width: 1280px, auto margins, 2rem inline padding). Pages should not add redundant `container`/`max-w-*` classes.

## Tailwind 4 Specifics

- CSS-first configuration in `app/globals.css` (no `tailwind.config.ts`)
- Color tokens use `oklch()` via CSS custom properties (`:root` and `.dark`)
- Dark mode variant: `@custom-variant dark (&:is(.dark, .dark *))` — both `.dark` and `.dark *` are required

## shadcn/ui

- Installed components: button, card, dropdown-menu, sheet
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
