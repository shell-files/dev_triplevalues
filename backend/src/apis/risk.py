# src/apis/risk.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-15 — 리스크 현황 대시보드 API
# ────────────────────────────────────────────────────────

from fastapi import APIRouter, Query
from typing import Optional
from src.models.risk import getRiskDashboardProcess

router = APIRouter()


@router.get("/dashboard",
    summary="리스크 현황 대시보드 (목록 + 집계)",
    description="AI_AGENT_ALERT + COMPANY + AI_AGENT_RULE + SELF_ASSESS_ANSWER 다중 JOIN")
def getRiskDashboard(
    searchField: Optional[str] = Query(None, description="검색 필드 (company_name/rule_name/ai_reasoning/ai_recommendation/answer_text)"),
    searchKeyword: Optional[str] = Query(None, description="검색 키워드"),
):
    return getRiskDashboardProcess(searchField, searchKeyword)
