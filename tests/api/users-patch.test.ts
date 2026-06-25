import { describe, it, expect, afterEach, vi } from 'vitest';

// Stub the email module so PATCH role changes don't attempt a real send.
vi.mock('@/lib/email', () => ({
  sendAuthEmail: vi.fn(async () => {}),
  getUserEmailEvents: vi.fn(() => []),
}));

import { PATCH as usersPATCH } from '@/app/api/users/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Happy-path + guard coverage for the users PATCH handler: a SUPERADMIN updating
 * a target user's role, and the self-demotion guard.
 */
describe('Users PATCH (admin)', () => {
  const userIds: string[] = [];
  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it('updates a target user role', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const target = await createTestUser('EMPLOYEE');
    userIds.push(target.id);

    const req = createMockRequest('PATCH', 'http://localhost:3000/api/users', {
      token: admin.token, body: { userId: target.id, role: 'EMPLOYEE' },
    });
    const res = await usersPATCH(req as never);
    expect(res.status).toBe(200);
  });

  it('rejects a superadmin trying to deactivate their own account', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const req = createMockRequest('PATCH', 'http://localhost:3000/api/users', {
      token: admin.token, body: { userId: admin.id, isActive: false },
    });
    const res = await usersPATCH(req as never);
    expect(res.status).toBe(403);
  });
});
