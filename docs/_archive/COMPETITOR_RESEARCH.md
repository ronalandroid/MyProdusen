# Competitor Research — HRIS Benchmark for MyProdusen

**Last updated:** 2026-05-15  
**Scope:** Product benchmark for making MyProdusen feel proper, complete, and competitive with Indonesian HRIS products such as Mekari Talenta, Gadjian, LinovHR, and GreatDay HR.

---

## 1. Executive Summary

MyProdusen should not copy enterprise HRIS products feature-for-feature. It should take the best HRIS patterns and adapt them for Produsen Dimsum Medan: mobile-first attendance, simple HR operations, strong approval workflows, clean dashboards, payroll-ready attendance data, secure documents, and clear role-based access.

The biggest competitor lesson is integration. Mature HRIS products connect employee data, attendance, shift, leave, overtime, payroll, performance, reports, and employee self-service into one workflow. MyProdusen already has many core modules, but needs stronger product polish, richer HR workflows, and better operational readiness.

---

## 2. Competitor Snapshot

| Product | Positioning | Strong Patterns to Learn |
|---|---|---|
| Mekari Talenta | End-to-end cloud HCM for payroll, attendance, HR administration, talent, analytics, and integrations | Integrated attendance-payroll flow, ESS, biometric/liveness direction, flexible shifts, HR analytics, multi-branch readiness |
| Gadjian | Payroll-first HRIS for Indonesian companies with HR operations, ESS, payroll, tax/BPJS, assets, KPI, and analytics | Simple payroll compliance, multilevel approvals, employee mobile app, leave balance, asset tracking, HR analytics |
| LinovHR | Modular HRIS/HCM with cloud/on-prem options and broad talent-management modules | Modular architecture, organization management, time management, payroll, reimbursement, recruitment, competency, career path, LMS |
| GreatDay HR | Mobile HR platform with attendance, payroll, performance, claims, payslip, tasks, and company info | Mobile-first UX, employee hub, attendance widget, payslip access, tasks, company announcements |

---

## 3. Common HRIS Feature Pattern

Best HRIS systems commonly include:

1. Employee master data and organization structure.
2. Employee self-service for profile, attendance, leave, claims, payslip, and documents.
3. Attendance with GPS, selfie/face validation, shift rules, overtime, leave, and payroll sync.
4. Payroll with salary components, deductions, tax/BPJS, payslips, reports, and disbursement.
5. Leave, sick, permission, overtime, reimbursement, and approval workflows.
6. Performance management with KPI/OKR, review, score history, and approval.
7. HR analytics dashboards and exports.
8. Audit trail, notifications, and compliance controls.
9. Integrations with accounting, tax, fingerprint/attendance devices, document signing, or payroll payout services.

---

## 4. Product Gap Analysis for MyProdusen

| Area | Current Direction | Gap vs Mature HRIS | Recommendation |
|---|---|---|---|
| Attendance | GPS + selfie + geofence already core | Need stronger edge-state UX, approval for outside-radius attendance, offline sync clarity, anti-fraud roadmap | Polish mobile attendance flow and add exception approval queue |
| Shift | Basic shift module | Need shift templates, rolling shifts, overnight shift rules, schedule calendar | Add shift scheduling calendar and shift assignment history |
| Leave | Leave/sick/permission exists | Need leave balance, carry-forward, documents, multilevel approval | Add leave balance ledger and attachment validation |
| Payroll | Payroll module exists as enhancement | Need payroll-ready attendance/overtime data, salary components, locked payroll periods | Add payroll period lock and salary component settings |
| KPI | KPI templates/results exist | Need review cycles, calibration, approval notes, score trend | Add KPI period dashboard and review notes |
| ESS | Employee pages exist | Need employee hub: profile update request, documents, payslip, leave balance, notifications | Create employee self-service dashboard |
| Dashboard | Role dashboards exist | Need action-oriented cards: pending approvals, late list, attendance risk, low KPI, export shortcuts | Improve dashboard hierarchy and add priority queues |
| Reports | Basic export exists | Need filtered saved reports, audit for exports, monthly printable summaries | Add report presets and export audit detail |
| Notifications | Basic direction | Need notification center, read/unread, approval reminders | Add notification inbox and reminder rules |
| Security | RBAC, httpOnly cookie, rate limit | Need production secret checks, audit expansion, upload protection, stronger session review | Add security checklist and enforce upload storage rules |
| Deployment | Docker/Coolify target | Need documented backup/restore, volume persistence, migration deploy flow | Add Coolify production runbook |

---

## 5. MyProdusen Should Emulate These Talenta-Like Patterns

### 5.1 Attendance Management

Talenta highlights attendance tied to GPS/geofencing/face recognition, shift management, overtime, leave, and payroll synchronization. MyProdusen should make attendance the strongest daily workflow.

Must-have improvements:

- Mobile-first check-in/check-out page with clear GPS, selfie, radius, shift, and status indicators.
- Exception flow for outside-radius attempts: rejected, pending approval, approved with reason.
- Supervisor/HR queue for attendance adjustments and exceptions.
- Attendance map/history for HR review.
- Daily attendance summary: present, late, absent, leave, sick, outside-radius, pending.
- Attendance data locked after payroll period closes.

### 5.2 Employee Self-Service

Talenta and Gadjian emphasize ESS so employees can handle HR needs without HR admin help. MyProdusen should provide a simple employee hub.

Recommended ESS modules:

- My profile.
- My attendance today.
- My schedule.
- My leave balance.
- My leave/sick/permission requests.
- My KPI score.
- My notifications.
- My documents and payslips if payroll is active.
- Profile update request with HR approval.

### 5.3 Approval Workflow

Mature HRIS products rely on approval layers. MyProdusen should standardize approval behavior across leave, overtime, attendance correction, reimbursement, and KPI approval.

