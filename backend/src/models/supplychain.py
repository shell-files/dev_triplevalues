# src/models/supplychain.py
# ────────────────────────────────────────────────────────
# [v3.0] 2026-06-12 — BE에서 노드별 상세 데이터 완성 전달 (FE 변환 불필요)
# ────────────────────────────────────────────────────────

import json, re
from src.utils.db import findOne, findAll, save
from src.models.model import responseModel


def getProductListProcess() -> dict:
    rows = findAll("""
        SELECT b.id, b.bom_id, b.category, b.product, b.item_no, b.item_name,
               b.qty, b.unit, b.weight_g, b.supplier_id, b.components, b.status, b.created_at,
               (SELECT COUNT(*) FROM BOM_TIER_TREE bt WHERE bt.bom_id = b.bom_id) AS tree_count
        FROM BOM b WHERE b.delete_yn = 0 ORDER BY b.created_at DESC
    """, ()) or []
    return responseModel(True, "", {"products": [{
        "id": r["bom_id"], "name": r["product"],
        "detailName": r["item_name"] or r["product"],
        "category": r["category"] or "", "itemNo": r["item_no"] or "",
        "qty": str(r["qty"] or ""), "unit": r["unit"] or "",
        "weightG": float(r["weight_g"] or 0),
        "components": r["components"] or "",
        "partners": f"{r['tree_count'] or 0}개사",
        "status": r["status"] or "ACTIVE",
        "supplierId": r["supplier_id"] or "",
    } for r in rows]})


def getProductDetailProcess(productId: str) -> dict:
    bom = findOne("SELECT * FROM BOM WHERE bom_id = ? AND delete_yn = 0 LIMIT 1", (productId,))
    if not bom:
        return responseModel(False, "제품을 찾을 수 없습니다.")

    bomTree = findAll("""
        SELECT id, bom_id, tier, short_name, item_name, qty_kg, sort_order
        FROM BOM_TIER_TREE WHERE bom_id = ? ORDER BY tier, sort_order
    """, (productId,)) or []

    materials = findAll("""
        SELECT rm.*, c.company_name, c.tier AS company_tier, c.tier_label
        FROM RAW_MATERIAL rm LEFT JOIN COMPANY c ON rm.partner_id = c.partner_id
        WHERE rm.delete_yn = 0 ORDER BY rm.created_at DESC
    """, ()) or []

    rmTrees = findAll("""
        SELECT id, raw_id, tier, short_name, item_name, comp, qty_kg, sort_order
        FROM RM_TIER_TREE ORDER BY raw_id, tier, sort_order
    """, ()) or []

    orders = findAll("""
        SELECT po.po_id, po.partner_id, po.product, po.qty, po.unit_price,
               po.total, po.delivery, po.status, c.company_name
        FROM PURCHASE_ORDER po LEFT JOIN COMPANY c ON po.partner_id = c.partner_id
        WHERE po.delete_yn = 0 ORDER BY po.created_at DESC
    """, ()) or []

    approvals = findAll("""
        SELECT approval_id, raw_material_id, request_type, requester_partner,
               approver_partner, request_title, request_content,
               approval_yn, approval_reason, status, deadline, created_at
        FROM RM_APPROVAL WHERE delete_yn = 0 ORDER BY created_at DESC
    """, ()) or []

    # ── [v3.0] BE에서 노드별 상세 데이터 완성 ──
    nodeDetails = {}
    allNodes = {bt["short_name"]: bt for bt in bomTree}
    for rt in rmTrees:
        if rt["short_name"] not in allNodes:
            allNodes[rt["short_name"]] = rt

    for name, node in allNodes.items():
        rmRow = next((rm for rm in materials if rm.get("company_name") and name in rm["company_name"]), None)
        rmTree = next((rt for rt in rmTrees if rt["short_name"] == name), None)
        compStr = (rmRow or {}).get("components", "") or (rmTree or {}).get("comp", "") or ""
        chem = _parseChem(compStr)

        nodeDetails[name] = {
            "title": name,
            "partNo": node.get("item_name") or bom.get("item_no") or "-",
            "part": node.get("item_name") or bom.get("item_name") or "-",
            "weight": f"{node.get('qty_kg', 0)} kg" if node.get("qty_kg") else (f"{rmRow['weight_kg']} kg" if rmRow and rmRow.get("weight_kg") else "-"),
            "qty": f"{bom['qty']} {bom.get('unit', '')}" if bom.get("qty") else "-",
            "leadtime": f"{bom['lead_time']} 일" if bom.get("lead_time") else "-",
            "spec": rmRow["name"] if rmRow else (rmTree["item_name"] if rmTree else "-"),
            "origin": rmRow["origin"] if rmRow and rmRow.get("origin") else "-",
            "dim": _buildDim(rmRow) if rmRow else "-",
            "chem": chem,
        }

    requests = [{
        "category": "긴급 규제 실사" if ra["request_type"] == "URGENT" else "정기 실사",
        "company": ra.get("requester_partner", "-"),
        "material": ra.get("raw_material_id", "-"),
        "date": str(ra["created_at"])[:10] if ra.get("created_at") else "-",
        "status": {"APPROVED": "승인 완료", "REJECTED": "반려", "PENDING": "대기 중"}.get(ra.get("status", ""), ra.get("status", "-")),
    } for ra in approvals]

    return responseModel(True, "", {
        "bom": {
            "bomId": bom["bom_id"], "product": bom["product"],
            "itemNo": bom.get("item_no", ""), "itemName": bom.get("item_name", ""),
            "qty": str(bom.get("qty", "")), "unit": bom.get("unit", ""),
            "weightG": float(bom.get("weight_g", 0) or 0),
            "status": bom.get("status", "ACTIVE"),
        },
        "bomTree": bomTree,
        "nodeDetails": nodeDetails,
        "materials": materials,
        "rmTrees": rmTrees,
        "orders": orders,
        "requests": requests,
    })


