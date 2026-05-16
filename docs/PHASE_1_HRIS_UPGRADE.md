# Phase 1 HRIS Upgrade Plan — MyProdusen

**Created:** 2026-05-16  
**Status:** In Progress  
**Goal:** Transform MyProdusen from MVP to professional HRIS with Talenta-like operational depth

---

## 1. Executive Summary

Based on competitor research (Mekari Talenta, Gadjian, LinovHR, GreatDay HR), MyProdusen needs strategic upgrades to feel like a proper, complete HRIS system for daily HR operations.

**Current State:** Production-ready MVP with core features ✅  
**Target State:** Professional HRIS with action-oriented workflows, exception handling, employee self-service, and operational depth

**Priority Themes:**
1. Action dashboard (make dashboard useful for daily decisions)
2. Attendance exception workflow (handle GPS drift, outside-radius safely)
3. Employee self-service (reduce HR admin work)
4. Leave balance ledger (avoid manual calculations)
5. Notification inbox (keep approvals visible)
6. Report presets (faster HR reporting)

---

## 2. Phase 1 Scope — Professional MVP Polish

### 2.1 Role-Based Action Dashboard ⭐ HIGH PRIORITY

**Problem:** Current dashboard shows stats but doesn't guide daily work.

**Solution:** Add action-oriented cards per role that answer "what needs my attention today?"

#### Superadmin/Admin HR Dashboard Cards

```txt
✅ Pending Leave Requests (count + link)
✅ Pending Attendance Exceptions (count + link)
✅ Late Employees Today (count + list)
✅ Absent Employees Today (count + list)
✅ Outside Geofence Attempts (count + link)
⏳ Payroll Period Status (open/locked)
⏳ Low KPI Alerts (count + list)
✅ Unread Notifications (count + link)
```

#### Supervisor Dashboard Cards

```txt
✅ Team Attendance Today (present/late/absent)
✅ Team Pending Leave (count + link)
⏳ Team KPI Pending Review (count + link)
✅ Team Late/Absent List (names + time)
✅ Unread Notifications (count + link)
```

#### Employee Dashboard Cards

```txt
✅ Today Attendance Status (checked in/out/not yet)
✅ Assigned Shift (time + location)
⏳ Leave Balance (annual/sick/remaining)
✅ Pending Requests (leave/permission status)
⏳ Latest KPI Score (score + period)
✅ Notifications (unread count + link)
```

#### Implementation Tasks

**Database:**
- ✅ Dashboard stats API already exists (`/api/dashboard/stats`)
- ⏳ Add leave balance calculation query
- ⏳ Add KPI pending review query
- ⏳ Add payroll period status query

**API:**
- ✅ `/api/dashboard/stats` - Enhanced with role-based data
- ⏳ `/api/dashboard/action-queue` - New endpoint for pending actions
- ⏳ `/api/leave/balance/:employeeId` - Leave balance endpoint

**Frontend:**
- ✅ Dashboard cards component exists
- ⏳ Enhance with action queue cards
- ⏳ Add loading/empty/error states
- ⏳ Add click-through to filtered pages
- ⏳ Mobile-responsive card layout

**Acceptance Criteria:**
- [ ] Dashboard respects RBAC (no data leakage)
- [ ] Supervisor sees team data only
- [ ] Employee sees own data only
- [ ] Every card has loading state
- [ ] Every card has empty state
- [ ] Every card has error state
- [ ] Cards link to filtered detail pages
- [ ] Mobile-first responsive design

---

### 2.2 Attendance Exception Queue ⭐ HIGH PRIORITY

**Problem:** Employees blocked when GPS drifts or outside radius. No approval workflow.

**Solution:** Create exception queue for HR/Supervisor to review and approve/reject attendance issues.

#### Exception Types

```txt
OUTSIDE_GEOFENCE - Employee outside work location radius
BAD_GPS_ACCURACY - GPS accuracy > threshold
MISSING_SELFIE - Selfie upload failed
MANUAL_ADJUSTMENT - Employee requests correction
LATE_CORRECTION - Employee requests late time adjustment
MISSING_CHECKOUT - Employee forgot to check out
```

