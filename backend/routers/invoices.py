from typing import Optional, Dict, Any, List
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin
from backend.services.billing_service import (
    generate_invoice_for_subscription,
    run_automated_recurring_billing
)

router = APIRouter(prefix="/api/v1/invoices", tags=["Invoice & Billing Management"])

class RunBillingRequest(BaseModel):
    execution_date: Optional[date] = None

@router.get("")
def list_invoices(
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    params = []
    conditions = []
    
    if current_user["role"] == "CUSTOMER":
        cust_id = current_user.get("customer_id")
        if not cust_id:
            return {"invoices": []}
        conditions.append("i.customer_id = ?")
        params.append(cust_id)
        
    if status_filter:
        conditions.append("i.status = ?")
        params.append(status_filter.upper())
        
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    
    invoices = execute_query(
        f"""SELECT i.*, c.company_name, c.email as customer_email, s.subscription_number
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            LEFT JOIN subscriptions s ON i.subscription_id = s.id
            {where}
            ORDER BY i.id DESC""",
        tuple(params)
    )
    return {"invoices": invoices}

@router.get("/{invoice_id}")
def get_invoice(invoice_id: int, current_user: Dict[str, Any] = Depends(get_current_user)):
    inv = execute_one(
        """SELECT i.*, c.company_name, c.contact_name, c.email as customer_email, c.phone,
                  c.address, c.city, c.country, s.subscription_number, t.name as tax_name,
                  d.code as discount_code, d.name as discount_name
           FROM invoices i
           JOIN customers c ON i.customer_id = c.id
           LEFT JOIN subscriptions s ON i.subscription_id = s.id
           LEFT JOIN taxes t ON i.tax_id = t.id
           LEFT JOIN discounts d ON i.discount_id = d.id
           WHERE i.id = ?""",
        (invoice_id,)
    )
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if current_user["role"] == "CUSTOMER" and current_user.get("customer_id") != inv["customer_id"]:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own invoices.")
        
    inv["lines"] = execute_query(
        """SELECT il.*, pr.name as product_name, pv.variant_name, pv.variant_value 
           FROM invoice_lines il
           JOIN products pr ON il.product_id = pr.id
           LEFT JOIN product_variants pv ON il.product_variant_id = pv.id
           WHERE il.invoice_id = ?""",
        (invoice_id,)
    )
    
    inv["payments"] = execute_query(
        """SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date ASC""",
        (invoice_id,)
    )
    return {"invoice": inv}

@router.post("/generate/{subscription_id}")
def generate_sub_invoice(
    subscription_id: int,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    try:
        inv = generate_invoice_for_subscription(subscription_id, force=True)
        if not inv:
            raise HTTPException(status_code=400, detail="Unable to generate invoice for subscription.")
        return {"message": "Invoice generated successfully.", "invoice": inv}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/run-billing")
def trigger_batch_billing(
    payload: Optional[RunBillingRequest] = None,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    exec_dt = payload.execution_date if payload else date.today()
    invoices = run_automated_recurring_billing(exec_dt)
    return {
        "message": f"Recurring billing execution completed for {exec_dt}.",
        "invoices_generated": len(invoices),
        "invoices": invoices
    }

@router.post("/{invoice_id}/confirm")
def confirm_invoice(invoice_id: int, user: Dict[str, Any] = Depends(require_staff_or_admin)):
    inv = execute_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if inv["status"] == "PAID":
        raise HTTPException(status_code=400, detail="Invoice is already paid.")
        
    execute_update("UPDATE invoices SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (invoice_id,))
    return {"message": f"Invoice {inv['invoice_number']} confirmed."}

@router.post("/{invoice_id}/cancel")
def cancel_invoice(invoice_id: int, user: Dict[str, Any] = Depends(require_staff_or_admin)):
    inv = execute_one("SELECT * FROM invoices WHERE id = ?", (invoice_id,))
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    if inv["status"] == "PAID":
        raise HTTPException(status_code=400, detail="Cannot cancel a fully settled invoice.")
        
    execute_update("UPDATE invoices SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (invoice_id,))
    return {"message": f"Invoice {inv['invoice_number']} cancelled."}
