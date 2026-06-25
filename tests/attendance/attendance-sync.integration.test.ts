import { describe, it, expect } from 'vitest';
import {
  getTodayAttendance,
  adjustAttendance,
  getAttendances,
  getSelfieReviewList,
} from '@/services/attendance/attendance-sync';

/**
 * Integration tests for attendance-sync guard/read paths against a real DB —
 * adjust reason/not-found guards and the list reads, via non-existent ids.
 */
describe('attendance-sync (real DB, guard/read paths)', () => {
  const NONE = 'itest-nonexistent';

  it('getTodayAttendance: resolves for an unknown employee', async () => {
    const r = await getTodayAttendance(NONE);
    expect(r === null || typeof r === 'object').toBe(true);
  });

  it('adjustAttendance: rejects a too-short reason', async () => {
    await expect(
      adjustAttendance(NONE, { reason: 'no', adjustedBy: 'itest' }),
    ).rejects.toThrow(/minimal 5 karakter/i);
  });

  it('adjustAttendance: rejects a missing attendance record', async () => {
    await expect(
      adjustAttendance(NONE, { reason: 'penyesuaian yang valid', adjustedBy: 'itest' }),
    ).rejects.toThrow(/tidak ditemukan/i);
  });

  it('getAttendances: returns an array', async () => {
    expect(Array.isArray(await getAttendances())).toBe(true);
  });

  it('getSelfieReviewList: returns an array', async () => {
    expect(Array.isArray(await getSelfieReviewList())).toBe(true);
  });
});