#### Exception Statuses

```txt
PENDING - Waiting for review
APPROVED - Accepted by HR/Supervisor
REJECTED - Denied with reason
CANCELLED - Employee cancelled request
```

#### Database Schema

```sql
CREATE TABLE attendance_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES attendance(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  exception_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  requested_by UUID NOT NULL REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_note TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_exceptions_employee ON attendance_exceptions(employee_id);
CREATE INDEX idx_attendance_exceptions_status ON attendance_exceptions(status);
CREATE INDEX idx_attendance_exceptions_created ON attendance_exceptions(created_at);
```

#### Implementation Tasks

**Database:**
- [ ] Create `attendance_exceptions` table migration
- [ ] Add indexes for performance
- [ ] Add foreign key constraints

**Service Layer:**
- [ ] `createAttendanceException()` - Create new exception
- [ ] `getAttendanceExceptions()` - List with filters (role-based)
- [ ] `approveAttendanceException()` - Approve with audit
- [ ] `rejectAttendanceException()` - Reject with reason + audit
- [ ] `cancelAttendanceException()` - Employee cancels own request

**API Routes:**
- [ ] `GET /api/attendance/exceptions` - List exceptions (RBAC)
- [ ] `POST /api/attendance/exceptions` - Create exception
- [ ] `GET /api/attendance/exceptions/:id` - Get detail
- [ ] `POST /api/attendance/exceptions/:id/approve` - Approve (RBAC)
- [ ] `POST /api/attendance/exceptions/:id/reject` - Reject (RBAC)
- [ ] `DELETE /api/attendance/exceptions/:id` - Cancel (owner only)

**Frontend:**
- [ ] `/dashboard/attendance/exceptions` - Exception queue page
- [ ] Exception list with filters (type, status, date)
- [ ] Exception detail modal
- [ ] Approve/reject form with reason
- [ ] Employee exception request form
- [ ] Notification on status change

**Business Rules:**
- [ ] Supervisor can review team exceptions only
- [ ] Admin HR can review all exceptions
- [ ] Approved exception updates attendance status
- [ ] Rejected exception requires reason
- [ ] Every decision creates audit log
- [ ] Employee notified on approval/rejection

**Acceptance Criteria:**
- [ ] Backend owns approval logic
- [ ] Approved exception updates attendance safely
- [ ] Rejection requires reason
- [ ] Every decision creates audit log
- [ ] Supervisor sees team only
- [ ] HR/Superadmin sees all
- [ ] Employee can view own exceptions
- [ ] Notification sent on status change

---

### 2.3 Leave Balance Ledger ⭐ HIGH PRIORITY

**Problem:** No leave balance tracking. Manual calculation prone to errors.

**Solution:** Implement leave entitlement and balance ledger with transaction history.

#### Leave Balance Transaction Types

```txt
ENTITLEMENT - Annual leave granted
CARRY_FORWARD - Previous year balance carried forward
REQUEST_HOLD - Leave request pending (balance held)
REQUEST_APPROVED - Leave approved (balance deducted)
REQUEST_REJECTED_RELEASE - Leave rejected (balance restored)
MANUAL_ADJUSTMENT - HR manual correction
EXPIRY - Unused leave expired
```

#### Database Schema

```sql
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  year INT NOT NULL,
  leave_type VARCHAR(50) NOT NULL,
  entitlement_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  remaining_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, year, leave_type)
);

CREATE TABLE leave_balance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_balance_id UUID NOT NULL REFERENCES leave_balances(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  transaction_type VARCHAR(50) NOT NULL,
  days DECIMAL(5,2) NOT NULL,
  balance_before DECIMAL(5,2) NOT NULL,
  balance_after DECIMAL(5,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
CREATE INDEX idx_leave_balance_transactions_employee ON leave_balance_transactions(employee_id);
CREATE INDEX idx_leave_balance_transactions_created ON leave_balance_transactions(created_at);
```

#### Implementation Tasks

