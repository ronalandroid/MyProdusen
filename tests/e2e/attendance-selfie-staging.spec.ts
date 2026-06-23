import { expect, test, type Page } from '@playwright/test';
import { authCookieHeader } from './auth-helpers';

const superadminEmail = process.env.E2E_SUPERADMIN_EMAIL;
const superadminPassword = process.env.E2E_SUPERADMIN_PASSWORD;
const employeeEmail = process.env.E2E_EMPLOYEE_EMAIL || process.env.UAT_EMPLOYEE_A_EMAIL || process.env.UAT_EMPLOYEE_EMAIL;
const employeePassword = process.env.E2E_EMPLOYEE_PASSWORD || process.env.UAT_EMPLOYEE_A_PASSWORD || process.env.UAT_EMPLOYEE_PASSWORD;

const SECRET_LEAK = /DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|RESEND_API_KEY|postgresql:\/\//i;
const NOT_FOUND_OR_ERROR = /This page could not be found|404|500|Internal Server Error/i;

async function login(page: Page, email: string, password: string, role: string) {
  const response = await page.request.post('/api/auth/login', { data: { email, password } });
  if (response.status() === 429) test.skip(true, 'Live login rate limit active. Wait cooldown before credential smoke.');
  expect(response.status(), `${role} API login must succeed`).toBe(200);
}

test.describe('Attendance selfie liveness — staging gate', () => {
  // Authorization holds even without credentials, so this runs everywhere
  // (still gated to one project to avoid redundant hits).
  test('selfie-review API rejects unauthenticated access without leaking secrets', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run the API gate check once.');

    const response = await request.get('/api/attendance/selfie-review');
    expect([401, 403], `Unauthenticated selfie-review must be rejected, got ${response.status()}`).toContain(response.status());
    expect(await response.text()).not.toMatch(SECRET_LEAK);
  });

  test('superadmin can load the selfie-review API and admin grid', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Run credential login once to avoid live rate limit.');
    test.skip(!superadminEmail || !superadminPassword, 'Set E2E_SUPERADMIN_EMAIL and E2E_SUPERADMIN_PASSWORD.');
    await login(page, superadminEmail!, superadminPassword!, 'Superadmin');

    const cookie = await authCookieHeader(page);
    const list = await page.request.get('/api/attendance/selfie-review', { headers: { Cookie: cookie } });
    expect(list.status(), 'Superadmin selfie-review list must be available').toBe(200);
    const json = await list.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);

    // needsReview filter must also resolve.
    const filtered = await page.request.get('/api/attendance/selfie-review?needsReview=true', { headers: { Cookie: cookie } });
    expect(filtered.status()).toBe(200);

    // The admin review grid renders on the attendance page.
    await page.goto('/dashboard/attendance', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.getByRole('heading', { name: /Tinjauan Selfie/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText(NOT_FOUND_OR_ERROR);
  });

  test('employee clock-in page renders the GPS + selfie capture flow', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-390', 'Run the employee mobile flow once.');
    test.skip(!employeeEmail || !employeePassword, 'Set E2E_EMPLOYEE_EMAIL and E2E_EMPLOYEE_PASSWORD.');
    await login(page, employeeEmail!, employeePassword!, 'Employee');

    await page.goto('/dashboard/attendance/clock?type=clock-in', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await expect(page.locator('body')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('body')).not.toContainText(NOT_FOUND_OR_ERROR);
    // The location-validation gate of the check-in flow must render (the selfie
    // camera itself is gated behind GPS and needs a real face — not asserted here).
    await expect(page.locator('body')).toContainText(/Validasi Lokasi|Lokasi Anda|Mengambil lokasi/i, { timeout: 15_000 });
  });
});
