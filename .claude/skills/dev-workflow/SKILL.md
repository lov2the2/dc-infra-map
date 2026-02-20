---
name: dev-workflow
description: "전체 개발 사이클 자동화: 개발 → 테스트 → 문서 → 커밋"
allowed-tools:
  [
    'Read',
    'Edit',
    'Write',
    'Bash(npm run build:*)',
    'Bash(npm run lint:*)',
    'Bash(npx tsc:*)',
    'Bash(npx shadcn@latest add:*)',
    'Bash(git add:*)',
    'Bash(git status:*)',
    'Bash(git commit:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git push:*)',
    'Bash(curl:*)',
    'Glob',
    'Grep',
    'Task',
    'Bash(touch:*)',
    'Bash(rm -f:*)',
    'Bash(ls -la:*)',
    'Bash(wc -l:*)',
    'Bash(cat /tmp/dcim-workflow-checkpoint.json:*)',
    'Bash(echo:*)',
  ]
---

# Development Workflow Skill

Complete feature development cycle with automated agent orchestration. Supports two execution modes.

## Flags

```text
/dev-workflow "feature description"          # Solo mode (default)
/dev-workflow --team "feature description"   # Team mode (parallel execution)
/dev-workflow --resume                       # Resume from checkpoint after rate limit interrupt
```

## Execution Modes

### Solo Mode (default)

Sequential subagent delegation. Use when:

- Simple changes (single component or page)
- Small bug fixes or patches
- Changes that require tight sequential dependency

### Team Mode

Parallel teammate spawning for faster execution. Use when:

- Large features touching multiple areas
- User explicitly requests team mode (`/dev-workflow --team "feature description"`)

Detect team mode via `--team` flag in the user's invocation argument.

## Solo Mode Workflow

### Stage 1: Development

Analyze the task and delegate to the `app-developer` agent:

- React components with shadcn/ui, Tailwind CSS
- TypeScript types
- Pages and layouts
- Responsive design

### Stage 2: Testing

Use `software-tester` agent to verify:

- `npm run build` passes
- `npm run lint` passes
- Visual verification (optional, via Playwright MCP)

### Stage 3: Documentation

Use `docs-refiner` agent to update:

- README.md (Korean) - user-facing changes
- CLAUDE.md (English) - architecture/technical changes

### Stage 4: Git Commit

Execute `/commit` skill:

- Conventional commit format with emoji
- Semantic versioning

## Team Mode Workflow

```text
Lead (you) orchestrates teammates:

[Lock] touch /tmp/claude-dev-workflow.lock  (suppress intermediate notifications)

Phase 1 - Development:
  └─ Teammate: app-developer (owns all source files)

Phase 2 - Verification (after Phase 1 completes):
  ├─ Teammate: software-tester (read-only verification)
  └─ Teammate: docs-refiner (owns *.md)

Phase 3 - Commit:
  └─ Lead synthesizes results -> /commit

[Unlock] rm -f /tmp/claude-dev-workflow.lock  (re-enable notifications)
```

### Notification Gate (Team Mode Only)

Team mode generates multiple intermediate notifications (teammate idle, phase transitions)
that can confuse the user. A lock file gates the Notification hook:

- **Create lock** at workflow start: `touch /tmp/claude-dev-workflow.lock`
- **Remove lock** after Phase 3 commit (or on error): `rm -f /tmp/claude-dev-workflow.lock`
- While lock exists, `.claude/hooks/notification-hook.sh` suppresses OS notifications
- Stale locks (>2 hours) are auto-cleaned by the hook script
- Solo mode does NOT use the lock (notifications fire normally)

### Phase 1: Development

1. Parse the user's feature request
2. **Create notification lock**: `touch /tmp/claude-dev-workflow.lock`
3. Spawn `app-developer` agent with full feature spec
4. Wait for completion
5. **[Verification Gate]** Independently verify ALL reported files (see below)
6. Write checkpoint: `phase: "development_done"` (see Checkpoint Protocol)

### Phase 1 Verification Gate (Mandatory)

After receiving the app-developer report, verify before proceeding:

```bash
# a. Confirm every reported file exists and is non-empty
ls -la <reported_file_1>
ls -la <reported_file_2>
# ... for all files in the report

# b. Spot-check for empty files
wc -l <reported_file_1>

# c. Build gate — MUST pass before Phase 2
npm run build
```

