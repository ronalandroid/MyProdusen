import { describe, expect, it, afterEach } from 'vitest';
import { GET, PATCH } from '@/app/api/profile/me/route';
import { GET as usersGET } from '@/app/api/users/route';
import { createMockRequest, createTestEmployee, createTestUser, cleanupTestData } from '../helpers/test-utils';
import { db, employees } from '@/lib/db';
import { eq } from 'drizzle-orm';

const TINY_PNG_BYTES = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 218, 99, 248, 207, 80, 15, 0, 3, 134, 1, 128, 90, 52, 125, 107, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

function createProfilePatchRequest(token: string, input: { fullName?: string; phone: string; address: string; avatar?: File }) {
  const formData = new FormData();
  formData.set('fullName', input.fullName || 'Budi Santoso');
  formData.set('phone', input.phone);
  formData.set('address', input.address);
  if (input.avatar) formData.set('avatar', input.avatar, input.avatar.name);
  return new Request('http://localhost:3000/api/profile/me', { method: 'PATCH', headers: { authorization: `Bearer ${token}` }, body: formData }) as any;
}

function createAvatarFile() {
  return new File([TINY_PNG_BYTES], 'avatar.png', { type: 'image/png' });
}

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

  it('requires full name before profile completion', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createProfilePatchRequest(user.token, { fullName: 'Bo', phone: '081234567890', address: 'Jl. Test Medan Nomor 10', avatar: createAvatarFile() }));
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('PROFILE_FULL_NAME_REQUIRED');
  });

  it('saves full name, avatar, phone, and address and marks profile complete', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createProfilePatchRequest(user.token, { phone: '081234567890', address: 'Jl. Test Medan Nomor 10', avatar: createAvatarFile() }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.profileCompleted).toBe(true);
    expect(data.data.fullName).toBe('Budi Santoso');

    const [employee] = await db.select().from(employees).where(eq(employees.userId, user.id)).limit(1);
    expect(employee.fullName).toBe('Budi Santoso');
    expect(employee.phone).toBe('081234567890');
    expect(employee.address).toBe('Jl. Test Medan Nomor 10');
    expect(employee.profilePhoto).toContain('/api/profile/avatar/profile-avatars/');
    expect(employee.profileCompletedAt).toBeTruthy();
    employeeIds.push(employee.id);
  });

  it('requires avatar before first profile completion', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createMockRequest('PATCH', 'http://localhost:3000/api/profile/me', { token: user.token, body: { fullName: 'Budi Santoso', phone: '081234567890', address: 'Jl. Test Medan Nomor 10' } }) as any);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.error.code).toBe('PROFILE_AVATAR_REQUIRED');
  });

  it('rejects forbidden assignment fields and does not promote user', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);

    const response = await PATCH(createMockRequest('PATCH', 'http://localhost:3000/api/profile/me', { token: user.token, body: { fullName: 'Budi Santoso', phone: '081234567890', address: 'Jl. Test Medan Nomor 10', role: 'LEADER', division: 'Produksi', position: 'Leader Produksi', locationId: 'loc_1', shiftId: 'shift_1' } }) as any);
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
