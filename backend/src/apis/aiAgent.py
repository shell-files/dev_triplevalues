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


from datetime import datetime
import asyncio
from pydantic import BaseModel
from typing import Optional, Dict, Any


# =====================================================================
# 🛸 [Airflow 연동 전용] Pydantic 요청 스키마 정의
# =====================================================================

class AirflowCombinedPayload(BaseModel):
    company_id: str         # 웹소켓 룸 ID로 활용할 원청사 식별 코드 (예: MAIN_HQ, hyundai_mobis_hq)
    alarm_data: Dict[str, Any]       # 알람 테이블에서 온 순수 데이터 (백엔드 재가공 없이 패스스루)
    ai_agent_payload: Dict[str, Any] # 에이아이에이전트얼럿 테이블 기반 데이터 (partner_id, indicator_no 등 포함)

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
        # 2. 🟢 알람 테이블 데이터 파싱 (재가공 없이 프론트엔드로 즉시 토스할 수 있도록 준비)
        ready_alarm_data = request.alarm_data

        # 3. 🟡 AI 에이전트 얼럿 데이터 가공 (비동기 DB 경유 및 조합 처리)
        # Airflow가 준 payload에서 핵심 식별자 추출
        partner_id = request.ai_agent_payload.get("partner_id")
        indicator_no = request.ai_agent_payload.get("indicator_no")

        if not partner_id or not indicator_no:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="필수 인자(partner_id 또는 indicator_no)가 ai_agent_payload 내에 누락되었습니다."
            )

        # [비동기 DB 조회 수행] 프로젝트 내의 db utils 또는 ORM을 활용하여 상세 정보를 채웁니다.
        # 기존 프로젝트 sql 패턴에 맞춰 가상 쿼리 예시 작성
        company_sql = f"SELECT company_name, tier FROM `COMPANY` WHERE partner_id = '{partner_id}'"
        rule_sql = f"SELECT rule_name, regulation, severity FROM `AI_AGENT_RULE` WHERE indicator_no = {indicator_no} LIMIT 1"
        
        # 메인 프로젝트의 DB 조회 유틸리티 함수를 사용한다고 가정
        company_info = findOne(company_sql) or {"company_name": f"협력사_{partner_id}", "tier": "미지정"}
        rule_info = findOne(rule_sql) or {"rule_name": "공급망 자가진단 위반 우려", "regulation": "CSDDD", "severity": "HIGH"}

        # 프론트엔드 React 컴포넌트(MainDashboard, RiskList) 양식에 완벽히 동기화되도록 데이터 적재 구조 가공
        now_date = datetime.now().strftime("%Y-%m-%d")
        
        ready_ai_data = {
            # ① MainDashboard.jsx 리스크 실시간 알림 피드용 포맷
            "dashboardAlert": {
                "id": f"ai_alert_{partner_id}_{indicator_no}_{int(datetime.now().timestamp())}",
                "type": rule_info.get("severity") or "고위험",
                "company": company_info.get("company_name"),
                "tier": company_info.get("tier") or "협력사",
                "date": now_date,
                "msg": f"AI 분석 결과: {company_info.get('company_name')}의 자가진단 항목 중 {rule_info.get('rule_name')} 지표가 감지되었습니다. ({rule_info.get('regulation')} 규제 위반 위험)"
            },
            # ② RiskList.jsx 관제 테이블 테이블 행(Row) 추가용 포맷
            "tableRow": {
                "indicator_no": indicator_no,
                "company_name": company_info.get("company_name"),
                "tier": 2 if "2차" in str(company_info.get("tier")) else 1, # 단순 티어 정수 변환 예시
                "name": rule_info.get("rule_name"),
                "regs": rule_info.get("regulation"),
                "actual_value": "자가진단 점수 미흡 또는 기준치 초과",
                "risk_level": rule_info.get("severity") or "고위험"
            }
        }

        # 4. 🚀 하나로 완성된 통합 묶음 데이터를 웹소켓 룸으로 원샷 브로드캐스트
        perfect_combined_data = {
            "type": "REALTIME_COMBINED_ALERT",
            "sender": "Airflow_Agent",
            "data": {
                "alarm": ready_alarm_data,  # 재가공 없는 순수 알람 데이터
                "aiAgent": ready_ai_data    # DB 경유하여 완벽 변형된 AI 데이터
            }
        }

        # 모듈화한 전역 socket_manager 인스턴스를 통해 대상 React 브라우저 그룹으로 전송
        await manager.broadcastToRoom(room_id=request.company_id, data={
                "type": "tv",  # 현재 수신부 로직의 if data.get('type') == 'tv' 분기를 태우기 위해 설정
                "sender": "Airflow_Agent",
                "data": perfect_combined_data  # 💡 여기에 responseModel 결과물이 안전하게 안착합니다.
            })
        
        # (테스트 확인용 로그 프린트)
        print(f"🎯 [실시간 관제] {request.company_id} 룸으로 알람 및 AI 리스크 팩 밀어내기 완료")

        return {
            "status": True,
            "message": f"Airflow 데이터 수집 및 '{request.company_id}' 관제 화면 실시간 전송 성공"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Airflow Webhook 처리 중 백엔드 서버 내부 에러 발생: {str(e)}"
        )