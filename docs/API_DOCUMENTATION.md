# 🚀 MyProdusen - Complete API Documentation

> Historical API reference. Current source of truth: `docs/CURRENT_STATE.md`, `docs/IMPLEMENTATION_PLAN.md`, and `docs/API_GAP_MATRIX.md`. Verify endpoint availability against `docs/API_GAP_MATRIX.md` before implementation or testing.

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Last Updated:** May 14, 2026 - 15:59 WIB

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Employee Management](#employee-management)
3. [Attendance](#attendance)
4. [Work Locations](#work-locations)
5. [Shifts](#shifts)
6. [Leave Management](#leave-management)
7. [Error Responses](#error-responses)
8. [Status Codes](#status-codes)

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### POST /api/auth/login
Login to get JWT token.

**Request:**
```json
{
  "email": "admin@myprodusen.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "admin@myprodusen.com",
      "username": "superadmin",
      "role": "SUPERADMIN",
      "employee": {...}
    }
  },
  "message": "Login berhasil"
}
```

### POST /api/auth/register
Create new user (Admin only).

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "email": "newuser@myprodusen.com",
  "username": "newuser",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

### GET /api/auth/profile
Get current user profile.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "admin@myprodusen.com",
    "username": "superadmin",
    "role": "SUPERADMIN",
    "isActive": true,
    "employee": {...}
  }
}
```

### POST /api/auth/change-password
Change user password.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

---

## 👥 Employee Management

### GET /api/employees
List all employees with filters.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `status` - Filter by status (ACTIVE, INACTIVE, SUSPENDED)
- `division` - Filter by division
- `supervisorId` - Filter by supervisor
- `search` - Search by name, NIP, or email

**Example:**
```bash
GET /api/employees?status=ACTIVE&division=Produksi
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "nip": "260514-0001",
      "fullName": "John Doe",
      "email": "john@myprodusen.com",
      "division": "Produksi",
      "position": "Operator",
      "status": "ACTIVE",
      "user": {...},
      "supervisor": {...}
    }
  ]
}
```

### POST /api/employees
Create new employee.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@myprodusen.com",
  "phone": "081234567890",
  "address": "Medan",
  "joinDate": "2026-05-14",
  "division": "Produksi",
  "position": "Operator",
  "supervisorId": "...",
  "defaultShiftId": "...",
  "defaultLocationId": "...",
  "username": "johndoe",
  "password": "password123",
  "role": "EMPLOYEE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "nip": "260514-0006",
    "fullName": "John Doe",
    ...
  },
  "message": "Karyawan berhasil dibuat"
}
```

### GET /api/employees/[id]
Get employee by ID.

**Headers:** `Authorization: Bearer TOKEN`

### PUT /api/employees/[id]
Update employee.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "fullName": "John Doe Updated",
  "division": "Quality Control",
  "status": "ACTIVE"
}
```

---

## 📍 Attendance

### POST /api/attendance/check-in
Check-in with GPS and selfie.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "workLocationId": "...",
  "shiftId": "...",
  "latitude": 3.5953,
  "longitude": 98.6723,
  "accuracy": 10.5,
  "selfie": "base64_encoded_image_or_url",
  "deviceInfo": "iPhone 13 Pro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "employeeId": "...",
    "checkInTime": "2026-05-14T08:05:00.000Z",
    "checkInLatitude": 3.5953,
    "checkInLongitude": 98.6723,
    "checkInDistance": 15.2,
    "status": "LATE",
    "lateMinutes": 5,
    "employee": {...},
    "workLocation": {...},
    "shift": {...}
  },
  "message": "Check-in berhasil"
}
```

**Error (Outside Radius):**
```json
{
  "success": false,
  "error": "Anda berada di luar radius lokasi kerja (250m dari lokasi). Radius maksimal: 100m"
}
```

### POST /api/attendance/check-out
Check-out with GPS and selfie.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "attendanceId": "...",
  "latitude": 3.5953,
  "longitude": 98.6723,
  "accuracy": 12.3,
  "selfie": "base64_encoded_image_or_url",
  "deviceInfo": "iPhone 13 Pro"
}
```

### GET /api/attendance/today
Get today's attendance for current user.

**Headers:** `Authorization: Bearer TOKEN`

### GET /api/attendance
List attendance records with filters.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `employeeId` - Filter by employee
- `workLocationId` - Filter by location
- `status` - Filter by status
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)

**Example:**
```bash
GET /api/attendance?startDate=2026-05-01&endDate=2026-05-31&status=LATE
```

---

## 🏢 Work Locations

### GET /api/work-locations
List all work locations.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `includeInactive` - Include inactive locations (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Pabrik Dimsum Medan",
      "address": "Jl. Gatot Subroto No. 123, Medan",
      "latitude": 3.5952,
      "longitude": 98.6722,
      "radius": 100,
      "isActive": true
    }
  ]
}
```

