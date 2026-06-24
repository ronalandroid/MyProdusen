import Link from "next/link";
import type { DashboardStats, SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { ManagementCard } from "./ManagementCard";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { KpiOverviewCard } from "./KpiOverviewCard";
import { DivisionMonitoringChart } from "./DivisionMonitoringChart";
import { EmployeeRiskPanel } from "./EmployeeRiskPanel";
import { RecentActivityPanel } from "./RecentActivityPanel";
import { PendingApprovalsPanel } from "./PendingApprovalsPanel";

export function SuperadminMonitoring({ insights, stats }: { insights: SuperadminInsights; stats: DashboardStats }) {
  return (
    <section className="animate-slide-up" aria-labelledby="superadmin-monitoring-title" style={{ animationDelay: '820ms' }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Superadmin Control Center</p>
          <h2 id="superadmin-monitoring-title">Monitoring Perusahaan</h2>
        </div>
        <Link href="/dashboard/reports" className="text-link text-sm">Laporan lengkap →</Link>
      </div>

      <div className="quick-actions-grid mb-5">
        <ManagementCard card={{ label: "Pengguna", value: insights.managementCards.length, detail: "Manajemen User", href: "/dashboard/users", tone: "info" }} delay="800ms" />
        <ManagementCard card={{ label: "KPI", value: insights.kpiOverview.pendingCount, detail: "Template KPI & assignment", href: "/dashboard/kpi/template", tone: "warning" }} delay="820ms" />
        {insights.managementCards.map((card, index) => (
          <ManagementCard key={card.label} card={card} delay={`${850 + index * 50}ms`} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] mb-5">
        <AttendanceTrendChart trend={insights.attendanceTrend} />
        <KpiOverviewCard overview={insights.kpiOverview} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr] mb-5">
        <DivisionMonitoringChart divisions={insights.divisionMonitoring} />
        <EmployeeRiskPanel risks={insights.employeeRisks} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <RecentActivityPanel activities={insights.recentActivity || []} />
        <PendingApprovalsPanel approvals={insights.pendingApprovalsList || []} />
      </div>
    </section>
  );
}
