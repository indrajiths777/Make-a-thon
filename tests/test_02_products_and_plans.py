import pytest
from fastapi.testclient import TestClient

def test_product_and_odoo_variant_pricing(client: TestClient, admin_headers):
    # 1. Create a base product
    prod_payload = {
        "name": "Brightloop CRM Pro",
        "product_type": "SAAS",
        "sales_price": 1000.0,
        "cost_price": 300.0,
        "notes": "Customer Relationship Management"
    }
    res = client.post("/api/v1/products", json=prod_payload, headers=admin_headers)
    assert res.status_code == 201
    prod = res.json()["product"]
    prod_id = prod["id"]
    assert prod["sales_price"] == 1000.0

    # 2. Add Odoo brand variant with +560 price adjustment
    var_payload = {
        "variant_name": "Brand",
        "variant_value": "Odoo Brand Edition",
        "price_adjustment": 560.0
    }
    var_res = client.post(f"/api/v1/products/{prod_id}/variants", json=var_payload, headers=admin_headers)
    assert var_res.status_code == 201
    var = var_res.json()
    assert var["price_adjustment"] == 560.0

    # 3. Retrieve product and verify variant
    get_res = client.get(f"/api/v1/products/{prod_id}", headers=admin_headers)
    assert get_res.status_code == 200
    variants = get_res.json()["product"]["variants"]
    assert len(variants) == 1
    assert variants[0]["variant_value"] == "Odoo Brand Edition"
    assert variants[0]["price_adjustment"] == 560.0

def test_subscription_plan_cadence_and_policies(client: TestClient, admin_headers):
    plan_payload = {
        "name": "Quarterly Mid-Market Plan",
        "billing_period": "MONTHLY",
        "price": 2500.0,
        "min_quantity": 3,
        "availability_start": "2026-01-01",
        "availability_end": "2027-12-31",
        "auto_close": False,
        "allow_early_close": True,
        "allow_pause": True,
        "allow_renewal": True
    }
    res = client.post("/api/v1/plans", json=plan_payload, headers=admin_headers)
    assert res.status_code == 201
    plan = res.json()["plan"]
    assert plan["min_quantity"] == 3
    assert plan["billing_period"] == "MONTHLY"
    assert plan["allow_pause"] == 1
    assert plan["allow_early_close"] == 1