def getSupplyChainTreeProcess(rawId: str) -> dict:
    rows = findAll("""
        SELECT rt.*, rm.name AS raw_name, rm.origin, rm.components AS raw_components
        FROM RM_TIER_TREE rt LEFT JOIN RAW_MATERIAL rm ON rt.raw_id = rm.raw_id
        WHERE rt.raw_id = ? ORDER BY rt.tier, rt.sort_order
    """, (rawId,)) or []
    return responseModel(True, "", {"tree": rows})


def sendRequestProcess(payload: dict) -> dict:
    try:
        senderId = payload.get("senderPartnerId", "")
        targetIds = payload.get("targetPartnerIds", [])
        title = payload.get("title", "")
        content = payload.get("content", "")
        requestType = payload.get("requestType", "NORMAL")
        rawId = payload.get("rawId", "")
        deadline = payload.get("deadline")

        if not senderId or not targetIds:
            return responseModel(False, "발송자 또는 대상 협력사가 지정되지 않았습니다.")

        sender = findOne("SELECT company_name FROM COMPANY WHERE partner_id = ? AND delete_yn = 0", (senderId,))
        senderName = sender["company_name"] if sender else senderId

        for tid in targetIds:
            save("INSERT INTO RM_APPROVAL (raw_material_id,request_type,requester_partner,approver_partner,request_title,request_content,deadline,status) VALUES (?,?,?,?,?,?,?,'PENDING')",
                 (rawId or "PENDING", requestType, senderId, tid,
                  title or f"[{senderName}] 공급망 데이터 제출 요청",
                  content or "원자재 정보 및 ESG 지표 입력을 요청합니다.", deadline))
            save("INSERT INTO ALARM (partner_id,type,level,title,content,path,meta_json) VALUES (?,'REQUEST',?,?,?,'/partner/request',?)",
                 (tid, "warn" if requestType == "URGENT" else "info",
                  title or f"[{senderName}] 공급망 데이터 제출 요청",
                  content or "원자재 정보 및 ESG 지표 입력을 요청합니다.",
                  json.dumps({"senderId": senderId, "rawId": rawId}, ensure_ascii=False)))

        return responseModel(True, f"{len(targetIds)}개 협력사에 요청 발송 완료", {"sentCount": len(targetIds)})
    except Exception as e:
        return responseModel(False, f"요청 발송 중 오류: {str(e)}")


