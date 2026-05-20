import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
TIMEOUT = 30

# Credentials for a deterministic seeded active user in local environment (adjust as needed)
TEST_USER_EMAIL = "superadmin@local.test"
TEST_USER_PASSWORD = "Superadmin123!"

def test_postapiauthlogoutclearauthcookie():
    session = requests.Session()
    try:
        # Step 1: Login to get valid auth cookie
        login_payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        login_response = session.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        # Confirm auth cookie is set
        auth_cookies = session.cookies.get_dict()
        assert auth_cookies, "No cookies set after login"
        # Step 2: Call logout endpoint with auth cookie
        logout_response = session.post(
            BASE_URL + LOGOUT_ENDPOINT,
            timeout=TIMEOUT
        )
        assert logout_response.status_code == 200, f"Logout failed: {logout_response.text}"
        # Check if auth cookie cleared in subsequent responses
        # Usually logout sets cookie with expired flag; verify cookie expired or removed
        logout_cookies = logout_response.cookies.get_dict()
        # If logout cookie absent or overwritten as expired, the auth cookie should be cleared
        # Since logout clears httpOnly cookie, the response should set cookie header to clear it
        # We'll verify by trying to access /api/auth/profile should fail with 401 after logout
        profile_response = session.get(
            BASE_URL + "/api/auth/profile",
            timeout=TIMEOUT
        )
        assert profile_response.status_code == 401, "Auth cookie not cleared after logout"
    finally:
        session.close()

test_postapiauthlogoutclearauthcookie()