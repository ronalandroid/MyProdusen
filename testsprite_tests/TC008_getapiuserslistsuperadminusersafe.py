import requests

BASE_URL = "http://localhost:3000"
LOGIN_ENDPOINT = "/api/auth/login"
USERS_ENDPOINT = "/api/users"
TIMEOUT = 30

# Predefined Superadmin credentials - these should be deterministic local seed credentials
SUPERADMIN_EMAIL = "superadmin@example.com"
SUPERADMIN_PASSWORD = "SuperadminPassword123!"

def test_get_api_users_list_superadmin_user_safe():
    session = requests.Session()
    try:
        # Authenticate as a Superadmin to get auth cookie
        login_resp = session.post(
            BASE_URL + LOGIN_ENDPOINT,
            json={"email": SUPERADMIN_EMAIL, "password": SUPERADMIN_PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.status_code} {login_resp.text}"

        # Cookies set automatically in session, call GET /api/users
        users_resp = session.get(BASE_URL + USERS_ENDPOINT, timeout=TIMEOUT)
        assert users_resp.status_code == 200, f"GET /api/users failed: {users_resp.status_code} {users_resp.text}"

        users_list = users_resp.json()
        assert isinstance(users_list, list), "Users response is not a list"

        # Check each user only has production-safe roles and expected user fields
        # "production-safe roles" as per PRD means roles exposed via this endpoint only.
        # We'll check for presence of a 'role' field and that it is a string (exact role names unknown, so just type check)
        for user in users_list:
            assert "role" in user, f"User missing 'role' field: {user}"
            assert isinstance(user["role"], str), f"User role is not string: {user['role']}"
            # Further role safety enforcement could be added if role whitelist known,
            # but is not specified so skipped here.

        # Additionally verify presence of essential user fields for production-safe exposure: e.g. id, email, username
        for user in users_list:
            assert "id" in user, f"User missing 'id' field: {user}"
            assert "email" in user, f"User missing 'email' field: {user}"
            assert "username" in user, f"User missing 'username' field: {user}"

    finally:
        # Logout to clear session/auth cookie
        logout_resp = session.post(BASE_URL + "/api/auth/logout", timeout=TIMEOUT)
        # Accept 200 or 401 in case session already invalidated
        assert logout_resp.status_code in (200, 401)

test_get_api_users_list_superadmin_user_safe()