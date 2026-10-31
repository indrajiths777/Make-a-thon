from typing import Optional, Dict, Any, List
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin
from backend.services.pricing_service import calculate_line_unit_price
from backend.services.subscription_service import (
    generate_subscription_number,
    calculate_next_period,
    transition_subscription_status,
    renew_subscription
)

router = APIRouter(prefix="/api/v1/subscriptions", tags=["Subscription Management"])

class SubscriptionLineInput(BaseModel):
    product_id: int
    product_variant_id: Optional[int] = None
    quantity: int = 1
    unit_price: Optional[float] = None
    tax_rate: float = 10.0

class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[date] = None
    payment_terms: str = "Immediate"
    notes: Optional[str] = None
    lines: List[SubscriptionLineInput]

class StatusTransitionRequest(BaseModel):
    status: str

@router.get("")
def list_subscriptions(
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    params = []
    conditions = []
    
    if current_user["role"] == "CUSTOMER":
        cust_id = current_user.get("customer_id")
        if not cust_id:
            return {"subscriptions": []}
        conditions.append("s.customer_id = ?")
        params.append(cust_id)
        
    if status_filter:
        conditions.append("s.status = ?")
        params.append(status_filter.upper())
        
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    subs = execute_query(
        f"""SELECT s.*, c.company_name, c.email as customer_email, p.name as plan_name, p.billing_period,
                   p.allow_pause, p.allow_early_close, p.allow_renewal
            FROM subscriptions s
            JOIN customers c ON s.customer_id = c.id
            JOIN plans p ON s.plan_id = p.id
            {where}
            ORDER BY s.id DESC""",
        tuple(params)
    )
    return {"subscriptions": subs}

@router.get("/{subscription_id}")
def get_subscription(subscription_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    sub = execute_one(
        """SELECT s.*, c.company_name, c.contact_name, c.email as customer_email, c.phone, c.address,
                  p.name as plan_name, p.billing_period, p.allow_pause, p.allow_early_close, p.allow_renewal
           FROM subscriptions s
           JOIN customers c ON s.customer_id = c.id
           JOIN plans p ON s.plan_id = p.id
           WHERE s.id = ?""",
        (subscription_id,)
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
        
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != sub["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own subscriptions.")
        
    sub["lines"] = execute_query(
        """SELECT sl.*, pr.name as product_name, pv.variant_name, pv.variant_value
           FROM subscription_lines sl
           JOIN products pr ON sl.product_id = pr.id
           LEFT JOIN product_variants pv ON sl.product_variant_id = pv.id
           WHERE sl.subscription_id = ?""",
        (subscription_id,)
    )
    
    sub["invoices"] = execute_query(
        """SELECT id, invoice_number, invoice_date, due_date, total_amount, amount_paid,
                  outstanding_balance, status 
           FROM invoices 
           WHERE subscription_id = ? 
           ORDER BY invoice_date DESC""",
        (subscription_id,)
    )
    return {"subscription": sub}

@router.post("", status_code=status.HTTP_201_CREATED)
def create_subscription(
    payload: SubscriptionCreate,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    if not payload.lines:
        raise HTTPException(status_code=400, detail="Subscription must contain at least one product line.")
        
    plan = execute_one("SELECT * FROM plans WHERE id = ?", (payload.plan_id,))
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found.")
        
    total_qty = sum(l.quantity for l in payload.lines)
    if total_qty < plan["min_quantity"]:
        raise HTTPException(
            status_code=400,
            detail=f"Total ordered quantity ({total_qty}) does not meet the minimum plan requirement of {plan['min_quantity']}."
        )
        
    start_dt = payload.start_date or date.today()
    period_start, period_end = calculate_next_period(start_dt, plan["billing_period"])
    
    # Expiry calculation (1 year standard)
    if plan["billing_period"] == "YEARLY":
        expiry_dt = date(start_dt.year + 1, start_dt.month, start_dt.day)
    else:
        try:
            expiry_dt = date(start_dt.year + 1, start_dt.month, start_dt.day)
        except ValueError:
            expiry_dt = date(start_dt.year + 1, start_dt.month, 28)
            
    sub_num = generate_subscription_number()
    
    # Calculate Line totals
    subtotal = 0.0
    tax_amount = 0.0
    computed_lines = []
    for l in payload.lines:
        unit_price = l.unit_price if l.unit_price is not None else calculate_line_unit_price(l.product_id, l.product_variant_id)
        line_total = round(unit_price * l.quantity, 2)
        line_tax = round(line_total * (l.tax_rate / 100.0), 2)
        subtotal += line_total
        tax_amount += line_tax
        computed_lines.append({
            "product_id": l.product_id,
            "product_variant_id": l.product_variant_id,
            "quantity": l.quantity,
            "unit_price": unit_price,
            "tax_rate": l.tax_rate,
            "line_total": line_total
        })
        
    total_amount = round(subtotal + tax_amount, 2)
    
    with get_db() as conn:
        s_cur = conn.execute(
            """INSERT INTO subscriptions (
                subscription_number, customer_id, plan_id, start_date, expiry_date,
                next_billing_date, billing_anchor_date, status, payment_terms,
                subtotal, tax_amount, discount_amount, total_amount, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 0.0, ?, ?)""",
            (
                sub_num, payload.customer_id, payload.plan_id, str(start_dt), str(expiry_dt),
                str(period_end), str(start_dt), payload.payment_terms,
                subtotal, tax_amount, total_amount, payload.notes
            )
        )
        sub_id = s_cur.lastrowid
        
        for cl in computed_lines:
            conn.execute(
                """INSERT INTO subscription_lines (
                    subscription_id, product_id, product_variant_id, quantity, unit_price, tax_rate, line_total
                ) VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    sub_id, cl["product_id"], cl["product_variant_id"],
                    cl["quantity"], cl["unit_price"], cl["tax_rate"], cl["line_total"]
                )
            )
            
    return get_subscription(sub_id, user)

@router.post("/{subscription_id}/status")
def update_status(
    subscription_id: int,
    payload: StatusTransitionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    sub = execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
        
    # Check customer permission
    if current_user["role"] == "CUSTOMER":
        if current_user.get("customer_id") != sub["customer_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
            
    is_admin = current_user["role"] == "ADMIN"
    try:
        updated = transition_subscription_status(subscription_id, payload.status, force_admin=is_admin)
        return {"message": f"Subscription transitioned to {payload.status}.", "subscription": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{subscription_id}/pause")
def pause_subscription(
    subscription_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return update_status(subscription_id, StatusTransitionRequest(status="PAUSED"), current_user)

@router.post("/{subscription_id}/resume")
def resume_subscription(
    subscription_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return update_status(subscription_id, StatusTransitionRequest(status="ACTIVE"), current_user)

@router.post("/{subscription_id}/close")
def close_subscription(
    subscription_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return update_status(subscription_id, StatusTransitionRequest(status="CLOSED"), current_user)

@router.post("/{subscription_id}/renew")
def renew_sub(
    subscription_id: int,
    extension_months: int = 12,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    sub = execute_one("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,))
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found.")
        
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != sub["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    try:
        updated = renew_subscription(subscription_id, extension_months)
        return {"message": "Subscription renewed successfully.", "subscription": updated}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
