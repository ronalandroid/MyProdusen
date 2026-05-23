import { describe, expect, it, afterEach } from 'vitest';
import { GET, PATCH } from '@/app/api/profile/me/route';
import { GET as usersGET } from '@/app/api/users/route';
import { createMockRequest, createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';
import { db, employees } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('/api/profile/me', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ employeeIds, userIds });
    userIds.length = 0;
    employeeIds.length = 0;
  });

  it('returns profile completion and assignment status', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const employeeId = await createTestEmployee(user.id);
    employeeIds.push(employeeId);

    const response = await GET(createMockRequest('GET', 'http://localhost:3000/api/profile/me', { token: user.token }) as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.employeeId).toBe(employeeId);
    expect(data.data.profileCompleted).toBe(false);
    expect(data.data.assignmentStatus.hasDivision).toBe(true);
  });

  it('saves phone and address and marks profile complete', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createMockRequest('PATCH', 'http://localhost:3000/api/profile/me', { token: user.token, body: { phone: '081234567890', address: 'Jl. Test Medan Nomor 10' } }) as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.profileCompleted).toBe(true);

    const [employee] = await db.select().from(employees).where(eq(employees.userId, user.id)).limit(1);
    expect(employee.phone).toBe('081234567890');
    expect(employee.address).toBe('Jl. Test Medan Nomor 10');
    expect(employee.profileCompletedAt).toBeTruthy();
    employeeIds.push(employee.id);
  });

  it('rejects forbidden assignment fields and does not promote user', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createMockRequest('PATCH', 'http://localhost:3000/api/profile/me', { token: user.token, body: { phone: '081234567890', address: 'Jl. Test Medan Nomor 10', role: 'LEADER', division: 'Produksi', position: 'Leader Produksi', locationId: 'loc_1', shiftId: 'shift_1' } }) as any);
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('PROFILE_UPDATE_FORBIDDEN_FIELD');

    const check = await GET(createMockRequest('GET', 'http://localhost:3000/api/profile/me', { token: user.token }) as any);
    const checkData = await check.json();
    expect(checkData.data.role).toBe('EMPLOYEE');
  });

  it('superadmin user listing includes private profile fields for assignment review', async () => {
    const superadmin = await createTestUser('SUPERADMIN');
    const employeeUser = await createTestUser('EMPLOYEE');
    userIds.push(superadmin.id, employeeUser.id);
    const employeeId = await createTestEmployee(employeeUser.id);
    employeeIds.push(employeeId);
    await db.update(employees).set({ phone: '081234567890', address: 'Jl. Privat Medan 10', profileCompletedAt: new Date() }).where(eq(employees.id, employeeId));

    const response = await usersGET(createMockRequest('GET', 'http://localhost:3000/api/users', { token: superadmin.token }) as any);
    const data = await response.json();
    expect(response.status).toBe(200);
    const row = data.data.find((item: any) => item.id === employeeUser.id);
    expect(row.phone).toBe('081234567890');
    expect(row.address).toBe('Jl. Privat Medan 10');
  });
});
