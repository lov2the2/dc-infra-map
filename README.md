# DC Infra Map (DCIM)

데이터센터 인프라 관리 및 시각화를 위한 웹 기반 DCIM(Data Center Infrastructure Management) 시스템입니다.

랙 배치, 자산 추적, 전력 모니터링, 케이블 관리(선번장), 입출입 관리를 하나의 플랫폼에서 제공합니다.

## 기술 스택

| 영역 | 기술 | 버전 |
| --- | --- | --- |
| Frontend | Next.js (App Router) | 16.1.6 |
| UI | Tailwind CSS 4 + shadcn/ui | 최신 |
| Database | PostgreSQL + TimescaleDB | 17 + 2.17.2 |
| ORM | Drizzle ORM | ^0.45.1 |
| Auth | Auth.js v5 (NextAuth) | beta.30 |
| State | Zustand + Immer | ^5.0.11 |
| Drag & Drop | @dnd-kit | core 6.x |
| Excel | ExcelJS | ^4.4.0 |
| XML | fast-xml-parser | ^5.3.6 |

## 시작하기

### 사전 요구사항

- **Node.js** 20+
- **Docker** (PostgreSQL + TimescaleDB 실행용)
- **npm**

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd dc-infra-map

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# AUTH_SECRET 값을 생성하여 .env.local에 입력
npx auth secret  # 생성된 값을 .env.local의 AUTH_SECRET에 설정

# 4. 데이터베이스 시작
docker compose up -d

# 5. 스키마 적용
npm run db:push

# 6. (선택) TimescaleDB hypertable 생성 — 전력 모니터링용
# docker exec -i dcim-postgres psql -U dcim -d dcim < scripts/create-hypertable.sql

# 7. 시드 데이터 입력
npm run db:seed

# 8. 개발 서버 실행
npm run dev
```

브라우저에서 <http://localhost:3000> 을 열어 확인합니다.

### 로그인

| 계정 | 이메일 | 비밀번호 |
| --- | --- | --- |
| 관리자 | `admin@dcim.local` | `admin1234` |

### 환경 변수 (.env.local)

```bash
# Database
DATABASE_URL=postgresql://dcim:dcim_local_password@localhost:5432/dcim

# Auth.js
AUTH_SECRET=<npx auth secret으로 생성>
AUTH_URL=http://localhost:3000

# Initial admin account (seed script에서 사용)
ADMIN_EMAIL=admin@dcim.local
ADMIN_PASSWORD=admin1234
```

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 (타입 체크 포함) |
| `npm run lint` | ESLint 검사 |
| `npm run db:push` | Drizzle 스키마를 DB에 적용 |
| `npm run db:seed` | 샘플 데이터 입력 |
| `npm run db:studio` | Drizzle Studio (DB 브라우저) |
| `npm run db:generate` | 마이그레이션 파일 생성 |

## 주요 기능

### 상면 관리

- **랙 엘리베이션 뷰**: 42U 그리드 기반 전면/후면 시각화
- **드래그 앤 드롭**: @dnd-kit 기반 장비 배치 및 랙 간 이동
- **상면 도면**: 로케이션별 랙 배치 현황

### 자산 관리

- **장비 CRUD**: 서버, 네트워크 장비, 스토리지 구분 관리
- **고객사 태깅**: Tenant 엔티티 기반 필터링
- **자산 상태 관리**: planned → staged → active → decommissioned 생명주기
- **변경 이력**: JSONB 스냅샷 + 감사 로그

### 입출입 관리

- **인력 입출입**: 방문자/작업자 체크인·체크아웃
- **장비 반출입**: 입고/출고/재배치/RMA 워크플로우 + 승인 처리

### 전력 모니터링

- **전력 스키마**: PowerPanel → PowerFeed → PowerPort/PowerOutlet
- **SSE 실시간 대시보드**: 5초 간격 전력 데이터 스트리밍
- **TimescaleDB**: hypertable + 압축 정책 + 연속 집계

### 케이블 관리 (선번장)

- **케이블 CRUD**: Interface, ConsolePort, FrontPort, RearPort
- **경로 추적**: 서버 NIC → 패치패널 → 스위치 포트 추적
- **네트워크 토폴로지**: 캔버스 기반 연결 다이어그램

### 보고서 및 내보내기

- **Excel 내보내기**: 랙, 장비, 케이블, 접근 이력, 전력 데이터
- **XML 내보내기**: 랙, 장비 데이터
- **CSV 가져오기**: 장비, 케이블 일괄 등록 + 템플릿 다운로드

### 인증 및 권한 (RBAC)

- **4가지 역할**: Admin, Operator, Viewer, Tenant Viewer
- **13개 리소스 권한 매트릭스**: 역할별 CRUD 제어
- **사용자 관리**: 관리자 전용 페이지 (`/admin/users`)
- **감사 로그**: 로그인, API 호출, 내보내기 이벤트 기록

### 알림 시스템

- **3가지 알림 유형**: 전력 임계값 초과, 보증 만료, 랙 용량 초과
- **심각도 등급**: Critical / Warning / Info
- **알림 채널**: Slack 웹훅, 이메일, 인앱 알림
- **알림 이력**: 발생 이력 조회 및 확인(acknowledge) 처리

### API 문서

- **인터랙티브 API 레퍼런스**: `/api-docs` 경로에서 Scalar UI 기반 API 문서 제공
- **OpenAPI 3.1.1 스펙**: 40개 이상의 API 엔드포인트 문서화
- **Try It Out**: 브라우저에서 직접 API 테스트 가능

## 프로젝트 구조

```text
app/                          # Next.js App Router
  (auth)/login/               # 로그인 페이지
  access/                     # 입출입 관리
  admin/users/                # 사용자 관리 (관리자 전용)
  alerts/                     # 알림 대시보드
  api-docs/                   # API 레퍼런스 (Scalar UI)
  cables/                     # 케이블 관리
  dashboard/                  # 대시보드
  devices/                    # 장비 관리
  power/                      # 전력 모니터링
  reports/                    # 보고서/내보내기
  sites/                      # 사이트/랙 관리
  topology/                   # 네트워크 토폴로지
  api/                        # API 라우트
components/
  ui/                         # shadcn/ui 프리미티브
  admin/                      # 관리자 컴포넌트
  alerts/                     # 알림 컴포넌트
  cables/                     # 케이블 컴포넌트
  common/                     # 공통 컴포넌트
  layout/                     # 레이아웃 (헤더, 푸터)
  power/                      # 전력 모니터링 컴포넌트
  reports/                    # 보고서 컴포넌트
  topology/                   # 토폴로지 컴포넌트
db/
  schema/                     # Drizzle ORM 스키마
  seed.ts                     # 시드 데이터
lib/
  auth/rbac.ts                # RBAC 권한 매트릭스
  alerts/                     # 알림 평가 엔진
  export/                     # Excel/XML/CSV 유틸리티
  swagger/openapi.ts          # OpenAPI 3.1.1 스펙 정의
stores/                       # Zustand 스토어
types/                        # TypeScript 타입 정의
scripts/                      # DB 초기화 SQL
```

## 문서

| 문서 | 설명 |
| --- | --- |
| [ROADMAP.md](./docs/ROADMAP.md) | 프로젝트 비전, 기술 스택, 데이터 모델, 구현 로드맵 |
| [CLAUDE.md](./CLAUDE.md) | 개발 아키텍처 가이드 (English) |
