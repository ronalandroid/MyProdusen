from backend_test_helpers import BASE_URL, TIMEOUT, login_session, logout_session


def test_post_api_attendance_check_invalid_data():
    session, _ = login_session()
    invalid_payloads = [
        {},
        {"latitude": 3.5952},
        {"latitude": 999, "longitude": 98.6722, "accuracy": 10, "selfieData": "bad"},
    ]
    for payload in invalid_payloads:
        response = session.post(f"{BASE_URL}/api/attendance/check-in", json=payload, timeout=TIMEOUT)
        assert response.status_code in (400, 422), f"Expected validation failure for {payload}, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is False
    logout_session(session)


if __name__ == "__main__":
    test_post_api_attendance_check_invalid_data()
