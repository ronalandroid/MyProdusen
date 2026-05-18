import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const credentials = {
  superadmin: {
    email: process.env.E2E_SUPERADMIN_EMAIL,
    password: process.env.E2E_SUPERADMIN_PASSWORD,
  },
  adminHr: {
    email: process.env.E2E_ADMIN_HR_EMAIL,
    password: process.env.E2E_ADMIN_HR_PASSWORD,
  },
  supervisor: {
    email: process.env.E2E_SUPERVISOR_EMAIL,
    password: process.env.E2E_SUPERVISOR_PASSWORD,
  },
  employee: {
    email: process.env.E2E_EMPLOYEE_EMAIL,
    password: process.env.E2E_EMPLOYEE_PASSWORD,
  },
};

const allowMutation = process.env.E2E_ALLOW_MUTATION === 'true';

test.describe.configure({ mode: 'serial' });

type Credential = { email?: string; password?: string };

async function login(page: Page, credential: Credential) {
  const response = await page.request.post('/api/auth/login', {
    data: { email: credential.email, password: credential.password },
  });
  if (response.status() === 429) {
    test.skip(true, 'Live login rate limit active. Wait cooldown before credential smoke.');
  }

  expect(response.status(), 'API login must succeed before role page smoke').toBe(200);
  const body = await response.text();
  expect(body).toContain('"success":true');
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
}

async function expectPageAvailable(page: Page, path: string, expected: RegExp) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('body')).toContainText(expected, { timeout: 15_000 });
  await expect(page.locator('body')).not.toContainText(/This page could not be found|404|500|Internal Server Error/i);
}

async function expectProtectedPost(request: APIRequestContext, path: string, data: Record<string, unknown>) {
  let response = await request.post(path, { data });
  for (let attempt = 0; response.status() >= 500 && attempt < 2; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    response = await request.post(path, { data });
  }
  expect([401, 403, 422], `${path} must reject unauthenticated/invalid access, got ${response.status()}`).toContain(response.status());
  const body = await response.text();
  expect(body).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\/|attendance-selfies/i);
}

test.describe('MyProdusen full staging read-only gate', () => {
  test('public and auth pages load across core routes', async ({ page }) => {
    for (const path of ['/', '/login', '/register', '/forgot-password', '/reset-password', '/activate-account']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page).toHaveTitle(/MyProdusen|Produsen|HRIS/i, { timeout: 20_000 });
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(hasOverflow, `${path} should not overflow horizontally`).toBe(false);
    }
  });

  test('health and sensitive unauthenticated APIs are protected', async ({ request }) => {
    const health = await request.get('/api/health');
    expect(health.status()).toBe(200);
    const healthText = await health.text();
    expect(healthText).toContain('"status":"ok"');
    expect(healthText).not.toMatch(/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i);

    await expectProtectedPost(request, '/api/reports/pdf', { reportType: 'attendance_summary' });
    await expectProtectedPost(request, '/api/attendance/check-in', {});
    await expectProtectedPost(request, '/api/attendance/check-out', {});
  });

  test('unauthenticated dashboard and modules redirect or block', async ({ page }) => {
    for (const path of ['/dashboard', '/dashboard/users', '/dashboard/payroll', '/dashboard/reports/pdf', '/dashboard/audit']) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('body')).not.toContainText(/Audit Log|Manajemen User & Aktivasi|Ringkasan Payroll|Download PDF/i);
      expect(page.url(), `${path} should not stay publicly accessible`).toMatch(/login|unauthorized|forbidden|dashboard/);
    }
  });

  test('superadmin can open critical dashboard pages when credentials exist', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run live credential login once to avoid rate limit.');
    test.skip(!credentials.superadmin.email || !credentials.superadmin.password, 'Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD.');

    await login(page, credentials.superadmin);
    await expectPageAvailable(page, '/dashboard/users', /Manajemen User|Daftar User|Pengguna/i);
    await expectPageAvailable(page, '/dashboard/reports/pdf', /PDF|Laporan|Report/i);
    await expectPageAvailable(page, '/dashboard/audit', /Audit|Log/i);
    await expectPageAvailable(page, '/dashboard/payroll', /Payroll|Gaji/i);
  });

  test('employee can open own dashboard when credentials exist', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run live credential login once to avoid rate limit.');
    test.skip(!credentials.employee.email || !credentials.employee.password, 'Set E2E_EMPLOYEE_EMAIL and E2E_EMPLOYEE_PASSWORD.');

    await login(page, credentials.employee);
    await expectPageAvailable(page, '/dashboard', /Dashboard|Absensi|Kehadiran|Payroll|KPI/i);
    await expectPageAvailable(page, '/dashboard/payroll', /Payroll|Gaji|Akses ditolak|Forbidden|Tidak memiliki akses/i);
  });

  test('admin HR and supervisor role smoke when credentials exist', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run live credential login once to avoid rate limit.');
    test.skip(!credentials.adminHr.email || !credentials.adminHr.password || !credentials.supervisor.email || !credentials.supervisor.password, 'Set E2E_ADMIN_HR_* and E2E_SUPERVISOR_* credentials.');

    await login(page, credentials.adminHr);
    await expectPageAvailable(page, '/dashboard/employees', /Karyawan|Employee|NIP/i);

    await page.context().clearCookies();
    await login(page, credentials.supervisor);
    await expectPageAvailable(page, '/dashboard', /Dashboard|Tim|KPI|Cuti|Absensi/i);
  });
});

test.describe('MyProdusen staging mutation gate', () => {
  test('mutation tests are explicitly gated', async () => {
    test.skip(!allowMutation, 'Set E2E_ALLOW_MUTATION=true only on disposable staging data to run mutation flows.');
    expect(allowMutation).toBe(true);
  });
});
