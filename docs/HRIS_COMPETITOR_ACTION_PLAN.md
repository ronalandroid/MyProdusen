# HRIS Competitor Action Plan — MyProdusen

**Last updated:** 2026-05-15  
**Input:** `docs/COMPETITOR_RESEARCH.md`  
**Goal:** Convert competitor learnings into practical MyProdusen work without copying enterprise HRIS bloat.

---

## 1. Product Direction

MyProdusen should become a focused internal HRIS for Produsen Dimsum Medan with Talenta-like professionalism in daily HR operations.

Primary product promise:

```txt
One clean system for employee data, GPS/selfie attendance, leave, KPI, approvals, reports, payroll-ready records, and HR visibility.
```

Do not expand into unrelated enterprise modules until core workflows are stable.

---

## 2. Priority Upgrade Themes

| Theme | Purpose | Result |
|---|---|---|
| Action dashboard | Make dashboard useful for daily HR decisions | HR/Supervisor sees what needs action today |
| Attendance exception workflow | Handle GPS drift, outside-radius attempts, and manual corrections safely | Fewer blocked employees, better audit trail |
| Employee self-service | Reduce HR admin work | Employees can view own data, requests, KPI, notifications |
| Leave balance ledger | Avoid manual leave calculation | Clear remaining leave and audit history |
| Payroll-ready locking | Protect payroll data integrity | Attendance/overtime/reimbursement periods can be closed |
| Notification inbox | Keep approvals visible | Less missed approval/action |
| Report presets | Faster HR reporting | Repeatable exports by period/division/status |

---

## 3. Phase 1 — Professional MVP Polish

### 3.1 Role-Based Action Dashboard

Add action-oriented cards per role.

Superadmin/Admin HR:
- Pending leave requests.
- Pending attendance exceptions.
- Late employees today.
- Absent employees today.
- Outside-geofence attempts.
- Payroll period status.
- Low KPI alerts.

Supervisor:
- Team attendance today.
- Team pending leave.
- Team KPI pending review.
- Team late/absent list.

Employee:
- Today attendance status.
- Assigned shift.
- Leave balance.
- Pending requests.
- Latest KPI score.
- Notifications.

Acceptance criteria:
- Dashboard respects RBAC.
- Dashboard does not leak data across teams.
- Every dashboard card has loading, empty, and error state.
- Cards link to filtered detail pages.

---

### 3.2 Attendance Exception Queue

Create queue for attendance records needing HR/Supervisor action.

Triggers:
- Outside geofence.
- Bad GPS accuracy.
- Missing selfie.
- Manual adjustment request.
- Late correction request.
- Checkout missing.

Fields:

```txt
attendanceId
employeeId
type
status
reason
requestedBy
reviewedBy
reviewNote
createdAt
reviewedAt
```

Statuses:

```txt
pending
approved
rejected
cancelled
```

Acceptance criteria:
- Backend owns approval logic.
- Approved exception updates attendance status safely.
- Rejection requires reason.
- Every decision creates audit log.
- Supervisor sees team only.
- HR/Superadmin sees all.

---

### 3.3 Notification Inbox

Add notification center for operational actions.

Events:
- Leave submitted.
- Leave approved/rejected.
- Attendance exception submitted.
- Attendance exception approved/rejected.
- KPI assigned.
- KPI approved.
- Payroll period locked if payroll enabled.

Acceptance criteria:
- User sees own notifications only.
- Admin/Superadmin sees operational alerts.
- User can mark as read.
- Notification links to target record.

---

## 4. Phase 2 — Talenta-Like Core HR Depth

### 4.1 Leave Balance Ledger

Add annual leave entitlement and balance tracking.

Ledger transaction types:

```txt
entitlement
carry_forward
request_hold
request_approved
request_rejected_release
manual_adjustment
expiry
```

Acceptance criteria:
- Employee can view own balance.
- HR can adjust with reason.
- Approved leave reduces balance.
- Rejected leave restores held balance.
- Overlapping active leave is rejected.
- Audit log exists for all adjustments.

