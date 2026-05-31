import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { authCookieHeader } from './auth-helpers';

const employeeEmail = process.env.E2E_EMPLOYEE_EMAIL || process.env.UAT_EMPLOYEE_A_EMAIL || process.env.UAT_EMPLOYEE_EMAIL;
const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD || process.env.UAT_EMPLOYEE_A_PASSWORD || process.env.UAT_EMPLOYEE_PASSWORD;

async function loginEmployee(page: Page) {
  test.skip(!employeeEmail || !employeePassword, 'Set E2E_EMPLOYEE_EMAIL and E2E_EMPLOYEE_PASSWORD.');

  const response = await page.request.post('/api/auth/login', {
    data: { email: employeeEmail, password: employeePassword },
  });
  if (response.status() === 429) test.skip(true, 'Live login rate limit active. Wait cooldown before credential smoke.');
  expect(response.status(), 'Employee API login must succeed').toBe(200);
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
}

async function expectForbidden(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  expect([401, 403], `${path} must reject unauthorized scope, got ${response.status()}`).toContain(response.status());
  expect(await response.text()).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i);
}

test.describe('Employee staging gate', () => {
  test('employee own pages open and leader pages stay blocked', async ({ page }) => {
    await loginEmployee(page);

    for (const path of ['/dashboard/attendance', '/dashboard/kpi', '/dashboard/profile']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).not.toContainText(/This page could not be found|404|500|Internal Server Error/i);
    }

    await expectForbidden(page.request, '/api/leader/me');
    await expectForbidden(page.request, '/api/leader/team-employees');
    await expectForbidden(page.request, '/api/users');
    await expectForbidden(page.request, '/api/teams');
  });

  test('employee can read own leader-input KPI and cannot mutate KPI', async ({ page }) => {
    await loginEmployee(page);

    const ownKpi = await page.request.get('/api/kpi/production/me', { headers: { Cookie: await authCookieHeader(page) } });
    expect(ownKpi.status(), 'Employee own production KPI endpoint must be available').toBe(200);
    const ownKpiJson = await ownKpi.json();
    expect(ownKpiJson.success).toBe(true);
    expect(Array.isArray(ownKpiJson.data)).toBe(true);
    if (ownKpiJson.data.length > 0) {
      expect(ownKpiJson.data.some((entry: { quantity?: string; source?: string }) => Number(entry.quantity) === 10 && entry.source === 'Diinput oleh Leader')).toBe(true);
    }

    const mutateKpi = await page.request.post('/api/leader/kpi-production', {
      headers: { Cookie: await authCookieHeader(page) },
      data: { employeeId: 'any', teamId: 'any', date: new Date().toISOString().slice(0, 10), metricType: 'production_count', quantity: 1, unit: 'pcs' },
    });
    expect([401, 403], `Employee must not mutate KPI, got ${mutateKpi.status()}`).toContain(mutateKpi.status());
  });
});
