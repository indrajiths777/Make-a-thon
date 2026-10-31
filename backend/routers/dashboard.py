
from typing import Dict, Any
from fastapi import APIRouter, Depends

from backend.dependencies import get_current_user
from backend.db import execute_one
from backend.services.dashboard_service import get_system_dashboard_metrics
from backend.services.payment_service import get_overdue_invoices

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard & Financial Reporting"]
)


@router.get("/metrics")
def get_metrics(current_user: Dict[str, Any] = Depends(get_current_user)):
    customer_id = None

    if current_user["role"] == "CUSTOMER":
        customer = execute_one(
            "SELECT id FROM customers WHERE user_id = ?",
            (current_user["id"],)
        )

        if not customer:
            return {"metrics": {}}

        customer_id = customer["id"]

    metrics = get_system_dashboard_metrics(customer_id=customer_id)
    return {"metrics": metrics}


@router.get("/overdue")
def list_overdue(current_user: Dict[str, Any] = Depends(get_current_user)):
    overdue = get_overdue_invoices()

    if current_user["role"] == "CUSTOMER":
        customer = execute_one(
            "SELECT id FROM customers WHERE user_id = ?",
            (current_user["id"],)
        )

        if not customer:
            return {"overdue_invoices": []}

        customer_id = customer["id"]
        overdue = [
            invoice for invoice in overdue
            if invoice["customer_id"] == customer_id
        ]

    return {"overdue_invoices": overdue}
