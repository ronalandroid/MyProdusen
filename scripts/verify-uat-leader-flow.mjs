import postgres from 'postgres';
import bcrypt from 'bcryptjs';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const REQUIRED_ENV = ['UAT_LEADER_EMAIL', 'UAT_LEADER_PASSWORD', 'UAT_EMPLOYEE_A_EMAIL', 'UAT_EMPLOYEE_A_PASSWORD', 'UAT_EMPLOYEE_B_EMAIL', 'UAT_EMPLOYEE_B_PASSWORD'];
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required');
  process.exit(1);
}
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`ERROR: missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

function email(name) {
  return String(process.env[name]).trim().toLowerCase();
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });

try {
  const rows = await sql`
    with cetak as (
      select id from "Team" where lower(name) = lower('Cetak') and active = true limit 1
    ),
    official_location as (
      select id from "WorkLocation" where id = 'loc_produsen_dimsum_medan_tbm_grup' and "isActive" = true limit 1
    ),
    leader_ready as (
      select u.id user_id, u.password, e.id employee_id
      from "User" u
      join "Employee" e on e."userId" = u.id and e.status = 'ACTIVE'
      join official_location wl on wl.id = e."defaultLocationId"
      join "Shift" s on s.id = e."defaultShiftId" and s."isActive" = true
      join cetak t on true
      join "LeaderAssignment" la on la."leaderUserId" = u.id and la."teamId" = t.id and la.active = true
      where lower(u.email) = ${email('UAT_LEADER_EMAIL')} and u.role = 'LEADER' and u."isActive" = true
      limit 1
    ),
    employee_a_ready as (
      select u.id user_id, u.password, e.id employee_id
      from "User" u
      join "Employee" e on e."userId" = u.id and e.status = 'ACTIVE'
      join official_location wl on wl.id = e."defaultLocationId"
      join "Shift" s on s.id = e."defaultShiftId" and s."isActive" = true
      join cetak t on true
      join "EmployeeTeamAssignment" eta on eta."employeeId" = e.id and eta."teamId" = t.id and eta.active = true
      where lower(u.email) = ${email('UAT_EMPLOYEE_A_EMAIL')} and u.role = 'EMPLOYEE' and u."isActive" = true
      limit 1
    ),
    employee_b_ready as (
      select u.id user_id, u.password, e.id employee_id
      from "User" u
      join "Employee" e on e."userId" = u.id and e.status = 'ACTIVE'
      join official_location wl on wl.id = e."defaultLocationId"
      join "Shift" s on s.id = e."defaultShiftId" and s."isActive" = true
      join cetak t on true
      join "EmployeeTeamAssignment" eta on eta."employeeId" = e.id and eta."teamId" = t.id and eta.active = true
      where lower(u.email) = ${email('UAT_EMPLOYEE_B_EMAIL')} and u.role = 'EMPLOYEE' and u."isActive" = true
      limit 1
    )
    select
      exists(select 1 from official_location) official_location_exists,
      exists(select 1 from cetak) team_cetak_exists,
      exists(select 1 from leader_ready) leader_ready,
      exists(select 1 from employee_a_ready) employee_a_ready,
      exists(select 1 from employee_b_ready) employee_b_ready,
      (select password from leader_ready limit 1) leader_password_hash,
      (select password from employee_a_ready limit 1) employee_a_password_hash,
      (select password from employee_b_ready limit 1) employee_b_password_hash
  `;
  const row = rows[0];
  const result = {
    official_location_exists: row.official_location_exists,
    team_cetak_exists: row.team_cetak_exists,
    leader_ready: row.leader_ready,
    employee_a_ready: row.employee_a_ready,
    employee_b_ready: row.employee_b_ready,
    leader_login_ready: Boolean(row.leader_password_hash) && await bcrypt.compare(process.env.UAT_LEADER_PASSWORD, row.leader_password_hash),
    employee_a_login_ready: Boolean(row.employee_a_password_hash) && await bcrypt.compare(process.env.UAT_EMPLOYEE_A_PASSWORD, row.employee_a_password_hash),
    employee_b_login_ready: Boolean(row.employee_b_password_hash) && await bcrypt.compare(process.env.UAT_EMPLOYEE_B_PASSWORD, row.employee_b_password_hash),
  };
  console.log(JSON.stringify(result, null, 2));
  const failed = Object.entries(result).filter(([, value]) => value !== true);
  if (failed.length > 0) {
    console.error(`UAT Leader flow verification failed: ${failed.map(([key]) => key).join(', ')}`);
    process.exit(1);
  }
  console.log('UAT Leader flow verification passed.');
} finally {
  await sql.end();
}
