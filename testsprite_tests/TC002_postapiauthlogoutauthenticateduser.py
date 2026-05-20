from backend_test_helpers import login_session, logout_session

def test_post_api_auth_logout_clears_auth_cookie():
    session, _ = login_session()
    response = logout_session(session)
    assert response.status_code == 200
    set_cookie = response.headers.get("Set-Cookie", response.headers.get("set-cookie", ""))
    assert "myprodusen_token=" in set_cookie
    assert "Max-Age=0" in set_cookie or "expires=" in set_cookie.lower()

test_post_api_auth_logout_clears_auth_cookie()
