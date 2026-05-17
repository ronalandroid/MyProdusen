import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import { eq } from 'drizzle-orm';

import { GET as getCheckInSelfie } from '@/app/api/attendances/[attendanceId]/selfie/check-in/route';
import { GET as getCheckOutSelfie } from '@/app/api/attendances/[attendanceId]/selfie/check-out/route';
import { db, attendances, employees } from '@/lib/db';
import { resolveSelfieStoragePath } from '@/lib/upload';
import {
  createTestUser,
  createTestEmployee,
  createTestWorkLocation,
  createTestShift,
  createMockRequest,
  cleanupTestData,
} from '../helpers/test-utils';

const FIXTURE_FILES: string[] = [];

afterAll(async () => {
  for (const file of FIXTURE_FILES) {
    await rm(file, { force: true });
  }
});

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SAMPLE_PNG = Buffer.concat([PNG_HEADER, Buffer.alloc(48, 0)]);

async function seedSelfieFixture(opts: {
  attendanceId: string;
  employeeId: string;
  type: 'checkin' | 'checkout';
}) {
  const key = `attendance-selfies/2026/05/${opts.employeeId}/${opts.attendanceId}-${opts.type}.png`;
  const fullPath = resolveSelfieStoragePath(key);
  if (!fullPath) {
    throw new Error(`Could not resolve selfie storage path for key: ${key}`);
  }
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, SAMPLE_PNG);
  FIXTURE_FILES.push(fullPath);
  return key;
}

describe('Protected attendance selfie endpoints', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const locationIds: string[] = [];
  const shiftIds: string[] = [];
  const attendanceIds: string[] = [];

  afterEach(async () => {
    for (const id of attendanceIds) {
      await db.delete(attendances).where(eq(attendances.id, id));
    }
    attendanceIds.length = 0;

    await cleanupTestData({
      userIds: userIds.splice(0),
      employeeIds: employeeIds.splice(0),
      locationIds: locationIds.splice(0),
      shiftIds: shiftIds.splice(0),
    });
  });

  async function seedAttendance({
    role,
    supervisor,
  }: {
    role: 'EMPLOYEE' | 'SUPERVISOR' | 'ADMIN_HR' | 'SUPERADMIN';
    supervisor?: { id: string };
  }) {
    const user = await createTestUser(role);
    userIds.push(user.id);

    if (role !== 'EMPLOYEE' && role !== 'SUPERVISOR') {
      return { user, attendanceId: null as string | null };
    }

    const employeeId = await createTestEmployee(user.id, {
      supervisorId: supervisor?.id,
    });
    employeeIds.push(employeeId);

    const locationId = await createTestWorkLocation();
    locationIds.push(locationId);

    const shiftId = await createTestShift();
    shiftIds.push(shiftId);

    const attendanceId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const checkInKey = await seedSelfieFixture({ attendanceId, employeeId, type: 'checkin' });
    const checkOutKey = await seedSelfieFixture({ attendanceId, employeeId, type: 'checkout' });

    await db.insert(attendances).values({
      id: attendanceId,
      employeeId,
      workLocationId: locationId,
      shiftId,
      checkInTime: new Date('2026-05-15T08:00:00.000Z'),
      checkInLatitude: 3.5952,
      checkInLongitude: 98.6722,
      checkInAccuracy: 10,
      checkInDistance: 0,
      checkInSelfie: `/api/attendance/selfie/${checkInKey}`,
      checkInSelfieUrl: `/api/attendance/selfie/${checkInKey}`,
      checkInSelfiePath: checkInKey,
      checkInSelfieMimeType: 'image/png',
      checkInSelfieSizeBytes: SAMPLE_PNG.length,
      checkInSelfieUploadedAt: new Date('2026-05-15T08:00:00.000Z'),
      checkOutTime: new Date('2026-05-15T17:00:00.000Z'),
      checkOutLatitude: 3.5952,
      checkOutLongitude: 98.6722,
      checkOutAccuracy: 10,
      checkOutDistance: 0,
      checkOutSelfie: `/api/attendance/selfie/${checkOutKey}`,
      checkOutSelfieUrl: `/api/attendance/selfie/${checkOutKey}`,
      checkOutSelfiePath: checkOutKey,
      checkOutSelfieMimeType: 'image/png',
      checkOutSelfieSizeBytes: SAMPLE_PNG.length,
      checkOutSelfieUploadedAt: new Date('2026-05-15T17:00:00.000Z'),
      status: 'PRESENT',
    });
    attendanceIds.push(attendanceId);

    return { user, attendanceId, employeeId };
  }

  it('serves selfie to the owner employee', async () => {
    const { user, attendanceId } = await seedAttendance({ role: 'EMPLOYEE' });
    if (!attendanceId) throw new Error('seed failed');

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/${attendanceId}/selfie/check-in`,
      { token: user.token },
    );

    const response = await getCheckInSelfie(request as any, {
      params: Promise.resolve({ attendanceId }),
    } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.length).toBe(SAMPLE_PNG.length);
  });

  it('rejects another employee with 403', async () => {
    const seed = await seedAttendance({ role: 'EMPLOYEE' });
    if (!seed.attendanceId) throw new Error('seed failed');

    const intruder = await createTestUser('EMPLOYEE');
    userIds.push(intruder.id);
    const intruderEmployeeId = await createTestEmployee(intruder.id);
    employeeIds.push(intruderEmployeeId);

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/${seed.attendanceId}/selfie/check-in`,
      { token: intruder.token },
    );

    const response = await getCheckInSelfie(request as any, {
      params: Promise.resolve({ attendanceId: seed.attendanceId }),
    } as any);

    expect(response.status).toBe(403);
  });

  it('allows ADMIN_HR to view any selfie', async () => {
    const seed = await seedAttendance({ role: 'EMPLOYEE' });
    if (!seed.attendanceId) throw new Error('seed failed');

    const adminHr = await createTestUser('ADMIN_HR');
    userIds.push(adminHr.id);

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/${seed.attendanceId}/selfie/check-out`,
      { token: adminHr.token },
    );

    const response = await getCheckOutSelfie(request as any, {
      params: Promise.resolve({ attendanceId: seed.attendanceId }),
    } as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
  });

  it('blocks unauthenticated requests', async () => {
    const seed = await seedAttendance({ role: 'EMPLOYEE' });
    if (!seed.attendanceId) throw new Error('seed failed');

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/${seed.attendanceId}/selfie/check-in`,
    );

    const response = await getCheckInSelfie(request as any, {
      params: Promise.resolve({ attendanceId: seed.attendanceId }),
    } as any);

    expect(response.status).toBe(401);
  });

  it('returns 404 for unknown attendance ids', async () => {
    const adminHr = await createTestUser('ADMIN_HR');
    userIds.push(adminHr.id);

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/att_not_real/selfie/check-in`,
      { token: adminHr.token },
    );

    const response = await getCheckInSelfie(request as any, {
      params: Promise.resolve({ attendanceId: 'att_not_real' }),
    } as any);

    expect(response.status).toBe(404);
  });

  it('rejects path-like attendance ids without filesystem access', async () => {
    const adminHr = await createTestUser('ADMIN_HR');
    userIds.push(adminHr.id);

    const request = createMockRequest(
      'GET',
      `http://localhost/api/attendances/..%2Fetc%2Fpasswd/selfie/check-in`,
      { token: adminHr.token },
    );

    const response = await getCheckInSelfie(request as any, {
      params: Promise.resolve({ attendanceId: '../etc/passwd' }),
    } as any);

    expect(response.status).toBe(404);
  });
});
