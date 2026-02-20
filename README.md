# DC Infra Map (DCIM)

데이터센터 인프라 관리 및 시각화를 위한 웹 기반 DCIM(Data Center Infrastructure Management) 시스템입니다.

랙 배치, 자산 추적, 전력 모니터링, 케이블 관리(선번장), 입출입 관리, 정기 리포트 스케줄링을 하나의 플랫폼에서 제공합니다.

**현재 버전**: 0.1.0 (Step 6 완료, 2026-02-20)

---

## 주요 기능

### 상면 관리

- **랙 엘리베이션 뷰**: 42U 그리드 기반 전면/후면 시각화
- **드래그 앤 드롭**: @dnd-kit 기반 단일 랙 및 멀티 랙 간 장비 배치 및 이동
- **상면 도면**: 2D 공간 배치 뷰 (SVG/Canvas 기반 좌표 정렬)

### 자산 관리

- **장비 CRUD**: 서버, 네트워크 장비, 스토리지, PDU 등 구분 관리
- **고객사 태깅**: Tenant 엔티티 기반 자산 소유권 관리
- **자산 상태 관리**: planned → staged → active → decommissioning → decommissioned 생명주기
- **변경 이력**: JSONB 스냅샷 + 감사 로그
- **지역 관리**: Region → Site → Location 계층형 구조 (Step 6에서 추가)

### 입출입 관리

- **인력 입출입**: 방문자/작업자 체크인·체크아웃 기록
- **장비 반출입**: 입고/출고/재배치/RMA 워크플로우 + 승인 처리
- **이동 이력**: 장비 이동 경로 추적

### 전력 모니터링

- **전력 모델**: PowerPanel → PowerFeed → PowerPort/PowerOutlet 구조
- **SSE 실시간 대시보드**: 5초 간격 전력 데이터 스트리밍
- **TimescaleDB 압축**: hypertable + 압축 정책 (5분 간격 3년 데이터 10-20GB)
- **랙별 전력 현황**: 사용률, 용량, 경고 표시

### 케이블 관리 (선번장)

- **케이블 CRUD**: Interface, ConsolePort, FrontPort, RearPort 관리
- **경로 추적**: 서버 NIC → 패치패널 → 스위치 포트 자동 추적
- **네트워크 토폴로지**: 케이블 터미네이션 기반 정확한 포트 사용률 표시
- **선번장 테이블**: 엑셀 유사 형태의 케이블 연결표

### 보고서 및 내보내기

- **Excel 내보내기**: 랙 배치, 장비 목록, 케이블 연결, 입출입 이력, 전력 데이터
- **XML 내보내기**: 표준 XML 스키마로 외부 시스템 연동
- **CSV 가져오기**: 장비/케이블 일괄 등록 + 템플릿 다운로드
- **정기 리포트 스케줄링**: node-cron + nodemailer로 자동 이메일 발송 (Step 6)

### 인증 및 권한 (RBAC)

- **4가지 역할**: Admin, Operator, Viewer, Tenant Viewer
- **13개 리소스 권한**: CRUD 작업별 역할 기반 접근 제어
- **사용자 관리**: 관리자 전용 페이지 (`/admin/users`)
- **감사 로그**: 로그인, API 호출, 자산 조회, 내보내기 이벤트 기록

### 알림 시스템

- **3가지 알림 유형**: 전력 임계값 초과, 보증 만료, 랙 용량 초과
- **심각도 등급**: Critical / Warning / Info
- **알림 채널**: Slack 웹훅, 이메일, 인앱 알림
- **알림 이력**: 발생 이력 조회 및 확인(acknowledge) 처리

### API 문서

- **인터랙티브 API 레퍼런스**: `/api-docs` 경로에서 Scalar UI 기반 문서 제공
- **OpenAPI 3.1.1 스펙**: 40개 이상의 엔드포인트 문서화
- **Try It Out**: 브라우저에서 직접 API 테스트 가능

### 개발 기능

- **전역 커맨드 팔레트**: cmdk 기반 검색 및 네비게이션
- **일괄 작업**: 장비 상태 변경, 삭제 일괄 처리
- **Rate Limiting**: 인메모리 슬라이딩 윈도우 (auth 10/min, export 20/min, api 200/min)

---

## 기술 스택

