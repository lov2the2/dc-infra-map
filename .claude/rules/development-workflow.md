# Development Workflow Guide

> **Purpose**: Standard procedures for feature development

---

## Feature Development Flow

### 1. Planning Phase

```bash
# Create feature branch (if using git flow)
git checkout -b feature/my-feature

# Start dev server
npm run dev
```

### 2. Development

**Order**: Types → Components → Pages

```bash
# 1. Define types
# types/index.ts or types/<feature>.ts

# 2. Build components
# components/<feature>/<component-name>.tsx

# 3. Create/update page
# app/<route>/page.tsx
```

**Pre-commit Checks:**

- [ ] Correct Radix UI props (`onOpenChange`, not `onClose`)
- [ ] `'use client'` for browser APIs
- [ ] No redundant `container` classes in pages
- [ ] shadcn/ui components installed before use
- [ ] TypeScript compiles: `npm run build`

---

### 3. Testing

```bash
# Build check
npm run build

# Lint
npm run lint

# Manual testing
npm run dev
# Open http://localhost:3000 and test feature
```

---

### 4. Documentation

**Update relevant docs:**

- [ ] `CLAUDE.md` if architecture changed
- [ ] `README.md` if user-facing feature
- [ ] `.claude/rules/pitfalls.md` if new bug pattern found

---

### 5. Commit

```bash
# Stage changes
git add <specific-files>

# Use conventional commit
/commit  # or git commit -m "feat: Add feature"

# Push
git push origin feature/my-feature
```

---

## Automated Workflow

Use `/dev-workflow` skill for end-to-end automation. See `.claude/skills/dev-workflow/SKILL.md` for details.

---

## Markdown Lint Rules (markdownlint)

All `.md` files in this project must pass markdownlint with zero warnings.
Claude Code must enforce these rules when creating or editing markdown files.

### Required Rules

| Rule | Description | Fix |
| ---- | ----------- | --- |
| MD031 | Fenced code blocks need blank lines above and below | Add blank line before ` ``` ` and after ` ``` ` |
| MD032 | Lists need blank lines above and below | Add blank line before first `- ` item |
| MD034 | No bare URLs | Wrap in `<url>` or `[text](url)` |
| MD058 | Tables need blank lines above and below | Add blank line before `\| header \|` row |
| MD060 | Table separator needs spaces | Use `\| --- \|` not `\|---\|` |

### Common Pattern (Bold + List)

```markdown
<!-- Wrong: No blank line between bold text and list -->
**Checklist:**
- [ ] Item one

<!-- Correct: Blank line separates bold text from list -->
**Checklist:**

- [ ] Item one
```

### Common Pattern (Bold + Code Block)

```markdown
<!-- Wrong: No blank line between bold text and code block -->
**Example:**
` `` `bash
echo "hello"
` `` `

<!-- Correct: Blank line separates bold text from code block -->
**Example:**

` `` `bash
echo "hello"
` `` `
```

### Verification

```bash
# IDE diagnostics check (VS Code with markdownlint extension)
# Or use CLI:
npx markdownlint-cli2 ".claude/rules/*.md" "CLAUDE.md"
```

---

## Pre-Commit Checklist Summary

- [ ] Correct Radix UI props
- [ ] `'use client'` for browser APIs
- [ ] TypeScript compiles: `npm run build`
- [ ] ESLint passes: `npm run lint`
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] No console errors in browser
- [ ] Markdown files pass lint (zero warnings)

---

## Reference

- **Pitfalls**: `.claude/rules/pitfalls.md`
- **Main Docs**: `CLAUDE.md`
