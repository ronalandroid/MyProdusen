from datetime import datetime, timedelta, UTC
from backend_test_helpers import BASE_URL, EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD, TIMEOUT, login_session, logout_session, unwrap_success


def test_post_ap_leave_create_valid_request():
    session, _ = login_session(EMPLOYEE_EMAIL, EMPLOYEE_PASSWORD)
    start_date = (datetime.now(UTC) + timedelta(days=30)).date().isoformat()
    end_date = (datetime.now(UTC) + timedelta(days=31)).date().isoformat()
    payload = {
        "type": "LEAVE",
        "startDate": start_date,
        "endDate": end_date,
        "reason": "Pengajuan cuti tahunan untuk verifikasi backend lokal",
    }
    response = session.post(f"{BASE_URL}/api/leave", json=payload, timeout=TIMEOUT)
    assert response.status_code == 200, f"Leave creation failed: {response.status_code} {response.text}"
    leave_request = unwrap_success(response)
    assert leave_request["id"]
    assert leave_request["status"] == "PENDING"
    assert leave_request["type"] == "LEAVE"
    logout_session(session)


if __name__ == "__main__":
    test_post_ap_leave_create_valid_request()
