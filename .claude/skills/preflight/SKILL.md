---
name: preflight
description: "세션 시작 전 환경 사전 검증"
allowed-tools:
  [
    'Bash(bash scripts/preflight.sh:*)',
    'Bash(pg_isready:*)',
    'Bash(ps -p:*)',
  ]
---

# Preflight Environment Check Skill

세션 시작 전 환경이 올바르게 구성되었는지 검증합니다.

## Usage

```text
/preflight              # 전체 검사 (node_modules, .env, port 3000, Docker, PostgreSQL)
/preflight --no-db     # DB 제외 (순수 프론트엔드 작업)
/preflight --k8s       # kubectl 포함 (K8s 배포 세션)
```

## Instructions

1. Determine flags from user's invocation argument:
   - No argument → no extra flags (full check)
   - `--no-db` → pass `--no-db` to script
   - `--k8s` → pass `--k8s` to script

2. Run the verification script:

   ```bash
   bash scripts/preflight.sh [flags]
   ```

3. Parse the output and summarize in Korean:
   - 각 항목의 통과/실패 여부를 간략히 나열
   - FAIL 항목이 있으면 **해당 fix 명령어를 명시**하고 작업 중단 권고
   - 모두 통과 시: "✅ 환경 준비 완료. 작업을 시작합니다."

## Output Format

FAIL 항목이 있을 때:

```text
프리플라이트 결과:
✅ node_modules: 존재
✅ .env: 존재
✅ Port 3000: 사용 가능
❌ Docker: 실행되지 않음
   Fix: open -a Docker   (30초 대기 후 /preflight 재실행)
✅ PostgreSQL: 연결 가능

⚠️ 1개 항목 실패. Fix 명령어 실행 후 /preflight 재실행을 권장합니다.
```

전부 통과 시:

```text
프리플라이트 결과:
✅ node_modules / ✅ .env / ✅ Port 3000 / ✅ Docker / ✅ PostgreSQL

✅ 모든 환경 체크 통과. 작업을 시작합니다.
```
