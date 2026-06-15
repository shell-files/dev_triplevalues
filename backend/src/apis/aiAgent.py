# src/apis/aiAgent.py
# ────────────────────────────────────────────────────────────────────────────
# [역할] AI Agent HTTP API 엔드포인트 (v2.0 회사 중심 partner_id 체계 완전 동기화)
# ────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Query, Header, HTTPException
from typing import Optional
from src.models.aiAgentModel import (
    aiAgentAnalyzeModel, aiAgentAckModel, aiAgentResolveModel, aiAgentResponse
)
from src.models.aiAgentNotify import (
    runAiAgentAnalysis,
    getAiAgentAlertList,
    acknowledgeAiAgentAlert,
    resolveAiAgentAlert,
    getAiAgentRunLogList,
)
from src.utils.db import findAll, findOne
from src.utils.rediscl import getTokenRedis, getCompanyRedis  # Redis 세션 직접 조회를 위해 임포트

from src.utils.websc import manager

router = APIRouter()

# =====================================================================
# 🔐 [공통 헬퍼] v2.0 인증 동기화를 위한 토큰 검증 함수
# =====================================================================

def getPartnerIdFromUuid(uuid: str) -> Optional[str]:
    """
    [v2.0] Redis client1(인증 토큰) & client2(회사 식별자) 2단계 통합 검증을 수행합니다.
    """
    # 🌟 [로컬 개발 및 Swagger 테스트용 마스터 우회 패스]
    if uuid in ["test_master", "bd7443254b74483dafd4378accc76a6b"]:
        print("🚀 [테스트 모드] 임시 마스터 우회 통과 - partner_id: MAIN_HQ")
        return "MAIN_HQ"
        
    if not uuid:
        return None
        
    # [단계 1] db5(client1)에서 현재 세션 유저의 유효한 accessToken이 활성화되어 있는지 검증
    tokenCheck = getTokenRedis(uuid)
    if not tokenCheck or not tokenCheck.get("status"):
        print(f"❌ [AI Agent 인증 실패] client1(db5)에 해당 UUID의 활성화된 토큰 세션이 없음: {uuid}")
        return None

    # [단계 2] db6(client2)에서 유저가 현재 모니터링/선택 중인 회사 식별 코드(partner_id)를 조회
    companyCheck = getCompanyRedis(uuid)
    if not companyCheck or not companyCheck.get("status"):
        print(f"❌ [AI Agent 인증 실패] client2(db6)에 해당 UUID와 매핑된 회사(partner_id) 정보가 없음: {uuid}")
        return None
        
    # getCompanyRedis의 리턴 포맷 {"status": True, "uuid": uuid, "token": result}에서 회사 코드 추출
    partnerId = companyCheck.get("token")
    return partnerId

# ── POST — AI 전체 분석 실행
@router.post("/analyze",
    summary="AI Agent 전체 분석 실행",
    response_model=aiAgentResponse,
    description="하이브리드 RAG 엔진을 작동시켜 가드레일 위반 탐지 및 실시간 DB 적재, 웹소켓 알람 트리거")
async def analyzeEndpoint(request: aiAgentAnalyzeModel):
    # 1. 토큰 기반 본사/원청사 partner_id 검증
    managerPartnerId = getPartnerIdFromUuid(request.uuid)
    if not managerPartnerId:
        return aiAgentResponse(status=False, message="인증 실패: 유유한 세션 토큰이 아닙니다.")

    # 2. 메인 백엔드 분석 파이프라인 엔진 가동
    # [수정] 룰셋 정의에 명시된 'triggeredBy' 위치에 인증 성공한 managerPartnerId 문자열을 함께 주입합니다.
    try:
        success = await runAiAgentAnalysis(
            managerPartnerId,        # 🏢 triggeredBy 파라미터 요구사항 매핑 완료!
            request.triggerType,
            request.scope,
            request.scopeTarget,
            request.aiModel
        )
    except TypeError:
        # 혹시 키워드 인자(명시적 매핑)를 완벽하게 선호하는 선언 방식일 경우를 대비한 가드레일 백업
        success = await runAiAgentAnalysis(
            triggeredBy=managerPartnerId,
            triggerType=request.triggerType,
            scope=request.scope,
            scopeTarget=request.scopeTarget,
            aiModel=request.aiModel
        )

    if not success:
        return aiAgentResponse(status=False, message="AI 분석 엔진 가동 중 오류가 발생했습니다.")
        
    return aiAgentResponse(status=True, message="AI Agent 공급망 분석 및 실시간 경고 전송이 성공적으로 완료되었습니다.")


# ── GET — AI 알림 목록 조회
@router.get("/alerts",
    summary="AI Agent 위반 알림 목록 조회",
    response_model=aiAgentResponse)
