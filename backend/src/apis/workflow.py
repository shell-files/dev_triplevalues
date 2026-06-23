# src/apis/workflow.py
# ────────────────────────────────────────────────────────
# [v1.0] 공급망 맵 워크플로우 API — 원자재 요청/승인/반려/임시저장/최종등록
# ────────────────────────────────────────────────────────

from fastapi import APIRouter, Depends
from src.models.model import CreateRequestBody, ApproveRejectBody, RejectBody, SubmitToUpperBody, FinalRegisterBody, SaveDraftBody, RequestListQuery, CancelApprovalBody, RequestRollbackBody
from src.models.workflow import (
    createRequestProcess,
    getRequestDetailProcess,
    getRequestsByPartnerProcess,
    approveRequestProcess,
    rejectRequestProcess,
    submitToUpperProcess,
    finalRegisterProcess,
    saveDraftProcess,
    getDraftProcess,
    getWorkflowTreeProcess,
    getSubPartnersProcess,
    cancelApprovalProcess,
    requestRollbackProcess,
)

router = APIRouter()


# ── 엔드포인트 ──

@router.post("/request",
    summary="원자재 요청 생성 (Top-Down)",
    description="원청사/1차/2차가 하위 협력사에 원자재 데이터 작성을 요청합니다.")
def createRequest(body: CreateRequestBody):
    return createRequestProcess(body.dict())


@router.get("/request/{requestId}",
    summary="요청 상세 조회",
    description="특정 요청의 상세 정보 + 하위 체인 상태를 조회합니다.")
def getRequestDetail(requestId: str):
    return getRequestDetailProcess(requestId)


@router.get("/requests/{partnerId}",
    summary="기업별 원자재 요청 목록 조회",
    description="요청처/수신처 기준 요청 목록 + role·keyword 동적 필터 (RequestListQuery)")
def getRequestsByPartner(partnerId: str, query: RequestListQuery = Depends()):
    return getRequestsByPartnerProcess(partnerId, query.role, query.keyword)


@router.post("/approve",
    summary="하위 데이터 승인",
    description="상위 협력사가 하위 협력사의 제출 데이터를 승인합니다.")
def approveRequest(body: ApproveRejectBody):
    return approveRequestProcess(body.dict())


@router.post("/reject",
    summary="하위 데이터 반려",
    description="상위 협력사가 하위 협력사의 제출 데이터를 반려합니다 (사유 필수).")
def rejectRequest(body: RejectBody):
    return rejectRequestProcess(body.dict())


@router.post("/submit",
    summary="상위 방향 승인 요청 (Bottom-Up)",
    description="하위 협력사가 자사 데이터를 상위 협력사에 제출합니다.")
def submitToUpper(body: SubmitToUpperBody):
    return submitToUpperProcess(body.dict())


@router.post("/final-register",
    summary="1차 협력사 최종 등록",
    description="1차 협력사가 모든 하위 검증을 마치고 자사 데이터를 포함하여 최종 등록합니다.")
def finalRegister(body: FinalRegisterBody):
    return finalRegisterProcess(body.dict())


@router.post("/draft",
    summary="원자재 임시 저장",
    description="협력사가 작성 중인 원자재 데이터를 임시 저장합니다.")
def saveDraft(body: SaveDraftBody):
    return saveDraftProcess(body.dict())


@router.get("/draft/{requestId}/{partnerId}",
    summary="임시 저장 데이터 조회",
    description="특정 요청에 대한 임시 저장 스냅샷을 불러옵니다.")
def getDraft(requestId: str, partnerId: str):
    return getDraftProcess(requestId, partnerId)


@router.get("/tree/{oemPoId}",
    summary="원청사 PO 기준 공급망 트리 조회",
    description="원청사 PO ID 기준으로 1~3차 전체 요청 체인을 트리로 조회합니다.")
def getWorkflowTree(oemPoId: str):
    return getWorkflowTreeProcess(oemPoId)


@router.get("/subpartners/{parentId}",
    summary="직속 하위 협력사 목록 조회",
    description="로그인 기업(parentId)의 COMPANY.parent_id 와 일치하는 직속 하위 협력사만 반환")
def getSubPartners(parentId: str):
    return getSubPartnersProcess(parentId)


@router.post("/cancel-approval",
    summary="승인 취소 (1차)",
    description="제출/최종 처리한 본인 요청을 IN_PROGRESS 로 롤백해 재수정 가능하게 함")
def cancelApproval(body: CancelApprovalBody):
    return cancelApprovalProcess(body.dict())


@router.post("/request-rollback",
    summary="반려 요청 (2·3차)",
    description="SUBMITTED 상태인 본인 제출을 회수(IN_PROGRESS)하고 상위에 알림")
def requestRollback(body: RequestRollbackBody):
    return requestRollbackProcess(body.dict())