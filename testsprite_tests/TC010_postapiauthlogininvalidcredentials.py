import requests

BASE_URL = "http://localhost:3000/api/health"
LOGIN_URL = BASE_URL.rsplit('/', 1)[0] + "/auth/login"
TIMEOUT = 30
HEADERS = {
    "Content-Type": "application/json"
}

def test_postapiauthlogininvalidcredentials():
    # Test 1: Login with incorrect password returns 401 with AUTH_INVALID_CREDENTIALS error
    invalid_password_payload = {
        "email": "active.user@example.com",
        "password": "WrongPassword123!"
    }

    try:
        response = requests.post(
            LOGIN_URL,
            json=invalid_password_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 401, f"Expected status 401, got {response.status_code}"
        json_resp = response.json()
        assert "error" in json_resp, "Response JSON missing 'error' key"
        assert json_resp["error"] == "AUTH_INVALID_CREDENTIALS", f"Expected error 'AUTH_INVALID_CREDENTIALS', got {json_resp['error']}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Test 2: Login with inactive user returns 403 with AUTH_USER_INACTIVE error
    inactive_user_payload = {
        "email": "inactive.user@example.com",
        "password": "CorrectPassword123!"
    }

    try:
        response = requests.post(
            LOGIN_URL,
            json=inactive_user_payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 403, f"Expected status 403, got {response.status_code}"
        json_resp = response.json()
        assert "error" in json_resp, "Response JSON missing 'error' key"
        assert json_resp["error"] == "AUTH_USER_INACTIVE", f"Expected error 'AUTH_USER_INACTIVE', got {json_resp['error']}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_postapiauthlogininvalidcredentials()