def listAlertsEndpoint(
    partnerId: Optional[str] = Query(None, description="특정 협력사 코드 필터"),
    severity: Optional[str] = Query(None, description="위험 심각도 필터 (CRITICAL/HIGH/MEDIUM/LOW)"),
    status: Optional[str] = Query("OPEN", description="알림 상태 필터 (OPEN/ACKNOWLEDGED/RESOLVED)"),
    limit: int = Query(50, ge=1, le=100)
    ):
    alerts = getAiAgentAlertList(partnerId=partnerId, severity=severity, status=status, limit=limit)
    return aiAgentResponse(
        status=True,
        message="알림 목록 조회 성공",
        data={"alerts": alerts, "count": len(alerts)}
    )


# ── PATCH — 알림 확인 처리 (ACK)
@router.patch("/alerts/{alertId}/ack",
    summary="AI Agent 알림 확인 처리",
    response_model=aiAgentResponse)
def ackAlertEndpoint(alertId: int, request: aiAgentAckModel):
    # 기존 유저 ID 대신 partner_id 검증으로 전면 교체
    managerPartnerId = getPartnerIdFromUuid(request.uuid)
    if not managerPartnerId:
        return aiAgentResponse(status=False, message="인증 실패")

    # 수정한 비즈니스 로직 함수 인터페이스 매핑 (managerPartnerId 문자열 주입)
    result = acknowledgeAiAgentAlert(alertId, managerPartnerId)
    return aiAgentResponse(status=True, message="알림 확인(ACK) 처리가 완료되었습니다.", data=result)


# ── PATCH — 알림 해소 처리 (RESOLVE)
@router.patch("/alerts/{alertId}/resolve",
    summary="AI Agent 알림 해소 처리",
    response_model=aiAgentResponse)
def resolveAlertEndpoint(alertId: int, request: aiAgentResolveModel):
    # 기존 유저 ID 대신 partner_id 검증으로 전면 교체
    managerPartnerId = getPartnerIdFromUuid(request.uuid)
    if not managerPartnerId:
        return aiAgentResponse(status=False, message="인증 실패")

    # 수정한 비즈니스 로직 함수 인터페이스 매핑 (managerPartnerId 문자열 주입)
    result = resolveAiAgentAlert(alertId, managerPartnerId, request.resolutionNote or "")
    return aiAgentResponse(status=True, message="감사관 최종 리스크 해소(RESOLVED) 처리가 완료되었습니다.", data=result)


# ── GET — 실행 로그 조회
@router.get("/runs",
    summary="AI Agent 실행 로그 조회",
    response_model=aiAgentResponse)
def listAiAgentRuns(limit: int = Query(20, ge=1, le=100)) -> aiAgentResponse:
    runs = getAiAgentRunLogList(limit=limit)
    return aiAgentResponse(
        status=True,
        message="조회 성공",
        data={"runs": runs, "count": len(runs)},
    )


# ── GET — 룰셋 조회
@router.get("/rules",
    summary="AI Agent 룰셋 조회",
    response_model=aiAgentResponse)
def listAiAgentRules(activeOnly: bool = Query(True)):
    where = "WHERE active_yn = 'Y'" if activeOnly else ""
    sql = f"""
        SELECT rule_id, indicator_no, rule_code, rule_name, tier_scope,
               metric_key, operator, threshold_value, severity, regulation
        FROM `AI_AGENT_RULE_REGISTRY` {where}
        ORDER BY indicator_no ASC
    """
    rules = findAll(sql)
    return aiAgentResponse(
        status=True,
        message="룰셋 마스터 정보 조회 성공",
        data={"rules": rules, "count": len(rules)}
    )

import time
from datetime import datetime
import asyncio
from pydantic import BaseModel
from typing import Optional, Dict, Any, List


# =====================================================================
# 🛸 [Airflow 연동 전용] Pydantic 요청 스키마 정의
# =====================================================================

# Airflow가 한 번에 뿜어주는 개별 알람 데이터 스펙
class AirflowItem(BaseModel):
    partner_id: str
    indicator_no: int
    type: str = "tv"
    title: str
    content: str
    risk_level: str

class AirflowCombinedPayload(BaseModel):
    partner_id: str         # 웹소켓 룸 ID로 활용할 원청사 식별 코드 (예: MAIN_HQ, hyundai_mobis_hq)
    alerts: List[AirflowItem]  # 🚀 대량의 알람 리스트가 한 번에 들어옴

# =====================================================================
# 🚀 POST — Airflow 자가진단 분석 완료 시그널 수신 (통합 관제 웹소켓 트리거)
# =====================================================================