| 영역 | 기술 | 버전 | 설명 |
| --- | --- | --- | --- |
| **Frontend** | Next.js (App Router) | 16.1.6 | React 19, 서버 컴포넌트 우선 |
| **UI** | Tailwind CSS 4 + shadcn/ui | 최신 | Dark mode, 다크모드 지원 |
| **Database** | PostgreSQL + TimescaleDB | 17 + 2.17.2 | JSONB, 시계열 데이터 압축 |
| **ORM** | Drizzle ORM | ^0.45.1 | SQL-first, 경량, RSC 호환 |
| **Auth** | Auth.js v5 (NextAuth) | beta.30 | Credentials Provider, 벤더 종속 없음 |
| **State** | Zustand + Immer | ^5.0.11 | 글로벌 상태 (드래그, 전력, 알림) |
| **Drag & Drop** | @dnd-kit | core 6.x / sortable 8.x | React 19 호환, 가변 높이 그리드 |
| **Excel** | ExcelJS | ^4.4.0 | 셀 스타일링, 수식 지원 |
| **XML** | fast-xml-parser | ^5.3.6 | 양방향 파싱/생성 |
| **Real-time** | SSE (Server-Sent Events) | 브라우저 내장 | 단방향 모니터링, 가볍음 |
| **API Docs** | @scalar/nextjs-api-reference | ^0.9.19 | OpenAPI 3.1.1, App Router 네이티브 |
| **Scheduling** | node-cron | ^4.2.1 | 서버사이드 스케줄링 |
| **Email** | nodemailer | ^7.0.13 | SMTP 이메일 발송 |
| **Testing** | Vitest + Playwright | ^4.0.18 / ^1.50.0 | 단위테스트 + E2E 테스트 |
| **Container** | Docker + Kubernetes | 최신 | 멀티스테이지 빌드, Helm 배포 |

---

## 빠른 시작

### 사전 요구사항

- **Node.js** 20+
- **Docker** (PostgreSQL + TimescaleDB 실행용)
- **npm** 또는 **yarn**
- **Playwright 브라우저** (E2E 테스트용, `npx playwright install`)

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd dc-infra-map

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env.local
# AUTH_SECRET 값 생성하여 .env.local에 입력
npx auth secret

# 4. 데이터베이스 시작
docker compose up -d

# 5. DB 초기화 (마이그레이션 + TimescaleDB hypertable 설정)
npm run db:setup

# 6. 시드 데이터 입력
npm run db:seed

# 7. 개발 서버 실행
npm run dev
```

브라우저에서 <http://localhost:3000> 을 열어 확인합니다.

### 로그인 계정

| 계정 유형 | 이메일 | 비밀번호 |
| --- | --- | --- |
| **관리자** | `admin@dcim.local` | `admin1234` |

### 환경 변수 (.env.local)

```bash
# Database
DATABASE_URL=postgresql://dcim:dcim_local_password@localhost:5432/dcim

# Auth.js
AUTH_SECRET=<npx auth secret으로 생성>
AUTH_URL=http://localhost:3000

# 시드 데이터용 초기 관리자 계정
ADMIN_EMAIL=admin@dcim.local
ADMIN_PASSWORD=admin1234

