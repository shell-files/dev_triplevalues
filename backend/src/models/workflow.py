# src/models/workflow.py
# ────────────────────────────────────────────────────────
# [v1.0] 공급망 맵 워크플로우 비즈니스 로직
# ────────────────────────────────────────────────────────

import json
from uuid import uuid4
from datetime import datetime
from src.utils.db import findOne, findAll, save
from src.models.model import responseModel

# ════════════════════════════════════════════════════════════
# 상태 상수
# ════════════════════════════════════════════════════════════
STATUS_REQUESTED = "REQUESTED"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_SUBMITTED = "SUBMITTED"
STATUS_APPROVED = "APPROVED"
STATUS_REJECTED = "REJECTED"
STATUS_FINAL = "FINAL"

# 차수별 허용 권한 매핑
TIER_PERMISSIONS = {
    0: {"can_request": True, "can_approve": False, "can_reject": False, "can_submit": False, "can_final": False},
    1: {"can_request": True, "can_approve": True, "can_reject": True, "can_submit": False, "can_final": True},
    2: {"can_request": True, "can_approve": True, "can_reject": True, "can_submit": True, "can_final": False},
    3: {"can_request": False, "can_approve": False, "can_reject": False, "can_submit": True, "can_final": False},
}


def _generateRequestId():
    """요청 고유 코드 생성"""
    return f"REQ-{uuid4().hex[:12].upper()}"


def _checkPermission(tier, action):
    """차수별 권한 검증"""
    perms = TIER_PERMISSIONS.get(tier)
    if not perms:
        return False
    return perms.get(action, False)


