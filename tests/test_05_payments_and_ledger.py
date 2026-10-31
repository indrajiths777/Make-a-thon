import pytest
from fastapi.testclient import TestClient

def test_partial_payment_and_full_settlement(client: TestClient, staff_headers):
    # Invoice 2 in seed data has total $3872.00, amount_paid $1872.00, outstanding $2000.00
    inv_before = client.get("/api/v1/invoices/2", headers=staff_headers).json()["invoice"]
    initial_outstanding = inv_before["outstanding_balance"]
    assert initial_outstanding == 2000.0
    assert inv_before["status"] == "CONFIRMED"

    # 1. Record Partial Payment of $1,000.00
    pay1_payload = {
        "invoice_id": 2,
        "amount": 1000.0,
        "payment_method": "BANK_TRANSFER",
        "payment_date": "2026-11-05",
        "transaction_reference": "PARTIAL-WIRE-1",
        "notes": "First partial installment"
    }
    pay1_res = client.post("/api/v1/payments", json=pay1_payload, headers=staff_headers)
    assert pay1_res.status_code == 201

    # Verify invoice status is still CONFIRMED with $1,000 balance remaining
    inv_mid = client.get("/api/v1/invoices/2", headers=staff_headers).json()["invoice"]
    assert inv_mid["amount_paid"] == 2872.0
    assert inv_mid["outstanding_balance"] == 1000.0
    assert inv_mid["status"] == "CONFIRMED"

    # 2. Reject overpayment
    overpay_payload = {
        "invoice_id": 2,
        "amount": 1500.0, # Exceeds $1000 remaining
        "payment_method": "CREDIT_CARD"
    }
    overpay_res = client.post("/api/v1/payments", json=overpay_payload, headers=staff_headers)
    assert overpay_res.status_code == 400
    assert "exceeds outstanding" in overpay_res.json()["detail"]

    # 3. Record Final Payment of $1,000.00
    pay2_payload = {
        "invoice_id": 2,
        "amount": 1000.0,
        "payment_method": "ONLINE",
        "payment_date": "2026-11-06",
        "transaction_reference": "FINAL-SETTLE-2"
    }
    pay2_res = client.post("/api/v1/payments", json=pay2_payload, headers=staff_headers)
    assert pay2_res.status_code == 201

    # Verify invoice status automatically transitioned to PAID
    inv_final = client.get("/api/v1/invoices/2", headers=staff_headers).json()["invoice"]
    assert inv_final["amount_paid"] == 3872.0
    assert inv_final["outstanding_balance"] == 0.0
    assert inv_final["status"] == "PAID"

def test_overdue_invoice_tracking(client: TestClient, staff_headers):
    # Invoice 3 in seed data is overdue (due 2026-10-25) with outstanding balance 385.0
    res = client.get("/api/v1/dashboard/overdue", headers=staff_headers)
    assert res.status_code == 200
    overdue = res.json()["overdue_invoices"]
    assert len(overdue) >= 1
    inv3 = next((i for i in overdue if i["id"] == 3), None)
    assert inv3 is not None
    assert inv3["outstanding_balance"] > 0
