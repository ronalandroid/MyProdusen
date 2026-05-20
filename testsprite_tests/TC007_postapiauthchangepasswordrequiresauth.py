import requests

BASE_URL = "http://localhost:3000"
LOGIN_PATH = "/api/auth/login"
CHANGE_PASSWORD_PATH = "/api/auth/change-password"

TEST_USER_EMAIL = "testuser@example.com"
TEST_USER_PASSWORD = "CurrentPass123!"
NEW_PASSWORD = "NewPass123!"

def test_postapiauthchangepasswordrequiresauth():
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})
    timeout = 30

    login_payload = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }

    # Attempt change-password without auth cookie - expect 401
    url_change_password = BASE_URL + CHANGE_PASSWORD_PATH
    payload_change_password = {
        "oldPassword": TEST_USER_PASSWORD,
        "newPassword": NEW_PASSWORD
    }
    response = requests.post(url_change_password, json=payload_change_password, timeout=timeout)
    assert response.status_code == 401, f"Expected 401 Unauthorized without auth cookie, got {response.status_code}"

    # Login to get auth cookie
    url_login = BASE_URL + LOGIN_PATH
    response = session.post(url_login, json=login_payload, timeout=timeout)
    assert response.status_code == 200, f"Login failed with status {response.status_code}"
    assert 'Set-Cookie' in response.headers or session.cookies, "Auth cookie not set after login"

    # Change password with auth cookie - expect success 200
    response = session.post(url_change_password, json=payload_change_password, timeout=timeout)
    assert response.status_code == 200, f"Change password failed with status {response.status_code}"

    # Revert password back to original for test idempotency
    revert_payload = {
        "oldPassword": NEW_PASSWORD,
        "newPassword": TEST_USER_PASSWORD
    }
    response = session.post(url_change_password, json=revert_payload, timeout=timeout)
    assert response.status_code == 200, f"Revert password failed with status {response.status_code}"

test_postapiauthchangepasswordrequiresauth()