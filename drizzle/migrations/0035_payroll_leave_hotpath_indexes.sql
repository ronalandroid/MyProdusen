-- Composite indexes for the payroll/leave/kpi hot paths (audit M1/M2/M3).
-- Each existing single-column index forces Postgres to bitmap-AND multiple
-- scans per employee per run; these composites match the actual WHERE shapes.
-- Pure additive + idempotent (CREATE INDEX IF NOT EXISTS) — safe on deploy,
-- no behavior change, no lock-heavy rewrite of table data.

-- Payroll: getOvertimeData filters employeeId + status='APPROVED' + isPaid=false
-- + overtimeDate BETWEEN period. Composite covers the equality+range prefix.
CREATE INDEX IF NOT EXISTS "OvertimeRequest_employeeId_status_overtimeDate_idx"
  ON "OvertimeRequest" ("employeeId", "status", "overtimeDate");

-- Leave balance: every getBalance/hold/approve/release filters employeeId + balanceYear.
CREATE INDEX IF NOT EXISTS "LeaveBalanceLedger_employeeId_balanceYear_idx"
  ON "LeaveBalanceLedger" ("employeeId", "balanceYear");

-- Leave balance: approveRequest/releaseRejectedRequest look up by leaveRequestId
-- then filter transactionType (REQUEST_HOLD / REQUEST_APPROVED).
CREATE INDEX IF NOT EXISTS "LeaveBalanceLedger_leaveRequestId_transactionType_idx"
  ON "LeaveBalanceLedger" ("leaveRequestId", "transactionType");

-- Payroll bonus: KPI production entries filtered by employeeId + metricType +
-- status + date range (see payroll-calculator date push-down).
CREATE INDEX IF NOT EXISTS "KpiProductionEntry_employeeId_metricType_status_date_idx"
  ON "KpiProductionEntry" ("employeeId", "metricType", "status", "date");
