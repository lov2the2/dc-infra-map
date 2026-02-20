# Agent Output Verification Protocol

> **Purpose**: Prevent acting on unverified agent reports
> **Project**: Next.js 16 Data Center Infrastructure Map

---

## Core Rule

**Never trust agent completion reports at face value. Always verify with shell commands.**

Agent reports like "13 files created" may not reflect reality. The lead agent must
independently confirm all claimed work before proceeding to the next phase.

---

## Verification Steps After Agent Completion

### Step 1: File Existence Check

```bash
# Verify each reported file exists
ls -la <claimed_file_path>

# For multiple files (one per line)
ls -la app/foo/page.tsx components/foo/bar.tsx lib/foo.ts
```

What to look for:

- File exists (no "No such file or directory" error)
- File size > 0 bytes (empty files indicate incomplete generation)
- Timestamp is recent (matches the agent run time)

### Step 2: Content Spot-Check

```bash
# Detect empty files
wc -l <file>

# Quick content preview
head -20 <file>
```

Red flags:

- 0 lines → file is empty, agent reported false completion
- Generic placeholder content (`// TODO: implement`) without actual code
- Import paths that don't match the project's path alias (`@/*`)

### Step 3: Build Gate (Mandatory)

```bash
npm run build
```

**This is non-negotiable.** Never proceed to the next phase until `npm run build` passes.

- Agent-reported "build passed" is not sufficient
- Run it yourself and confirm the output
- TypeScript errors caught here are cheaper to fix than after Phase 2 starts

---

## Phase Gate Checklist Template

Copy this before each phase transition:

```text
Phase [N] → Phase [N+1] Gate Check:

[ ] ls -la <file1_path>         # exists, non-empty
[ ] ls -la <file2_path>         # exists, non-empty
[ ] wc -l <file1_path>          # sanity: > 0 lines
[ ] npm run build               # MUST PASS
[ ] npm run lint                # MUST PASS (or note known suppressed warnings)

Gate: [ ] PASS → proceed to next phase
      [ ] FAIL → fix before continuing (do NOT proceed)
```

---

## When Verification Fails

### Small discrepancies (1–3 files missing or broken)

Fix directly as Lead agent:

1. Read the relevant context (what the file should contain)
2. Implement the missing piece directly
3. Re-run `npm run build` before proceeding

### Large discrepancies (4+ files or structural issues)

Re-task the `app-developer` agent with specific corrections:

```text
The following files are missing or incomplete:
- <file1>: expected <description>, found <what you observed>
- <file2>: file is empty (0 bytes)

Please fix only these specific issues. Do not modify other files.
After fixing, report the corrected file list.
```

**Important:** Do NOT proceed to Phase 2 until Phase 1 verification passes completely.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong | Correct Action |
| ------------ | -------------- | -------------- |
| "Agent said build passed" | Agent reports can be wrong | Run `npm run build` yourself |
| Skip verification when agent is confident | Confidence ≠ correctness | Always verify with `ls` |
| Check only some files from a large list | Partial check misses issues | Verify all reported files |
| Move to Phase 2 on partial success | Compounds errors downstream | Fix Phase 1 completely first |
| Assume agent count is accurate | Agents overcount | Count files with `ls` yourself |

---

## Reference

- **dev-workflow skill**: `.claude/skills/dev-workflow/SKILL.md`
- **app-developer agent**: `.claude/agents/app-developer.md`
- **pitfalls checklist**: `.claude/rules/pitfalls.md`