def approveProcess(payload: dict) -> dict:
    try:
        approverId = payload.get("approverPartnerId", "")
        approvalId = payload.get("approvalId")
        comment = payload.get("comment", "")
        if not approvalId:
            return responseModel(False, "승인 대상이 지정되지 않았습니다.")

        save("UPDATE RM_APPROVAL SET approval_yn='Y',approval_reason=?,approver_partner=?,approval_dt=NOW(),status='APPROVED' WHERE approval_id=? AND delete_yn=0",
             (comment, approverId, approvalId))

        approval = findOne("SELECT * FROM RM_APPROVAL WHERE approval_id=?", (approvalId,))
        if approval:
            if approval.get("raw_material_id"):
                save("UPDATE RAW_MATERIAL SET status='APPROVED',approved_at=NOW() WHERE raw_id=?", (approval["raw_material_id"],))
            requester = approval.get("requester_partner", "")
            aRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id=?", (approverId,))
            aName = aRow["company_name"] if aRow else approverId
            if requester:
                save("INSERT INTO ALARM (partner_id,type,level,title,content,path) VALUES (?,'APPROVE','info',?,?,'/partner/approve')",
                     (requester, f"[{aName}] 하위 공급망 데이터 승인 완료", comment or "하위 공급망 데이터 검증 완료"))

        return responseModel(True, "승인 완료", {"approvalId": approvalId})
    except Exception as e:
        return responseModel(False, f"승인 오류: {str(e)}")


def rejectProcess(payload: dict) -> dict:
    try:
        rejecterId = payload.get("rejecterPartnerId", "")
        approvalId = payload.get("approvalId")
        reason = payload.get("reason", "")
        if not approvalId:
            return responseModel(False, "반려 대상이 지정되지 않았습니다.")

        save("UPDATE RM_APPROVAL SET approval_yn='N',approval_reason=?,approver_partner=?,approval_dt=NOW(),status='REJECTED' WHERE approval_id=? AND delete_yn=0",
             (reason, rejecterId, approvalId))

        approval = findOne("SELECT * FROM RM_APPROVAL WHERE approval_id=?", (approvalId,))
        if approval:
            if approval.get("raw_material_id"):
                save("UPDATE RAW_MATERIAL SET status='DRAFT' WHERE raw_id=?", (approval["raw_material_id"],))
            targetId = approval.get("requester_partner", "")
            rRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id=?", (rejecterId,))
            rName = rRow["company_name"] if rRow else rejecterId
            if targetId:
                save("INSERT INTO ALARM (partner_id,type,level,title,content,path) VALUES (?,'URGENT','warn',?,?,'/partner/request')",
                     (targetId, f"[{rName}] 데이터 반려 — 재제출 요청", f"반려 사유: {reason}"))

        return responseModel(True, "반려 완료", {"approvalId": approvalId})
    except Exception as e:
        return responseModel(False, f"반려 오류: {str(e)}")


# ── 내부 헬퍼 ──
def _parseChem(compStr: str) -> dict:
    result = {"mn": 0, "cu": 0, "si": 0, "fe": 0, "al": 0}
    for m in re.finditer(r'(Al|Mn|Cu|Si|Fe)\s*([\d.]+)', compStr, re.IGNORECASE):
        key = m.group(1).lower()
        if key in result:
            result[key] = float(m.group(2))
    return result

def _buildDim(rm: dict) -> str:
    parts = []
    if rm.get("width"): parts.append(f"{rm['width']}mm")
    if rm.get("length"): parts.append(f"{rm['length']}mm")
    if rm.get("diameter_mm"): parts.append(f"Ø{rm['diameter_mm']}mm")
    return " × ".join(parts) if parts else "-"