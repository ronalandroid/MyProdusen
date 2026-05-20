import requests

BASE_URL = "http://localhost:3000/api/auth"
TIMEOUT = 30

# Use a seeded active user credential known for local testing in TestSprite mode
TEST_USER_EMAIL = "active.user@example.com"
TEST_USER_PASSWORD = "TestPassword123!"

def test_getapiauthprofileauthenticateduser():
    session = requests.Session()
    login_url = f"{BASE_URL}/login"
    profile_url = f"{BASE_URL}/profile"

    try:
        # 1. Login to get auth cookie
        login_payload = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        login_response = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_response.status_code == 200, f"Login failed with status {login_response.status_code}"

        # Validate auth cookie set
        auth_cookies = login_response.cookies.get_dict()
        assert any('jwt' in k.lower() or 'auth' in k.lower() for k in auth_cookies.keys()), "Auth cookie not set on login"

        # 2. GET /api/auth/profile with auth cookie - Expect 200 and user profile
        profile_response = session.get(profile_url, timeout=TIMEOUT)
        assert profile_response.status_code == 200, f"Profile request failed with status {profile_response.status_code}"
        profile_json = profile_response.json()
        # Basic assertion that profile contains email matching login user
        assert isinstance(profile_json, dict), "Profile response is not a JSON object"
        assert "email" in profile_json, "Profile missing 'email' field"
        assert profile_json["email"].lower() == TEST_USER_EMAIL.lower(), "Profile email does not match logged in user"

        # 3. GET /api/auth/profile without auth cookie - Expect 401 Unauthorized
        session_no_auth = requests.Session()
        no_auth_response = session_no_auth.get(profile_url, timeout=TIMEOUT)
        assert no_auth_response.status_code == 401, f"Expected 401 without auth cookie but got {no_auth_response.status_code}"

    finally:
        # Logout to clear session if needed (optional cleanup)
        logout_url = f"{BASE_URL}/logout"
        try:
            session.post(logout_url, timeout=TIMEOUT)
        except Exception:
            pass

test_getapiauthprofileauthenticateduser()