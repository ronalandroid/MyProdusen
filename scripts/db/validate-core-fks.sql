-- Validates the NOT VALID core FKs from migration 0042 (issue #16).
-- PREREQUISITE: scripts/db/check-fk-orphans.sql must report zero orphans,
-- or every VALIDATE below fails. Each VALIDATE takes a share-update lock
-- and scans the table — run during a maintenance window.
--
-- Usage: psql "$DATABASE_URL" -f scripts/db/validate-core-fks.sql

ALTER TABLE "Attendance" VALIDATE CONSTRAINT "Attendance_employeeId_fkey";
ALTER TABLE "PayrollItem" VALIDATE CONSTRAINT "PayrollItem_runId_fkey";
ALTER TABLE "PayrollItem" VALIDATE CONSTRAINT "PayrollItem_employeeId_fkey";
ALTER TABLE "LeaveRequest" VALIDATE CONSTRAINT "LeaveRequest_employeeId_fkey";
ALTER TABLE "LeaveBalanceLedger" VALIDATE CONSTRAINT "LeaveBalanceLedger_employeeId_fkey";
