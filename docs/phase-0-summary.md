# DCIM 구현 진행 상황

> **프로젝트**: DC Infra Map (데이터센터 인프라 관리 시스템)
> **기술 스택 및 전체 로드맵**: [ROADMAP.md](../ROADMAP.md) 참조
> **최종 업데이트**: 2026-02-14

---

## Phase 진행 현황

| Phase | 이름 | 상태 | 완료일 |
| --- | --- | --- | --- |
| 0 | 기반 구축 | **완료** | 2026-02-14 |
| 1 | 상면 관리 MVP | 대기 | - |
| 2 | 입출입 및 전력 관리 | 대기 | - |
| 3 | 네트워크 및 선번장 | 대기 | - |
| 4 | 리포트 및 내보내기 | 대기 | - |
| 5 | 고도화 | 대기 | - |

---

## Phase 0: 기반 구축 — 완료

### 구현 항목

- [x] PostgreSQL 17 + TimescaleDB 2.17.2 (Docker Compose)
- [x] Drizzle ORM 스키마 (Region, Site, Location, Rack, DeviceType, Device, Manufacturer, Tenant)
- [x] Auth.js v5 Credentials Provider + JWT 전략
- [x] Zustand 스토어 (site, rack, device)
- [x] API 라우트 (`/api/sites`, `/api/racks`, `/api/devices`) — CRUD + soft delete
- [x] 시드 데이터 (가산 IDC, 판교 IDC, 10개 랙, 17개 디바이스)

### 프로젝트 구조

```text
dc-infra-map/
├── app/
│   ├── (auth)/login/page.tsx      # 로그인 폼
│   ├── api/
│   │   ├── auth/[...nextauth]/    # Auth.js 핸들러
│   │   ├── sites/                 # GET, POST, PATCH, DELETE
│   │   ├── racks/                 # GET, POST, PATCH, DELETE
│   │   └── devices/               # GET, POST, PATCH, DELETE
│   ├── dashboard/page.tsx         # 대시보드 플레이스홀더
│   └── layout.tsx                 # SessionProvider + ThemeProvider
├── auth.ts                        # NextAuth 설정
├── middleware.ts                   # 인증 미들웨어
├── db/
│   ├── index.ts                   # Drizzle 인스턴스
│   ├── schema/
│   │   ├── enums.ts               # deviceStatus, siteStatus, rackType 등
│   │   ├── auth.ts                # users, accounts, sessions
│   │   ├── core.ts                # regions, sites, locations, racks, manufacturers, tenants
│   │   ├── devices.ts             # deviceTypes, devices
│   │   ├── audit.ts               # auditLogs
│   │   └── relations.ts           # 모든 릴레이션 (순환 참조 방지)
│   └── seed.ts                    # 한국 DC 샘플 데이터
├── stores/
│   ├── use-site-store.ts          # 사이트 선택/캐시
│   ├── use-rack-store.ts          # 랙 선택/캐시
│   └── use-device-store.ts        # 디바이스 필터
├── lib/api.ts                     # API 응답 헬퍼
├── docker-compose.yml             # PostgreSQL + TimescaleDB
├── drizzle.config.ts              # Drizzle Kit 설정
└── scripts/init-db.sql            # DB 확장 활성화
```

### 스키마 구조

```text
Region → Site → Location → Rack → Device
                                    ↑
Manufacturer → DeviceType ──────────┘
Tenant ──→ (sites, locations, racks, devices)
AuditLog ──→ User
```

### 설계 결정

| 결정 | 선택 | 이유 |
| --- | --- | --- |
| ID 타입 | `text` + `crypto.randomUUID()` | Auth.js adapter가 text ID 요구 |
| 세션 전략 | JWT | Credentials + DrizzleAdapter 조합에 필수 |
| 소프트 삭제 | `deletedAt` 컬럼 | 감사 추적 보존 |
| 타임스탬프 | `withTimezone: true` | KST 타임존 안전성 |
| 비밀번호 | bcryptjs (12 rounds) | 순수 JS, 네이티브 의존성 없음 |
| 릴레이션 | 별도 파일 (`relations.ts`) | 순환 참조 방지 |
| JSONB 필드 | `customFields`, `interfaceTemplates` | Phase 3+ 확장용 |

### 실행 방법

```bash
docker compose up -d    # DB 시작
npm run db:push         # 스키마 적용
npm run db:seed         # 샘플 데이터
npm run dev             # 개발 서버
```

**로그인**: `admin@dcim.local` / `admin1234` → <http://localhost:3000/login>

### 알려진 이슈

- Next.js 16에서 `middleware` convention deprecated 경고 → 향후 `proxy` convention 마이그레이션 필요
- `.env.local`은 `.gitignore` 대상 → `.env.example` 참고하여 생성

---

## Phase 1: 상면 관리 MVP — 대기

> ROADMAP.md Phase 1 참조 (4주, 랙 시각화 + 자산 관리)

### 1-1. 랙 시각화 (2주)

