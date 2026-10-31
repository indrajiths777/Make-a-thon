from typing import Optional, Dict, Any, List
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin

router = APIRouter(prefix="/api/v1/plans", tags=["Subscription Plan Management"])

class PlanCreate(BaseModel):
    name: str
    billing_period: str  # DAILY, WEEKLY, MONTHLY, YEARLY
    price: float
    min_quantity: int = 1
    availability_start: date
    availability_end: Optional[date] = None
    auto_close: bool = False
    allow_early_close: bool = True
    allow_pause: bool = True
    allow_renewal: bool = True
    product_ids: Optional[List[int]] = None

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    billing_period: Optional[str] = None
    price: Optional[float] = None
    min_quantity: Optional[int] = None
    availability_start: Optional[date] = None
    availability_end: Optional[date] = None
    auto_close: Optional[bool] = None
    allow_early_close: Optional[bool] = None
    allow_pause: Optional[bool] = None
    allow_renewal: Optional[bool] = None
    is_active: Optional[bool] = None

@router.get("")
def list_plans(
    include_inactive: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    where = "" if include_inactive else "WHERE is_active = 1"
    plans = execute_query(f"SELECT * FROM plans {where} ORDER BY price ASC")
    for pl in plans:
        pl["products"] = execute_query(
            """SELECT p.id, p.name, p.sales_price, pp.default_quantity 
               FROM plan_products pp
               JOIN products p ON pp.product_id = p.id
               WHERE pp.plan_id = ?""",
            (pl["id"],)
        )
    return {"plans": plans}

@router.get("/{plan_id}")
def get_plan(plan_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (plan_id,))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
    plan["products"] = execute_query(
        """SELECT p.id, p.name, p.sales_price, pp.default_quantity 
           FROM plan_products pp
           JOIN products p ON pp.product_id = p.id
           WHERE pp.plan_id = ?""",
        (plan["id"],)
    )
    return {"plan": plan}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_plan(
    payload: PlanCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    valid_cadences = ("DAILY", "WEEKLY", "MONTHLY", "YEARLY")
    if payload.billing_period.upper() not in valid_cadences:
        raise HTTPException(status_code=400, detail=f"Invalid billing period. Allowed: {valid_cadences}")
    if payload.price < 0:
        raise HTTPException(status_code=400, detail="Plan price cannot be negative.")
    if payload.min_quantity < 1:
        raise HTTPException(status_code=400, detail="Minimum quantity must be at least 1.")
        
    with get_db() as conn:
        cur = conn.execute(
            """INSERT INTO plans (
                name, billing_period, price, min_quantity, availability_start, availability_end,
                auto_close, allow_early_close, allow_pause, allow_renewal, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (
                payload.name, payload.billing_period.upper(), payload.price, payload.min_quantity,
                str(payload.availability_start), str(payload.availability_end) if payload.availability_end else None,
                1 if payload.auto_close else 0, 1 if payload.allow_early_close else 0,
                1 if payload.allow_pause else 0, 1 if payload.allow_renewal else 0
            )
        )
        plan_id = cur.lastrowid
        
        if payload.product_ids:
            for pid in payload.product_ids:
                conn.execute(
                    "INSERT OR IGNORE INTO plan_products (plan_id, product_id, default_quantity) VALUES (?, ?, 1)",
                    (plan_id, pid)
                )
                
    return get_plan(plan_id, user)

@router.put("/{plan_id}")
def update_plan(
    plan_id: int,
    payload: PlanUpdate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (plan_id,))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
        
    updates = []
    params = []
    if payload.name is not None:
        updates.append("name = ?"); params.append(payload.name)
    if payload.billing_period is not None:
        updates.append("billing_period = ?"); params.append(payload.billing_period.upper())
    if payload.price is not None:
        updates.append("price = ?"); params.append(payload.price)
    if payload.min_quantity is not None:
        updates.append("min_quantity = ?"); params.append(payload.min_quantity)
    if payload.availability_start is not None:
        updates.append("availability_start = ?"); params.append(str(payload.availability_start))
    if payload.availability_end is not None:
        updates.append("availability_end = ?"); params.append(str(payload.availability_end))
    if payload.auto_close is not None:
        updates.append("auto_close = ?"); params.append(1 if payload.auto_close else 0)
    if payload.allow_early_close is not None:
        updates.append("allow_early_close = ?"); params.append(1 if payload.allow_early_close else 0)
    if payload.allow_pause is not None:
        updates.append("allow_pause = ?"); params.append(1 if payload.allow_pause else 0)
    if payload.allow_renewal is not None:
        updates.append("allow_renewal = ?"); params.append(1 if payload.allow_renewal else 0)
    if payload.is_active is not None:
        updates.append("is_active = ?"); params.append(1 if payload.is_active else 0)
        
    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(plan_id)
        execute_update(f"UPDATE plans SET {', '.join(updates)} WHERE id = ?", tuple(params))
        
    return get_plan(plan_id, user)

@router.delete("/{plan_id}")
def delete_plan(plan_id: int, user: Dict[str, Any] = Depends(require_staff_or_admin)):
    execute_update("UPDATE plans SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (plan_id,))
    return {"message": "Plan archived."}
