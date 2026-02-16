# DC Infra Map - 장기 로드맵

> **프로젝트**: 데이터센터 인프라 관리 시스템 (DCIM)
> **작성일**: 2026-02-13
> **데이터 보존**: 3년 (2026-02 ~ 2029-02)
> **대상 규모**: 중형 DC (500~2,000 랙)

---

## 프로젝트 비전

데이터센터 상면 관리의 디지털 전환을 위한 웹 기반 DCIM 시스템.
랙 배치, 자산 추적, 전력 모니터링, 선번장 관리를 하나의 플랫폼에서 제공한다.

---

## 기술 스택 결정

### 확정 스택 (리서치 기반)

| 영역 | 기술 | 버전 | 선택 이유 |
| --- | --- | --- | --- |
| Frontend | Next.js 16 (App Router) | 16.1.6 | 기존 프로젝트 기반 유지 |
| UI | Tailwind CSS 4 + shadcn/ui | 최신 | RSC 호환, 다크모드 지원 |
| Database | PostgreSQL | 17.x | JSONB + GIN 인덱스, 감사 로그, 확장성 |
| Time-Series | TimescaleDB (PG 확장) | 2.x | 전력 데이터 압축 (10~20x), hypertable |
| ORM | Drizzle ORM | ^0.45.1 | SQL-first, 7KB 번들, RSC 호환 |
| DB Driver | postgres.js | ^3.4.0 | Node.js 최고 성능 PG 드라이버 |
| Drag & Drop | @dnd-kit | core 6.x / sortable 8.x | React 19 호환, 가변 높이 그리드 지원 |
| State | Zustand + Immer | ^5.0.0 | 글로벌 상태 (드래그, 전력 캐시, 선택) |
| Auth | Auth.js v5 (NextAuth) | ^5.0.0 | 벤더 종속 없음, 내부 도구에 적합 |
| Excel Export | ExcelJS | ^4.4.0 | 유지보수 활발, 셀 스타일링 지원 |
| XML Export | fast-xml-parser | ^5.3.6 | 경량, 양방향 파싱/생성 |
| Real-time | SSE (Server-Sent Events) | 브라우저 내장 | 단방향 모니터링에 최적, WebSocket 불필요 |

### 선택하지 않은 기술과 이유

| 기술 | 탈락 이유 |
| --- | --- |
| MySQL | JSONB 미지원, GIN 인덱스 없음, 감사 로그 쿼리 성능 불리 |
| SQLite | 동시 쓰기 제한, 500+ 랙 규모에 부적합 |
| Prisma | 복잡한 JOIN/CTE 쿼리에서 Drizzle 대비 추상화 마찰 |
| react-beautiful-dnd | 유지보수 중단, React 19 미지원 |
| pragmatic-drag-and-drop | 그리드/가변 높이 레이아웃에서 시각적 피드백 부족 |
| Clerk | 내부 도구(10~50명)에 MAU 과금 모델 비효율적 |
| SheetJS (xlsx) | npm 레지스트리 유지보수 중단, 보안 취약점 다수 |
| Jotai | DCIM의 연결된 글로벌 상태에 Zustand가 더 적합 |
| GraphQL | DCIM 쿼리 패턴이 명확하여 REST로 충분 |

---

## 데이터 모델 개요

### 엔티티 계층 (NetBox 참조)

```text
Region (지역)
  └─ Site (데이터센터)
       └─ Location (동/층/룸/케이지)
            └─ Rack (랙 - 19" 42U 표준)
                 └─ Device (서버/스위치/PDU/스토리지)
                      ├─ Interface (네트워크 포트)
                      ├─ PowerPort (전원 입력 - PSU)
                      └─ PowerOutlet (전원 출력 - PDU)
```

### 연결 모델 (선번장)

```text
Device Interface → Cable → PatchPanel FrontPort
                           PatchPanel RearPort → Cable → Switch Interface
```

### 전력 모델

