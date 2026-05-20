import os
import time
import uuid
import requests

BASE_URL = os.environ.get("TESTSPRITE_BASE_URL", "http://127.0.0.1:3000")
SUPERADMIN_EMAIL = os.environ.get("TESTSPRITE_SUPERADMIN_EMAIL", "admin@myprodusen.com")
SUPERADMIN_PASSWORD = os.environ.get("TESTSPRITE_SUPERADMIN_PASSWORD") or os.environ.get("SEED_SUPERADMIN_PASSWORD") or "Admin@Produsen2026"
EMPLOYEE_EMAIL = os.environ.get("TESTSPRITE_EMPLOYEE_EMAIL", "employee1@myprodusen.com")
EMPLOYEE_PASSWORD = os.environ.get("TESTSPRITE_EMPLOYEE_PASSWORD") or os.environ.get("SEED_EMPLOYEE_PASSWORD") or SUPERADMIN_PASSWORD
TIMEOUT = int(os.environ.get("TESTSPRITE_TIMEOUT", "30"))
HEADERS = {"Content-Type": "application/json"}

def unique(prefix):
    return f"{prefix}_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"

def unwrap(response):
    data = response.json()
    return data.get("data", data)

def unwrap_user(payload):
    data = unwrap(payload) if hasattr(payload, "json") else payload
    return data.get("user", data)

def login_session(email=SUPERADMIN_EMAIL, password=SUPERADMIN_PASSWORD):
    session = requests.Session()
    response = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 200, f"Login failed: {response.status_code} {response.text}"
    assert response.cookies or session.cookies, "Auth cookie missing after login"
    return session, unwrap_user(response)

def public_register(username=None, email=None, password="Password123!"):
    name = username or unique("public_user")
    address = email or f"{name}@example.com"
    response = requests.post(
        f"{BASE_URL}/api/auth/public-register",
        json={"username": name, "email": address, "password": password},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert response.status_code == 200, f"Public register failed: {response.status_code} {response.text}"
    return unwrap(response), password

def logout_session(session):
    response = session.post(f"{BASE_URL}/api/auth/logout", timeout=TIMEOUT)
    assert response.status_code in (200, 401), f"Unexpected logout status: {response.status_code} {response.text}"
    return response
