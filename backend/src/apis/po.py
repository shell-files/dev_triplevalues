# src/apis/purchase.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-16 — 구매 발주(PO) 관리 API
# ────────────────────────────────────────────────────────

from fastapi import APIRouter, Query
from typing import Optional
from src.models.po import getPoListProcess, seedPoProcess

router = APIRouter()


@router.get("/list",
    summary="PO 목록 조회 (발주처/수주처 JOIN + 원자재 JOIN)",
    description="PURCHASE_ORDER + COMPANY(sender/receiver) + RAW_MATERIAL 다중 JOIN")
def getPoList(
    searchField: Optional[str] = Query(None),
    searchKeyword: Optional[str] = Query(None),
):
    return getPoListProcess(searchField, searchKeyword)


@router.post("/seed",
    summary="테스트용 랜덤 PO 2건 자동 생성",
    description="PURCHASE_ORDER 테이블에 랜덤 더미 데이터 2건 INSERT")
def seedPo():
    return seedPoProcess()
