# Phase 2 HRIS Implementation Plan — MyProdusen

**Created:** 2026-05-16  
**Status:** In Progress  
**Goal:** Complete Talenta-like operational depth with payroll readiness

---

## 1. Executive Summary

Phase 2 builds on Phase 1's success to add critical HR operational features that complete the professional HRIS experience. Focus is on payroll readiness, overtime management, and operational controls.

**Phase 1 Completed:** ✅
- Attendance Exception Workflow
- Leave Balance Ledger
- Employee Self-Service Hub
- Action Dashboard
- Enhanced Notifications
- Report Presets

**Phase 2 Objectives:**
1. Payroll Period Lock
2. Overtime Integration
3. HR Leave Balance Adjustment UI
4. Document Center Foundation
5. Asset Management (Basic)

---

## 2. Phase 2 Features

### 2.1 Payroll Period Lock ⭐ HIGH PRIORITY

**Problem:** Attendance and leave data can be modified after payroll is calculated, causing discrepancies.

**Solution:** Implement period locking to protect finalized payroll data.

#### Database Schema

```sql
CREATE TABLE PayrollPeriod (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  startDate TIMESTAMP NOT NULL,
  endDate TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  lockedBy TEXT REFERENCES User(id),
  lockedAt TIMESTAMP,
  lockedReason TEXT,
  createdBy TEXT NOT NULL REFERENCES User(id),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX PayrollPeriod_status_idx ON PayrollPeriod(status);
CREATE INDEX PayrollPeriod_startDate_idx ON PayrollPeriod(startDate);
CREATE INDEX PayrollPeriod_endDate_idx ON PayrollPeriod(endDate);
```

#### Status Flow
- `OPEN` - Can be edited freely
- `PREPARING` - HR is preparing payroll
- `LOCKED` - Cannot be edited (requires override)
- `CLOSED` - Payroll completed

#### Business Rules
- Only Superadmin/Admin HR can lock periods
- Locked periods prevent:
  - Attendance modifications
  - Leave approval/rejection
  - Overtime approval
  - Manual adjustments
- Override requires:
  - Superadmin permission
  - Reason (audit logged)
- Dashboard shows current period status

#### Implementation Tasks
- [ ] Create database migration
- [ ] Create PayrollPeriod service
- [ ] Create API routes (CRUD + lock/unlock)
- [ ] Create frontend period management page
- [ ] Add period status to dashboard
- [ ] Update attendance/leave APIs to check lock
- [ ] Add override functionality
- [ ] Add audit logging

---

### 2.2 Overtime Integration ⭐ HIGH PRIORITY

**Problem:** No formal overtime request and approval workflow.

**Solution:** Implement overtime request system integrated with attendance and payroll.

#### Database Schema

```sql
CREATE TABLE OvertimeRequest (
  id TEXT PRIMARY KEY,
  employeeId TEXT NOT NULL REFERENCES Employee(id),
  attendanceId TEXT REFERENCES Attendance(id),
  overtimeDate DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  durationMinutes INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  approvedBy TEXT REFERENCES User(id),
  approvedAt TIMESTAMP,
  rejectedBy TEXT REFERENCES User(id),
  rejectedAt TIMESTAMP,
  rejectionReason TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX OvertimeRequest_employeeId_idx ON OvertimeRequest(employeeId);
CREATE INDEX OvertimeRequest_status_idx ON OvertimeRequest(status);
CREATE INDEX OvertimeRequest_overtimeDate_idx ON OvertimeRequest(overtimeDate);
```

#### Business Rules
- Employee can request overtime
- Supervisor/Admin HR can approve
- Overtime must be on valid attendance day
- Cannot overlap with regular shift (or requires justification)
- Approved overtime feeds payroll calculation
- Rejection requires reason
- Audit log for all actions

