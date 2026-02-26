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

## Microservice Contract Validation

Go 핸들러 필드를 추가/수정할 때 **TypeScript 타입과 OpenAPI 스펙이 일치하는지** 반드시 검증해야 합니다.

### JSONB 컬럼 처리 규칙

PostgreSQL JSONB 컬럼을 Go에서 스캔할 때 **반드시 `json.RawMessage`를 사용**하세요:

```go
// ❌ 잘못된 방법 — 이중 직렬화 발생
type row struct {
    Config string `json:"config"` // JSONB → string → JSON 재직렬화
}

// ✅ 올바른 방법
type row struct {
    Config json.RawMessage `json:"config"` // JSONB → raw bytes → 그대로 응답
}

// nil 가드 필수
if r.Config == nil {
    r.Config = json.RawMessage("{}")
}
```

**이중 직렬화 증상**: API 응답에서 객체/배열이 아닌 문자열이 오는 경우
- 배열: `"[\"id1\",\"id2\"]"` (string) → `["id1","id2"]` (array)가 되어야 함
- 객체: `"{\"url\":\"...\"}"` (string) → `{"url":"..."}` (object)가 되어야 함

### Go 핸들러 변경 시 체크리스트

- [ ] JSONB 컬럼 → `json.RawMessage` (NOT `string`)
- [ ] nil 가드 추가: 배열은 `json.RawMessage("[]")`, 객체는 `json.RawMessage("{}")`
- [ ] `lib/swagger/openapi.ts` OpenAPI 스펙 업데이트
- [ ] `types/` TypeScript 타입 업데이트
- [ ] curl로 실제 응답 검증:

```bash
# config 필드가 string이 아닌 object로 오는지 확인
curl http://localhost:8082/api/alerts/channels | jq '.data[0].config | type'
# Expected: "object" (not "string")

curl http://localhost:8082/api/alerts/rules | jq '.data[0].notificationChannels | type'
# Expected: "array" (not "string")
```

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
