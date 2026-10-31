import pytest
from fastapi.testclient import TestClient

def test_quotation_creation_and_conversion_to_subscription(client: TestClient, staff_headers):
    # 1. Create a quotation for Customer 1 on Plan 1
    quote_payload = {
        "customer_id": 1,
        "plan_id": 1,
        "validity_days": 30,
        "payment_terms": "Net 30",
        "notes": "Testing quotation conversion",
        "lines": [
            {
                "product_id": 1,
                "product_variant_id": 1, # Odoo variant: 1200 + 560 = 1760
                "quantity": 2,
                "tax_rate": 10.0
            }
        ]
    }
    create_res = client.post("/api/v1/quotations", json=quote_payload, headers=staff_headers)
    assert create_res.status_code == 201
    quote = create_res.json()["quotation"]
    quote_id = quote["id"]
    # 2 * 1760 = 3520 subtotal, 352 tax -> 3872 total
    assert quote["subtotal"] == 3520.0
    assert quote["total_amount"] == 3872.0
    assert quote["status"] == "SENT"

    # 2. Convert quotation to subscription
    convert_res = client.post(f"/api/v1/quotations/{quote_id}/convert", headers=staff_headers)
    assert convert_res.status_code == 200
    sub = convert_res.json()["subscription"]
    assert sub["status"] == "ACTIVE"
    assert sub["subtotal"] == 3520.0
    assert sub["total_amount"] == 3872.0

    # 3. Verify quotation status is now CONVERTED
    q_check = client.get(f"/api/v1/quotations/{quote_id}", headers=staff_headers).json()["quotation"]
    assert q_check["status"] == "CONVERTED"

    # 4. Attempting to convert again should fail
    dup_convert = client.post(f"/api/v1/quotations/{quote_id}/convert", headers=staff_headers)
    assert dup_convert.status_code == 400
    assert "already been converted" in dup_convert.json()["detail"]

def test_subscription_lifecycle_state_machine(client: TestClient, staff_headers):
    # Retrieve subscription 1
    sub_res = client.get("/api/v1/subscriptions/1", headers=staff_headers)
    assert sub_res.status_code == 200

    # Pause active subscription
    pause_res = client.post("/api/v1/subscriptions/1/pause", headers=staff_headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["subscription"]["status"] == "PAUSED"

    # Resume paused subscription
    resume_res = client.post("/api/v1/subscriptions/1/resume", headers=staff_headers)
    assert resume_res.status_code == 200
    assert resume_res.json()["subscription"]["status"] == "ACTIVE"

    # Renew subscription
    renew_res = client.post("/api/v1/subscriptions/1/renew?extension_months=12", headers=staff_headers)
    assert renew_res.status_code == 200
    assert renew_res.json()["subscription"]["status"] == "ACTIVE"
