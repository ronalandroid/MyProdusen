import { NextRequest } from 'next/server';
import { db, users, employees, attendances, leaveRequests, kpiResults, notifications, payrollRuns, attendanceExceptions, workLocations, auditLogs, payrollItems, overtimeRequests } from '@/lib/db';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { eq, and, gte, lte, sql, desc, inArray } from 'drizzle-orm';
import { handleApiError } from '@/lib/core/route-handler';

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

    const [pendingOTResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(overtimeRequests)
      .where(eq(overtimeRequests.status, 'PENDING'));
    const pendingOT = pendingOTResult?.count || 0;

    const [latestPayrollRun] = await db
      .select({ period: payrollRuns.period, status: payrollRuns.status })
      .from(payrollRuns)
      .orderBy(desc(payrollRuns.period))
      .limit(1);

    const superadminInsights = user.role === 'SUPERADMIN'
      ? await getSuperadminInsights({ today, tomorrow, currentMonth, pendingLeaves, pendingKpiApprovals, pendingAttendanceExceptions })
      : undefined;

    // Absent today (employees not checked in and not on leave)
    const absentToday = totalEmployees - todayAttendance - onLeaveToday;

    const dashboardStats = {
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
      pendingOT,
      payrollPeriodStatus: latestPayrollRun || null,
      date: today.toISOString(),
      role: user.role,
      ...(superadminInsights ? { superadminInsights } : {}),
    };

    return successResponse(dashboardStats);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return handleApiError(error);
  }
}

