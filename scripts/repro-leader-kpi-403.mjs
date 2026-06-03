#!/usr/bin/env node
/**
 * Sanitized live reproduction for the Leader KPI 403.
 *
 * Logs in as the UAT leader against the live base URL, fetches the team roster
 * from /api/leader/team-employees, then attempts /api/leader/kpi-production for
 * an assigned member and for an outside-team employee. Prints ONLY status codes,
 * sanitized error codes/messages, and structural booleans. Never prints
 * credentials, tokens, cookies, or secret-looking values.
 *
 * Usage:
 *   E2E_BASE_URL=https://myprodusen.online \
 *   E2E_LEADER_EMAIL=... E2E_LEADER_PASSWORD=... \
 *   node scripts/repro-leader-kpi-403.mjs
 */

const BASE = (process.env.E2E_BASE_URL || 'https://myprodusen.online').replace(/\/$/, '');
const EMAIL = process.env.E2E_LEADER_EMAIL || process.env.UAT_LEADER_EMAIL;
const PASSWORD = process.env.E2E_LEADER_PASSWORD || process.env.UAT_LEADER_PASSWORD;
const TODAY = new Date().toISOString().slice(0, 10);

const SECRET_RE = /DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\/|Bearer\s+[A-Za-z0-9._-]+|password/i;

function sanitize(value) {
  let text = typeof value === 'string' ? value : JSON.stringify(value);
  if (!text) return text;
  if (SECRET_RE.test(text)) text = text.replace(SECRET_RE, '[REDACTED]');
  return text.length > 400 ? `${text.slice(0, 400)}…` : text;
}

function pickCookies(setCookieHeaders) {
  // node fetch exposes combined set-cookie via getSetCookie() when available
  const cookies = [];
  for (const raw of setCookieHeaders) {
    const pair = raw.split(';')[0];
    if (pair) cookies.push(pair);
  }
  return cookies.join('; ');
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error('SKIP: leader credentials not set in env.');
    process.exit(2);
  }
  console.log(`BASE=${BASE}`);
  console.log(`leader_email_set=${Boolean(EMAIL)} leader_password_set=${Boolean(PASSWORD)}`);

  // 1) login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  console.log(`[login] status=${loginRes.status}`);
  if (loginRes.status === 429) {
    console.error('STOP: login rate-limited (429). Wait for cooldown.');
    process.exit(3);
  }
  if (loginRes.status !== 200) {
    console.error(`STOP: login failed -> ${sanitize(await loginRes.text())}`);
    process.exit(4);
  }
  const setCookie = typeof loginRes.headers.getSetCookie === 'function'
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get('set-cookie')].filter(Boolean);
  const cookieHeader = pickCookies(setCookie);
  console.log(`[login] cookies_received=${setCookie.length}`);

  const authedGet = (path) => fetch(`${BASE}${path}`, { headers: { Cookie: cookieHeader, Origin: BASE, Referer: `${BASE}/dashboard` } });
  const authedPost = (path, data) => fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader, Origin: BASE, Referer: `${BASE}/dashboard` },
    body: JSON.stringify(data),
  });

  // 2) leader/me
  const meRes = await authedGet('/api/leader/me');
  const meJson = await meRes.json().catch(() => ({}));
  console.log(`[me] status=${meRes.status} success=${meJson?.success} teamAssigned=${meJson?.data?.teamAssigned}`);

  // 3) team-employees
  const teamRes = await authedGet('/api/leader/team-employees');
  const teamJson = await teamRes.json().catch(() => ({}));
  console.log(`[team-employees] status=${teamRes.status} success=${teamJson?.success} count=${Array.isArray(teamJson?.data) ? teamJson.data.length : 'n/a'}`);
  if (Array.isArray(teamJson?.data)) {
    teamJson.data.slice(0, 5).forEach((m, i) => {
      console.log(`  member[${i}] id=${m.id} teamId=${m.teamId} teamName=${m.teamName ?? ''} fullName=${m.fullName ?? ''}`);
    });
  }

  const members = Array.isArray(teamJson?.data) ? teamJson.data : [];
  const memberA = members.find((m) => m.fullName === 'Employee UAT A') || members[0];
  const memberB = members.find((m) => m.fullName === 'Employee UAT B') || members[1];

  if (!memberA) {
    console.error('STOP: no assigned team member returned by team-employees.');
    process.exit(5);
  }

  // 4) assigned KPI (the failing case) — entries shape exactly as the E2E test
  const entries = [
    { employeeId: memberA.id, teamId: memberA.teamId, date: TODAY, metricType: 'production_count', quantity: 10, unit: 'pcs' },
  ];
  if (memberB) entries.push({ employeeId: memberB.id, teamId: memberB.teamId, date: TODAY, metricType: 'production_count', quantity: 20, unit: 'pcs' });
  const kpiRes = await authedPost('/api/leader/kpi-production', { entries });
  const kpiText = await kpiRes.text();
  console.log(`[kpi-production assigned] status=${kpiRes.status} body=${sanitize(kpiText)}`);

  // 5) outside-team must stay forbidden
  const outsideRes = await authedPost('/api/leader/kpi-production', {
    employeeId: 'outside-team-employee', teamId: memberA.teamId, date: TODAY, metricType: 'production_count', quantity: 1, unit: 'pcs',
  });
  console.log(`[kpi-production outside] status=${outsideRes.status} body=${sanitize(await outsideRes.text())}`);

  // 6) superadmin endpoints must be forbidden for leader
  for (const path of ['/api/users', '/api/teams']) {
    const r = await authedGet(path);
    console.log(`[forbidden ${path}] status=${r.status}`);
  }

  const assignedOk = kpiRes.status === 200 || kpiRes.status === 201;
  console.log(`RESULT assigned_kpi_ok=${assignedOk}`);
  process.exit(assignedOk ? 0 : 1);
}

main().catch((err) => {
  console.error('REPRO_ERROR', sanitize(err?.message || String(err)));
  process.exit(10);
});
