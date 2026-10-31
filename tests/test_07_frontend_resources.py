import pytest
from fastapi.testclient import TestClient

def test_frontend_resources_load_successfully(client: TestClient):
    resources = [
        "/",
        "/css/tailwind.min.css",
        "/css/styles.css",
        "/js/vendor/lucide.min.js",
        "/js/vendor/chart.min.js",
        "/js/api.js",
        "/js/components/dashboard_view.js",
        "/js/components/products_view.js",
        "/js/components/plans_view.js",
        "/js/components/quotations_view.js",
        "/js/components/subscriptions_view.js",
        "/js/components/invoices_view.js",
        "/js/components/payments_view.js",
        "/js/components/customers_view.js",
        "/js/components/discounts_view.js",
        "/js/components/taxes_view.js",
        "/js/components/staff_view.js",
        "/js/app.js"
    ]

    for path in resources:
        res = client.get(path)
        assert res.status_code == 200, f"Resource {path} returned status {res.status_code}"
        assert len(res.content) > 0, f"Resource {path} is empty"

def test_index_html_has_no_broken_static_references(client: TestClient):
    res = client.get("/")
    assert res.status_code == 200
    html = res.text
    # Ensure no old absolute '/static/' references remain in index.html
    assert 'href="/static/' not in html
    assert 'src="/static/' not in html
    assert 'cdn.tailwindcss.com' not in html  # Zero CDN warning