```text
PowerPanel (분전반)
  └─ PowerFeed (차단기 출력: 220V, 30A)
       └─ Cable → PDU PowerPort (PDU 입력)
            └─ PDU PowerOutlet → Cable → Device PowerPort (서버 PSU)
```

### 자산 생명주기

```text
planned(발주) → staged(입고) → active(운영) → decommissioning(철거중) → decommissioned(폐기대기)
                     ↓                              ↑
                  failed(장애) ────────────────────────┘
```

---

## 한국 DC 특화 사항

| 항목 | 표준 | 비고 |
| --- | --- | --- |
| 랙 규격 | 19" EIA-310, 42U | 47U는 신규 시설 일부 |
| 랙 깊이 | 1000mm (표준) | 900mm, 1200mm 혼용 |
| 전압 | 단상 220V AC / 60Hz | 3상 380V는 분전반 레벨 |
| 차단기 | 20A (4.4kW) / 30A (6.6kW) | 디레이팅 80% 적용 |
| 이중화 | A/B 듀얼 피드 | 별도 UPS 계통 |
| 커넥터 | IEC C13 (10A) / C19 (16A) | C19는 고전력 서버용 |

### 규제 준수 필요 사항

- **정보통신기반 보호법**: 주요 인프라 자산 목록 유지 의무
- **개인정보보호법 (PIPA)**: 개인정보 처리 서버 위치 문서화
- **전기설비기술기준 (KEC)**: 전력 회로, 차단기 정격, 케이블 사양 기록
- **ISO/IEC 27001**: 변경 관리 로그 (누가, 언제, 무엇을, 왜)

---

## 3년 데이터 볼륨 추정 (1,000 랙 기준)

| 데이터 유형 | 레코드 수 (3년) | 저장 용량 (최적화) |
| --- | --- | --- |
| 정적 자산 레코드 | ~520,000 | ~200 MB |
| 변경 이력 (이동/상태 변경) | ~342,000 | ~1.0 GB |
| 전력 모니터링 (5분 간격) | ~16.4B rows | 10~20 GB (TimescaleDB 압축) |
| 감사 로그 | ~1,900,000 | ~2.5 GB |
| **합계** | | **~14~24 GB (최적화)** |

> 전력 모니터링이 전체 데이터의 97%를 차지한다.
> TimescaleDB 압축이 없으면 ~200GB로 증가한다.

---

## 로드맵

### Phase 0: 기반 구축 (MVP 준비)

**기간**: 2주 | **목표**: 개발 환경 및 DB 스키마 확정

- [x] PostgreSQL 17 + TimescaleDB 로컬 개발 환경 설정 (Docker Compose)
- [x] Drizzle ORM 설정 및 코어 스키마 정의
  - Region, Site, Location, Rack, DeviceType, Device
  - Manufacturer, Tenant (고객사)
- [x] Auth.js v5 기본 인증 (Credentials Provider)
- [x] Zustand 스토어 초기 설정
- [x] API 라우트 기본 구조 (`/api/sites`, `/api/racks`, `/api/devices`)
- [x] 시드 데이터 (한국 DC 표준 기반 샘플)

### Phase 1: 상면 관리 MVP

**기간**: 4주 | **목표**: 핵심 DCIM 기능 동작

#### 1-1. 랙 시각화 (2주)

- [x] 랙 엘리베이션 뷰 컴포넌트 (42U 그리드, 전면/후면)
- [x] @dnd-kit 커스텀 충돌 감지 (U-slot 기반 배치 검증)
- [x] 가변 높이 장비 드래그 앤 드롭 (1U, 2U, 4U)
- [x] 랙 간 장비 이동 (드래그로 다른 랙으로 이동)
- [x] 상면 도면 뷰 (플로어 레이아웃 - 랙 배치도)

#### 1-2. 자산 관리 (2주)

