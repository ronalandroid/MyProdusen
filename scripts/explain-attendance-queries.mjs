#!/usr/bin/env node
/**
 * Smoke-test EXPLAIN ANALYZE for the queries that power dashboards / reports /
 * search. Run against staging:
 *
 *   DATABASE_URL=postgresql://... node scripts/explain-attendance-queries.mjs
 *
 * The script runs each query inside a read-only transaction so it never touches
 * data, and prints the planner output. Look for "Index Scan" / "Bitmap Heap Scan"
 * usage on the indexes added in 0010 / 0011 and on Employee.fullName / nip.
 */

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required');
  process.exit(1);
}

const url = new URL(databaseUrl);
url.searchParams.delete('schema');

const sql = postgres(url.toString(), { max: 1, onnotice: () => undefined });

const queries = [
  {
    name: 'attendance report — month range, status filter',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "Attendance"
      WHERE "checkInTime" >= now() - interval '30 day'
        AND "status" = 'LATE'
      ORDER BY "checkInTime" DESC
      LIMIT 25`,
  },
  {
    name: 'attendance report — single employee window',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "Attendance"
      WHERE "employeeId" = 'sentinel-employee-id'
        AND "checkInTime" >= now() - interval '30 day'
      ORDER BY "checkInTime" DESC
      LIMIT 25`,
  },
  {
    name: 'attendance report — outside geo-fence',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "Attendance"
      WHERE "checkInDistance" > 100
      ORDER BY "checkInTime" DESC
      LIMIT 25`,
  },
  {
    name: 'employee search — ilike fullName',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "Employee"
      WHERE "fullName" ILIKE '%andi%'
         OR "nip" ILIKE '%andi%'
         OR "email" ILIKE '%andi%'
      LIMIT 25`,
  },
  {
    name: 'work-location search — ilike name + address',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "WorkLocation"
      WHERE "name" ILIKE '%pabrik%' OR "address" ILIKE '%pabrik%'`,
  },
  {
    name: 'audit log — recent rows for one user',
    statement: `EXPLAIN (ANALYZE, BUFFERS)
      SELECT * FROM "AuditLog"
      WHERE "userId" = 'sentinel-user-id'
      ORDER BY "createdAt" DESC
      LIMIT 50`,
  },
];

try {
  for (const { name, statement } of queries) {
    console.log(`\n--- ${name} ---`);
    const result = await sql.unsafe(`BEGIN; ${statement}; ROLLBACK;`);
    for (const row of result) {
      const plan = row['QUERY PLAN'] ?? row['query plan'] ?? Object.values(row)[0];
      console.log(plan);
    }
  }
} catch (error) {
  console.error('ERROR:', error.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 }).catch(() => undefined);
}
