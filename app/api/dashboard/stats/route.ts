import { NextRequest } from 'next/server';
import { db, employees, attendances, leaveRequests, kpiResults } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Only SUPERADMIN, ADMIN_HR, and SUPERVISOR can view dashboard stats
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total active employees
    const [totalEmployeesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.status, 'ACTIVE'));
    const totalEmployees = totalEmployeesResult?.count || 0;

    // Today's attendance count
    const [todayAttendanceResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendances)
      .where(
        and(
          gte(attendances.checkInTime, today),
          lte(attendances.checkInTime, tomorrow)
        )
      );
    const todayAttendance = todayAttendanceResult?.count || 0;

    // Attendance rate today
    const attendanceRate = totalEmployees > 0 
      ? Math.round((todayAttendance / totalEmployees) * 100) 
      : 0;

    // Late today
    const [lateTodayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendances)
      .where(
        and(
          gte(attendances.checkInTime, today),
          lte(attendances.checkInTime, tomorrow),
          eq(attendances.status, 'LATE')
        )
      );
    const lateToday = lateTodayResult?.count || 0;

    // Pending leave requests
    const [pendingLeavesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(eq(leaveRequests.status, 'PENDING'));
    const pendingLeaves = pendingLeavesResult?.count || 0;

    // Approved leaves today
    const [onLeaveResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.status, 'APPROVED'),
          lte(leaveRequests.startDate, today),
          gte(leaveRequests.endDate, today)
        )
      );
    const onLeaveToday = onLeaveResult?.count || 0;

    // Pending KPI approvals (current month)
    const currentMonth = today.toISOString().slice(0, 7);
    const [pendingKpiResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(kpiResults)
      .where(
        and(
          eq(kpiResults.period, currentMonth),
          eq(kpiResults.isApproved, false)
        )
      );
    const pendingKpiApprovals = pendingKpiResult?.count || 0;

    // Absent today (employees not checked in and not on leave)
    const absentToday = totalEmployees - todayAttendance - onLeaveToday;

    return successResponse({
      totalEmployees,
      todayAttendance,
      attendanceRate,
      lateToday,
      absentToday: Math.max(0, absentToday),
      onLeaveToday,
      pendingLeaves,
      pendingKpiApprovals,
      date: today.toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil statistik dashboard');
  }
}
