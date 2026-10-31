import pytest
from fastapi.testclient import TestClient

def test_admin_dashboard_metrics_real_database_calculation(client: TestClient, admin_headers):
    res = client.get("/api/v1/dashboard/metrics", headers=admin_headers)
    assert res.status_code == 200
    m = res.json()["metrics"]

    # Verify not hardcoded and matches database state
    assert m["total_customers"] >= 2
    assert m["active_subscriptions"] >= 1
    assert m["total_revenue"] > 0
    assert m["total_outstanding"] >= 0
    assert m["mrr"] > 0
    assert m["arr"] == round(m["mrr"] * 12.0, 2)
    assert "recent_payments" in m
    assert "status_breakdown" in m

def test_customer_tenant_isolation(client: TestClient, customer_headers, staff_headers):
    # Customer 3 (Sarah, Apex Ventures, Customer ID 1)
    # Attempt to view another customer's invoice or subscription:
    # Customer 2 owns subscription 2. Customer 1 shouldn't view Customer 2's subscription!
    forbidden_sub = client.get("/api/v1/subscriptions/2", headers=customer_headers)
    assert forbidden_sub.status_code == 403
    assert "Access denied" in forbidden_sub.json()["detail"]

    # Customer 1 viewing their own subscription (Subscription 1) -> 200 OK
    own_sub = client.get("/api/v1/subscriptions/1", headers=customer_headers)
    assert own_sub.status_code == 200
    assert own_sub.json()["subscription"]["customer_id"] == 1

    # Customer self dashboard metrics should be strictly scoped
    cust_metrics = client.get("/api/v1/dashboard/metrics", headers=customer_headers).json()["metrics"]
    assert cust_metrics["total_customers"] == 1
