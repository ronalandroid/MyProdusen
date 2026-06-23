import { describe, it, expect, afterEach } from 'vitest';
import { attendanceService } from '@/services/attendance/attendance.service';
import { createTestUser, createTestEmployee, createTestWorkLocation, cleanupTestData } from '../helpers/test-utils';
import { db, attendances, attendanceDailySummaries } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('attendanceService.getSelfieReviewList', () => {
  const userIds: string[] = [];
  const employeeIds: string[] = [];
  const locationIds: string[] = [];
  const attendanceIds: string[] = [];

  afterEach(async () => {
    for (const id of attendanceIds) {
      await db.delete(attendanceDailySummaries).where(eq(attendanceDailySummaries.attendanceId, id));
      await db.delete(attendances).where(eq(attendances.id, id));
    }
    attendanceIds.length = 0;
    await cleanupTestData({ employeeIds, userIds, locationIds, shiftIds: [] });
    employeeIds.length = 0;
    userIds.length = 0;
    locationIds.length = 0;
  });

  async function seedCheckIn(opts: { needsReview: boolean; verified: boolean; score: number }) {
    const user = await createTestUser('EMPLOYEE');
    userIds.push(user.id);
    const employeeId = await createTestEmployee(user.id);
    employeeIds.push(employeeId);
    const locationId = await createTestWorkLocation();
    locationIds.push(locationId);

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const attendanceId = `test_att_${suffix}`;
    attendanceIds.push(attendanceId);
    const checkInTime = new Date();

    await db.insert(attendances).values({
      id: attendanceId,
      employeeId,
      workLocationId: locationId,
      checkInTime,
      checkInLatitude: 3.5952,
      checkInLongitude: 98.6722,
      checkInSelfie: '/selfies/test.jpg',
      checkInSelfieUrl: '/selfies/test.jpg',
      checkInGeoStatus: 'INSIDE',
    });

    await db.insert(attendanceDailySummaries).values({
      id: `test_sum_${suffix}`,
      employeeId,
      attendanceId,
      workDate: checkInTime.toISOString().slice(0, 10),
      selfieRequired: true,
      selfieVerified: opts.verified,
      selfieLivenessScore: opts.score,
      selfieNeedsReview: opts.needsReview,
    });

    return { employeeId, attendanceId };
  }

  it('returns a reviewable row with employee name, selfie url and liveness fields', async () => {
    const { employeeId } = await seedCheckIn({ needsReview: true, verified: false, score: 0.55 });

    const rows = await attendanceService.getSelfieReviewList({ employeeId });

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.employeeName).toMatch(/Test Employee/);
    expect(row.selfieUrl).toBe('/selfies/test.jpg');
    expect(row.geoStatus).toBe('INSIDE');
    expect(row.needsReview).toBe(true);
    expect(row.selfieVerified).toBe(false);
    expect(row.livenessScore).toBeCloseTo(0.55, 5);
  });

  it('needsReviewOnly filter includes flagged check-ins and excludes verified ones', async () => {
    const flagged = await seedCheckIn({ needsReview: true, verified: false, score: 0.4 });
    const clean = await seedCheckIn({ needsReview: false, verified: true, score: 0.95 });

    const flaggedRows = await attendanceService.getSelfieReviewList({ needsReviewOnly: true });
    const ids = flaggedRows.map((r) => r.attendanceId);

    expect(ids).toContain(flagged.attendanceId);
    expect(ids).not.toContain(clean.attendanceId);
  });
});