- [x] 랙 엘리베이션 뷰 컴포넌트 (42U 그리드, 전면/후면)
- [x] @dnd-kit 커스텀 충돌 감지 (U-slot 기반 배치 검증)
- [x] 가변 높이 장비 드래그 앤 드롭 (1U, 2U, 4U)
- [x] 랙 간 장비 이동 (드래그로 다른 랙으로 이동)
- [x] 상면 도면 뷰 (플로어 레이아웃 — 랙 배치도)

### 1-2. 자산 관리 (2주)

- [x] 장비 CRUD (서버, 네트워크, 스토리지 구분)
- [x] 고객사 태깅 시스템 (Tenant 엔티티 + 필터링)
- [x] 자산 상태 관리 (planned → staged → active → decommissioned)
- [x] 변경 이력 로그 (JSONB 스냅샷 + 사유 기록)
- [x] 장비 검색/필터 (고객사별, 장비 유형별, 상태별)

### Phase 1 예상 신규 패키지

```text
@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
```

### Phase 1 예상 신규 파일

```text
components/rack/           # 랙 엘리베이션 뷰, U-slot 그리드
components/floor-plan/     # 상면 도면 뷰
components/device/         # 장비 카드, 상세 패널
stores/use-drag-store.ts   # 드래그 앤 드롭 상태
app/sites/[id]/            # 사이트 상세 → 로케이션 목록
app/racks/[id]/            # 랙 상세 → 엘리베이션 뷰
```

---

## Phase 2: 입출입 및 전력 관리 — 대기

> ROADMAP.md Phase 2 참조 (4주, 입출입 + 전력 모니터링)

### 2-1. 입출입 관리 (2주)

- [x] 인력 입출입 기록 (방문자, 작업자)
- [x] 장비 반출입 기록 (입고/출고 워크플로우)
- [x] 입출입 이력 조회 및 리포트

### 2-2. 전력 모니터링 (2주)

- [x] PowerPanel, PowerFeed, PowerPort, PowerOutlet 스키마
- [x] 전력 데이터 수집 API (`POST /api/power/readings`)
- [x] TimescaleDB hypertable + 압축 정책 설정
- [x] SSE 기반 실시간 전력 대시보드
- [x] 랙별 전압/전류 현황 표시
- [x] 전력 용량 대비 사용률 시각화

### Phase 2 예상 스키마 추가

```text
db/schema/power.ts     # powerPanels, powerFeeds, powerPorts, powerOutlets, powerReadings
db/schema/access.ts    # accessLogs, visitors, equipmentTransfers
```

---

## Phase 3: 네트워크 및 선번장 — 대기

> ROADMAP.md Phase 3 참조 (4주, 케이블 관리 시스템)

### 3-1. 선번장 (3주)

- [ ] Cable, Interface, FrontPort, RearPort, ConsolePort 스키마
- [ ] 케이블 연결 CRUD (양 끝 터미네이션 정의)
- [ ] 경로 추적 (서버 NIC → 패치패널 → 스위치 포트)
- [ ] 선번장 테이블 뷰 (엑셀 유사 형태)
- [ ] 네트워크 대역폭 정보 (인터페이스 타입별 속도)

### 3-2. 네트워크 토폴로지 (1주)

- [ ] 장비 간 연결 다이어그램
- [ ] 스위치 포트 사용률 표시

### Phase 3 예상 스키마 추가

```text
db/schema/cables.ts    # cables, interfaces, frontPorts, rearPorts, consolePorts
```

---

## Phase 4: 리포트 및 내보내기 — 대기

> ROADMAP.md Phase 4 참조 (3주, 엔터프라이즈 출력)

- [ ] Excel 내보내기 (ExcelJS) — 상면 도면, 자산 목록, 전력 리포트, 선번장
- [ ] XML 내보내기 (fast-xml-parser) — 도면 데이터 교환, 자산 목록
- [ ] 정기 리포트 스케줄링 (cron + 이메일)
- [ ] CSV 일괄 가져오기 (기존 데이터 마이그레이션)

### Phase 4 예상 신규 패키지

```text
exceljs, fast-xml-parser
```

---

## Phase 5: 고도화 — 대기

> ROADMAP.md Phase 5 참조 (지속적)

- [ ] RBAC 세분화 + LDAP/AD 연동
- [ ] 전력 수집 서비스 Go 분리 (초당 100+ 쓰기 시)
- [ ] 전력 임계값/자산 보증 만료/랙 용량 알림
- [ ] 멀티 사이트 대시보드

---

## 문서 가이드

| 문서 | 용도 |
| --- | --- |
| [ROADMAP.md](../ROADMAP.md) | 기술 스택 결정, 데이터 모델, 리스크 분석 (불변 참조) |
| [이 문서](./phase-0-summary.md) | 구현 진행 상황, Phase별 체크리스트, 구조 변경 이력 |
| [CLAUDE.md](../CLAUDE.md) | 개발자 컨텍스트, 아키텍처 가이드 |
