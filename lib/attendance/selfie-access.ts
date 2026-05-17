/**
 * Shared authorization + file-resolution logic for the protected attendance
 * selfie endpoints.
 *
 * Endpoints:
 *   GET /api/attendances/:attendanceId/selfie/check-in
 *   GET /api/attendances/:attendanceId/selfie/check-out
 *
 * Rules:
 *   - Auth required (JWT cookie or Authorization header).
 *   - Employee: only own selfie.
 *   - Supervisor: only team selfie (employee.supervisorId === supervisor.id).
 *   - ADMIN_HR / SUPERADMIN: all selfies.
 *   - All non-self viewing creates an audit log entry (`SELFIE_VIEW`).
 *   - Path traversal blocked, no public access.
 */

import { eq } from 'drizzle-orm';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { db, attendances, employees } from '@/lib/db';
import { resolveSelfieStoragePath } from '@/lib/upload';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';
import type { JwtPayload } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export type SelfieType = 'check-in' | 'check-out';

export type SelfieAccessOutcome =
  | { ok: true; data: { buffer: Buffer; mimeType: string; size: number } }
  | { ok: false; status: number; error: string };

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const SAFE_ATTENDANCE_ID = /^[A-Za-z0-9_-]+$/;

function isSelfRequest(viewerUserId: string, employeeUserId: string | null) {
  return Boolean(employeeUserId) && viewerUserId === employeeUserId;
}

export async function loadAttendanceSelfie(
  request: NextRequest,
  viewer: JwtPayload,
  attendanceId: string,
  type: SelfieType,
): Promise<SelfieAccessOutcome> {
  if (!attendanceId || !SAFE_ATTENDANCE_ID.test(attendanceId)) {
    return { ok: false, status: 404, error: 'Selfie tidak ditemukan' };
  }

  const [row] = await db
    .select({ attendance: attendances, employee: employees })
    .from(attendances)
    .leftJoin(employees, eq(attendances.employeeId, employees.id))
    .where(eq(attendances.id, attendanceId))
    .limit(1);

  if (!row?.attendance || !row.employee) {
    return { ok: false, status: 404, error: 'Selfie tidak ditemukan' };
  }

  if (viewer.role === 'EMPLOYEE') {
    if (row.employee.userId !== viewer.userId) {
      return { ok: false, status: 403, error: 'Anda tidak memiliki akses melihat selfie absensi ini' };
    }
  } else if (viewer.role === 'SUPERVISOR') {
    const supervisor = await employeeService.getEmployeeByUserId(viewer.userId).catch(() => null);
    if (!supervisor || row.employee.supervisorId !== supervisor.id) {
      return { ok: false, status: 403, error: 'Anda hanya dapat melihat selfie absensi tim Anda' };
    }
  } else if (!['SUPERADMIN', 'ADMIN_HR'].includes(viewer.role)) {
    if (!hasPermission(viewer.role, 'ATTENDANCE_READ')) {
      return { ok: false, status: 403, error: 'Anda tidak memiliki akses melihat selfie absensi' };
    }
  }

  const stored =
    type === 'check-in'
      ? row.attendance.checkInSelfiePath ||
        row.attendance.checkInSelfieUrl ||
        row.attendance.checkInSelfie
      : row.attendance.checkOutSelfiePath ||
        row.attendance.checkOutSelfieUrl ||
        row.attendance.checkOutSelfie;

  if (!stored) {
    return { ok: false, status: 404, error: 'Selfie tidak ditemukan' };
  }

  const filePath = resolveSelfieStoragePath(stored);

  if (!filePath) {
    await logAudit(
      viewer.userId,
      'INVALID_SELFIE_ACCESS',
      'Attendance',
      attendanceId,
      undefined,
      { type, stored },
      request,
    );
    return { ok: false, status: 404, error: 'Selfie tidak ditemukan' };
  }

  const stats = await stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    return { ok: false, status: 404, error: 'Selfie tidak ditemukan' };
  }

  const buffer = await readFile(filePath);
  const extension = (path.extname(filePath).slice(1) || 'jpg').toLowerCase();
  const mimeType =
    (type === 'check-in'
      ? row.attendance.checkInSelfieMimeType
      : row.attendance.checkOutSelfieMimeType) ||
    MIME_BY_EXTENSION[extension] ||
    'application/octet-stream';

  // Audit only when an admin/HR/supervisor (not the owner) views the selfie.
  if (!isSelfRequest(viewer.userId, row.employee.userId)) {
    await logAudit(
      viewer.userId,
      'SELFIE_VIEW',
      'Attendance',
      attendanceId,
      undefined,
      {
        type,
        viewerRole: viewer.role,
        employeeId: row.employee.id,
        sizeBytes: stats.size,
      },
      request,
    );
  }

  return {
    ok: true,
    data: { buffer, mimeType, size: stats.size },
  };
}
