import { describe, it, expect, afterEach } from 'vitest';
import { GET as usersGET } from '@/app/api/users/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Route-handler tests for /api/users GET — the SUPERADMIN success path, the
 * permission-denied branch (non-admin), and the unauthenticated branch.
 */
describe('Users API', () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it('GET: returns the user list for a SUPERADMIN', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const req = createMockRequest('GET', 'http://localhost:3000/api/users', { token: admin.token });
    const res = await usersGET(req as never);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('GET: forbids a non-admin (EMPLOYEE)', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const req = createMockRequest('GET', 'http://localhost:3000/api/users', { token: emp.token });
    const res = await usersGET(req as never);
    expect(res.status).toBe(403);
  });

  it('GET: rejects an unauthenticated request', async () => {
    const req = createMockRequest('GET', 'http://localhost:3000/api/users', {});
    const res = await usersGET(req as never);
    expect(res.status).toBe(401);
  });
});
