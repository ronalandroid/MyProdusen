# Backend APIs Testing Guide

## Authentication
First, login to get a token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Save the token from response and use it in subsequent requests:
```bash
TOKEN="your-jwt-token-here"
```

## KPI APIs

### 1. Create KPI Template
```bash
curl -X POST http://localhost:3000/api/kpi/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sales Performance Q1 2026",
    "description": "Quarterly sales KPI template"
  }'
```

### 2. Get All KPI Templates
```bash
curl -X GET "http://localhost:3000/api/kpi/templates?isActive=true" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get KPI Template by ID
```bash
curl -X GET http://localhost:3000/api/kpi/templates/{templateId} \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Update KPI Template
```bash
curl -X PATCH http://localhost:3000/api/kpi/templates/{templateId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Template Name",
    "isActive": true
  }'
```

### 5. Delete KPI Template (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/api/kpi/templates/{templateId} \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Assign KPI to Employee
```bash
curl -X POST http://localhost:3000/api/kpi/assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid",
    "templateId": "template-uuid",
    "period": "2026-05"
  }'
```

### 7. Get KPI Assignments
```bash
# All assignments
curl -X GET http://localhost:3000/api/kpi/assignments \
  -H "Authorization: Bearer $TOKEN"

# Filter by employee
curl -X GET "http://localhost:3000/api/kpi/assignments?employeeId=employee-uuid" \
  -H "Authorization: Bearer $TOKEN"

# Filter by period
curl -X GET "http://localhost:3000/api/kpi/assignments?period=2026-05" \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Submit KPI Result
```bash
curl -X POST http://localhost:3000/api/kpi/results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "employee-uuid",
    "itemId": "kpi-item-uuid",
    "period": "2026-05",
    "actualValue": 85.5,
    "notes": "Good performance this month"
  }'
```

### 9. Get KPI Results
```bash
# All results
curl -X GET http://localhost:3000/api/kpi/results \
  -H "Authorization: Bearer $TOKEN"

# Filter by employee and period
curl -X GET "http://localhost:3000/api/kpi/results?employeeId=employee-uuid&period=2026-05" \
  -H "Authorization: Bearer $TOKEN"

# Filter unapproved results
curl -X GET "http://localhost:3000/api/kpi/results?isApproved=false" \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Get KPI Result by ID
```bash
curl -X GET http://localhost:3000/api/kpi/results/{resultId} \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Update KPI Result
```bash
curl -X PATCH http://localhost:3000/api/kpi/results/{resultId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actualValue": 90.0,
    "notes": "Updated performance data"
  }'
```

### 12. Approve KPI Result
```bash
curl -X POST http://localhost:3000/api/kpi/results/{resultId}/approve \
  -H "Authorization: Bearer $TOKEN"
```

### 13. Get Employee KPI Summary
```bash
curl -X GET "http://localhost:3000/api/kpi/employee/{employeeId}?period=2026-05" \
  -H "Authorization: Bearer $TOKEN"
```

## Reports/Export APIs

### 14. Attendance Report
```bash
# JSON format
curl -X GET "http://localhost:3000/api/reports/attendance?from=2026-05-01&to=2026-05-15" \
  -H "Authorization: Bearer $TOKEN"

# CSV export
curl -X GET "http://localhost:3000/api/reports/attendance?from=2026-05-01&to=2026-05-15&format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o attendance-report.csv
```

### 15. Leave Report
```bash
# JSON format
curl -X GET "http://localhost:3000/api/reports/leave?from=2026-05-01&to=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"

# CSV export with status filter
curl -X GET "http://localhost:3000/api/reports/leave?status=APPROVED&format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o leave-report.csv
```

### 16. KPI Report
```bash
# JSON format
curl -X GET "http://localhost:3000/api/reports/kpi?period=2026-05" \
  -H "Authorization: Bearer $TOKEN"

# CSV export
curl -X GET "http://localhost:3000/api/reports/kpi?period=2026-05&format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o kpi-report.csv
```

### 17. Employees Report
```bash
# JSON format - all employees
curl -X GET http://localhost:3000/api/reports/employees \
  -H "Authorization: Bearer $TOKEN"

# CSV export - active employees only
curl -X GET "http://localhost:3000/api/reports/employees?status=ACTIVE&format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o employees-report.csv
```

## Audit Log APIs

### 18. Get Audit Logs (SUPERADMIN only)
```bash
# All logs
curl -X GET http://localhost:3000/api/audit \
  -H "Authorization: Bearer $TOKEN"

# Filter by user
curl -X GET "http://localhost:3000/api/audit?userId=user-uuid" \
  -H "Authorization: Bearer $TOKEN"

# Filter by entity and action
curl -X GET "http://localhost:3000/api/audit?entity=Attendance&action=ADJUST" \
  -H "Authorization: Bearer $TOKEN"

# Filter by date range
curl -X GET "http://localhost:3000/api/audit?from=2026-05-01&to=2026-05-15&limit=100" \
  -H "Authorization: Bearer $TOKEN"
```

## Attendance Manual Adjustment API

### 19. Adjust Attendance (SUPERADMIN/ADMIN_HR only)
```bash
curl -X PATCH http://localhost:3000/api/attendance/{attendanceId}/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkInTime": "2026-05-15T08:00:00Z",
    "checkOutTime": "2026-05-15T17:00:00Z",
    "status": "PRESENT",
    "lateMinutes": 0,
    "totalWorkMinutes": 540,
    "reason": "System error during check-in, manually adjusted based on CCTV footage"
  }'
```

## Dashboard Aggregation API

### 20. Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

Response example:
```json
{
  "success": true,
  "data": {
    "totalEmployees": 50,
    "todayAttendance": 45,
    "attendanceRate": 90,
    "lateToday": 5,
    "absentToday": 3,
    "onLeaveToday": 2,
    "pendingLeaves": 8,
    "pendingKpiApprovals": 12,
    "date": "2026-05-15T00:00:00.000Z"
  }
}
```

## Role-Based Access Control

### Access Matrix

| Endpoint | SUPERADMIN | ADMIN_HR | SUPERVISOR | EMPLOYEE |
|----------|------------|----------|------------|----------|
| KPI Templates (GET) | ✓ | ✓ | ✓ | ✗ |
| KPI Templates (POST/PATCH/DELETE) | ✓ | ✓ | ✗ | ✗ |
| KPI Assignments (GET) | ✓ | ✓ | ✓ | Own only |
| KPI Assignments (POST) | ✓ | ✓ | ✓ | ✗ |
| KPI Results (GET) | ✓ | ✓ | ✓ | Own only |
| KPI Results (POST/PATCH) | ✓ | ✓ | ✓ | ✗ |
| KPI Results Approve | ✓ | ✓ | ✗ | ✗ |
| Reports | ✓ | ✓ | ✓ | ✗ |
| Audit Logs | ✓ | ✗ | ✗ | ✗ |
| Attendance Adjust | ✓ | ✓ | ✗ | ✗ |
| Dashboard Stats | ✓ | ✓ | ✓ | ✗ |

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Anda tidak memiliki akses"
}
```

### 422 Validation Error
```json
{
  "success": false,
  "error": "Nama template wajib diisi"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "KPI sudah di-assign untuk periode ini"
}
```
