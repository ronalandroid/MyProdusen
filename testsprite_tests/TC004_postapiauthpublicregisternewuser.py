from backend_test_helpers import public_register

def test_post_api_auth_public_register_creates_inactive_account():
    user, _ = public_register()
    assert user["email"].endswith("@example.com")
    assert user["role"] == "EMPLOYEE"
    assert user["isActive"] is False

test_post_api_auth_public_register_creates_inactive_account()
