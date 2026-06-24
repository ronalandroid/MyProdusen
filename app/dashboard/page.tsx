"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useCachedProfile, useDashboardStats, usePerformanceAnomalies, usePerformanceScores } from "@/hooks/useDashboardQueries";
import { SuperadminDashboard } from "@/features/dashboard/SuperadminDashboard";
import { LeaderDashboard } from "@/features/dashboard/LeaderDashboard";
import { AdminDashboard } from "@/features/dashboard/AdminDashboard";
import type { DashboardStats } from "@/lib/dashboard/dashboard-types";

const DEFAULT_DASHBOARD_STATS: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  todayAttendance: { total: 0, present: 0, percentage: 0 },
  pendingLeave: 0,
  pendingKpiApprovals: 0,
  lateToday: 0,
  absentToday: 0,
  unreadNotifications: 0,
  pendingAttendanceExceptions: 0,
  payrollPeriodStatus: null,
  role: "EMPLOYEE",
};

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const profileQuery = useCachedProfile();
  const statsQuery = useDashboardStats<DashboardStats>();
  const stats = statsQuery.data ?? DEFAULT_DASHBOARD_STATS;
  const isSuperadmin = stats.role === "SUPERADMIN";
  const performanceScoresQuery = usePerformanceScores<any>(isSuperadmin);
  const performanceAnomaliesQuery = usePerformanceAnomalies<any>(isSuperadmin);
  const profile = profileQuery.data ?? null;
  const performanceSummaries = performanceScoresQuery.data ?? [];
  const performanceAnomalies = performanceAnomaliesQuery.data ?? [];
  const error = profileQuery.error?.message || statsQuery.error?.message || "";
  const loading = (profileQuery.isLoading || statsQuery.isLoading) && !profile && !statsQuery.data;

  useEffect(() => {
    if (statsQuery.dataUpdatedAt) setLastUpdated(new Date(statsQuery.dataUpdatedAt));
  }, [statsQuery.dataUpdatedAt]);

  const loadDashboardData = async () => {
    await Promise.all([
      profileQuery.refetch(),
      statsQuery.refetch(),
      isSuperadmin ? performanceScoresQuery.refetch() : Promise.resolve(),
      isSuperadmin ? performanceAnomaliesQuery.refetch() : Promise.resolve(),
    ]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat dashboard..." />
      </div>
    );
  }

  if (stats.role === "LEADER") {
    return <LeaderDashboard profile={profile} onReload={loadDashboardData} />;
  }

  if (stats.role !== "SUPERADMIN") {
    return <AdminDashboard profile={profile} error={error} onReload={loadDashboardData} />;
  }

  return (
    <SuperadminDashboard
      stats={stats}
      profile={profile}
      error={error}
      lastUpdated={lastUpdated}
      performanceSummaries={performanceSummaries}
      performanceAnomalies={performanceAnomalies}
      onReload={loadDashboardData}
    />
  );
}
