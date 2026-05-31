import { expect, test } from '@playwright/test';
import { authCookieHeader } from './auth-helpers';

const superadminEmail = process.env.E2E_SUPERADMIN_EMAIL;
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD;

async function loginSuperadmin(page: import('@playwright/test').Page) {
  test.skip(!superadminEmail || !superadminPassword, 'Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD.');
  const response = await page.request.post('/api/auth/login', {
    data: { email: superadminEmail, password: superadminPassword },
  });
  if (response.status() === 429) test.skip(true, 'Live login rate limit active. Wait cooldown before credential smoke.');
  expect(response.status(), 'Superadmin API login must succeed').toBe(200);
}

test.describe('MyProdusen staging smoke', () => {
  test('public pages load without horizontal overflow', async ({ page }) => {
    for (const path of ['/', '/login', '/register', '/forgot-password']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveTitle(/MyProdusen|Produsen|HRIS/i, { timeout: 20_000 });
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(hasOverflow, `${path} should not overflow horizontally`).toBe(false);
    }
  });

  test('healthcheck returns ok and hides secrets', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('"status":"ok"');
    expect(text).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i);
  });

  test('superadmin login opens users page when credentials are provided', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run credential login once to avoid live rate limit.');
    await loginSuperadmin(page);
    await page.goto('/dashboard/users', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.getByRole('heading', { name: /Manajemen User & Aktivasi|Pengguna/i })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/forbidden|unauthorized/i);
  });

  test('superadmin verifies UAT team and report access when credentials are provided', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run credential UAT gate once to avoid live rate limit.');
    await loginSuperadmin(page);

    const teamsResponse = await page.request.get('/api/teams', { headers: { Cookie: await authCookieHeader(page) } });
    expect(teamsResponse.status(), 'Superadmin must access teams API').toBe(200);
    const teamsPayload = await teamsResponse.json();
    expect(teamsPayload.success).toBe(true);
    expect(teamsPayload.data.some((team: { name?: string; active?: boolean }) => team.name === 'Cetak' && team.active !== false)).toBe(true);

    await page.goto('/dashboard/users', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('body')).toContainText(/Leader|LEADER/i, { timeout: 15_000 });

    for (const path of ['/dashboard/reports', '/dashboard/kpi']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).not.toContainText(/This page could not be found|404|500|Internal Server Error/i);
    }
  });

  test('non-superadmin PDF endpoint is not public', async ({ request }) => {
    const response = await request.post('/api/reports/pdf', {
      data: { reportType: 'attendance_summary' },
    });
    expect([401, 403], `PDF route must exist and reject unauthenticated access with 401/403, got ${response.status()}`).toContain(response.status());
  });
});
