-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Alu-ESG Platform — DB 스키마 v0.6 (통합 최신판)                   ║
-- ║  2026-06-05 · App.jsx (2,629줄) 기준 · 전체 30개 테이블            ║
-- ║                                                                  ║
-- ║  ── 명명 규칙 ──                                                   ║
-- ║  DB  : 테이블=UPPER_CASE / 컬럼=snake_case + COMMENT 필수         ║
-- ║        COLLATE=utf8mb4_unicode_ci (한국어 지원)                    ║
-- ║  BE  : 변수·함수=camelCase / 모듈화(Class 지양) / 파일=소문자 단수   ║
-- ║  FE  : 변수·함수=camelCase / 파일=PascalCase 단수 / 컴포넌트=2회↑   ║
-- ║                                                                  ║
-- ║  ── 변경 이력 ──                                                   ║
-- ║  v0.1 ROLE 매핑, ROLE_MENU_ACCESS, NODE_HISTORY                   ║
-- ║  v0.2 전체 컬럼 COMMENT 추가                                       ║
-- ║  v0.3 SELF_ASSESS_ANSWER/CHECKLIST/RISK_CLASS 신규                ║
-- ║  v0.4 ★ 산림파괴 삭제, risk_level='평가중', 명명 규칙 적용           ║
-- ║      ESG_CHECKLIST·ESG_RISK_CRITERIA 신규 (UPPER_CASE 변환)       ║
-- ║      LICENSE_FILE·SUPPORTING_FILE 신규 (파일 관리)                ║
-- ║      RISK_CLASSIFICATION 제거 (ESG_RISK_CRITERIA와 중복)          ║
-- ║  v0.5 TOKEN 테이블 추가 및 AI_AGENT_RULE 컬럼 추가 및 수정           ║
-- ║  v0.6 [2026-06-19] BE 소스 교차 분석 기반 스키마 동기화              ║
-- ║      + AI_AGENT_RUN_LOG 신규 (agentpipeline.py 실사용)              ║
-- ║      + MATERIAL_REQUEST 신규 (워크플로우 요청 추적)                   ║
-- ║      + MATERIAL_DRAFT 신규 (임시 저장 스냅샷)                        ║
-- ║      - INVITE 삭제 (INVITATION_MESSAGE로 완전 대체)                 ║
-- ║      - RM_APPROVAL_STEP 삭제 (BE 미참조, RM_APPROVAL로 통합)        ║
-- ║      * ROLE/USER_ROLE/ROLE_MENU_ACCESS → RESERVED 태그 부여         ║
-- ║      * ESG_INDICATOR/SELF_ASSESS_REPORT 등 → RESERVED 태그 부여     ║
-- ║                                                                  ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS `triplevalues`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `triplevalues`;
SET FOREIGN_KEY_CHECKS = 0;

-- ══════════════════════════════════════════════════════════
-- S1. 사용자 · 권한 · 메뉴접근 · 알림 (5)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `USER`;
CREATE TABLE `USER` (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '사용자 고유 ID (PK)',
  email      VARCHAR(255) NOT NULL                COMMENT '이메일 (로그인 ID, UNIQUE)',
  password   VARCHAR(255) NOT NULL                COMMENT '비밀번호 (BCrypt 암호화)',
  name       VARCHAR(100) NOT NULL                COMMENT '사용자 이름',
  phone      VARCHAR(20)                          COMMENT '휴대폰 번호',
  delete_yn  TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부 (0=활성, 1=삭제)',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (id), UNIQUE KEY uq_email (email)
) ENGINE=InnoDB COMMENT='사용자 마스터';

DROP TABLE IF EXISTS `ROLE`;
CREATE TABLE `ROLE` (
  id          INT         NOT NULL AUTO_INCREMENT COMMENT '권한 고유 ID (PK)',
  role_code   VARCHAR(20) NOT NULL                COMMENT '권한 코드 (OEM/TIER1/TIER2/TIER3)',
  role_name   VARCHAR(50) NOT NULL                COMMENT '권한명 — App.jsx select value (현대모비스/1차 협력사/2차 협력사/3차 협력사)',
  tier_level  TINYINT                             COMMENT '공급망 차수 (0=원청사, 1~3)',
  menu_scope  VARCHAR(30)                         COMMENT '메뉴 범위 (FULL=8메뉴 / PARTNER=2메뉴)',
  description VARCHAR(200)                        COMMENT '권한 설명',
  PRIMARY KEY (id), UNIQUE KEY uq_role_code (role_code)
) ENGINE=InnoDB COMMENT='권한 마스터 — App.jsx 역할 전환 매핑';

INSERT INTO `ROLE` (id,role_code,role_name,tier_level,menu_scope,description) VALUES
(1,'OEM','현대모비스',0,'FULL','원청사 — 8개 메뉴 전체'),
(2,'TIER1','1차 협력사',1,'PARTNER','1차 합금 — 2개 메뉴'),
(3,'TIER2','2차 협력사',2,'PARTNER','2차 제련 — 2개 메뉴'),
(4,'TIER3','3차 협력사',3,'PARTNER','3차 채굴 — 2개 메뉴');

DROP TABLE IF EXISTS `USER_ROLE`;
CREATE TABLE `USER_ROLE` (
  id         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '매핑 ID (PK)',
  user_id    BIGINT   NOT NULL                COMMENT '사용자 ID (FK→USER.id)',
  company_id BIGINT   NOT NULL                COMMENT '기업 ID (FK→COMPANY.id)',
  role_id    INT      NOT NULL                COMMENT '권한 ID (FK→ROLE.id)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (id), UNIQUE KEY uq_user_company (user_id,company_id)
) ENGINE=InnoDB COMMENT='사용자-기업-권한 매핑';

DROP TABLE IF EXISTS `ROLE_MENU_ACCESS`;
CREATE TABLE `ROLE_MENU_ACCESS` (
  id         INT         NOT NULL AUTO_INCREMENT COMMENT '접근 권한 ID (PK)',
  role_id    INT         NOT NULL                COMMENT '권한 ID (FK→ROLE.id)',
  menu_key   VARCHAR(30) NOT NULL                COMMENT 'App.jsx pages 키 (dashboard/partner/bom/po/rawmat/risk/inspection/selfassess)',
  menu_label VARCHAR(50) NOT NULL                COMMENT '메뉴 표시명',
  nav_group  VARCHAR(50)                         COMMENT 'NAV 카테고리 그룹명',
  sort_order INT         DEFAULT 0               COMMENT '정렬 순서',
  PRIMARY KEY (id), UNIQUE KEY uq_role_menu (role_id,menu_key)
) ENGINE=InnoDB COMMENT='역할별 메뉴 접근 제어';

INSERT INTO `ROLE_MENU_ACCESS` (role_id,menu_key,menu_label,nav_group,sort_order) VALUES
(1,'dashboard','메인 대시보드','기준 및 협력사 정보',1),(1,'partner','협력사 정보','기준 및 협력사 정보',2),
(1,'bom','BOM 관리','기준 및 협력사 정보',3),(1,'po','PO 관리','구매 및 자재 관리',4),
(1,'rawmat','원자재 관리','구매 및 자재 관리',5),(1,'risk','리스크 현황','실사 및 평가',6),
(1,'inspection','현장 실사','실사 및 평가',7),(1,'selfassess','자가진단 보고서','실사 및 평가',8),
(2,'partner','협력사 정보','협력사 전용 메뉴',1),(2,'rawmat','원자재 관리','협력사 전용 메뉴',2),
(3,'partner','협력사 정보','협력사 전용 메뉴',1),(3,'rawmat','원자재 관리','협력사 전용 메뉴',2),
(4,'partner','협력사 정보','협력사 전용 메뉴',1),(4,'rawmat','원자재 관리','협력사 전용 메뉴',2);

