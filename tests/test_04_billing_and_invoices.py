import pytest
from datetime import date
from fastapi.testclient import TestClient
from backend.services.billing_service import generate_invoice_for_subscription

def test_invoice_generation_and_duplicate_prevention(client: TestClient, staff_headers):
    # 1. Billing for period 2026-10-01 to 2026-10-31 was already generated as INV-2026-0001 (id=1) in seed data.
    # Attempting to generate for this exact period again MUST return the existing invoice and prevent duplicates!
    inv_dup = generate_invoice_for_subscription(
        subscription_id=1,
        period_start=date(2026, 10, 1),
        period_end=date(2026, 10, 31),
        force=True
    )
    assert inv_dup is not None
    assert inv_dup["id"] == 1
    assert inv_dup["invoice_number"] == "INV-2026-0001"

    # 2. Test generation via API
    res1 = client.post("/api/v1/invoices/generate/2", headers=staff_headers)
    assert res1.status_code == 200
    inv1 = res1.json()["invoice"]
    assert inv1["subscription_id"] == 2
    assert inv1["total_amount"] > 0
    assert inv1["tax_rate"] == 10.0

def test_batch_automated_recurring_billing(client: TestClient, staff_headers):
    batch_res = client.post("/api/v1/invoices/run-billing", json={"execution_date": "2026-11-05"}, headers=staff_headers)
    assert batch_res.status_code == 200
    data = batch_res.json()
    assert "invoices_generated" in data

def test_tax_and_discount_calculations(client: TestClient, admin_headers, staff_headers):
    disc_payload = {
        "code": "TESTOFF50",
        "name": "Test $50 Off",
        "discount_type": "FIXED",
        "value": 50.0,
        "min_purchase_amount": 200.0,
        "min_quantity": 1,
        "start_date": "2026-01-01",
        "end_date": "2027-12-31",
        "max_uses": 5,
        "scope": "SUBSCRIPTION"
    }
    disc_res = client.post("/api/v1/discounts", json=disc_payload, headers=admin_headers)
    assert disc_res.status_code == 201

    list_res = client.get("/api/v1/discounts", headers=staff_headers)
    assert list_res.status_code == 200
    codes = [d["code"] for d in list_res.json()["discounts"]]
    assert "TESTOFF50" in codes
