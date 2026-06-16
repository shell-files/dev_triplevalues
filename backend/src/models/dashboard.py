
from fastapi import HTTPException, status
from src.utils.db import save, findOne, findAll
from src.models.model import responseModel


def normalizeTier(label: str) -> str:
    if not label:
        return "협력사"
    
    # 3차-A, 3차-B 등을 모두 "3차 협력사"로 통일
    if "1차" in label:
        return "1차 협력사"
    if "2차" in label:
        return "2차 협력사"
    if "3차" in label:
        return "3차 협력사"

    return label

def getDashboardAlertsProcess(params):
    """
    AI_AGENT_ALERT 최신 데이터를 COMPANY, AI_AGENT_RULE과 조인하여 조회
    """
    sql = """
        SELECT 
            a.alert_id ,
            c.short_name ,
            c.tier_label,
            a.severity ,
            r.rule_name ,
            r.action_required,
            a.detected_at 
        FROM AI_AGENT_ALERT a
        LEFT JOIN COMPANY c ON a.partner_id = c.partner_id
        LEFT JOIN AI_AGENT_RULE r ON a.indicator_no = r.indicator_no
        WHERE a.delete_yn = 0
        ORDER BY a.detected_at DESC
        LIMIT 20
    """
    results = findAll(sql, None)
    
    # 데이터 가공 (티어 정규화 등 기존 로직 활용)
    processedAlerts = []
    for row in results:
        processedAlerts.append({
            "id": row["alert_id"],
            "company": row["short_name"],
            "tier": normalizeTier(row["tier_label"]),
            "action_required": row["action_required"],
            "date": row["detected_at"],
            "type": row["severity"],
            "msg": row["rule_name"]
        })
        
    return responseModel(True,"조회 성공", processedAlerts)

def getAlertDetailProcess(alertId: int):
    """
    특정 alert_id에 대한 상세 데이터 조회
    """
    # 1. 상세 데이터를 가져오기 위한 쿼리
    sql = """
        SELECT 
            a.alert_id,
            c.short_name, 
            r.rule_name,
            r.action_required,
            a.ai_reasoning, 
            a.ai_recommendation
        FROM AI_AGENT_ALERT a
        LEFT JOIN COMPANY c ON a.partner_id = c.partner_id
        LEFT JOIN AI_AGENT_RULE r ON a.indicator_no = r.indicator_no
        WHERE a.alert_id = ?
    """
    
    # DB 조회 (파라미터 바인딩 사용)
    result = findOne(sql, (alertId,))
    
    # 2. 데이터 존재 여부 확인
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with id {alertId} not found"
        )
    

    return responseModel(True,"조회 성공", {
                                            "id": result["alert_id"],
                                            "company": result["short_name"],
                                            "ruleName": result["rule_name"],
                                            "actionRequired": result["action_required"],
                                            "aiReasoning": result["ai_reasoning"],
                                            "aiRecommendation": result["ai_recommendation"]
                                    })


def resolveDashboardAlertProcess(alertId: int):
    # 1. 먼저 해당 알림 데이터의 AI 분석 정보가 있는지 조회
    check_sql = """
        SELECT ai_reasoning, ai_recommendation 
        FROM AI_AGENT_ALERT 
        WHERE alert_id = ?
    """
    alert = findOne(check_sql, (alertId,))
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 알림을 찾을 수 없습니다."
        )
        
    # 2. 필수 조건 검증: 두 값 중 하나라도 없거나 비어있다면 400 Bad Request 에러 반환
    if not alert.get("ai_reasoning") or not alert.get("ai_recommendation"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI 추론 근거 및 추천 로드맵이 생성되지 않은 알림은 조치 완료 처리할 수 없습니다."
        )
        
    # 3. 검증 통과 시 delete_yn = 1 업데이트 수행
    update_sql = """
        UPDATE AI_AGENT_ALERT 
        SET delete_yn = 1 
        WHERE alert_id = ?
    """
    
    result = save(update_sql, (alertId,))
        
    return responseModel(True,"조치 완료 처리되었습니다.")

def getCompanytotalCountProcess(params):
    """
    COMPANY 테이블에서 기업들의 티어별(1, 2, 3) 개수 및 
    0을 제외한 전체 개수를 집계하여 반환
    """

    countCompanySql = """
    SELECT 
    COUNT(CASE WHEN tier = 1 THEN 1 END) AS tier1count,
    COUNT(CASE WHEN tier = 2 THEN 1 END) AS tier2count,
    COUNT(CASE WHEN tier = 3 THEN 1 END) AS tier3count,
    COUNT(CASE WHEN tier <> 0 THEN 1 END) AS totalexceptzero
    FROM COMPANY
    WHERE delete_yn = 0
    """

    results = findAll(countCompanySql)

    processedData = {
        "tier1Count": 0,
        "tier2Count": 0,
        "tier3Count": 0,
        "totalExceptZero": 0
    }

    if results and len(results) > 0:
        row = results[0] # 첫 번째 결과 행 가져오기
        processedData = {
            "tier1Count": row.get("tier1count") or row.get("TIER1COUNT") or 0,
            "tier2Count": row.get("tier2count") or row.get("TIER2COUNT") or 0,
            "tier3Count": row.get("tier3count") or row.get("TIER3COUNT") or 0,
            "totalExceptZero": row.get("totalexceptzero") or row.get("TOTALEXCEPTZERO") or 0
        }

    return responseModel(True, "회사 티어별 통계 조회 성공", processedData)

def getCompanyVerificationCompleteCountProcess(params):
    """
    COMPANY 테이블에서 기업들의 인증 완료 회사 수 조회
    """

    countCompanyVerificationCompleteSql = """
    SELECT 
    SUM(COALESCE(cert_count, 0)) AS totalCertCount
    FROM COMPANY
    WHERE id <> 1
    """

    results = findAll(countCompanyVerificationCompleteSql)

    processedData = {"totalCertCount": 0}

    if results and len(results) > 0:
        row = results[0] 
        processedData = {"totalCertCount": row.get("totalCertCount") or row.get("TOTALCERTCOUNT") or 0}

    return responseModel(True, "회사 인증 완료 회사 수 조회 성공", processedData)