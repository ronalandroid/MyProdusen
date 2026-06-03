import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { scheduleService } from '@/services/attendance/schedule.service';
import { employeeService } from '@/services/employees/employee.service';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, successResponse, unauthorizedResponse } from '@/utils/response';

// Attendance "today" must never be served from a cached/prerendered response —
// it is per-user and changes the instant a clock event lands.
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const [attendance, schedule] = await Promise.all([
      attendanceService.getTodayAttendance(employee.id),
      scheduleService.getScheduleForDate(employee.id),
    ]);

    return successResponse({
      attendance,
      schedule,
      serverTime: timeFormatter.format(new Date()),
      employee: { id: employee.id, name: employee.fullName },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    return errorResponse(error.message || 'Gagal mengambil absensi hari ini');
  }
}