### POST /api/work-locations
Create new work location.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Pabrik Dimsum Medan",
  "address": "Jl. Gatot Subroto No. 123, Medan",
  "latitude": 3.5952,
  "longitude": 98.6722,
  "radius": 100
}
```

### GET /api/work-locations/[id]
Get work location by ID.

**Headers:** `Authorization: Bearer TOKEN`

### PUT /api/work-locations/[id]
Update work location.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Pabrik Dimsum Medan - Updated",
  "radius": 150,
  "isActive": true
}
```

### DELETE /api/work-locations/[id]
Delete or deactivate work location.

**Headers:** `Authorization: Bearer TOKEN`

---

## ⏰ Shifts

### GET /api/shifts
List all shifts.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `includeInactive` - Include inactive shifts (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Shift Pagi",
      "startTime": "08:00",
      "endTime": "16:00",
      "isActive": true
    }
  ]
}
```

### POST /api/shifts
Create new shift.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Shift Pagi",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

### GET /api/shifts/[id]
Get shift by ID.

**Headers:** `Authorization: Bearer TOKEN`

### PUT /api/shifts/[id]
Update shift.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "name": "Shift Pagi - Updated",
  "startTime": "07:30",
  "endTime": "15:30",
  "isActive": true
}
```

### DELETE /api/shifts/[id]
Delete or deactivate shift.

**Headers:** `Authorization: Bearer TOKEN`

---

## 🏖️ Leave Management

### GET /api/leave
List leave requests.

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `employeeId` - Filter by employee (admin/supervisor only)
- `status` - Filter by status (PENDING, APPROVED, REJECTED)
- `type` - Filter by type (LEAVE, SICK, PERMISSION)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "employeeId": "...",
      "type": "LEAVE",
      "startDate": "2026-05-20T00:00:00.000Z",
      "endDate": "2026-05-22T00:00:00.000Z",
      "reason": "Liburan keluarga",
      "status": "PENDING",
      "employee": {...}
    }
  ]
}
```

### POST /api/leave
Create leave request.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "type": "LEAVE",
  "startDate": "2026-05-20",
  "endDate": "2026-05-22",
  "reason": "Liburan keluarga"
}
```

### GET /api/leave/[id]
Get leave request by ID.

**Headers:** `Authorization: Bearer TOKEN`

### POST /api/leave/[id]/approve
Approve leave request.

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Pengajuan berhasil disetujui"
}
```

### POST /api/leave/[id]/reject
Reject leave request.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "reason": "Periode sibuk, tidak bisa memberikan izin"
}
```

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Errors:**
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Validation Error` - Invalid input data
- `400 Bad Request` - General error

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 🧪 Testing Examples

### Complete Flow Example

```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myprodusen.com","password":"admin123"}' \
  | jq -r '.data.token')

# 2. Get employees
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer $TOKEN"

# 3. Get work locations
curl http://localhost:3000/api/work-locations \
  -H "Authorization: Bearer $TOKEN"

# 4. Get shifts
curl http://localhost:3000/api/shifts \
  -H "Authorization: Bearer $TOKEN"

# 5. Check-in
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workLocationId": "YOUR_LOCATION_ID",
    "latitude": 3.5953,
    "longitude": 98.6723,
    "accuracy": 10.5,
    "selfie": "base64_or_url",
    "deviceInfo": "Test Device"
  }'

# 6. Get today's attendance
curl http://localhost:3000/api/attendance/today \
  -H "Authorization: Bearer $TOKEN"

# 7. Create leave request
curl -X POST http://localhost:3000/api/leave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "LEAVE",
    "startDate": "2026-05-20",
    "endDate": "2026-05-22",
    "reason": "Liburan keluarga"
  }'
```

---

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. Dates can be provided as strings (YYYY-MM-DD) or ISO date strings
3. GPS coordinates must be valid latitude (-90 to 90) and longitude (-180 to 180)
4. Selfie can be base64 encoded image or URL (file upload to be implemented)
5. All list endpoints support pagination (to be implemented)

---

**Last Updated:** May 14, 2026 - 15:59 WIB  
**Status:** Historical API reference; current gaps tracked in `docs/API_GAP_MATRIX.md`  
**Version:** 1.0

---

*Built with ❤️ for Produsen Dimsum Medan*
