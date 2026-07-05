-- Read-only orphan audit for the core FKs (issue #16).
-- Run against production BEFORE scripts/db/validate-core-fks.sql.
-- Every count must be 0; if not, resolve the orphans first (investigate,
-- then archive/delete/reparent by explicit decision — never blindly).
--
-- Usage: psql "$DATABASE_URL" -f scripts/db/check-fk-orphans.sql

SELECT 'Attendance.employeeId' AS relation, count(*) AS orphans
FROM "Attendance" a LEFT JOIN "Employee" e ON e.id = a."employeeId" WHERE e.id IS NULL
UNION ALL
SELECT 'PayrollItem.runId', count(*)
FROM "PayrollItem" p LEFT JOIN "PayrollRun" r ON r.id = p."runId" WHERE r.id IS NULL
UNION ALL
SELECT 'PayrollItem.employeeId', count(*)
FROM "PayrollItem" p LEFT JOIN "Employee" e ON e.id = p."employeeId" WHERE e.id IS NULL
UNION ALL
SELECT 'LeaveRequest.employeeId', count(*)
FROM "LeaveRequest" l LEFT JOIN "Employee" e ON e.id = l."employeeId" WHERE e.id IS NULL
UNION ALL
SELECT 'LeaveBalanceLedger.employeeId', count(*)
FROM "LeaveBalanceLedger" l LEFT JOIN "Employee" e ON e.id = l."employeeId" WHERE e.id IS NULL;
