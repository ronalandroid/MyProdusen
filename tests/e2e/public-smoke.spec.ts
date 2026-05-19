import { expect, test } from '@playwright/test';

const isExternalLiveBase = /^https?:\/\//i.test(process.env.E2E_BASE_URL || '');

test.describe('MyProdusen public staging smoke', () => {
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

  test('version endpoint returns safe metadata only', async ({ request }) => {
    const response = await request.get('/api/version');
    if (response.status() === 404 && isExternalLiveBase) {
      test.info().annotations.push({ type: 'warning', description: '/api/version missing on live before latest redeploy' });
      return;
    }
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('"appName":"MyProdusen"');
    expect(text).toContain('"status":"ok"');
    expect(text).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|RESEND_API_KEY|SUPERADMIN_PASSWORD|postgresql:\/\//i);
  });

  test('PDF report endpoint is not public', async ({ request }) => {
    const response = await request.post('/api/reports/pdf', {
      data: { reportType: 'attendance_summary' },
    });
    expect([401, 403], `PDF route must exist and reject unauthenticated access with 401/403, got ${response.status()}`).toContain(response.status());
  });

  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.waitForURL(/\/login(?:\?|$)/, { timeout: 20_000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
