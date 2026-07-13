import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, users, companySettings } from '@/lib/db';
import { createTestUser, createMockRequest, cleanupTestData, type TestUser } from '../helpers/test-utils';
import { GET as registrationGET, PUT as registrationPUT } from '@/app/api/settings/registration/route';
import { POST as publicRegisterPOST } from '@/app/api/auth/public-register/route';
import { GET as registerOptionsGET } from '@/app/api/auth/register-options/route';
import { setPublicRegistrationOpen } from '@/services/settings/registration-settings';

describe('Registration open/close toggle', () => {
  let admin: TestUser;
  let employee: TestUser;
  const createdUserIds: string[] = [];
  const createdEmployeeIds: string[] = [];

  beforeAll(async () => {
    admin = await createTestUser('SUPERADMIN');
    employee = await createTestUser('EMPLOYEE');
    createdUserIds.push(admin.id, employee.id);
  });

  afterAll(async () => {
    // Leave the system open for other suites regardless of test order.
    await setPublicRegistrationOpen(true, admin.id);
    await db.delete(companySettings).where(eq(companySettings.key, 'PUBLIC_REGISTRATION_OPEN'));
    await cleanupTestData({ userIds: createdUserIds, employeeIds: createdEmployeeIds });
  });

  it('defaults to open and lets superadmin close it', async () => {
    await db.delete(companySettings).where(eq(companySettings.key, 'PUBLIC_REGISTRATION_OPEN'));

    const initial = await (await registrationGET(
      createMockRequest('GET', 'http://localhost:3000/api/settings/registration', { token: admin.token }) as any,
    )).json();
    expect(initial.data.open).toBe(true);

    const closed = await (await registrationPUT(
      createMockRequest('PUT', 'http://localhost:3000/api/settings/registration', { token: admin.token, body: { open: false } }) as any,
    )).json();
    expect(closed.success).toBe(true);
    expect(closed.data.open).toBe(false);

    const after = await (await registrationGET(
      createMockRequest('GET', 'http://localhost:3000/api/settings/registration', { token: admin.token }) as any,
    )).json();
    expect(after.data.open).toBe(false);
  });

  it('rejects non-superadmin toggling', async () => {
    const response = await registrationPUT(
      createMockRequest('PUT', 'http://localhost:3000/api/settings/registration', { token: employee.token, body: { open: true } }) as any,
    );
    expect(response.status).toBe(403);
  });

  it('blocks public registration while closed and creates nothing', async () => {
    await setPublicRegistrationOpen(false, admin.id);

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const email = `closed_${suffix}@test.com`;
    const response = await publicRegisterPOST(
      createMockRequest('POST', 'http://localhost:3000/api/auth/public-register', {
        body: { email, username: `closed_${suffix}`, password: 'KfDimsClosed1!x', fullName: 'Uji Tutup' },
      }) as any,
    );
    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.error).toContain('ditutup');

    const [created] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    expect(created).toBeUndefined();
  });

  it('exposes the closed state to the register page via register-options', async () => {
    await setPublicRegistrationOpen(false, admin.id);
    const closedOptions = await (await registerOptionsGET(
      createMockRequest('GET', 'http://localhost:3000/api/auth/register-options') as any,
    )).json();
    expect(closedOptions.data.registrationOpen).toBe(false);

    await setPublicRegistrationOpen(true, admin.id);
    const openOptions = await (await registerOptionsGET(
      createMockRequest('GET', 'http://localhost:3000/api/auth/register-options') as any,
    )).json();
    expect(openOptions.data.registrationOpen).toBe(true);
  });

  it('accepts registration again after reopening', async () => {
    await setPublicRegistrationOpen(true, admin.id);

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const response = await publicRegisterPOST(
      createMockRequest('POST', 'http://localhost:3000/api/auth/public-register', {
        body: { email: `reopen_${suffix}@test.com`, username: `reopen_${suffix}`, password: 'KfDimsReopen1!x', fullName: 'Uji Buka' },
      }) as any,
    );
    const payload = await response.json();
    expect(payload.success).toBe(true);
    createdUserIds.push(payload.data.id);
    if (payload.data.employee?.id) createdEmployeeIds.push(payload.data.employee.id);
  });
});
