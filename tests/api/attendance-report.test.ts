import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';

import { GET as reportGET } from '@/app/api/reports/attendance/route';
import { GET as summaryGET } from '@/app/api/reports/attendance/summary/route';
import { db, attendances, auditLogs } from '@/lib/db';
import {
  createTestUser,
  createTestEmployee,
  createTestWorkLocation,
  createTestShift,
  createMockRequest,
  cleanupTestData,
} from '../helpers/test-utils';

const ORIGINAL_MAX_ROWS = process.env.ATTENDANCE_EXPORT_MAX_ROWS;

beforeAll(() => {
  process.env.ATTENDANCE_EXPORT_MAX_ROWS = '5000';
});

afterAll(() => {
  if (ORIGINAL_MAX_ROWS === undefined) {
    delete process.env.ATTENDANCE_EXPORT_MAX_ROWS;
  } else {
    process.env.ATTENDANCE_EXPORT_MAX_ROWS = ORIGINAL_MAX_ROWS;
  }
});

async function seedAttendance(opts: {
  employeeId: string;
  locationId: string;
  shiftId: string;
  checkInTime: Date;
  checkOutTime?: Date | null;
  status?: 'PRESENT' | 'LATE' | 'ABSENT' | 'LEAVE' | 'SICK' | 'PERMISSION';
  lateMinutes?: number;
  totalWorkMinutes?: number;
  checkInDistance?: number | null;
  selfiePath?: string | null;
}) {
  const id = `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(attendances).values({
    id,
    employeeId: opts.employeeId,
    workLocationId: opts.locationId,
    shiftId: opts.shiftId,
    checkInTime: opts.checkInTime,
    checkInLatitude: 3.5952,
    checkInLongitude: 98.6722,
    checkInAccuracy: 10,
    checkInDistance: opts.checkInDistance ?? 0,
    checkInSelfie: opts.selfiePath ?? `/api/attendance/selfie/test-${id}.png`,
    checkInSelfieUrl: opts.selfiePath ?? `/api/attendance/selfie/test-${id}.png`,
    checkInSelfiePath: opts.selfiePath ?? `attendance-selfies/2026/05/${opts.employeeId}/${id}-checkin.png`,
    checkOutTime: opts.checkOutTime ?? null,
    checkOutLatitude: opts.checkOutTime ? 3.5952 : null,
    checkOutLongitude: opts.checkOutTime ? 98.6722 : null,
    checkOutAccuracy: opts.checkOutTime ? 10 : null,
    status: opts.status ?? 'PRESENT',
    lateMinutes: opts.lateMinutes ?? 0,
    earlyLeaveMinutes: 0,
    totalWorkMinutes: opts.totalWorkMinutes ?? 0,
  });
  return id;
}

describe('Attendance report API', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const locationIds: string[] = [];
  const shiftIds: string[] = [];
  const attendanceIds: string[] = [];
  const auditUserIds: string[] = [];

  afterEach(async () => {
    for (const id of attendanceIds.splice(0)) {
      await db.delete(attendances).where(eq(attendances.id, id));
    }
    for (const userId of auditUserIds.splice(0)) {
      await db.delete(auditLogs).where(eq(auditLogs.userId, userId));
    }
    await cleanupTestData({
      userIds: userIds.splice(0),
      employeeIds: employeeIds.splice(0),
      locationIds: locationIds.splice(0),
      shiftIds: shiftIds.splice(0),
    });
  });

  async function setupBaseFixtures() {
    const adminHr = await createTestUser('ADMIN_HR');
    userIds.push(adminHr.id);
    auditUserIds.push(adminHr.id);

    const supervisorUser = await createTestUser('SUPERVISOR');
    userIds.push(supervisorUser.id);
    auditUserIds.push(supervisorUser.id);
    const supervisorEmployeeId = await createTestEmployee(supervisorUser.id);
    employeeIds.push(supervisorEmployeeId);

    const teamUser = await createTestUser('EMPLOYEE');
    userIds.push(teamUser.id);
    auditUserIds.push(teamUser.id);
    const teamEmployeeId = await createTestEmployee(teamUser.id, {
      supervisorId: supervisorEmployeeId,
    });
    employeeIds.push(teamEmployeeId);

    const otherUser = await createTestUser('EMPLOYEE');
    userIds.push(otherUser.id);
    auditUserIds.push(otherUser.id);
    const otherEmployeeId = await createTestEmployee(otherUser.id);
    employeeIds.push(otherEmployeeId);

    const locationId = await createTestWorkLocation();
    locationIds.push(locationId);
    const shiftId = await createTestShift();
    shiftIds.push(shiftId);

    // Tag the team employee with a unique division so report queries can scope to
    // this test's data even if other rows are present in the dev/test database.
    const division = `RPT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { db: testDb, employees: employeesTable } = await import('@/lib/db');
    const { inArray } = await import('drizzle-orm');
    await testDb
      .update(employeesTable)
      .set({ division })
      .where(inArray(employeesTable.id, [teamEmployeeId, otherEmployeeId]));

    return {
      adminHr,
      supervisorUser,
      supervisorEmployeeId,
      teamUser,
      teamEmployeeId,
      otherUser,
      otherEmployeeId,
      locationId,
      shiftId,
      division,
    };
  }

  it('admin HR sees all rows in summary and list', async () => {
    const fx = await setupBaseFixtures();

    attendanceIds.push(
      await seedAttendance({
        employeeId: fx.teamEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-15T01:00:00Z'),
        checkOutTime: new Date('2026-05-15T10:00:00Z'),
        status: 'PRESENT',
        totalWorkMinutes: 540,
      }),
      await seedAttendance({
        employeeId: fx.otherEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-16T02:00:00Z'),
        status: 'LATE',
        lateMinutes: 30,
        totalWorkMinutes: 0,
        checkInDistance: 250,
      }),
    );

    const url = `http://localhost/api/reports/attendance/summary?from=2026-05-01&to=2026-05-31&division=${fx.division}`;
    const summaryResponse = await summaryGET(
      createMockRequest('GET', url, { token: fx.adminHr.token }) as any,
    );
    const summaryPayload = await summaryResponse.json();

    expect(summaryResponse.status).toBe(200);
    expect(summaryPayload.data.summary.totalRecords).toBe(2);
    expect(summaryPayload.data.summary.totalLate).toBe(1);
    expect(summaryPayload.data.summary.totalOutsideGeofence).toBe(1);
    expect(summaryPayload.data.summary.totalMissingCheckout).toBe(1);

    const listResponse = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31&pageSize=10&division=${fx.division}`,
        { token: fx.adminHr.token },
      ) as any,
    );
    const listPayload = await listResponse.json();
    expect(listResponse.status).toBe(200);
    expect(listPayload.data.rows.length).toBe(2);
    expect(listPayload.data.scope).toBe('all');
    // Selfie binaries should never appear in API output.
    expect(JSON.stringify(listPayload)).not.toContain('base64');
    expect(JSON.stringify(listPayload)).not.toContain('data:image');
  });

  it('supervisor only sees team data', async () => {
    const fx = await setupBaseFixtures();

    const teamAttId = await seedAttendance({
      employeeId: fx.teamEmployeeId,
      locationId: fx.locationId,
      shiftId: fx.shiftId,
      checkInTime: new Date('2026-05-15T01:00:00Z'),
      status: 'PRESENT',
    });
    const otherAttId = await seedAttendance({
      employeeId: fx.otherEmployeeId,
      locationId: fx.locationId,
      shiftId: fx.shiftId,
      checkInTime: new Date('2026-05-15T02:00:00Z'),
      status: 'PRESENT',
    });
    attendanceIds.push(teamAttId, otherAttId);

    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31`,
        { token: fx.supervisorUser.token },
      ) as any,
    );
    const payload = await response.json();
    expect(payload.data.rows.length).toBe(1);
    expect(payload.data.rows[0].employeeId).toBe(fx.teamEmployeeId);
    expect(payload.data.scope).toBe('team');
  });

  it('employee only sees own data', async () => {
    const fx = await setupBaseFixtures();

    const teamAttId = await seedAttendance({
      employeeId: fx.teamEmployeeId,
      locationId: fx.locationId,
      shiftId: fx.shiftId,
      checkInTime: new Date('2026-05-15T01:00:00Z'),
    });
    const otherAttId = await seedAttendance({
      employeeId: fx.otherEmployeeId,
      locationId: fx.locationId,
      shiftId: fx.shiftId,
      checkInTime: new Date('2026-05-15T02:00:00Z'),
    });
    attendanceIds.push(teamAttId, otherAttId);

    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31`,
        { token: fx.teamUser.token },
      ) as any,
    );
    const payload = await response.json();
    expect(payload.data.rows.length).toBe(1);
    expect(payload.data.rows[0].employeeId).toBe(fx.teamEmployeeId);
    expect(payload.data.scope).toBe('self');
  });

  it('respects status filter on export', async () => {
    const fx = await setupBaseFixtures();

    attendanceIds.push(
      await seedAttendance({
        employeeId: fx.teamEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-15T01:00:00Z'),
        status: 'PRESENT',
      }),
      await seedAttendance({
        employeeId: fx.teamEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-16T01:00:00Z'),
        status: 'LATE',
        lateMinutes: 45,
      }),
    );

    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31&status=LATE&format=csv&division=${fx.division}`,
        { token: fx.adminHr.token },
      ) as any,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    const csv = await response.text();
    const lines = csv.trim().split('\n');
    // header + 1 data row
    expect(lines.length).toBe(2);
    expect(csv).toContain('LATE');
    expect(csv).not.toContain('base64');
    expect(csv).not.toContain('data:image');
    // Has Check In Selfie column should hold YES/NO, never a path
    expect(lines[0]).toContain('Has Check In Selfie');
    expect(lines[1]).toMatch(/,YES|,NO/);
  });

  it('export rejects missing date range', async () => {
    const fx = await setupBaseFixtures();
    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?format=csv`,
        { token: fx.adminHr.token },
      ) as any,
    );
    expect(response.status).toBe(422);
  });

  it('employee export is forbidden', async () => {
    const fx = await setupBaseFixtures();
    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31&format=csv`,
        { token: fx.teamUser.token },
      ) as any,
    );
    expect(response.status).toBe(403);
  });

  it('export creates audit log with row count and filters', async () => {
    const fx = await setupBaseFixtures();

    attendanceIds.push(
      await seedAttendance({
        employeeId: fx.teamEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-17T01:00:00Z'),
      }),
    );

    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31&format=csv&division=${fx.division}`,
        { token: fx.adminHr.token },
      ) as any,
    );
    expect(response.status).toBe(200);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, fx.adminHr.id));
    const exportLog = logs.find((row) => row.action === 'EXPORT' && row.entity === 'AttendanceReport');
    expect(exportLog).toBeTruthy();
    const newValue = exportLog?.newValue ? JSON.parse(exportLog.newValue) : null;
    expect(newValue?.rowCount).toBe(1);
    expect(newValue?.filters?.from).toContain('2026-05-01');
    expect(newValue?.scope).toBe('all');
    expect(newValue?.maxRows).toBe(5000);
  });

  it('honors export max rows env config', async () => {
    process.env.ATTENDANCE_EXPORT_MAX_ROWS = '1';
    const fx = await setupBaseFixtures();

    attendanceIds.push(
      await seedAttendance({
        employeeId: fx.teamEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-18T01:00:00Z'),
      }),
      await seedAttendance({
        employeeId: fx.otherEmployeeId,
        locationId: fx.locationId,
        shiftId: fx.shiftId,
        checkInTime: new Date('2026-05-18T02:00:00Z'),
      }),
    );

    const response = await reportGET(
      createMockRequest(
        'GET',
        `http://localhost/api/reports/attendance?from=2026-05-01&to=2026-05-31&format=csv&division=${fx.division}`,
        { token: fx.adminHr.token },
      ) as any,
    );
    expect(response.status).toBe(200);
    const csv = await response.text();
    const lines = csv.trim().split('\n');
    // header + 1 (capped) row
    expect(lines.length).toBe(2);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, fx.adminHr.id));
    const exportLog = logs.find((row) => row.action === 'EXPORT' && row.entity === 'AttendanceReport');
    expect(exportLog).toBeTruthy();
    const newValue = exportLog?.newValue ? JSON.parse(exportLog.newValue) : null;
    expect(newValue?.rowCount).toBe(1);
    expect(newValue?.truncated).toBe(true);
    expect(newValue?.totalCount).toBe(2);

    process.env.ATTENDANCE_EXPORT_MAX_ROWS = '5000';
  });
});
