import { describe, it, expect } from 'vitest';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';

/**
 * Integration tests for AttendanceExceptionService against a real DB. Covers the
 * review guard rules (rejection-reason length, not-found) and the list query's
 * filter/join paths via non-existent ids — no seeding, no writes.
 */
describe('AttendanceExceptionService integration (real DB, guard paths)', () => {
  const NONE = 'itest-nonexistent-id';

  it('reviewException: rejects a REJECTED review with a too-short reason', async () => {
    await expect(
      attendanceExceptionService.reviewException({
        id: NONE,
        reviewerUserId: 'itest-reviewer',
        status: 'REJECTED',
        reviewNote: 'no',
      }),
    ).rejects.toThrow(/minimal 5 karakter/i);
  });

  it('reviewException: rejects an APPROVED review of a non-existent exception', async () => {
    await expect(
      attendanceExceptionService.reviewException({
        id: NONE,
        reviewerUserId: 'itest-reviewer',
        status: 'APPROVED',
        reviewNote: '',
      }),
    ).rejects.toThrow(/tidak ditemukan/i);
  });

  it('reviewException: a valid-length rejection still fails on a missing exception', async () => {
    await expect(
      attendanceExceptionService.reviewException({
        id: NONE,
        reviewerUserId: 'itest-reviewer',
        status: 'REJECTED',
        reviewNote: 'alasan penolakan yang cukup panjang',
      }),
    ).rejects.toThrow(/tidak ditemukan/i);
  });

  it('listExceptions: scopes to an employee viewer and returns an array (empty for unknown employee)', async () => {
    const rows = await attendanceExceptionService.listExceptions({
      viewerRole: 'EMPLOYEE',
      viewerUserId: NONE,
      viewerEmployeeId: NONE,
    });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(0);
  });

  it('listExceptions: a privileged viewer with a status filter returns an array', async () => {
    const rows = await attendanceExceptionService.listExceptions({
      viewerRole: 'SUPERADMIN',
      viewerUserId: NONE,
      status: 'PENDING',
    });
    expect(Array.isArray(rows)).toBe(true);
  });
});