DROP TABLE IF EXISTS `ALARM`;
CREATE TABLE `ALARM` (
  id         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '알림 ID (PK)',
  partner_id VARCHAR(20)  NOT NULL                COMMENT '협력사 코드 (FK→COMPANY.partner_id)',
  type       VARCHAR(30)  NOT NULL                COMMENT '유형 (RISK/URGENT/INSPECT/SELF/INVITE/AI_AGENT)',
  level      VARCHAR(10)                          COMMENT '수준 (fail/warn/info)',
  title      VARCHAR(200) NOT NULL                COMMENT '제목',
  content    TEXT                                 COMMENT '본문',
  path       VARCHAR(300)                         COMMENT '클릭 시 이동 경로',
  meta_json  JSON                                 COMMENT '메타 데이터',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '읽음 여부 (0=안읽음)',
  delete_yn  TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (id), KEY idx_user_read (user_id,is_read,delete_yn)
) ENGINE=InnoDB COMMENT='알림 — NotificationPanel / notify.py 호환';

-- ══════════════════════════════════════════════════════════
-- S2. 기업 · 초대 (2) — ★ 산림파괴 컬럼 삭제
-- [v0.6 삭제] INVITE 테이블 — INVITATION_MESSAGE 테이블로 완전 대체됨

-- ══════════════════════════════════════════════════════════
-- S3. PO 관리 (1)
-- [v2.0] 공급망 트리 + PO 개편 (2026-06-15)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `PURCHASE_ORDER`;
CREATE TABLE `PURCHASE_ORDER` (
  `id`                  BIGINT        NOT NULL AUTO_INCREMENT COMMENT 'PO 식별 ID (PK)',
  `po_id`               VARCHAR(50)   NOT NULL COMMENT '실제 주문 번호 (UNIQUE)',
  `sender_company_id`   VARCHAR(20)   NOT NULL COMMENT '발주처 기업 코드 (FK)',
  `receiver_company_id` VARCHAR(20)   NOT NULL COMMENT '수주처 기업 코드 (FK)',
  `raw_id`              VARCHAR(30)   NOT NULL COMMENT '대상 원자재 코드 (FK)',
  `qty`                 DECIMAL(12,2) NOT NULL COMMENT '구매 수량 (중량/ton)',
  `unit_price`          DECIMAL(12,2) NOT NULL COMMENT '구매 단가',
  `total`               DECIMAL(15,2) NOT NULL COMMENT '총 가격 (수량 * 단가)',
  `delivery`            DATE          NOT NULL COMMENT '납품일 / 납기일',
  `status`              VARCHAR(20)   DEFAULT 'PENDING' COMMENT '주문 상태',
  `delete_yn`           TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_po` (`po_id`),
  KEY `idx_sender` (`sender_company_id`),
  KEY `idx_receiver` (`receiver_company_id`),
  KEY `idx_raw` (`raw_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PO 관리';

-- ══════════════════════════════════════════════════════════
-- S4. 원자재 · 결재 (4)
-- [v0.6 삭제] RM_APPROVAL_STEP 테이블 — BE 미참조, RM_APPROVAL로 통합됨

-- ══════════════════════════════════════════════════════════
-- S5. BOM (2)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `BOM`;
CREATE TABLE `BOM` (
  `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '내부 ID (PK)',
  `bom_id`      VARCHAR(30)   NOT NULL COMMENT 'BOM 관리 코드 (UNIQUE)',
  `category`    VARCHAR(50)   COMMENT '제품군',
  `product`     VARCHAR(200)  NOT NULL COMMENT '완제품명',
  `item_no`     VARCHAR(50)   COMMENT '품번',
  `item_name`   VARCHAR(200)  COMMENT '품목명',
  `qty`         DECIMAL(12,3) COMMENT '기본 소요량',
  `unit`        VARCHAR(20)   COMMENT '단위',
  `weight_g`    DECIMAL(10,2) COMMENT '단위 중량 (g)',
  `supplier_id` VARCHAR(20)   COMMENT '기본 공급사 코드 (FK)',
  `lead_time`   INT           COMMENT '리드타임 (일)',
  `price`       DECIMAL(12,2) COMMENT '단가',
  `components`  VARCHAR(500)  COMMENT '구성 요소',
  `status`      VARCHAR(20)   DEFAULT 'ACTIVE' COMMENT '상태',
  `delete_yn`   TINYINT(1)    NOT NULL DEFAULT 0 COMMENT '삭제 여부',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bom` (`bom_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM 마스터';

DROP TABLE IF EXISTS `BOM_TIER_TREE`;
CREATE TABLE `BOM_TIER_TREE` (
  `id`            BIGINT        NOT NULL AUTO_INCREMENT COMMENT '트리 노드 ID (PK)',
  `bom_id`        VARCHAR(30)   NOT NULL COMMENT 'BOM 코드 (FK)',
  `tier`          TINYINT       NOT NULL COMMENT '차수 (1~3)',
  `partner_id`    VARCHAR(20)   NOT NULL COMMENT '협력사 코드 (FK)',
  `raw_id`        VARCHAR(30)   NOT NULL COMMENT '원자재 코드 (FK)',
  `po_id`         VARCHAR(50)   NOT NULL COMMENT 'PO 번호 (FK)',
  `item_name`     VARCHAR(200)  COMMENT '스냅샷 품목명',
  `qty_kg`        DECIMAL(12,4) COMMENT '투입/소요량 (kg)',
  `sort_order`    INT           DEFAULT 0 COMMENT '정렬 순서',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bom_tier` (`bom_id`, `tier`),
  KEY `idx_partner_raw` (`partner_id`, `raw_id`),
  KEY `idx_po_trace` (`po_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM 공급망 트리';

-- ══════════════════════════════════════════════════════════
-- 공급망 관련 PO, BOM, 원자재 더미 데이터
-- ══════════════════════════════════════════════════════════

INSERT INTO `BOM` (bom_id, category, product, item_no, item_name, qty, unit, weight_g, supplier_id, status) VALUES
('BOM-001', '열 차폐판', '열 차폐판 Al 3003', 'HTS-3003-H14', 'Al 3003-H14 판재 1.5T', 1.000, 'EA', 495.00, 'NOV-001', 'ACTIVE');

INSERT INTO `RAW_MATERIAL` (raw_id, partner_id, name, width, length, weight_kg, components, origin, status, requested_at, approved_at) VALUES
('RM-NOV-001', 'NOV-001', 'Al 3003 슬라브',       600, 3000, 1520, 'Al 97.9%, Mn 1.25%, Cu 0.12%, Si 0.28%, Fe 0.45%', '서울 관악구', 'APPROVED', '2026-01-10', '2026-01-15'),
('RM-KRM-001', 'KRM-001', 'P1020 잉곳 + EMD',     NULL, NULL, 1580, 'Al 99.7%, Mn 0.3%',   '울산 남구',   'APPROVED', '2026-01-12', '2026-01-18'),
('RM-WIN-001', 'WIN-001', '알루미나(Al2O3)',        NULL, NULL, 2930, 'Al2O3 99.4%',         'Jamaica',     'APPROVED', '2026-01-15', '2026-01-22'),
('RM-COM-001', 'COM-001', 'Mn 정광(MnO2)',         NULL, NULL,   62, 'MnO2 82%, Fe 5%',     'Gabon',       'APPROVED', '2026-01-15', '2026-01-22'),
('RM-COD-001', 'COD-001', '황동광(Cu)',             NULL, NULL,    6, 'Cu 28%, Fe 30%',      'Chile',       'APPROVED', '2026-01-15', '2026-01-22');

INSERT INTO `PURCHASE_ORDER` (po_id, sender_company_id, receiver_company_id, raw_id, qty, unit_price, total, delivery, status) VALUES
('PO-OEM-NOV-001', 'HMOS-001', 'NOV-001', 'RM-NOV-001', 45.00, 3150, 141750, '2026-03-28', 'COMPLETED'),
('PO-NOV-KRM-001', 'NOV-001',  'KRM-001', 'RM-KRM-001', 47.00, 2800, 131600, '2026-03-20', 'COMPLETED'),
('PO-KRM-WIN-001', 'KRM-001',  'WIN-001', 'RM-WIN-001', 88.00, 420,  36960,  '2026-03-10', 'COMPLETED'),
('PO-KRM-COM-001', 'KRM-001',  'COM-001', 'RM-COM-001',  5.50, 1200,  6600,  '2026-03-10', 'COMPLETED'),
('PO-KRM-COD-001', 'KRM-001',  'COD-001', 'RM-COD-001',  0.80, 8500,  6800,  '2026-03-10', 'COMPLETED');

INSERT INTO `BOM_TIER_TREE` (bom_id, tier, partner_id, raw_id, po_id, item_name, qty_kg, sort_order) VALUES
('BOM-001', 1, 'NOV-001', 'RM-NOV-001', 'PO-OEM-NOV-001', 'Al 3003-H14 판재 1.5T',  0.4950, 1),
('BOM-001', 2, 'KRM-001', 'RM-KRM-001', 'PO-NOV-KRM-001', 'P1020 잉곳 + EMD',        0.5120, 2),
('BOM-001', 3, 'WIN-001', 'RM-WIN-001', 'PO-KRM-WIN-001', '알루미나(Al2O3)',          0.9560, 3),
('BOM-001', 3, 'COM-001', 'RM-COM-001', 'PO-KRM-COM-001', 'Mn 정광(MnO2)',            0.0610, 4),
('BOM-001', 3, 'COD-001', 'RM-COD-001', 'PO-KRM-COD-001', '황동광(Cu)',                0.0060, 5);

-- ══════════════════════════════════════════════════════════
-- S6. ESG 지표 · 자가진단 · 실사 (3) — ★ forest_risk 삭제
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `ESG_INDICATOR`;
CREATE TABLE `ESG_INDICATOR` (
  id           INT          NOT NULL AUTO_INCREMENT COMMENT '지표 ID (PK)',
  indicator_no INT          NOT NULL                COMMENT '지표 번호 (1~72)',
  tier_scope   VARCHAR(50)  NOT NULL                COMMENT '적용 차수',
  cat          VARCHAR(50)                          COMMENT '카테고리',
  name         VARCHAR(300) NOT NULL                COMMENT '지표명',
  priority     VARCHAR(20)                          COMMENT '우선순위 (Critical/High/Medium)',
  regs         JSON                                 COMMENT '관련 규제 (JSON 배열)',
  actual_value VARCHAR(200)                         COMMENT '실적값',
  status       VARCHAR(10)                          COMMENT '달성 상태 (pass/warn/fail)',
  PRIMARY KEY (id), KEY idx_tier (tier_scope)
) ENGINE=InnoDB COMMENT='ESG 지표 — RiskAssessment';

DROP TABLE IF EXISTS `SELF_ASSESS_REPORT`;
CREATE TABLE `SELF_ASSESS_REPORT` (
  id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '보고서 ID (PK)',
  report_no       VARCHAR(30)  NOT NULL                COMMENT '보고서 번호',
  partner_name    VARCHAR(200)                         COMMENT '협력사명',
  partner_id      VARCHAR(20)  NOT NULL                COMMENT '협력사 코드',
  tier_scope      VARCHAR(30)                          COMMENT '차수 표시',
  report_year     INT          NOT NULL                COMMENT '보고 연도',
  report_quarter  TINYINT                              COMMENT '분기 (1~4, NULL=연간)',
  status          VARCHAR(20)  DEFAULT 'DRAFT'         COMMENT '상태',
  scope1_text     VARCHAR(50)                          COMMENT 'Scope 1 GHG 텍스트',
  trir_text       VARCHAR(50)                          COMMENT 'TRIR 텍스트',
  forced_labor    VARCHAR(50)                          COMMENT '강제노동 여부',
  feoc_text       VARCHAR(50)                          COMMENT 'FEOC 비중',
  -- ✗ forest_risk 삭제 (v0.4)
  anti_corrupt    VARCHAR(50)                          COMMENT '반부패 정책',
  detail_created_at DATE                               COMMENT '작성일',
  delete_yn       TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (id), UNIQUE KEY uq_report (report_no), KEY idx_partner (partner_id)
) ENGINE=InnoDB COMMENT='자가진단 보고서 — re_ratio·forest_risk 삭제';

DROP TABLE IF EXISTS `FIELD_INSPECTION`;
CREATE TABLE `FIELD_INSPECTION` (
  id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '실사 ID (PK)',
  inspection_no   INT                                  COMMENT '실사 번호',
  target_partner  VARCHAR(200) NOT NULL                COMMENT '대상 협력사',
  inspection_type VARCHAR(50)                          COMMENT '실사 유형',
  phase           VARCHAR(30)                          COMMENT '단계',
  risk_level      VARCHAR(10)                          COMMENT '리스크 등급',
  scheduled_date  DATE                                 COMMENT '예정일',
  actual_date     DATE                                 COMMENT '실시일',
  findings        TEXT                                 COMMENT '발견사항',
  improvements    TEXT                                 COMMENT '개선 요청',
  deadline        DATE                                 COMMENT '기한',
  rba_grade       CHAR(1)                              COMMENT 'RBA 등급',
  csddd_status    VARCHAR(20)                          COMMENT 'CSDDD 이행 상태',
  urgent_action   TEXT                                 COMMENT '긴급 조치',
  action_plan     TEXT                                 COMMENT '개선 계획',
  status          VARCHAR(20)  DEFAULT 'IN_PROGRESS'   COMMENT '상태',
  delete_yn       TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (id), KEY idx_target (target_partner)
) ENGINE=InnoDB COMMENT='현장 실사';

-- ══════════════════════════════════════════════════════════
-- S7. 노드 이력 (1) — ★ 산림파괴 컬럼 삭제
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `NODE_HISTORY`;
CREATE TABLE `NODE_HISTORY` (
  id            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '이력 ID (PK)',
  partner_id    VARCHAR(20)  NOT NULL                COMMENT '협력사 코드 (FK)',
  record_date   DATE         NOT NULL                COMMENT '기록 일자',
  scope1        BIGINT                               COMMENT 'Scope 1 (tCO₂e)',
  scope2        BIGINT                               COMMENT 'Scope 2 (tCO₂e)',
  feoc_ratio    DECIMAL(5,2)                         COMMENT 'FEOC (%)',
  trir          DECIMAL(5,2)                         COMMENT 'TRIR',
  risk_level    VARCHAR(10)                          COMMENT '리스크 등급',
  -- ✗ deforest_yn 삭제 (v0.4)
  -- ✗ deforest_note 삭제 (v0.4)
  origin        VARCHAR(200)                         COMMENT '원산지',
  name          VARCHAR(200)                         COMMENT '원자재/제품명',
  weight_kg     DECIMAL(12,3)                        COMMENT '중량 (kg)',
  components    VARCHAR(500)                         COMMENT '구성 요소',
  width         DECIMAL(10,2)                        COMMENT '폭 (mm)',
  length        DECIMAL(10,2)                        COMMENT '길이 (mm)',
  diameter_mm   DECIMAL(10,2)                        COMMENT '지름 (mm)',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (id), KEY idx_partner_date (partner_id,record_date)
) ENGINE=InnoDB COMMENT='공급망 노드 이력 — 산림파괴 컬럼 삭제';

-- ══════════════════════════════════════════════════════════
-- S8. AI Agent (3)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `AI_AGENT_RULE`;
CREATE TABLE `AI_AGENT_RULE` (
  rule_id         int(11)         NOT NULL          AUTO_INCREMENT               COMMENT '자동 생성 규칙 식별자',
  indicator_no    int(11)         NOT NULL                                       COMMENT '원천 자가진단 문항 지표 번호',
  sub_id          varchar(50)     NOT NULL          DEFAULT 'MAIN'               COMMENT '서브 지표 식별자 (예: PAH, DIOXIN, MAIN)',
  rule_code       varchar(30)     NOT NULL                                       COMMENT '규칙 코드 (예: RULE_040)',
  rule_name       varchar(255)    NOT NULL                                       COMMENT '규칙 이름',
  category        varchar(50)     DEFAULT NULL                                   COMMENT '카테고리 (인권노동, 에너지기후, 공정품질 등)',
  tier_scope      varchar(100)                                                   COMMENT '적용 차수',
  metric_key      varchar(30)     NOT NULL                                       COMMENT '평가 대상 컬럼 키',
  operator        varchar(10)     NOT NULL                                       COMMENT '비교 연산자 규칙',
  threshold_value varchar(255)    NOT NULL                                       COMMENT '통과 임계값/합격기준 범위',
  fail_threshold  varchar(255)    DEFAULT NULL                                   COMMENT '실패 기준 정의 문구',
  severity        varchar(20)     NOT NULL DEFAULT 'WARN'                        COMMENT '리스크 심각도 (CRITICAL, FAIL, WARN)',
  notify_yn       CHAR(1)         DEFAULT 'Y'                                    COMMENT '알림 발송 여부',
  notify_template text            DEFAULT NULL                                   COMMENT '알림 가이드 템플릿',
  regulation      varchar(255)    DEFAULT NULL                                   COMMENT '연계 글로벌 ESG 규제',
  action_required text            DEFAULT NULL                                   COMMENT '불합격 시 권장 조치 방안 명세',
  active_yn       TINYINT(1)      NOT NULL DEFAULT 0                             COMMENT '활성화 여부',
  priority        int(11)         DEFAULT 50                                     COMMENT '알림 표출 우선순위 가중치',
  created_at      timestamp       NOT NULL DEFAULT current_timestamp()           COMMENT '최초 생성 일시',
  updated_at      timestamp       NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정 일시',
  PRIMARY KEY (rule_id),
  UNIQUE KEY uq_indicator_sub (indicator_no, sub_id) -- 💡 indicator_no와 sub_id 조합으로 복합 유니크 키 생성
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 자동 감사 엔진용 마스터 룰셋 규격 테이블';

DROP TABLE IF EXISTS `AI_AGENT_ALERT`;
CREATE TABLE `AI_AGENT_ALERT` (
  alert_id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '알림 ID (PK)',
  partner_id        VARCHAR(20)  NOT NULL                COMMENT '협력사 코드',
  indicator_no      INT                                  COMMENT '지표 번호',
  rule_id           BIGINT       NOT NULL                COMMENT '룰 ID (FK)',
  alarm_id          BIGINT                               COMMENT 'ALARM 연동 ID',
  severity          VARCHAR(20)  NOT NULL                COMMENT '심각도',
  ai_confidence     DECIMAL(5,2)                         COMMENT 'AI 신뢰도',
  ai_reasoning      TEXT                                 COMMENT 'AI 판단 근거',
  ai_recommendation TEXT                                 COMMENT 'AI 권장 조치',
  detected_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '감지 시각',
  delete_yn         TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  PRIMARY KEY (alert_id), KEY idx_partner (partner_id), KEY idx_indicator (indicator_no), 
  KEY idx_rule (rule_id), KEY idx_alarm (alarm_id), KEY idx_severity (severity)
) ENGINE=InnoDB COMMENT='AI Agent 위반 알림';

-- ══════════════════════════════════════════════════════════
-- S9. 자가진단 OCR (2) — ★ risk_level DEFAULT '평가중'
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `SELF_ASSESS_ANSWER`;
CREATE TABLE `SELF_ASSESS_ANSWER` (
  id              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '답변 ID (PK)',
  partner_type    VARCHAR(30)  NOT NULL                COMMENT '협력사 구분 (1차/2차/3차-A/3차-B)',
  partner_id      VARCHAR(20)  NOT NULL                COMMENT '협력사 ID (FK→COMPANY.partner_id)',
  indicator_no    INT          NOT NULL                COMMENT '지표 번호 (1~72)',
  category        VARCHAR(50)                          COMMENT '카테고리',
  answer_text     TEXT         NOT NULL                COMMENT '답변 내용 (OCR 추출)',
  risk_level      VARCHAR(10)  DEFAULT '평가중'         COMMENT '리스크 등급 — AI 평가 전 기본값 "평가중"',
  evidence_yn     CHAR(1)      DEFAULT 'N'             COMMENT '증빙 필요 여부',
  source_file_id  BIGINT                               COMMENT '원본 PDF 파일 ID',
  version         INT          NOT NULL DEFAULT 1      COMMENT '자가진단 버전 (파일 재업로드 시 자동 증가)',
  delete_yn       TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (id), KEY idx_partner (partner_type,partner_id), KEY idx_indicator (indicator_no)
) ENGINE=InnoDB COMMENT='자가진단 답변 — PDF OCR 추출 (risk_level AI 평가)';

DROP TABLE IF EXISTS `SELF_ASSESS_CHECKLIST`;
CREATE TABLE `SELF_ASSESS_CHECKLIST` (
  id               BIGINT       NOT NULL AUTO_INCREMENT COMMENT '체크리스트 ID (PK)',
  partner_type     VARCHAR(30)  NOT NULL                COMMENT '협력사 구분',
  indicator_no     INT          NOT NULL                COMMENT '지표 번호',
  category         VARCHAR(50)                          COMMENT '카테고리',
  indicator_name   VARCHAR(300) NOT NULL                COMMENT '지표명',
  priority         VARCHAR(20)                          COMMENT '우선순위',
  star_yn          CHAR(1)      DEFAULT 'N'             COMMENT '★ 핵심 지표',
  question         TEXT                                 COMMENT '질문',
  pass_answer      TEXT                                 COMMENT '합격 기준 답변',
  fail_answer      TEXT                                 COMMENT '불합격 기준 답변',
  risk_level       VARCHAR(10)                          COMMENT '리스크 등급 (AI 평가용 유지)',
  evidence_yn      CHAR(1)      DEFAULT 'N'             COMMENT '증빙 필요',
  evidence_list    TEXT                                 COMMENT '증빙 목록',
  action_plan      TEXT                                 COMMENT '대처방안',
  delete_yn        TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '삭제 여부',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  PRIMARY KEY (id), KEY idx_partner_type (partner_type)
) ENGINE=InnoDB COMMENT='자가진단 체크리스트 마스터';

-- ✗ RISK_CLASSIFICATION 삭제 (v0.4) — ESG_RISK_CRITERIA와 중복되어 제거

-- ══════════════════════════════════════════════════════════
-- S10. ★ v0.4 신규: ESG 실사 체크리스트 + 리스크 기준 (2)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `ESG_CHECKLIST`;
CREATE TABLE `ESG_CHECKLIST` (
  indicator_no        VARCHAR(50)   NOT NULL                  COMMENT 'ESG 평가 지표 고유 번호 (예: ENV-40 또는 순번 코드)',
  category            VARCHAR(100)  NOT NULL                  COMMENT '지표 카테고리 (예: 공정·품질, 환경, 안전 등)',
  indicator_name      VARCHAR(255)  NOT NULL                  COMMENT '지표명 (예: Al 3003 합금 Mn 함량 실측)',
  priority            VARCHAR(20)   NOT NULL DEFAULT 'High'   COMMENT '우선순위 (Critical, High, Medium, Low)',
  is_essential        CHAR(1)       NOT NULL DEFAULT 'N'      COMMENT '★ 중요 지표 여부 (Y/N) - 신규 지표/Critical 불합격 직결 여부',
  question            TEXT          NOT NULL                  COMMENT '실사 항목 질문 및 수치 기준 (BM25 검색 대상)',
  pass_example        TEXT          DEFAULT NULL              COMMENT '합격 판정 기준 예시 또는 가이드라인',
  fail_example        TEXT          DEFAULT NULL              COMMENT '불합격 판정 기준 예시',
  risk_level          VARCHAR(20)   DEFAULT NULL              COMMENT '불합격 시 리스크 등급 (고위험, 중위험, 저위험)',
  evidence_required   CHAR(1)       NOT NULL DEFAULT 'N'      COMMENT '증빙자료 필요 여부 (Y/N)',
  evidence_list       TEXT          DEFAULT NULL              COMMENT '필요 증빙자료 목록 (예: 성분 분석 성적서, 열처리 로그 데이터)',
  action_plan         TEXT          DEFAULT NULL              COMMENT '규격 이탈/불합격 시 협력사 대처 방안 및 조치 지침',
  created_at          TIMESTAMP NULL DEFAULT current_timestamp() COMMENT '지표 등록 일시',
  updated_at          TIMESTAMP NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '지표 수정 일시',
  PRIMARY KEY (`indicator_no`),
  KEY idx_category_indicator (category, indicator_name),
  KEY idx_priority_risk (priority, risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='알루미늄 공급망 ESG/품질 실사 체크리스트 마스터';

DROP TABLE IF EXISTS `ESG_RISK_CRITERIA`;
CREATE TABLE `ESG_RISK_CRITERIA` (
  criterion_id      INT(11)       NOT NULL AUTO_INCREMENT   COMMENT '리스크 기준 고유 ID',
  item_name         VARCHAR(100)  NOT NULL                  COMMENT '리스크 평가 분류 항목 (예: 우선순위 기준, 규제 영향 등)',
  high_risk         TEXT          DEFAULT NULL              COMMENT '고위험 (High Risk) 판단 기준 및 사례',
  medium_risk       TEXT          DEFAULT NULL              COMMENT '중위험 (Medium Risk) 판단 기준',
  low_risk          TEXT          DEFAULT NULL              COMMENT '저위험 (Low Risk) 판단 기준',
  created_at        TIMESTAMP     NULL DEFAULT current_timestamp() COMMENT '등록 일시',
  updated_at        TIMESTAMP     NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정 일시',
  PRIMARY KEY (criterion_id),
  UNIQUE KEY ux_item_name (item_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ESG 자가진단 리스크 등급별 분류 기준 마스터';

-- ══════════════════════════════════════════════════════════
-- S11. ★ v0.4 신규: 파일 관리 (2)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `LICENSE_FILE`;
CREATE TABLE `LICENSE_FILE` (
  id         BIGINT(20)   NOT NULL AUTO_INCREMENT           COMMENT '고유ID',
  origin     VARCHAR(255) NOT NULL                          COMMENT '파일명'           COLLATE 'utf8mb4_unicode_ci',
  filename   VARCHAR(255) NOT NULL                          COMMENT '암호화된 파일명'   COLLATE 'utf8mb4_unicode_ci',
  ext        VARCHAR(50)  NOT NULL                          COMMENT '파일타입'         COLLATE 'utf8mb4_unicode_ci',
  dir        VARCHAR(255) NOT NULL                          COMMENT '파일경로'         COLLATE 'utf8mb4_unicode_ci',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                          COMMENT '등록일자',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일자',
  delete_yn  TINYINT(1)   NOT NULL DEFAULT '0'              COMMENT '삭제여부',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사업자등록증 등록 파일 정보 — ocr.py/ocrs.py file.py licenseFile() 연동';

DROP TABLE IF EXISTS `SUPPORTING_FILE`;
CREATE TABLE `SUPPORTING_FILE` (
  id         BIGINT(20)   NOT NULL AUTO_INCREMENT           COMMENT '고유ID',
  partner_id VARCHAR(20)  NOT NULL DEFAULT ''               COMMENT '협력사 코드 (FK→COMPANY.partner_id)',
  file_type  VARCHAR(30)  NOT NULL DEFAULT 'evidence'       COMMENT '파일 구분 (coc/selfassess/evidence/cert)',
  origin     VARCHAR(255) NOT NULL                          COMMENT '파일명'           COLLATE 'utf8mb4_unicode_ci',
  filename   VARCHAR(255) NOT NULL                          COMMENT '암호화된 파일명'   COLLATE 'utf8mb4_unicode_ci',
  ext        VARCHAR(50)  NOT NULL                          COMMENT '파일 타입'        COLLATE 'utf8mb4_unicode_ci',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP                          COMMENT '등록일자',
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일자',
  delete_yn  TINYINT(1)   NOT NULL DEFAULT '0'              COMMENT '삭제여부',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_partner_type` (`partner_id`, `file_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='첨부파일 통합 관리 — coc(서약서)/selfassess(자가진단)/evidence(증빙)/cert(인증증빙)';


-- ══════════════════════════════════════════════════════════
-- S14. ★ 초대 메시지 관리 (1)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `INVITATION_MESSAGE`;
CREATE TABLE `INVITATION_MESSAGE` (
    `id`              BIGINT(20)    NOT NULL AUTO_INCREMENT   COMMENT '고유 ID',
    `role_code`       VARCHAR(20)   NOT NULL                  COMMENT '초대사 권한 코드 (OEM/TIER1/TIER2)',
    `message_subject` VARCHAR(50)   NOT NULL                  COMMENT '협력사별 초대 제목',
    `sent_message`    TEXT          NULL                      COMMENT '초대사 화면 노출용 안내 메시지'      COLLATE 'utf8mb4_unicode_ci',
    `message_content` TEXT          NOT NULL                  COMMENT '피초대 협력사 수신용 메시지 본문'    COLLATE 'utf8mb4_unicode_ci',
    `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                                    COMMENT '생성일시',
    `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP        COMMENT '수정일시',
    `delete_yn`       TINYINT(1)    NULL     DEFAULT '0'      COMMENT '삭제여부',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `FK_IM_ROLE` (`role_code`) USING BTREE
) COMMENT='초대 메시지 관리 — 권한별 초대 제목·본문 마스터'
COLLATE='utf8mb4_unicode_ci' ENGINE=InnoDB;


-- ══════════════════════════════════════════════════════════
-- S15. ★ 공장 관리 (1)
-- ══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS `FACTORY`;
CREATE TABLE `FACTORY` (
  id                    BIGINT       NOT NULL AUTO_INCREMENT           COMMENT '공장 고유 ID (PK)',
  partner_id            VARCHAR(20)  NOT NULL                          COMMENT '협력사 코드 (FK→COMPANY.partner_id)',
  factory_name          VARCHAR(200) NOT NULL                          COMMENT '공장명',
  factory_owner         VARCHAR(50)  NOT NULL                          COMMENT '공장 대표자명',
  factory_location      VARCHAR(500)                                   COMMENT '공장 소재지',
  operation_status      VARCHAR(20)  NOT NULL DEFAULT '가동중'          COMMENT '가동 상태 (가동중/중단/폐쇄)',
  utilization_rate      DECIMAL(5,2) NOT NULL DEFAULT 0.00             COMMENT '공장 이용 비율 (%, 기업 내 합계 100%)',
  scope1_emissions      BIGINT       DEFAULT 0                         COMMENT 'Scope 1 GHG 배출량 (tCO₂e)',
  scope2_emissions      BIGINT       DEFAULT 0                         COMMENT 'Scope 2 GHG 배출량 (tCO₂e)',
  feoc_raw_material_ratio DECIMAL(5,2) DEFAULT 0.00                    COMMENT 'FEOC 원료 비중 (%)',
  trir_safety_rate      DECIMAL(5,2) DEFAULT 0.00                      COMMENT 'TRIR 산업안전율',
  note                  TEXT                                           COMMENT '비고',
  delete_yn             TINYINT(1)   NOT NULL DEFAULT 0                COMMENT '삭제 여부',
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (id),
  KEY idx_partner (partner_id),
  KEY idx_status (operation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='공장 정보 — 협력사별 다수 공장 등록, 가중합산 로직 연동';

-- ══════════════════════════════════════════════════════════
-- TOKEN 테이블 (로그인 토큰 관리)
-- [v1.0] 2026-06-04 — partner_id 기준, COMPANY FK 연결
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `TOKEN` (
    `id`            BIGINT(20)    NOT NULL AUTO_INCREMENT   COMMENT '고유 ID (PK)',
    `partner_id`    VARCHAR(20)   NOT NULL                  COMMENT '협력사 코드 — COMPANY.partner_id',
    `refresh_token` TEXT          NOT NULL                  COMMENT '리프레시 토큰'   COLLATE 'utf8mb4_unicode_ci',
    `uuid`          VARCHAR(100)  NOT NULL                  COMMENT '세션 식별 UUID'  COLLATE 'utf8mb4_unicode_ci',
    `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP                 COMMENT '생성일시',
    `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    `delete_yn`     TINYINT(1)    NULL     DEFAULT '0'      COMMENT '삭제여부 (0=활성, 1=로그아웃)',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `IDX_TOKEN_PARTNER` (`partner_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='로그인 토큰 관리 — partner_id 기준 JWT refresh token 저장';

-- 10.14 INVITATION_MESSAGE 더미 데이터 (티어별 초대 메시지)
INSERT INTO `INVITATION_MESSAGE` (`role_code`, `message_subject`, `sent_message`, `message_content`) VALUES
-- 원청사(OEM) → 1차 협력사 초대
('OEM',
 '공급망 맵 초대',
 '원청사(가공·알루미늄 부품 제조) 기준에 부합하는 1차 협력사를 초대해 주시면 됩니다. 알루미늄 합금(Al 3003) 가공, 압연, 열처리 등의 공정 역량을 보유한 기업을 대상으로 해주세요.',
 '귀사는 1차(알루미늄(3003) 합금 주조·가공·압연) 협력사로 초대되었습니다. ESG 공급망 관리 시스템에 접속하셔서 기업 기본 정보, Scope 1·2 GHG 배출량, 글로벌 인증(ISO 14001, IATF 16949 등) 현황, 자가진단 체크리스트 및 관련 증빙 서류를 등록하여 주시기 바랍니다.'
),
-- 1차 협력사(TIER1) → 2차 협력사 초대
('TIER1',
 '협력사 및 공급망 맵 초대',
 '1차 협력사(알루미늄(3003) 합금 주조) 기준에 부합하는 2차 협력사를 초대해 주시면 됩니다. 알루미늄 1차 잉곳 제련, Hall-Héroult 전해 제련 역량을 보유한 기업을 대상으로 해주세요.',
 '귀사는 2차(알루미늄 1차 잉곳 제련·Hall-Héroult 전해 공정) 협력사로 초대되었습니다. ESG 공급망 관리 시스템에 접속하셔서 전력 탄소집약도, PFC 가스 배출량, 에너지 원단위, FEOC 제련소 지분 구조 등의 ESG 항목과 자가진단 체크리스트 및 필요한 증빙 서류를 등록하여 주시기 바랍니다.'
),
-- 2차 협력사(TIER2) → 3차 협력사 초대
('TIER2',
 '협력사 및 공급망 맵 초대',
 '2차 협력사(알루미늄 1차 잉곳 제련) 기준에 부합하는 3차 협력사를 초대해 주시면 됩니다. 보크사이트(Al) 채굴, 알루미나(Al₂O₃) 정제, 망간(Mn) 광석 채굴 역량을 보유한 기업을 대상으로 해주세요.',
 '귀사는 3차(보크사이트(Al) 채굴, 알루미나(Al₂O₃) 정제, 파이롤루사이트(Mn) 채굴) 협력사로 초대되었습니다. ESG 공급망 관리 시스템에 접속하셔서 아동·강제노동 Zero 현황, 산업안전 TRIR, FPIC 원주민 동의, 수질 중금속 농도, 토양 복원 계획 등의 ESG 항목과 자가진단 체크리스트 및 필요한 증빙 서류를 등록하여 주시기 바랍니다.'
);

-- 10.15 기존 COMPANY 더미 데이터 is_registered=1 업데이트
UPDATE `COMPANY` SET is_registered = 1 WHERE delete_yn = 0;


SET FOREIGN_KEY_CHECKS = 1;


-- ══════════════════════════════════════════════════════════
-- SECTION 10. 샘플 데이터
-- ══════════════════════════════════════════════════════════

-- 10.1 COMPANY 
INSERT INTO `COMPANY`
  (partner_id,company_name,short_name,ceo_name,biz_no,founded,address,size,country,email,
   tier,tier_label,parent_id,risk_level,employees,revenue,assets,scope1,scope2,
   feoc_ratio,trir,cmrt,emat,iso14001,iso45001,iatf,rba,rmap,cert_count)
VALUES
('HMOS-001','현대모비스(주)','현대모비스','이규석','264-81-00498','1977-06-24','서울특별시 강남구 테헤란로 521','대기업','대한민국','esg@mobis.co.kr',0,'원청사',NULL,'저위험',46947,572000,665000,180000,105000,3.20,0.38,'Y','N','Y','Y','Y','Y','N',5),
('NOV-001','(주)노벨리스코리아','노벨리스코리아','박진수','128-81-33210','1999-03-15','경기도 시흥시 공단1대로 200','대기업','대한민국','esg@novelis.co.kr',1,'1차 협력사','HMOS-001','저위험',1850,84200,216000,82000,60000,8.10,0.62,'N','N','Y','N','N','N','Y',2),
('NSM-001','(주)남성알루미늄','남성알루미늄','최병훈','310-81-12345','2001-05-10','경상남도 창원시 성산구 공단로 120','중견기업','대한민국','esg@nsm.co.kr',1,'1차 협력사','HMOS-001','저위험',780,38500,95000,45000,32000,6.30,0.78,'N','N','Y','Y','Y','N','N',3),
('KRM-001','(주)케이알엠','케이알엠','이성훈','402-81-45123','2003-07-20','인천광역시 남동구 앵고개로 490','중견기업','대한민국','esg@krm.co.kr',2,'2차 협력사','NOV-001','중위험',420,21800,56400,58000,40000,12.50,1.12,'N','N','Y','N','N','N','N',1),
('HMC-002','현대머티리얼(주)','현대머티리얼','정민수','501-81-67890','2005-09-01','충청남도 아산시 둔포면 산업단지로 55','중소기업','대한민국','esg@hmc.co.kr',2,'2차 협력사','NSM-001','중위험',280,15200,38000,42000,28000,9.80,0.95,'N','N','Y','N','N','N','N',1),
('COM-001','Comilog Gabon S.A.','Comilog','Jean-Pierre M.','GAB-20031200','1962-08-10','Moanda, Haut-Ogooué, Gabon','대기업','가봉','esg@comilog.ga',3,'3차-A','KRM-001','중위험',5200,123000,387000,52000,0,0.00,2.15,'N','N','Y','N','N','N','N',1),
('WIN-001','Windalco Jamaica Ltd.','Windalco','Michael Thompson','JAM-19801045','1980-04-22','Ewarton, Saint Catherine, Jamaica','대기업','자메이카','esg@windalco.jm',3,'3차-B','KRM-001','중위험',3800,89000,224000,68000,0,0.00,1.85,'N','N','N','N','N','N','N',0),
('COD-001','Codelco Norte S.A.','Codelco','Carlos Mendez','CHL-19761009','1976-04-01','Calama, Antofagasta, Chile','대기업','칠레','esg@codelco.cl',3,'3차-C','KRM-001','중위험',18400,482000,1250000,112000,0,0.00,1.42,'N','Y','Y','Y','N','N','N',2),
('EMG-002','Electro Manganese Brasil Ltda','EMG Brasil','Fernando Lima','BRA-20101055','2010-03-20','Pará, Brazil','중견기업','브라질','esg@emg.com.br',3,'3차-A','HMC-002','중위험',2100,65000,180000,38000,0,0.00,1.92,'N','N','Y','N','N','N','N',1),
('ALU-002','Alunorte Alumina S.A.','AluNorte','Rodrigo Ferreira','BRA-19980822','1998-08-22','Barcarena, Pará, Brazil','대기업','브라질','esg@alunorte.com.br',3,'3차-B','HMC-002','중위험',4500,98000,310000,72000,0,0.00,1.65,'N','N','Y','N','N','N','N',1);

-- 10.2 NODE_HISTORY 
INSERT INTO `NODE_HISTORY` (partner_id,record_date,scope1,scope2,feoc_ratio,trir,risk_level,origin,name,weight_kg,components,width,length,diameter_mm) VALUES
('NOV-001','2026-05-15',82000,60000,8.10,0.62,'저위험','울산','Al 3003-H14 튜브',0.22,'Al 97.9%, Mn 1.25%, Cu 0.12%',16,2000,16),
('NOV-001','2026-01-15',79000,57000,7.50,0.57,'저위험','울산','Al 3003 슬라브',1520,'Al 97.9%, Mn 1.25%',600,3000,NULL),
('KRM-001','2026-05-15',58000,40000,12.50,1.12,'중위험','인천','P1020 잉곳',1020,'Al 99.7%',200,800,NULL),
('COM-001','2026-05-15',52000,0,0.00,2.15,'중위험','가봉 Moanda','Mn 정광(MnO₂)',62,'MnO₂ 82%',NULL,NULL,NULL),
('WIN-001','2026-05-15',68000,0,0.00,1.85,'중위험','자메이카','알루미나(Al₂O₃)',2930,'Al₂O₃ 99.4%',NULL,NULL,NULL),
('COD-001','2026-05-15',112000,0,0.00,1.42,'중위험','칠레 Calama','황동광(Cu)',6,'Cu 28%',NULL,NULL,NULL);

-- 10.3 PURCHASE_ORDER
-- 10.4 RAW_MATERIAL + RM_TIER_TREE
INSERT INTO `RM_TIER_TREE` (raw_id,tier,short_name,item_name,comp,qty_kg,sort_order) VALUES
('RM-001',1,'노벨리스코리아','Al 3003 슬라브','Al 97.9%+Mn 1.25%',1520,1),
('RM-001',2,'케이알엠','P1020 잉곳','Al 99.7%',1570,2),
('RM-001',3,'Windalco','알루미나(Al₂O₃)','Al₂O₃ 99.4%',2930,3),
('RM-001',3,'Comilog','Mn 정광(MnO₂)','MnO₂ 82%',62,4),
('RM-001',3,'Codelco','황동광(Cu)','Cu 28%',6,5);

-- 10.5 RM_APPROVAL + STEP
INSERT INTO `RM_APPROVAL` (raw_material_id,request_type,requester_partner,request_title,request_content,deadline,approval_yn,approval_reason,approval_dt,approver_partner,status) VALUES
('RM-001','NORMAL','NOV-001','Al 3003 슬라브 원산지 증명','원산지 및 성분 분석서 승인 요청.','2026-01-20 18:00:00','Y','ASTM B209 만족.','2026-01-15 14:30:00','HMOS-001','APPROVED'),
('RM-003','URGENT','KRM-001','[긴급] 전해망간 FEOC 원산지','IRA 45X D-7 대응.','2026-05-20 18:00:00',NULL,NULL,NULL,NULL,'PENDING');

INSERT INTO `RM_APPROVAL_STEP` (approval_id,step_order,tier_level,partner_id,status,approved_at) VALUES
(1,1,1,'NOV-001','APPROVED','2026-01-13 10:00:00'),
(1,2,0,'HMOS-001','APPROVED','2026-01-15 14:30:00'),
(2,1,3,'COM-001','IN_PROGRESS',NULL),
(2,2,2,'KRM-001','WAITING',NULL),
(2,3,1,'NOV-001','WAITING',NULL),
(2,4,0,'HMOS-001','WAITING',NULL);

-- 10.6 BOM + BOM_TIER_TREE
-- 10.7 ESG_INDICATOR
INSERT INTO `ESG_INDICATOR` (indicator_no,tier_scope,cat,name,priority,regs,actual_value,status) VALUES
(1,'3차 협력사 (채굴)','인권·노동','아동·강제노동 Zero','Critical',JSON_ARRAY('CSDDD','UFLPA'),'확인서 완비','pass'),
(40,'1차 협력사 (합금)','공정·품질','Mn 함량 1.0~1.5%','Critical',JSON_ARRAY('ASTM'),'1.25%','pass'),
(50,'1차 협력사 (합금)','거버넌스','FEOC Mn·Cu 공급사','Critical',JSON_ARRAY('IRA','FEOC'),'8.1%','warn');

-- 10.8 SELF_ASSESS_REPORT (forest_risk 제거)
INSERT INTO `SELF_ASSESS_REPORT` (report_no,partner_name,partner_id,tier_scope,report_year,report_quarter,status,scope1_text,trir_text,forced_labor,feoc_text,anti_corrupt,detail_created_at) VALUES
('SAR-2025-0001','Comilog Gabon','COM-001','3차-A',2025,NULL,'SUBMITTED','52,000 tCO₂e','2.15 ⚠️','없음 ✅','0%','보유 ✅','2026-01-10'),
('SAR-2025-0003','(주)케이알엠','KRM-001','2차',2025,NULL,'APPROVED','98,000 tCO₂e','1.12 ✅','없음 ✅','12.5% ⚠️','보유 ✅','2025-12-15');

-- 10.9 FIELD_INSPECTION
INSERT INTO `FIELD_INSPECTION` (inspection_no,target_partner,inspection_type,phase,risk_level,scheduled_date,actual_date,findings,improvements,deadline) VALUES
(1,'(주)케이알엠 (2차)','특별현장실사','IMPROVEMENT','중위험','2026-03-15','2026-03-18','FEOC 원료 12.5% 초과','1. FEOC 비해당 소싱\n2. RE 40% 로드맵','2026-09-30'),
(2,'Comilog Gabon (3차-A)','정기현장실사','MONITORING','중위험','2026-01-20','2026-01-23','TRIR 2.15 CSDDD Art.8 초과','1. 산업안전 개선계획서','2026-06-30');

-- 10.10 ALARM
INSERT INTO `ALARM` (partner_id,type,level,title,content,is_read,created_at) VALUES
('NOV-001','RISK','fail','FEOC 초과 — (주)케이알엠','FEOC 원료 12.5% IRA 위험.',0,'2026-05-19 09:15:00'),
('KRM-001','URGENT','warn','긴급 요청 — RM-003','전해망간 원산지 증명서 제출.',0,'2026-05-18 16:30:00'),
('COM-001','SELF','info','자가진단 제출 — Comilog','SAR-2025-0001 제출.',1,'2026-05-17 14:05:00');

-- 10.11 AI_AGENT_RULE (핵심 5개)
INSERT INTO `AI_AGENT_RULE` (indicator_no,rule_code,rule_name,tier_scope,metric_key,operator,threshold_value,unit,severity,regulation,action_required,priority) VALUES
(18,'FEOC_RATIO_ZERO','FEOC 0% 위반','3차-A','feoc_ratio','>','0','%','CRITICAL','IRA/FEOC','대안 소싱 (D+7)',10),
(1,'FORCED_LABOR_ZERO','강제노동 Zero','전체','forced_labor_yn','=','Y','Y/N','CRITICAL','CSDDD/UFLPA','감사 시정 (D+3)',5),
(5,'TRIR_LIMIT','TRIR 한도','3차-A','trir','>','2.0','건/백만h','FAIL','CSDDD','안전 개선 (D+14)',20),
(50,'FEOC_TIER1_LIMIT','1차 FEOC 한도','1차','feoc_ratio','>=','10','%','FAIL','IRA/FEOC','FEOC 비해당 소싱',15),
(15,'MERCURY_ZERO','수은 사용 금지','3차-A','mercury_yn','=','Y','Y/N','CRITICAL','CSDDD/REACH','수은 즉시 중단',5);

-- 10.13 ESG_RISK_CRITERIA
INSERT INTO `ESG_RISK_CRITERIA` (item_name,high_risk,medium_risk,low_risk) VALUES
('우선순위 기준','Critical 불합격 → 반드시 고위험','High 불합격','Medium 불합격 또는 High 경미 편차'),
('규제 영향','CSDDD/UFLPA/FEOC 직접 위반','CSRD/IRA/RoHS 미이행','REACH/CSRD 문서 미비'),
('재무 리스크','매출 5%↑ 손실, 수출 금지','매출 1~5% 손실','매출 1%↓'),
('조치 기한','즉시 (D+3~7)','30일 내 개선 계획','60일 내 보완'),
('점수 환산','0~39점 (Critical 불합격 자동)','40~69점','70~100점'),
('결정 규칙','① Critical 1개라도 불합격 → 고위험 확정\n② FEOC/강제노동 즉시','① High 50%↑ 불합격\n② 40~69점\n③ Critical 전부 합격','① 70%↑ 합격\n② Critical·High 전부 합격\n③ 70점↑');

-- ════════════════════════════════════════════════════════════════════
-- [v0.6 신규] AI 에이전트 실행 로그
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `AI_AGENT_RUN_LOG` (
  `run_id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '실행 ID (PK)',
  `trigger_type`     VARCHAR(20)  NOT NULL DEFAULT 'AUTOMATIC' COMMENT '트리거 유형 (AUTOMATIC/MANUAL)',
  `scope`            VARCHAR(20)  NOT NULL DEFAULT 'PARTNER' COMMENT '범위 (PARTNER/ALL)',
  `scope_target`     VARCHAR(50)  COMMENT '대상 기업 코드',
  `rules_evaluated`  INT          NOT NULL DEFAULT 0 COMMENT '평가된 룰 수',
  `alerts_generated` INT          NOT NULL DEFAULT 0 COMMENT '생성된 알림 수',
  `critical_count`   INT          NOT NULL DEFAULT 0 COMMENT 'CRITICAL 건수',
  `fail_count`       INT          NOT NULL DEFAULT 0 COMMENT 'FAIL 건수',
  `warn_count`       INT          NOT NULL DEFAULT 0 COMMENT 'WARN 건수',
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'RUNNING' COMMENT '상태 (RUNNING/SUCCESS/FAILED)',
  `ai_model`         VARCHAR(100) COMMENT 'AI 모델명',
  `ai_summary`       TEXT         COMMENT 'AI 요약',
  `duration_ms`      BIGINT       COMMENT '소요 시간 (ms)',
  `started_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '시작 일시',
  `ended_at`         DATETIME     COMMENT '종료 일시',
  PRIMARY KEY (`run_id`),
  KEY `idx_scope_target` (`scope_target`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 에이전트 실행 로그 — agentpipeline.py 연동';


-- ════════════════════════════════════════════════════════════════════
-- [v0.6 신규] 원자재 요청 이력 (차수별 Top-Down 워크플로우 추적)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `MATERIAL_REQUEST` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `request_id`      VARCHAR(50)  NOT NULL COMMENT '요청 고유 코드',
  `oem_po_id`       VARCHAR(50)  NOT NULL COMMENT '원청사 기준 PO ID (통일 키)',
  `bom_id`          VARCHAR(30)  NOT NULL COMMENT 'BOM 코드 (FK)',
  `requester_id`    VARCHAR(20)  NOT NULL COMMENT '요청자 기업 코드',
  `requester_tier`  TINYINT      NOT NULL COMMENT '요청자 차수 (0=원청사, 1~3)',
  `receiver_id`     VARCHAR(20)  NOT NULL COMMENT '수신자 기업 코드',
  `receiver_tier`   TINYINT      NOT NULL COMMENT '수신자 차수 (1~3)',
  `request_type`    VARCHAR(20)  NOT NULL DEFAULT 'NORMAL' COMMENT '요청 유형 (NORMAL/URGENT)',
  `status`          VARCHAR(30)  NOT NULL DEFAULT 'REQUESTED' COMMENT '상태 (REQUESTED/IN_PROGRESS/SUBMITTED/APPROVED/REJECTED/FINAL)',
  `reject_reason`   TEXT         COMMENT '반려 사유',
  `delete_yn`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_req` (`request_id`),
  KEY `idx_oem_po` (`oem_po_id`),
  KEY `idx_requester` (`requester_id`),
  KEY `idx_receiver` (`receiver_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='원자재 요청 이력 — 차수별 Top-Down 워크플로우 추적';


-- ════════════════════════════════════════════════════════════════════
-- [v0.6 신규] 원자재 임시 저장 (차수별 Draft 스냅샷)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `MATERIAL_DRAFT` (
  `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `request_id`    VARCHAR(50)  NOT NULL COMMENT '요청 코드 (FK→MATERIAL_REQUEST)',
  `partner_id`    VARCHAR(20)  NOT NULL COMMENT '작성자 기업 코드',
  `raw_name`      VARCHAR(200) COMMENT '원자재명',
  `width`         DECIMAL(10,2) COMMENT '폭 (mm)',
  `length`        DECIMAL(10,2) COMMENT '길이 (mm)',
  `weight_kg`     DECIMAL(10,2) COMMENT '중량 (kg)',
  `components`    TEXT          COMMENT '화학 성분비 JSON',
  `origin`        VARCHAR(200)  COMMENT '원산지',
  `draft_json`    JSON          COMMENT '기타 임시 저장 데이터',
  `delete_yn`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_req_partner` (`request_id`, `partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='원자재 임시 저장 — 차수별 Draft 스냅샷';



-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  📊 DB v0.6 통계 — 총 30개 테이블 (UPPER_CASE 통일)                ║
-- ║  ─────────────────────────────────────────────                    ║
-- ║  S1. 사용자·권한·메뉴·알림     : 5개                               ║
-- ║  S2. 기업·초대                 : 2개                               ║
-- ║  S3. PO                        : 1개                               ║
-- ║  S4. 원자재·결재               : 4개                               ║
-- ║  S5. BOM                       : 2개                               ║
-- ║  S6. ESG·자가진단·실사         : 3개                               ║
-- ║  S7. 노드 이력                 : 1개                               ║
-- ║  S8. AI Agent                  : 3개                               ║
-- ║  S9. 자가진단 OCR              : 2개 (risk_level='평가중')         ║
-- ║  S10. ESG 실사 체크리스트      : 2개 (ESG_CHECKLIST/RISK_CRITERIA) ║
-- ║  S11. 파일 관리                : 2개 (LICENSE_FILE/SUPPORTING)     ║
-- ║  S13. ★ 공장관리               : 1개 (FACTORY)                    ║
-- ║  S14. ★ 초대 메시지 관리         : 1개 (INVITATION_MESSAGE)         ║
-- ║  S15. 토큰(로그인 기록)          : 1개 (TOKEN)                      ║
-- ║                                                                  ║
-- ╚══════════════════════════════════════════════════════════════════╝