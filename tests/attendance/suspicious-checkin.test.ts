import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db, attendances, notifications } from '@/lib/db';
import { checkIn } from '@/services/attendance/check-in-handler';
import {
  cleanupTestData,
  createTestEmployee,
  createTestShift,
  createTestUser,
  createTestWorkLocation,
} from '../helpers/test-utils';

const LOCATION = { latitude: 3.5952, longitude: 98.6722 };

let admin: Awaited<ReturnType<typeof createTestUser>>;
let worker: Awaited<ReturnType<typeof createTestUser>>;
let employeeId: string;
let locationId: string;
let shiftId: string;

function selfie() {
  const bytes = new Uint8Array(400);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  bytes.set([0xff, 0xd9], bytes.length - 2);
  return new File([bytes], 'selfie.jpg', { type: 'image/jpeg' });
}

function checkInInput(extra: Record<string, unknown>) {
  return {
    employeeId,
    workLocationId: locationId,
    shiftId,
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    accuracy: 10,
    capturedAt: new Date(),
    selfie: selfie(),
    ...extra,
  };
}

beforeAll(async () => {
  admin = await createTestUser('SUPERADMIN');
  worker = await createTestUser('EMPLOYEE');
  locationId = await createTestWorkLocation({ ...LOCATION, radius: 200 });
  shiftId = await createTestShift({ startTime: '00:00', endTime: '23:59' });
  employeeId = await createTestEmployee(worker.id, { defaultShiftId: shiftId, defaultLocationId: locationId });
});

afterEach(async () => {
  await db.delete(attendances).where(eq(attendances.employeeId, employeeId));
  await db.delete(notifications).where(eq(notifications.userId, admin.id));
});

afterAll(async () => {
  await db.delete(notifications).where(inArray(notifications.userId, [admin.id, worker.id]));
  await cleanupTestData({ userIds: [admin.id, worker.id], employeeIds: [employeeId], locationIds: [locationId], shiftIds: [shiftId] });
});

describe('suspicious check-in detection (owner #13)', () => {
  it('a weak-liveness check-in is flagged high and warns Superadmin', async () => {
    const result = await checkIn(checkInInput({ livenessScore: 0.2, livenessPassed: false, faceDetected: false }));
    expect((result as { riskLevel?: string }).riskLevel).toBe('high');

    const adminNotifs = await db.select().from(notifications).where(eq(notifications.userId, admin.id));
    expect(adminNotifs.some((n) => n.type === 'ATTENDANCE_SUSPICIOUS')).toBe(true);
    expect(adminNotifs.some((n) => n.title.includes('Absensi mencurigakan'))).toBe(true);
  });

  it('a normal check-in is low risk and does NOT warn Superadmin', async () => {
    const result = await checkIn(checkInInput({ livenessScore: 0.95, livenessPassed: true, faceDetected: true }));
    expect((result as { riskLevel?: string }).riskLevel).toBe('low');

    const adminNotifs = await db.select().from(notifications).where(eq(notifications.userId, admin.id));
    expect(adminNotifs.some((n) => n.type === 'ATTENDANCE_SUSPICIOUS')).toBe(false);
  });
});