# SMTP (정기 리포트 이메일 발송용, 선택사항)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<이메일>
SMTP_PASS=<앱 비밀번호>
SMTP_FROM=dcim@company.com
```

---

## 개발 명령어

### 서버 및 빌드

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 (타입 체크 포함) |
| `npm start` | 빌드된 앱 실행 |
| `npm run lint` | ESLint 검사 |

### 개발 서버 관리 (백그라운드)

| 명령어 | 설명 |
| --- | --- |
| `npm run server:start` | 백그라운드 시작 (PID: `scripts/.server.pid`) |
| `npm run server:stop` | 백그라운드 중지 |
| `npm run server:restart` | 백그라운드 재시작 |

### 데이터베이스

| 명령어 | 설명 |
| --- | --- |
| `npm run db:migrate` | Drizzle 마이그레이션 실행 |
| `npm run db:push` | 스키마 직접 적용 |
| `npm run db:generate` | 마이그레이션 파일 생성 |
| `npm run db:seed` | 시드 데이터 입력 |
| `npm run db:timescale` | TimescaleDB hypertable 설정 |
| `npm run db:setup` | db:migrate + db:timescale 순서로 실행 |
| `npm run db:studio` | Drizzle Studio (DB 브라우저) |

### 테스트

| 명령어 | 설명 |
| --- | --- |
| `npm test` | Vitest 감시 모드 (단위 테스트) |
| `npm run test:run` | Vitest 1회 실행 |
| `npm run test:coverage` | 커버리지 포함 테스트 |
| `npm run test:e2e` | Playwright E2E 테스트 |
| `npm run test:e2e:ui` | Playwright UI 모드 |
| `npm run test:e2e:report` | E2E 테스트 결과 보고서 |

### Kubernetes 배포

| 명령어 | 설명 |
| --- | --- |
| `npm run k8s:build` | Docker 이미지 빌드 (local docker-desktop) |
| `npm run k8s:deploy` | K8s 전체 배포 (namespace → postgres → app → migration) |
| `npm run k8s:migrate` | K8s migration Job 실행 |
| `npm run k8s:destroy [--all]` | K8s 리소스 삭제 (`--all` 플래그로 PVC 포함 삭제) |
| `npm run k8s:status` | K8s 리소스 상태 확인 |
| `npm run k8s:ingress` | nginx-ingress controller 설치 (docker-desktop 일회성) |

### Helm 배포

| 명령어 | 설명 |
| --- | --- |
| `npm run helm:lint` | Helm 차트 검증 |
| `npm run helm:install:dev` | dev 환경 배포 |
| `npm run helm:install:staging` | staging 환경 배포 |
| `npm run helm:install:prod` | prod 환경 배포 |
| `npm run helm:template:dev` | dev 템플릿 렌더링 (배포 X) |
| `npm run helm:template:staging` | staging 템플릿 렌더링 |
| `npm run helm:template:prod` | prod 템플릿 렌더링 |
| `npm run helm:uninstall` | Helm 릴리스 제거 |
| `npm run helm:status` | Helm 릴리스 상태 |

---

## 배포

### 로컬 개발

```bash
npm run dev
# 또는 백그라운드 실행
npm run server:start
```

### Kubernetes 배포 (docker-desktop)

**1회 설정** (nginx-ingress controller):

```bash
npm run k8s:ingress
# /etc/hosts에 다음 추가:
# 127.0.0.1  dcim.local
```

**배포 실행**:

```bash
npm run k8s:deploy
```

**확인**:

```bash
npm run k8s:status
# Ingress를 통한 접근:
# http://dcim.local

# 또는 kubectl port-forward:
# kubectl port-forward svc/app 3000:3000
```

**삭제**:

```bash
npm run k8s:destroy          # 리소스만 삭제
npm run k8s:destroy --all    # 리소스 + PVC 데이터 삭제
```

### Helm Chart 배포 (프로덕션)

**초기 설정** (환경별 values 파일 생성):

```bash
# dev 환경
cp helm/dcim/values.dev.example.yaml helm/dcim/values.dev.yaml
# 필요한 값 수정 (비밀번호, 도메인, 리소스 등)
vim helm/dcim/values.dev.yaml
```

**배포**:

```bash
# dev 환경
npm run helm:install:dev

# staging 환경
npm run helm:install:staging

# prod 환경
npm run helm:install:prod
```

**배포 확인**:

```bash
npm run helm:status
kubectl get all -n dcim
```

**환경별 주요 설정**:

| 항목 | dev | staging | prod |
| --- | --- | --- | --- |
| 레플리카 수 | 1 | 2 | 3 |
| 도메인 | dcim-dev.local | dcim-staging.example.com | dcim.example.com |
| TLS | 비활성화 | 비활성화 | 활성화 |
| CPU (요청/제한) | 100m/500m | 250m/1000m | 500m/2000m |
| 메모리 (요청/제한) | 256Mi/512Mi | 512Mi/1Gi | 1Gi/2Gi |
| DB 스토리지 | 10Gi | 20Gi | 50Gi |

---

## 프로젝트 구조

```text
app/                          # Next.js App Router
  (auth)/login/               # 로그인 페이지
  access/                     # 입출입 관리
  admin/users/                # 사용자 관리 (관리자 전용)
  alerts/                     # 알림 대시보드 (Rules/History/Channels 탭)
  api-docs/                   # API 레퍼런스 (Scalar UI)
  cables/                     # 케이블 관리 (선번장)
  dashboard/                  # 대시보드
  devices/                    # 장비 관리
  power/                      # 전력 모니터링
  regions/                    # 지역 관리 (Step 6에서 추가)
  reports/                    # 보고서/내보내기/스케줄링 (Step 6에서 스케줄 탭 추가)
  sites/                      # 사이트/랙 관리
  tenants/                    # 고객사 관리
  topology/                   # 네트워크 토폴로지
  api/                        # API 라우트

