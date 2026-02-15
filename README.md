# DC Infra Map (DCIM)

데이터센터 인프라 관리 및 시각화를 위한 Next.js 웹 애플리케이션입니다.

## 프로젝트 개요

데이터센터의 랙, 장비, 케이블, 전력, 접근 권한 등 인프라 자산을 통합 관리하고 시각화하는 DCIM(Data Center Infrastructure Management) 시스템입니다.

## 주요 기능

### Phase 0: 기반 구축

- 프로젝트 스캐폴딩 (Next.js 16, Tailwind CSS 4, shadcn/ui)
- 다크/라이트 테마 전환
- 반응형 레이아웃

### Phase 1: 랙 관리

- 랙 CRUD 및 목록/상세 페이지
- 장비(Device) 관리 및 랙 시각화

### Phase 2: 접근 관리 및 전력 모니터링

- 접근 권한 관리
- 전력 모니터링 대시보드

### Phase 3: 네트워크 및 케이블 관리

- 인터페이스, 콘솔 포트, 프론트/리어 포트 관리
- 케이블 CRUD 및 경로 추적
- 네트워크 토폴로지 시각화

### Phase 4: 보고서 및 내보내기/가져오기

- **Excel 내보내기**: 랙, 장비, 케이블, 접근 권한, 전력 데이터를 `.xlsx` 형식으로 다운로드
- **XML 내보내기**: 랙, 장비 데이터를 XML 형식으로 다운로드
- **CSV 가져오기**: 장비, 케이블 데이터를 CSV 파일로 일괄 등록
- **CSV 템플릿 다운로드**: 가져오기에 필요한 CSV 템플릿 제공
- **보고서 페이지** (`/reports`): 내보내기/가져오기 기능을 통합 제공하는 대시보드

## 시작하기

개발 서버를 실행합니다:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 (타입 체크 포함) |
| `npm run lint` | ESLint 검사 |

## 기술 스택

- **Next.js 16** (App Router, React 19, 서버 컴포넌트)
- **Tailwind CSS 4** (CSS-first 설정)
- **shadcn/ui** (new-york 스타일, Radix UI 기반)
- **next-themes** (다크/라이트 테마)
- **Zustand** (상태 관리)
- **exceljs** (Excel 파일 생성)
- **fast-xml-parser** (XML 내보내기)

## 프로젝트 구조

```text
app/                    # Next.js App Router 페이지
  api/                  # API 라우트
    export/             # Excel/XML 내보내기 엔드포인트
    import/             # CSV 가져오기 엔드포인트
  cables/               # 케이블 관리 페이지
  reports/              # 보고서 페이지
  topology/             # 토폴로지 시각화 페이지
components/
  ui/                   # shadcn/ui 컴포넌트
  common/               # 공통 컴포넌트 (페이지 헤더, 내보내기 버튼 등)
  cables/               # 케이블 관련 컴포넌트
  reports/              # 보고서 관련 컴포넌트
  topology/             # 토폴로지 관련 컴포넌트
  layout/               # 레이아웃 컴포넌트
  theme/                # 테마 관련 컴포넌트
lib/
  export/               # 내보내기/가져오기 유틸리티
config/                 # 사이트 설정
types/                  # TypeScript 타입 정의
stores/                 # Zustand 스토어
db/                     # 데이터베이스 스키마
```

## 문서

- **[ROADMAP.md](./ROADMAP.md)** - 프로젝트 비전 및 구현 로드맵
- **[CLAUDE.md](./CLAUDE.md)** - 개발 아키텍처 가이드 (English)
