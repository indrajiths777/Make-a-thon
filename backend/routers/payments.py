from typing import Optional, Dict, Any, List
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from backend.db import get_db, execute_one, execute_query, execute_insert, execute_update
from backend.dependencies import get_current_user, require_staff_or_admin
from backend.services.payment_service import record_invoice_payment

router = APIRouter(prefix="/api/v1/payments", tags=["Payment Management"])

class RecordPaymentRequest(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str  # BANK_TRANSFER, CREDIT_CARD, CASH, CHEQUE, ONLINE
    payment_date: Optional[date] = None
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

@router.get("")
def list_payments(current_user: Dict[str, Any] = Depends(get_current_user)):
    params = []
    where = ""
    if current_user["role"] == "CUSTOMER":
        cust_id = current_user.get("customer_id")
        if not cust_id:
            return {"payments": []}
        where = "WHERE p.customer_id = ?"
        params.append(cust_id)
        
    payments = execute_query(
        f"""SELECT p.*, c.company_name, c.email as customer_email, i.invoice_number, i.total_amount as invoice_total
            FROM payments p
            JOIN customers c ON p.customer_id = c.id
            JOIN invoices i ON p.invoice_id = i.id
            {where}
            ORDER BY p.id DESC""",
        tuple(params)
    )
    return {"payments": payments}

@router.post("", status_code=status.HTTP_201_CREATED)
def record_payment(
    payload: RecordPaymentRequest,
    user: Dict[str, Any] = Depends(require_staff_or_admin)
):
    try:
        payment = record_invoice_payment(
            invoice_id=payload.invoice_id,
            amount=payload.amount,
            payment_method=payload.payment_method,
            payment_date=payload.payment_date,
            transaction_reference=payload.transaction_reference,
            notes=payload.notes
        )
        return {"message": "Payment recorded successfully.", "payment": payment}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
