# 🎥 선별 관제 기반 **영상 모니터링 시스템** (Spring Boot × React)

> **이벤트가 발생한 화면만** 선별해 표출하고, **실시간 알림·채팅**으로 관제 효율을 높이는 시스템  
> “불필요한 모니터링을 줄이고, **빠르게 대응하는 관제**”가 목표입니다.

![badge-backend](https://img.shields.io/badge/Backend-Spring%20Boot%20(JDK%2017)-6DB33F)
![badge-persistence](https://img.shields.io/badge/Persistence-MyBatis-0F70B7)
![badge-db](https://img.shields.io/badge/DB-MySQL%208-4479A1)
![badge-frontend](https://img.shields.io/badge/Frontend-React/HTML/CSS/JS-61DAFB)
![badge-auth](https://img.shields.io/badge/Auth-Spring%20Security-000000)
![badge-realtime](https://img.shields.io/badge/Realtime-WebSocket-4B32C3)
![badge-tools](https://img.shields.io/badge/Tools-GitHub%20%7C%20SourceTree-blue)

---

## 🧭 목차
- [배경](#-배경)
- [주제](#-주제)
- [목적](#-목적)
- [역할별 기능](#-역할별-기능)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [권한/역할](#-권한역할)
- [화면 구성](#-화면-구성)
- [설치 및 실행](#-설치-및-실행)
- [협업 & 형상관리](#-협업--형상관리)
- [프로젝트 진행 순서](#-프로젝트-진행-순서)
- [배경 기술 (OS & SW)](#-배경-기술-os--sw)
- [외부 연동](#-외부-연동)
- [성과 및 배운 점](#-성과-및-배운-점예시)

---

## 📌 배경
현재 도심 관제 센터는 **수천·수만 대의 CCTV**를 24시간 수동 모니터링해야 해 **중요 이벤트를 놓치기 쉽고**, 인력 피로가 큽니다. 전체 영상 중 대부분은 **의미 없는 장면**이므로 실제 사건 대응에 필요한 정보를 찾는 데 **시간이 과도하게 소요**됩니다.  
**선별 관제 시스템**은 특정 이벤트가 발생한 화면만 선택적으로 모니터링하여 **관제 효율을 높이고 피로도를 줄이는** 것을 목표로 합니다.

## 🎯 주제
**영상의 객체·이벤트를 선별**하여 **발생 시에만 화면을 업데이트**하고, **실시간 알림·채팅**으로 관제팀 간 소통을 지원하는 **선별 관제 시스템**을 구현했습니다.

## 🎯 목적
-  이벤트 발생 시 관제 화면 **실시간 업데이트**
-  조건(시간/장소/유형)에 맞는 **과거 영상 조회**
-  관제팀 간 **실시간 채팅 및 알림**
-  **관리자·담당자·관제사**로 구성된 **유저/권한 관리**

---

## 👤 역할별 기능
### 1) 마스터 로그인
#### 1.1 설정
- **카메라 추가**  
  공공데이터 API를 활용해 CCTV 정보를 불러오고, 필요한 카메라를 **선택 후 추가**합니다. 중복 추가 방지·유효성 검사, 그룹/우선순위 태깅을 지원합니다.
- **분석 카메라 할당**  
  추가된 카메라 리스트를 **분석 서버에 할당**(분석 시작/중지)합니다. 분석 대상(사람/차량/영역침입 등)과 **임계치(Threshold)** 설정을 지원합니다.
- **담당자 계정 관리**  
  마스터는 담당자 계정을 **추가/수정/삭제**(활성/비활성)하고 역할(Role)을 부여합니다. 초기 비밀번호/정책(만료/복잡도) 및 잠금 해제를 관리합니다.

### 2) 담당자 로그인
#### 2.1 설정
- **관제사 계정 관리**  
  관제사 계정을 **추가/수정/삭제**하고 **팀/근무조**에 매핑합니다.
- **관제사 계정 카메라 할당**  
  관제사에게 **관제 대상 카메라**를 배정/회수하고, 우선순위·필터(긴급/중요/일반)를 지정합니다.
#### 2.2 검색
- 담당자는 이벤트 유형/시간/카메라/중요도 기준으로 **히스토리 검색**을 사용할 수 있습니다.  
  결과는 **타임라인/표** 형태로 제공되며, 스냅샷/상세 메타 연동을 지원합니다.

### 3) 관제사 로그인
#### 3.1 영상 관제
- 본인에게 **할당된 카메라**의 선별 화면을 관제합니다.  
  이벤트 발생 시 타일 자동 갱신, 우선순위 기반 정렬, **북마크/담당자 지정** 기능을 제공합니다.
#### 3.2 채팅
- 팀/담당자와 **실시간 채팅**(WebSocket)으로 상황을 공유합니다.  
  **@멘션/읽음 상태/브라우저 알림**을 지원하며, **사건 카드 공유(URL)** 가 가능합니다.

---

## 🧩 주요 기능
1) **인증/인가 (Spring Security)** — 로그인/로그아웃, JWT/세션 보호, 역할(RBAC)별 접근 제어, 실패 횟수 제한, 비밀번호 정책  
2) **설정(관리)** — 계정·권한 CRUD, **카메라/분석 정책** 관리, 채팅 설정, 표출 정책(우선순위/필터)  
3) **선별 관제** — 이벤트 발생 시 타일 자동 갱신, 표출 우선순위·필터, 이벤트 히스토리/타임라인  
4) **과거 영상 조회** — 조건 검색(시간/카메라/유형), 스냅샷/메타 연동, 빠른 탐색  
5) **관제팀 커뮤니케이션** — 실시간 채팅/멘션/알림, 사건 카드 공유, 담당자 할당



---

## 🔧 기술 스택
- **Frontend:** React, React Router, Context/Custom Hooks, Fetch/Axios, HTML, CSS, JavaScript  
- **Backend:** Java 17, Spring Boot, Spring MVC, **Spring Security**, Validation, Scheduling  
- **Persistence:** **MyBatis**, MySQL, HikariCP  
- **Realtime:** WebSocket(STOMP) / Server-Sent Events(옵션)  
- **Infra/툴:** npm, Gradle/Maven, GitHub, **SourceTree (2·3차 프로젝트에서 사용)**

---

## 🔐 권한/역할
| 역할 | 권한 요약 | 주요 화면 접근 |
|---|---|---|
| **관리자(Admin/마스터)** | 사용자/권한/채널/분석 정책 **전체 관리** | 설정 전역, 관제, 로그/이력 |
| **담당자(Manager)** | 관제사 계정/카메라 **배정/회수**, 검색 | 팀 설정, 모니터링, 과거 조회 |
| **관제사(Operator)** | 관제/조회/채팅 **업무 중심** | 대시보드, 타임라인, 채팅 |

---

## 🖥 화면 구성
- **로그인/권한 안내**  
- **대시보드(선별 타일, 우선순위 필터, 실시간 카운터)**  
- **타임라인(이벤트 히스토리/검색/필터)**  
- **과거 영상 조회(조건 검색/프리뷰/메타)**  
- **설정(계정·권한·채팅·카메라·분석 정책)**

---


## ⚙️ 설치 및 실행
### 1) 프로젝트 구조(예시)
```
/project-root
 ├─ backend/            # Spring Boot (API, Security, MyBatis)
 ├─ frontend/           # React (SPA, WebSocket Client)
 └─ docs/
    └─ screenshots/
```

### 2) Backend (Spring Boot)
```bash
cd backend
# application.yml(.properties) 에 DB 연결정보 설정
# spring.datasource.url=jdbc:mysql://localhost:3306/monitoring?serverTimezone=Asia/Seoul
# spring.datasource.username=...
# spring.datasource.password=...

./mvnw spring-boot:run   # 또는 ./gradlew bootRun
```

### 3) Frontend (React)
```bash
cd frontend
npm install
# .env 예시
# REACT_APP_API_BASE=http://localhost:8080
# REACT_APP_WS_BASE=ws://localhost:8080/ws
npm run dev              # 개발 서버
```

---

## 🤝 협업 & 형상관리
- **GitHub** — PR 기반 코드리뷰, 이슈/프로젝트 보드로 작업 추적, 릴리스 노트 관리  
- **SourceTree (2·3차 프로젝트)** — 브랜치 전략(feature/bugfix), 리베이스·충돌 해결, 커밋 그래프 시각화

---

## 📅 프로젝트 진행 순서
1. **주제 선정 및 요구사항 정리** — 선별 관제 목표 정의(이벤트 기반 표출, 피로도 감소, 대응 시간 단축), 역할/권한 설계  
2. **개발 환경 구축** — Backend(Spring Boot, MyBatis, MySQL), Frontend(React), 인증/인가(Spring Security), WebSocket 구성  
3. **화면 및 기능 구현** — 로그인/권한, 설정(계정·카메라·분석), 관제 대시보드, 검색/타임라인, 채팅  
4. **테스트 및 디버깅** — 단위/통합/시나리오 테스트, 성능 점검(인덱스/쿼리 튜닝)  
5. **배포** — 환경별 설정 분리(profiles/.env), 로그/모니터링, 롤백 전략

---

## 🧰 배경 기술 (OS & SW)
- **Frontend:** HTML, CSS, JavaScript, React  
- **Backend:** Java 17 (Spring Boot), C# *(분석 모듈/연동 파트가 존재 시)*  
- **DB/Persistence:** MySQL, MyBatis  
- **Auth/Security:** Spring Security (RBAC, 비밀번호/잠금 정책)  
- **Realtime:** WebSocket(STOMP) 기반 채팅/알림  
- **형상관리:** GitHub, SourceTree


---

## 🔌 외부 연동
- **공공데이터 API – CCTV 메타데이터**: 지역/설치 위치/채널 정보를 조회하여 카메라 추가 시 활용  
- **분석 서버 연동**: 카메라 할당/해제, 분석 대상/임계치 업데이트, 상태 모니터링

---


## 📈 성과 및 배운 점(예시)
- **선별 표출**로 불필요 화면 노출 감소 → **관제 피로 저감**
- 이벤트 **타임라인/필터**로 **대응 시간 단축**
- Spring Security 기반 **역할별 접근제어** 정립, 운영 보안성 향상
- MyBatis 튜닝(인덱스/복합 키)으로 **조건 조회 속도 개선**

> 실제 수치(예: 조회 응답시간, 화면 전환속도, 오류율)는 운영 환경에 맞게 추가하세요.