**Database:**
- [ ] Create `leave_balances` table migration
- [ ] Create `leave_balance_transactions` table migration
- [ ] Add indexes for performance
- [ ] Seed initial balances for existing employees

**Service Layer:**
- [ ] `initializeLeaveBalance()` - Create annual entitlement
- [ ] `getLeaveBalance()` - Get current balance
- [ ] `holdLeaveBalance()` - Hold balance on request
- [ ] `deductLeaveBalance()` - Deduct on approval
- [ ] `releaseLeaveBalance()` - Release on rejection
- [ ] `adjustLeaveBalance()` - Manual adjustment with audit
- [ ] `getLeaveBalanceHistory()` - Transaction history

**API Routes:**
- [ ] `GET /api/leave/balance/:employeeId` - Get balance (RBAC)
- [ ] `GET /api/leave/balance/:employeeId/history` - Transaction history
- [ ] `POST /api/leave/balance/:employeeId/adjust` - Manual adjustment (RBAC)
- [ ] `POST /api/leave/balance/initialize` - Initialize for new employee

**Frontend:**
- [ ] Leave balance widget on employee dashboard
- [ ] Leave balance detail page with history
- [ ] Leave balance adjustment form (HR only)
- [ ] Balance validation on leave request form
- [ ] Balance display on leave approval page

**Business Rules:**
- [ ] Employee can view own balance only
- [ ] Supervisor can view team balance
- [ ] HR can view and adjust all balances
- [ ] Leave request checks available balance
- [ ] Overlapping active leave rejected
- [ ] Approved leave deducts balance
- [ ] Rejected leave restores held balance
- [ ] Manual adjustment requires reason
- [ ] Manual adjustment creates audit log

**Acceptance Criteria:**
- [ ] Employee can view own balance
- [ ] HR can adjust with reason
- [ ] Approved leave reduces balance
- [ ] Rejected leave restores held balance
- [ ] Overlapping active leave is rejected
- [ ] Audit log exists for all adjustments
- [ ] Balance calculation is accurate
- [ ] Transaction history is complete

---

### 2.4 Notification Inbox ⭐ HIGH PRIORITY

**Problem:** Notifications exist but no central inbox. Easy to miss approvals.

**Solution:** Create notification center with read/unread status and action links.

#### Notification Events

```txt
LEAVE_SUBMITTED - Employee submitted leave request
LEAVE_APPROVED - Leave request approved
LEAVE_REJECTED - Leave request rejected
ATTENDANCE_EXCEPTION_SUBMITTED - Exception submitted
ATTENDANCE_EXCEPTION_APPROVED - Exception approved
ATTENDANCE_EXCEPTION_REJECTED - Exception rejected
KPI_ASSIGNED - KPI assigned to employee
KPI_APPROVED - KPI result approved
MANUAL_ATTENDANCE_ADJUSTMENT - Attendance manually adjusted
PAYROLL_PERIOD_LOCKED - Payroll period locked (future)
```

#### Database Schema (Already Exists)

```sql
-- notifications table already exists
-- Need to enhance with:
-- - action_url (link to target)
-- - priority (low/normal/high/urgent)
-- - category (leave/attendance/kpi/system)
```

#### Implementation Tasks

**Database:**
- [ ] Add `action_url` column to notifications
- [ ] Add `priority` column to notifications
- [ ] Add `category` column to notifications
- [ ] Add index on `user_id, read_at`

**Service Layer:**
- [ ] Enhance `createNotification()` with action_url
- [ ] Add `markAllAsRead()` function
- [ ] Add `deleteNotification()` function
- [ ] Add `getUnreadCount()` function

**API Routes:**
- [x] `GET /api/notifications` - List notifications (exists)
- [x] `PATCH /api/notifications/:id/read` - Mark as read (exists)
- [ ] `POST /api/notifications/mark-all-read` - Mark all as read
- [ ] `DELETE /api/notifications/:id` - Delete notification
- [ ] `GET /api/notifications/unread-count` - Get unread count

