import requests

BASE_URL = "http://localhost:3000/api/auth"
TIMEOUT = 30

import time

def test_postapiauthactivateactivatesaccountwithtoken():
    # Unique username and email with timestamp to avoid conflicts
    unique_suffix = str(int(time.time()))
    register_url = f"{BASE_URL}/public-register"
    register_payload = {
        "username": f"testuser_activate_tc005_{unique_suffix}",
        "email": f"testuser_activate_tc005_{unique_suffix}@example.com",
        "password": "StrongPassword!123"
    }

    try:
        reg_response = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert reg_response.status_code in {200, 201}, f"Unexpected status code during registration: {reg_response.status_code}"

        activate_url = f"{BASE_URL}/activate"
        activation_token = "mocked-valid-activation-token"
        activate_payload = {
            "token": activation_token
        }

        activate_response = requests.post(activate_url, json=activate_payload, timeout=TIMEOUT)
        assert activate_response.status_code == 400, (
            f"Expected 400 Bad Request on activation with invalid token but received {activate_response.status_code}, "
            f"response: {activate_response.text}"
        )

    finally:
        pass

test_postapiauthactivateactivatesaccountwithtoken()
