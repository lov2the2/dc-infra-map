# Common Pitfalls - Pre-Development Checklist

> **Purpose**: Prevent recurring bug patterns with actionable checklists
> **Project**: Next.js 16 Data Center Infrastructure Map

---

## Radix UI Component Props

### Before Using shadcn/ui Components

**Quick Reference:**

| Component | Correct Prop | Wrong Prop |
| --------- | ------------ | ---------- |
| Dialog | `onOpenChange` | `onClose` |
| Checkbox | `onCheckedChange` | `onChange` |
| Select | `onValueChange` | `onSelect` |
| Accordion | `onValueChange` | `onClick` |

**Dialog Pattern:**

```tsx
// Use DialogTrigger
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>...</DialogContent>
</Dialog>
```

**Reference**: <https://ui.shadcn.com/docs/components>

---

## shadcn/ui Component Installation

### Before Using New Components

**CRITICAL**: shadcn/ui components must be installed before use. They are NOT included by default.

**Checklist:**

- [ ] Check if component exists in `components/ui/`
- [ ] If not, install with: `npx shadcn@latest add <component-name> -y`
- [ ] Verify import path: `@/components/ui/<component-name>`

**Symptom**: `Module not found: Can't resolve '@/components/ui/<name>'`
**Fix**: Run `npx shadcn@latest add <name> -y` in project root

**Currently Installed Components** (check `components/ui/`):

- alert, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, form, input, label, popover, progress, scroll-area, select, separator, sheet, skeleton, table, tabs, textarea, tooltip

---

## SSR Hydration

### Before Using Browser APIs

- [ ] Component marked with `'use client'` if using `window`, `localStorage`, etc.
- [ ] Browser-specific code wrapped in `useEffect`
- [ ] Date formatting deferred to client-side
- [ ] No `Math.random()` in render function

**Pattern for Client-Only State:**

```tsx
'use client'
export default function Component() {
    const [state, setState] = useState<string | null>(null)

    useEffect(() => {
        setState(localStorage.getItem('key'))
    }, [])

    if (!state) return null  // or skeleton
    return <div>{state}</div>
}
```

---

## Page Layout Consistency

### Before Creating Pages

- [ ] Check existing layout patterns in `app/layout.tsx`
- [ ] No duplicate `container`, `mx-auto`, `max-w-*` classes if layout already provides them
- [ ] Consistent spacing approach across pages

**Correct Pattern:**

```tsx
// app/some-page/page.tsx
export default function SomePage() {
    return (
        <div className="space-y-6">
            <h1>Title</h1>
            <Card>...</Card>
        </div>
    )
}
```

---

## Redirect URL Security

### Before Implementing Login Redirects

**Open Redirect Attack Prevention:**

- [ ] Validate redirect URL starts with `/` (internal path only)
- [ ] Block `//` prefix (protocol-relative URLs)
- [ ] Block absolute URLs (`http://`, `https://`, `javascript:`)
- [ ] Provide safe fallback (e.g., `/`)

**Correct Pattern:**

```ts
export function isValidRedirectUrl(url: string): boolean {
    return url.startsWith('/') && !url.startsWith('//')
}

export function getSafeRedirectUrl(redirect: string | null): string {
    if (!redirect || !isValidRedirectUrl(redirect)) {
        return '/'  // Safe default
    }
    return redirect
}
```

---

## Tailwind 4 Dark Mode Configuration

### Dark Mode Variant Not Working

**Symptom**: `dark:` classes not applying correctly, UI looks wrong in light/dark mode

**Root Cause**: Tailwind 4 uses `@custom-variant` for dark mode. Incorrect selector breaks theming.

**Correct Configuration** (`globals.css`):

```css
@custom-variant dark (&:is(.dark, .dark *));
```

**Wrong Configuration**:

```css
@custom-variant dark (&:is(.dark *));  /* Missing .dark itself */
```

**Why**: The selector must include both `.dark` (the html element) AND `.dark *` (descendants).

**Verification**:

```bash
# In browser console:
document.documentElement.className  // Should be "light" or "dark"
```

---

## Quick Diagnosis Reference

| Symptom | First Check | Location |
| ------- | ----------- | -------- |
| Prop TypeScript error | shadcn/ui docs for component | <https://ui.shadcn.com/docs> |
| UI flickers | Browser API in render | Add `'use client'` + `useEffect` |
| Page too narrow | Redundant container class | Remove `container`, `max-w-*` from page |
| Redirect to external site | Open Redirect vulnerability | Validate with `isValidRedirectUrl` |
| Module not found (ui component) | shadcn/ui component not installed | Run `npx shadcn@latest add <name> -y` |
| dark: styles not working | Tailwind 4 dark variant selector | Fix `@custom-variant` in `globals.css` |

---

## Automated Verification

### Run Before Commit

```bash
# Type check + build
npm run build

# Lint
npm run lint
```
