import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database
from backend.security import create_access_token

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Freshly seed database for test session
    seed_database(force=True)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_token():
    return create_access_token({"sub": "1", "email": "admin@brightloop.com", "role": "ADMIN"})

@pytest.fixture
def staff_token():
    return create_access_token({"sub": "2", "email": "staff@brightloop.com", "role": "STAFF"})

@pytest.fixture
def customer_token():
    return create_access_token({"sub": "3", "email": "sarah@apexventures.com", "role": "CUSTOMER"})

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}

@pytest.fixture
def customer_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}
