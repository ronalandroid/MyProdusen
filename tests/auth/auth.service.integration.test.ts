import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authService } from '@/services/auth/auth.service';
import {
  createTestUser,
  createTestEmployee,
  createTestWorkLocation,
  createTestShift,
  cleanupTestData,
} from '../helpers/test-utils';

/**
 * Integration tests for AuthService guard/read paths against a real DB. These
 * use non-existent ids and weak passwords so they throw before any external
 * breach-check call and need no seeding.
 */
describe('AuthService integration (real DB, guard paths)', () => {
  it('login: rejects an unknown email with a generic credentials error', async () => {
    await expect(authService.login('itest-nobody@itest.local', 'whatever')).rejects.toThrow(/salah/i);
  });

  it('resetPassword: rejects a weak new password before touching the token', async () => {
    await expect(authService.resetPassword('any-token', '123')).rejects.toThrow();
  });

  it('changePassword: rejects a weak new password', async () => {
    await expect(authService.changePassword('itest-nonexistent', 'oldpass', '123')).rejects.toThrow();
  });

  it('activateAccount: rejects an invalid activation token', async () => {
    await expect(authService.activateAccount('itest-invalid-token')).rejects.toThrow();
  });

  it('listUsers: returns an array', async () => {
    expect(Array.isArray(await authService.listUsers())).toBe(true);
  });

  it('countActiveSuperadmins: returns a non-negative number', async () => {
    const count = await authService.countActiveSuperadmins();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

/**
 * The attendance clock wizard (app/dashboard/attendance/clock) reads
 * employee.defaultLocation / employee.defaultShift straight from
 * /api/auth/profile — the ClientUserProfile contract declares both. Without
 * them the location step can never compute a distance and the flow dead-ends,
 * so getProfile must resolve the relation objects, not just the id columns.
 */
describe('AuthService.getProfile (real DB, employee relations)', () => {
  let userId: string;
  let bareUserId: string;
  let employeeId: string;
  let bareEmployeeId: string;
  let locationId: string;
  let shiftId: string;

  beforeAll(async () => {
    const user = await createTestUser('EMPLOYEE');
    const bareUser = await createTestUser('EMPLOYEE');
    userId = user.id;
    bareUserId = bareUser.id;
    locationId = await createTestWorkLocation({ radius: 120 });
    shiftId = await createTestShift({ startTime: '07:30', endTime: '16:30' });
    employeeId = await createTestEmployee(userId, {
      defaultLocationId: locationId,
      defaultShiftId: shiftId,
    });
    bareEmployeeId = await createTestEmployee(bareUserId);
  });

  afterAll(async () => {
    await cleanupTestData({
      userIds: [userId, bareUserId],
      employeeIds: [employeeId, bareEmployeeId],
      locationIds: [locationId],
      shiftIds: [shiftId],
    });
  });

  it('populates employee.defaultLocation and defaultShift used by the clock page', async () => {
    const profile = await authService.getProfile(userId);

    expect(profile.employee).not.toBeNull();
    expect(profile.employee?.defaultLocation).toMatchObject({ id: locationId, radius: 120 });
    expect(typeof profile.employee?.defaultLocation?.latitude).toBe('number');
    expect(typeof profile.employee?.defaultLocation?.longitude).toBe('number');
    expect(profile.employee?.defaultShift).toMatchObject({
      id: shiftId,
      startTime: '07:30',
      endTime: '16:30',
    });
  });

  it('returns null relations when the employee has no defaults assigned', async () => {
    const profile = await authService.getProfile(bareUserId);

    expect(profile.employee).not.toBeNull();
    expect(profile.employee?.defaultLocation).toBeNull();
    expect(profile.employee?.defaultShift).toBeNull();
  });
});