Recommended approval states:

```txt
draft
submitted
pending_supervisor
pending_hr
approved
rejected
cancelled
expired
```

Required approval fields:

```txt
requesterId
approverId
approvalLevel
status
reason
approvedAt
rejectedAt
createdAt
updatedAt
```

### 5.4 Payroll-Ready Data

Even if payroll is not the initial focus, attendance, leave, overtime, and reimbursements should be structured for payroll.

Recommended rules:

- Attendance and overtime feed payroll calculations.
- Payroll periods can be locked.
- Locked periods cannot be edited without Superadmin override and audit reason.
- Salary components are separated into fixed allowance, variable allowance, deduction, overtime, reimbursement, and tax/BPJS placeholder.
- Payslip distribution should be private and auditable.

### 5.5 HR Analytics

Competitors sell HR analytics as a major value. MyProdusen dashboard should become actionable, not just decorative.

Recommended analytics cards:

- Attendance compliance this month.
- Late trend by division.
- Absence risk employees.
- Leave usage by team.
- Overtime cost estimate.
- KPI average by division.
- Top and low performers.
- Pending approvals by age.
- Geo-fence rejected/pending attempts.

---

## 6. UX Standards to Match Mature HRIS

MyProdusen should feel professional but not bloated.

### Navigation

- Clear role-based sidebar.
- Employee-only navigation simplified.
- HR/Admin views grouped by People, Time, Performance, Payroll, Reports, Settings.
- Show pending approval badge counts.

### Dashboard

- First row: urgent work queue.
- Second row: KPI/attendance summaries.
- Third row: trend charts and lists.
- Every card must answer: what happened, why it matters, what action to take.

### Forms

- Use step-by-step forms for complex flows.
- Use inline validation.
- Use clear empty states.
- Use confirmation modal for sensitive actions.
- Never silently fail.

### Mobile Attendance

- Large primary CTA.
- GPS status with accuracy meter.
- Selfie preview.
- Work location radius status.
- Offline/pending sync warning.
- Clear success receipt after check-in/out.

### Tables

- Search, filter, sort, pagination.
- Column visibility for dense HR data.
- Bulk actions only for safe operations.
- Export button visible only for authorized roles.

---

## 7. Priority Roadmap

### Phase A — Make Current MVP Feel Professional

1. Improve dashboard into role-based action center.
2. Polish attendance check-in/check-out UX.
3. Add approval queue pages for HR/Supervisor.
4. Add notification inbox.
5. Add report presets and better export naming.
6. Add empty/loading/error states consistently.

### Phase B — Talenta-Like Operational Depth

1. Add leave balance ledger.
2. Add overtime request and approval into attendance/payroll flow.
3. Add payroll period lock.
4. Add employee self-service hub.
5. Add profile update request workflow.
6. Add document/payslip private storage.

### Phase C — Advanced HRIS Features

1. Recruitment applicant tracking.
2. Asset management.
3. Training/LMS records.
4. Career path and competency matrix.
5. AI insight summaries.
6. Face recognition/liveness validation.
7. WhatsApp notification integration.

---

## 8. Feature Backlog Inspired by Competitors

| Priority | Feature | Why It Matters |
|---|---|---|
| P0 | Attendance exception approval queue | Handles real operational issues: GPS drift, field work, store visit |
| P0 | Leave balance ledger | Prevents leave disputes and manual calculation |
| P0 | Role-based dashboard action queues | Makes dashboard useful for daily HR work |
| P0 | Notification inbox | Keeps approvals and status updates visible |
| P1 | Payroll period lock | Protects payroll integrity |
| P1 | ESS employee hub | Reduces HR admin workload |
| P1 | Report presets | Makes exports fast and consistent |
| P1 | Overtime approval | Connects shift, attendance, and payroll |
| P2 | Document center | Centralizes employee documents and policies |
| P2 | Asset management | Useful for uniforms/devices/equipment |
| P2 | Training records | Supports employee development |
| P3 | AI HR analytics | Future enhancement after clean data exists |

---

## 9. Implementation Guardrails

1. Do not blindly clone Talenta or other products.
2. Prioritize Produsen Dimsum Medan workflows.
3. Keep mobile attendance fast and simple.
4. Keep HR dashboard action-oriented.
5. Add audit logs for all sensitive changes.
6. Keep exports permission-safe.
7. Do not introduce heavy dependencies unless needed.
8. Avoid enterprise bloat before core HR workflows are stable.
9. Keep all documents in `/docs`.
10. Build features behind existing roles and permissions.

---

## 10. Sources

- Mekari Talenta features: https://www.talenta.co/fitur/
- Mekari Talenta attendance management: https://www.talenta.co/fitur/attendance-management/
- Mekari Talenta ESS: https://www.talenta.co/fitur/employee-self-service-ess/
- Mekari Talenta portal / face recognition attendance: https://www.talenta.co/fitur/talenta-portal/
- Mekari Talenta English homepage/features: https://www.talenta.co/en/
- Gadjian features: https://www.gadjian.com/features
- Gadjian mobile/ESS features: https://www.gadjian.com/en/features/hr-mobile-apps
- Gadjian competitor/payroll feature overview: https://www.gadjian.com/blog/2025/08/05/perbandingan-gadjian-vs-kompetitor/
- LinovHR features: https://www.linovhr.com/feature/
- LinovHR English features: https://www.linovhr.com/en/features/
- LinovHR HRIS software overview: https://www.linovhr.com/hris-software/
- LinovHR module FAQ: https://www.linovhr.com/faqs/faq-produk-modul-fitur/
- GreatDay HR public materials: https://greatdayhr.com/wp-content/uploads/2024/05/eBook_02-May.pdf
