# src/models/dashboard.py
# ────────────────────────────────────────────────────────
# [v2.0] 2026-06-16 — raise HTTPException 제거, try/except + responseModel 통일
# ────────────────────────────────────────────────────────

from src.utils.db import save, findOne, findAll
from src.models.model import responseModel


def normalizeTier(label: str) -> str:
    if not label:
        return "협력사"
    if "1차" in label:
        return "1차 협력사"
    if "2차" in label:
        return "2차 협력사"
    if "3차" in label:
        return "3차 협력사"
    return label


def getDashboardAlertsProcess(params):
    try:
        sql = """
            SELECT
                a.alert_id, c.short_name, c.tier_label,
                a.severity, r.rule_name, r.action_required, a.detected_at
            FROM AI_AGENT_ALERT a
            LEFT JOIN COMPANY c ON a.partner_id = c.partner_id
            LEFT JOIN AI_AGENT_RULE r ON a.indicator_no = r.indicator_no
            WHERE a.delete_yn = 0
            ORDER BY a.detected_at DESC
            LIMIT 20
        """
        results = findAll(sql, None) or []

        processedAlerts = []
        for row in results:
            processedAlerts.append({
                "id": row["alert_id"],
                "company": row["short_name"],
                "tier": normalizeTier(row["tier_label"]),
                "action_required": row["action_required"],
                "date": str(row["detected_at"])[:10] if row.get("detected_at") else "-",
                "type": row["severity"],
                "msg": row["rule_name"]
            })

        return responseModel(True, "조회 성공", processedAlerts)
    except Exception as e:
        return responseModel(False, f"알림 피드 조회 중 오류가 발생했습니다: {str(e)}")


def getAlertDetailProcess(alertId: int):
    try:
        sql = """
            SELECT
                a.alert_id, c.short_name, r.rule_name,
                r.action_required, a.ai_reasoning, a.ai_recommendation
            FROM AI_AGENT_ALERT a
            LEFT JOIN COMPANY c ON a.partner_id = c.partner_id
            LEFT JOIN AI_AGENT_RULE r ON a.indicator_no = r.indicator_no
            WHERE a.alert_id = ?
        """
        result = findOne(sql, (alertId,))

        if not result:
            return responseModel(False, f"알림 번호({alertId})의 데이터를 찾을 수 없습니다.")

        return responseModel(True, "조회 성공", {
            "id": result["alert_id"],
            "company": result["short_name"],
            "ruleName": result["rule_name"],
            "actionRequired": result["action_required"],
            "aiReasoning": result["ai_reasoning"],
            "aiRecommendation": result["ai_recommendation"]
        })
    except Exception as e:
        return responseModel(False, f"알림 상세 조회 중 오류가 발생했습니다: {str(e)}")


def resolveDashboardAlertProcess(alertId: int):
    try:
        checkSql = """
            SELECT ai_reasoning, ai_recommendation
            FROM AI_AGENT_ALERT
            WHERE alert_id = ?
        """
        alert = findOne(checkSql, (alertId,))

        if not alert:
            return responseModel(False, "해당 알림을 찾을 수 없습니다.")

        if not alert.get("ai_reasoning") or not alert.get("ai_recommendation"):
            return responseModel(False, "AI 추론 근거 및 추천 로드맵이 생성되지 않은 알림은 조치 완료 처리할 수 없습니다.")

        updateSql = """
            UPDATE AI_AGENT_ALERT
            SET delete_yn = 1
            WHERE alert_id = ?
        """
        save(updateSql, (alertId,))

        return responseModel(True, "조치 완료 처리되었습니다.")
    except Exception as e:
        return responseModel(False, f"조치 완료 처리 중 오류가 발생했습니다: {str(e)}")


def getCompanytotalCountProcess(params):
    try:
        sql = """
            SELECT
                COUNT(CASE WHEN tier = 1 THEN 1 END) AS tier1count,
                COUNT(CASE WHEN tier = 2 THEN 1 END) AS tier2count,
                COUNT(CASE WHEN tier = 3 THEN 1 END) AS tier3count,
                COUNT(CASE WHEN tier <> 0 THEN 1 END) AS totalexceptzero
            FROM COMPANY
            WHERE delete_yn = 0
        """
        results = findAll(sql) or []

        processedData = {"tier1Count": 0, "tier2Count": 0, "tier3Count": 0, "totalExceptZero": 0}
        if results and len(results) > 0:
            row = results[0]
            processedData = {
                "tier1Count": row.get("tier1count") or row.get("TIER1COUNT") or 0,
                "tier2Count": row.get("tier2count") or row.get("TIER2COUNT") or 0,
                "tier3Count": row.get("tier3count") or row.get("TIER3COUNT") or 0,
                "totalExceptZero": row.get("totalexceptzero") or row.get("TOTALEXCEPTZERO") or 0
            }

        return responseModel(True, "회사 티어별 통계 조회 성공", processedData)
    except Exception as e:
        return responseModel(False, f"회사 통계 조회 중 오류가 발생했습니다: {str(e)}")


def getCompanyVerificationCompleteCountProcess(params):
    try:
        sql = """
            SELECT SUM(COALESCE(cert_count, 0)) AS totalCertCount
            FROM COMPANY
            WHERE id <> 1
        """
        results = findAll(sql) or []

        processedData = {"totalCertCount": 0}
        if results and len(results) > 0:
            row = results[0]
            processedData = {"totalCertCount": row.get("totalCertCount") or row.get("TOTALCERTCOUNT") or 0}

        return responseModel(True, "회사 인증 완료 회사 수 조회 성공", processedData)
    except Exception as e:
        return responseModel(False, f"인증 통계 조회 중 오류가 발생했습니다: {str(e)}")


def getCompanyMidRiskCountProcess(params):
    try:
        sql = """
            SELECT COUNT(*) AS midRiskCount
            FROM COMPANY
            WHERE risk_level = '중위험' AND delete_yn = 0 AND id <> 1
        """
        results = findAll(sql) or []

        row = results[0] if results else {}
        processedData = {"midRiskCount": row.get("midRiskCount") or row.get("MIDRISKCOUNT") or 0}

        return responseModel(True, "회사 리스크 수준별 통계 조회 성공", processedData)
    except Exception as e:
        return responseModel(False, f"리스크 통계 조회 중 오류가 발생했습니다: {str(e)}")
