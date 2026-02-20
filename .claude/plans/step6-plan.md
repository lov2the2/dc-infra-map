# Step 6 실행 계획 — DC Infra Map

> **작성일**: 2026-02-18
> **기준 커밋**: `45a57ff` (TimescaleDB + E2E 인프라 완료 시점)
> **목표**: ROADMAP Step 6 미완성 항목 7개 순차 구현

---

## 작업 목록 (우선순위 순)

| # | 작업 | 난이도 | 예상 범위 | 요청 명령어 |
|---|------|--------|-----------|-------------|
| 1 | SQL 스크립트 위치 정리 | ★☆☆ | 파일 이동 + CLAUDE.md 업데이트 | `/step6-1` |
| 2 | Region 관리 UI/API | ★★☆ | API 2개 + 페이지 1개 + 사이드바 링크 | `/step6-2` |
| 3 | Playwright E2E 테스트 | ★★☆ | 5개 spec 파일 (인증 포함 플로우) | `/step6-3` |
| 4 | TimescaleDB Drizzle 통합 | ★★☆ | 마이그레이션 자동화 + npm script | `/step6-4` |
| 5 | 상면 도면 2D 배치 | ★★★ | SVG/Canvas 기반 플로어 플랜 | `/step6-5` |
| 6 | 정기 리포트 스케줄링 | ★★★ | cron + nodemailer 이메일 발송 | `/step6-6` |
| 7 | LDAP/AD 연동 | ★★★ | Auth.js LDAP Provider 추가 | `/step6-7` |

---

## 작업 1: SQL 스크립트 위치 정리

### 배경

`scripts/` 디렉토리에 있는 SQL 파일들이 `db/` 디렉토리 구조와 분리되어 있음.

**현재 상태**:

```text
scripts/
├── create-hypertable.sql   ← db/scripts/ 로 이동 대상
└── init-db.sql             ← db/scripts/ 로 이동 대상
```

**목표 상태**:

```text
db/
├── schema/
├── scripts/
│   ├── create-hypertable.sql
│   └── init-db.sql
├── index.ts
└── seed.ts
```

### 변경 범위

- `scripts/*.sql` → `db/scripts/*.sql` 이동
- `package.json` npm script 경로 업데이트 (`db:timescale`)
- `CLAUDE.md` drizzle/README.md 경로 참조 업데이트
- 빈 `scripts/` 디렉토리 삭제

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 + Drizzle ORM + PostgreSQL)에서 SQL 스크립트 위치를 정리해줘.

현재 상태:
- scripts/create-hypertable.sql, scripts/init-db.sql 이 루트 scripts/ 에 있음
- package.json의 "db:timescale" 스크립트가 scripts/ 경로를 참조 중

