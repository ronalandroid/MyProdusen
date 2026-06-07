"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle, Clock, Users, AlertTriangle, RefreshCcw, ShieldCheck, BarChart3, ThumbsUp, ThumbsDown, Eye, UserCog, MapPin, Calendar, FileText, Banknote, TrendingUp, Sparkles, Settings, ClipboardList } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";
import { useCachedProfile, useDashboardStats, usePerformanceAnomalies, usePerformanceScores } from "@/hooks/useDashboardQueries";
import EmployeeBeranda from "@/components/dashboard/EmployeeBeranda";
import LeaderBeranda from "@/components/dashboard/LeaderBeranda";
import { type DashboardActionTone } from "@/lib/dashboard/action-cards";
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

const SUPERADMIN_QUICK_ACTIONS = [
  { name: "Karyawan", path: "/dashboard/employees", icon: Users, bg: "rgba(59,130,246,0.1)", text: "var(--info)" },
  { name: "Lokasi/Shift", path: "/dashboard/locations", icon: MapPin, bg: "rgba(251,191,36,0.15)", text: "#D97706" },
  { name: "Kebijakan Absensi", path: "/dashboard/settings", icon: Settings, bg: "rgba(34,197,94,0.1)", text: "var(--success)" },
  { name: "Kalender Kerja", path: "/dashboard/settings", icon: Calendar, bg: "rgba(245,158,11,0.1)", text: "var(--warning)" },
  { name: "KPI", path: "/dashboard/kpi/template", icon: BarChart3, bg: "rgba(124,58,237,0.1)", text: "#7C3AED" },
  { name: "Payroll", path: "/dashboard/payroll", icon: Banknote, bg: "rgba(229,57,53,0.1)", text: "var(--danger)" },
  { name: "Cuti", path: "/dashboard/leave", icon: ClipboardList, bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
  { name: "Laporan PDF", path: "/dashboard/reports/pdf", icon: FileText, bg: "var(--primary-light)", text: "var(--primary-dark)" },
];

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

  const displayName = profile?.employee?.fullName || profile?.username || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  if (stats.role === "LEADER") {
    return (
      <div className="dashboard-page animate-fade-in">
        <header className="dashboard-header animate-slide-up">
          <div className="dashboard-greeting">
            <p className="dashboard-date">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <h1>Beranda Leader</h1>
            <p>Absensi pribadi dan KPI tim dalam satu tempat.</p>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadDashboardData}>
              <RefreshCcw size={14} aria-hidden="true" />
              Muat ulang
            </button>
          </div>
        </header>
        <LeaderBeranda profile={profile} />
      </div>
    );
  }

  if (stats.role !== "SUPERADMIN") {
    return (
      <div className="dashboard-page animate-fade-in">
        {error && (
          <section className="alert-card animate-slide-up" role="alert" style={{ animationDelay: "100ms" }}>
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
        <EmployeeBeranda profile={profile} />
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header */}
      <header
        className="dashboard-header superadmin-header animate-slide-up"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--text-primary)",
          backgroundImage: "url(/logo.png)",
          backgroundSize: "150px",
          backgroundPosition: "calc(100% + 50px) center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="dashboard-greeting relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Selamat Datang,
            <br />
            Super Admin!
          </h1>
          <p className="text-sm sm:text-base mt-2 max-w-[80%] font-medium">
            Operasional tertata, keputusan lebih cepat.
          </p>
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
            {profile?.employee?.profilePhoto ? <img src={profile.employee.profilePhoto} alt="" /> : initials}
          </Link>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <section className="alert-card animate-slide-up" role="alert" style={{ animationDelay: "100ms" }}>
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

      <SuperadminGamificationHub
        stats={stats}
        insights={stats.superadminInsights}
        performanceSummaries={performanceSummaries}
        performanceAnomalies={performanceAnomalies}
        onReload={loadDashboardData}
      />

      <SuperadminQuickActions stats={stats} />

      {stats.superadminInsights && <SuperadminMonitoring insights={stats.superadminInsights} />}
    </div>
  );
}

