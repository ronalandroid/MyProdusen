"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, CheckCircle, Clock, TrendingUp, Users, AlertTriangle, CalendarDays, RefreshCcw, ArrowRight } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getAuthHeaders, fetchProfile } from "@/lib/auth-client";
import { buildDashboardActions, type DashboardActionTone } from "@/lib/dashboard/action-cards";
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
  payrollPeriodStatus: { period: string; status: string } | null;
  role: UserRole;
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
  const actionCards = buildDashboardActions(stats.role, {
    pendingLeaves: stats.pendingLeave,
    pendingKpiApprovals: stats.pendingKpiApprovals,
    lateToday: stats.lateToday,
    absentToday: stats.absentToday,
    unreadNotifications: stats.unreadNotifications,
  });

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header */}
      <header className="dashboard-header animate-slide-up">
        <div className="dashboard-greeting">
          <p className="eyebrow">Dashboard Operasional</p>
          <h1 className="text-2xl sm:text-3xl">{greeting}, {displayName} 👋</h1>
          <p className="text-sm sm:text-base">Pantau kehadiran, cuti, dan data tim hari ini.</p>
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
          <h2 id="attendance-title" className="text-white text-xl sm:text-2xl mb-2">Kehadiran Tim</h2>
          <p className="text-white/90 text-sm sm:text-base">
            <span className="font-bold text-lg sm:text-xl">{stats.todayAttendance.present}</span> dari{" "}
            <span className="font-bold text-lg sm:text-xl">{stats.todayAttendance.total}</span> karyawan aktif sudah tercatat hadir.
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
            label="Total Karyawan" 
            value={stats.totalEmployees} 
            tone="info"
            delay="400ms"
          />
          <StatCard 
            icon={<CheckCircle size={22} aria-hidden="true" />} 
            label="Karyawan Aktif" 
            value={stats.activeEmployees} 
            tone="success"
            delay="450ms"
          />
          <StatCard 
            icon={<Clock size={22} aria-hidden="true" />} 
            label="Hadir Hari Ini" 
            value={`${stats.todayAttendance.percentage}%`} 
            tone="primary"
            delay="500ms"
          />
          <StatCard 
            icon={<CalendarDays size={22} aria-hidden="true" />} 
            label="Cuti Pending" 
            value={stats.pendingLeave} 
            tone="warning"
            delay="550ms"
          />
          <StatCard 
            icon={<Bell size={22} aria-hidden="true" />} 
            label="Notifikasi" 
            value={stats.unreadNotifications} 
            tone="info"
            delay="600ms"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-title" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <div className="section-heading">
          <h2 id="quick-actions-title">Aksi Cepat</h2>
        </div>
        <div className="quick-actions-grid">
          <QuickAction 
            href="/dashboard/attendance" 
            icon={<Clock size={24} aria-hidden="true" />} 
            title="Kehadiran" 
            description="Check-in, check-out, dan status hari ini"
            delay="650ms"
          />
          <QuickAction 
            href="/dashboard/leave" 
            icon={<CalendarDays size={24} aria-hidden="true" />} 
            title="Ajukan Cuti" 
            description="Buat atau tinjau pengajuan cuti"
            delay="700ms"
          />
          <QuickAction 
            href="/dashboard/reports" 
            icon={<TrendingUp size={24} aria-hidden="true" />} 
            title="Laporan" 
            description="Ekspor data dan pantau tren"
            delay="750ms"
          />
          <QuickAction 
            href="/dashboard/employees" 
            icon={<Users size={24} aria-hidden="true" />} 
            title="Karyawan" 
            description="Kelola data anggota tim"
            delay="800ms"
          />
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
          <Link href="/dashboard/payroll" className="text-link text-sm">Buka Payroll →</Link>
        </div>
      </section>

      {/* Insights Grid */}
      <section className="insights-grid animate-slide-up" aria-labelledby="insights-title" style={{ animationDelay: '850ms' }}>
        <div className="section-heading full-span">
          <h2 id="insights-title">Insight Operasional</h2>
        </div>
        <div className="card empty-state-card">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] flex items-center justify-center mb-3">
            <TrendingUp size={24} className="text-[var(--primary-dark)]" aria-hidden="true" />
          </div>
          <h3 className="text-base sm:text-lg">KPI rata-rata belum tersedia</h3>
          <p className="text-xs sm:text-sm">Dashboard tidak menampilkan angka KPI sampai API agregasi Phase 6 siap.</p>
          <Link href="/dashboard/kpi" className="text-link text-sm">Kelola KPI →</Link>
        </div>
        <div className="card empty-state-card">
          <div className="w-12 h-12 rounded-xl bg-[var(--info-bg)] flex items-center justify-center mb-3">
            <Clock size={24} className="text-[var(--info)]" aria-hidden="true" />
          </div>
          <h3 className="text-base sm:text-lg">Tren mingguan belum tersedia</h3>
          <p className="text-xs sm:text-sm">Grafik mingguan menunggu endpoint historis agar data produksi tidak memakai mock.</p>
          <Link href="/dashboard/reports" className="text-link text-sm">Buka Laporan →</Link>
        </div>
      </section>
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
  tone,
  delay 
}: { 
  icon: ReactNode; 
  label: string; 
  value: number | string; 
  tone: "primary" | "success" | "warning" | "info";
  delay?: string;
}) {
  return (
    <article 
      className={`card stat-card stat-card-${tone} animate-scale-in hover:scale-105 transition-transform duration-200`}
      style={{ animationDelay: delay }}
    >
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="text-xs sm:text-sm">{label}</p>
        <strong className="text-xl sm:text-2xl">{typeof value === "number" ? numberFormatter.format(value) : value}</strong>
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
