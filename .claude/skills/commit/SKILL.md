---
name: commit
description: "빌드 검증 → 커밋 → 푸시 자동화 (프로젝트 전용)"
allowed-tools:
  [
    'Bash(npm run build:*)',
    'Bash(npm run lint:*)',
    'Bash(git add:*)',
    'Bash(git status:*)',
    'Bash(git commit:*)',
    'Bash(git diff:*)',
    'Bash(git log:*)',
    'Bash(git push:*)',
    'Bash(git reset:*)',
  ]
---

# Project Commit Skill

Verified commit workflow: build check → stage → commit → push.

## Process

### Step 1: Build Verification

Run build and lint checks. Fix errors before proceeding.

```bash
npm run build
npm run lint
```

If either fails, stop and fix the errors first. Do NOT commit broken code.

### Step 2: Review Changes

```bash
git status
git diff --staged
git diff
```

Analyze all changes and determine if they should be one commit or split.

### Step 3: Stage Files

```bash
git add <specific-files>
```

**Exclusion rules:**

- NEVER stage `.claude/settings.local.json`
- NEVER stage `.env` files or files containing secrets
- If `.claude/settings.local.json` is staged, unstage it: `git reset HEAD .claude/settings.local.json`

### Step 4: Commit

Use emoji conventional format:

`<emoji> <type>(<scope>): <description>`

**Rules:**

- Imperative tone, first line under 72 chars
- Atomic commits (single purpose)
- NO Claude co-author signature
- Split unrelated changes into separate commits

### Step 5: Push

```bash
git push
```

Confirm push succeeded. If rejected, report the error.

## Usage

```text
/commit
/commit "Add data center map component"
```
