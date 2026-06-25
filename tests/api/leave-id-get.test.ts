import { describe, it, expect, afterEach } from 'vitest';
import { GET as leaveGET } from '@/app/api/leave/[id]/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { leaveService } from '@/services/leave/leave.service';
import { db, leaveRequests, leaveBalanceLedger } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

/**
 * Route-handler tests for the leave [id] GET — 401 unauth, an admin reading a
 * seeded leave (200, exercises canAccessLeave), and the not-found path.
 */
describe('Leave [id] GET handler', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const leaveIds: string[] = [];

  afterEach(async () => {
    for (const id of leaveIds) await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    leaveIds.length = 0;
    if (employeeIds.length > 0) {
      await db.delete(leaveBalanceLedger).where(inArray(leaveBalanceLedger.employeeId, employeeIds));
    }
    await cleanupTestData({ employeeIds, userIds });
    employeeIds.length = 0;
    userIds.length = 0;
  });

  const params = (id: string) => ({ params: Promise.resolve({ id }) });

  it('401 without authentication', async () => {
    const res = await leaveGET(createMockRequest('GET', 'http://localhost:3000/api/leave/x', {}) as never, params('x'));
    expect(res.status).toBe(401);
  });

  it('admin reads a leave by id (200)', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);
    const leave = await leaveService.createLeaveRequest({
      employeeId: empId, type: 'SICK',
      startDate: new Date(2099, 5, 1), endDate: new Date(2099, 5, 2), reason: 'itest get',
    });
    leaveIds.push(leave.id);

    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await leaveGET(
      createMockRequest('GET', `http://localhost:3000/api/leave/${leave.id}`, { token: admin.token }) as never,
      params(leave.id),
    );
    expect(res.status).toBe(200);
  });

  it('admin gets 4xx for a non-existent leave', async () => {
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const res = await leaveGET(
      createMockRequest('GET', 'http://localhost:3000/api/leave/nope', { token: admin.token }) as never,
      params('itest-nonexistent'),
    );
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('lets the owner employee read their own leave (200)', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);
    const leave = await leaveService.createLeaveRequest({
      employeeId: empId, type: 'SICK',
      startDate: new Date(2099, 5, 1), endDate: new Date(2099, 5, 2), reason: 'itest own',
    });
    leaveIds.push(leave.id);

    const res = await leaveGET(
      createMockRequest('GET', `http://localhost:3000/api/leave/${leave.id}`, { token: user.token }) as never,
      params(leave.id),
    );
    expect(res.status).toBe(200);
  });

  it('forbids a non-owner employee from reading someone else’s leave (403)', async () => {
    const owner = await createTestUser('EMPLOYEE');
    userIds.push(owner.id);
    const ownerEmp = await createTestEmployee(owner.id);
    employeeIds.push(ownerEmp);
    const leave = await leaveService.createLeaveRequest({
      employeeId: ownerEmp, type: 'SICK',
      startDate: new Date(2099, 5, 1), endDate: new Date(2099, 5, 2), reason: 'itest owner',
    });
    leaveIds.push(leave.id);

    const other = await createTestUser('EMPLOYEE');
    userIds.push(other.id);
    const res = await leaveGET(
      createMockRequest('GET', `http://localhost:3000/api/leave/${leave.id}`, { token: other.token }) as never,
      params(leave.id),
    );
    expect(res.status).toBe(403);
  });
});
