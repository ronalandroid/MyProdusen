"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Camera,
  CheckCircle2,
  FileWarning,
  MapPin,
  ArrowRight,
  Clock,
  Calendar,
  Stethoscope,
  Banknote,
  TimerReset,
  FileText,
  User,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronRight,
  Map,
  Award,
  TrendingUp,
  Activity,
  HelpCircle,
} from "lucide-react";
import { getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status?: string | null;
  workLocation?: { name?: string | null; address?: string | null } | null;
}

interface HeatmapResponse {
  success: boolean;
  data?: { heatmap: Record<string, string> };
  error?: string;
}

interface AttendanceResponse {
  success: boolean;
  data?: AttendanceRecord[];
  error?: string;
}

interface WorkLocationDetail {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface WorkLocationResponse {
  success: boolean;
  data?: WorkLocationDetail;
  error?: string;
}

interface LeaveBalance {
  year: number;
  entitlement: number;
  used: number;
  pending: number;
  available: number;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const statusLabel: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  ABSENT: "Tidak Hadir",
  LEAVE: "Cuti",
  SICK: "Sakit",
  PERMISSION: "Izin",
};

const statusTone: Record<string, { bg: string; color: string }> = {
  PRESENT: { bg: "rgba(34,197,94,0.12)", color: "var(--success)" },
  LATE: { bg: "rgba(245,158,11,0.18)", color: "var(--warning)" },
  ABSENT: { bg: "rgba(229,57,53,0.12)", color: "var(--danger)" },
  LEAVE: { bg: "rgba(255,193,7,0.18)", color: "var(--primary-dark)" },
  SICK: { bg: "rgba(229,57,53,0.12)", color: "var(--danger)" },
  PERMISSION: { bg: "rgba(59,130,246,0.12)", color: "var(--info)" },
};

function startOfMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function formatTime(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return earthRadiusMeters * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatDistance(distance: number | null): string {
  if (distance === null) return "-";
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)} km`;
  }
  return `${Math.round(distance)} m`;
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

interface Props {
  profile: ClientUserProfile | null;
}

export default function EmployeeBeranda({ profile }: Props) {
  const [heatmap, setHeatmap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [workLocation, setWorkLocation] = useState<WorkLocationDetail | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadError, setLoadError] = useState("");

  // Gamification & Performance states
  const [perfScore, setPerfScore] = useState<any>(null);
  const [perfHistory, setPerfHistory] = useState<any[]>([]);
  const [perfBadges, setPerfBadges] = useState<any[]>([]);
  const [isPerfLoading, setIsPerfLoading] = useState(true);
  const [perfProgressState, setPerfProgressState] = useState("");

  // GPS states
  const [gpsPosition, setGpsPosition] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [isGettingGps, setIsGettingGps] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEverything() {
      try {
        setPerfProgressState("Memuat skor performa…");
        const [heatmapRes, attendanceRes, balanceRes, notifRes, perfRes, historyRes, badgesRes] = await Promise.all([
          fetch("/api/dashboard/heatmap", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/leave/balance", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/notifications", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/performance/me", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/performance/me/history", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/performance/me/badges", { headers: getAuthHeaders(), cache: "no-store" }),
        ]);

        const heatmapPayload = (await heatmapRes.json()) as HeatmapResponse;
        const attendancePayload = (await attendanceRes.json()) as AttendanceResponse;
        const balancePayload = balanceRes.ok ? await balanceRes.json().catch(() => null) : null;
        const notifPayload = notifRes.ok ? await notifRes.json().catch(() => null) : null;

        if (cancelled) return;

        if (heatmapRes.ok && heatmapPayload.success && heatmapPayload.data?.heatmap) {
          setHeatmap(heatmapPayload.data.heatmap);
        }

        if (attendanceRes.ok && attendancePayload.success && attendancePayload.data) {
          setHistory(attendancePayload.data.slice(0, 5));
        }

        if (balancePayload?.success && balancePayload?.data) {
          setLeaveBalance(balancePayload.data);
        }

        if (notifPayload?.success && notifPayload?.data) {
          setNotifications(notifPayload.data.slice(0, 3));
        }

        // Handle Performance/Gamification
        setPerfProgressState("Menghitung proyeksi kenaikan…");
        if (perfRes.ok) {
          const perfPayload = await perfRes.json().catch(() => null);
          if (perfPayload?.success && perfPayload?.data) {
            setPerfScore(perfPayload.data);
          }
        }
        if (historyRes.ok) {
          const historyPayload = await historyRes.json().catch(() => null);
          if (historyPayload?.success && historyPayload?.data) {
            setPerfHistory(historyPayload.data);
          }
        }
        if (badgesRes.ok) {
          const badgesPayload = await badgesRes.json().catch(() => null);
          if (badgesPayload?.success && badgesPayload?.data) {
            setPerfBadges(badgesPayload.data);
          }
        }

        const locationId = profile?.employee?.defaultLocation?.id;
        if (locationId) {
          const detailRes = await fetch(`/api/work-locations/${locationId}`, {
            headers: getAuthHeaders(),
            cache: "no-store",
          });
          const detailPayload = (await detailRes.json()) as WorkLocationResponse;
          if (!cancelled && detailRes.ok && detailPayload.success && detailPayload.data) {
            setWorkLocation(detailPayload.data);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Beranda belum lengkap.");
        }
      } finally {
        if (!cancelled) {
          setIsPerfLoading(false);
          setPerfProgressState("");
        }
      }
    }

    loadEverything();

    // Trigger GPS acquisition on mount
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsGettingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            setGpsPosition(pos);
            setIsGettingGps(false);
          }
        },
        (err) => {
          if (!cancelled) {
            setGpsError(err.message || "GPS belum siap");
            setIsGettingGps(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [profile?.employee?.defaultLocation?.id]);

  const monthCounts = useMemo(() => {
    const counts = { hadir: 0, izin: 0, cuti: 0, sakit: 0 };
    const monthStart = startOfMonth();
    const today = new Date();
    for (let cursor = new Date(monthStart); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const key = isoDate(cursor);
      const status = heatmap[key];
      if (!status) continue;
      if (status === "PRESENT" || status === "LATE") counts.hadir += 1;
      else if (status === "PERMISSION") counts.izin += 1;
      else if (status === "LEAVE") counts.cuti += 1;
      else if (status === "SICK") counts.sakit += 1;
    }
    return counts;
  }, [heatmap]);

  const displayName = profile?.employee?.fullName || profile?.username || "Karyawan";
  const initials = displayName.substring(0, 2).toUpperCase();
  const todayRecord = history[0];

  // Geofencing calculations
  const gpsDistanceMeters = gpsPosition && workLocation?.latitude && workLocation?.longitude
    ? calculateDistanceMeters(
        gpsPosition.coords.latitude,
        gpsPosition.coords.longitude,
        Number(workLocation.latitude),
        Number(workLocation.longitude),
      )
    : null;

  const isInsideRadius = gpsDistanceMeters !== null && workLocation?.radius
    ? gpsDistanceMeters <= Number(workLocation.radius)
    : null;

  const defaultShift = profile?.employee?.defaultShift;
  const shiftTimeText = defaultShift
    ? `${defaultShift.name} (${defaultShift.startTime.slice(0, 5)} - ${defaultShift.endTime.slice(0, 5)})`
    : "Shift belum tersedia";

  // Clock status checks
  const hasCheckedIn = Boolean(todayRecord?.checkInTime);
  const hasCheckedOut = Boolean(todayRecord?.checkOutTime);

  const greetingTitle = getTimeOfDayGreeting();

  const quickActions = [
    { name: "Absensi", path: "/dashboard/attendance", icon: Clock, bg: "var(--primary-light)", text: "var(--primary-dark)" },
    { name: "Cuti", path: "/dashboard/leave", icon: Calendar, bg: "rgba(34,197,94,0.1)", text: "var(--success)" },
    { name: "KPI Saya", path: "/dashboard/kpi", icon: BarChart3, bg: "rgba(59,130,246,0.1)", text: "var(--info)" },
    { name: "Payroll Saya", path: "/dashboard/payroll", icon: Banknote, bg: "rgba(245,158,11,0.1)", text: "var(--warning)" },
    { name: "Lembur", path: "/dashboard/overtime", icon: TimerReset, bg: "rgba(229,57,53,0.1)", text: "var(--danger)" },
    { name: "Dokumen", path: "/dashboard/documents", icon: FileText, bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
    { name: "Notifikasi", path: "/dashboard/notifications", icon: Bell, bg: "rgba(124,58,237,0.1)", text: "#7C3AED" },
    { name: "Akun", path: "/dashboard/profile", icon: User, bg: "rgba(251,191,36,0.15)", text: "#D97706" },
  ];

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header Greeting */}
      <header className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="avatar ring-2 ring-[var(--primary)] shrink-0" style={{ width: 48, height: 48, fontSize: 18 }}>
            {profile?.employee?.profilePhoto ? (
              <img src={profile.employee.profilePhoto} alt="" className="object-cover w-full h-full rounded-full" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight truncate">
              {greetingTitle}, {displayName.split(" ")[0]}!
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              {profile?.employee?.position || "Karyawan"} · NIP {profile?.employee?.nip || "-"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/notifications" className="icon-button shrink-0 relative bg-white border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]" aria-label="Notifikasi">
          <Bell size={20} className="text-[var(--text-primary)]" />
          {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)]" />}
        </Link>
      </header>

      {loadError && (
        <div className="card border-dashed border-[var(--danger)] bg-red-50/50 p-4 text-xs font-medium text-[var(--danger)]" role="alert">
          {loadError}
        </div>
      )}

      {/* Primary Attendance Card */}
      <section className="card shadow-md overflow-hidden bg-gradient-to-br from-[#FFFDEB] to-white border border-[#FFECB3] p-5 relative" aria-labelledby="attendance-card-title">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)] opacity-10 rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--primary-dark)] border border-[#FFE082] shadow-sm">
              <Clock size={12} strokeWidth={2.5} />
              {shiftTimeText}
            </span>
            <h2 id="attendance-card-title" className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] mt-3">
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
              <MapPin size={13} className="text-[var(--text-muted)]" />
              <span>{workLocation?.name || "Lokasi belum ditentukan"}</span>
            </div>
          </div>

          {/* GPS and Geofence Status Strip */}
          <div className="rounded-2xl bg-white/80 border border-[#FFF8E1] p-3 flex flex-col gap-2 shadow-sm text-xs">
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <span className="font-semibold text-[var(--text-secondary)]">GPS & Radius:</span>
              <span className="flex items-center gap-1">
                {isGettingGps ? (
                  <span className="text-[var(--text-muted)] animate-pulse">Memuat lokasi...</span>
                ) : gpsError ? (
                  <span className="text-[var(--danger)] font-bold">{gpsError}</span>
                ) : gpsPosition ? (
                  <span className="text-[var(--success)] font-bold flex items-center gap-0.5">
                    <Check size={12} strokeWidth={2.5} /> Aktif (±{Math.round(gpsPosition.coords.accuracy)}m)
                  </span>
                ) : (
                  <span className="text-[var(--warning)] font-bold">Mencari GPS...</span>
                )}
              </span>
            </div>
            
            {workLocation && gpsPosition && (
              <div className="flex justify-between items-center border-t border-[var(--border-color)] pt-2 mt-1">
                <span className="text-[var(--text-secondary)]">Jarak Anda:</span>
                <span className={`font-bold ${isInsideRadius ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {formatDistance(gpsDistanceMeters)} ({isInsideRadius ? "Di dalam radius" : "Di luar radius"})
                </span>
              </div>
            )}
          </div>

          {/* Geofence outside radius warnings */}
          {workLocation && gpsPosition && !isInsideRadius && (
            <div className="flex items-start gap-2 rounded-2xl bg-[var(--danger-bg)] border border-red-200 p-3 text-xs text-[var(--danger)] font-semibold leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>Anda berada di luar radius lokasi kerja diizinkan (maks. {workLocation.radius}m).</span>
            </div>
          )}

          {!profile?.employee?.defaultLocation && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-semibold leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>Lokasi kerja belum tersedia. Hubungi Superadmin.</span>
            </div>
          )}

          {!profile?.employee?.defaultShift && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 font-semibold leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>Shift belum tersedia. Hubungi Superadmin.</span>
            </div>
          )}

          {/* Real Clock-In / Clock-Out Buttons side-by-side */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <Link
              href="/dashboard/attendance?action=check-in"
              className={`btn min-h-[46px] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm transition-all ${
                hasCheckedIn
                  ? "bg-gray-100 text-gray-400 border border-gray-200 pointer-events-none"
                  : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--text-primary)] border-none"
              }`}
              aria-disabled={hasCheckedIn}
            >
              <Camera size={16} />
              <span>{hasCheckedIn ? "Sudah Masuk" : "Clock In"}</span>
            </Link>

            <Link
              href="/dashboard/attendance?action=check-out"
              className={`btn min-h-[46px] rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm transition-all ${
                !hasCheckedIn || hasCheckedOut
                  ? "bg-gray-100 text-gray-400 border border-gray-200 pointer-events-none"
                  : "bg-[var(--danger)] hover:bg-red-600 text-white border-none"
              }`}
              aria-disabled={!hasCheckedIn || hasCheckedOut}
            >
              <Clock size={16} />
              <span>{hasCheckedOut ? "Sudah Pulang" : "Clock Out"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Kinerja & Gamifikasi Section */}
      <section aria-labelledby="gamification-section-title" className="flex flex-col gap-4">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gamifikasi & Skor</p>
            <h2 id="gamification-section-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
              Performa & Kinerja Saya
            </h2>
          </div>
        </div>

        {isPerfLoading ? (
          /* Skeletons screens for dashboard cards / score card */
          <div className="card p-5 flex flex-col gap-4 animate-pulse border border-[var(--border-color)] bg-white">
            <div className="flex items-center justify-between gap-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
            <div className="flex items-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded-2xl w-full"></div>
            <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
            <div className="text-xs text-[var(--text-secondary)] font-medium text-center italic">
              {perfProgressState || "Memuat skor performa…"}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Primary Score Card */}
            <div className="card p-5 sm:p-6 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  <Activity size={14} className="text-[var(--primary-dark)] animate-pulse" />
                  <span>Skor Performa</span>
                </span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  (perfScore?.currentScore ?? 100) >= 90
                    ? "bg-green-50 text-[var(--success)] border-green-200"
                    : (perfScore?.currentScore ?? 100) >= 75
                    ? "bg-blue-50 text-[var(--info)] border-blue-200"
                    : "bg-amber-50 text-[var(--warning)] border-amber-200"
                }`}>
                  Tier {perfScore?.tier || "Standard"}
                </span>
              </div>

              {/* Progress and Score Layout */}
              <div className="flex items-center gap-5 py-2">
                <div className="relative flex items-center justify-center shrink-0" style={{ width: 72, height: 72 }}>
                  {/* SVG Circle Progress */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="36" cy="36" r="32" stroke="var(--border-color)" strokeWidth="5" fill="transparent" />
                    <circle
                      cx="36"
                      cy="36"
                      r="32"
                      stroke="var(--primary)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 32}
                      strokeDashoffset={(2 * Math.PI * 32) * (1 - (perfScore?.currentScore ?? 100) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xl font-black text-[var(--text-primary)]">
                    {perfScore?.currentScore ?? 100}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Indeks Performa Kumulatif</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">
                    Dihitung realtime berdasarkan Attendance (30%), KPI Produksi (50%), dan Perilaku Kerja (20%).
                    Perilaku Kerja dinilai dari kebersihan, disiplin, kerapian, kepatuhan SOP, kerja sama tim, dan tanggung jawab.
                  </p>
                </div>
              </div>

              {/* Attendance/KPI/Culture breakdown progress bars */}
              <div className="flex flex-col gap-3 rounded-2xl bg-gray-50/50 p-4 border border-[var(--border-color)]">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                    <span>Kehadiran (Bobot 30%)</span>
                    <span className="text-[var(--text-primary)]">{perfScore?.attendanceScore ?? 100}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-[var(--success)] transition-all" style={{ width: `${perfScore?.attendanceScore ?? 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                    <span>KPI Produksi (Bobot 50%)</span>
                    <span className="text-[var(--text-primary)]">{perfScore?.kpiScore ?? 100}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-[var(--info)] transition-all" style={{ width: `${perfScore?.kpiScore ?? 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-[var(--text-secondary)]">
                    <span>Perilaku Kerja (Bobot 20%)</span>
                    <span className="text-[var(--text-primary)]">{perfScore?.leaderScore ?? 100}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${perfScore?.leaderScore ?? 100}%` }}></div>
                  </div>

                  {/* Subcriteria values if available */}
                  {perfScore?.subcriteria && (
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200/60 pt-3 text-[10px] font-bold text-[var(--text-secondary)]">
                      {perfScore.subcriteria.cleanlinessScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Kebersihan</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.cleanlinessScore}/100</span>
                        </div>
                      )}
                      {perfScore.subcriteria.disciplineScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Disiplin</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.disciplineScore}/100</span>
                        </div>
                      )}
                      {perfScore.subcriteria.neatnessScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Kerapian</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.neatnessScore}/100</span>
                        </div>
                      )}
                      {perfScore.subcriteria.sopComplianceScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Kepatuhan SOP</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.sopComplianceScore}/100</span>
                        </div>
                      )}
                      {perfScore.subcriteria.teamworkScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Kerja Sama Tim</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.teamworkScore}/100</span>
                        </div>
                      )}
                      {perfScore.subcriteria.responsibilityScore !== undefined && (
                        <div className="flex justify-between items-center bg-white/80 rounded-xl p-1.5 px-2 border border-gray-100 shadow-sm">
                          <span>Tanggung Jawab</span>
                          <span className="font-extrabold text-[var(--text-primary)]">{perfScore.subcriteria.responsibilityScore}/100</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Raise Projection Banner */}
              <div className="rounded-2xl border border-[#FFE082] bg-gradient-to-r from-[#FFFDF0] to-[#FFFDEB] p-4 flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#B7791F]">
                  <TrendingUp size={15} />
                  <span>Proyeksi Kenaikan Gaji</span>
                </span>
                <p className="text-xs font-bold text-[var(--text-primary)] leading-relaxed">
                  Jika skor ini dipertahankan, estimasi kenaikan gaji tahun depan: <span className="text-[var(--success)] font-extrabold text-sm ml-0.5">+{perfScore?.projectedRaisePercent ?? 0}%</span>.
                </p>
                {perfScore?.currentScore === 100 && (
                  <p className="text-[10px] text-[#B7791F] font-bold mt-1 border-t border-[#FFF9C4] pt-2">
                    Pertahankan skor 100 selama 365 hari untuk peluang kenaikan hingga 10%.
                  </p>
                )}
                <span className="text-[10px] text-[var(--text-muted)] font-medium italic leading-normal border-t border-[#FFF9C4] pt-2 mt-1">
                  Disclaimer: {perfScore?.raiseProjectionDisclaimer || "Proyeksi ini bersifat estimasi dan dapat berubah sesuai kebijakan perusahaan."}
                </span>
              </div>

              {/* Latest score change reason */}
              {perfHistory.length > 0 && perfHistory[0].changeReason && (
                <div className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-[var(--border-color)]">
                  <span className="font-bold block text-[var(--text-primary)] mb-0.5">Catatan Perubahan Terakhir:</span>
                  {perfHistory[0].changeReason}
                </div>
              )}
            </div>

            {/* SVG Score History Line Chart */}
            <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide border-b border-[var(--border-color)] pb-3">
                <Activity size={14} className="text-[var(--info)]" />
                <span>Tren Skor 7 Hari Terakhir</span>
              </span>

              {perfHistory.length < 2 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                  Tren performa akan muncul setelah skor tercatat beberapa hari.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="h-32 w-full flex items-end">
                    {/* Visual SVG Line Graph */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#f3f4f6" strokeWidth="0.5" />
                      <line x1="0" y1="50" x2="100" y2="50" stroke="#f3f4f6" strokeWidth="0.5" />
                      <line x1="0" y1="80" x2="100" y2="80" stroke="#f3f4f6" strokeWidth="0.5" />

                      {/* Score Polyline */}
                      <path
                        fill="none"
                        stroke="var(--info)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={perfHistory
                          .slice(0, 7)
                          .reverse()
                          .map((snap, idx, arr) => {
                            const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
                            // Map score 0-100 to y 95-5 (invert scale)
                            const y = 95 - (snap.currentScore / 100) * 90;
                            return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                      />
                      
                      {/* Score dots */}
                      {perfHistory.slice(0, 7).reverse().map((snap, idx, arr) => {
                        const x = arr.length > 1 ? (idx / (arr.length - 1)) * 100 : 50;
                        const y = 95 - (snap.currentScore / 100) * 90;
                        return (
                          <circle key={snap.id || idx} cx={x} cy={y} r="2.5" fill="white" stroke="var(--info)" strokeWidth="1.5" />
                        );
                      })}
                    </svg>
                  </div>
                  
                  {/* Chart Label Dates */}
                  <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-bold px-1 pt-1">
                    <span>{new Date(perfHistory.slice(0, 7).reverse()[0].scoreDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                    <span>Tren performa harian</span>
                    <span>{new Date(perfHistory[0].scoreDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Badge Showcase */}
            <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4">
              <span className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  <Award size={14} className="text-[var(--primary-dark)]" />
                  <span>Showcase Badge ({perfBadges.length})</span>
                </span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">Pencapaian Karyawan</span>
              </span>

              {perfBadges.length === 0 ? (
                <div className="py-6 text-center text-xs text-[var(--text-muted)] font-semibold bg-gray-50/50 rounded-2xl border border-dashed border-[var(--border-color)]">
                  Belum ada badge diraih. Terus berkinerja baik!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {perfBadges.map((badge) => (
                    <div key={badge.id} className="flex gap-3 items-center rounded-2xl border border-[var(--border-color)] p-3 bg-gray-50/30">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center shrink-0 border border-[#FFE082]">
                        <Award size={20} className="text-[var(--primary-dark)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-[var(--text-primary)] leading-tight">{badge.name}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-normal">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Quick Actions Grid (Max 2 rows on mobile) */}
      <section aria-labelledby="quick-actions-title">
        <div className="section-heading mb-3">
          <h2 id="quick-actions-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Menu Utama
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
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

      {/* Personal Summary Cards */}
      <section aria-labelledby="summary-title">
        <div className="section-heading mb-3">
          <h2 id="summary-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Ringkasan Saya
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {/* Quota Cuti */}
          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Calendar size={14} className="text-[var(--primary-dark)]" />
              <span>Sisa Cuti</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                {leaveBalance?.available ?? "-"}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">hari</span>
            </div>
            <Link href="/dashboard/leave/balance" className="text-[11px] font-bold text-[var(--primary-dark)] hover:underline mt-1 flex items-center gap-0.5">
              <span>Detail Saldo</span> <ChevronRight size={10} />
            </Link>
          </article>

          {/* Attendance Status */}
          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <CheckCircle2 size={14} className="text-[var(--success)]" />
              <span>Status Absen</span>
            </span>
            <div className="mt-1">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                hasCheckedOut
                  ? "bg-gray-100 text-gray-600"
                  : hasCheckedIn
                    ? "bg-green-50 text-[var(--success)] border border-green-200"
                    : "bg-amber-50 text-[var(--warning)] border border-amber-200"
              }`}>
                {hasCheckedOut ? "Selesai" : hasCheckedIn ? "Aktif Kerja" : "Belum Absen"}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
              {todayRecord?.checkInTime ? `Masuk: ${formatTime(todayRecord.checkInTime)}` : "Belum check-in"}
            </span>
          </article>

          {/* Payroll Status */}
          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Banknote size={14} className="text-[var(--warning)]" />
              <span>Payroll Gaji</span>
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-[var(--text-primary)]">Slip bulan ini</span>
            </div>
            <Link href="/dashboard/payroll" className="text-[11px] font-bold text-[var(--primary-dark)] hover:underline mt-1 flex items-center gap-0.5">
              <span>Buka Payroll</span> <ChevronRight size={10} />
            </Link>
          </article>

          {/* Bulan Ini Summary */}
          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Stethoscope size={14} className="text-[var(--danger)]" />
              <span>Kehadiran</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                {monthCounts.hadir}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">hadir</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
              Bulan ini: {monthCounts.cuti} cuti · {monthCounts.sakit} sakit
            </span>
          </article>
        </div>
      </section>

      {/* Pengumuman / Notifikasi Section */}
      <section aria-labelledby="notifications-announcement-title" className="card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-[var(--border-color)] pb-3">
          <h2 id="notifications-announcement-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Pengumuman & Notifikasi
          </h2>
          <Link href="/dashboard/notifications" className="text-xs font-extrabold text-[var(--primary-dark)] hover:underline">
            Lihat Semua
          </Link>
        </div>
        
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-muted)] font-medium">
            Belum ada pengumuman baru hari ini.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((item) => (
              <Link
                key={item.id}
                href="/dashboard/notifications"
                className="flex items-start gap-3 p-2 rounded-xl transition-all hover:bg-[var(--bg-secondary)] group"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.read ? "bg-gray-300" : "bg-[var(--primary-dark)]"}`} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] leading-snug group-hover:text-[var(--primary-dark)] truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5 line-clamp-1">
                    {item.message}
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)] font-medium mt-1 block">
                    {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
