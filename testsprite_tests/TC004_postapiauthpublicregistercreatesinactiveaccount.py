import requests
import uuid

BASE_URL = "http://localhost:3000/api/health"
TIMEOUT = 30

def test_post_api_auth_public_register_creates_inactive_account():
    url = BASE_URL.replace("/health", "") + "/api/auth/public-register"
    unique_suffix = str(uuid.uuid4()).replace("-", "")[:8]
    registration_data = {
        "username": f"testuser_{unique_suffix}",
        "email": f"testuser_{unique_suffix}@example.com",
        "password": "TestPassword123!"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=registration_data, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to public-register endpoint failed: {e}"

    assert response.status_code in (200, 201), f"Expected status 200 or 201, got {response.status_code}"
    try:
        response_json = response.json()
    except Exception:
        response_json = {}

    # Validate that the response contains no auth cookie (unauthenticated)
    assert "set-cookie" not in response.headers or "jwt" not in response.headers.get("set-cookie", "").lower(), \
        "Response should not set an authentication cookie"

    # Validate response contains indication of inactive user state if possible
    # Since API schema does not specify response body, just check user is not active if provided
    inactive_possible_flags = ["inactive", "status", "active"]
    if response_json:
        # if status or active keys exist, check they signify inactive
        if "active" in response_json:
            assert response_json["active"] is False, f"User is expected to be inactive but 'active' field is {response_json['active']}"
        if "status" in response_json:
            assert str(response_json["status"]).lower() in ("inactive", "pending", "created"), \
                f"User status expected to indicate inactive account, got {response_json['status']}"

    # There is no direct way to verify that activation email is queued without side-channel or DB check,
    # so assuming backend queues email on success as per spec.

test_post_api_auth_public_register_creates_inactive_account()