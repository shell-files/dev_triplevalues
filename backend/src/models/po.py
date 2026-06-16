# src/models/po.py
# ────────────────────────────────────────────────────────
# [v1.0] 2026-06-16 — 구매 발주(PO) 관리 비즈니스 로직
# ────────────────────────────────────────────────────────

import random, string
from datetime import datetime, timedelta
from src.utils.db import findAll, save
from src.models.model import responseModel


def getPoListProcess(searchField=None, searchKeyword=None) -> dict:
    sql = """
        SELECT po.id, po.po_id, po.sender_company_id, po.receiver_company_id,
               po.raw_id, po.qty, po.unit_price, po.total, po.delivery,
               po.status, po.created_at,
               cs.company_name AS sender_name,
               cr.company_name AS receiver_name,
               rm.name AS raw_name, rm.origin, rm.components
        FROM PURCHASE_ORDER po
        LEFT JOIN COMPANY cs ON po.sender_company_id = cs.partner_id
        LEFT JOIN COMPANY cr ON po.receiver_company_id = cr.partner_id
        LEFT JOIN RAW_MATERIAL rm ON po.raw_id = rm.raw_id
        WHERE po.delete_yn = 0 AND po.sender_company_id = 'HMOS-001'
    """
    params = []

    if searchField and searchKeyword:
        kw = f"%{searchKeyword}%"
        fieldMap = {
            "po_id": "po.po_id",
            "raw_name": "rm.name",
            "components": "rm.components",
        }
        dbField = fieldMap.get(searchField)
        if dbField:
            sql += f" AND {dbField} LIKE ?"
            params.append(kw)

    sql += " ORDER BY po.created_at DESC"
    rows = findAll(sql, tuple(params) if params else ()) or []

    statusCount = {"PENDING": 0, "IN_PROGRESS": 0, "COMPLETED": 0, "CANCELLED": 0}
    orders = []
    for r in rows:
        st = r.get("status", "PENDING")
        if st in statusCount:
            statusCount[st] += 1

        orders.append({
            "id": r["id"],
            "poId": r["po_id"],
            "senderName": r.get("sender_name") or r["sender_company_id"],
            "receiverName": r.get("receiver_name") or r["receiver_company_id"],
            "senderCompanyId": r["sender_company_id"],
            "receiverCompanyId": r["receiver_company_id"],
            "rawId": r.get("raw_id", ""),
            "rawName": r.get("raw_name") or "-",
            "components": r.get("components") or "-",
            "qty": float(r.get("qty", 0) or 0),
            "unitPrice": float(r.get("unit_price", 0) or 0),
            "total": float(r.get("total", 0) or 0),
            "delivery": str(r["delivery"]) if r.get("delivery") else "-",
            "status": st,
            "createdAt": str(r["created_at"])[:10] if r.get("created_at") else "-",
        })

    return responseModel(True, "", {
        "orders": orders,
        "totalCount": len(orders),
        "statusCount": statusCount,
    })


def seedPoProcess() -> dict:
    try:
        # 원청사(HMOS-001) → 1차 협력사 납품 PO만 생성
        products = [
            ("RM-NOV-001", "HMOS-001", "NOV-001"),
        ]
        statuses = ["PENDING", "IN_PROGRESS", "COMPLETED"]
        inserted = 0

        for _ in range(2):
            rawId, sender, receiver = random.choice(products)
            suffix = ''.join(random.choices(string.digits, k=3))
            poId = f"PO-OEM-NOV-{suffix}"
            qty = round(random.uniform(1, 100), 2)
            unitPrice = round(random.uniform(100, 5000), 2)
            total = round(qty * unitPrice, 2)
            days = random.randint(7, 90)
            delivery = (datetime.now() + timedelta(days=days)).strftime("%Y-%m-%d")
            status = random.choice(statuses)

            save("""
                INSERT INTO PURCHASE_ORDER (po_id, sender_company_id, receiver_company_id, raw_id, qty, unit_price, total, delivery, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (poId, sender, receiver, rawId, qty, unitPrice, total, delivery, status))
            inserted += 1

        return responseModel(True, f"테스트 PO {inserted}건 생성 완료", {"insertedCount": inserted})
    except Exception as e:
        return responseModel(False, f"PO 생성 오류: {str(e)}")