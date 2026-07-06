/**
 * Certifies the core foreign keys added NOT VALID in migration 0042 (issue #16).
 *
 * Two-phase, safety-gated:
 *   1. Read-only orphan audit across all five relations.
 *   2. Only if EVERY count is 0, run VALIDATE CONSTRAINT on each FK.
 *      Any orphan aborts before touching a single constraint — the operator
 *      then decides how to resolve the orphans (never blind-deleted here).
 *
 * VALIDATE takes a SHARE UPDATE EXCLUSIVE lock (does not block reads/writes)
 * and is idempotent — re-running on an already-validated FK is a no-op.
 *
 * Usage (inside the app container, DATABASE_URL present):
 *   node scripts/db/validate-core-fks.mjs
 */
import postgres from 'postgres';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required');
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

// [label, child table, child column, parent table, parent column]
const RELATIONS = [
  ['Attendance.employeeId', 'Attendance', 'employeeId', 'Employee', 'id'],
  ['PayrollItem.runId', 'PayrollItem', 'runId', 'PayrollRun', 'id'],
  ['PayrollItem.employeeId', 'PayrollItem', 'employeeId', 'Employee', 'id'],
  ['LeaveRequest.employeeId', 'LeaveRequest', 'employeeId', 'Employee', 'id'],
  ['LeaveBalanceLedger.employeeId', 'LeaveBalanceLedger', 'employeeId', 'Employee', 'id'],
];

const CONSTRAINTS = [
  ['Attendance', 'Attendance_employeeId_fkey'],
  ['PayrollItem', 'PayrollItem_runId_fkey'],
  ['PayrollItem', 'PayrollItem_employeeId_fkey'],
  ['LeaveRequest', 'LeaveRequest_employeeId_fkey'],
  ['LeaveBalanceLedger', 'LeaveBalanceLedger_employeeId_fkey'],
];

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });

try {
  console.log('=== Phase 1: orphan audit (read-only) ===');
  let totalOrphans = 0;
  for (const [label, childTable, childCol, parentTable, parentCol] of RELATIONS) {
    const rows = await sql.unsafe(
      `SELECT count(*)::int AS n FROM "${childTable}" c
       LEFT JOIN "${parentTable}" p ON p."${parentCol}" = c."${childCol}"
       WHERE p."${parentCol}" IS NULL`,
    );
    const n = rows[0].n;
    totalOrphans += n;
    console.log(`  ${label}: ${n} orphan(s)`);
  }

  if (totalOrphans > 0) {
    console.error(`\nABORT: ${totalOrphans} orphan row(s) found. Resolve them before validating; no constraint was touched.`);
    await sql.end();
    process.exit(1);
  }

  console.log('\n=== Phase 2: VALIDATE CONSTRAINT ===');
  for (const [table, constraint] of CONSTRAINTS) {
    await sql.unsafe(`ALTER TABLE "${table}" VALIDATE CONSTRAINT "${constraint}"`);
    console.log(`  validated: ${constraint}`);
  }

  console.log('\nOK: all five core foreign keys validated. Existing rows certified.');
  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('ERROR:', error?.message || error);
  await sql.end().catch(() => {});
  process.exit(1);
}