If verification fails:

- **1–3 files missing/broken** → fix directly as Lead, re-run `npm run build`
- **4+ files or structural issues** → re-task `app-developer` with specific corrections
- **Never proceed to Phase 2 until this gate passes**

### Phase 2: Verification & Documentation

After Phase 1 completes, spawn in parallel:

- `software-tester`: Provide the list of new/modified pages and UI flows from Phase 1 deliverables
- `docs-refiner`: Provide change summaries from Phase 1 for documentation updates

### Phase 2 Checkpoint

After Phase 2 (software-tester + docs-refiner) completes, write checkpoint:
`phase: "verification_done"`

### Phase 3: Synthesize & Commit

1. Collect all deliverables from teammates
2. Check for any blocking issues from software-tester
3. If all clear, write checkpoint: `phase: "documentation_done"`, then execute `/commit` skill
4. **Remove notification lock**: `rm -f /tmp/claude-dev-workflow.lock`
5. **Remove checkpoint**: `rm -f /tmp/dcim-workflow-checkpoint.json`
6. If issues found, **remove lock** and report to user (checkpoint remains for manual resume)

## Checkpoint Protocol

**Checkpoint file**: `/tmp/dcim-workflow-checkpoint.json`

### Format

```json
{
  "phase": "development_done",
  "feature": "<original feature description>",
  "mode": "solo|team",
  "files_modified": ["app/foo/page.tsx", "components/foo/bar.tsx"],
  "timestamp": "2026-02-20T10:30:00Z"
}
```

### Phase boundary writes

| Event | `phase` value written |
| ----- | --------------------- |
| Phase 1 complete + gate passed | `"development_done"` |
| Phase 2 complete | `"verification_done"` |
| Pre-commit (Phase 3) | `"documentation_done"` |
| All complete or error exit | `rm -f /tmp/dcim-workflow-checkpoint.json` |

### Writing a checkpoint

```bash
echo '{
  "phase": "development_done",
  "feature": "<feature>",
  "mode": "solo",
  "files_modified": ["<file1>", "<file2>"],
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
}' > /tmp/dcim-workflow-checkpoint.json
```

### Resuming with `--resume`

When invoked as `/dev-workflow --resume`:

1. Read `/tmp/dcim-workflow-checkpoint.json`
2. If file does not exist: "No checkpoint found. 처음부터 시작합니다." → ask for feature description
3. If file exists: report the checkpoint state in Korean, then continue from the next phase:
   - `"development_done"` → skip Phase 1, go to Phase 2 Verification Gate check, then Phase 2
   - `"verification_done"` → skip Phases 1–2, go to Phase 3 Commit
   - `"documentation_done"` → go directly to `/commit`
4. Note: checkpoint does NOT conflict with the lock file (`/tmp/claude-dev-workflow.lock`)
   — they serve different purposes (checkpoint = resume state, lock = notification suppression)

## Usage Examples

```text
# Solo mode (default)
/dev-workflow "데이터센터 맵 컴포넌트 구현"
/dev-workflow "사이트 헤더에 검색 기능 추가"

# Team mode (parallel execution)
/dev-workflow --team "데이터센터 인프라 대시보드 전체 구현"

# Resume after rate limit interrupt
/dev-workflow --resume
```

## Instructions

1. Parse the user's feature request and detect flags (`--team`, `--resume`)
2. If `--resume`: Follow Checkpoint Protocol resume flow (see above)
3. If `--team`: Follow Team Mode Workflow (parallel phases)
4. If solo: Follow Solo Mode Workflow (sequential stages)
5. Write checkpoint at each phase boundary
6. Report progress after each stage/phase completion
7. If any stage fails, stop and report the error (remove lock, keep checkpoint for resume)
8. Ask for confirmation before final commit

## Error Handling

- If build/lint fails -> Stop and report failing checks
- If documentation update fails -> Continue but warn
- If commit fails -> Report error, suggest manual resolution
- If a teammate fails -> Report which agent failed, allow manual retry
- **CRITICAL (Team Mode)**: Always `rm -f /tmp/claude-dev-workflow.lock` on ANY error exit to re-enable notifications
