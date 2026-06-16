# src/apis/dashboard.py
# ────────────────────────────────────────────────────────
# [v2.0] 2026-06-16 — raise HTTPException 제거, Router 1줄 return 통일
# [역할] AI Agent HTTP API 엔드포인트 (v2.0 회사 중심 partner_id 체계 완전 동기화)
# ────────────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from src.models.model import dashboardAlertsRiskModel
from src.models.dashboard import (
    getDashboardAlertsProcess,
    getAlertDetailProcess,
    resolveDashboardAlertProcess,
    getCompanytotalCountProcess,
    getCompanyVerificationCompleteCountProcess,
    getCompanyMidRiskCountProcess
)

router = APIRouter()


@router.get("/alerts",
    summary="대시보드 피드",
    description="대시보드 alerts 피드 조회")
def getDashboardAlerts(params: dashboardAlertsRiskModel = Depends()):
    return getDashboardAlertsProcess(params)


@router.get("/alerts/{alertId}",
    summary="대시보드 alerts 상세 조회",
    description="특정 alertId에 대한 상세 데이터 조회")
def getAlertDetail(alertId: int):
    return getAlertDetailProcess(alertId)


@router.post("/alerts/{alertId}/resolve",
    summary="대시보드 alerts 확인 완료 처리",
    description="특정 alertId에 대한 확인 완료 처리")
def resolveDashboardAlert(alertId: int):
    return resolveDashboardAlertProcess(alertId)


@router.get("/companies/count",
    summary="대시보드 회사 티어별 통계",
    description="대시보드 회사 티어별 통계 조회")
def getCompanytotalCount(params: dashboardAlertsRiskModel = Depends()):
    return getCompanytotalCountProcess(params)


@router.get("/companies/verification",
    summary="대시보드 회사 인증 완료 회사 수",
    description="대시보드 회사 인증 완료 회사 수 조회")
def getCompanyVerificationCompleteCount(params: dashboardAlertsRiskModel = Depends()):
    return getCompanyVerificationCompleteCountProcess(params)


@router.get("/companies/midrisk",
    summary="대시보드 회사 중위험 기업 수",
    description="대시보드 회사 중위험 기업 수 조회")
def getCompanyMidRiskCount(params: dashboardAlertsRiskModel = Depends()):
    return getCompanyMidRiskCountProcess(params)