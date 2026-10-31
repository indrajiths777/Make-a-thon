from typing import Optional, Dict, Any, List
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/discounts", tags=["Discount Management"])

class DiscountCreate(BaseModel):
    code: str
    name: str
    discount_type: str  # FIXED, PERCENTAGE
    value: float
    min_purchase_amount: float = 0.0
    min_quantity: int = 0
    start_date: date
    end_date: Optional[date] = None
    max_uses: Optional[int] = None
    scope: str = "SUBSCRIPTION"  # SUBSCRIPTION, PRODUCT
    product_ids: Optional[List[int]] = None

class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[float] = None
    min_purchase_amount: Optional[float] = None
    min_quantity: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_uses: Optional[int] = None
    is_active: Optional[bool] = None

@router.get("")
def list_discounts(current_user: Dict[str, Any] = Depends(get_current_user)):
    discounts = execute_query("SELECT * FROM discounts ORDER BY id ASC")
    for d in discounts:
        d["products"] = execute_query(
            """SELECT p.id, p.name 
               FROM discount_products dp
               JOIN products p ON dp.product_id = p.id
               WHERE dp.discount_id = ?""",
            (d["id"],)
        )
    return {"discounts": discounts}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_discount(
    payload: DiscountCreate,
    admin: Dict[str, Any] = Depends(require_admin)
):
    code = payload.code.strip().upper()
    existing = execute_one("SELECT id FROM discounts WHERE code = ?", (code,))
    if existing:
        raise HTTPException(status_code=400, detail=f"Discount code '{code}' already exists.")
        
    valid_types = ("FIXED", "PERCENTAGE")
    if payload.discount_type.upper() not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid discount type. Allowed: {valid_types}")
        
    if payload.discount_type.upper() == "PERCENTAGE" and (payload.value <= 0 or payload.value > 100):
        raise HTTPException(status_code=400, detail="Percentage discount value must be between 0 and 100.")
        
    with get_db() as conn:
        d_cur = conn.execute(
            """INSERT INTO discounts (
                code, name, discount_type, value, min_purchase_amount, min_quantity,
                start_date, end_date, max_uses, times_used, scope, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)""",
            (
                code, payload.name, payload.discount_type.upper(), payload.value,
                payload.min_purchase_amount, payload.min_quantity, str(payload.start_date),
                str(payload.end_date) if payload.end_date else None, payload.max_uses,
                payload.scope.upper()
            )
        )
        discount_id = d_cur.lastrowid
        
        if payload.product_ids and payload.scope.upper() == "PRODUCT":
            for pid in payload.product_ids:
                conn.execute(
                    "INSERT OR IGNORE INTO discount_products (discount_id, product_id) VALUES (?, ?)",
                    (discount_id, pid)
                )
                
    return execute_one("SELECT * FROM discounts WHERE id = ?", (discount_id,))

@router.put("/{discount_id}")
def update_discount(
    discount_id: int,
    payload: DiscountUpdate,
    admin: Dict[str, Any] = Depends(require_admin)
):
    disc = execute_one("SELECT * FROM discounts WHERE id = ?", (discount_id,))
    if not disc:
        raise HTTPException(status_code=404, detail="Discount not found.")
        
    updates = []
    params = []
    if payload.name is not None:
        updates.append("name = ?"); params.append(payload.name)
    if payload.value is not None:
        updates.append("value = ?"); params.append(payload.value)
    if payload.min_purchase_amount is not None:
        updates.append("min_purchase_amount = ?"); params.append(payload.min_purchase_amount)
    if payload.min_quantity is not None:
        updates.append("min_quantity = ?"); params.append(payload.min_quantity)
    if payload.start_date is not None:
        updates.append("start_date = ?"); params.append(str(payload.start_date))
    if payload.end_date is not None:
        updates.append("end_date = ?"); params.append(str(payload.end_date))
    if payload.max_uses is not None:
        updates.append("max_uses = ?"); params.append(payload.max_uses)
    if payload.is_active is not None:
        updates.append("is_active = ?"); params.append(1 if payload.is_active else 0)
        
    if updates:
        params.append(discount_id)
        execute_update(f"UPDATE discounts SET {', '.join(updates)} WHERE id = ?", tuple(params))
        
    return execute_one("SELECT * FROM discounts WHERE id = ?", (discount_id,))

@router.delete("/{discount_id}")
def delete_discount(discount_id: int, admin: Dict[str, Any] = Depends(require_admin)):
    execute_update("UPDATE discounts SET is_active = 0 WHERE id = ?", (discount_id,))
    return {"message": "Discount rule deactivated."}
