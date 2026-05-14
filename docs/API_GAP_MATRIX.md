# API Gap Matrix

| Area | Current Status | Gap | Priority |
|---|---|---|---|
| Auth | Login/register/profile/change-password exist; login UI wired with interim localStorage token | HttpOnly cookie/server dashboard guard, rate limit | P0 |
| Employee | CRUD routes exist | Team/own row-level scoping, UI wiring, history/audit | P0 |
| NIP | Generator exists | Race-safe uniqueness tests | P1 |
| Work Location | CRUD routes exist | Map picker UI, audit, assignment rules | P1 |
| Shift | CRUD routes exist | Shift assignment UI, overlap rules | P1 |
| Attendance | Check-in/out/list/today exist | Selfie storage, manual adjustment route, unique day constraint, UI wiring | P0 |
| Leave | Request/approve/reject exist | Supervisor team scoping, balance rules | P0 |
| KPI | Schema/util exists | Service and routes missing | P1 |
| Reports | UI page exists | Export endpoints missing | P1 |
| Audit | Schema exists | Write service/routes missing | P0 |
| Notification | Schema exists | Service/routes/UI integration missing | P2 |
| Payroll | Static UI only | Backend not in MVP unless explicitly approved | P2 |
| Health | `/api/health` exists | Add runtime DB checks in deployment monitor | P1 |

## Phantom/Planned Endpoints
- `/api/kpi/*` is planned, not implemented.
- `/api/reports/*` is planned, not implemented.
- `/api/audit/*` is planned, not implemented.
- `/api/notifications/*` is planned, not implemented.
