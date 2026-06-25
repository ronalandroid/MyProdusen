import { describe, it, expect, afterEach } from 'vitest';
import { GET as empGET, PUT as empPUT, DELETE as empDELETE } from '@/app/api/employees/[id]/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Route-handler tests for the employees/[id] GET/PATCH/DELETE auth + permission
 * branches (401 unauth, 403 non-admin, 4xx not-found).
 */
describe('Employees [id] route handlers (auth/guard branches)', () => {
  const userIds: string[] = [];
  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });
  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  it('GET: 401 without authentication', async () => {
    const res = await empGET(createMockRequest('GET', 'http://localhost:3000/api/employees/x', {}) as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('GET: 4xx for a non-existent employee (admin)', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await empGET(
      createMockRequest('GET', 'http://localhost:3000/api/employees/nope', { token: admin.token }) as never,
      params('itest-nonexistent'),
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('PUT: 401 without authentication', async () => {
    const res = await empPUT(createMockRequest('PUT', 'http://localhost:3000/api/employees/x', { body: {} }) as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('PUT: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await empPUT(
      createMockRequest('PUT', 'http://localhost:3000/api/employees/x', { token: emp.token, body: { fullName: 'x' } }) as never,
      params('x'),
    );
    expect(res.status).toBe(403);
  });

  it('DELETE: 401 without authentication', async () => {
    const res = await empDELETE(createMockRequest('DELETE', 'http://localhost:3000/api/employees/x', {}) as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('DELETE: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await empDELETE(
      createMockRequest('DELETE', 'http://localhost:3000/api/employees/x', { token: emp.token }) as never,
      params('x'),
    );
    expect(res.status).toBe(403);
  });
});
