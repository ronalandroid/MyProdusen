import { describe, it, expect, afterEach } from 'vitest';
import { db, employeeSchedules, shiftSwapRequests } from '@/lib/db';
import { and, eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createTestUser, createTestEmployee, createTestShift, cleanupTestData } from '../helpers/test-utils';
import { requestSwap, approveSwap, rejectSwap, getSwapsForEmployee } from '@/src/services/attendance/shift-swap.service';

describe('shift-swap service', () => {
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

  it('approve exchanges the two schedules\' shifts atomically', async () => {
    const ua = await createTestUser('EMPLOYEE'); userIds.push(ua.id);
    const a = await createTestEmployee(ua.id); employeeIds.push(a);
    const ub = await createTestUser('EMPLOYEE'); userIds.push(ub.id);
    const b = await createTestEmployee(ub.id); employeeIds.push(b);
    const s1 = await createTestShift({ name: `Pagi ${Date.now()}` }); shiftIds.push(s1);
    const s2 = await createTestShift({ name: `Malam ${Date.now()}` }); shiftIds.push(s2);

    const dateA = new Date('3026-06-01T00:00:00.000Z');
    const dateB = new Date('3026-06-02T00:00:00.000Z');
    await db.insert(employeeSchedules).values([
      { id: nanoid(), employeeId: a, shiftId: s1, date: dateA },
      { id: nanoid(), employeeId: b, shiftId: s2, date: dateB },
    ]);

    const swap = await requestSwap({ requesterId: a, requesterDate: dateA, targetId: b, targetDate: dateB, reason: 'tukar shift karena ada acara' });
    expect(swap.status).toBe('PENDING');

    const approved = await approveSwap(swap.id, 'itest-admin');
    expect(approved!.status).toBe('APPROVED');

    const [schedA] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.employeeId, a), eq(employeeSchedules.date, dateA)));
    const [schedB] = await db.select().from(employeeSchedules).where(and(eq(employeeSchedules.employeeId, b), eq(employeeSchedules.date, dateB)));
    expect(schedA.shiftId).toBe(s2);
    expect(schedB.shiftId).toBe(s1);
  });

  it('approve throws when one of the schedules is missing', async () => {
    const ua = await createTestUser('EMPLOYEE'); userIds.push(ua.id);
    const a = await createTestEmployee(ua.id); employeeIds.push(a);
    const ub = await createTestUser('EMPLOYEE'); userIds.push(ub.id);
    const b = await createTestEmployee(ub.id); employeeIds.push(b);

    // No EmployeeSchedule rows seeded -> approve must fail, not partially swap.
    const swap = await requestSwap({
      requesterId: a, requesterDate: new Date('3026-07-01'), targetId: b, targetDate: new Date('3026-07-02'), reason: 'tanpa jadwal tersimpan',
    });
    await expect(approveSwap(swap.id, 'itest-admin')).rejects.toThrow();
  });

  it('blocks swapping with yourself', async () => {
    const ua = await createTestUser('EMPLOYEE'); userIds.push(ua.id);
    const a = await createTestEmployee(ua.id); employeeIds.push(a);
    await expect(requestSwap({
      requesterId: a, requesterDate: new Date('3026-06-01'), targetId: a, targetDate: new Date('3026-06-02'), reason: 'self swap test',
    })).rejects.toThrow();
  });

  it('reject marks REJECTED and blocks double-processing; shows in employee view', async () => {
    const ua = await createTestUser('EMPLOYEE'); userIds.push(ua.id);
    const a = await createTestEmployee(ua.id); employeeIds.push(a);
    const ub = await createTestUser('EMPLOYEE'); userIds.push(ub.id);
    const b = await createTestEmployee(ub.id); employeeIds.push(b);

    const swap = await requestSwap({ requesterId: a, requesterDate: new Date('3026-06-01'), targetId: b, targetDate: new Date('3026-06-02'), reason: 'alasan cukup panjang' });
    const rejected = await rejectSwap(swap.id, 'itest-admin', 'Tidak diizinkan minggu ini');
    expect(rejected!.status).toBe('REJECTED');
    await expect(approveSwap(swap.id, 'itest-admin')).rejects.toThrow();

    expect((await getSwapsForEmployee(a)).length).toBeGreaterThanOrEqual(1);
  });
});