def _createAlarm(partnerId, title, content, reqType="INSPECT", level="info", metaJson=None):
    """알림 생성"""
    try:
        save("""
            INSERT INTO `ALARM` (partner_id, type, level, title, content, meta_json)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (partnerId, reqType, level, title, content, json.dumps(metaJson) if metaJson else None))
    except Exception:
        pass


# ════════════════════════════════════════════════════════════
# 1. 원자재 요청 생성 (Top-Down)
# ════════════════════════════════════════════════════════════
def createRequestProcess(data: dict) -> dict:
    """원청사/1차/2차가 하위 협력사에 원자재 데이터 작성 요청"""
    try:
        requesterTier = data["requesterTier"]

        # 권한 검증: 원청사(0), 1차(1), 2차(2)만 요청 가능
        if not _checkPermission(requesterTier, "can_request"):
            return responseModel(False, f"{requesterTier}차 협력사는 요청 권한이 없습니다.")

        # 요청자-수신자 차수 검증 (요청자 차수 < 수신자 차수)
        if data["requesterTier"] >= data["receiverTier"]:
            return responseModel(False, "상위 차수에서 하위 차수로만 요청할 수 있습니다.")

        requestId = _generateRequestId()
        reqType = data.get("requestType", "NORMAL")

        save("""
            INSERT INTO `MATERIAL_REQUEST`
            (request_id, oem_po_id, bom_id, requester_id, requester_tier,
             receiver_id, receiver_tier, request_type, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            requestId, data["oemPoId"], data["bomId"],
            data["requesterId"], requesterTier,
            data["receiverId"], data["receiverTier"],
            reqType, STATUS_REQUESTED,
        ))

        # 수신자에게 알림 발송
        alarmType = "URGENT" if reqType == "URGENT" else "INSPECT"
        alarmLevel = "fail" if reqType == "URGENT" else "info"
        _createAlarm(
            data["receiverId"],
            f"{'긴급 ' if reqType == 'URGENT' else ''}원자재 정보 요청",
            f"{data['requesterId']}에서 원자재 데이터 작성을 요청했습니다.",
            reqType=alarmType, level=alarmLevel,
            metaJson={"requestId": requestId, "oemPoId": data["oemPoId"]},
        )

        return responseModel(True, "요청이 발송되었습니다.", {
            "requestId": requestId,
            "oemPoId": data["oemPoId"],
            "status": STATUS_REQUESTED,
        })
    except Exception as e:
        return responseModel(False, f"요청 생성 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 2. 요청 상세 조회
# ════════════════════════════════════════════════════════════
def getRequestDetailProcess(requestId: str) -> dict:
    """특정 요청의 상세 정보 + 하위 체인 조회"""
    try:
        req = findOne("""
            SELECT mr.*, c1.company_name AS requester_name, c2.company_name AS receiver_name
            FROM MATERIAL_REQUEST mr
            LEFT JOIN COMPANY c1 ON mr.requester_id = c1.partner_id
            LEFT JOIN COMPANY c2 ON mr.receiver_id = c2.partner_id
            WHERE mr.request_id = ? AND mr.delete_yn = 0
        """, (requestId,))

        if not req:
            return responseModel(False, "요청을 찾을 수 없습니다.")

        # 같은 oem_po_id로 연결된 하위 요청 체인 조회
        chain = findAll("""
            SELECT mr.request_id, mr.requester_id, mr.requester_tier,
                   mr.receiver_id, mr.receiver_tier, mr.status, mr.request_type,
                   c.company_name AS receiver_name
            FROM MATERIAL_REQUEST mr
            LEFT JOIN COMPANY c ON mr.receiver_id = c.partner_id
            WHERE mr.oem_po_id = ? AND mr.delete_yn = 0
            ORDER BY mr.requester_tier, mr.created_at
        """, (req["oem_po_id"],)) or []

        # 임시 저장 데이터 확인
        draft = findOne("""
            SELECT * FROM MATERIAL_DRAFT
            WHERE request_id = ? AND partner_id = ? AND delete_yn = 0
            ORDER BY updated_at DESC LIMIT 1
        """, (requestId, req["receiver_id"]))

        return responseModel(True, "요청 상세 조회 성공", {
            "request": {
                "requestId": req["request_id"],
                "oemPoId": req["oem_po_id"],
                "bomId": req["bom_id"],
                "requesterId": req["requester_id"],
                "requesterName": req.get("requester_name", ""),
                "requesterTier": req["requester_tier"],
                "receiverId": req["receiver_id"],
                "receiverName": req.get("receiver_name", ""),
                "receiverTier": req["receiver_tier"],
                "requestType": req["request_type"],
                "status": req["status"],
                "rejectReason": req.get("reject_reason"),
                "createdAt": str(req["created_at"])[:19] if req.get("created_at") else "",
            },
            "chain": [{
                "requestId": c["request_id"],
                "requesterId": c["requester_id"],
                "requesterTier": c["requester_tier"],
                "receiverId": c["receiver_id"],
                "receiverName": c.get("receiver_name", ""),
                "receiverTier": c["receiver_tier"],
                "status": c["status"],
                "requestType": c["request_type"],
            } for c in chain],
            "draft": {
                "rawName": draft.get("raw_name", ""),
                "width": float(draft["width"]) if draft and draft.get("width") else None,
                "length": float(draft["length"]) if draft and draft.get("length") else None,
                "weightKg": float(draft["weight_kg"]) if draft and draft.get("weight_kg") else None,
                "components": draft.get("components", ""),
                "origin": draft.get("origin", ""),
                "draftJson": json.loads(draft["draft_json"]) if draft and draft.get("draft_json") else None,
            } if draft else None,
        })
    except Exception as e:
        return responseModel(False, f"조회 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 3. 기업별 요청 목록 조회
# ════════════════════════════════════════════════════════════
def getRequestsByPartnerProcess(partnerId: str, role: str = "all") -> dict:
    """기업이 발송/수신한 모든 요청 목록"""
    try:
        if role == "sent":
            whereClause = "mr.requester_id = ?"
        elif role == "received":
            whereClause = "mr.receiver_id = ?"
        else:
            whereClause = "(mr.requester_id = ? OR mr.receiver_id = ?)"

        params = (partnerId,) if role != "all" else (partnerId, partnerId)

        rows = findAll(f"""
            SELECT mr.*, c1.company_name AS requester_name,
                   c2.company_name AS receiver_name
            FROM MATERIAL_REQUEST mr
            LEFT JOIN COMPANY c1 ON mr.requester_id = c1.partner_id
            LEFT JOIN COMPANY c2 ON mr.receiver_id = c2.partner_id
            WHERE {whereClause} AND mr.delete_yn = 0
            ORDER BY mr.created_at DESC
        """, params) or []

        return responseModel(True, "요청 목록 조회 성공", {
            "requests": [{
                "requestId": r["request_id"],
                "oemPoId": r["oem_po_id"],
                "bomId": r["bom_id"],
                "requesterId": r["requester_id"],
                "requesterName": r.get("requester_name", ""),
                "requesterTier": r["requester_tier"],
                "receiverId": r["receiver_id"],
                "receiverName": r.get("receiver_name", ""),
                "receiverTier": r["receiver_tier"],
                "requestType": r["request_type"],
                "status": r["status"],
                "createdAt": str(r["created_at"])[:19] if r.get("created_at") else "",
            } for r in rows],
            "total": len(rows),
        })
    except Exception as e:
        return responseModel(False, f"목록 조회 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 4. 하위 데이터 승인 (1차/2차만 가능)
# ════════════════════════════════════════════════════════════
def approveRequestProcess(data: dict) -> dict:
    """상위 협력사가 하위 협력사의 제출 데이터를 승인"""
    try:
        tier = data["partnerTier"]
        if not _checkPermission(tier, "can_approve"):
            return responseModel(False, f"{tier}차는 승인 권한이 없습니다.")

        req = findOne("""
            SELECT * FROM MATERIAL_REQUEST
            WHERE request_id = ? AND requester_id = ? AND delete_yn = 0
        """, (data["requestId"], data["partnerId"]))

        if not req:
            return responseModel(False, "해당 요청을 찾을 수 없거나 권한이 없습니다.")

        if req["status"] != STATUS_SUBMITTED:
            return responseModel(False, f"현재 상태({req['status']})에서는 승인할 수 없습니다. SUBMITTED 상태만 승인 가능합니다.")

        save("""
            UPDATE MATERIAL_REQUEST SET status = ?, updated_at = NOW()
            WHERE request_id = ? AND delete_yn = 0
        """, (STATUS_APPROVED, data["requestId"]))

        # 하위 협력사에 승인 알림
        _createAlarm(
            req["receiver_id"],
            "원자재 데이터 승인 완료",
            f"{data['partnerId']}에서 제출하신 원자재 데이터를 승인했습니다.",
            metaJson={"requestId": data["requestId"]},
        )

        return responseModel(True, "승인이 완료되었습니다.", {"requestId": data["requestId"], "status": STATUS_APPROVED})
    except Exception as e:
        return responseModel(False, f"승인 처리 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 5. 하위 데이터 반려 (1차/2차만 가능)
# ════════════════════════════════════════════════════════════
def rejectRequestProcess(data: dict) -> dict:
    """상위 협력사가 하위 협력사의 제출 데이터를 반려"""
    try:
        tier = data["partnerTier"]
        if not _checkPermission(tier, "can_reject"):
            return responseModel(False, f"{tier}차는 반려 권한이 없습니다.")

        req = findOne("""
            SELECT * FROM MATERIAL_REQUEST
            WHERE request_id = ? AND requester_id = ? AND delete_yn = 0
        """, (data["requestId"], data["partnerId"]))

        if not req:
            return responseModel(False, "해당 요청을 찾을 수 없거나 권한이 없습니다.")

        if req["status"] != STATUS_SUBMITTED:
            return responseModel(False, f"현재 상태({req['status']})에서는 반려할 수 없습니다.")

        save("""
            UPDATE MATERIAL_REQUEST
            SET status = ?, reject_reason = ?, updated_at = NOW()
            WHERE request_id = ? AND delete_yn = 0
        """, (STATUS_REJECTED, data["reason"], data["requestId"]))

        # 하위 협력사 원자재 상태 DRAFT로 복원
        save("""
            UPDATE RAW_MATERIAL rm
            INNER JOIN MATERIAL_REQUEST mr ON rm.partner_id = mr.receiver_id
            SET rm.status = 'DRAFT'
            WHERE mr.request_id = ? AND rm.delete_yn = 0
        """, (data["requestId"],))

        # 하위 협력사에 반려 알림
        _createAlarm(
            req["receiver_id"],
            "원자재 데이터 반려",
            f"반려 사유: {data['reason']}",
            reqType="INSPECT", level="warn",
            metaJson={"requestId": data["requestId"], "reason": data["reason"]},
        )

        return responseModel(True, "반려 처리가 완료되었습니다.", {"requestId": data["requestId"], "status": STATUS_REJECTED})
    except Exception as e:
        return responseModel(False, f"반려 처리 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 6. 상위 방향 승인 요청 (2차/3차 → 상위)
# ════════════════════════════════════════════════════════════
def submitToUpperProcess(data: dict) -> dict:
    """하위 협력사가 자사 데이터를 상위 협력사에 제출"""
    try:
        tier = data["partnerTier"]
        if not _checkPermission(tier, "can_submit"):
            return responseModel(False, f"{tier}차는 상위 제출 권한이 없습니다.")

        req = findOne("""
            SELECT * FROM MATERIAL_REQUEST
            WHERE request_id = ? AND receiver_id = ? AND delete_yn = 0
        """, (data["requestId"], data["partnerId"]))

        if not req:
            return responseModel(False, "해당 요청을 찾을 수 없거나 권한이 없습니다.")

        if req["status"] not in [STATUS_REQUESTED, STATUS_IN_PROGRESS, STATUS_REJECTED]:
            return responseModel(False, f"현재 상태({req['status']})에서는 제출할 수 없습니다.")

        save("""
            UPDATE MATERIAL_REQUEST SET status = ?, updated_at = NOW()
            WHERE request_id = ? AND delete_yn = 0
        """, (STATUS_SUBMITTED, data["requestId"]))

        # 원자재 상태도 REQUESTED로 변경
        save("""
            UPDATE RAW_MATERIAL SET status = 'REQUESTED', requested_at = NOW()
            WHERE partner_id = ? AND delete_yn = 0
            ORDER BY created_at DESC LIMIT 1
        """, (data["partnerId"],))

        # 상위 협력사에 알림
        _createAlarm(
            req["requester_id"],
            "하위 협력사 원자재 데이터 제출",
            f"{data['partnerId']}에서 원자재 데이터 검토를 요청했습니다.",
            metaJson={"requestId": data["requestId"]},
        )

        return responseModel(True, "상위 협력사에 제출되었습니다.", {"requestId": data["requestId"], "status": STATUS_SUBMITTED})
    except Exception as e:
        return responseModel(False, f"제출 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 7. 1차 협력사 최종 등록
# ════════════════════════════════════════════════════════════
def finalRegisterProcess(data: dict) -> dict:
    """1차 협력사가 모든 하위 검증 후 자사 데이터 포함하여 최종 등록"""
    try:
        req = findOne("""
            SELECT * FROM MATERIAL_REQUEST
            WHERE request_id = ? AND receiver_id = ? AND delete_yn = 0
        """, (data["requestId"], data["partnerId"]))

        if not req:
            return responseModel(False, "해당 요청을 찾을 수 없거나 권한이 없습니다.")

        # 하위 요청이 모두 APPROVED인지 확인
        pendingSub = findOne("""
            SELECT COUNT(*) AS cnt FROM MATERIAL_REQUEST
            WHERE oem_po_id = ? AND requester_id = ? AND status != ? AND delete_yn = 0
        """, (req["oem_po_id"], data["partnerId"], STATUS_APPROVED))

        if pendingSub and pendingSub["cnt"] > 0:
            return responseModel(False, f"하위 협력사 중 미승인 건이 {pendingSub['cnt']}건 있습니다. 모든 하위 데이터 승인 후 최종 등록이 가능합니다.")

        # 1차 협력사 원자재 데이터 INSERT (또는 임시 저장 데이터 활용)
        draft = findOne("""
            SELECT * FROM MATERIAL_DRAFT
            WHERE request_id = ? AND partner_id = ? AND delete_yn = 0
            ORDER BY updated_at DESC LIMIT 1
        """, (data["requestId"], data["partnerId"]))

        rawName = data.get("rawName") or (draft.get("raw_name") if draft else "")
        width = data.get("width") or (float(draft["width"]) if draft and draft.get("width") else None)
        length = data.get("length") or (float(draft["length"]) if draft and draft.get("length") else None)
        weightKg = data.get("weightKg") or (float(draft["weight_kg"]) if draft and draft.get("weight_kg") else None)
        components = data.get("components") or (draft.get("components") if draft else "")
        origin = data.get("origin") or (draft.get("origin") if draft else "")

        if not rawName:
            return responseModel(False, "원자재명은 필수입니다.")

        # RAW_MATERIAL 등록
        rawId = f"RM-{uuid4().hex[:8].upper()}"
        save("""
            INSERT INTO RAW_MATERIAL (raw_id, partner_id, name, width, length, weight_kg, components, origin, status, approved_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', NOW())
        """, (rawId, data["partnerId"], rawName, width, length, weightKg, components, origin))

        # BOM_TIER_TREE에 1차 노드 추가 (원청사 PO ID 기준)
        save("""
            INSERT INTO BOM_TIER_TREE (bom_id, tier, partner_id, raw_id, po_id, item_name, qty_kg, sort_order)
            VALUES (?, 1, ?, ?, ?, ?, ?, 1)
        """, (req["bom_id"], data["partnerId"], rawId, req["oem_po_id"], rawName, weightKg or 0))

        # 요청 상태 FINAL로 변경
        save("""
            UPDATE MATERIAL_REQUEST SET status = ?, updated_at = NOW()
            WHERE request_id = ? AND delete_yn = 0
        """, (STATUS_FINAL, data["requestId"]))

        # 원청사에 알림
        oemReq = findOne("""
            SELECT requester_id FROM MATERIAL_REQUEST
            WHERE oem_po_id = ? AND requester_tier = 0 AND delete_yn = 0 LIMIT 1
        """, (req["oem_po_id"],))

        if oemReq:
            _createAlarm(
                oemReq["requester_id"],
                "공급망 데이터 최종 등록 완료",
                f"1차 협력사 {data['partnerId']}가 원자재 데이터를 최종 등록했습니다.",
                metaJson={"requestId": data["requestId"], "oemPoId": req["oem_po_id"]},
            )

        return responseModel(True, "최종 등록이 완료되었습니다.", {
            "requestId": data["requestId"],
            "rawId": rawId,
            "oemPoId": req["oem_po_id"],
            "status": STATUS_FINAL,
        })
    except Exception as e:
        return responseModel(False, f"최종 등록 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 8. 임시 저장
# ════════════════════════════════════════════════════════════
def saveDraftProcess(data: dict) -> dict:
    """협력사가 작성 중인 원자재 데이터를 임시 저장"""
    try:
        existing = findOne("""
            SELECT id FROM MATERIAL_DRAFT
            WHERE request_id = ? AND partner_id = ? AND delete_yn = 0
        """, (data["requestId"], data["partnerId"]))

        draftJsonStr = json.dumps(data.get("draftJson")) if data.get("draftJson") else None

        if existing:
            save("""
                UPDATE MATERIAL_DRAFT
                SET raw_name = ?, width = ?, length = ?, weight_kg = ?,
                    components = ?, origin = ?, draft_json = ?, updated_at = NOW()
                WHERE id = ?
            """, (
                data.get("rawName"), data.get("width"), data.get("length"),
                data.get("weightKg"), data.get("components"), data.get("origin"),
                draftJsonStr, existing["id"],
            ))
        else:
            save("""
                INSERT INTO MATERIAL_DRAFT
                (request_id, partner_id, raw_name, width, length, weight_kg, components, origin, draft_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data["requestId"], data["partnerId"],
                data.get("rawName"), data.get("width"), data.get("length"),
                data.get("weightKg"), data.get("components"), data.get("origin"),
                draftJsonStr,
            ))

        # 요청 상태 IN_PROGRESS로 변경
        save("""
            UPDATE MATERIAL_REQUEST SET status = ?
            WHERE request_id = ? AND receiver_id = ? AND status = ? AND delete_yn = 0
        """, (STATUS_IN_PROGRESS, data["requestId"], data["partnerId"], STATUS_REQUESTED))

        return responseModel(True, "임시 저장되었습니다.", {"requestId": data["requestId"]})
    except Exception as e:
        return responseModel(False, f"임시 저장 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 9. 임시 저장 데이터 조회
# ════════════════════════════════════════════════════════════
def getDraftProcess(requestId: str, partnerId: str) -> dict:
    """특정 요청에 대한 임시 저장 스냅샷 조회"""
    try:
        draft = findOne("""
            SELECT * FROM MATERIAL_DRAFT
            WHERE request_id = ? AND partner_id = ? AND delete_yn = 0
            ORDER BY updated_at DESC LIMIT 1
        """, (requestId, partnerId))

        if not draft:
            return responseModel(True, "임시 저장 데이터가 없습니다.", {"draft": None})

        return responseModel(True, "임시 저장 데이터 조회 성공", {
            "draft": {
                "rawName": draft.get("raw_name", ""),
                "width": float(draft["width"]) if draft.get("width") else None,
                "length": float(draft["length"]) if draft.get("length") else None,
                "weightKg": float(draft["weight_kg"]) if draft.get("weight_kg") else None,
                "components": draft.get("components", ""),
                "origin": draft.get("origin", ""),
                "draftJson": json.loads(draft["draft_json"]) if draft.get("draft_json") else None,
                "updatedAt": str(draft["updated_at"])[:19] if draft.get("updated_at") else "",
            }
        })
    except Exception as e:
        return responseModel(False, f"임시 저장 조회 실패: {str(e)}")


# ════════════════════════════════════════════════════════════
# 10. 원청사 PO 기준 공급망 트리 조회
# ════════════════════════════════════════════════════════════
def getWorkflowTreeProcess(oemPoId: str) -> dict:
    """원청사 PO ID 기준으로 1~3차 전체 요청 체인을 트리로 조회"""
    try:
        rows = findAll("""
            SELECT mr.request_id, mr.oem_po_id, mr.bom_id,
                   mr.requester_id, mr.requester_tier,
                   mr.receiver_id, mr.receiver_tier,
                   mr.request_type, mr.status, mr.reject_reason,
                   c1.company_name AS requester_name, c1.short_name AS requester_short,
                   c2.company_name AS receiver_name, c2.short_name AS receiver_short,
                   mr.created_at
            FROM MATERIAL_REQUEST mr
            LEFT JOIN COMPANY c1 ON mr.requester_id = c1.partner_id
            LEFT JOIN COMPANY c2 ON mr.receiver_id = c2.partner_id
            WHERE mr.oem_po_id = ? AND mr.delete_yn = 0
            ORDER BY mr.requester_tier, mr.created_at
        """, (oemPoId,)) or []

        tree = []
        for r in rows:
            tree.append({
                "requestId": r["request_id"],
                "oemPoId": r["oem_po_id"],
                "bomId": r["bom_id"],
                "requesterId": r["requester_id"],
                "requesterName": r.get("requester_name") or r.get("requester_short", ""),
                "requesterTier": r["requester_tier"],
                "receiverId": r["receiver_id"],
                "receiverName": r.get("receiver_name") or r.get("receiver_short", ""),
                "receiverTier": r["receiver_tier"],
                "requestType": r["request_type"],
                "status": r["status"],
                "rejectReason": r.get("reject_reason"),
                "createdAt": str(r["created_at"])[:19] if r.get("created_at") else "",
            })

        return responseModel(True, "공급망 트리 조회 성공", {
            "oemPoId": oemPoId,
            "tree": tree,
            "total": len(tree),
        })
    except Exception as e:
        return responseModel(False, f"트리 조회 실패: {str(e)}")
