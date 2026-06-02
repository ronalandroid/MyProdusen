const baseUrl = process.env.E2E_BASE_URL || 'https://myprodusen.online';
const email = process.env.E2E_LEADER_EMAIL || process.env.UAT_LEADER_EMAIL;
const password = process.env.E2E_LEADER_PASSWORD || process.env.UAT_LEADER_PASSWORD;

if (!email || !password) {
  console.error('ERROR: set E2E_LEADER_EMAIL/E2E_LEADER_PASSWORD or UAT_LEADER_EMAIL/UAT_LEADER_PASSWORD');
  process.exit(1);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

function cookieHeader(response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
}

const login = await fetch(new URL('/api/auth/login', baseUrl), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const cookies = cookieHeader(login);
console.log(JSON.stringify({ step: 'login', status: login.status, cookieCount: cookies ? cookies.split(';').length : 0 }));
if (login.status !== 200 || !cookies) process.exit(1);

const teamEmployees = await fetch(new URL('/api/leader/team-employees', baseUrl), {
  headers: { cookie: cookies },
});
const teamEmployeesJson = await readJson(teamEmployees);
const members = Array.isArray(teamEmployeesJson?.data) ? teamEmployeesJson.data : [];
console.log(JSON.stringify({ step: 'team-employees', status: teamEmployees.status, success: teamEmployeesJson?.success === true, memberCount: members.length, memberShapes: members.slice(0, 3).map((member) => ({ hasId: Boolean(member.id), hasTeamId: Boolean(member.teamId), fullName: member.fullName })) }));
if (teamEmployees.status !== 200 || members.length === 0) process.exit(1);

const member = members.find((item) => item.fullName === 'Employee UAT A') || members[0];
const kpi = await fetch(new URL('/api/leader/kpi-production', baseUrl), {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: cookies },
  body: JSON.stringify({ entries: [{ employeeId: member.id, teamId: member.teamId, date: new Date().toISOString().slice(0, 10), metricType: 'production_count', quantity: 10, unit: 'pcs' }] }),
});
const kpiJson = await readJson(kpi);
console.log(JSON.stringify({ step: 'kpi-production-assigned', status: kpi.status, success: kpiJson?.success === true, error: kpiJson?.error || kpiJson?.message || null }));

const outside = await fetch(new URL('/api/leader/kpi-production', baseUrl), {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: cookies },
  body: JSON.stringify({ employeeId: 'outside-team-employee', teamId: member.teamId, date: new Date().toISOString().slice(0, 10), metricType: 'production_count', quantity: 1, unit: 'pcs' }),
});
const outsideJson = await readJson(outside);
console.log(JSON.stringify({ step: 'kpi-production-outside', status: outside.status, success: outsideJson?.success === true, error: outsideJson?.error || outsideJson?.message || null }));

process.exit([200, 201].includes(kpi.status) && [403, 404, 422].includes(outside.status) ? 0 : 1);
