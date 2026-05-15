import { NextRequest } from 'next/server';
import { db, employees, attendances, leaveRequests, kpiResults, notifications, payrollRuns, attendanceExceptions } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { eq, and, gte, lte, sql, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [currentEmployee] = await db
      .select({ id: employees.id, defaultShiftId: employees.defaultShiftId })
      .from(employees)
      .where(eq(employees.userId, user.userId))
      .limit(1);

    const scopedEmployeeIds = await getScopedEmployeeIds(user.role, currentEmployee?.id);
    const scopedAttendanceFilter = scopedEmployeeIds
      ? inArray(attendances.employeeId, scopedEmployeeIds)
      : undefined;
    const scopedLeaveFilter = scopedEmployeeIds
      ? inArray(leaveRequests.employeeId, scopedEmployeeIds)
      : undefined;
    const scopedKpiFilter = scopedEmployeeIds
      ? inArray(kpiResults.employeeId, scopedEmployeeIds)
      : undefined;
    const scopedExceptionFilter = scopedEmployeeIds
      ? inArray(attendanceExceptions.employeeId, scopedEmployeeIds)
      : undefined;
    const scopedEmployeeFilter = scopedEmployeeIds
      ? inArray(employees.id, scopedEmployeeIds)
      : undefined;

    // Total active employees
    const [totalEmployeesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(and(eq(employees.status, 'ACTIVE'), scopedEmployeeFilter));
    const totalEmployees = totalEmployeesResult?.count || 0;

    // Today's attendance count
    const [todayAttendanceResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendances)
      .where(
        and(
          scopedAttendanceFilter,
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
          eq(attendances.status, 'LATE'),
          scopedAttendanceFilter
        )
      );
    const lateToday = lateTodayResult?.count || 0;

    // Pending leave requests
    const [pendingLeavesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(and(eq(leaveRequests.status, 'PENDING'), scopedLeaveFilter));
    const pendingLeaves = pendingLeavesResult?.count || 0;

    // Approved leaves today
    const [onLeaveResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.status, 'APPROVED'),
          lte(leaveRequests.startDate, today),
          gte(leaveRequests.endDate, today),
          scopedLeaveFilter
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
          eq(kpiResults.isApproved, false),
          scopedKpiFilter
        )
      );
    const pendingKpiApprovals = pendingKpiResult?.count || 0;

    const [unreadNotificationsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.userId), eq(notifications.isRead, false)));
    const unreadNotifications = unreadNotificationsResult?.count || 0;

    const [pendingExceptionsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(attendanceExceptions)
      .where(and(eq(attendanceExceptions.status, 'PENDING'), scopedExceptionFilter));
    const pendingAttendanceExceptions = pendingExceptionsResult?.count || 0;

    const [latestPayrollRun] = await db
      .select({ period: payrollRuns.period, status: payrollRuns.status })
      .from(payrollRuns)
      .orderBy(desc(payrollRuns.period))
      .limit(1);

    // Absent today (employees not checked in and not on leave)
    const absentToday = totalEmployees - todayAttendance - onLeaveToday;

    return successResponse({
      totalEmployees,
      activeEmployees: totalEmployees,
      todayAttendance: {
        total: totalEmployees,
        present: todayAttendance,
        percentage: attendanceRate,
      },
      lateToday,
      absentToday: Math.max(0, absentToday),
      onLeaveToday,
      pendingLeave: pendingLeaves,
      pendingLeaves,
      pendingKpiApprovals,
      unreadNotifications,
      pendingAttendanceExceptions,
      payrollPeriodStatus: latestPayrollRun || null,
      date: today.toISOString(),
      role: user.role,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil statistik dashboard');
  }
}

async function getScopedEmployeeIds(role: string, employeeId?: string): Promise<string[] | undefined> {
  if (role === 'SUPERADMIN' || role === 'ADMIN_HR') {
    return undefined;
  }

  if (!employeeId) {
    return [];
  }

  if (role === 'SUPERVISOR') {
    const team = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.supervisorId, employeeId));

    return [employeeId, ...team.map((member) => member.id)];
  }

  return [employeeId];
}
