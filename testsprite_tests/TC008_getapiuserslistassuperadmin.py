from backend_test_helpers import BASE_URL, TIMEOUT, login_session

def test_get_api_users_list_superadmin_user_safe():
    session, _ = login_session()
    response = session.get(f"{BASE_URL}/api/users", timeout=TIMEOUT)
    assert response.status_code == 200, f"Users failed: {response.status_code} {response.text}"
    users = response.json().get("data", [])
    assert isinstance(users, list)
    assert users, "Expected at least one user"
    for user in users:
        assert user["role"] in ("SUPERADMIN", "EMPLOYEE")
        assert "password" not in user

test_get_api_users_list_superadmin_user_safe()
