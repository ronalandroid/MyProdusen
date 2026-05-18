import { expect, test } from '@playwright/test';

const superadminEmail = process.env.E2E_SUPERADMIN_EMAIL;
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD;

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
    test.skip(!superadminEmail || !superadminPassword, 'Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD.');

    await page.goto('/login');
    await page.getByLabel(/email|username|perusahaan/i).fill(superadminEmail!);
    await page.locator('input[type="password"]').fill(superadminPassword!);
    await page.getByRole('button', { name: /masuk|login/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
    await page.goto('/dashboard/users');
    await expect(page.getByRole('heading', { name: 'Manajemen User & Aktivasi' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(/forbidden|unauthorized/i);
  });

  test('non-superadmin PDF endpoint is not public', async ({ request }) => {
    const response = await request.post('/api/reports/pdf', {
      data: { reportType: 'attendance_summary' },
    });
    expect([401, 403], `PDF route must exist and reject unauthenticated access with 401/403, got ${response.status()}`).toContain(response.status());
  });
});
