#!/usr/bin/env node
import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const year = Number(process.env.LEAVE_BALANCE_YEAR || new Date().getFullYear());
const explicitQuota = process.env.LEAVE_BALANCE_QUOTA ? Number(process.env.LEAVE_BALANCE_QUOTA) : null;
const actor = process.env.LEAVE_BALANCE_ACTOR_USER_ID || 'system:leave-balance-sync';
const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required');
  process.exit(1);
}

if (!Number.isInteger(year) || year < 2000 || year > 2100) {
  console.error('ERROR: LEAVE_BALANCE_YEAR must be a valid year');
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function summarize(entries) {
  return entries.reduce((total, row) => {
    if (['ENTITLEMENT', 'CARRY_FORWARD', 'MANUAL_ADJUSTMENT', 'EXPIRY'].includes(row.transactionType)) {
      return total + Number(row.amount || 0);
    }
    return total;
  }, 0);
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1, onnotice: () => undefined });

try {
  const quota = explicitQuota ?? Number((await sql`select value from "CompanySetting" where key = 'DEFAULT_LEAVE_QUOTA' limit 1`)[0]?.value || 12);
  if (!Number.isFinite(quota) || quota < 0) throw new Error('Leave quota must be a non-negative number');

  const activeEmployees = await sql`select id from "Employee" where status = 'ACTIVE' order by id`;
  let created = 0;
  let adjusted = 0;
  let unchanged = 0;

  await sql.begin(async (tx) => {
    for (const employee of activeEmployees) {
      const entries = await tx`
        select "transactionType", amount
        from "LeaveBalanceLedger"
        where "employeeId" = ${employee.id} and "balanceYear" = ${year}
      `;
      if (entries.length === 0) {
        created += 1;
        if (!dryRun) {
          await tx`
            insert into "LeaveBalanceLedger" (id, "employeeId", "transactionType", amount, "balanceYear", reason, "createdBy")
            values (${id('leave_entitlement')}, ${employee.id}, 'ENTITLEMENT', ${quota}, ${year}, ${`Jatah cuti tahunan ${year}`}, ${actor})
          `;
        }
        continue;
      }

      const currentEntitlement = summarize(entries);
      const delta = quota - currentEntitlement;
      if (delta === 0) {
        unchanged += 1;
        continue;
      }
      adjusted += 1;
      if (!dryRun) {
        await tx`
          insert into "LeaveBalanceLedger" (id, "employeeId", "transactionType", amount, "balanceYear", reason, "createdBy")
          values (${id('leave_adjustment')}, ${employee.id}, 'MANUAL_ADJUSTMENT', ${delta}, ${year}, ${`Sinkron jatah cuti periode ${year} ke ${quota}`}, ${actor})
        `;
      }
    }
  });

  console.log(JSON.stringify({ dryRun, year, quota, activeEmployees: activeEmployees.length, created, adjusted, unchanged }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ERROR: ${message.replace(/postgresql:\/\/[^\s@]+@/g, 'postgresql://[REDACTED]@')}`);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 }).catch(() => undefined);
}