interface SuperadminGamificationHubProps {
  stats: DashboardStats;
  insights?: SuperadminInsights;
  performanceSummaries: any[];
  performanceAnomalies: any[];
  onReload: () => void;
}

function SuperadminGamificationHub({
  stats,
  insights,
  performanceSummaries,
  performanceAnomalies,
  onReload,
}: SuperadminGamificationHubProps) {
  const attendancePercent = Math.round(stats.todayAttendance.percentage || 0);
  const kpiScore = insights?.kpiOverview.averageScore ?? 0;
  const healthyTeams = insights?.divisionMonitoring.filter((division) => division.attendanceRate >= 90).length ?? 0;
  const totalTeams = insights?.divisionMonitoring.length ?? 0;

  // Tier distributions
  const tierCounts = performanceSummaries.reduce(
    (acc: Record<string, number>, curr: any) => {
      const tier = curr.tier || "Standard";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    { Platinum: 0, Gold: 0, Silver: 0, Bronze: 0, Standard: 0 }
  );

  // Raise Budget Projection estimation
  // Base Salary fallback is Rp3.500.000 for Medan Dimsum employee reference
  const DEFAULT_MEDAN_BASE_SALARY = 3500000;
  const totalProjectedRaiseAmount = performanceSummaries.reduce((sum: number, curr: any) => {
    const raisePercent = curr.projectedRaisePercent ?? 0;
    const raiseAmount = DEFAULT_MEDAN_BASE_SALARY * (raisePercent / 100);
    return sum + raiseAmount;
  }, 0);

  // Override State for anomalies
  const [activeOverrideMemberId, setActiveOverrideMemberId] = useState<string | null>(null);
  const [overrideLeaderScoreInput, setOverrideLeaderScoreInput] = useState<number | "">("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideFeedback, setOverrideFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Superadmin subcriteria states
  const [adminSubcriteriaEnabled, setAdminSubcriteriaEnabled] = useState(false);
  const [adminCleanliness, setAdminCleanliness] = useState(80);
  const [adminDiscipline, setAdminDiscipline] = useState(80);
  const [adminNeatness, setAdminNeatness] = useState(80);
  const [adminSop, setAdminSop] = useState(80);
  const [adminTeamwork, setAdminTeamwork] = useState(80);
  const [adminResponsibility, setAdminResponsibility] = useState(80);

  const handleOpenOverride = (employeeId: string, currentScore: number) => {
    setActiveOverrideMemberId(employeeId);
    setOverrideLeaderScoreInput(currentScore);
    setOverrideReason("");
    setOverrideFeedback(null);
    setAdminSubcriteriaEnabled(false);
    setAdminCleanliness(80);
    setAdminDiscipline(80);
    setAdminNeatness(80);
    setAdminSop(80);
    setAdminTeamwork(80);
    setAdminResponsibility(80);
  };

  const handleAdminSubcriteriaChange = (key: string, val: number) => {
    let c = adminCleanliness, d = adminDiscipline, n = adminNeatness, s = adminSop, t = adminTeamwork, r = adminResponsibility;
    if (key === 'cleanliness') { setAdminCleanliness(val); c = val; }
    else if (key === 'discipline') { setAdminDiscipline(val); d = val; }
    else if (key === 'neatness') { setAdminNeatness(val); n = val; }
    else if (key === 'sop') { setAdminSop(val); s = val; }
    else if (key === 'teamwork') { setAdminTeamwork(val); t = val; }
    else if (key === 'responsibility') { setAdminResponsibility(val); r = val; }
    
    const avg = Math.round((c + d + n + s + t + r) / 6);
    setOverrideLeaderScoreInput(avg);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOverrideMemberId || overrideLeaderScoreInput === "") return;
    setOverrideSaving(true);
    setOverrideFeedback(null);

    try {
      if (overrideReason.trim().length < 10) {
        throw new Error("Alasan override minimal 10 karakter.");
      }

      const currentSummary = performanceSummaries.find(s => s.employeeId === activeOverrideMemberId);
      const existingAttendance = currentSummary?.attendanceScore ?? 100;
      const existingKpi = currentSummary?.kpiScore ?? 100;

      const res = await fetch(`/api/performance/scores/${activeOverrideMemberId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          score: Number(overrideLeaderScoreInput),
          attendanceScore: existingAttendance,
          kpiScore: existingKpi,
          leaderScore: Number(overrideLeaderScoreInput),
          reason: overrideReason.trim(),
        }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || "Gagal meng-override skor.");
      }

      setOverrideFeedback({ type: "success", message: "Skor berhasil dioverride dengan audit!" });
      onReload();
      setTimeout(() => {
        setActiveOverrideMemberId(null);
      }, 1500);
    } catch (err) {
      setOverrideFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal meng-override skor.",
      });
    } finally {
      setOverrideSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 mb-6" aria-labelledby="superadmin-gamification-title">
      {/* Company Quest Board */}
      <div className="gamification-hub animate-slide-up" style={{ animationDelay: "160ms" }}>
        <div>
          <p className="eyebrow">Gamifikasi</p>
          <h2 id="superadmin-gamification-title">Company Quest Board</h2>
          <p>Progress absensi, KPI, dan kesehatan divisi hari ini.</p>
        </div>
        <div className="gamification-metrics" role="list">
          <GamificationBadge label="Attendance Streak" value={`${attendancePercent}%`} progress={attendancePercent} tone="success" />
          <GamificationBadge label="KPI Power" value={`${kpiScore}`} progress={Math.min(100, kpiScore)} tone="warning" />
          <GamificationBadge label="Division Shield" value={`${healthyTeams}/${totalTeams}`} progress={totalTeams ? Math.round((healthyTeams / totalTeams) * 100) : 0} tone="info" />
        </div>
      </div>

      {/* Performance Overview Panel */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Tier Distribution & Budget Projection */}
        <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
          <div>
            <p className="eyebrow">Analisis Distribusi</p>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Distribusi Tier Performa</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Jumlah karyawan aktif berdasarkan peringkat pencapaian.</p>
          </div>

          <div className="flex flex-col gap-2.5 bg-gray-50/50 p-4 rounded-2xl border border-[var(--border-color)]">
            {["Platinum", "Gold", "Silver", "Bronze", "Standard"].map((tier) => {
              const count = tierCounts[tier] || 0;
              const maxCount = Math.max(...Object.values(tierCounts));
              const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
              return (
                <div key={tier} className="text-xs">
                  <div className="flex justify-between items-center mb-1 font-bold text-[var(--text-secondary)]">
                    <span>Tier {tier}</span>
                    <span className="text-[var(--text-primary)]">{count} Karyawan</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        backgroundColor:
                          tier === "Platinum"
                            ? "var(--success)"
                            : tier === "Gold"
                            ? "var(--primary)"
                            : tier === "Silver"
                            ? "var(--info)"
                            : tier === "Bronze"
                            ? "var(--warning)"
                            : "var(--text-muted)",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raise Budget Projection */}
          <div className="rounded-2xl border border-[#FFE082] bg-gradient-to-r from-[#FFFDF0] to-[#FFFDEB] p-4 flex flex-col gap-1.5 shadow-sm">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#B7791F]">
              <TrendingUp size={14} />
              <span>Proyeksi Anggaran Kenaikan Gaji</span>
            </span>
            <strong className="text-lg font-black text-[var(--text-primary)]">
              {numberFormatter.format(totalProjectedRaiseAmount)}
            </strong>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium mt-0.5">
              Estimasi total kenaikan gaji bulanan tim jika performance dipertahankan setahun. 
              <br />
              <span className="italic">Disclaimer: Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan.</span>
            </p>
          </div>
        </div>

        {/* Top Performers and At-Risk Panel */}
        <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
          <div>
            <p className="eyebrow">Sorotan Anggota</p>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Top & At-Risk Employees</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daftar performa terbaik dan karyawan butuh perhatian.</p>
          </div>

          {/* Top Performers list */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">⭐ Top Performers</p>
            <div className="flex flex-col gap-2">
              {performanceSummaries.slice(0, 3).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Belum ada data performa kumulatif.</p>
              ) : (
                performanceSummaries.slice(0, 3).map((snap, idx) => (
                  <div key={snap.employeeId || idx} className="flex justify-between items-center gap-3 p-2 rounded-xl bg-gray-50/50 border">
                    <div className="min-w-0">
                      <span className="text-xs font-black text-[var(--text-primary)]">#{idx+1} Karyawan</span>
                      <span className="badge badge-success text-[10px] font-bold ml-2">Tier {snap.tier}</span>
                    </div>
                    <strong className="text-xs text-[var(--text-primary)] bg-white px-2 py-0.5 rounded border shadow-sm">
                      Score: {snap.currentScore}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* At-Risk list */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-danger)] mb-2">⚠️ Karyawan Berisiko (Score &lt; 70)</p>
            <div className="flex flex-col gap-2">
              {performanceSummaries.filter((s: any) => s.currentScore < 70).slice(0, 3).length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] italic">Tidak ada karyawan di bawah ambang batas performa.</p>
              ) : (
                performanceSummaries.filter((s: any) => s.currentScore < 70).slice(0, 3).map((snap) => (
                  <div key={snap.employeeId} className="flex justify-between items-center gap-3 p-2 rounded-xl bg-red-50/50 border border-red-100">
                    <div>
                      <span className="text-xs font-bold text-red-900">Karyawan Berisiko</span>
                      <span className="badge badge-danger text-[10px] font-bold ml-2">Tier {snap.tier}</span>
                    </div>
                    <strong className="text-xs text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                      Score: {snap.currentScore}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Penilaian Perilaku Kerja dashboard card */}
      <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4 animate-slide-up" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-wrap justify-between items-start gap-2 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Penilaian Perilaku Kerja (Culture & Discipline)</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daftar karyawan aktif untuk review nilai perilaku kerja final.</p>
            <span className="text-[10px] text-[var(--danger)] font-bold mt-1.5 block">
              💡 Nilai Superadmin menjadi nilai final jika sudah diisi.
            </span>
          </div>
          <span className="badge badge-info text-xs font-bold shrink-0">{performanceSummaries.length} Karyawan</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2 pr-1">
          {performanceSummaries.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic text-center py-4">Belum ada data performa karyawan.</p>
          ) : (
            performanceSummaries.map((snap, idx) => (
              <div key={snap.employeeId || idx} className="flex justify-between items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border hover:border-[var(--primary)] transition-all">
                <div className="min-w-0">
                  <strong className="text-xs text-[var(--text-primary)] font-extrabold block">Karyawan: {snap.employeeId.slice(0, 8)}...</strong>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold">
                    Nilai Perilaku Saat Ini: <span className="font-extrabold text-[var(--text-primary)]">{snap.leaderScore ?? 100}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOverride(snap.employeeId, snap.leaderScore ?? 100)}
                  className="btn btn-primary btn-xs rounded-xl font-bold min-h-[32px] px-3 text-[11px]"
                >
                  Input Nilai Final
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Culture & Discipline Score Anomaly Queue */}
      <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">Antrean Review Anomali Penilaian Perilaku</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Skor perilaku kerja di bawah 40 atau perubahan ekstrem (&gt;30 poin) masuk review Superadmin untuk persetujuan.
            </p>
          </div>
          <span className="badge badge-danger font-extrabold text-xs">{performanceAnomalies.length} Pending</span>
        </div>

        {performanceAnomalies.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] font-semibold italic bg-gray-50/50 p-4 rounded-2xl border border-dashed border-[var(--border-color)] text-center">
            Semua skor atasan bersih. Tidak ada anomali terdeteksi.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {performanceAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="rounded-2xl border border-red-200 p-4 bg-red-50/10 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="badge badge-danger text-[10px] font-black">{anomaly.type.replace(/_/g, " ")}</span>
                    <p className="text-xs text-[var(--text-secondary)] font-bold mt-1.5">
                      Karyawan ID: <span className="font-extrabold text-[var(--text-primary)]">{anomaly.employeeId.slice(0, 8)}...</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenOverride(anomaly.employeeId, 100)}
                    className="btn btn-secondary btn-xs rounded-xl font-bold min-h-[30px] text-[11px]"
                  >
                    Override Skor
                  </button>
                  <Link
                    href="/dashboard/settings"
                    className="btn btn-primary btn-xs rounded-xl font-bold min-h-[30px] text-[11px] flex items-center justify-center"
                  >
                    Tinjau Aturan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Override Score Modal Form */}
      {activeOverrideMemberId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white rounded-3xl border border-[var(--border-color)] shadow-2xl p-5 sm:p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in relative">
            <div className="border-b border-[var(--border-color)] pb-3">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                Override Skor Karyawan (Audit)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Nilai performa diubah paksa oleh Superadmin dengan pencatatan audit.
              </p>
            </div>

            {overrideFeedback && (
              <div
                role="status"
                className={`rounded-xl p-3 text-xs font-semibold ${
                  overrideFeedback.type === "success"
                    ? "bg-green-50 text-[var(--success)] border border-green-200"
                    : "bg-red-50 text-[var(--danger)] border border-red-200"
                }`}
              >
                {overrideFeedback.message}
              </div>
            )}
            <form onSubmit={handleOverrideSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Input Skor Perilaku Kerja Baru (Final)
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  placeholder="Contoh: 90"
                  className="min-h-[44px] rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none font-bold text-center"
                  value={overrideLeaderScoreInput}
                  onChange={(e) => setOverrideLeaderScoreInput(e.target.value !== "" ? Number(e.target.value) : "")}
                  disabled={overrideSaving || adminSubcriteriaEnabled}
                />
              </label>

              {/* Quick score buttons */}
              <div className="flex gap-2 justify-center">
                {[80, 90, 100].map((quickVal) => (
                  <button
                    key={quickVal}
                    type="button"
                    onClick={() => setOverrideLeaderScoreInput(quickVal)}
                    disabled={overrideSaving || adminSubcriteriaEnabled}
                    className="btn btn-secondary btn-xs rounded-xl font-bold min-h-[36px] flex-1 text-xs"
                  >
                    Set {quickVal}
                  </button>
                ))}
              </div>

              {/* Optional subcriteria sliders */}
              <div className="border border-[var(--border-color)] bg-gray-50/50 rounded-2xl p-4 flex flex-col gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    checked={adminSubcriteriaEnabled}
                    onChange={(e) => setAdminSubcriteriaEnabled(e.target.checked)}
                  />
                  <span>Input Subkriteria Nilai (Opsional)</span>
                </label>

                {adminSubcriteriaEnabled && (
                  <div className="flex flex-col gap-3.5 mt-2 border-t border-gray-200/60 pt-3">
                    {[
                      { key: 'cleanliness', label: 'Kebersihan', value: adminCleanliness },
                      { key: 'discipline', label: 'Disiplin', value: adminDiscipline },
                      { key: 'neatness', label: 'Kerapian', value: adminNeatness },
                      { key: 'sop', label: 'Kepatuhan SOP', value: adminSop },
                      { key: 'teamwork', label: 'Kerja Sama Tim', value: adminTeamwork },
                      { key: 'responsibility', label: 'Tanggung Jawab', value: adminResponsibility }
                    ].map((sub) => (
                      <div key={sub.key} className="flex flex-col gap-1 text-xs font-bold text-[var(--text-secondary)]">
                        <div className="flex justify-between items-center">
                          <span>{sub.label}</span>
                          <span className="text-[var(--text-primary)] font-extrabold">{sub.value}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          aria-label={`Nilai ${sub.label}`}
                          className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          value={sub.value}
                          onChange={(e) => handleAdminSubcriteriaChange(sub.key, Number(e.target.value))}
                        />
                      </div>
                    ))}
                    <div className="text-[10px] text-gray-500 font-bold bg-white p-2 rounded-xl border border-gray-200/60 leading-normal text-center">
                      * Nilai utama otomatis terhitung dari rata-rata 6 subkriteria di atas.
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-[var(--danger)] font-bold text-center">
                * Nilai Superadmin menjadi nilai final jika sudah diisi.
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                Alasan Override Skor (Min. 10 Karakter)
                <textarea
                  required
                  rows={3}
                  placeholder="Contoh: Koreksi ulasan subjektif leader setelah rapat tim..."
                  className="rounded-xl border border-[var(--border-color)] p-3 text-sm focus:border-[var(--primary)] focus:outline-none resize-none leading-relaxed"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  disabled={overrideSaving}
                />
                <span className="text-[10px] text-[var(--text-secondary)] font-bold text-right">
                  {overrideReason.trim().length} karakter (Min. 10)
                </span>
              </label>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={overrideSaving || overrideLeaderScoreInput === "" || overrideReason.trim().length < 10}
                  className="btn btn-primary flex-1 min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>{overrideSaving ? "Menyimpan..." : "Terapkan Override"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOverrideMemberId(null)}
                  disabled={overrideSaving}
                  className="btn btn-secondary flex-1 min-h-[44px] rounded-xl font-bold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function GamificationBadge({ label, value, progress, tone }: { label: string; value: string; progress: number; tone: "success" | "warning" | "info" }) {
  return (
    <article className={`gamification-badge gamification-badge-${tone}`} role="listitem">
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="progress-track" aria-label={`${label} progress ${progress}%`}>
        <i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </article>
  );
}

function SuperadminQuickActions({ stats }: { stats: DashboardStats }) {
  return (
    <>
      {/* Executive Summary Card */}
      <section aria-labelledby="executive-summary-title" className="mb-5">
        <div className="section-heading mb-3">
          <p className="eyebrow">Ringkasan Sistem</p>
          <h2 id="executive-summary-title">Executive Summary</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Users size={14} className="text-[var(--info)]" />
              <span>Total Karyawan</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.activeEmployees)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">aktif</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Clock size={14} className="text-[var(--success)]" />
              <span>Hadir Hari Ini</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.todayAttendance.present)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">orang ({stats.todayAttendance.percentage}%)</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Calendar size={14} className="text-[var(--warning)]" />
              <span>Persetujuan Cuti</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.pendingLeave)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">pending</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <CheckCircle size={14} className="text-[var(--danger)]" />
              <span>Pending KPI</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.pendingKpiApprovals)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">approval</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px] col-span-2 md:col-span-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Status Gaji</span>
            </span>
            <div className="mt-1">
              <strong className="text-sm font-extrabold text-[var(--text-primary)] line-clamp-1">
                {stats.payrollPeriodStatus?.period || "Siap audit"}
              </strong>
              <span className="text-[10px] text-[var(--text-secondary)] block">
                {stats.payrollPeriodStatus?.status || "Belum diproses"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section aria-labelledby="superadmin-quick-actions-title" className="mb-5">
        <div className="section-heading mb-3">
          <p className="eyebrow">Aksi Cepat</p>
          <h2 id="superadmin-quick-actions-title">Menu Utama Admin</h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {SUPERADMIN_QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.path}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-[var(--border-color)] p-3 text-center transition-all hover:shadow-md hover:border-[var(--primary)] min-h-[92px] group"
              >
                <div
                  className="flex items-center justify-center rounded-2xl shrink-0 transition-transform group-hover:scale-105"
                  style={{ width: 44, height: 44, backgroundColor: action.bg, color: action.text }}
                  aria-hidden="true"
                >
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                <span className="text-[11px] font-bold text-[var(--text-primary)] leading-tight line-clamp-1 w-full">
                  {action.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
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

function mapToneToColor(tone: DashboardActionTone) {
  if (tone === 'danger') return 'var(--danger)';
  if (tone === 'warning') return 'var(--warning)';
  if (tone === 'success') return 'var(--success)';
  if (tone === 'info') return 'var(--info)';
  return 'var(--primary)';
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
  const [pendingId, setPendingId] = useState<string>("");
  const [feedback, setFeedback] = useState<{ id: string; tone: "success" | "danger"; message: string } | null>(null);
  const [items, setItems] = useState(approvals || []);

  useEffect(() => {
    setItems(approvals || []);
  }, [approvals]);

  if (!approvals) return null;

  async function decide(approval: NonNullable<SuperadminInsights['pendingApprovalsList']>[number], status: 'APPROVED' | 'REJECTED') {
    if (pendingId) return;
    setPendingId(approval.id);
    setFeedback(null);
    try {
      const note = status === 'APPROVED'
        ? 'Disetujui dari dashboard.'
        : 'Ditolak dari dashboard. Silakan tinjau detail di Approval Center.';
      const endpoint = approval.type === 'Cuti/Izin'
        ? `/api/leave/${approval.id}/${status === 'APPROVED' ? 'approve' : 'reject'}`
        : `/api/attendance/exceptions/${approval.id}/review`;
      const response = await fetch(endpoint, {
        method: approval.type === 'Cuti/Izin' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(approval.type === 'Cuti/Izin' ? (status === 'APPROVED' ? {} : { reason: note }) : { status, reviewNote: note }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Gagal memproses approval.');
      }
      setItems((current) => current.filter((row) => row.id !== approval.id));
      setFeedback({ id: approval.id, tone: 'success', message: status === 'APPROVED' ? 'Disetujui.' : 'Ditolak.' });
    } catch (error) {
      setFeedback({ id: approval.id, tone: 'danger', message: error instanceof Error ? error.message : 'Gagal memproses approval.' });
    } finally {
      setPendingId("");
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Butuh Tindakan</p>
          <h3 className="text-base sm:text-lg">Approval Pending</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Setujui atau tolak langsung dari sini.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--warning-bg)] flex items-center justify-center">
          <CheckCircle size={22} className="text-[var(--warning)]" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-3">
        {items && items.length > 0 ? items.map((approval) => {
          const detailHref = approval.type === 'Cuti/Izin' ? '/dashboard/leave' : '/dashboard/attendance/exceptions';
          const isPending = pendingId === approval.id;
          return (
            <div key={approval.id} className="rounded-xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="badge badge-warning mb-2">{approval.type}</span>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{approval.employeeName}</p>
                </div>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">{approval.detail}</p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {new Date(approval.time).toLocaleDateString('id-ID', { dateStyle: 'short' })}
              </p>
              {feedback?.id === approval.id && (
                <p
                  role="status"
                  className="mt-2 text-[11px] font-semibold"
                  style={{ color: feedback.tone === 'success' ? 'var(--success)' : 'var(--danger)' }}
                >
                  {feedback.message}
                </p>
              )}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Link
                  href={detailHref}
                  className="btn btn-secondary btn-sm"
                  aria-label={`Lihat detail ${approval.type} ${approval.employeeName}`}
                >
                  <Eye size={14} aria-hidden="true" /> Detail
                </Link>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  disabled={isPending}
                  onClick={() => decide(approval, 'APPROVED')}
                >
                  <ThumbsUp size={14} aria-hidden="true" /> {isPending ? '...' : 'Setujui'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  disabled={isPending}
                  onClick={() => decide(approval, 'REJECTED')}
                >
                  <ThumbsDown size={14} aria-hidden="true" /> {isPending ? '...' : 'Tolak'}
                </button>
              </div>
            </div>
          );
        }) : <EmptyMiniState title="Semua beres!" description="Tidak ada antrian persetujuan." />}
      </div>
      {items && items.length > 0 && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/attendance/exceptions" className="text-link text-xs font-semibold">Lihat Semua Approval</Link>
        </div>
      )}
    </div>
  );
}