#### Implementation Tasks
- [ ] Create database migration
- [ ] Create OvertimeRequest service
- [ ] Create API routes (CRUD + approve/reject)
- [ ] Create frontend overtime request page
- [ ] Create overtime approval queue
- [ ] Add overtime to dashboard stats
- [ ] Integrate with attendance
- [ ] Add to payroll calculation (placeholder)
- [ ] Add audit logging

---

### 2.3 HR Leave Balance Adjustment UI ⭐ MEDIUM PRIORITY

**Problem:** HR cannot manually adjust leave balance through UI (only via API).

**Solution:** Add UI for HR to adjust leave balance with reason and audit.

#### Features
- Manual adjustment form
- Adjustment types:
  - Add balance (bonus, carry forward)
  - Deduct balance (correction, penalty)
  - Reset balance (new year)
- Required fields:
  - Employee
  - Year
  - Amount (positive or negative)
  - Reason (mandatory)
- Audit trail
- Confirmation dialog

#### Implementation Tasks
- [ ] Create adjustment form component
- [ ] Add to leave balance detail page
- [ ] Add RBAC check (HR/Superadmin only)
- [ ] Add confirmation dialog
- [ ] Integrate with existing API
- [ ] Show adjustment history
- [ ] Add audit logging

---

### 2.4 Document Center Foundation ⭐ MEDIUM PRIORITY

**Problem:** No centralized document storage for employee documents and company policies.

**Solution:** Create basic document center with upload, categorization, and access control.

#### Database Schema

```sql
CREATE TABLE Document (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  fileName TEXT NOT NULL,
  fileSize INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  uploadedBy TEXT NOT NULL REFERENCES User(id),
  visibility TEXT NOT NULL DEFAULT 'PRIVATE',
  employeeId TEXT REFERENCES Employee(id),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX Document_category_idx ON Document(category);
CREATE INDEX Document_employeeId_idx ON Document(employeeId);
CREATE INDEX Document_visibility_idx ON Document(visibility);
```

#### Categories
- `COMPANY_POLICY` - Company policies (visible to all)
- `EMPLOYEE_CONTRACT` - Employment contracts (private)
- `PAYSLIP` - Payslips (private)
- `CERTIFICATE` - Certificates (private)
- `ID_DOCUMENT` - ID documents (private)
- `OTHER` - Other documents

#### Visibility
- `PUBLIC` - All employees can view
- `PRIVATE` - Only employee and HR can view
- `HR_ONLY` - Only HR can view

#### Implementation Tasks
- [ ] Create database migration
- [ ] Create Document service
- [ ] Create API routes (upload, list, download, delete)
- [ ] Create document upload page
- [ ] Create document list page
- [ ] Add document viewer
- [ ] Add RBAC for document access
- [ ] Add file validation and security
- [ ] Add to employee profile
- [ ] Add audit logging

---

### 2.5 Asset Management (Basic) ⭐ LOW PRIORITY

**Problem:** No tracking of company assets assigned to employees.

**Solution:** Basic asset tracking system.

#### Database Schema

```sql
CREATE TABLE Asset (
  id TEXT PRIMARY KEY,
  assetCode TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  purchaseDate DATE,
  purchasePrice DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  assignedTo TEXT REFERENCES Employee(id),
  assignedAt TIMESTAMP,
  assignedBy TEXT REFERENCES User(id),
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX Asset_status_idx ON Asset(status);
CREATE INDEX Asset_assignedTo_idx ON Asset(assignedTo);
CREATE INDEX Asset_category_idx ON Asset(category);
```

#### Categories
- `LAPTOP` - Laptops
- `PHONE` - Mobile phones
- `UNIFORM` - Uniforms
- `EQUIPMENT` - Equipment
- `OTHER` - Other assets

#### Status
- `AVAILABLE` - Available for assignment
- `ASSIGNED` - Assigned to employee
- `MAINTENANCE` - Under maintenance
- `RETIRED` - Retired/disposed

