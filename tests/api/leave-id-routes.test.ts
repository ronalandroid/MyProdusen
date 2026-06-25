import { describe, it, expect, afterEach } from 'vitest';
import { DELETE as leaveDELETE } from '@/app/api/leave/[id]/route';
import { POST as approveLeave } from '@/app/api/leave/[id]/approve/route';
import { POST as rejectLeave } from '@/app/api/leave/[id]/reject/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Route-handler tests for the leave [id] mutations — the auth (401),
 * authorization (403, SUPERADMIN-only), and not-found branches that the existing
 * happy-path suite doesn't reach.
 */
describe('Leave [id] route handlers (auth/guard branches)', () => {
  const userIds: string[] = [];
  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });
  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  it('approve: 401 without authentication', async () => {
    const req = createMockRequest('POST', 'http://localhost:3000/api/leave/x/approve', {});
    const res = await approveLeave(req as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('approve: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const req = createMockRequest('POST', 'http://localhost:3000/api/leave/x/approve', { token: emp.token });
    const res = await approveLeave(req as never, params('x'));
    expect(res.status).toBe(403);
  });

  it('approve: 4xx for a non-existent leave (admin)', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const req = createMockRequest('POST', 'http://localhost:3000/api/leave/nope/approve', { token: admin.token });
    const res = await approveLeave(req as never, params('itest-nonexistent'));
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('reject: 401 without authentication', async () => {
    const req = createMockRequest('POST', 'http://localhost:3000/api/leave/x/reject', { body: { rejectionReason: 'alasan' } });
    const res = await rejectLeave(req as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('reject: 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const req = createMockRequest('POST', 'http://localhost:3000/api/leave/x/reject', {
      token: emp.token, body: { rejectionReason: 'alasan penolakan yang cukup panjang' },
    });
    const res = await rejectLeave(req as never, params('x'));
    expect(res.status).toBe(403);
  });

  it('delete: 401 without authentication', async () => {
    const req = createMockRequest('DELETE', 'http://localhost:3000/api/leave/x', {});
    const res = await leaveDELETE(req as never, params('x'));
    expect(res.status).toBe(401);
  });
});