---

### 4.2 Employee Self-Service Hub

Create employee-focused home page.

Sections:
- Profile summary.
- Today attendance.
- Shift schedule.
- Leave balance.
- My requests.
- My KPI.
- Notifications.
- Documents/payslip placeholder.

Acceptance criteria:
- Mobile-first.
- Employee cannot access other users' data.
- Clear empty states.
- Primary actions visible without scrolling on mobile.

---

### 4.3 Report Presets

Add predefined filters for common HR reports.

Presets:
- Today attendance.
- This month attendance.
- Late employees this month.
- Absent employees this month.
- Leave by status.
- KPI by period.
- Geo-fence exception report.

Acceptance criteria:
- Export respects RBAC.
- Export creates audit log.
- File names include report name and date range.
- Filters shown before export.

---

## 5. Phase 3 — Payroll Readiness

### 5.1 Payroll Period Lock

Add close/lock behavior for attendance/payroll period.

Rules:
- HR can prepare payroll period.
- Superadmin/Admin HR can lock period.
- Locked records cannot be edited without override reason.
- Override creates audit log.
- Dashboard shows open/locked period status.

Acceptance criteria:
- Locked period protects attendance, overtime, reimbursement, and payroll calculations.
- Manual override requires Superadmin or configured permission.
- Reports show locked state.

---

### 5.2 Overtime Integration

Connect overtime request to shift/attendance/payroll.

Rules:
- Employee requests overtime.
- Supervisor/Admin HR approves.
- Approved overtime can feed payroll calculation.
- Rejection requires reason.
- Audit log for approval/rejection.

Acceptance criteria:
- Overtime request cannot overlap invalid attendance day unless HR override.
- Supervisor sees team only.
- Employee sees own only.

---

## 6. Phase 4 — Advanced HRIS Later

Do only after Phase 1–3 stable.

Backlog:
- Document center.
- Asset management.
- Training records.
- Recruitment pipeline.
- WhatsApp notifications.
- Face recognition/liveness.
- AI HR insight summaries.

---

## 7. Suggested Implementation Order

1. Dashboard action cards.
2. Attendance exception data model/API/UI.
3. Notification inbox data model/API/UI.
4. Leave balance ledger.
5. Employee self-service hub.
6. Report presets and audit export.
7. Payroll period lock.
8. Overtime-payroll integration.

Reason:
- Dashboard and exception queue improve daily usability fastest.
- Notification supports all later approval workflows.
- Leave balance and payroll lock require stronger data integrity.

---

## 8. Testing Requirements

Add tests before marking each module ready.

Dashboard:
- Role data scoping.
- Supervisor team-only data.
- Employee own-only data.

Attendance exception:
- Create pending exception.
- Approve exception.
- Reject requires reason.
- Team scope enforcement.
- Audit log created.

Notification:
- Create notification.
- User reads own notification.
- Cannot read other user's notification.

Leave balance:
- Entitlement calculation.
- Request hold.
- Approval deduction.
- Rejection release.
- Manual adjustment audit.

Payroll lock:
- Lock period.
- Reject edit after lock.
- Allow authorized override with reason.
- Audit log created.

---

## 9. Do Not Build Yet

Avoid these until core data is clean:

- AI insight.
- Native mobile app.
- Face recognition.
- Recruitment ATS.
- LMS/training module.
- Complex compensation tax engine.

These are valuable later, but premature now.

---

## 10. Definition of Proper HRIS Feel

MyProdusen feels proper when:

1. HR opens dashboard and sees today's urgent work.
2. Employee can check in/out and understand status without confusion.
3. Supervisor can approve team requests quickly.
4. HR can export monthly attendance without manual cleanup.
5. Leave balance is transparent.
6. Payroll inputs are protected after period lock.
7. Sensitive actions are audited.
8. Mobile pages feel fast and clear.
9. Empty/error/loading states are polished.
10. Product stays focused on Produsen Dimsum Medan operations.