components/
  ui/                         # shadcn/ui 프리미티브
  admin/                      # 관리자 컴포넌트
  alerts/                     # 알림 컴포넌트
  cables/                     # 케이블 컴포넌트
  common/                     # 공통 컴포넌트 (status-badge-factory, route-error, table-loading 등)
  floor-plan/                 # 상면 도면 (2D Canvas 기반)
  layout/                     # 레이아웃 (헤더, 푸터)
  power/                      # 전력 모니터링 컴포넌트
  rack/                       # 랙 엘리베이션 (multi-rack DnD 지원)
  reports/                    # 보고서/내보내기 컴포넌트
  theme/                      # Dark mode provider
  topology/                   # 네트워크 토폴로지 시각화

db/
  schema/                     # Drizzle ORM 스키마
    enums.ts                  # 열거형 (userRole, cableStatus, alertSeverity 등)
    auth.ts, core.ts, devices.ts, access.ts, power.ts, cables.ts, audit.ts, alerts.ts, reports.ts, relations.ts
  seed.ts                     # 시드 데이터 스크립트
  scripts/                    # SQL 초기화 스크립트

lib/
  api.ts                      # API 클라이언트 유틸
  audit.ts                    # 감사 로그 (logAudit, logLoginEvent, logExportEvent)
  rate-limit.ts               # Rate Limiting (checkRateLimit, RATE_LIMITS 프리셋)
  auth/rbac.ts                # RBAC 권한 매트릭스 (checkPermission, isAdmin, canWrite, canDelete)
  auth/with-auth.ts           # API 라우트 HOF (withAuth, withAuthOnly)
  alerts/                     # 알림 평가 엔진 + 알림 서비스
  export/                     # Excel/XML/CSV 내보내기/가져오기 유틸
  mailer/report-mailer.ts     # Nodemailer SMTP 설정
  scheduler/report-scheduler.ts  # node-cron 정기 리포트 스케줄러
  swagger/openapi.ts          # OpenAPI 3.1.1 스펙 정의

hooks/
  use-search-params-filter.ts  # URL 쿼리 필터 관리
  use-cascading-select.ts      # 종속 선택 데이터 페칭
  use-api-mutation.ts          # API 폼 제출 HOF
  use-delete-mutation.ts       # 삭제 API HOF

stores/                       # Zustand 스토어
  use-site-store.ts
  use-rack-store.ts           # 멀티 랙 지원
  use-device-store.ts
  use-region-store.ts         # Step 6에서 추가
  use-access-store.ts
  use-power-store.ts
  use-cable-store.ts
  use-alert-store.ts

types/                        # TypeScript 타입
  index.ts                    # 공통 타입
  entities.ts                 # Entity 타입
  cable.ts                    # Cable/Interface 타입
  alerts.ts                   # Alert 타입
  next-auth.d.ts              # NextAuth 타입 확장

scripts/                      # 셸 스크립트
  server-start.sh             # 백그라운드 서버 시작
  server-stop.sh              # 백그라운드 서버 중지
  server-restart.sh           # 백그라운드 서버 재시작
  k8s-build.sh                # Docker 이미지 빌드
  k8s-deploy.sh               # K8s 배포 오케스트레이션
  k8s-setup-ingress.sh        # nginx-ingress 설치
  k8s-migrate.sh              # K8s migration Job 실행
  k8s-destroy.sh              # K8s 리소스 삭제

k8s/                          # Kubernetes 매니페스트
  namespace.yaml              # dcim 네임스페이스
  postgres/                   # PostgreSQL StatefulSet
  app/                        # Next.js Deployment + Service + Ingress
  migration-job.yaml          # 마이그레이션 Job

helm/dcim/                    # Helm Chart
  Chart.yaml
  values.yaml                 # 기본값
  values.dev.example.yaml     # dev 환경 예제 (실제 사용: values.dev.yaml)
  values.staging.example.yaml # staging 예제
  values.prod.example.yaml    # prod 예제
  templates/                  # Helm 템플릿

