import requests

BASE_URL = "http://localhost:3000"
LOGIN_PATH = "/api/auth/login"
TIMEOUT = 30

def test_post_api_auth_login_valid_credentials():
    url = f"{BASE_URL}{LOGIN_PATH}"
    # Example valid credentials for an active user; these should be adapted for actual local test data
    payload = {
        "email": "active.user@example.com",
        "password": "correct_password"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Assert HTTP 200 OK status
    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    # Assert JWT auth cookie is set and marked httpOnly
    # The cookie will be in the 'Set-Cookie' header(s)
    set_cookie_headers = response.headers.get_all('Set-Cookie') if hasattr(response.headers, 'get_all') else response.headers.get('Set-Cookie')
    assert set_cookie_headers, "No Set-Cookie header found in response"
    cookies = set_cookie_headers if isinstance(set_cookie_headers, list) else [set_cookie_headers]
    jwt_cookie_found = False
    for cookie in cookies:
        if "jwt" in cookie.lower() and "httponly" in cookie.lower():
            jwt_cookie_found = True
            break
    assert jwt_cookie_found, "JWT httpOnly auth cookie not found in response"

    # Assert response body is JSON and contains authenticated user payload with expected keys
    try:
        json_body = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Adjusted expected keys in authenticated user payload
    expected_keys = ["id", "email", "name", "active"]
    for key in expected_keys:
        assert key in json_body, f"Authenticated user payload missing expected key: {key}"

    # Assert user is active
    assert json_body.get("active") is True, "Authenticated user is not active"

test_post_api_auth_login_valid_credentials()