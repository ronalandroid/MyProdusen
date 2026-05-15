"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, Clock, FileText, TrendingUp, User } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchProfile, getAuthHeaders } from "@/lib/auth-client";
import { buildSelfServiceSections, type SelfServiceTone } from "@/lib/employee/self-service-hub";

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

export default function SelfServicePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sections, setSections] = useState<ReturnType<typeof buildSelfServiceSections>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHub();
  }, []);

  const loadHub = async () => {
    try {
      setLoading(true);
      setError("");
      const userProfile = await fetchProfile();
      setProfile(userProfile);

      const employeeId = userProfile.employee?.id;
      const [attendanceRes, balanceRes, leaveRes, notificationRes, kpiRes] = await Promise.all([
        fetch('/api/attendance/today', { headers: getAuthHeaders() }),
        fetch('/api/leave/balance', { headers: getAuthHeaders() }),
        fetch('/api/leave?status=PENDING', { headers: getAuthHeaders() }),
        fetch('/api/notifications?unread=true', { headers: getAuthHeaders() }),
        employeeId
          ? fetch(`/api/kpi/employee/${employeeId}`, { headers: getAuthHeaders() })
          : Promise.resolve(null),
      ]);

      const [attendanceData, balanceData, leaveData, notificationData, kpiData] = await Promise.all([
        attendanceRes.json(),
        balanceRes.json(),
        leaveRes.json(),
        notificationRes.json(),
        kpiRes ? kpiRes.json() : Promise.resolve(null),
      ]);

      const attendance = attendanceData.success ? attendanceData.data : null;
      const attendanceStatus = attendance?.checkOutTime ? 'checked-out' : attendance?.checkInTime ? 'checked-in' : 'not-started';
      const kpiScore = kpiData?.success && kpiData.data?.itemCount > 0 ? Math.round(kpiData.data.weightedScore) : null;

      setSections(buildSelfServiceSections({
        attendanceStatus,
        leaveAvailable: balanceData.success ? balanceData.data.available : 0,
        pendingRequests: leaveData.success ? (leaveData.data || []).length : 0,
        kpiScore,
        unreadNotifications: notificationData.success ? (notificationData.data || []).length : 0,
      }));
    } catch (hubError) {
      setError(hubError instanceof Error ? hubError.message : "ESS gagal dimuat");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat self-service..." />
      </div>
    );
  }

  const displayName = profile?.employee?.fullName || profile?.username || "Karyawan";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <button type="button" onClick={() => router.back()} className="flex items-center gap-3 text-[var(--text-primary)]">
          <ArrowLeft size={24} />
          <span className="text-xl font-bold">Employee Self-Service</span>
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
          <small className="text-xs sm:text-sm">ESS</small>
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