#### Implementation Tasks
- [ ] Create database migration
- [ ] Create Asset service
- [ ] Create API routes (CRUD + assign/return)
- [ ] Create asset management page
- [ ] Create asset assignment page
- [ ] Add to employee profile
- [ ] Add asset history
- [ ] Add audit logging

---

## 3. Implementation Strategy

### Parallel Work Approach

**Wave 1: Database & Backend (Week 1)**
- Agent 1: Payroll Period schema + service
- Agent 2: Overtime schema + service
- Agent 3: Document schema + service
- Agent 4: Asset schema + service

**Wave 2: API Routes (Week 1-2)**
- Agent 1: Payroll Period APIs
- Agent 2: Overtime APIs
- Agent 3: Document APIs
- Agent 4: Asset APIs

**Wave 3: Frontend (Week 2-3)**
- Agent 1: Payroll Period UI
- Agent 2: Overtime UI
- Agent 3: Document Center UI
- Agent 4: Leave Balance Adjustment UI
- Agent 5: Asset Management UI

**Wave 4: Integration & Testing (Week 3-4)**
- Integration testing
- RBAC verification
- Audit log verification
- Documentation updates

---

## 4. Success Criteria

### Payroll Period Lock
- [ ] Periods can be created and locked
- [ ] Locked periods prevent modifications
- [ ] Override requires permission and reason
- [ ] Dashboard shows period status
- [ ] Audit log complete

### Overtime Integration
- [ ] Employees can request overtime
- [ ] Supervisors can approve/reject
- [ ] Overtime appears in dashboard
- [ ] Integration with attendance works
- [ ] Audit log complete

### Leave Balance Adjustment
- [ ] HR can adjust balance via UI
- [ ] Adjustment requires reason
- [ ] Adjustment creates audit log
- [ ] History visible in balance page

### Document Center
- [ ] Documents can be uploaded
- [ ] Documents categorized correctly
- [ ] Access control enforced
- [ ] Employees can view own documents
- [ ] HR can manage all documents

### Asset Management
- [ ] Assets can be created
- [ ] Assets can be assigned to employees
- [ ] Assignment history tracked
- [ ] Employees can view assigned assets

---

## 5. Testing Requirements

### Unit Tests
- Payroll period lock/unlock logic
- Overtime calculation
- Document access control
- Asset assignment logic

### Integration Tests
- Locked period prevents modifications
- Overtime approval workflow
- Document upload and download
- Asset assignment workflow

### Security Tests
- RBAC enforcement on all endpoints
- Document access control
- File upload validation
- Audit logging

---

## 6. Documentation Requirements

- [ ] Update API documentation
- [ ] Create user guides for new features
- [ ] Update deployment guide
- [ ] Update CURRENT_STATE.md
- [ ] Create Phase 2 completion summary

---

## 7. Timeline

**Week 1:** Database + Backend + APIs  
**Week 2:** Frontend UI  
**Week 3:** Integration + Testing  
**Week 4:** Documentation + Deployment

**Total:** 4 weeks for Phase 2 completion

---

## 8. Risks & Mitigation

### Risk: Payroll lock breaks existing workflows
**Mitigation:** Add override mechanism, comprehensive testing

### Risk: File upload security issues
**Mitigation:** Strict validation, virus scanning, size limits

### Risk: Performance impact from new features
**Mitigation:** Database indexes, query optimization, caching

---

## 9. Phase 2 vs Phase 1

**Phase 1 Focus:** Core HRIS features, exception handling, self-service  
**Phase 2 Focus:** Payroll readiness, operational controls, document management

**Phase 1 Delivered:** 6 features, 23 files, 100% complete  
**Phase 2 Target:** 5 features, ~30 files, 4 weeks

---

## 10. Next Steps

1. Review and approve this plan
2. Create database migrations
3. Spawn parallel agents for implementation
4. Begin Wave 1 (Database & Backend)
5. Progress to Wave 2, 3, 4

**Status:** Ready to begin Phase 2 implementation