**Frontend:**
- [x] `/dashboard/notifications` - Notification inbox (exists)
- [ ] Enhance with filters (category, read/unread)
- [ ] Add mark all as read button
- [ ] Add delete notification
- [ ] Add notification badge in header
- [ ] Add real-time notification updates (polling or WebSocket)
- [ ] Add notification sound/toast (optional)

**Business Rules:**
- [ ] User sees own notifications only
- [ ] Admin/Superadmin sees operational alerts
- [ ] Notification links to target record
- [ ] User can mark as read
- [ ] User can delete own notifications
- [ ] System notifications cannot be deleted

**Acceptance Criteria:**
- [ ] User can view own notifications
- [ ] User can mark notification as read
- [ ] User can mark all as read
- [ ] User can delete own notifications
- [ ] Notification links to target record
- [ ] Unread count shows in header badge
- [ ] Admin receives important operational alerts
- [ ] Notification data stored in database

---

### 2.5 Employee Self-Service Hub ⭐ MEDIUM PRIORITY

**Problem:** Employee dashboard exists but not optimized for self-service.

**Solution:** Create employee-focused home page with quick access to common tasks.

#### ESS Hub Sections

```txt
✅ Profile Summary (name, NIP, division, position)
✅ Today Attendance (status, check-in/out time)
✅ Shift Schedule (today + upcoming)
⏳ Leave Balance (annual, sick, remaining)
✅ My Requests (leave, permission, exceptions)
⏳ My KPI (latest score, period, trend)
✅ Notifications (unread count, recent)
⏳ Documents/Payslip (placeholder for future)
```

#### Implementation Tasks

**Frontend:**
- [ ] Redesign `/dashboard` for employee role
- [ ] Add leave balance widget
- [ ] Add KPI summary widget
- [ ] Add quick action buttons (request leave, check-in)
- [ ] Add upcoming shift calendar
- [ ] Mobile-first responsive design
- [ ] Clear empty states for each section

**Business Rules:**
- [ ] Employee cannot access other users' data
- [ ] All data respects row-level security
- [ ] Primary actions visible without scrolling on mobile

**Acceptance Criteria:**
- [ ] Mobile-first design
- [ ] Employee cannot access other users' data
- [ ] Clear empty states
- [ ] Primary actions visible without scrolling on mobile
- [ ] Fast page load (<2s)

---

### 2.6 Report Presets ⭐ MEDIUM PRIORITY

**Problem:** Reports exist but require manual filter setup each time.

**Solution:** Add predefined report templates for common HR needs.

#### Report Presets

```txt
✅ Today Attendance
✅ This Month Attendance
✅ Late Employees This Month
✅ Absent Employees This Month
✅ Leave by Status
⏳ KPI by Period
⏳ Geo-fence Exception Report
⏳ Overtime Report (future)
⏳ Payroll Summary (future)
```

#### Implementation Tasks

**Frontend:**
- [ ] Add report preset dropdown on reports page
- [ ] Pre-fill filters based on preset selection
- [ ] Add "Save as Preset" button for custom filters
- [ ] Add preset management (create, edit, delete)
- [ ] Export file naming includes preset name + date range

**Business Rules:**
- [ ] Export respects RBAC
- [ ] Export creates audit log
- [ ] File names include report name and date range
- [ ] Filters shown before export

**Acceptance Criteria:**
- [ ] Export respects RBAC
- [ ] Export creates audit log
- [ ] File names include report name and date range
- [ ] Filters shown before export
- [ ] Preset saves user time

---

## 3. Implementation Order

### Week 1: Foundation
1. ✅ Review current implementation
2. ⏳ Create database migrations (exceptions, leave balance)
3. ⏳ Enhance notification schema
4. ⏳ Run migrations and test

### Week 2: Backend Services
1. ⏳ Implement attendance exception service
2. ⏳ Implement leave balance service
3. ⏳ Enhance notification service
4. ⏳ Add unit tests

### Week 3: API Routes
1. ⏳ Create attendance exception APIs
2. ⏳ Create leave balance APIs
3. ⏳ Enhance notification APIs
4. ⏳ Add API tests

### Week 4: Frontend - Attendance & Leave
1. ⏳ Build attendance exception queue page
2. ⏳ Build leave balance widgets
3. ⏳ Enhance leave request form with balance check
4. ⏳ Add exception request flow

