import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const body = await request.json();
    const { reason } = body;
    if (!reason || String(reason).trim().length < 5) {
      return errorResponse('Alasan penyesuaian wajib diisi minimal 5 karakter', 422);
    }

    const attendance = await attendanceService.adjustAttendance(id, {
      checkInTime: body.checkInTime ? new Date(body.checkInTime) : undefined,
      checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : undefined,
      status: body.status,
      lateMinutes: body.lateMinutes,
      earlyLeaveMinutes: body.earlyLeaveMinutes,
      totalWorkMinutes: body.totalWorkMinutes,
      reason,
      adjustedBy: user.userId,
    });

    await logAudit(user.userId, 'ADJUST', 'Attendance', id, undefined, attendance, request);

    return successResponse(attendance, 'Absensi berhasil disesuaikan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menyesuaikan absensi');
  }
}
