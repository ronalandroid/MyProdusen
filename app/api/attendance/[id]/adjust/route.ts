import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { db, attendances } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const body = await request.json();
    const { reason, overrideReason } = body;
    
    if (!reason || String(reason).trim().length < 5) {
      return errorResponse('Alasan penyesuaian wajib diisi minimal 5 karakter', 422);
    }

    // Get the attendance record to check the date
    const [attendance] = await db
      .select()
      .from(attendances)
      .where(eq(attendances.id, id))
      .limit(1);

    if (!attendance) {
      return errorResponse('Data absensi tidak ditemukan', 404);
    }

    // Check if the attendance date is in a locked period
    try {
      await payrollPeriodService.assertDateEditable(
        attendance.checkInTime,
        overrideReason,
        user.role === 'SUPERADMIN'
      );
    } catch (error: any) {
      return errorResponse(error.message, 403);
    }

    const updatedAttendance = await attendanceService.adjustAttendance(id, {
      checkInTime: body.checkInTime ? new Date(body.checkInTime) : undefined,
      checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : undefined,
      status: body.status,
      lateMinutes: body.lateMinutes,
      earlyLeaveMinutes: body.earlyLeaveMinutes,
      totalWorkMinutes: body.totalWorkMinutes,
      reason,
      adjustedBy: user.userId,
    });

    // Log audit with override reason if provided
    await logAudit(
      user.userId, 
      'ADJUST', 
      'Attendance', 
      id, 
      attendance, 
      {
        ...updatedAttendance,
        adjustmentReason: reason,
        overrideReason: overrideReason || null,
      }, 
      request
    );

    return successResponse(updatedAttendance, 'Absensi berhasil disesuaikan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menyesuaikan absensi');
  }
}
