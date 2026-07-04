import { describe, it, expect, afterEach } from 'vitest';
import { GET as emailLogsGET } from '@/app/api/admin/email-logs/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';

/**
 * Auth + shape coverage for the SUPERADMIN-only email log listing
 * (/api/admin/email-logs): 401 unauth, 403 non-admin, 200 with
 * logs + 7-day summary for superadmin, and status filter passthrough.
 */
describe('GET /api/admin/email-logs', () => {
  const userIds: string[] = [];
  afterEach(async () => {
    await cleanupTestData({ userIds });
    userIds.length = 0;
  });

  it('returns 401 without authentication', async () => {
    const res = await emailLogsGET(
      createMockRequest('GET', 'http://localhost:3000/api/admin/email-logs', {}) as never,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const res = await emailLogsGET(
      createMockRequest('GET', 'http://localhost:3000/api/admin/email-logs', { token: emp.token }) as never,
    );
    expect(res.status).toBe(403);
  });

  it('returns logs and summary for superadmin', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await emailLogsGET(
      createMockRequest('GET', 'http://localhost:3000/api/admin/email-logs?limit=5', { token: admin.token }) as never,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.logs)).toBe(true);
    expect(body.data.logs.length).toBeLessThanOrEqual(5);
    expect(body.data.summary).toMatchObject({
      sent: expect.any(Number),
      failed: expect.any(Number),
      skipped: expect.any(Number),
      windowDays: 7,
    });
  });

  it('applies the status filter', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await emailLogsGET(
      createMockRequest('GET', 'http://localhost:3000/api/admin/email-logs?status=SENT&limit=10', { token: admin.token }) as never,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    for (const log of body.data.logs) {
      expect(log.status).toBe('SENT');
    }
  });
});
