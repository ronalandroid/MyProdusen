from backend_test_helpers import BASE_URL, HEADERS, TIMEOUT, login_session

def test_post_api_auth_change_password_authenticated_user():
    session, _ = login_session()
    response = session.post(
        f"{BASE_URL}/api/auth/change-password",
        json={"oldPassword": "definitely-wrong", "newPassword": "NewPassword123!"},
        headers=HEADERS,
        timeout=TIMEOUT,
    )
    assert response.status_code == 422, f"Expected validation/wrong password rejection, got {response.status_code} {response.text}"
    body = response.json()
    assert body.get("success") is False
    assert body.get("code") in ("VALIDATION_ERROR", "AUTH_INVALID_CREDENTIALS") or "Password" in str(body)

test_post_api_auth_change_password_authenticated_user()
