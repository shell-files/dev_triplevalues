# src/models/risk.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-15 — 리스크 현황 대시보드 비즈니스 로직
# ────────────────────────────────────────────────────────

from src.utils.db import findAll
from src.models.model import responseModel


def getRiskDashboardProcess(searchField=None, searchKeyword=None) -> dict:
    # 다중 JOIN SQL
    baseSql = """
        SELECT
            aa.alert_id,
            aa.partner_id,
            aa.indicator_no,
            aa.severity,
            aa.ai_confidence,
            aa.ai_reasoning,
            aa.ai_recommendation,
            aa.detected_at,
            c.company_name,
            c.tier,
            c.tier_label,
            r.rule_name,
            r.category,
            r.regulation,
            sa.answer_text
        FROM `AI_AGENT_ALERT` aa
        LEFT JOIN `COMPANY` c ON aa.partner_id = c.partner_id
        LEFT JOIN `AI_AGENT_RULE` r ON aa.indicator_no = r.indicator_no
        LEFT JOIN (
            SELECT partner_id, indicator_no, answer_text
            FROM `SELF_ASSESS_ANSWER`
            WHERE delete_yn = 0
            AND id IN (
                SELECT MAX(id) FROM `SELF_ASSESS_ANSWER`
                WHERE delete_yn = 0
                GROUP BY partner_id, indicator_no
            )
        ) sa ON aa.partner_id = sa.partner_id AND aa.indicator_no = sa.indicator_no
        WHERE aa.delete_yn = 0
    """

    params = []

    # 동적 검색 조건
    if searchField and searchKeyword:
        keyword = f"%{searchKeyword}%"
        fieldMap = {
            "company_name": "c.company_name",
            "rule_name": "r.rule_name",
            "ai_reasoning": "aa.ai_reasoning",
            "ai_recommendation": "aa.ai_recommendation",
            "answer_text": "sa.answer_text",
        }
        dbField = fieldMap.get(searchField)
        if dbField:
            baseSql += f" AND {dbField} LIKE ?"
            params.append(keyword)

    baseSql += " ORDER BY aa.detected_at DESC"

    rows = findAll(baseSql, tuple(params) if params else ()) or []

    # 집계 연산
    tierCount = {"1차 협력사": 0, "2차 협력사": 0, "3차 협력사": 0}
    severityCount = {"고위험": 0, "중위험": 0, "저위험": 0}

    severityMap = {
        "CRITICAL": "고위험", "HIGH": "고위험", "FAIL": "고위험",
        "MEDIUM": "중위험", "WARN": "중위험",
        "LOW": "저위험", "PASS": "저위험",
    }

    alerts = []
    for r in rows:
        tierLabel = r.get("tier_label", "") or ""
        severity = r.get("severity", "") or ""
        severityKr = severityMap.get(severity.upper(), severity)

        # 3차-A, 3차-B → 3차 협력사로 통합
        tierKey = tierLabel
        if "3차" in tierLabel:
            tierKey = "3차 협력사"

        if tierKey in tierCount:
            tierCount[tierKey] += 1
        if severityKr in severityCount:
            severityCount[severityKr] += 1

        alerts.append({
            "alertId": r["alert_id"],
            "partnerId": r["partner_id"],
            "tierLabel": tierLabel,
            "companyName": r.get("company_name", "") or "",
            "ruleName": r.get("rule_name", "") or "",
            "category": r.get("category", "") or "",
            "aiReasoning": r.get("ai_reasoning", "") or "",
            "aiRecommendation": r.get("ai_recommendation", "") or "",
            "answerText": r.get("answer_text", "") or "",
            "severity": severityKr,
            "aiConfidence": float(r.get("ai_confidence", 0) or 0),
            "detectedAt": str(r.get("detected_at", ""))[:19] if r.get("detected_at") else "",
        })

    return responseModel(True, "", {
        "alerts": alerts,
        "totalCount": len(alerts),
        "tierCount": tierCount,
        "severityCount": severityCount,
    })
