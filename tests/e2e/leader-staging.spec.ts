import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const leaderEmail = process.env.E2E_LEADER_EMAIL || process.env.UAT_LEADER_EMAIL;
const leaderPassword = process.env.E2E_LEADER_PASSWORD || process.env.UAT_LEADER_PASSWORD;
const today = new Date().toISOString().slice(0, 10);

async function loginLeader(page: Page) {
  test.skip(!leaderEmail || !leaderPassword, 'Set E2E_LEADER_EMAIL and E2E_LEADER_PASSWORD.');

  const response = await page.request.post('/api/auth/login', {
    data: { email: leaderEmail, password: leaderPassword },
  });
  if (response.status() === 429) test.skip(true, 'Live login rate limit active. Wait cooldown before credential smoke.');
  expect(response.status(), 'Leader API login must succeed').toBe(200);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
}

async function expectForbidden(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect([401, 403], `${path} must reject unauthorized scope, got ${response.status()}`).toContain(response.status());
  expect(await response.text()).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i);
}

test.describe('Leader staging gate', () => {
  test('leader dashboard, nav, attendance, team, and report pages open', async ({ page }) => {
    await loginLeader(page);

    await expect(page.locator('body')).toContainText(/Beranda/i);
    await expect(page.locator('body')).toContainText(/Absensi/i);
    await expect(page.locator('body')).toContainText(/Input KPI/i);
    await expect(page.locator('body')).toContainText(/Tim/i);
    await expect(page.locator('body')).toContainText(/Akun/i);

    for (const path of ['/dashboard/attendance', '/dashboard/leader/kpi-input', '/dashboard/leader/team', '/dashboard/leader/reports']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).not.toContainText(/This page could not be found|404|500|Internal Server Error/i);
    }
  });

  test('leader APIs enforce team scope and block superadmin pages', async ({ page }) => {
    await loginLeader(page);

    const me = await page.request.get('/api/leader/me');
    expect(me.status(), 'Leader profile API must be available').toBe(200);
    const meJson = await me.json();
    expect(meJson.success).toBe(true);
    expect(meJson.data?.teamAssigned, 'Leader must have assigned team for UAT').toBe(true);

    const teamEmployees = await page.request.get('/api/leader/team-employees');
    expect(teamEmployees.status(), 'Leader team employees API must be available').toBe(200);
    const teamEmployeesJson = await teamEmployees.json();
    expect(teamEmployeesJson.success).toBe(true);
    expect(teamEmployeesJson.data.length, 'Leader team must have at least one employee member for UAT').toBeGreaterThan(0);

    const memberA = teamEmployeesJson.data.find((member: { fullName?: string }) => member.fullName === 'Employee UAT A') || teamEmployeesJson.data[0];
    const memberB = teamEmployeesJson.data.find((member: { fullName?: string }) => member.fullName === 'Employee UAT B') || teamEmployeesJson.data[1];
    expect(memberA, 'Employee A must exist in Leader team').toBeTruthy();
    expect(memberB, 'Employee B must exist in Leader team').toBeTruthy();
    const kpi = await page.request.post('/api/leader/kpi-production', {
      data: { entries: [
        { employeeId: memberA.id, teamId: memberA.teamId, date: today, metricType: 'production_count', quantity: 10, unit: 'pcs' },
        { employeeId: memberB.id, teamId: memberB.teamId, date: today, metricType: 'production_count', quantity: 20, unit: 'pcs' },
      ] },
    });
    expect([200, 201], `Leader must input KPI for assigned employee, got ${kpi.status()}`).toContain(kpi.status());
    const kpiJson = await kpi.json();
    expect(kpiJson.success).toBe(true);

    const outsideTeam = await page.request.post('/api/leader/kpi-production', {
      data: { employeeId: 'outside-team-employee', teamId: memberA.teamId, date: today, metricType: 'production_count', quantity: 1, unit: 'pcs' },
    });
    expect([403, 404, 422], `Leader must not input KPI outside team, got ${outsideTeam.status()}`).toContain(outsideTeam.status());

    await expectForbidden(page.request, '/api/users');
    await expectForbidden(page.request, '/api/teams');
  });
});
