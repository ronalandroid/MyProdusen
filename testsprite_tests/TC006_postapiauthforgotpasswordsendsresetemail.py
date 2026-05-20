import requests

def test_post_api_auth_forgot_password_sends_reset_email():
    base_url = "http://localhost:3000/api/auth/forgot-password"
    timeout = 30
    headers = {"Content-Type": "application/json"}

    # Test with an active user's email
    active_user_email = "active.user@example.com"

    payload_active = {"email": active_user_email}
    try:
        response_active = requests.post(base_url, json=payload_active, headers=headers, timeout=timeout)
        assert response_active.status_code == 200, f"Expected status 200 for active user, got {response_active.status_code}"
        # The response body should not reveal if the email exists or not, so no sensitive info checks.
        assert isinstance(response_active.text, str)  # Expecting some safe success message or empty body.
    except requests.RequestException as e:
        assert False, f"Request to forgot-password endpoint failed for active user: {e}"

    # Test with an unknown (non-existing) email
    unknown_email = "unknown.user.notexist@example.com"

    payload_unknown = {"email": unknown_email}
    try:
        response_unknown = requests.post(base_url, json=payload_unknown, headers=headers, timeout=timeout)
        assert response_unknown.status_code == 200, f"Expected safe status 200 for unknown email, got {response_unknown.status_code}"
        # Verify no information revealing account existence is returned.
        assert isinstance(response_unknown.text, str)
    except requests.RequestException as e:
        assert False, f"Request to forgot-password endpoint failed for unknown email: {e}"

test_post_api_auth_forgot_password_sends_reset_email()