@router.post("/airflow-trigger",
    summary="[Airflow 전용] 자가진단 분석 결과 수신 및 실시간 관제 트리거",
    description="Airflow 백엔드로부터 알람 및 AI 얼럿 원시 데이터를 묶음으로 수신하여 가공 후, 관제 화면으로 웹소켓 브로드캐스트를 수행합니다.")
async def airflowTriggerEndpoint(
    request: AirflowCombinedPayload,
    x_airflow_token: Optional[str] = Header(None, alias="X-Airflow-Token", description="Airflow 내부망 연동 인증 키")
):
    from fastapi import status, HTTPException
    # 1. 🔐 Airflow 전용 시크릿 토큰 보안 검증 (예시 하드코딩, 실제로는 환경변수 처리 권장)
    AIRFLOW_SECRET = "airflow_secret_secure_key_2026"
    if not x_airflow_token or x_airflow_token != AIRFLOW_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 실패: 유효한 Airflow 시스템 토큰이 헤더에 누락되었거나 일치하지 않습니다."
        )

    try:
        # 2. 데이터 식별자 추출 (중복 제거)
        partner_ids = list(set([item.partner_id for item in request.alerts]))
        indicator_nos = list(set([item.indicator_no for item in request.alerts]))

        # 3. DB 일괄 조회 (성능 최적화)
        # COMPANY 조회
        c_sql = f"SELECT partner_id, short_name, tier_label FROM `COMPANY` WHERE partner_id IN ({','.join(['?']*len(partner_ids))})"
        db_companies = findAll(c_sql, tuple(partner_ids)) or []
        company_map = {row["partner_id"]: {"short_name": row["short_name"], "tier_label": row["tier_label"]} for row in db_companies}

        # AI_AGENT_RULE 조회
        r_sql = f"SELECT indicator_no, rule_name, action_required FROM `AI_AGENT_RULE` WHERE indicator_no IN ({','.join(['?']*len(indicator_nos))})"
        db_rules = findAll(r_sql, tuple(indicator_nos)) or []
        rule_map = {row["indicator_no"]: {"rule_name": row["rule_name"], "action": row["action_required"]} for row in db_rules}

        # 4. 데이터 통합 및 패키징
        timestamp_ms = int(datetime.now().timestamp() * 1000)
        now_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        batch_dashboard_alerts = []

        # 티어 명칭 정규화 함수
        def normalize_tier(tier_str):
            if not tier_str: return "미지정"
            if "1차" in tier_str: return "1차 협력사"
            if "2차" in tier_str: return "2차 협력사"
            if "3차" in tier_str: return "3차 협력사"
            return tier_str

        for idx, item in enumerate(request.alerts):
            c_info = company_map.get(item.partner_id, {"short_name": "미등록기업", "tier_label": "미지정"})
            r_info = rule_map.get(item.indicator_no, {"rule_name": "기타", "action": "확인 요망"})

            # 여기서 통일된 티어 명칭 생성
            normalized_tier = normalize_tier(c_info.get("tier_label"))  

            perfect_combined_data = {
                "type": "tv",
                "sender": "Airflow_Agent",
                "data": {
                    "alarm": {
                        "id": timestamp_ms + idx,
                        "partner_id": item.partner_id,
                        "type": item.type,
                        "title": item.title,
                        "content": item.content
                    },
                    "aiAgent": {
                        "dashboardAlert": {
                            "id": f"ai_alert_{item.partner_id}_{item.indicator_no}_{timestamp_ms}_{idx}",
                            "type": item.risk_level,
                            "company": c_info.get("short_name"),
                            "tier": normalized_tier,
                            "date": now_date,
                            "msg": f"[{item.title}] {item.content}"
                        },
                        "tableRow": {
                            "indicator_no": item.indicator_no,
                            "company_name": c_info.get("short_name"),
                            "tier": normalized_tier,
                            "name": r_info.get("rule_name"),
                            "action_required": r_info.get("action"),
                            "actual_value": "Airflow 실시간 탐지값",
                            "risk_level": item.risk_level
                        }
                    }
                }
            }
            batch_dashboard_alerts.append(perfect_combined_data)

        # 5. 웹소켓 브로드캐스트
        # request.partner_id 또는 전체 관제룸으로 전송
        await manager.broadcastToRoom(request.partner_id, {
            "type": "BATCH_ALARM",
            "is_batch": True,
            "data": batch_dashboard_alerts
        })

        return {"status": True, "count": len(batch_dashboard_alerts)}

    except Exception as e:
        print(f"❌ Airflow 트리거 처리 오류: {e}")
        raise HTTPException(status_code=500, detail="데이터 처리 실패")