async function getSuperadminInsights(input: {
  today: Date;
  tomorrow: Date;
  currentMonth: string;
  pendingLeaves: number;
  pendingKpiApprovals: number;
  pendingAttendanceExceptions: number;
}) {
  const trendStart = new Date(input.today);
  trendStart.setDate(trendStart.getDate() - 6);

  const trendRows = await db
    .select({
      day: sql<string>`to_char(${attendances.checkInTime}, 'YYYY-MM-DD')`,
      present: sql<number>`count(*) filter (where ${attendances.status} = 'PRESENT')::int`,
      late: sql<number>`count(*) filter (where ${attendances.status} = 'LATE')::int`,
      absent: sql<number>`count(*) filter (where ${attendances.status} = 'ABSENT')::int`,
    })
    .from(attendances)
    .where(gte(attendances.checkInTime, trendStart))
    .groupBy(sql`to_char(${attendances.checkInTime}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${attendances.checkInTime}, 'YYYY-MM-DD')`);

  const trendByDay = new Map(trendRows.map((row) => [row.day, row]));
  const attendanceTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendStart);
    date.setDate(trendStart.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    const row = trendByDay.get(key);
    return {
      date: key,
      label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      present: row?.present || 0,
      late: row?.late || 0,
      absent: row?.absent || 0,
    };
  });

  const activeEmployeeRows = await db
    .select({ id: employees.id, division: employees.division })
    .from(employees)
    .where(eq(employees.status, 'ACTIVE'));

  const todayAttendanceRows = await db
    .select({ employeeId: attendances.employeeId })
    .from(attendances)
    .where(and(gte(attendances.checkInTime, input.today), lte(attendances.checkInTime, input.tomorrow)));

  const presentEmployeeIds = new Set(todayAttendanceRows.map((row) => row.employeeId));
  const divisions = new Map<string, { division: string; employeeCount: number; presentToday: number }>();
  for (const employee of activeEmployeeRows) {
    const division = employee.division || 'Belum Diisi';
    const current = divisions.get(division) || { division, employeeCount: 0, presentToday: 0 };
    current.employeeCount += 1;
    if (presentEmployeeIds.has(employee.id)) current.presentToday += 1;
    divisions.set(division, current);
  }

  const divisionMonitoring = Array.from(divisions.values())
    .sort((left, right) => right.employeeCount - left.employeeCount)
    .slice(0, 6)
    .map((row) => ({
      division: row.division,
      employeeCount: row.employeeCount,
      attendanceRate: row.employeeCount > 0 ? Math.round((row.presentToday / row.employeeCount) * 100) : 0,
    }));

  const [kpiAggregate] = await db
    .select({
      averageScore: sql<number>`coalesce(round(avg(${kpiResults.score}))::int, 0)`,
      approvedCount: sql<number>`count(*) filter (where ${kpiResults.isApproved} = true)::int`,
      pendingCount: sql<number>`count(*) filter (where ${kpiResults.isApproved} = false)::int`,
    })
    .from(kpiResults)
    .where(eq(kpiResults.period, input.currentMonth));

  const topPerformers = await db
    .select({
      employeeId: employees.id,
      name: employees.fullName,
      division: employees.division,
      score: sql<number>`round(avg(${kpiResults.score}))::int`,
    })
    .from(kpiResults)
    .innerJoin(employees, eq(employees.id, kpiResults.employeeId))
    .where(eq(kpiResults.period, input.currentMonth))
    .groupBy(employees.id, employees.fullName, employees.division)
    .orderBy(sql`avg(${kpiResults.score}) desc`)
    .limit(3);

  const lowPerformers = await db
    .select({
      employeeId: employees.id,
      name: employees.fullName,
      division: employees.division,
      score: sql<number>`round(avg(${kpiResults.score}))::int`,
    })
    .from(kpiResults)
    .innerJoin(employees, eq(employees.id, kpiResults.employeeId))
    .where(eq(kpiResults.period, input.currentMonth))
    .groupBy(employees.id, employees.fullName, employees.division)
    .orderBy(sql`avg(${kpiResults.score}) asc`)
    .limit(3);

  const employeeRiskRows = await db
    .select({
      employeeId: employees.id,
      name: employees.fullName,
      division: employees.division,
      lateCount: sql<number>`count(${attendances.id}) filter (where ${attendances.status} = 'LATE')::int`,
      absentCount: sql<number>`count(${attendances.id}) filter (where ${attendances.status} = 'ABSENT')::int`,
      averageKpi: sql<number>`coalesce(round(avg(${kpiResults.score}))::int, 0)`,
    })
    .from(employees)
    .leftJoin(attendances, and(eq(attendances.employeeId, employees.id), gte(attendances.checkInTime, trendStart)))
    .leftJoin(kpiResults, and(eq(kpiResults.employeeId, employees.id), eq(kpiResults.period, input.currentMonth)))
    .where(eq(employees.status, 'ACTIVE'))
    .groupBy(employees.id, employees.fullName, employees.division)
    .orderBy(sql`(count(${attendances.id}) filter (where ${attendances.status} = 'LATE') + count(${attendances.id}) filter (where ${attendances.status} = 'ABSENT')) desc`, sql`avg(${kpiResults.score}) asc nulls last`)
    .limit(5);

  const employeeRisks = employeeRiskRows
    .map((row) => ({
      employeeId: row.employeeId,
      name: row.name,
      division: row.division || 'Belum Diisi',
      lateCount: row.lateCount,
      absentCount: row.absentCount,
      averageKpi: row.averageKpi,
      riskScore: row.lateCount * 2 + row.absentCount * 3 + (row.averageKpi > 0 && row.averageKpi < 70 ? 2 : 0),
    }))
    .filter((row) => row.riskScore > 0);

  const roleRows = await db
    .select({ role: users.role, count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.isActive, true))
    .groupBy(users.role);
  const activeUsersByRole = roleRows.reduce<Record<string, number>>((accumulator, row) => {
    accumulator[row.role] = row.count;
    return accumulator;
  }, {});

  // 1. Cabang Aktif
  const [activeBranchesResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workLocations)
    .where(eq(workLocations.isActive, true));
  const activeBranches = activeBranchesResult?.count || 0;

  // 2. Total Gaji (from the latest payroll run)
  const [latestPayroll] = await db
    .select({ id: payrollRuns.id, totalNetPay: payrollRuns.totalNetPay, period: payrollRuns.period })
    .from(payrollRuns)
    .orderBy(desc(payrollRuns.period))
    .limit(1);

  // 3. Aktivitas Sistem Terbaru (Audit Logs)
  const recentActivityRows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      createdAt: auditLogs.createdAt,
      user: users.username,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(5);

  const recentActivity = recentActivityRows.map(row => ({
    id: row.id,
    action: row.action,
    entity: row.entity,
    user: row.user || 'Sistem',
    time: row.createdAt.toISOString(),
  }));

  // 4. Approval Pending List (Attendance Exceptions & Leaves)
  const pendingExceptionRows = await db
    .select({
      id: attendanceExceptions.id,
      type: sql<string>`'Kehadiran'`,
      detail: attendanceExceptions.reason,
      employeeName: employees.fullName,
      createdAt: attendanceExceptions.createdAt,
    })
    .from(attendanceExceptions)
    .leftJoin(employees, eq(employees.id, attendanceExceptions.employeeId))
    .where(eq(attendanceExceptions.status, 'PENDING'))
    .orderBy(desc(attendanceExceptions.createdAt))
    .limit(3);

  const pendingLeaveRows = await db
    .select({
      id: leaveRequests.id,
      type: sql<string>`'Cuti/Izin'`,
      detail: leaveRequests.reason,
      employeeName: employees.fullName,
      createdAt: leaveRequests.createdAt,
    })
    .from(leaveRequests)
    .leftJoin(employees, eq(employees.id, leaveRequests.employeeId))
    .where(eq(leaveRequests.status, 'PENDING'))
    .orderBy(desc(leaveRequests.createdAt))
    .limit(3);

  const pendingApprovalsList = [...pendingExceptionRows, ...pendingLeaveRows]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map(row => ({
      id: row.id,
      type: row.type,
      detail: row.detail,
      employeeName: row.employeeName || 'Unknown',
      time: row.createdAt.toISOString(),
    }));

  return {
    attendanceTrend,
    divisionMonitoring,
    kpiOverview: {
      averageScore: kpiAggregate?.averageScore || 0,
      approvedCount: kpiAggregate?.approvedCount || 0,
      pendingCount: kpiAggregate?.pendingCount || 0,
      topPerformers,
      lowPerformers,
    },
    employeeRisks,
    recentActivity,
    pendingApprovalsList,
    managementCards: [
      {
        label: 'Total Karyawan',
        value: Object.values(activeUsersByRole).reduce((total, count) => total + count, 0),
        detail: `${activeUsersByRole.SUPERADMIN || 0} Superadmin · ${activeUsersByRole.EMPLOYEE || 0} Karyawan`,
        href: '/dashboard/employees',
        tone: 'primary',
      },
      {
        label: 'Cabang Aktif',
        value: activeBranches,
        detail: 'Lokasi kerja yang beroperasi',
        href: '/dashboard/locations',
        tone: 'info',
      },
      {
        label: 'Pengajuan Pending',
        value: input.pendingLeaves + input.pendingKpiApprovals + input.pendingAttendanceExceptions,
        detail: `${input.pendingLeaves} Cuti · ${input.pendingKpiApprovals} KPI · ${input.pendingAttendanceExceptions} Absensi`,
        href: '/dashboard/attendance/exceptions',
        tone: (input.pendingLeaves + input.pendingKpiApprovals + input.pendingAttendanceExceptions) > 0 ? 'warning' : 'success',
      },
      {
        label: 'Total Gaji (Bulan Ini)',
        value: latestPayroll?.totalNetPay || 0,
        detail: `Periode: ${latestPayroll?.period || 'Belum ada'}`,
        href: '/dashboard/payroll',
        tone: 'success',
        isCurrency: true,
      },
    ],
  };
}

async function getScopedEmployeeIds(role: string, employeeId?: string): Promise<string[] | undefined> {
  if (role === 'SUPERADMIN') {
    return undefined;
  }

  if (!employeeId) {
    return [];
  }

  return [employeeId];
}