- [x] 장비 CRUD (서버, 네트워크, 스토리지 구분)
- [x] 고객사 태깅 시스템 (`Tenant` 엔티티 + 필터링)
- [x] 자산 상태 관리 (planned → staged → active → decommissioned)
- [x] 변경 이력 로그 (JSONB 스냅샷 + 사유 기록)
- [x] 장비 검색/필터 (고객사별, 장비 유형별, 상태별)

### Phase 2: 입출입 및 전력 관리

**기간**: 4주 | **목표**: 운영 데이터 수집

#### 2-1. 입출입 관리 (2주)

- [x] 인력 입출입 기록 (방문자, 작업자)
- [x] 장비 반출입 기록 (입고/출고 워크플로우)
- [x] 입출입 이력 조회 및 리포트

#### 2-2. 전력 모니터링 (2주)

- [x] PowerPanel, PowerFeed, PowerPort, PowerOutlet 스키마
- [x] 전력 데이터 수집 API (`POST /api/power/readings`)
- [x] TimescaleDB hypertable + 압축 정책 설정
- [x] SSE 기반 실시간 전력 대시보드
- [x] 랙별 전압/전류 현황 표시
- [x] 전력 용량 대비 사용률 시각화

### Phase 3: 네트워크 및 선번장

**기간**: 4주 | **목표**: 케이블 관리 시스템

#### 3-1. 선번장 (Cable Management) (3주)

- [x] Cable, Interface, FrontPort, RearPort, ConsolePort 스키마
- [x] 케이블 연결 CRUD (양 끝 터미네이션 정의)
- [x] 경로 추적 (서버 NIC → 패치패널 → 스위치 포트)
- [x] 선번장 테이블 뷰 (엑셀 유사 형태)
- [x] 네트워크 대역폭 정보 (인터페이스 타입별 속도)

#### 3-2. 네트워크 토폴로지 (1주)

- [x] 장비 간 연결 다이어그램 (간략 뷰)
- [x] 스위치 포트 사용률 표시

### Phase 4: 리포트 및 내보내기

**기간**: 3주 | **목표**: 엔터프라이즈 출력 기능

- [x] Excel 내보내기 (ExcelJS)
  - 상면 도면 (랙 배치 + 장비 목록)
  - 자산 목록 (고객사별, 유형별)
  - 전력 사용 리포트 (일간/월간 집계)
  - 선번장 (케이블 연결표)
- [x] XML 내보내기 (fast-xml-parser)
  - 도면 데이터 교환용 표준 XML 스키마
  - 자산 목록 XML (외부 시스템 연동용)
- [ ] 정기 리포트 스케줄링 (cron + 이메일 발송)
- [x] CSV 일괄 가져오기 (기존 데이터 마이그레이션)

### Phase 5: 고도화

**기간**: 지속적 | **목표**: 엔터프라이즈 수준 완성

#### 5-1. 인증/권한 고도화

- [x] RBAC (관리자/운영자/조회자/고객사 역할)
- [ ] LDAP/Active Directory 연동 (Auth.js Provider)
- [x] 감사 로그 강화 (로그인, API 호출, 자산 조회 기록)

#### 5-2. 백엔드 분리 (Go 마이그레이션)

- [ ] 전력 데이터 수집 서비스 Go로 분리 (초당 100+ 쓰기 시)
- [ ] 대용량 가져오기/내보내기 백그라운드 작업 Go 서비스
- [ ] Next.js API 라우트 → Go 서비스 프록시 전환

#### 5-3. 알림 및 자동화

- [x] 전력 임계값 초과 알림 (Slack/이메일)
- [x] 자산 보증 만료 알림
- [x] 랙 용량 임계값 알림

#### 5-4. 멀티 사이트

- [ ] 다중 데이터센터 지원 (Site 전환 UI)
- [ ] 사이트 간 자산 이동 워크플로우
- [ ] 글로벌 대시보드 (전체 DC 현황)

---

## 아키텍처 다이어그램

