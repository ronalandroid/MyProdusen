import { afterEach, describe, expect, it } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import {
  db, users, employees, notifications, attendanceExceptions, announcementReads,
} from '@/lib/db';
import { employeeService } from '@/services/employees/employee.service';
import { createTestUser, createTestEmployee, cleanupTestData } from '../helpers/test-utils';

// Regression guard: deleting an employee must not orphan dependent rows.
// The old hard-delete left attendance exceptions, notifications, etc. behind
// because there are no DB-level foreign keys to cascade.
describe('deleteEmployee cascade cleanup', () => {
  const userIds: string[] = [];

  afterEach(async () => {
    await cleanupTestData({ userIds: userIds.splice(0) });
  });

  it('removes the employee, its user, and all dependent rows (no orphans)', async () => {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const employeeId = await createTestEmployee(user.id);

    // Seed dependent rows across both keys.
    await db.insert(notifications).values({
      id: uuidv4(), userId: user.id, title: 'x', message: 'y', type: 'TEST',
    });
    await db.insert(attendanceExceptions).values({
      id: uuidv4(), employeeId, type: 'BAD_GPS_ACCURACY', reason: 'cascade test reason', requestedBy: user.id,
    });
    await db.insert(announcementReads).values({
      id: uuidv4(), announcementId: uuidv4(), userId: user.id,
    });

    await employeeService.deleteEmployee(employeeId);

    // Parent rows gone.
    expect((await db.select().from(employees).where(eq(employees.id, employeeId))).length).toBe(0);
    expect((await db.select().from(users).where(eq(users.id, user.id))).length).toBe(0);
    // Dependent rows gone — no orphans.
    expect((await db.select().from(notifications).where(eq(notifications.userId, user.id))).length).toBe(0);
    expect((await db.select().from(attendanceExceptions).where(eq(attendanceExceptions.employeeId, employeeId))).length).toBe(0);
    expect((await db.select().from(announcementReads).where(eq(announcementReads.userId, user.id))).length).toBe(0);
  });
});
