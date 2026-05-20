import requests
from backend_test_helpers import BASE_URL, HEADERS, TIMEOUT, SUPERADMIN_EMAIL

def test_post_api_auth_forgot_password_sends_reset_email():
    response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": SUPERADMIN_EMAIL}, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 200, f"Forgot password failed: {response.status_code} {response.text}"
    assert response.json().get("success") is True

test_post_api_auth_forgot_password_sends_reset_email()
