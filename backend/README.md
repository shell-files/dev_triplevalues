공급망 맵 워크플로우 BE를 설계하고 개발합니다. 먼저 기존 DB 구조를 확인합니다.
## ✅ 공급망 맵 워크플로우 BE 개발 완료 (3파일)

### 파일 구성 및 배치

| 파일 | 배치 경로 | 역할 |
|---|---|---|
| **WORKFLOW_MIGRATION.sql** | DB 실행 | 신규 테이블 2개 생성 |
| **workflow_api.py** | `backend/src/apis/workflow.py` | REST API 라우터 (10개 엔드포인트) |
| **workflow_model.py** | `backend/src/models/workflow.py` | 비즈니스 로직 (10개 함수) |

### 신규 DB 테이블

| 테이블 | 역할 |
|---|---|
| `MATERIAL_REQUEST` | 차수별 원자재 요청 이력 (oem_po_id 통일 키, 상태 추적) |
| `MATERIAL_DRAFT` | 차수별 임시 저장 스냅샷 |

### API 엔드포인트 (10개)

| Method | 경로 | 기능 | 권한 |
|---|---|---|---|
| `POST` | `/workflow/request` | 원자재 요청 생성 (Top-Down) | 원청사/1차/2차 |
| `GET` | `/workflow/request/{id}` | 요청 상세 + 하위 체인 조회 | 전체 |
| `GET` | `/workflow/requests/{partnerId}` | 기업별 요청 목록 | 전체 |
| `POST` | `/workflow/approve` | 하위 데이터 승인 | 1차/2차 |
| `POST` | `/workflow/reject` | 하위 데이터 반려 (사유 필수) | 1차/2차 |
| `POST` | `/workflow/submit` | 상위 방향 승인 요청 (Bottom-Up) | 2차/3차 |
| `POST` | `/workflow/final-register` | 1차 최종 등록 | 1차만 |
| `POST` | `/workflow/draft` | 임시 저장 | 전체 협력사 |
| `GET` | `/workflow/draft/{reqId}/{partnerId}` | 임시 저장 조회 | 전체 |
| `GET` | `/workflow/tree/{oemPoId}` | 원청사 PO 기준 전체 트리 | 전체 |

### 차수별 권한 매트릭스

| 권한 | 원청사(0차) | 1차 가공 | 2차 제련 | 3차 채굴 |
|---|---|---|---|---|
| 요청 생성 | ✅ | ✅ | ✅ | ❌ |
| 승인 | ❌ | ✅ | ✅ | ❌ |
| 반려 | ❌ | ✅ | ✅ | ❌ |
| 상위 제출 | ❌ | ❌ | ✅ | ✅ |
| 최종 등록 | ❌ | ✅ | ❌ | ❌ |
| 임시 저장 | ❌ | ✅ | ✅ | ✅ |
| 조회 | ✅ | ✅ | ✅ | ✅ |

### 상태 흐름도

```
REQUESTED → IN_PROGRESS → SUBMITTED → APPROVED → FINAL
                              ↓
                          REJECTED → (수정 후) → SUBMITTED
```

### PO ID 통일 설계

```
원청사 발주 PO-OEM-NOV-001 기준으로 전체 트리 통일:

원청사 → 1차 요청: oem_po_id = "PO-OEM-NOV-001"
1차 → 2차 요청:   oem_po_id = "PO-OEM-NOV-001"  ← 동일
2차 → 3차 요청:   oem_po_id = "PO-OEM-NOV-001"  ← 동일

GET /workflow/tree/PO-OEM-NOV-001 → 전체 체인 한 번에 조회
```



✅ DB.sql v0.6 — BE 교차 분석 기반 스키마 동기화 완료

