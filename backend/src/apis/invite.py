# src/apis/invite.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-05 — 협력사 초대 시스템 라우터
# ────────────────────────────────────────────────────────

from fastapi import APIRouter, Query
from src.models.model import InviteModel
from src.models.invite import (
    getInviteMessageProcess,
    sendInviteProcess,
    verifyInviteLinkProcess,
)

router = APIRouter()


@router.get("/message",
    summary="초대 메시지 조회",
    description="로그인한 초대사의 role_code에 매칭되는 초대 메시지(제목+본문) 조회")
def getInviteMessage(roleCode: str = Query(..., description="초대사 권한 코드 (OEM/TIER1/TIER2)")):
    return getInviteMessageProcess(roleCode)


@router.post("",
    summary="협력사 초대 발송",
    description="초대 팝업 폼 데이터 수신 → partner_id 생성 → COMPANY INSERT → Kafka 이메일 발송")
def sendInvite(inviteModel: InviteModel):
    return sendInviteProcess(inviteModel)


@router.get("/verify/{partnerId}",
    summary="초대 링크 검증",
    description="피초대 협력사의 최초 접속 / 등록 완료 여부 확인 (is_registered 기반)")
def verifyInviteLink(partnerId: str):
    return verifyInviteLinkProcess(partnerId)