### Week 5: Frontend - Dashboard & Notifications
1. ⏳ Enhance role-based dashboard cards
2. ⏳ Improve notification inbox
3. ⏳ Add notification badge in header
4. ⏳ Build employee self-service hub

### Week 6: Polish & Testing
1. ⏳ Add report presets
2. ⏳ Mobile responsive testing
3. ⏳ Integration testing
4. ⏳ Security review
5. ⏳ Documentation update

---

## 4. Success Metrics

### User Experience
- [ ] HR opens dashboard and sees today's urgent work
- [ ] Employee can check in/out and understand status without confusion
- [ ] Supervisor can approve team requests quickly
- [ ] HR can export monthly attendance without manual cleanup
- [ ] Leave balance is transparent
- [ ] Sensitive actions are audited

### Technical
- [ ] All APIs have RBAC enforcement
- [ ] All sensitive actions create audit logs
- [ ] Dashboard loads in <2s
- [ ] Mobile pages are responsive
- [ ] No data leakage across roles
- [ ] Database queries are optimized

### Business
- [ ] Reduced HR admin time by 30%
- [ ] Faster approval workflows
- [ ] Fewer attendance disputes
- [ ] Better operational visibility
- [ ] Professional HRIS feel

---

## 5. Testing Requirements

### Attendance Exception
- [ ] Create pending exception
- [ ] Approve exception
- [ ] Reject requires reason
- [ ] Team scope enforcement
- [ ] Audit log created
- [ ] Notification sent

### Leave Balance
- [ ] Entitlement calculation
- [ ] Request hold
- [ ] Approval deduction
- [ ] Rejection release
- [ ] Manual adjustment audit
- [ ] Overlapping leave rejection

### Notification
- [ ] Create notification
- [ ] User reads own notification
- [ ] Cannot read other user's notification
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Unread count accurate

### Dashboard
- [ ] Role data scoping
- [ ] Supervisor team-only data
- [ ] Employee own-only data
- [ ] Action queue accuracy
- [ ] Card click-through works

---

## 6. Documentation Updates

- [ ] Update `CURRENT_STATE.md` with new features
- [ ] Update `INDEX.md` with new docs
- [ ] Create `ATTENDANCE_EXCEPTION_GUIDE.md`
- [ ] Create `LEAVE_BALANCE_GUIDE.md`
- [ ] Update `API_DOCUMENTATION.md`
- [ ] Update `DEPLOYMENT_GUIDE.md` with new migrations
- [ ] Update `SECURITY_REVIEW.md` with new endpoints

---

## 7. Risks & Mitigation

### Risk: Data Migration for Existing Employees
**Mitigation:** Create migration script to initialize leave balances for all active employees with default entitlement.

### Risk: Performance Impact on Dashboard
**Mitigation:** Add database indexes, implement caching, optimize queries, add pagination.

### Risk: Notification Overload
**Mitigation:** Add notification preferences, group similar notifications, add digest mode.

### Risk: Complex Leave Balance Logic
**Mitigation:** Write comprehensive unit tests, add transaction history for debugging, implement rollback mechanism.

---

## 8. Phase 2 Preview (Future)

After Phase 1 stable:
- Payroll period lock
- Overtime-payroll integration
- Document center
- Asset management
- Training records
- WhatsApp notifications
- Face recognition/liveness
- AI HR insight summaries

---

## 9. Definition of Done

Phase 1 is complete when:
- [ ] All database migrations deployed
- [ ] All API routes implemented and tested
- [ ] All frontend pages built and responsive
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review passed
- [ ] Production deployment successful
- [ ] User acceptance testing passed

---

## 10. Next Steps

1. Review and approve this plan
2. Create database migrations
3. Start backend service implementation
4. Build API routes
5. Develop frontend pages
6. Test and iterate
7. Deploy to production

**Estimated Timeline:** 6 weeks  
**Team Required:** 1-2 fullstack developers  
**Priority:** HIGH - Transforms MVP into professional HRIS

