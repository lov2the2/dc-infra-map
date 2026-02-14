# Phase 0: DCIM Foundation 구현 결과

> **작성일**: 2026-02-14
> **목적**: ROADMAP.md Phase 0 요구사항에 따른 DB, ORM, Auth, State Management 기반 구축

---

## 설치된 패키지

### Production

| 패키지 | 용도 |
| --- | --- |
| `drizzle-orm` + `postgres` | PostgreSQL ORM + 드라이버 |
| `next-auth@beta` (v5) | 인증 (Credentials + JWT) |
| `@auth/drizzle-adapter` | Auth.js ↔ Drizzle 연동 |
| `zustand` + `immer` | 클라이언트 상태 관리 |
| `bcryptjs` | 비밀번호 해싱 (12 rounds) |
| `zod` | 스키마 검증 (Phase 1+ 확장용) |

### Dev

| 패키지 | 용도 |
| --- | --- |
| `drizzle-kit` | 마이그레이션 및 스키마 관리 |
| `@types/bcryptjs` | 타입 정의 |
| `tsx` | TypeScript 스크립트 실행 (seed 등) |

---

## 생성된 파일 (27개)

### 인프라 (5개)

| 파일 | 설명 |
| --- | --- |
| `docker-compose.yml` | PostgreSQL 17 + TimescaleDB 2.17.2 |
| `scripts/init-db.sql` | timescaledb + uuid-ossp 확장 활성화 |
| `.env.example` | 환경변수 템플릿 |
| `.env.local` | 로컬 개발용 환경변수 (gitignore 대상) |
| `drizzle.config.ts` | Drizzle Kit 설정 |

### 데이터베이스 스키마 (8개)

| 파일 | 설명 |
| --- | --- |
| `db/index.ts` | Drizzle 인스턴스 생성 |
| `db/schema/index.ts` | 모든 스키마 모듈 re-export |
| `db/schema/enums.ts` | deviceStatus, siteStatus, rackType, deviceFace, userRole |
| `db/schema/auth.ts` | users, accounts, sessions, verificationTokens |
| `db/schema/core.ts` | manufacturers, tenants, regions, sites, locations, racks |
| `db/schema/devices.ts` | deviceTypes, devices |
| `db/schema/audit.ts` | auditLogs (JSONB changes_before/after) |
| `db/schema/relations.ts` | 모든 릴레이션 중앙 관리 (순환 참조 방지) |

### 시드 데이터 (1개)

| 파일 | 설명 |
| --- | --- |
| `db/seed.ts` | 한국 DC 샘플 데이터 (가산 IDC, 판교 IDC, 10개 랙, 17개 디바이스) |

### 인증 (5개)

| 파일 | 설명 |
| --- | --- |
| `auth.ts` | NextAuth 설정 (Credentials + DrizzleAdapter + JWT) |
| `middleware.ts` | 보호 라우트, 미인증 → /login 리다이렉트 |
| `types/next-auth.d.ts` | Session 타입 확장 (id, role) |
| `components/providers/session-provider.tsx` | 클라이언트 SessionProvider 래퍼 |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js 라우트 핸들러 |

### Zustand 스토어 (3개)

| 파일 | 설명 |
| --- | --- |
| `stores/use-site-store.ts` | 활성 사이트 선택, 사이트 캐시 |
| `stores/use-rack-store.ts` | 랙 선택, 랙 캐시 |
| `stores/use-device-store.ts` | 디바이스 필터 (status, tenant, type, search) |

### API 라우트 (7개)

| 파일 | 설명 |
| --- | --- |
| `lib/api.ts` | successResponse, errorResponse, handleApiError 헬퍼 |
| `app/api/sites/route.ts` | GET (목록), POST (생성) |
| `app/api/sites/[id]/route.ts` | GET, PATCH, DELETE (soft) |
| `app/api/racks/route.ts` | GET (목록, locationId 필터), POST |
| `app/api/racks/[id]/route.ts` | GET, PATCH, DELETE (soft) |
| `app/api/devices/route.ts` | GET (목록, rackId/status/search 필터), POST |
| `app/api/devices/[id]/route.ts` | GET, PATCH, DELETE (soft) |

### 페이지 (3개)

| 파일 | 설명 |
| --- | --- |
| `app/(auth)/login/page.tsx` | 로그인 폼 (Suspense 경계 포함) |
| `app/(auth)/layout.tsx` | 인증 라우트 그룹 레이아웃 |
| `app/dashboard/page.tsx` | 로그인 후 대시보드 플레이스홀더 |

---

## 수정된 파일 (2개)

| 파일 | 변경 내용 |
| --- | --- |
| `app/layout.tsx` | SessionProvider 래핑 추가 |
| `package.json` | db:generate, db:push, db:migrate, db:studio, db:seed 스크립트 추가 |

---

## 스키마 구조

```
Region → Site → Location → Rack → Device
                                    ↑
Manufacturer → DeviceType ──────────┘
Tenant ──→ (sites, locations, racks, devices)
AuditLog ──→ User
```

### 핵심 테이블

- **Core**: regions, sites, locations, racks, manufacturers, tenants
- **Devices**: deviceTypes, devices
- **Auth**: users, accounts, sessions, verificationTokens
- **Audit**: auditLogs

---

## 설계 결정 사항

| 결정 | 선택 | 이유 |
| --- | --- | --- |
| ID 타입 | text + crypto.randomUUID() | Auth.js adapter가 text ID 요구 |
| 세션 전략 | JWT | Credentials + DrizzleAdapter 조합에 필수 |
| 소프트 삭제 | deletedAt 컬럼 | 감사 추적 보존 |
| 타임스탬프 | withTimezone: true | KST 타임존 안전성 |
| 비밀번호 | bcryptjs (12 rounds) | 순수 JS, 네이티브 의존성 없음 |
| 릴레이션 | 별도 파일 | 순환 참조 방지 |
| JSONB 필드 | customFields, interfaceTemplates | Phase 3+ 확장성 |

---

## 실행 방법

```bash
# 1. PostgreSQL + TimescaleDB 시작
docker compose up -d

# 2. 스키마 적용
npm run db:push

# 3. 샘플 데이터 삽입
npm run db:seed

# 4. 개발 서버 시작
npm run dev
```

### 로그인 정보

- **URL**: <http://localhost:3000/login>
- **이메일**: `admin@dcim.local`
- **비밀번호**: `admin1234`

---

## 빌드 검증 결과

```
✓ Compiled successfully
✓ TypeScript — 에러 없음
✓ Static pages — 9/9 생성 완료
✓ API routes — sites, racks, devices 정상 등록
```

### 라우트 목록

| 라우트 | 유형 |
| --- | --- |
| `/` | Static |
| `/login` | Static |
| `/dashboard` | Dynamic (서버 렌더링) |
| `/api/auth/[...nextauth]` | Dynamic |
| `/api/sites`, `/api/sites/[id]` | Dynamic |
| `/api/racks`, `/api/racks/[id]` | Dynamic |
| `/api/devices`, `/api/devices/[id]` | Dynamic |

---

## 참고 사항

- Next.js 16에서 `middleware` convention deprecated 경고 발생 → 향후 `proxy` convention 마이그레이션 필요
- `.env.local`은 `.gitignore` 대상이므로 팀원은 `.env.example`을 참고하여 생성 필요
- 시드 스크립트는 `onConflictDoNothing`으로 멱등성 보장
