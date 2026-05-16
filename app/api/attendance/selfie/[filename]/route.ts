import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { and, eq, or } from 'drizzle-orm';
import { attendances, db, employees } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';

const SELFIE_ROUTE_PREFIX = '/api/attendance/selfie/';
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getSelfiePath(filename: string) {
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return null;
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
  return path.join(uploadDir, 'selfies', filename);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const user = await requireAuth(request);
    const { filename } = await params;
    const filePath = getSelfiePath(filename);

    if (!filePath) {
      return notFoundResponse('Selfie tidak ditemukan');
    }

    const selfieUrl = `${SELFIE_ROUTE_PREFIX}${filename}`;
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

    if (user.role === 'SUPERVISOR') {
      const supervisor = await employeeService.getEmployeeByUserId(user.userId);
      if (attendance.employee.supervisorId !== supervisor.id) {
        return forbiddenResponse('Anda hanya dapat melihat selfie absensi tim Anda');
      }
    }

    if (!['EMPLOYEE', 'SUPERVISOR', 'SUPERADMIN', 'ADMIN_HR'].includes(user.role) && !hasPermission(user.role, 'ATTENDANCE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses melihat selfie absensi');
    }

    const file = await readFile(filePath);
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';

    return new NextResponse(file, {
      headers: {
        'Content-Type': MIME_BY_EXTENSION[extension] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.code === 'ENOENT') {
      return notFoundResponse('Selfie tidak ditemukan');
    }
    return errorResponse('Gagal mengambil selfie absensi', 500);
  }
}