```text
┌──────────────────────────────────────────────────────┐
│              Next.js 16 (App Router)                 │
│                                                      │
│  Server Components          Client Components        │
│  (직접 DB 쿼리)              ('use client')           │
│  ┌────────────────┐        ┌──────────────────────┐  │
│  │ 플로어 플랜    │        │ RackDragContext       │  │
│  │ 자산 목록      │        │ (@dnd-kit + Zustand)  │  │
│  │ 감사 로그      │        │ 전력 대시보드         │  │
│  └───────┬────────┘        │ (SSE 소비)           │  │
│          │                 └──────────────────────┘  │
│  Route Handlers                                      │
│  ┌────────────────┐                                  │
│  │ /api/racks     │                                  │
│  │ /api/devices   │                                  │
│  │ /api/power/*   │ ← SSE 스트림                     │
│  │ /api/*/export  │ ← ExcelJS / fast-xml-parser      │
│  └───────┬────────┘                                  │
└──────────┼───────────────────────────────────────────┘
           │ Drizzle ORM (postgres.js)
           │
┌──────────▼───────────────────────────────────────────┐
│             PostgreSQL 17                             │
│  ┌─────────────────────────────────────────────┐     │
│  │ Relational: racks, devices, cables,         │     │
│  │ tenants, audit_logs (JSONB)                 │     │
│  └─────────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────┐     │
│  │ TimescaleDB: power_readings (hypertable)    │     │
│  │ 압축 정책 + continuous aggregates           │     │
│  └─────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

---

## 리스크 및 완화 방안

| 리스크 | 심각도 | 완화 방안 |
| --- | --- | --- |
| @dnd-kit 가변 높이 그리드 복잡도 | 높음 | 3일 버퍼 확보, 서버 사이드 슬롯 검증 fallback |
| TimescaleDB hypertable이 Drizzle 미지원 | 중간 | Raw SQL 마이그레이션 파일로 대응 |
| SSE 서버리스 커넥션 제한 (Vercel) | 중간 | 30초 max duration + 자동 재연결 |
| 전력 데이터 볼륨 (sub-minute 간격) | 중간 | 5분 간격 MVP → 추후 TimescaleDB 압축으로 확장 |
| Go 백엔드 분리 시점 판단 | 낮음 | 초당 100+ 쓰기 또는 30초 초과 작업 발생 시 |

---

## 참고 자료

### 오픈소스 DCIM 시스템

- [NetBox](https://github.com/netbox-community/netbox) - 가장 완성된 오픈소스 DCIM, 데이터 모델 참조
- [Ralph](https://github.com/allegro/ralph) - Allegro의 DCIM + CMDB
- [OpenDCIM](https://www.opendcim.org/) - PHP 기반 경량 DCIM
- [RackTables](https://www.racktables.org/) - 랙/패치 관리 특화

### 기술 리서치 소스

- [PostgreSQL vs MySQL JSONB 비교 (Bytebase 2026)](https://www.bytebase.com/blog/postgres-vs-mysql/)
- [Drizzle vs Prisma (DesignRevision 2026)](https://designrevision.com/blog/prisma-vs-drizzle)
- [Top 5 React DnD Libraries 2026 (Puck)](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react)
- [SSE vs WebSocket (Ably)](https://ably.com/blog/websockets-vs-sse)
- [NextAuth vs Clerk (Medium 2025)](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd)
- [React State Management 2026 (Syncfusion)](https://www.syncfusion.com/blogs/post/react-state-management-libraries)
- [ExcelJS vs SheetJS 보안 이슈 (TheLinuxCode)](https://thelinuxcode.com/npm-sheetjs-xlsx-in-2026-safe-installation-secure-parsing-and-real-world-nodejs-patterns/)

### 한국 DC 표준

- ANSI/TIA-942-C 데이터센터 인프라 표준
- 전기설비기술기준 (KEC)
- 정보통신기반 보호법
- 개인정보보호법 (PIPA)
