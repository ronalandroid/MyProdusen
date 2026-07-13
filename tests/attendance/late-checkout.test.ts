import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db, attendances, attendanceExceptions, notifications } from '@/lib/db';
import { checkOut } from '@/services/attendance/check-out-handler';
import { LATE_CHECKOUT_REASON_REQUIRED } from '@/lib/attendance/late-checkout-policy';
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
let dayShiftId: string;
let nightShiftId: string;
const attendanceIds: string[] = [];

function selfie() {
  const bytes = new Uint8Array(400);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic so upload sniffing accepts it
  bytes.set([0xff, 0xd9], bytes.length - 2);
  return new File([bytes], 'selfie.jpg', { type: 'image/jpeg' });
}

async function seedAttendance(checkInTime: Date, shiftId: string) {
  const id = `test_att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(attendances).values({
    id,
    employeeId,
    workLocationId: locationId,
    shiftId,
    checkInTime,
    checkInLatitude: LOCATION.latitude,
    checkInLongitude: LOCATION.longitude,
    checkInSelfie: '/uploads/test/selfie-in.jpg',
    status: 'PRESENT',
  });
  attendanceIds.push(id);
  return id;
}

function checkOutInput(extra: Record<string, unknown> = {}) {
  return {
    employeeId,
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
  dayShiftId = await createTestShift({ startTime: '08:00', endTime: '17:00' });
  nightShiftId = await createTestShift({ startTime: '22:00', endTime: '06:00' });
  employeeId = await createTestEmployee(worker.id, { defaultShiftId: dayShiftId, defaultLocationId: locationId });
});

afterEach(async () => {
  vi.useRealTimers();
  await db.delete(attendanceExceptions).where(eq(attendanceExceptions.employeeId, employeeId));
  for (const id of attendanceIds.splice(0)) {
    await db.delete(attendances).where(eq(attendances.id, id));
  }
});

afterAll(async () => {
  await db.delete(notifications).where(eq(notifications.userId, admin.id));
  await cleanupTestData({
    userIds: [admin.id, worker.id],
    employeeIds: [employeeId],
    locationIds: [locationId],
    shiftIds: [dayShiftId, nightShiftId],
  });
});

function freezeAt(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(iso));
}

describe('late clock-out with Superadmin review', () => {
  it('on-time clock-out stays unchanged: success, no exception', async () => {
    freezeAt('2026-07-14T17:10:00');
    await seedAttendance(new Date('2026-07-14T08:05:00'), dayShiftId);

    const result = await checkOut(checkOutInput());
    expect(result.checkOutTime).toBeTruthy();
    expect(result.isLateCheckOut ?? false).toBe(false);

    const rows = await db.select().from(attendanceExceptions).where(eq(attendanceExceptions.employeeId, employeeId));
    expect(rows).toHaveLength(0);
  });

  it('blocks a late clock-out without a reason, attendance stays open', async () => {
    freezeAt('2026-07-14T19:30:00');
    const attendanceId = await seedAttendance(new Date('2026-07-14T08:05:00'), dayShiftId);

    await expect(checkOut(checkOutInput())).rejects.toThrow(LATE_CHECKOUT_REASON_REQUIRED);

    const [row] = await db.select().from(attendances).where(eq(attendances.id, attendanceId));
    expect(row.checkOutTime).toBeNull();
  });

  it('accepts a late clock-out with a reason and queues LATE_CORRECTION review + notifies superadmin', async () => {
    freezeAt('2026-07-14T19:30:00');
    await seedAttendance(new Date('2026-07-14T08:05:00'), dayShiftId);

    const result = await checkOut(checkOutInput({ lateReason: 'Lupa clock-out, lanjut lembur bungkus dimsum' }));
    expect(result.checkOutTime).toBeTruthy();
    expect(result.isLateCheckOut).toBe(true);

    const [exception] = await db
      .select()
      .from(attendanceExceptions)
      .where(and(eq(attendanceExceptions.employeeId, employeeId), eq(attendanceExceptions.type, 'LATE_CORRECTION')));
    expect(exception?.status).toBe('PENDING');
    expect(exception?.reason).toContain('Lupa clock-out');

    const adminNotifs = await db.select().from(notifications).where(eq(notifications.userId, admin.id));
    expect(adminNotifs.some((n) => n.title.includes('Clock-out terlambat'))).toBe(true);
  });

  it("closes yesterday's forgotten attendance (with reason) instead of saying belum check-in", async () => {
    freezeAt('2026-07-14T09:00:00');
    const attendanceId = await seedAttendance(new Date('2026-07-13T08:05:00'), dayShiftId);

    await expect(checkOut(checkOutInput())).rejects.toThrow(LATE_CHECKOUT_REASON_REQUIRED);

    const result = await checkOut(checkOutInput({ lateReason: 'Kemarin pulang buru-buru, lupa clock-out' }));
    expect(result.id).toBe(attendanceId);
    expect(result.isLateCheckOut).toBe(true);
  });

  it('overnight shift clocking out in the morning is NOT late', async () => {
    freezeAt('2026-07-14T06:20:00');
    await seedAttendance(new Date('2026-07-13T22:10:00'), nightShiftId);

    const result = await checkOut(checkOutInput());
    expect(result.checkOutTime).toBeTruthy();
    expect(result.isLateCheckOut ?? false).toBe(false);
  });

  it('check-in AFTER shift end (e.g. night worker on a day shift) is NOT late', async () => {
    // Regression: CI runs at arbitrary hours — a fresh check-in past the
    // shift's end must clock out freely; "late" only means staying past a
    // shift end that comes AFTER the check-in.
    freezeAt('2026-07-14T22:20:00');
    await seedAttendance(new Date('2026-07-14T22:15:00'), dayShiftId);

    const result = await checkOut(checkOutInput());
    expect(result.checkOutTime).toBeTruthy();
    expect(result.isLateCheckOut ?? false).toBe(false);
  });

  it('still rejects a second clock-out for today with the same message', async () => {
    freezeAt('2026-07-14T17:10:00');
    await seedAttendance(new Date('2026-07-14T08:05:00'), dayShiftId);
    await checkOut(checkOutInput());

    await expect(checkOut(checkOutInput())).rejects.toThrow('Anda sudah melakukan check-out hari ini');
  });
});
