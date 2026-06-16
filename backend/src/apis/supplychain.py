# src/apis/supplychain.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-09 — 공급망 요청/승인/반려 + BOM 자동 생성 + ALARM 연동
# ────────────────────────────────────────────────────────

from fastapi import APIRouter, Query
from src.models.supplychain import (
    getProductListProcess,
    getProductDetailProcess,
    getSupplyChainTreeProcess,
    sendRequestProcess,
    approveProcess,
    rejectProcess,
)

router = APIRouter()


# ── 제품 목록 조회 (공급망 맵 리스트)
@router.get("/products",
    summary="마스터 제품 목록 조회",
    description="BOM 테이블 기반 제품 목록 + 연계 협력사 수 + 상태")
def getProducts():
    return getProductListProcess()


# ── 제품 상세 (공급망 트리 + BOM + 원자재)
@router.get("/products/{productId}",
    summary="제품 상세 — 공급망 트리 + BOM + 원자재 데이터",
    description="BOM_TIER_TREE + RM_TIER_TREE 역추적으로 다중 소싱 트리 반환")
def getProductDetail(productId: str):
    return getProductDetailProcess(productId)


# ── 공급망 트리 조회 (특정 협력사 기준)
@router.get("/tree/{partnerId}",
    summary="공급망 트리 조회",
    description="partner_id 기준 상·하위 공급망 계층 트리 반환")
def getSupplyChainTree(partnerId: str):
    return getSupplyChainTreeProcess(partnerId)


# ── Top-Down 요청 발송 (상위 → 하위)
@router.post("/request",
    summary="다중 N차 협력사 데이터 요청 발송",
    description="상위 협력사가 하위 복수 협력사에 ESG/원자재 데이터 제출 요청 + ALARM 생성")
def sendRequest(payload: dict):
    return sendRequestProcess(payload)


# ── Bottom-Up 승인 (BOM 자동 생성 트리거)
@router.post("/approve",
    summary="데이터 승인 + BOM 자동 생성",
    description="하위 데이터 검증 후 승인 → BOM_TIER_TREE INSERT + ESG 가중합산 + ALARM")
def approve(payload: dict):
    return approveProcess(payload)


# ── Bottom-Up 반려 (하위로 역전파)
@router.post("/reject",
    summary="데이터 반려 + 하위 알림 역전파",
    description="하위 데이터 반려 → 상태 DRAFT 복원 + ALARM 발송")
def reject(payload: dict):
    return rejectProcess(payload)
