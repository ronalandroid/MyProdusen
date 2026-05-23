import postgres from 'postgres';
import bcrypt from 'bcryptjs';

try {
  await import('dotenv/config');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const OFFICIAL_LOCATION = {
  name: 'Produsen Dimsum Medan | TBM GRUP',
  latitude: 3.6009125,
  longitude: 98.6964954,
  radius: 100,
};

const REQUIRED_ENV = [
  'UAT_LEADER_EMAIL',
  'UAT_LEADER_USERNAME',
  'UAT_LEADER_PASSWORD',
  'UAT_EMPLOYEE_A_EMAIL',
  'UAT_EMPLOYEE_A_USERNAME',
  'UAT_EMPLOYEE_A_PASSWORD',
  'UAT_EMPLOYEE_B_EMAIL',
  'UAT_EMPLOYEE_B_USERNAME',
  'UAT_EMPLOYEE_B_PASSWORD',
];

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

for (const name of ['UAT_LEADER_PASSWORD', 'UAT_EMPLOYEE_A_PASSWORD', 'UAT_EMPLOYEE_B_PASSWORD']) {
  if (String(process.env[name]).length < 12) {
    console.error(`ERROR: ${name} must be at least 12 characters`);
    process.exit(1);
  }
}

function normalizeDatabaseUrl(value) {
  const url = new URL(value);
  url.searchParams.delete('schema');
  return url.toString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normEmail(value) {
  return String(value).trim().toLowerCase();
}

function normUsername(value) {
  return String(value).trim();
}

function required(value, label) {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function parseLegacyNip(nip) {
  const match = String(nip || '').match(/^(\d{6})-(\d{4})$/);
  return match ? Number(match[2]) : 0;
}

async function nextNip(tx, joinDate) {
  const year = String(joinDate.getFullYear()).slice(-2);
  const month = String(joinDate.getMonth() + 1).padStart(2, '0');
  const day = String(joinDate.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`;
  const rows = await tx`select nip from "Employee" where nip like ${`${prefix}-%`}`;
  const maxSequence = rows.reduce((max, row) => Math.max(max, parseLegacyNip(row.nip)), 0);
  return `${prefix}-${String(maxSequence + 1).padStart(4, '0')}`;
}

async function ensureLocation(tx) {
  const rows = await tx`
    select id
    from "WorkLocation"
    where name = ${OFFICIAL_LOCATION.name}
      and latitude = ${OFFICIAL_LOCATION.latitude}
      and longitude = ${OFFICIAL_LOCATION.longitude}
      and radius = ${OFFICIAL_LOCATION.radius}
      and "isActive" = true
    limit 1
  `;
  if (rows.length === 0) {
    throw new Error('Official work location missing. Run npm run seed:work-location first.');
  }
  return rows[0];
}

async function ensureShift(tx) {
  const rows = await tx`
    select id
    from "Shift"
    where name = 'Shift UAT Pagi'
    limit 1
  `;
  if (rows.length > 0) {
    await tx`update "Shift" set "startTime" = '08:00', "endTime" = '16:00', "isActive" = true, "updatedAt" = now() where id = ${rows[0].id}`;
    return rows[0];
  }

  const id = 'shift_uat_pagi';
  await tx`
    insert into "Shift" (id, name, "startTime", "endTime", "isActive", "createdAt", "updatedAt")
    values (${id}, 'Shift UAT Pagi', '08:00', '16:00', true, now(), now())
  `;
  return { id };
}

async function ensureTeamCetak(tx, actorUserId) {
  const rows = await tx`select id from "Team" where lower(name) = lower('Cetak') limit 1`;
  if (rows.length > 0) {
    await tx`update "Team" set name = 'Cetak', type = coalesce(type, 'production'), active = true, "updatedAt" = now() where id = ${rows[0].id}`;
    return rows[0];
  }

  const id = 'team_cetak';
  await tx`
    insert into "Team" (id, name, slug, type, description, active, "createdBy", "createdAt", "updatedAt")
    values (${id}, 'Cetak', 'cetak', 'production', 'Tim Cetak Produsen Dimsum Medan', true, ${actorUserId}, now(), now())
  `;
  return { id };
}

async function ensureUser(tx, input) {
  const email = normEmail(input.email);
  const username = normUsername(input.username);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const byEmail = await tx`select id from "User" where lower(email) = ${email} limit 1`;

  if (byEmail.length > 0) {
    const usernameOwner = await tx`select id from "User" where username = ${username} and id <> ${byEmail[0].id} limit 1`;
    if (usernameOwner.length > 0) throw new Error(`Username already belongs to another user: ${username}`);
    const rows = await tx`
      update "User"
      set username = ${username}, password = ${passwordHash}, role = ${input.role}, "isActive" = true, "updatedAt" = now()
      where id = ${byEmail[0].id}
      returning id, email, username, role, "isActive"
    `;
    return rows[0];
  }

  const usernameOwner = await tx`select id from "User" where username = ${username} limit 1`;
  if (usernameOwner.length > 0) throw new Error(`Username already belongs to another user: ${username}`);

  const id = makeId('user');
  const rows = await tx`
    insert into "User" (id, email, username, password, role, "isActive", "createdAt", "updatedAt")
    values (${id}, ${email}, ${username}, ${passwordHash}, ${input.role}, true, now(), now())
    returning id, email, username, role, "isActive"
  `;
  return rows[0];
}

async function ensureEmployee(tx, input) {
  const existing = await tx`select id, nip from "Employee" where "userId" = ${input.userId} limit 1`;
  if (existing.length > 0) {
    const rows = await tx`
      update "Employee"
      set "fullName" = ${input.fullName}, email = ${input.email}, division = ${input.division}, position = ${input.position},
          status = 'ACTIVE', "defaultLocationId" = ${input.defaultLocationId}, "defaultShiftId" = ${input.defaultShiftId}, "updatedAt" = now()
      where id = ${existing[0].id}
      returning id, nip, "userId", "fullName", status, "defaultLocationId", "defaultShiftId"
    `;
    return rows[0];
  }

  const joinDate = new Date();
  const nip = await nextNip(tx, joinDate);
  const id = makeId('emp');
  const rows = await tx`
    insert into "Employee" (id, nip, "userId", "fullName", email, division, position, status, "defaultLocationId", "defaultShiftId", "joinDate", "createdAt", "updatedAt")
    values (${id}, ${nip}, ${input.userId}, ${input.fullName}, ${input.email}, ${input.division}, ${input.position}, 'ACTIVE', ${input.defaultLocationId}, ${input.defaultShiftId}, ${joinDate}, now(), now())
    returning id, nip, "userId", "fullName", status, "defaultLocationId", "defaultShiftId"
  `;
  return rows[0];
}

async function ensureLeaderAssignment(tx, input) {
  const existing = await tx`select id from "LeaderAssignment" where "leaderUserId" = ${input.leaderUserId} and "teamId" = ${input.teamId} limit 1`;
  if (existing.length > 0) {
    await tx`update "LeaderAssignment" set active = true, "createdBy" = coalesce("createdBy", ${input.actorUserId}), "updatedAt" = now() where id = ${existing[0].id}`;
    return existing[0];
  }
  const id = makeId('leader_assignment');
  await tx`
    insert into "LeaderAssignment" (id, "leaderUserId", "teamId", active, "createdBy", "createdAt", "updatedAt")
    values (${id}, ${input.leaderUserId}, ${input.teamId}, true, ${input.actorUserId}, now(), now())
  `;
  return { id };
}

async function ensureEmployeeAssignment(tx, input) {
  const existing = await tx`select id from "EmployeeTeamAssignment" where "employeeId" = ${input.employeeId} and "teamId" = ${input.teamId} limit 1`;
  if (existing.length > 0) {
    await tx`update "EmployeeTeamAssignment" set active = true, "assignedBy" = coalesce("assignedBy", ${input.actorUserId}), "updatedAt" = now() where id = ${existing[0].id}`;
    return existing[0];
  }
  const id = makeId('employee_team_assignment');
  await tx`
    insert into "EmployeeTeamAssignment" (id, "employeeId", "teamId", "assignedBy", active, "createdAt", "updatedAt")
    values (${id}, ${input.employeeId}, ${input.teamId}, ${input.actorUserId}, true, now(), now())
  `;
  return { id };
}

const sql = postgres(normalizeDatabaseUrl(databaseUrl), { max: 1 });

try {
  const result = await sql.begin(async (tx) => {
    const location = await ensureLocation(tx);
    const shift = await ensureShift(tx);
    const team = await ensureTeamCetak(tx, null);

    const leaderUser = await ensureUser(tx, {
      email: process.env.UAT_LEADER_EMAIL,
      username: process.env.UAT_LEADER_USERNAME,
      password: process.env.UAT_LEADER_PASSWORD,
      role: 'LEADER',
    });
    const leaderEmployee = await ensureEmployee(tx, {
      userId: leaderUser.id,
      email: normEmail(process.env.UAT_LEADER_EMAIL),
      fullName: 'Leader UAT Cetak',
      division: 'Cetak',
      position: 'Leader',
      defaultLocationId: location.id,
      defaultShiftId: shift.id,
    });
    await ensureLeaderAssignment(tx, { leaderUserId: leaderUser.id, teamId: team.id, actorUserId: null });

    const employeeAUser = await ensureUser(tx, {
      email: process.env.UAT_EMPLOYEE_A_EMAIL,
      username: process.env.UAT_EMPLOYEE_A_USERNAME,
      password: process.env.UAT_EMPLOYEE_A_PASSWORD,
      role: 'EMPLOYEE',
    });
    const employeeA = await ensureEmployee(tx, {
      userId: employeeAUser.id,
      email: normEmail(process.env.UAT_EMPLOYEE_A_EMAIL),
      fullName: 'Employee UAT A',
      division: 'Cetak',
      position: 'Operator Cetak',
      defaultLocationId: location.id,
      defaultShiftId: shift.id,
    });
    await ensureEmployeeAssignment(tx, { employeeId: employeeA.id, teamId: team.id, actorUserId: null });

    const employeeBUser = await ensureUser(tx, {
      email: process.env.UAT_EMPLOYEE_B_EMAIL,
      username: process.env.UAT_EMPLOYEE_B_USERNAME,
      password: process.env.UAT_EMPLOYEE_B_PASSWORD,
      role: 'EMPLOYEE',
    });
    const employeeB = await ensureEmployee(tx, {
      userId: employeeBUser.id,
      email: normEmail(process.env.UAT_EMPLOYEE_B_EMAIL),
      fullName: 'Employee UAT B',
      division: 'Cetak',
      position: 'Operator Cetak',
      defaultLocationId: location.id,
      defaultShiftId: shift.id,
    });
    await ensureEmployeeAssignment(tx, { employeeId: employeeB.id, teamId: team.id, actorUserId: null });

    return { team: team.id, location: location.id, shift: shift.id, leader: leaderUser.email, employeeA: employeeAUser.email, employeeB: employeeBUser.email };
  });

  console.log('UAT Leader flow setup complete. Passwords were not printed.');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await sql.end();
}
