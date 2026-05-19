import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { eq, or } from 'drizzle-orm';
import path from 'path';
import { attendances, db, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { resolveSelfieStoragePath } from '@/lib/upload';
import { logAudit } from '@/lib/audit';

const SELFIE_ROUTE_PREFIX = '/api/attendance/selfie/';
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const SAFE_FILENAME = /^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i;
const SAFE_DIR_SEGMENT = /^[A-Za-z0-9_-]+$/;

function buildSelfieKey(segments: string[]): string | null {
  if (!segments.length) {
    return null;
  }

  const filename = segments[segments.length - 1];
  if (!SAFE_FILENAME.test(filename)) {
    return null;
  }

  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (!SAFE_DIR_SEGMENT.test(segment)) {
      return null;
    }
  }

  return segments.join('/');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const user = await requireAuth(request);
    const resolvedParams = await params;
    const segments = (resolvedParams.path || []).filter(Boolean);
    const key = buildSelfieKey(segments);

    if (!key) {
      return notFoundResponse('Selfie tidak ditemukan');
    }

    const filePath = resolveSelfieStoragePath(key);

    if (!filePath) {
      await logAudit(user.userId, 'INVALID_SELFIE_ACCESS', 'Attendance', undefined, undefined, {
        path: key,
      }, request);
      return notFoundResponse('Selfie tidak ditemukan');
    }

    const selfieUrl = `${SELFIE_ROUTE_PREFIX}${key}`;
    const [attendance] = await db
      .select({ attendance: attendances, employee: employees })
      .from(attendances)
      .leftJoin(employees, eq(attendances.employeeId, employees.id))
      .where(
        or(
          eq(attendances.checkInSelfie, selfieUrl),
          eq(attendances.checkOutSelfie, selfieUrl),
          eq(attendances.checkInSelfieUrl, selfieUrl),
          eq(attendances.checkOutSelfieUrl, selfieUrl),
        ),
      )
      .limit(1);

    if (!attendance?.employee) {
      return notFoundResponse('Selfie tidak ditemukan');
    }

    if (user.role === 'EMPLOYEE' && attendance.employee.userId !== user.userId) {
      return forbiddenResponse('Anda tidak memiliki akses melihat selfie absensi ini');
    }


    const allowedRoles = ['EMPLOYEE', 'SUPERADMIN'];
    if (!allowedRoles.includes(user.role) && !hasPermission(user.role, 'ATTENDANCE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses melihat selfie absensi');
    }

    const stats = await stat(filePath).catch(() => null);
    if (!stats || !stats.isFile()) {
      return notFoundResponse('Selfie tidak ditemukan');
    }

    const file = await readFile(filePath);
    const extension = (path.extname(filePath).slice(1) || 'jpg').toLowerCase();

    if (attendance.employee.userId !== user.userId) {
      await logAudit(
        user.userId,
        'SELFIE_VIEW',
        'Attendance',
        attendance.attendance.id,
        undefined,
        {
          viewerRole: user.role,
          employeeId: attendance.employee.id,
          sizeBytes: stats.size,
        },
        request,
      );
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': MIME_BY_EXTENSION[extension] || 'application/octet-stream',
        'Cache-Control': 'no-store, private',
        'Content-Length': String(stats.size),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error?.code === 'ENOENT') {
      return notFoundResponse('Selfie tidak ditemukan');
    }
    return errorResponse('Gagal mengambil selfie absensi', 500);
  }
}
