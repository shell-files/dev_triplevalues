# src/models/supplychain.py
# ────────────────────────────────────────────────────────
# [v5.0] 2026-06-15 - 신규 PO 스키마 반영 (sender/receiver_company_id)
#   PURCHASE_ORDER: sender_company_id, receiver_company_id, raw_id
#   BOM_TIER_TREE: partner_id, raw_id, po_id
# ────────────────────────────────────────────────────────

import json, re
from src.utils.db import findOne, findAll, save
from src.models.model import responseModel


def getProductListProcess() -> dict:
    rows = findAll("""
        SELECT b.id, b.bom_id, b.category, b.product, b.item_no, b.item_name,
               b.qty, b.unit, b.weight_g, b.supplier_id, b.components, b.status,
               b.lead_time, b.price, b.created_at,
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
        "statusLabel": "긴급 요청" if r.get("status") == "EMERGENCY" else "일반 관제",
        "supplierId": r["supplier_id"] or "",
    } for r in rows]})


def getProductDetailProcess(productId: str) -> dict:
    bom = findOne("SELECT * FROM BOM WHERE bom_id = ? AND delete_yn = 0 LIMIT 1", (productId,))
    if not bom:
        return responseModel(False, "제품을 찾을 수 없습니다.")

    bomTree = findAll("""
        SELECT bt.id, bt.bom_id, bt.tier, bt.partner_id, bt.raw_id, bt.po_id,
               bt.item_name, bt.qty_kg, bt.sort_order,
               c.company_name, c.short_name, c.tier_label, c.country,
               c.scope1, c.scope2, c.feoc_ratio, c.trir, c.risk_level
        FROM BOM_TIER_TREE bt
        LEFT JOIN COMPANY c ON bt.partner_id = c.partner_id
        WHERE bt.bom_id = ? ORDER BY bt.tier, bt.sort_order
    """, (productId,)) or []

    materials = findAll("""
        SELECT rm.*
        FROM RAW_MATERIAL rm WHERE rm.delete_yn = 0 ORDER BY rm.created_at DESC
    """, ()) or []

    rmTrees = findAll("""
        SELECT id, raw_id, tier, short_name, item_name, comp, qty_kg, sort_order
        FROM RM_TIER_TREE ORDER BY raw_id, tier, sort_order
    """, ()) or []

    # PO: sender_company_id / receiver_company_id 기반
    orders = findAll("""
        SELECT po.id, po.po_id, po.sender_company_id, po.receiver_company_id,
               po.raw_id, po.qty, po.unit_price, po.total, po.delivery, po.status,
               cs.company_name AS sender_name,
               cr.company_name AS receiver_name
        FROM PURCHASE_ORDER po
        LEFT JOIN COMPANY cs ON po.sender_company_id = cs.partner_id
        LEFT JOIN COMPANY cr ON po.receiver_company_id = cr.partner_id
        WHERE po.delete_yn = 0 ORDER BY po.created_at DESC
    """, ()) or []

    approvals = findAll("""
        SELECT approval_id, raw_material_id, request_type, requester_partner,
               approver_partner, request_title, request_content,
               approval_yn, approval_reason, status, deadline, created_at
        FROM RM_APPROVAL WHERE delete_yn = 0 ORDER BY created_at DESC
    """, ()) or []

    # nodeDetails BE 완성
    nodeDetails = {}
    for bt in bomTree:
        name = bt.get("short_name") or bt.get("company_name") or ""
        pid = bt.get("partner_id") or ""
        rmRow = next((rm for rm in materials if rm["raw_id"] == bt.get("raw_id")), None)
        if not rmRow:
            rmRow = next((rm for rm in materials if rm.get("partner_id") == pid), None)
        rmTree = next((rt for rt in rmTrees if rt.get("short_name") and name and rt["short_name"] in name), None)
        compStr = (rmRow or {}).get("components", "") or (rmTree or {}).get("comp", "") or ""

        poRow = next((po for po in orders if po["po_id"] == bt.get("po_id")), None)

        nodeDetails[name] = {
            "title": name,
            "partnerId": pid,
            "tier": bt.get("tier", 0),
            "tierLabel": bt.get("tier_label", ""),
            "partNo": bt.get("item_name") or bom.get("item_no") or "-",
            "part": bt.get("item_name") or bom.get("item_name") or "-",
            "weight": f"{bt['qty_kg']} kg" if bt.get("qty_kg") else (f"{rmRow['weight_kg']} kg" if rmRow and rmRow.get("weight_kg") else "-"),
            "qty": f"{bom['qty']} {bom.get('unit', '')}" if bom.get("qty") else "-",
            "leadtime": f"{bom['lead_time']} 일" if bom.get("lead_time") else "-",
            "spec": rmRow["name"] if rmRow else (rmTree["item_name"] if rmTree else "-"),
            "origin": rmRow["origin"] if rmRow and rmRow.get("origin") else "-",
            "dim": _buildDim(rmRow) if rmRow else "-",
            "chem": _parseChem(compStr),
            "country": bt.get("country", ""),
            "feocRatio": float(bt.get("feoc_ratio") or 0),
            "trir": float(bt.get("trir") or 0),
            "riskLevel": bt.get("risk_level", ""),
            "poId": bt.get("po_id") or "",
            "poData": {
                "poId": poRow["po_id"],
                "qty": f"{float(poRow['qty'])} ton",
                "total": f"${float(poRow['total']):,.0f}",
                "delivery": str(poRow["delivery"]) if poRow.get("delivery") else "-",
                "sender": poRow.get("sender_name") or "-",
                "receiver": poRow.get("receiver_name") or "-",
                "status": poRow.get("status") or "-",
            } if poRow else None,
        }

    # FE 필드: req.item, req.partner, req.material, req.date, req.status, req.statusLabel
    statusMap = {"APPROVED": "completed", "REJECTED": "rejected", "PENDING": "checking"}
    statusLabelMap = {"APPROVED": "승인 완료", "REJECTED": "반려", "PENDING": "검토 진행 중"}
    requests = []
    for ra in approvals:
        rawStatus = ra.get("status", "PENDING")
        # requester 회사명 조회
        reqPartner = ra.get("requester_partner", "")
        partnerRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id = ?", (reqPartner,)) if reqPartner else None
        # approver 회사명 조회
        appPartner = ra.get("approver_partner", "")
        approverRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id = ?", (appPartner,)) if appPartner else None

        requests.append({
            "id": ra.get("approval_id", 0),
            "item": ra.get("request_type", "NORMAL"),
            "partner": approverRow["company_name"] if approverRow else (partnerRow["company_name"] if partnerRow else reqPartner),
            "material": ra.get("raw_material_id", "-"),
            "date": str(ra["created_at"])[:10] if ra.get("created_at") else "-",
            "status": statusMap.get(rawStatus, "checking"),
            "statusLabel": statusLabelMap.get(rawStatus, rawStatus),
        })

    # 버전 히스토리 데이터 (BOM 기반)
    versions = [{
        "version": f"v1.0",
        "label": f"v1.0 ({str(bom['created_at'])[:10]}부터) [최신]",
        "bomId": bom["bom_id"],
        "status": bom.get("status", "ACTIVE"),
        "createdAt": str(bom["created_at"])[:10] if bom.get("created_at") else "",
    }]

    return responseModel(True, "", {
        "bom": {
            "bomId": bom["bom_id"], "product": bom["product"],
            "itemNo": bom.get("item_no", ""), "itemName": bom.get("item_name", ""),
            "qty": str(bom.get("qty", "")), "unit": bom.get("unit", ""),
            "weightG": float(bom.get("weight_g", 0) or 0),
            "leadTime": bom.get("lead_time"), "price": str(bom.get("price", "") or ""),
            "components": bom.get("components", ""),
            "status": bom.get("status", "ACTIVE"),
            "createdAt": str(bom.get("created_at", ""))[:10],
        },
        "bomTree": [{
            "id": bt["id"], "bomId": bt["bom_id"], "tier": bt["tier"],
            "partnerId": bt.get("partner_id", ""), "rawId": bt.get("raw_id", ""),
            "poId": bt.get("po_id", ""),
            "shortName": bt.get("short_name") or bt.get("company_name") or "",
            "itemName": bt.get("item_name", ""), "qtyKg": float(bt.get("qty_kg") or 0),
            "companyName": bt.get("company_name", ""), "tierLabel": bt.get("tier_label", ""),
            "riskLevel": bt.get("risk_level", ""),
        } for bt in bomTree],
        "nodeDetails": nodeDetails,
        "materials": materials, "rmTrees": rmTrees,
        "orders": [{
            "poId": po["po_id"], "sender": po.get("sender_name", ""),
            "receiver": po.get("receiver_name", ""), "rawId": po.get("raw_id", ""),
            "qty": float(po.get("qty") or 0), "total": float(po.get("total") or 0),
            "delivery": str(po["delivery"]) if po.get("delivery") else "",
            "status": po.get("status", ""),
        } for po in orders],
        "requests": requests,
        "versions": versions,
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
        poId = payload.get("poId", "")
        deadline = payload.get("deadline")

        if not senderId or not targetIds:
            return responseModel(False, "발송자 또는 대상 협력사가 지정되지 않았습니다.")

        sender = findOne("SELECT company_name FROM COMPANY WHERE partner_id = ? AND delete_yn = 0", (senderId,))
        senderName = sender["company_name"] if sender else senderId

        for tid in targetIds:
            save("""INSERT INTO RM_APPROVAL (raw_material_id,request_type,requester_partner,approver_partner,request_title,request_content,deadline,status) VALUES (?,?,?,?,?,?,?,'PENDING')""",
                 (rawId or "PENDING", requestType, senderId, tid,
                  title or f"[{senderName}] 공급망 데이터 제출 요청",
                  content or "원자재 정보 및 ESG 지표 입력을 요청합니다.", deadline))
            save("""INSERT INTO ALARM (partner_id,type,level,title,content,path,meta_json) VALUES (?,'REQUEST',?,?,?,'/partner/request',?)""",
                 (tid, "warn" if requestType == "URGENT" else "info",
                  title or f"[{senderName}] 공급망 데이터 제출 요청",
                  content or "원자재 정보 및 ESG 지표 입력을 요청합니다.",
                  json.dumps({"senderId": senderId, "rawId": rawId, "poId": poId}, ensure_ascii=False)))

        return responseModel(True, f"{len(targetIds)}개 협력사에 요청 발송 완료", {"sentCount": len(targetIds)})
    except Exception as e:
        return responseModel(False, f"요청 발송 중 오류: {str(e)}")


def approveProcess(payload: dict) -> dict:
    try:
        approverId = payload.get("approverPartnerId", "")
        approvalId = payload.get("approvalId")
        comment = payload.get("comment", "")
        bomId = payload.get("bomId", "")

        if not approvalId:
            return responseModel(False, "승인 대상이 지정되지 않았습니다.")

        save("UPDATE RM_APPROVAL SET approval_yn='Y',approval_reason=?,approver_partner=?,approval_dt=NOW(),status='APPROVED' WHERE approval_id=? AND delete_yn=0",
             (comment, approverId, approvalId))

        approval = findOne("SELECT * FROM RM_APPROVAL WHERE approval_id=?", (approvalId,))
        if approval:
            rawId = approval.get("raw_material_id", "")
            if rawId and rawId != "PENDING":
                save("UPDATE RAW_MATERIAL SET status='APPROVED',approved_at=NOW() WHERE raw_id=?", (rawId,))

                if bomId:
                    aInfo = findOne("SELECT tier FROM COMPANY WHERE partner_id=? AND delete_yn=0", (approverId,))
                    tier = int(aInfo["tier"]) + 1 if aInfo else 1
                    rmRow = findOne("SELECT * FROM RAW_MATERIAL WHERE raw_id=?", (rawId,))
                    poId = ""
                    if rmRow and rmRow.get("partner_id"):
                        poRow = findOne("SELECT po_id FROM PURCHASE_ORDER WHERE raw_id=? AND receiver_company_id=? AND delete_yn=0 LIMIT 1",
                                       (rawId, rmRow["partner_id"]))
                        if poRow: poId = poRow["po_id"]

                    save("""INSERT INTO BOM_TIER_TREE (bom_id,tier,partner_id,raw_id,po_id,item_name,qty_kg) VALUES (?,?,?,?,?,?,?)""",
                         (bomId, tier, approverId, rawId, poId,
                          rmRow["name"] if rmRow else "", float(rmRow["weight_kg"]) if rmRow and rmRow.get("weight_kg") else 0))

            requester = approval.get("requester_partner", "")
            aRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id=?", (approverId,))
            aName = aRow["company_name"] if aRow else approverId
            if requester:
                save("INSERT INTO ALARM (partner_id,type,level,title,content,path) VALUES (?,'APPROVE','info',?,?,'/partner/approve')",
                     (requester, f"[{aName}] 하위 공급망 데이터 승인 완료", comment or "하위 공급망 데이터 검증 완료"))

        _recalcEsgWeightedSum(approverId)
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
            rawId = approval.get("raw_material_id", "")
            if rawId and rawId != "PENDING":
                save("UPDATE RAW_MATERIAL SET status='DRAFT' WHERE raw_id=?", (rawId,))

            targetId = approval.get("requester_partner", "")
            rRow = findOne("SELECT company_name FROM COMPANY WHERE partner_id=?", (rejecterId,))
            rName = rRow["company_name"] if rRow else rejecterId
            if targetId:
                save("INSERT INTO ALARM (partner_id,type,level,title,content,path) VALUES (?,'REJECT','warn',?,?,'/partner/request')",
                     (targetId, f"[{rName}] 데이터 반려 - 재제출 요청", f"반려 사유: {reason}"))

        return responseModel(True, "반려 완료", {"approvalId": approvalId})
    except Exception as e:
        return responseModel(False, f"반려 오류: {str(e)}")


def _parseChem(s: str) -> dict:
    result = {"mn": 0, "cu": 0, "si": 0, "fe": 0, "al": 0}
    for m in re.finditer(r'(Al|Mn|Cu|Si|Fe)\s*([\d.]+)', s, re.IGNORECASE):
        k = m.group(1).lower()
        if k in result: result[k] = float(m.group(2))
    return result

def _buildDim(rm: dict) -> str:
    p = []
    if rm.get("width"): p.append(f"{rm['width']}mm")
    if rm.get("length"): p.append(f"{rm['length']}mm")
    return " x ".join(p) if p else "-"

def _recalcEsgWeightedSum(partnerId: str):
    rows = findAll("""
        SELECT po.receiver_company_id AS child_id, po.qty AS weight, c.feoc_ratio, c.trir
        FROM PURCHASE_ORDER po LEFT JOIN COMPANY c ON po.receiver_company_id = c.partner_id
        WHERE po.delete_yn = 0 AND po.status != 'CANCELLED'
    """, ()) or []
    if not rows: return
    tw = sum(float(r.get("weight", 1) or 1) for r in rows)
    if tw == 0: return
    wf = sum(float(r.get("feoc_ratio", 0) or 0) * float(r.get("weight", 1) or 1) for r in rows) / tw
    wt = sum(float(r.get("trir", 0) or 0) * float(r.get("weight", 1) or 1) for r in rows) / tw
    save("UPDATE COMPANY SET feoc_ratio=?, trir=? WHERE partner_id=? AND delete_yn=0",
         (round(wf, 2), round(wt, 2), partnerId))