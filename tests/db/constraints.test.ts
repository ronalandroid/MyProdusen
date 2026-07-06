import { describe, it, expect, afterEach } from 'vitest';
import { db, users, employees, attendances, workLocations } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

describe('Database Constraints', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const locationIds: string[] = [];
  const attendanceIds: string[] = [];

  afterEach(async () => {
    for (const id of attendanceIds) {
      await db.delete(attendances).where(eq(attendances.id, id));
    }
    for (const id of employeeIds) {
      await db.delete(employees).where(eq(employees.id, id));
    }
    for (const id of userIds) {
      await db.delete(users).where(eq(users.id, id));
    }
    for (const id of locationIds) {
      await db.delete(workLocations).where(eq(workLocations.id, id));
    }
    attendanceIds.length = 0;
    employeeIds.length = 0;
    userIds.length = 0;
    locationIds.length = 0;
  });

  async function seedUserAndEmployee(suffix: string, nip = `NIP-${suffix}`) {
    const userId = `constraint_user_${suffix}`;
    const employeeId = `constraint_employee_${suffix}`;

    await db.insert(users).values({
      id: userId,
      email: `constraint_${suffix}@test.com`,
      username: `constraint_${suffix}`,
      password: 'hashed_password',
      role: 'EMPLOYEE',
      isActive: true,
    });
    userIds.push(userId);

    await db.insert(employees).values({
      id: employeeId,
      nip,
      userId,
      fullName: `Constraint User ${suffix}`,
      email: `constraint_${suffix}@test.com`,
      joinDate: new Date(),
      status: 'ACTIVE',
    });
    employeeIds.push(employeeId);

    return { userId, employeeId };
  }

  it('should enforce one attendance check-in per employee per day', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { employeeId } = await seedUserAndEmployee(suffix);
    const locationId = `constraint_location_${suffix}`;

    await db.insert(workLocations).values({
      id: locationId,
      name: 'Constraint Location',
      address: 'Constraint Address',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 100,
      isActive: true,
    });
    locationIds.push(locationId);

    const checkInDate = new Date('2026-05-15T08:00:00.000Z');

    await db.insert(attendances).values({
      id: `constraint_attendance_${suffix}_1`,
      employeeId,
      workLocationId: locationId,
      checkInTime: checkInDate,
      checkInLatitude: 3.5952,
      checkInLongitude: 98.6722,
      checkInAccuracy: 10,
      checkInDistance: 0,
      checkInSelfie: 'data:image/png;base64,test',
      status: 'PRESENT',
    });
    attendanceIds.push(`constraint_attendance_${suffix}_1`);

    await expect(
      db.insert(attendances).values({
        id: `constraint_attendance_${suffix}_2`,
        employeeId,
        workLocationId: locationId,
        checkInTime: new Date('2026-05-15T12:00:00.000Z'),
        checkInLatitude: 3.5952,
        checkInLongitude: 98.6722,
        checkInAccuracy: 10,
        checkInDistance: 0,
        checkInSelfie: 'data:image/png;base64,test',
        status: 'PRESENT',
      })
    ).rejects.toThrow();
  });

  it('should allow attendance on different days', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { employeeId } = await seedUserAndEmployee(suffix);
    const locationId = `constraint_location_${suffix}`;

    await db.insert(workLocations).values({
      id: locationId,
      name: 'Constraint Location',
      address: 'Constraint Address',
      latitude: 3.5952,
      longitude: 98.6722,
      radius: 100,
      isActive: true,
    });
    locationIds.push(locationId);

    const firstId = `constraint_attendance_${suffix}_1`;
    const secondId = `constraint_attendance_${suffix}_2`;

    await db.insert(attendances).values({
      id: firstId,
      employeeId,
      workLocationId: locationId,
      checkInTime: new Date('2026-05-15T08:00:00.000Z'),
      checkInLatitude: 3.5952,
      checkInLongitude: 98.6722,
      checkInAccuracy: 10,
      checkInDistance: 0,
      checkInSelfie: 'data:image/png;base64,test',
      status: 'PRESENT',
    });
    attendanceIds.push(firstId);

    await db.insert(attendances).values({
      id: secondId,
      employeeId,
      workLocationId: locationId,
      checkInTime: new Date('2026-05-16T08:00:00.000Z'),
      checkInLatitude: 3.5952,
      checkInLongitude: 98.6722,
      checkInAccuracy: 10,
      checkInDistance: 0,
      checkInSelfie: 'data:image/png;base64,test',
      status: 'PRESENT',
    });
    attendanceIds.push(secondId);

    expect(true).toBe(true);
  });

  it('should enforce NIP uniqueness', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await seedUserAndEmployee(`${suffix}_1`, 'DUPLICATE-NIP');

    const secondUserId = `constraint_user_${suffix}_2`;
    await db.insert(users).values({
      id: secondUserId,
      email: `constraint_${suffix}_2@test.com`,
      username: `constraint_${suffix}_2`,
      password: 'hashed_password',
      role: 'EMPLOYEE',
      isActive: true,
    });
    userIds.push(secondUserId);

    await expect(
      db.insert(employees).values({
        id: `constraint_employee_${suffix}_2`,
        nip: 'DUPLICATE-NIP',
        userId: secondUserId,
        fullName: 'Duplicate NIP User',
        email: `constraint_${suffix}_2@test.com`,
        joinDate: new Date(),
        status: 'ACTIVE',
      })
    ).rejects.toThrow();
  });

  it('should enforce email uniqueness', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const email = `duplicate_email_${suffix}@test.com`;

    await db.insert(users).values({
      id: `constraint_user_${suffix}_1`,
      email,
      username: `constraint_${suffix}_1`,
      password: 'hashed_password',
      role: 'EMPLOYEE',
      isActive: true,
    });
    userIds.push(`constraint_user_${suffix}_1`);

    await expect(
      db.insert(users).values({
        id: `constraint_user_${suffix}_2`,
        email,
        username: `constraint_${suffix}_2`,
        password: 'hashed_password',
        role: 'EMPLOYEE',
        isActive: true,
      })
    ).rejects.toThrow();
  });

  it('should enforce username uniqueness', async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const username = `duplicate_username_${suffix}`;

    await db.insert(users).values({
      id: `constraint_user_${suffix}_1`,
      email: `constraint_${suffix}_1@test.com`,
      username,
      password: 'hashed_password',
      role: 'EMPLOYEE',
      isActive: true,
    });
    userIds.push(`constraint_user_${suffix}_1`);

    await expect(
      db.insert(users).values({
        id: `constraint_user_${suffix}_2`,
        email: `constraint_${suffix}_2@test.com`,
        username,
        password: 'hashed_password',
        role: 'EMPLOYEE',
        isActive: true,
      })
    ).rejects.toThrow();
  });
});

describe('Core foreign keys (migration 0042 / issue #16)', () => {
  // These FKs are added by a hand-authored SQL migration, not drizzle-kit
  // generate (schema.ts declares relations() only, no .references()). This
  // guards against a future schema regen or migration accidentally dropping
  // them: the DB, not just the ORM model, must enforce referential integrity.
  const EXPECTED_FKS = [
    'Attendance_employeeId_fkey',
    'PayrollItem_runId_fkey',
    'PayrollItem_employeeId_fkey',
    'LeaveRequest_employeeId_fkey',
    'LeaveBalanceLedger_employeeId_fkey',
  ] as const;

  it('has all five core FK constraints present in the database', async () => {
    const rows = await db.execute<{ conname: string }>(sql`
      SELECT conname FROM pg_constraint WHERE contype = 'f'
    `);
    const present = new Set((rows as unknown as Array<{ conname: string }>).map((r) => r.conname));
    for (const fk of EXPECTED_FKS) {
      expect(present.has(fk), `missing FK constraint: ${fk}`).toBe(true);
    }
  });
});
