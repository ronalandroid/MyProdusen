import { describe, it, expect, afterEach } from 'vitest';
import { POST as requestRoute, GET as listRoute } from '@/app/api/attendance/shift-swaps/route';
import { POST as approveRoute } from '@/app/api/attendance/shift-swaps/[id]/approve/route';
import { POST as rejectRoute } from '@/app/api/attendance/shift-swaps/[id]/reject/route';
import { GET as myRoute } from '@/app/api/attendance/shift-swaps/me/route';
import { createTestUser, createTestEmployee, createTestShift, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { db, shiftSwapRequests, employeeSchedules } from '@/lib/db';
import { and, eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const URL_BASE = 'http://localhost:3000/api/attendance/shift-swaps';
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('shift-swaps routes', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];

  const shiftIds: string[] = [];

  afterEach(async () => {
    if (employeeIds.length) {
      await db.delete(shiftSwapRequests).where(inArray(shiftSwapRequests.requesterId, employeeIds));
      await db.delete(employeeSchedules).where(inArray(employeeSchedules.employeeId, employeeIds));
    }
    await cleanupTestData({ employeeIds, userIds, shiftIds });
    userIds.length = 0;
    employeeIds.length = 0;
    shiftIds.length = 0;
  });

  it('401 without authentication', async () => {
    const res = await requestRoute(createMockRequest('POST', URL_BASE, { body: {} }) as never);
    expect(res.status).toBe(401);
  });

  it('/me 404s a user without an employee profile', async () => {
    const orphan = await createTestUser('EMPLOYEE');
    userIds.push(orphan.id);
    const res = await myRoute(createMockRequest('GET', `${URL_BASE}/me`, { token: orphan.token }) as never);
    expect(res.status).toBe(404);
  });

  it('employee requests -> admin lists; non-admin forbidden; validation + 404 paths', async () => {
    const emp = await createTestUser('EMPLOYEE');
    userIds.push(emp.id);
    const empId = await createTestEmployee(emp.id);
    employeeIds.push(empId);
    const colleague = await createTestUser('EMPLOYEE');
    userIds.push(colleague.id);
    const colleagueId = await createTestEmployee(colleague.id);
    employeeIds.push(colleagueId);

    const reqRes = await requestRoute(createMockRequest('POST', URL_BASE, {
      token: emp.token,
      body: { targetEmployeeId: colleagueId, requesterDate: '3026-06-01', targetDate: '3026-06-02', reason: 'tukar shift acara keluarga' },
    }) as never);
    expect(reqRes.status).toBe(201);
    const swapId = (await reqRes.json()).data.id as string;

    // employee can't list all; admin can
    const empList = await listRoute(createMockRequest('GET', URL_BASE, { token: emp.token }) as never);
    expect(empList.status).toBe(403);

    const admin = await createTestUser('SUPERADMIN');
    userIds.push(admin.id);
    const adminList = await listRoute(createMockRequest('GET', `${URL_BASE}?status=PENDING`, { token: admin.token }) as never);
    expect(adminList.status).toBe(200);

    // own view
    const meRes = await myRoute(createMockRequest('GET', `${URL_BASE}/me`, { token: emp.token }) as never);
    expect(meRes.status).toBe(200);
    expect((await meRes.json()).data.length).toBeGreaterThanOrEqual(1);

    // bad body -> 422
    const bad = await requestRoute(createMockRequest('POST', URL_BASE, { token: emp.token, body: { targetEmployeeId: colleagueId, reason: 'x' } }) as never);
    expect(bad.status).toBe(422);

    // reject the pending swap (no schedules needed) -> 200
    const rejectRes = await rejectRoute(
      createMockRequest('POST', `${URL_BASE}/${swapId}/reject`, { token: admin.token, body: { reason: 'tidak diizinkan minggu ini' } }) as never,
      params(swapId),
    );
    expect(rejectRes.status).toBe(200);

    // approve a non-existent swap -> 404
    const approveMissing = await approveRoute(
      createMockRequest('POST', `${URL_BASE}/itest-nope/approve`, { token: admin.token }) as never,
      params('itest-nope'),
    );
    expect(approveMissing.status).toBe(404);
  });

  it('admin approves via route and the two schedules exchange shifts', async () => {
    const emp = await createTestUser('EMPLOYEE'); userIds.push(emp.id);
    const a = await createTestEmployee(emp.id); employeeIds.push(a);
    const colleague = await createTestUser('EMPLOYEE'); userIds.push(colleague.id);
    const b = await createTestEmployee(colleague.id); employeeIds.push(b);
    const s1 = await createTestShift({ name: `Pagi ${Date.now()}` }); shiftIds.push(s1);
    const s2 = await createTestShift({ name: `Malam ${Date.now()}` }); shiftIds.push(s2);

    const dateA = new Date('3027-06-01T00:00:00.000Z');
    const dateB = new Date('3027-06-02T00:00:00.000Z');
    await db.insert(employeeSchedules).values([
      { id: nanoid(), employeeId: a, shiftId: s1, date: dateA },
      { id: nanoid(), employeeId: b, shiftId: s2, date: dateB },
    ]);

    const reqRes = await requestRoute(createMockRequest('POST', URL_BASE, {
      token: emp.token,
      body: { targetEmployeeId: b, requesterDate: dateA.toISOString(), targetDate: dateB.toISOString(), reason: 'tukar shift via route' },
    }) as never);
    const swapId = (await reqRes.json()).data.id as string;

    const admin = await createTestUser('SUPERADMIN'); userIds.push(admin.id);
    const approveRes = await approveRoute(
      createMockRequest('POST', `${URL_BASE}/${swapId}/approve`, { token: admin.token }) as never,
      params(swapId),
    );
    expect(approveRes.status).toBe(200);

    const [schedA] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.employeeId, a), eq(employeeSchedules.date, dateA)));
    const [schedB] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.employeeId, b), eq(employeeSchedules.date, dateB)));
    expect(schedA.shiftId).toBe(s2);
    expect(schedB.shiftId).toBe(s1);
  });
});