drizzle/                      # Drizzle 마이그레이션
  0001_timescaledb_setup.sql  # TimescaleDB hypertable 설정
  0002_rack_floor_plan_position.sql  # 상면 도면 좌표 (Step 6)

tests/                        # Vitest 단위 테스트
  lib/validators/
  lib/auth/
  lib/export/
  lib/alerts/

e2e/                          # Playwright E2E 테스트
  auth.spec.ts
  dashboard.spec.ts
  devices.spec.ts
  navigation.spec.ts
  fixtures/auth.ts            # 인증 세션 픽스처

config/
  site.ts                     # 사이트 메타데이터, 네비게이션

instrumentation.ts            # Next.js 계측 (report scheduler 초기화)
next.config.ts                # Next.js 설정 (output: 'standalone')
drizzle.config.ts             # Drizzle 설정
playwright.config.ts          # Playwright 설정
vitest.config.ts              # Vitest 설정
tailwind.config.ts            # Tailwind 설정
```

---

## 페이지 목록

| 경로 | 설명 | 접근 권한 |
| --- | --- | --- |
| `/` | 랜딩 페이지 | 전체 |
| `/(auth)/login` | 로그인 | 비로그인 |
| `/dashboard` | 대시보드 (개요) | 로그인 필수 |
| `/sites` | 사이트/랙 관리 | Operator+ |
| `/regions` | 지역 관리 (Step 6) | Operator+ |
| `/devices` | 장비 관리 | Operator+ |
| `/tenants` | 고객사 관리 | Operator+ |
| `/access` | 입출입 관리 | Operator+ |
| `/power` | 전력 모니터링 대시보드 | Operator+ |
| `/cables` | 케이블 관리 (선번장) | Operator+ |
| `/topology` | 네트워크 토폴로지 | Viewer+ |
| `/reports` | 보고서/내보내기/스케줄 | Operator+ |
| `/alerts` | 알림 대시보드 (Rules/History/Channels) | Operator+ |
| `/admin/users` | 사용자 관리 | Admin 전용 |
| `/api-docs` | API 레퍼런스 (Scalar UI) | 전체 |

---

## API 엔드포인트

**기본 URL**: `http://localhost:3000/api`

### 인증

- `POST /auth/signin` — 로그인
- `POST /auth/signout` — 로그아웃
- `GET /auth/session` — 현재 세션

### 사이트/지역/랙

- `GET /sites` — 사이트 목록
- `POST /sites` — 사이트 생성
- `GET /sites/[id]` — 사이트 상세
- `PATCH /sites/[id]` — 사이트 수정
- `DELETE /sites/[id]` — 사이트 삭제
- `GET /regions` — 지역 목록
- `POST /regions` — 지역 생성
- `GET /regions/[id]` — 지역 상세
- `PATCH /regions/[id]` — 지역 수정
- `DELETE /regions/[id]` — 지역 삭제
- `GET /racks` — 랙 목록
- `POST /racks` — 랙 생성
- `GET /racks/[id]` — 랙 상세
- `PATCH /racks/[id]` — 랙 수정
- `DELETE /racks/[id]` — 랙 삭제

### 장비

- `GET /devices` — 장비 목록
- `POST /devices` — 장비 생성
- `GET /devices/[id]` — 장비 상세
- `PATCH /devices/[id]` — 장비 수정
- `DELETE /devices/[id]` — 장비 삭제
- `POST /devices/batch` — 일괄 작업 (상태 변경/삭제)
- `GET /device-types` — 장비 유형 목록
- `GET /manufacturers` — 제조사 목록

### 전력

- `GET /power/panels` — 전력판 목록
- `POST /power/panels` — 전력판 생성
- `GET /power/feeds` — 전력 피드 목록
- `POST /power/feeds` — 전력 피드 생성
- `POST /power/readings` — 전력 데이터 입력
- `GET /power/readings` — 전력 데이터 조회 (mock 데이터 포함)
- `GET /power/sse` — 전력 SSE 스트리밍
- `GET /power/summary` — 전력 요약

### 케이블

- `GET /cables` — 케이블 목록
- `POST /cables` — 케이블 생성
- `GET /cables/[id]` — 케이블 상세
- `DELETE /cables/[id]` — 케이블 삭제
- `GET /cables/trace/[id]` — 케이블 경로 추적
- `GET /interfaces` — Interface 목록
- `POST /interfaces` — Interface 생성

### 입출입

