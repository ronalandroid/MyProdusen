"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, CheckCircle, Clock, TrendingUp, Users, AlertTriangle, CalendarDays, RefreshCcw, ArrowRight, ShieldCheck, BarChart3 } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders, fetchProfile } from "@/lib/auth-client";
import AttendanceHeatmap from "@/components/attendance/AttendanceHeatmap";
import { buildDashboardActions, type DashboardActionTone } from "@/lib/dashboard/action-cards";
import { getRoleExperience } from "@/lib/dashboard/role-experience";
import type { UserRole } from "@/lib/permissions";

interface DashboardStats {
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
  payrollPeriodStatus: { period: string; status: string } | null;
  role: UserRole;
  superadminInsights?: SuperadminInsights;
}

interface SuperadminInsights {
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

const numberFormatter = new Intl.NumberFormat("id-ID");

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
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
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const userProfile = await fetchProfile();
      setProfile(userProfile);

      const statsRes = await fetch("/api/dashboard/stats", { headers: getAuthHeaders() });
      const statsData = await statsRes.json();

      if (!statsRes.ok || !statsData.success) {
        throw new Error(statsData.error || "Sebagian data dashboard gagal dimuat.");
      }

      setStats(statsData.data);
      setLastUpdated(new Date());
    } catch (dashboardError) {
      console.error("Failed to load dashboard data:", dashboardError);
      setError(dashboardError instanceof Error ? dashboardError.message : "Dashboard gagal dimuat.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat dashboard..." />
      </div>
    );
  }

  const displayName = profile?.employee?.fullName || profile?.username || "User";
  const initials = displayName.substring(0, 2).toUpperCase();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Selamat Pagi" : currentHour < 18 ? "Selamat Siang" : "Selamat Malam";
  const roleExperience = getRoleExperience(stats.role);
  const canOpenPayroll = stats.role === "SUPERADMIN";
  const canOpenReports = stats.role === "SUPERADMIN";
  const actionCards = buildDashboardActions(stats.role, {
    pendingLeaves: stats.pendingLeave,
    pendingKpiApprovals: stats.pendingKpiApprovals,
    lateToday: stats.lateToday,
    absentToday: stats.absentToday,
    unreadNotifications: stats.unreadNotifications,
    pendingAttendanceExceptions: stats.pendingAttendanceExceptions,
  });

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header */}
      {stats.role === 'SUPERADMIN' ? (
        <header className="dashboard-header superadmin-header animate-slide-up" style={{ backgroundColor: 'var(--primary)', color: 'var(--text-primary)', backgroundImage: 'url(/logo.png)', backgroundSize: '150px', backgroundPosition: 'calc(100% + 50px) center', backgroundRepeat: 'no-repeat' }}>
          <div className="dashboard-greeting relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold">Selamat Datang,<br/>Super Admin! 👑</h1>
            <p className="text-sm sm:text-base mt-2 max-w-[80%] font-medium">Kontrol penuh, informasi akurat, keputusan lebih tepat.</p>
            {lastUpdated && (
              <span className="last-updated mt-4 text-black/70">
                Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="dashboard-header-actions relative z-10">
            <Link href="/dashboard/notifications" className="icon-button bg-white/30 hover:bg-white/50 border-none" aria-label="Lihat notifikasi">
              <Bell size={20} aria-hidden="true" />
              {stats.unreadNotifications > 0 && <span className="notification-dot" aria-hidden="true" />}
            </Link>
            <Link href="/dashboard/profile" className="avatar avatar-link border-2 border-white" aria-label="Buka profil pengguna">
              {profile?.employee?.profilePhoto ? (
                <img src={profile.employee.profilePhoto} alt="" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </header>
      ) : (
        <header className="dashboard-header employee-header animate-slide-up">
          <div className="dashboard-greeting">
            <h1 className="text-2xl sm:text-3xl font-bold">Halo, {displayName}! 👋</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">Semangat bekerja hari ini!</p>
            {lastUpdated && (
              <span className="last-updated">
                Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="dashboard-header-actions">
            <Link href="/dashboard/notifications" className="icon-button" aria-label="Lihat notifikasi">
              <Bell size={20} aria-hidden="true" />
              {stats.unreadNotifications > 0 && <span className="notification-dot" aria-hidden="true" />}
            </Link>
            <Link href="/dashboard/profile" className="avatar avatar-link" aria-label="Buka profil pengguna">
              {profile?.employee?.profilePhoto ? (
                <img src={profile.employee.profilePhoto} alt="" />
              ) : (
                initials
              )}
            </Link>
          </div>
        </header>
      )}

      {/* Error Alert */}
      {error && (
        <section className="alert-card animate-slide-up" role="alert" style={{ animationDelay: '100ms' }}>
          <AlertTriangle size={20} aria-hidden="true" />
          <div className="flex-1">
            <strong>Data belum lengkap</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
            <RefreshCcw size={14} aria-hidden="true" />
            Coba lagi
          </button>
        </section>
      )}

      {/* Hero Card - Attendance */}
      <section className="hero-card animate-slide-up" aria-labelledby="attendance-title" style={{ animationDelay: '200ms' }}>
        <div className="flex-1">
          <p className="eyebrow text-white/80">Prioritas Hari Ini</p>
          <h2 id="attendance-title" className="text-white text-xl sm:text-2xl mb-2">{roleExperience.heroTitle}</h2>
          <p className="text-white/90 text-sm sm:text-base">
            {roleExperience.heroDescription}
          </p>
        </div>
        <div className="attendance-meter">
          <span className="text-3xl sm:text-4xl">{stats.todayAttendance.percentage}%</span>
          <small className="text-xs sm:text-sm">Hadir</small>
        </div>
        <Link href="/dashboard/attendance" className="hero-action group">
          <span>Buka Kehadiran</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      {/* Action Queue */}
      <section aria-labelledby="actions-title" className="animate-slide-up" style={{ animationDelay: '260ms' }}>
        <div className="section-heading">
          <h2 id="actions-title">Antrian Aksi</h2>
        </div>
        <div className="quick-actions-grid">
          {actionCards.map((action, index) => (
            <ActionQueueCard key={action.label} action={action} delay={`${320 + index * 50}ms`} />
          ))}
        </div>
      </section>

      {/* Stats Grid */}
      <section aria-labelledby="summary-title" className="animate-slide-up" style={{ animationDelay: '300ms' }}>
        <div className="section-heading">
          <h2 id="summary-title">Ringkasan Hari Ini</h2>
        </div>
        <div className="stats-grid">
          <StatCard 
            icon={<Users size={22} aria-hidden="true" />} 
            label="Karyawan" 
            value={stats.totalEmployees} 
            subtitle={`${stats.activeEmployees} Total aktif`}
            tone="info"
            delay="400ms"
          />
          <StatCard 
            icon={<Clock size={22} aria-hidden="true" />} 
            label="Hadir Hari Ini" 
            value={`${stats.todayAttendance.percentage}%`} 
            subtitle={`${stats.todayAttendance.present}/${stats.totalEmployees} Hadir`}
            tone="success"
            delay="450ms"
          />
          <StatCard 
            icon={<CalendarDays size={22} aria-hidden="true" />} 
            label="Cuti Pengajuan" 
            value={stats.pendingLeave} 
            subtitle="Menunggu"
            tone="warning"
            delay="500ms"
          />
          <StatCard 
            icon={<Bell size={22} aria-hidden="true" />} 
            label="Notifikasi" 
            value={stats.unreadNotifications} 
            subtitle="Belum dibaca"
            tone="primary"
            delay="550ms"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-title" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="section-heading">
          <h2 id="quick-actions-title">Aksi Cepat</h2>
        </div>
        <div className="quick-actions-grid">
          {roleExperience.quickActions.map((action, index) => {
            const iconMap = {
              attendance: <Clock size={24} aria-hidden="true" />,
              leave: <CalendarDays size={24} aria-hidden="true" />,
              reports: <TrendingUp size={24} aria-hidden="true" />,
              employees: <Users size={24} aria-hidden="true" />,
              kpi: <TrendingUp size={24} aria-hidden="true" />,
              profile: <Users size={24} aria-hidden="true" />,
            };
            return (
              <QuickAction
                key={action.href}
                href={action.href}
                icon={iconMap[action.icon]}
                title={action.title}
                description={action.description}
                delay={`${650 + index * 50}ms`}
              />
            );
          })}
        </div>
        <div className="card empty-state-card">
          <div className="w-12 h-12 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center mb-3">
            <CalendarDays size={24} className="text-[var(--warning)]" aria-hidden="true" />
          </div>
          <h3 className="text-base sm:text-lg">Status periode payroll</h3>
          <p className="text-xs sm:text-sm">
            {stats.payrollPeriodStatus
              ? `${stats.payrollPeriodStatus.period} sedang ${stats.payrollPeriodStatus.status}.`
              : "Belum ada periode payroll berjalan."}
          </p>
          {canOpenPayroll && <Link href="/dashboard/payroll" className="text-link text-sm">Buka Payroll →</Link>}
        </div>
      </section>

      {stats.role === "SUPERADMIN" && stats.superadminInsights && (
        <SuperadminMonitoring insights={stats.superadminInsights} />
      )}

      {/* Insights Grid */}
      {stats.role !== "SUPERADMIN" && (
        <section className="animate-slide-up" aria-labelledby="insights-title" style={{ animationDelay: '850ms' }}>
          <div className="section-heading full-span">
            <h2 id="insights-title">Insight Operasional & Kehadiran</h2>
          </div>
          
          <div className="mb-6 w-full">
            <AttendanceHeatmap />
          </div>

          <div className="insights-grid">
            <div className="card empty-state-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] flex items-center justify-center mb-3">
                <TrendingUp size={24} className="text-[var(--primary-dark)]" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg">KPI rata-rata belum tersedia</h3>
              <p className="text-xs sm:text-sm">Dashboard tidak menampilkan angka KPI sampai API agregasi Phase 6 siap.</p>
              <Link href="/dashboard/kpi" className="text-link text-sm">Kelola KPI →</Link>
            </div>
            {canOpenReports && <div className="card empty-state-card">
              <div className="w-12 h-12 rounded-xl bg-[var(--info-bg)] flex items-center justify-center mb-3">
                <Clock size={24} className="text-[var(--info)]" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg">Tren mingguan belum tersedia</h3>
              <p className="text-xs sm:text-sm">Grafik mingguan menunggu endpoint historis agar data produksi tidak memakai mock.</p>
              <Link href="/dashboard/reports" className="text-link text-sm">Buka Laporan →</Link>
            </div>}
          </div>
        </section>
      )}
    </div>
  );
}

function SuperadminMonitoring({ insights }: { insights: SuperadminInsights }) {
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

function ManagementCard({ card, delay }: { card: SuperadminInsights['managementCards'][number]; delay?: string }) {
  return (
    <Link href={card.href} className={`card group animate-scale-in action-card-${card.tone} flex flex-col gap-2 p-4 transition-transform hover:-translate-y-1 hover:shadow-lg`} style={{ animationDelay: delay, borderColor: mapToneToColor(card.tone) }}>
      <span className="flex flex-col">
        <strong className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold uppercase tracking-wide">{card.label}</strong>
        <strong className="text-2xl sm:text-3xl mt-1 text-[var(--text-primary)]">
          {card.isCurrency ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(card.value) : numberFormatter.format(card.value)}
        </strong>
      </span>
      <small className="text-xs sm:text-sm font-medium mt-auto" style={{ color: mapToneToColor(card.tone) }}>{card.detail}</small>
    </Link>
  );
}

function AttendanceTrendChart({ trend }: { trend: SuperadminInsights['attendanceTrend'] }) {
  const maxValue = Math.max(1, ...trend.map((day) => day.present + day.late + day.absent));
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">7 Hari Terakhir</p>
          <h3 className="text-base sm:text-lg">Tren Kehadiran</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Hadir, terlambat, dan absen per hari.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
          <BarChart3 size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-end gap-3 h-52" role="img" aria-label="Diagram batang tren kehadiran 7 hari terakhir">
        {trend.map((day) => {
          const presentHeight = Math.max(6, (day.present / maxValue) * 100);
          const lateHeight = Math.max(day.late ? 6 : 0, (day.late / maxValue) * 100);
          const absentHeight = Math.max(day.absent ? 6 : 0, (day.absent / maxValue) * 100);
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0">
              <div className="w-full max-w-10 h-40 flex flex-col justify-end rounded-xl bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
                <span style={{ height: `${absentHeight}%`, background: 'var(--danger)' }} />
                <span style={{ height: `${lateHeight}%`, background: 'var(--warning)' }} />
                <span style={{ height: `${presentHeight}%`, background: 'var(--success)' }} />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">{day.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
        <Legend color="var(--success)" label="Hadir" />
        <Legend color="var(--warning)" label="Telat" />
        <Legend color="var(--danger)" label="Absen" />
      </div>
    </div>
  );
}

function DivisionMonitoringChart({ divisions }: { divisions: SuperadminInsights['divisionMonitoring'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Divisi</p>
          <h3 className="text-base sm:text-lg">Monitoring Karyawan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Kehadiran hari ini per divisi.</p>
        </div>
        <Users size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
      </div>
      <div className="space-y-4">
        {divisions.length ? divisions.map((division) => (
          <div key={division.division}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{division.division}</span>
              <span className="text-xs text-[var(--text-secondary)]">{division.employeeCount} orang · {division.attendanceRate}% hadir</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, division.attendanceRate)}%` }} />
            </div>
          </div>
        )) : <EmptyMiniState title="Belum ada divisi" description="Data divisi muncul setelah karyawan aktif memiliki divisi." />}
      </div>
    </div>
  );
}

function KpiOverviewCard({ overview }: { overview: SuperadminInsights['kpiOverview'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">KPI Bulan Ini</p>
          <h3 className="text-base sm:text-lg">Performa Karyawan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Rata-rata skor dan status approval.</p>
        </div>
        <div className="text-right">
          <strong className="text-3xl text-[var(--success)]">{overview.averageScore}</strong>
          <p className="text-[11px] text-[var(--text-secondary)]">Avg score</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-[var(--success-bg)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Disetujui</p>
          <strong className="text-xl text-[var(--success)]">{numberFormatter.format(overview.approvedCount)}</strong>
        </div>
        <div className="rounded-xl bg-[var(--warning-bg)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Menunggu</p>
          <strong className="text-xl text-[var(--warning)]">{numberFormatter.format(overview.pendingCount)}</strong>
        </div>
      </div>
      <PerformerList title="Top Performer" rows={overview.topPerformers} empty="Belum ada skor KPI." />
      <div className="mt-4">
        <PerformerList title="Perlu Dibantu" rows={overview.lowPerformers} empty="Belum ada data risiko KPI." />
      </div>
    </div>
  );
}

function EmployeeRiskPanel({ risks }: { risks: SuperadminInsights['employeeRisks'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Risk Alert</p>
          <h3 className="text-base sm:text-lg">Karyawan Perlu Perhatian</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Telat, absen, dan KPI rendah.</p>
        </div>
        <ShieldCheck size={22} className="text-[var(--danger)]" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        {risks.length ? risks.map((risk) => (
          <Link key={risk.employeeId} href={`/dashboard/employees/${risk.employeeId}`} className="block rounded-xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{risk.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{risk.division}</p>
              </div>
              <span className="badge badge-danger">Risk {risk.riskScore}</span>
            </div>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">{risk.lateCount} telat · {risk.absentCount} absen · KPI {risk.averageKpi || '-'}</p>
          </Link>
        )) : <EmptyMiniState title="Risiko rendah" description="Belum ada karyawan dengan sinyal risiko tinggi." />}
      </div>
    </div>
  );
}

function PerformerList({ title, rows, empty }: { title: string; rows: SuperadminInsights['kpiOverview']['topPerformers']; empty: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{title}</p>
      <div className="space-y-2">
        {rows.length ? rows.map((row) => (
          <div key={`${title}-${row.employeeId}`} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
            <span className="min-w-0">
              <strong className="block truncate text-sm text-[var(--text-primary)]">{row.name}</strong>
              <small className="text-xs text-[var(--text-secondary)]">{row.division || 'Belum Diisi'}</small>
            </span>
            <strong className="text-sm text-[var(--text-primary)]">{row.score}</strong>
          </div>
        )) : <p className="text-xs text-[var(--text-secondary)]">{empty}</p>}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</span>;
}

function EmptyMiniState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-color)] p-4 text-center">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function ActionQueueCard({ action, delay }: { action: ReturnType<typeof buildDashboardActions>[number]; delay?: string }) {
  return (
    <Link
      href={action.href}
      className={`card quick-action-card group animate-scale-in action-card-${action.tone}`}
      style={{ animationDelay: delay }}
    >
      <span>
        <strong className="text-sm sm:text-base">{action.label}</strong>
        <small className="text-xs sm:text-sm">{action.description}</small>
      </span>
      <strong className="text-xl sm:text-2xl" style={{ color: mapToneToColor(action.tone) }}>
        {typeof action.value === "number" ? numberFormatter.format(action.value) : action.value}
      </strong>
    </Link>
  );
}

function mapToneToColor(tone: DashboardActionTone) {
  if (tone === 'danger') return 'var(--danger)';
  if (tone === 'warning') return 'var(--warning)';
  if (tone === 'success') return 'var(--success)';
  if (tone === 'info') return 'var(--info)';
  return 'var(--primary)';
}

function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle,
  tone,
  delay 
}: { 
  icon: ReactNode; 
  label: string; 
  value: number | string; 
  subtitle?: string;
  tone: "primary" | "success" | "warning" | "info";
  delay?: string;
}) {
  return (
    <article 
      className={`card stat-card stat-card-${tone} animate-scale-in hover:scale-105 transition-transform duration-200`}
      style={{ animationDelay: delay }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="flex flex-col min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold truncate">{label}</p>
        <strong className="text-xl sm:text-2xl text-[var(--text-primary)] my-0.5">{typeof value === "number" ? numberFormatter.format(value) : value}</strong>
        {subtitle && <small className="text-[10px] sm:text-xs text-[var(--text-muted)] truncate" style={{ color: tone === 'warning' ? 'var(--warning)' : tone === 'success' ? 'var(--success)' : tone === 'info' ? 'var(--info)' : 'var(--primary)' }}>{subtitle}</small>}
      </div>
    </article>
  );
}

function QuickAction({ 
  href, 
  icon, 
  title, 
  description,
  delay 
}: { 
  href: string; 
  icon: ReactNode; 
  title: string; 
  description: string;
  delay?: string;
}) {
  return (
    <Link 
      href={href} 
      className="card quick-action-card group animate-scale-in"
      style={{ animationDelay: delay }}
    >
      <span className="quick-action-icon group-hover:scale-110 transition-transform">{icon}</span>
      <span>
        <strong className="text-sm sm:text-base">{title}</strong>
        <small className="text-xs sm:text-sm">{description}</small>
      </span>
    </Link>
  );
}

function RecentActivityPanel({ activities }: { activities: SuperadminInsights['recentActivity'] }) {
  if (!activities) return null;
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Log Audit</p>
          <h3 className="text-base sm:text-lg">Aktivitas Sistem Terbaru</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Jejak tindakan penting dalam sistem.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--info-bg)] flex items-center justify-center">
          <Clock size={22} className="text-[var(--info)]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-4">
        {activities.length > 0 ? activities.map((activity) => (
          <div key={activity.id} className="flex gap-3 relative">
            <div className="mt-1 w-2 h-2 rounded-full bg-[var(--primary)] flex-shrink-0 relative z-10" />
            <div className="absolute left-1 top-3 bottom-[-16px] w-[1px] bg-[var(--border-color)] last:hidden" />
            <div className="pb-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-semibold text-[var(--primary-dark)]">{activity.entity}</span>
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {new Date(activity.time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        )) : <EmptyMiniState title="Belum ada aktivitas" description="Log sistem masih kosong." />}
      </div>
      {activities.length > 0 && (
        <div className="mt-2 pt-4 border-t border-[var(--border-color)] text-center">
          <Link href="/dashboard/audit" className="text-link text-xs font-semibold">Lihat Semua Log</Link>
        </div>
      )}
    </div>
  );
}

function PendingApprovalsPanel({ approvals }: { approvals: SuperadminInsights['pendingApprovalsList'] }) {
  if (!approvals) return null;
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Butuh Tindakan</p>
          <h3 className="text-base sm:text-lg">Approval Pending</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Menunggu persetujuan Anda.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center">
          <CheckCircle size={22} className="text-[var(--warning)]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-3">
        {approvals.length > 0 ? approvals.map((approval) => (
          <div key={approval.id} className="rounded-xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="badge badge-warning mb-2">{approval.type}</span>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{approval.employeeName}</p>
              </div>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{approval.detail}</p>
            <div className="mt-3 flex justify-between items-center">
               <p className="text-[10px] text-[var(--text-muted)]">
                 {new Date(approval.time).toLocaleDateString('id-ID', { dateStyle: 'short' })}
               </p>
               <Link href="/dashboard/attendance/exceptions" className="text-link text-xs font-semibold">Tinjau →</Link>
            </div>
          </div>
        )) : <EmptyMiniState title="Semua beres!" description="Tidak ada antrian persetujuan." />}
      </div>
      {approvals.length > 0 && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/attendance/exceptions" className="text-link text-xs font-semibold">Lihat Semua Approval</Link>
        </div>
      )}
    </div>
  );
}
