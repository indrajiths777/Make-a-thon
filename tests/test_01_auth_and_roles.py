import pytest
from fastapi.testclient import TestClient

def test_password_complexity_validation(client: TestClient):
    # Too short (<= 8)
    res = client.post("/api/v1/auth/register", json={
        "email": "short@test.com", "password": "Ab1!", "full_name": "Short", "company_name": "Test Co"
    })
    assert res.status_code == 400
    assert "more than eight characters" in res.json()["detail"]

    # Missing uppercase
    res = client.post("/api/v1/auth/register", json={
        "email": "noupper@test.com", "password": "lowercase123!", "full_name": "No Upper", "company_name": "Test Co"
    })
    assert res.status_code == 400
    assert "uppercase" in res.json()["detail"]

    # Missing lowercase
    res = client.post("/api/v1/auth/register", json={
        "email": "nolower@test.com", "password": "UPPERCASE123!", "full_name": "No Lower", "company_name": "Test Co"
    })
    assert res.status_code == 400
    assert "lowercase" in res.json()["detail"]

    # Missing special character
    res = client.post("/api/v1/auth/register", json={
        "email": "nospecial@test.com", "password": "Password123", "full_name": "No Special", "company_name": "Test Co"
    })
    assert res.status_code == 400
    assert "special character" in res.json()["detail"]

def test_successful_customer_registration_and_login(client: TestClient):
    reg_payload = {
        "email": "john.doe@innovate.io",
        "password": "SecurePassword@2026",
        "full_name": "John Doe",
        "company_name": "Innovate IO",
        "phone": "+1 555 111 2222",
        "city": "Boston"
    }
    reg_res = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "token" in data
    assert data["user"]["role"] == "CUSTOMER"
    assert data["user"]["company_name"] == "Innovate IO"

    # Login with newly created user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "john.doe@innovate.io",
        "password": "SecurePassword@2026"
    })
    assert login_res.status_code == 200
    assert "token" in login_res.json()

def test_duplicate_email_prevention(client: TestClient):
    duplicate_payload = {
        "email": "admin@brightloop.com",
        "password": "ValidPassword@123",
        "full_name": "Imposter Admin",
        "company_name": "Fraud Co"
    }
    res = client.post("/api/v1/auth/register", json=duplicate_payload)
    assert res.status_code == 400
    assert "already exists" in res.json()["detail"]

def test_role_based_access_control(client: TestClient, admin_headers, staff_headers, customer_headers):
    # Only Admin can create staff
    staff_payload = {
        "email": "michael.support@brightloop.com",
        "password": "StaffPassword@123",
        "full_name": "Michael Support"
    }
    
    # Customer trying to create staff -> 403 Forbidden
    cust_res = client.post("/api/v1/auth/create-staff", json=staff_payload, headers=customer_headers)
    assert cust_res.status_code == 403

    # Staff trying to create staff -> 403 Forbidden
    staff_res = client.post("/api/v1/auth/create-staff", json=staff_payload, headers=staff_headers)
    assert staff_res.status_code == 403

    # Admin creating staff -> 201 Created
    admin_res = client.post("/api/v1/auth/create-staff", json=staff_payload, headers=admin_headers)
    assert admin_res.status_code == 201
    assert admin_res.json()["staff"]["role"] == "STAFF"

def test_password_reset_flow(client: TestClient):
    req_res = client.post("/api/v1/auth/request-password-reset", json={"email": "sarah@apexventures.com"})
    assert req_res.status_code == 200
    token = req_res.json()["reset_token"]
    assert token is not None

    # Reset with valid token and strong new password
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": token,
        "new_password": "NewSarahPassword@2026"
    })
    assert reset_res.status_code == 200

    # Verify login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "email": "sarah@apexventures.com",
        "password": "NewSarahPassword@2026"
    })
    assert login_res.status_code == 200
