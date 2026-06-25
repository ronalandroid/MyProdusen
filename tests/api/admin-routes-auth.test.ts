import { describe, it, expect, afterEach } from 'vitest';
import { PATCH as usersPATCH } from '@/app/api/users/route';
import { GET as empListGET, POST as empListPOST } from '@/app/api/employees/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Auth + permission branch coverage for the SUPERADMIN-only admin routes
 * (users PATCH, employees list GET/POST) — 401 unauth and 403 non-admin.
 */
describe('Admin route auth/permission branches', () => {
  const userIds: string[] = [];
  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it('users PATCH: 401 without authentication', async () => {
    const res = await usersPATCH(
      createMockRequest('PATCH', 'http://localhost:3000/api/users', { body: { userId: 'x', isActive: true } }) as never,
    );
    expect(res.status).toBe(401);
  });

  it('users PATCH: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await usersPATCH(
      createMockRequest('PATCH', 'http://localhost:3000/api/users', { token: emp.token, body: { userId: 'x', isActive: true } }) as never,
    );
    expect(res.status).toBe(403);
  });

  it('employees GET: 401 without authentication', async () => {
    const res = await empListGET(createMockRequest('GET', 'http://localhost:3000/api/employees', {}) as never);
    expect(res.status).toBe(401);
  });

  it('employees GET: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await empListGET(createMockRequest('GET', 'http://localhost:3000/api/employees', { token: emp.token }) as never);
    expect(res.status).toBe(403);
  });

  it('employees POST: 401 without authentication', async () => {
    const res = await empListPOST(createMockRequest('POST', 'http://localhost:3000/api/employees', { body: {} }) as never);
    expect(res.status).toBe(401);
  });

  it('employees POST: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await empListPOST(
      createMockRequest('POST', 'http://localhost:3000/api/employees', { token: emp.token, body: {} }) as never,
    );
    expect(res.status).toBe(403);
  });
});