목표:
- scripts/*.sql 파일을 db/scripts/ 로 이동
- package.json의 db:timescale 경로를 db/scripts/ 로 업데이트
- 빈 scripts/ 디렉토리 삭제
- CLAUDE.md에서 관련 경로 참조 업데이트

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 작업 2: Region 관리 UI/API

### 배경

`db/schema/core.ts`에 `regions` 테이블이 정의되어 있지만, API 라우트와 관리 UI가 없음.
`sites` 테이블에 `regionId` FK가 존재하므로, Site 생성/수정 시 Region 선택이 가능해야 함.

### 변경 범위

**API** (2개 라우트):

- `app/api/regions/route.ts` — GET(목록), POST(생성)
- `app/api/regions/[id]/route.ts` — GET, PATCH, DELETE

**UI** (1개 페이지):

- `app/regions/page.tsx` — Region 목록/생성/수정/삭제
- `app/regions/loading.tsx` — 스켈레톤
- `app/regions/error.tsx` — 에러 복구

**사이드바**:

- `config/site.ts` — nav 링크에 Regions 추가

**스토어**:

- `stores/use-region-store.ts` — Zustand 스토어

**CLAUDE.md 업데이트**:

- API 라우트 목록에 `/api/regions` 추가
- 페이지 목록에 `/regions` 추가

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 App Router + Drizzle ORM + shadcn/ui + Zustand)에서 Region 관리 기능을 구현해줘.

현재 상태:
- db/schema/core.ts 에 regions 테이블 정의 완료 (id, name, slug, description, createdAt)
- sites 테이블에 regionId FK 존재
- /api/regions 라우트 없음, /regions 페이지 없음

구현 목표:
1. app/api/regions/route.ts — GET(목록), POST(생성), withAuth() 적용
2. app/api/regions/[id]/route.ts — GET, PATCH, DELETE, withAuth() 적용
3. stores/use-region-store.ts — Zustand 스토어 (다른 store 파일 참고해서 패턴 맞춰줘)
4. app/regions/page.tsx — 목록 테이블 + 생성/수정/삭제 다이얼로그
5. app/regions/loading.tsx — Skeleton 기반 로딩
6. app/regions/error.tsx — 에러 복구 UI (다른 error.tsx 파일 참고)
7. config/site.ts — nav에 Regions 링크 추가
8. CLAUDE.md — API 라우트 목록, 페이지 목록에 regions 추가

기존 코드 패턴:
- API: lib/auth/with-auth.ts 의 withAuth() 사용
- UI: components/tenants/ 패턴 참고 (유사한 CRUD 구조)
- 스토어: stores/use-site-store.ts 패턴 참고

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 작업 3: Playwright E2E 테스트

### 배경

E2E 인프라(playwright.config.ts, 3개 spec 파일)는 설정되었지만, 테스트 케이스가
미인증 리다이렉트 확인 수준에만 머물러 있음. 실제 인증 후 사용자 플로우 테스트가 없음.

**현재 spec 상태**:

- `auth.spec.ts` — 로그인 페이지 로드, 미인증 리다이렉트 (3개 케이스)
- `dashboard.spec.ts` — 미인증 리다이렉트 (2개 케이스)
- `devices.spec.ts` — 미인증 리다이렉트 (2개 케이스)

### 목표 spec 구조

```text
e2e/
├── auth.spec.ts          ← 확장: 실제 로그인/로그아웃 플로우
├── dashboard.spec.ts     ← 확장: 인증 후 대시보드 접근
├── devices.spec.ts       ← 확장: 장비 CRUD 플로우
├── racks.spec.ts         ← 신규: 랙 엘리베이션 뷰
└── navigation.spec.ts    ← 신규: 전체 내비게이션 검증
```

**테스트 전략**:

- `e2e/fixtures/auth.ts` — 로그인 상태 fixture (storageState 재사용)
- 시드 데이터 기반 (실제 DB 연결 또는 mock API)
- 각 spec은 독립 실행 가능하도록 beforeAll에서 로그인 처리

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 + Auth.js v5 + Playwright)에서 E2E 테스트 케이스를 완성해줘.

현재 상태:
- playwright.config.ts 설정 완료, webServer는 npm run dev (port 3000)
- e2e/auth.spec.ts — 로그인 페이지 로드, 미인증 리다이렉트 3개 케이스만 있음
- e2e/dashboard.spec.ts — 미인증 리다이렉트 2개 케이스만 있음
- e2e/devices.spec.ts — 미인증 리다이렉트 2개 케이스만 있음

구현 목표:
1. e2e/fixtures/auth.ts — 로그인 fixture (storageState로 인증 상태 재사용)
   - 테스트용 계정: admin@example.com / password (db/seed.ts 확인)
2. e2e/auth.spec.ts 확장 — 실제 로그인 성공/실패 플로우, 로그아웃
3. e2e/dashboard.spec.ts 확장 — 인증 후 대시보드 접근, 주요 위젯 표시 확인
4. e2e/devices.spec.ts 확장 — 인증 후 장비 목록 접근, 검색 필터 동작
5. e2e/navigation.spec.ts 신규 — 전체 nav 링크 접근 가능 여부 검증

전략:
- 각 spec은 독립 실행 가능 (beforeAll에서 로그인 또는 fixture 사용)
- 실제 DB 데이터에 의존하지 않는 UI 검증 위주
- db/seed.ts 의 시드 데이터 기준으로 최소한의 데이터 존재 가정

완료 후 npm run test:e2e 실행해서 통과 여부 확인해줘.
```

---

## 작업 4: TimescaleDB Drizzle 통합

### 배경

`scripts/create-hypertable.sql`(이동 후 `db/scripts/`)에 hypertable 설정 SQL이 존재하지만,
Drizzle 마이그레이션 시스템과 통합되지 않아 수동으로 실행해야 함.

**현재 `package.json` script**:

```json
"db:timescale": "psql $DATABASE_URL -f scripts/create-hypertable.sql"
```

### 변경 범위

**옵션 A (권장)**: Drizzle custom migration 파일로 통합

- `drizzle/` 디렉토리에 TimescaleDB SQL을 custom migration으로 추가
- `drizzle.config.ts`에 `migrations` 경로 설정
- `package.json`의 `db:migrate` 실행 시 자동 적용

**옵션 B**: npm script 개선 (경량)

- 경로만 `db/scripts/`로 수정 (작업 1 이후)
- `db:setup` script 추가: `drizzle migrate → timescale setup` 순서 보장
- `.env.example`에 `TIMESCALEDB_ENABLED=true` 플래그 추가

> 작업 4는 작업 1 완료 후 진행 권장 (경로 의존성)

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 + Drizzle ORM + TimescaleDB)에서 TimescaleDB 설정을 Drizzle 마이그레이션 시스템과 통합해줘.

현재 상태:
- db/scripts/create-hypertable.sql 에 power_readings hypertable 생성 SQL 존재
  (작업 1 완료 시 db/scripts/ 위치, 미완료 시 scripts/ 위치)
- package.json에 "db:timescale": "psql $DATABASE_URL -f ..." 스크립트 존재
- Drizzle migrate와 hypertable 설정이 별개 명령어로 분리되어 있음

구현 목표:
- drizzle/ 디렉토리에 TimescaleDB hypertable 설정을 custom SQL migration으로 추가
  (파일명: drizzle/0001_timescaledb_setup.sql 형태)
- package.json에 db:setup 스크립트 추가:
  drizzle-kit migrate 실행 후 → hypertable SQL 자동 적용 순서 보장
- .env.example 에 TIMESCALEDB_ENABLED=true 플래그 추가 (미설치 환경 대비)
- drizzle/README.md 업데이트 (마이그레이션 절차 문서화)
- CLAUDE.md의 db:timescale 관련 설명 업데이트

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 작업 5: 상면 도면 2D 공간 배치

### 배경

현재 `/floor-plan` 페이지는 카드 그리드 형태로 랙을 나열함.
실제 DC 상면 도면처럼 X/Y 좌표 기반 2D 배치가 필요함.

### 변경 범위

**DB 스키마 확장**:

- `racks` 테이블에 `posX`, `posY`, `rotation` 컬럼 추가 (Drizzle migration)

**컴포넌트**:

- `components/floor-plan/floor-plan-canvas.tsx` — SVG 기반 2D 캔버스
- `components/floor-plan/rack-marker.tsx` — 드래그 가능한 랙 마커
- `components/floor-plan/floor-plan-toolbar.tsx` — 줌/패닝/그리드 토글

**기능**:

- SVG 뷰포트 (줌 in/out, 팬)
- 그리드 스냅 (1m 단위)
- 랙 드래그로 위치 변경 → DB 저장
- 선택된 랙의 장비 팝오버

**API**:

- `PATCH /api/racks/[id]` — `posX`, `posY` 업데이트 (기존 라우트 확장)

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 App Router + Drizzle ORM + @dnd-kit + Zustand)에서 상면 도면을 2D 공간 배치로 업그레이드해줘.

현재 상태:
- app/(main)/floor-plan/page.tsx 에 카드 그리드 형태로 랙 목록 표시 중
- components/floor-plan/floor-plan-grid.tsx, rack-card.tsx 존재
- racks 테이블에 posX, posY, rotation 컬럼 없음

구현 목표:
1. DB 스키마 확장 (db/schema/core.ts):
   - racks 테이블에 posX integer, posY integer, rotation integer(0/90/180/270) 추가
   - Drizzle migration 파일 생성

2. 컴포넌트 신규 작성:
   - components/floor-plan/floor-plan-canvas.tsx
     · SVG 뷰포트 (viewBox, zoom in/out, pan)
     · 그리드 선 표시 (1m 단위 기준선)
   - components/floor-plan/rack-marker.tsx
     · SVG 내 드래그 가능한 랙 사각형 마커
     · 클릭 시 장비 팝오버 (Popover 컴포넌트)
   - components/floor-plan/floor-plan-toolbar.tsx
     · 줌 +/- 버튼, 그리드 토글, 리셋 버튼

3. 기존 컴포넌트 유지:
   - 기존 카드 그리드 뷰는 탭으로 전환 (Grid 뷰 / 2D 뷰)

4. API 확장:
   - PATCH /api/racks/[id] — posX, posY, rotation 업데이트 지원 (기존 라우트 확장)

5. stores/use-rack-store.ts 확장:
   - updateRackPosition(rackId, posX, posY) 액션 추가

6. CLAUDE.md 업데이트

참고 파일:
- 기존 @dnd-kit 사용 패턴: components/rack/ 디렉토리
- Zustand 패턴: stores/use-rack-store.ts

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 작업 6: 정기 리포트 스케줄링

### 배경

현재 `/reports` 페이지에서 수동으로만 내보내기 가능. 정기적으로 이메일 발송하는 스케줄 기능이 없음.

### 변경 범위

**의존성 추가**:

- `node-cron` — cron 스케줄러
- `nodemailer` — 이메일 발송
- `@types/nodemailer`

**구현**:

- `lib/scheduler/report-scheduler.ts` — cron 작업 등록 (일간/주간/월간)
- `lib/mailer/report-mailer.ts` — 이메일 템플릿 + 발송
- `app/api/reports/schedule/route.ts` — 스케줄 CRUD API
- `db/schema/reports.ts` — `reportSchedules` 테이블 추가

**UI**:

- `/reports` 페이지에 "스케줄 설정" 탭 추가

**환경 변수**:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=dcim@company.com
```

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 App Router + Drizzle ORM + ExcelJS)에서 정기 리포트 스케줄링 기능을 추가해줘.

현재 상태:
- app/(main)/reports/page.tsx 에 수동 내보내기(Excel/XML/CSV) 기능 구현 완료
- lib/export/ 에 excel.ts, xml.ts, csv-import.ts 존재
- 스케줄 기반 자동 이메일 발송 기능 없음

구현 목표:
1. 패키지 설치: node-cron, nodemailer, @types/nodemailer

2. DB 스키마 추가 (db/schema/reports.ts):
   - reportSchedules 테이블: id, name, reportType(racks/devices/cables/power), frequency(daily/weekly/monthly), cronExpression, recipientEmails(text array), isActive, lastRunAt, nextRunAt, createdAt

3. 핵심 로직:
   - lib/scheduler/report-scheduler.ts — node-cron 작업 등록/해제, DB에서 활성 스케줄 로드
   - lib/mailer/report-mailer.ts — nodemailer로 Excel 첨부 이메일 발송
   - instrumentation.ts (Next.js) — 서버 시작 시 스케줄러 초기화

4. API:
   - app/api/reports/schedules/route.ts — GET, POST
   - app/api/reports/schedules/[id]/route.ts — GET, PATCH, DELETE
   - app/api/reports/schedules/[id]/run/route.ts — 즉시 실행 POST

5. UI:
   - app/(main)/reports/page.tsx 에 "스케줄" 탭 추가
   - components/reports/schedule-table.tsx — 스케줄 목록
   - components/reports/schedule-form.tsx — 스케줄 생성/수정 다이얼로그

6. 환경 변수 (.env.example 추가):
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM=dcim@company.com

7. CLAUDE.md 업데이트

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 작업 7: LDAP/Active Directory 연동

### 배경

현재 Credentials Provider(이메일+비밀번호)만 지원. 기업 환경에서는 LDAP/AD 연동이 필수.

### 변경 범위

**의존성 추가**:

- `ldapts` — Node.js LDAP 클라이언트 (Auth.js 공식 추천)

**구현**:

- `lib/auth/ldap-provider.ts` — 커스텀 LDAP Credentials Provider
- `app/api/auth/[...nextauth]/route.ts` — LDAP Provider 추가
- LDAP 사용자 → DB 사용자 자동 프로비저닝

**환경 변수**:

```env
LDAP_URI=ldap://your-ad-server:389
LDAP_BASE_DN=DC=company,DC=com
LDAP_BIND_DN=CN=service-account,DC=company,DC=com
LDAP_BIND_PASSWORD=
LDAP_USER_SEARCH_BASE=OU=Users,DC=company,DC=com
LDAP_USERNAME_ATTRIBUTE=sAMAccountName
```

**UI**:

- `/admin/users` 페이지에 "LDAP 동기화" 버튼 추가

### 요청 명령어 (`/clear` 이후 붙여넣기)

```
dc-infra-map 프로젝트 (Next.js 16 + Auth.js v5 + Drizzle ORM)에서 LDAP/Active Directory 로그인 연동을 추가해줘.

현재 상태:
- app/api/auth/[...nextauth]/route.ts 에 Credentials Provider (이메일+비밀번호) 만 구현
- db/schema/auth.ts 에 users 테이블 존재 (id, name, email, role, hashedPassword 등)
- RBAC: lib/auth/rbac.ts 에 역할별 권한 매트릭스 존재 (admin/operator/viewer/tenant_viewer)

구현 목표:
1. 패키지 설치: ldapts

2. LDAP Provider 구현:
   - lib/auth/ldap-provider.ts — ldapts 로 AD 인증, 그룹 → RBAC 역할 매핑
   - LDAP 그룹 매핑 규칙: AD 그룹명 → 앱 역할 (환경변수로 설정 가능하게)

3. Auth.js 설정 수정 (app/api/auth/[...nextauth]/route.ts):
   - LDAP Credentials Provider 추가 (기존 이메일 Provider와 공존)
   - LDAP 로그인 성공 시 users 테이블에 자동 upsert (프로비저닝)
   - LDAP_ENABLED=false 환경변수로 비활성화 가능

4. 환경 변수 (.env.example 추가):
   LDAP_ENABLED=false
   LDAP_URI=ldap://your-ad-server:389
   LDAP_BASE_DN=DC=company,DC=com
   LDAP_BIND_DN=CN=service-account,DC=company,DC=com
   LDAP_BIND_PASSWORD=
   LDAP_USER_SEARCH_BASE=OU=Users,DC=company,DC=com
   LDAP_USERNAME_ATTRIBUTE=sAMAccountName
   LDAP_GROUP_ADMIN=DC-Admins
   LDAP_GROUP_OPERATOR=DC-Operators

5. UI:
   - app/(auth)/login/page.tsx — LDAP_ENABLED 시 "AD 계정으로 로그인" 탭 추가
   - app/admin/users/page.tsx — "LDAP 동기화" 버튼 추가

6. CLAUDE.md 업데이트

완료 후 npm run build 로 빌드 확인해줘.
```

---

## 전체 진행 순서 요약

```text
[1] scripts/ 정리     → 단순, 5분
[2] Region UI/API    → 중간, 30분
[3] E2E 테스트       → 중간, 30분
[4] TimescaleDB 통합 → 중간, 15분 (1번 이후)
[5] 상면 도면 2D     → 복잡, 1~2시간
[6] 리포트 스케줄링  → 복잡, 1시간
[7] LDAP 연동        → 복잡, 1시간
```

> 1~4번은 독립적으로 실행 가능 (단, 4번은 1번 이후 권장)
> 5~7번은 순서 무관하게 독립 실행 가능

---

## 완료 체크리스트

- [ ] 1. SQL 스크립트 위치 정리
- [ ] 2. Region 관리 UI/API
- [ ] 3. Playwright E2E 테스트
- [ ] 4. TimescaleDB Drizzle 통합
- [ ] 5. 상면 도면 2D 공간 배치
- [ ] 6. 정기 리포트 스케줄링
- [ ] 7. LDAP/AD 연동
