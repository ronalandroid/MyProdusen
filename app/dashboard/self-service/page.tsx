"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bell, CalendarDays, Clock, FileText, TrendingUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchProfile } from "@/lib/auth-client";
import { buildSelfServiceSections, type SelfServiceTone } from "@/lib/employee/self-service-hub";
import { fetchApiData } from "@/hooks/useDashboardQueries";

interface Profile {
  username: string;
  email: string;
  role: string;
  employee?: {
    id: string;
    fullName: string;
    nip: string;
    division?: string | null;
    position?: string | null;
    defaultShiftId?: string | null;
  } | null;
}

type AttendanceToday = {
  checkInTime?: string | null;
  checkOutTime?: string | null;
} | null;

type LeaveBalance = {
  available?: number;
};

type KpiData = {
  itemCount?: number;
  weightedScore?: number;
} | null;

type SelfServiceHub = {
  profile: Profile;
  sections: ReturnType<typeof buildSelfServiceSections>;
};

export default function SelfServicePage() {
  const router = useRouter();

  const { data: hubData, isLoading: hubLoading, error: hubError } = useQuery<SelfServiceHub>({
    queryKey: ['self-service'],
    queryFn: async () => {
      const userProfile = await fetchProfile();
      const employeeId = userProfile.employee?.id;
      const [attendance, balance, leave, notifications, kpi] = await Promise.all([
        fetchApiData<AttendanceToday>('/api/attendance/today', 'ESS gagal dimuat'),
        fetchApiData<LeaveBalance>('/api/leave/balance', 'ESS gagal dimuat'),
        fetchApiData<unknown[]>('/api/leave?status=PENDING', 'ESS gagal dimuat'),
        fetchApiData<unknown[]>('/api/notifications?unread=true', 'ESS gagal dimuat'),
        employeeId
          ? fetchApiData<KpiData>(`/api/kpi/employee/${employeeId}`, 'ESS gagal dimuat')
          : Promise.resolve(null),
      ]);

      const attendanceStatus = attendance?.checkOutTime ? 'checked-out' : attendance?.checkInTime ? 'checked-in' : 'not-started';
      const kpiScore = kpi && (kpi.itemCount ?? 0) > 0 && typeof kpi.weightedScore === 'number' ? Math.round(kpi.weightedScore) : null;

      return {
        profile: userProfile,
        sections: buildSelfServiceSections({
          attendanceStatus,
          leaveAvailable: balance.available ?? 0,
          pendingRequests: leave.length,
          kpiScore,
          unreadNotifications: notifications.length,
        }),
      };
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const profile = hubData?.profile ?? null;
  const sections = hubData?.sections ?? [];
  const loading = hubLoading;
  const error = hubError?.message || "";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat layanan mandiri..." />
      </div>
    );
  }

  const displayName = profile?.employee?.fullName || profile?.username || "Karyawan";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Layanan Mandiri Karyawan</span>
        </button>
      </header>

      {error && (
        <div className="card" role="alert" style={{ padding: "16px", borderColor: "var(--danger)" }}>
          <p className="font-semibold text-[var(--danger)]">{error}</p>
        </div>
      )}

      <section className="hero-card" style={{ alignItems: "flex-start" }}>
        <div className="flex-1">
          <p className="eyebrow text-white/80">Portal Karyawan</p>
          <h1 className="text-white text-2xl mb-2">{displayName}</h1>
          <p className="text-white/90 text-sm">{profile?.employee?.nip || profile?.email} • {profile?.employee?.division || "Tanpa divisi"}</p>
          <p className="text-white/80 text-xs mt-2">Akses absensi, saldo cuti, pengajuan, KPI, notifikasi, dan dokumen pribadi dari satu tempat.</p>
        </div>
        <div className="attendance-meter">
          <User size={28} />
          <small className="text-xs sm:text-sm">Akun</small>
        </div>
      </section>

      <section className="quick-actions-grid" aria-label="Menu self-service">
        {sections.map((section) => (
          <Link key={section.title} href={section.href} className="card quick-action-card group">
            <span className="quick-action-icon group-hover:scale-110 transition-transform">
              {getSectionIcon(section.title)}
            </span>
            <span>
              <strong className="text-sm sm:text-base">{section.title}</strong>
              <small className="text-xs sm:text-sm">{section.description}</small>
            </span>
            <strong className="text-lg" style={{ color: toneColor(section.tone) }}>{section.value}</strong>
          </Link>
        ))}
      </section>
    </div>
  );
}

function getSectionIcon(title: string) {
  if (title.includes('Absensi')) return <Clock size={24} />;
  if (title.includes('Cuti')) return <CalendarDays size={24} />;
  if (title.includes('Pengajuan')) return <FileText size={24} />;
  if (title.includes('KPI')) return <TrendingUp size={24} />;
  if (title.includes('Notifikasi')) return <Bell size={24} />;
  return <FileText size={24} />;
}

function toneColor(tone: SelfServiceTone) {
  if (tone === 'danger') return 'var(--danger)';
  if (tone === 'warning') return 'var(--warning)';
  if (tone === 'success') return 'var(--success)';
  if (tone === 'info') return 'var(--info)';
  if (tone === 'muted') return 'var(--text-muted)';
  return 'var(--primary)';
}
