import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TIMEOUT = 30

SUPERADMIN_EMAIL = "superadmin@example.com"
SUPERADMIN_PASSWORD = "SuperadminPassword123!"

def login_superadmin():
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": SUPERADMIN_EMAIL,
        "password": SUPERADMIN_PASSWORD
    }
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Superadmin login failed: {resp.status_code} {resp.text}"
    return resp.cookies

def create_user(auth_cookies):
    url = f"{BASE_URL}/auth/public-register"
    unique = str(uuid.uuid4())[:8]
    payload = {
        "username": f"testuser_{unique}",
        "email": f"testuser_{unique}@example.com",
        "password": "UserPass123!"
    }
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    assert resp.status_code in (200, 201), f"User creation failed: {resp.status_code} {resp.text}"

    # Activate user (simulate activation)
    # Since activation token is backend-issued, assume admin can activate user via patch role or DB or skip activation
    # For test purposes, attempt login to get user id or get user list to retrieve user id

    # Login as superadmin to get user list and find created user id
    url_users = f"{BASE_URL}/users"
    resp_users = requests.get(url_users, cookies=auth_cookies, timeout=TIMEOUT)
    assert resp_users.status_code == 200, f"List users failed: {resp_users.status_code} {resp_users.text}"
    users = resp_users.json()
    user = next((u for u in users if u.get("email") == payload["email"]), None)
    assert user is not None, "Created user not found in user list"
    user_id = user.get("id")
    assert user_id is not None, "Created user ID missing"
    return user_id

def delete_employee_profile(user_id, auth_cookies):
    # No explicit delete for employee-profile in PRD, but profile is linked employee record
    # Try to delete employee maybe if such route exists; else do nothing
    url_employee = f"{BASE_URL}/employees/{user_id}"
    requests.delete(url_employee, cookies=auth_cookies, timeout=TIMEOUT)

def test_postapiusersidemployeeprofilecreatesprofile():
    auth_cookies = login_superadmin()

    # Create a user to link employee profile
    user_id = create_user(auth_cookies)

    url_post_profile = f"{BASE_URL}/users/{user_id}/employee-profile"
    try:
        resp = requests.post(url_post_profile, cookies=auth_cookies, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Create employee profile failed: {resp.status_code} {resp.text}"
        json_data = resp.json()
        assert "id" in json_data or isinstance(json_data, dict), "Response missing profile id or proper json dict"
    finally:
        # Cleanup: delete created employee profile if possible
        delete_employee_profile(user_id, auth_cookies)

    # Test 404 for non-existent user id
    non_existent_id = str(uuid.uuid4())
    url_nonexistent = f"{BASE_URL}/users/{non_existent_id}/employee-profile"
    resp_404 = requests.post(url_nonexistent, cookies=auth_cookies, timeout=TIMEOUT)
    assert resp_404.status_code == 404, f"Non-existent user should return 404, got {resp_404.status_code}"

test_postapiusersidemployeeprofilecreatesprofile()
