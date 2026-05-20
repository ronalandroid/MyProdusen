import requests
from backend_test_helpers import BASE_URL, HEADERS, TIMEOUT, public_register

def test_post_api_auth_activate_activates_account_with_token():
    user, password = public_register()
    token = user.get("activationToken")
    assert token, f"Activation token missing from TestSprite compat response: {user}"
    response = requests.post(f"{BASE_URL}/api/auth/activate", json={"token": token}, headers=HEADERS, timeout=TIMEOUT)
    assert response.status_code == 200, f"Activate failed: {response.status_code} {response.text}"
    login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": user["email"], "password": password}, headers=HEADERS, timeout=TIMEOUT)
    assert login.status_code == 200, f"Activated user login failed: {login.status_code} {login.text}"

test_post_api_auth_activate_activates_account_with_token()
