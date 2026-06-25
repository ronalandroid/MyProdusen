import { describe, it, expect, afterEach } from 'vitest';
import { DELETE as leaveDELETE } from '@/app/api/leave/[id]/route';
import { POST as rejectLeave } from '@/app/api/leave/[id]/reject/route';
import { createTestUser, createTestEmployee, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { leaveService } from '@/services/leave/leave.service';
import { db, leaveRequests, leaveBalanceLedger } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

/**
 * Happy-path route tests for the leave [id] mutations: an admin rejecting a
 * PENDING leave and the owner deleting one. Seeds a SICK request (no balance
 * check) and cleans up the request, ledger holds, employee, and user.
 */
describe('Leave [id] happy paths', () => {
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

  async function seedPendingLeave() {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const empId = await createTestEmployee(user.id);
    employeeIds.push(empId);
    const leave = await leaveService.createLeaveRequest({
      employeeId: empId, type: 'SICK',
      startDate: new Date(2099, 5, 1), endDate: new Date(2099, 5, 2), reason: 'itest sick',
    });
    leaveIds.push(leave.id);
    return { user, empId, leave };
  }

  it('admin rejects a PENDING leave', async () => {
    const { leave } = await seedPendingLeave();
    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const req = createMockRequest('POST', `http://localhost:3000/api/leave/${leave.id}/reject`, {
      token: admin.token, body: { reason: 'alasan penolakan yang cukup panjang' },
    });
    const res = await rejectLeave(req as never, params(leave.id));
    expect(res.status).toBe(200);
  });

  it('owner deletes a PENDING leave', async () => {
    const { user, leave } = await seedPendingLeave();
    const req = createMockRequest('DELETE', `http://localhost:3000/api/leave/${leave.id}`, { token: user.token });
    const res = await leaveDELETE(req as never, params(leave.id));
    expect(res.status).toBe(200);
  });
});