1. 소스 코드 ↔ DB 교차 분석 결과
| 구분 | 테이블 | BE 참조 | DB.sql | 조치 |
|---|---|---|---|---|
| ✅ 활성 | USER, ALARM, COMPANY,</br>FACTORY, TOKEN | ✅ | ✅ | 유지 |
| ✅ 활성 | BOM, BOM_TIER_TREE,</br>RAW_MATERIAL, PURCHASE_ORDER | ✅</br>supplychain.py | ✅ | 유지 |
| ✅ 활성 | RM_TIER_TREE, RM_APPROVAL | ✅</br>supplychain.py | ✅ | 유지 |
| ✅ 활성 | AI_AGENT_RULE, AI_AGENT_ALERT,</br>ESG_RISK_CRITERIA | ✅ risk.py | ✅ | 유지 |
| ✅ 활성 | SELF_ASSESS_ANSWER,</br>SELF_ASSESS_CHECKLIST | ✅ | ✅ | 유지 |
| ✅ 활성 | LICENSE_FILE, SUPPORTING_FILE,</br>INVITATION_MESSAGE | ✅ | ✅ | 유지 |
| ❌ DB 누락 | AI_AGENT_RUN_LOG | ✅</br>agentpipeline.py | ❌ | v0.6 추가 |
| 🆕 신규 | MATERIAL_REQUEST | workflow.py</br>(신규) | ❌ | v0.6 추가 |
| 🆕 신규 | MATERIAL_DRAFT | workflow.py</br>(신규) | ❌ | v0.6 추가 |
| 🗑️ 삭제 | INVITE | ❌ 미참조 | ✅ | v0.6 삭제</br>(INVITATION_MESSAGE</br>로 대체) |
| 🗑️ 삭제 | RM_APPROVAL_STEP | ❌ 미참조 | ✅ | v0.6 삭제</br>(RM_APPROVAL로 통합) |
| 🔒 예약 | ROLE, USER_ROLE,</br>ROLE_MENU_ACCESS | ❌ | ✅ | RESERVED</br>(RBAC 향후 구현) |
| 🔒 예약 | ESG_INDICATOR,</br>SELF_ASSESS_REPORT 등 6개 | ❌ | ✅ | RESERVED</br>(향후 구현) |
2. v0.6 변경 이력 (Changelog)
v0.6 [2026-06-19] BE 소스 교차 분석 기반 스키마 동기화
  + AI_AGENT_RUN_LOG 신규  (agentpipeline.py 실사용)
  + MATERIAL_REQUEST 신규  (워크플로우 요청 추적)
  + MATERIAL_DRAFT 신규    (임시 저장 스냅샷)
  - INVITE 삭제            (INVITATION_MESSAGE로 완전 대체)
  - RM_APPROVAL_STEP 삭제  (BE 미참조, RM_APPROVAL로 통합)
  * 예약 테이블 8개에 RESERVED 태그 부여
3. 테이블 통계 (v0.5 → v0.6)
v0.5: 30개 테이블
v0.6: 31개 테이블 (+3 신규, -2 삭제 = 순증 1개)

4. supplychain vs workflow 파일명 설계 의도 답변
이 두 파일은 역할이 완전히 다른 별개의 레이어입니다.
supplychain.py = 데이터 모델 (Data Layer)
공급망에 "어떤 데이터가 존재하는가"를 관리합니다. BOM 제품 목록 조회, 원자재 마스터 CRUD, PO 거래 실적 조회, 공급망 트리(BOM_TIER_TREE) 구성, 버전 히스토리 생성 등 정적 데이터의 읽기/쓰기를 담당합니다.
workflow.py = 프로세스 모델 (Process Layer)
공급망 데이터에 대해 "누가 어떤 행위를 할 수 있는가"를 제어합니다. 원자재 요청/승인/반려/임시저장/최종등록이라는 상태 머신(State Machine)과 차수별 권한 매트릭스를 관리합니다.
supplychain.py:  "열 차폐판의 BOM 트리에 NOV-001의 Al 3003 원자재가 있다"  (사실)
workflow.py:     "2차 협력사가 이 원자재를 1차에 승인 요청할 수 있다"     (규칙)
같은 supplychain 이름으로 합치면 단일 파일이 700줄 이상으로 비대해지고, 데이터 조회 로직과 상태 전이 로직이 뒤섞여 유지보수가 어려워집니다. 분리함으로써 각 파일이 300줄 내외의 단일 책임(SRP)을 유지하며, FE에서도 /supplychain/products(데이터 조회)와 /workflow/approve(프로세스 실행)를 직관적으로 구분하여 호출할 수 있습니다.