- `GET /access-logs` — 입출입 이력 목록
- `POST /access-logs` — 입출입 기록 생성
- `GET /equipment-movements` — 장비 이동 이력
- `POST /equipment-movements` — 장비 이동 생성
- `GET /equipment-movements/[id]/approve` — 승인

### 고객사/위치

- `GET /tenants` — 고객사 목록
- `GET /locations` — 위치 목록

### 내보내기/가져오기

- `GET /export/racks` — 랙 Excel 내보내기
- `GET /export/devices` — 장비 Excel 내보내기
- `GET /export/cables` — 케이블 Excel 내보내기
- `GET /export/xml/racks` — 랙 XML 내보내기
- `POST /import/devices` — 장비 CSV 가져오기
- `GET /import/templates/[type]` — CSV 템플릿 다운로드

### 알림

- `GET /alerts/rules` — 알림 규칙 목록
- `POST /alerts/rules` — 알림 규칙 생성
- `GET /alerts/history` — 알림 이력
- `PATCH /alerts/history/[id]/acknowledge` — 알림 확인
- `GET /alerts/channels` — 알림 채널 목록
- `POST /alerts/channels` — 알림 채널 생성
- `POST /alerts/evaluate` — 수동 알림 평가

### 정기 리포트

- `GET /reports/schedules` — 스케줄 목록
- `POST /reports/schedules` — 스케줄 생성
- `GET /reports/schedules/[id]` — 스케줄 상세
- `PATCH /reports/schedules/[id]` — 스케줄 수정
- `DELETE /reports/schedules/[id]` — 스케줄 삭제
- `POST /reports/schedules/[id]/run` — 즉시 실행

### 감사 로그

- `GET /audit-logs` — 감사 로그 조회

### 관리자

- `GET /admin/users` — 사용자 목록
- `POST /admin/users` — 사용자 생성
- `GET /admin/users/[id]` — 사용자 상세
- `PATCH /admin/users/[id]` — 사용자 수정
- `DELETE /admin/users/[id]` — 사용자 삭제

자세한 API 문서는 `/api-docs` 페이지에서 확인할 수 있습니다.

---

## 문서

| 문서 | 설명 |
| --- | --- |
| [ROADMAP.md](./docs/ROADMAP.md) | 프로젝트 비전, 기술 스택, 데이터 모델, 구현 로드맵 |
| [CLAUDE.md](./CLAUDE.md) | 개발 아키텍처 가이드 (English) |
| [.claude/rules/pitfalls.md](./.claude/rules/pitfalls.md) | 일반적인 버그 패턴 및 체크리스트 |
| [.claude/rules/development-workflow.md](./.claude/rules/development-workflow.md) | 기능 개발 절차 |

---

## 시스템 요구사항

### 개발 환경

- Node.js 20+ (LTS 권장)
- npm 10+ 또는 yarn 4+
- Docker & Docker Compose (PostgreSQL + TimescaleDB 실행)
- 4GB+ RAM, 10GB+ 디스크 여유

### 프로덕션 (Kubernetes)

- Kubernetes 1.28+ (docker-desktop, Kind, EKS, GKE, AKS 등)
- Helm 3.x
- nginx-ingress-controller
- 최소 2GB CPU, 2GB 메모리 (1개 노드)
- 10GB+ PVC (PostgreSQL 스토리지)

---

## 성능 특성

### 데이터 볼륨 (1,000 랙 기준)

| 데이터 유형 | 3년 레코드 수 | 저장 용량 |
| --- | --- | --- |
| 정적 자산 | ~520,000 | ~200 MB |
| 변경 이력 | ~342,000 | ~1.0 GB |
| 전력 모니터링 (5분 간격) | ~16.4B | 10~20 GB (TimescaleDB 압축) |
| 감사 로그 | ~1,900,000 | ~2.5 GB |
| **합계** | | **~14~24 GB** |

**참고**: TimescaleDB 압축이 없으면 약 200GB로 증가합니다.

### SSE 스트리밍

- **갱신 간격**: 5초
- **메시지 크기**: 약 1KB (전력 데이터)
- **동시 연결**: 100+ 지원 (Node.js 기본 설정)

---

## 라이선스

프로젝트 라이선스는 별도로 정의됩니다.

---

## 기여

버그 리포트나 기능 제안은 Issues를 통해 제출해주세요.

---

**최종 업데이트**: 2026-02-20 (Step 6 완료)
