import type { UserRole } from '@/lib/permissions';
import type { DashboardActionTone } from '@/lib/dashboard/action-cards';

/**
 * Shared dashboard data shapes. Extracted from app/dashboard/page.tsx so the
 * (large) superadmin dashboard components can be split into their own files
 * without importing types from a route module.
 */
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  todayAttendance: {
    total: number;
    present: number;
    percentage: number;
  };
  pendingLeave: number;
  pendingKpiApprovals: number;
  lateToday: number;
  absentToday: number;
  unreadNotifications: number;
  pendingAttendanceExceptions: number;
  pendingOT?: number;
  payrollPeriodStatus: { period: string; status: string } | null;
  role: UserRole;
  superadminInsights?: SuperadminInsights;
}

export interface SuperadminInsights {
  attendanceTrend: Array<{ date: string; label: string; present: number; late: number; absent: number }>;
  divisionMonitoring: Array<{ division: string; employeeCount: number; attendanceRate: number }>;
  kpiOverview: {
    averageScore: number;
    approvedCount: number;
    pendingCount: number;
    topPerformers: Array<{ employeeId: string; name: string; division: string | null; score: number }>;
    lowPerformers: Array<{ employeeId: string; name: string; division: string | null; score: number }>;
  };
  employeeRisks: Array<{ employeeId: string; name: string; division: string; lateCount: number; absentCount: number; averageKpi: number; riskScore: number }>;
  managementCards: Array<{ label: string; value: number; detail: string; href: string; tone: DashboardActionTone; isCurrency?: boolean }>;
  recentActivity?: Array<{ id: string; action: string; entity: string; user: string; time: string }>;
  pendingApprovalsList?: Array<{ id: string; type: string; detail: string; employeeName: string; time: string }>;
}
