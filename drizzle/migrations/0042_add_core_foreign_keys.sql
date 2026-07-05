-- Core foreign keys on attendance/payroll/leave child tables (issue #16).
--
-- Added as NOT VALID: existing rows are NOT scanned (instant, lock-light,
-- cannot fail on legacy orphans), but every NEW insert/update is enforced
-- from this migration onward. To also certify existing rows, run
-- scripts/db/check-fk-orphans.sql first (must return zero rows), then
-- scripts/db/validate-core-fks.sql during a maintenance window.
--
-- Guarded with pg_constraint checks because Postgres has no
-- ADD CONSTRAINT IF NOT EXISTS.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Attendance_employeeId_fkey') THEN
    ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PayrollItem_runId_fkey') THEN
    ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_runId_fkey"
      FOREIGN KEY ("runId") REFERENCES "PayrollRun"(id) ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PayrollItem_employeeId_fkey') THEN
    ALTER TABLE "PayrollItem" ADD CONSTRAINT "PayrollItem_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveRequest_employeeId_fkey') THEN
    ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE RESTRICT NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LeaveBalanceLedger_employeeId_fkey') THEN
    ALTER TABLE "LeaveBalanceLedger" ADD CONSTRAINT "LeaveBalanceLedger_employeeId_fkey"
      FOREIGN KEY ("employeeId") REFERENCES "Employee"(id) ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;
