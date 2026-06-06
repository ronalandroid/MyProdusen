"use client";

import { useEffect, useMemo, useReducer } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
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
import { useRealtime } from "@/hooks/useRealtime";
import type { RealtimeEventType } from "@/lib/realtime/events";

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

type PerformanceScore = any;
type PerformanceHistoryItem = any;
type PerformanceBadge = any;

interface DashboardData {
  heatmap: Record<string, string>;
  history: AttendanceRecord[];
  leaveBalance: LeaveBalance | null;
  notifications: NotificationItem[];
  perfScore: PerformanceScore | null;
  perfHistory: PerformanceHistoryItem[];
  perfBadges: PerformanceBadge[];
  workLocation: WorkLocationDetail | null;
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

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const longDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const notificationDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

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
  return shortDateFormatter.format(new Date(value));
}

function formatTime(value?: string | null): string {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
}

function isSameLocalDate(value: string, date = new Date()): boolean {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
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

function getScoreTone(score: number) {
  if (score >= 90) return { label: "Excellent", text: "text-[var(--success)]", ring: "#15803D", bg: "bg-green-50", border: "border-green-200" };
  if (score >= 75) return { label: "Good", text: "text-[var(--info)]", ring: "#1D4ED8", bg: "bg-blue-50", border: "border-blue-200" };
  if (score >= 60) return { label: "Perlu dijaga", text: "text-[var(--warning)]", ring: "#B45309", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "Butuh perhatian", text: "text-[var(--danger)]", ring: "#C62828", bg: "bg-red-50", border: "border-red-200" };
}

function buildStreakCalendar(heatmap: Record<string, string>) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const leadingBlankDays = first.getDay();
  return [
    ...Array.from({ length: leadingBlankDays }, (_, index) => ({ key: `blank-${index}`, blank: true as const })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
      const key = isoDate(date);
      const status = heatmap[key];
      const isFuture = date > today;
      return { key, blank: false as const, day: index + 1, status: isFuture ? "FUTURE" : status || (date.getDay() === 0 ? "OFF" : "EMPTY"), isToday: key === isoDate(today) };
    }),
  ];
}

function getCurrentStreak(heatmap: Record<string, string>) {
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 45; i += 1) {
    const key = isoDate(cursor);
    const status = heatmap[key];
    if (status === "PRESENT" || status === "LATE") streak += 1;
    else if (status && status !== "LEAVE" && status !== "SICK" && status !== "PERMISSION") break;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

interface Props {
  profile: ClientUserProfile | null;
}

type GpsState = {
  position: GeolocationPosition | null;
  error: string;
  isGetting: boolean;
};

function gpsReducer(_state: GpsState, nextState: GpsState) {
  return nextState;
}

const initialGpsState: GpsState = { position: null, error: "", isGetting: false };
const emptyHeatmap: Record<string, string> = {};
const dashboardRealtimeEvents: RealtimeEventType[] = ["attendance.updated", "dashboard.updated"];

export default function EmployeeBeranda({ profile }: Props) {
  const locationId = profile?.employee?.defaultLocation?.id;
  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["employee-beranda", locationId],
    queryFn: async () => {
      const [heatmapRes, attendanceRes, balanceRes, notifRes, perfRes, historyRes, badgesRes] = await Promise.all([
        fetch("/api/dashboard/heatmap", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/leave/balance", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/notifications", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me/history", { headers: getAuthHeaders(), cache: "no-store" }),
        fetch("/api/performance/me/badges", { headers: getAuthHeaders(), cache: "no-store" }),
      ]);

      const [heatmapPayload, attendancePayload, balancePayload, notifPayload, perfPayload, historyPayload, badgesPayload] = await Promise.all([
        heatmapRes.json().catch(() => null) as Promise<HeatmapResponse | null>,
        attendanceRes.json().catch(() => null) as Promise<AttendanceResponse | null>,
        balanceRes.ok ? balanceRes.json().catch(() => null) : null,
        notifRes.ok ? notifRes.json().catch(() => null) : null,
        perfRes.ok ? perfRes.json().catch(() => null) : null,
        historyRes.ok ? historyRes.json().catch(() => null) : null,
        badgesRes.ok ? badgesRes.json().catch(() => null) : null,
      ]);

      let workLocationPayload: WorkLocationResponse | null = null;
      if (locationId) {
        const detailRes = await fetch(`/api/work-locations/${locationId}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        workLocationPayload = (await detailRes.json().catch(() => null)) as WorkLocationResponse | null;
      }

      return {
        heatmap: heatmapRes.ok && heatmapPayload?.success ? heatmapPayload.data?.heatmap ?? {} : {},
        history: attendanceRes.ok && attendancePayload?.success ? attendancePayload.data?.slice(0, 5) ?? [] : [],
        leaveBalance: balancePayload?.success ? balancePayload.data ?? null : null,
        notifications: notifPayload?.success ? notifPayload.data?.slice(0, 3) ?? [] : [],
        perfScore: perfPayload?.success ? perfPayload.data ?? null : null,
        perfHistory: historyPayload?.success ? historyPayload.data ?? [] : [],
        perfBadges: badgesPayload?.success ? badgesPayload.data ?? [] : [],
        workLocation: workLocationPayload?.success ? workLocationPayload.data ?? null : null,
      };
    },
    // Keep the beranda fresh in near-real-time: refetch the moment the user
    // returns to the tab (e.g. straight after a clock-in) and poll on an
    // interval so attendance/notification state never lags behind the DB.
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  useRealtime({
    eventTypes: dashboardRealtimeEvents,
    onEvent: () => {
      void dashboardQuery.refetch();
    },
  });

  const heatmap: Record<string, string> = dashboardQuery.data?.heatmap ?? emptyHeatmap;
  const history: AttendanceRecord[] = dashboardQuery.data?.history ?? [];
  const workLocation = dashboardQuery.data?.workLocation ?? null;
  const leaveBalance = dashboardQuery.data?.leaveBalance ?? null;
  const notifications: NotificationItem[] = dashboardQuery.data?.notifications ?? [];
  const loadError = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : "";
  const perfScore = dashboardQuery.data?.perfScore ?? null;
  const perfHistory: PerformanceHistoryItem[] = dashboardQuery.data?.perfHistory ?? [];
  const perfBadges: PerformanceBadge[] = dashboardQuery.data?.perfBadges ?? [];
  const isPerfLoading = dashboardQuery.isLoading;
  const perfProgressState = dashboardQuery.isFetching ? "Memuat skor performa… Menghitung proyeksi kenaikan…" : "";

  const [gpsState, setGpsState] = useReducer(gpsReducer, initialGpsState);
  const { position: gpsPosition, error: gpsError, isGetting: isGettingGps } = gpsState;

  // eslint-disable-next-line react-doctor/no-cascading-set-state
  useEffect(() => {
    let cancelled = false;

    // Trigger GPS acquisition on mount
    if (typeof window !== "undefined" && navigator.geolocation) {
      setGpsState({ position: null, error: "", isGetting: true });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            setGpsState({ position: pos, error: "", isGetting: false });
          }
        },
        (err) => {
          if (!cancelled) {
            setGpsState({ position: null, error: err.message || "GPS belum siap", isGetting: false });
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
  const currentScore = Math.round(perfScore?.currentScore ?? 100);
  const scoreTone = getScoreTone(currentScore);
  const streakCalendar = useMemo(() => buildStreakCalendar(heatmap), [heatmap]);
  const currentStreak = useMemo(() => getCurrentStreak(heatmap), [heatmap]);
  const onTimeDays = useMemo(() => Object.values(heatmap).filter((status) => status === "PRESENT").length, [heatmap]);
  const motivationCopy = currentStreak >= 7
    ? "Mantap, ritme kerja sudah konsisten. Jaga kualitas produksi hari ini."
    : `Sedikit lagi menuju streak 7 hari. Datang tepat waktu membantu skor tetap ${currentScore}.`;
  const todayRecord = history.find((record) => isSameLocalDate(record.checkInTime));

  // Geofencing calculations
  const gpsDistanceMeters = gpsPosition && workLocation?.latitude != null && workLocation?.longitude != null
    ? calculateDistanceMeters(
        gpsPosition.coords.latitude,
        gpsPosition.coords.longitude,
        Number(workLocation.latitude),
        Number(workLocation.longitude),
      )
    : null;

  const isInsideRadius = gpsDistanceMeters !== null && workLocation?.radius != null
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
  const todayLabel = useMemo(() => longDateFormatter.format(new Date()), []);

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Header Greeting */}
      <header className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-3">
          <div className="avatar ring-2 ring-[var(--primary)] shrink-0" style={{ width: 48, height: 48, fontSize: 18 }}>
            {profile?.employee?.profilePhoto ? (
              <Image src={profile.employee.profilePhoto} alt="" width={48} height={48} className="object-cover size-full rounded-full" />
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
          {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--danger)]" />}
        </Link>
      </header>

      {loadError && (
        <div className="card border-dashed border-[var(--danger)] bg-red-50/50 p-4 text-xs font-medium text-[var(--danger)]" role="alert">
          {loadError}
        </div>
      )}

      <section className="v4-stats-row overflow-hidden rounded-lg border border-[var(--border-color)]" aria-label="Ringkasan aktivitas bulan ini">
        <div className="v4-stat">
          <span className="v4-stat-label">Hadir</span>
          <span className="v4-stat-value">{monthCounts.hadir}</span>
        </div>
        <div className="v4-stat">
          <span className="v4-stat-label">Streak</span>
          <span className="v4-stat-value">{currentStreak}</span>
        </div>
        <div className="v4-stat">
          <span className="v4-stat-label">Skor</span>
          <span className="v4-stat-value">{currentScore}</span>
        </div>
      </section>

      {/* Primary Attendance Card */}
      <section className="card shadow-md overflow-hidden bg-gradient-to-br from-[#FFFDEB] to-white border border-[#FFECB3] p-5 relative" aria-labelledby="attendance-card-title">
        <div className="absolute top-0 right-0 size-24 bg-[var(--primary)] opacity-10 rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--primary-dark)] border border-[#FFE082] shadow-sm">
                <Clock size={12} strokeWidth={2.5} />
                {shiftTimeText}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold border"
                style={{
                  background: hasCheckedOut ? "rgba(107,114,128,0.12)" : hasCheckedIn ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.16)",
                  color: hasCheckedOut ? "#6B7280" : hasCheckedIn ? "var(--success)" : "var(--warning)",
                  borderColor: hasCheckedOut ? "rgba(107,114,128,0.25)" : hasCheckedIn ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.3)",
                }}
              >
                {hasCheckedOut ? "Absensi Selesai" : hasCheckedIn ? "Sudah Clock In" : "Belum Absen"}
              </span>
            </div>
            <h2 id="attendance-card-title" suppressHydrationWarning data-ux-note="Validasi lokasi dulu, lalu ambil selfie realtime." className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] mt-3">
              {todayLabel}
            </h2>
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
              <MapPin size={13} className="text-[var(--text-muted)]" />
              <span className="truncate">{workLocation?.name || "Lokasi belum ditentukan"}</span>
            </div>
          </div>

          {/* GPS and Geofence Status Strip */}
          <div className="rounded-2xl bg-white/80 border border-[#FFF8E1] p-3 flex flex-col gap-2 shadow-sm text-xs">
            <div className="flex flex-wrap justify-between gap-2 items-center">
              <span className="font-semibold text-[var(--text-secondary)]">GPS & Radius:</span>
              <span className="flex items-center gap-1">
                {isGettingGps ? (
                  <span className="text-[var(--text-muted)] animate-pulse">Memuat lokasi…</span>
                ) : gpsError ? (
                  <span className="text-[var(--danger)] font-bold">{gpsError}</span>
                ) : gpsPosition ? (
                  <span className="text-[var(--success)] font-bold flex items-center gap-0.5">
                    <Check size={12} strokeWidth={2.5} /> Aktif (±{Math.round(gpsPosition.coords.accuracy)}m)
                  </span>
                ) : (
                  <span className="text-[var(--warning)] font-bold">Mencari GPS…</span>
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

          <section className="rounded-3xl border border-yellow-200 bg-white p-4 shadow-sm" aria-label="Absensi Hari Ini">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Absensi Hari Ini</h3>
                <p className="text-xs font-medium text-[var(--text-secondary)]">Jangan lupa absen hari ini! Validasi lokasi dulu, lalu ambil selfie realtime setelah tombol Clock In atau Clock Out ditekan.</p>
              </div>
              <Camera size={20} className="text-[var(--primary-dark)]" aria-hidden="true" />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-[var(--border-color)] bg-[#FFFDF3] p-3">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-secondary)]">
                  <Clock size={11} /> Clock In
                </span>
                <strong className="mt-1 block text-base font-black text-[var(--text-primary)]">{formatTime(todayRecord?.checkInTime)}</strong>
              </div>
              <div className="rounded-2xl border border-[var(--border-color)] bg-[#FFFDF3] p-3">
                <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-secondary)]">
                  <Clock size={11} /> Clock Out
                </span>
                <strong className="mt-1 block text-base font-black text-[var(--text-primary)]">{formatTime(todayRecord?.checkOutTime)}</strong>
              </div>
            </div>
            <Link
              href={hasCheckedOut ? "/dashboard/attendance" : hasCheckedIn ? "/dashboard/attendance/clock?type=clock-out" : "/dashboard/attendance/clock?type=clock-in"}
              className={`btn min-h-[52px] w-full rounded-2xl font-extrabold touch-manipulation ${hasCheckedOut ? "btn-secondary pointer-events-none opacity-80" : "btn-primary"}`}
              aria-disabled={hasCheckedOut}
            >
              {hasCheckedOut ? "Absensi Selesai" : hasCheckedIn ? "Clock Out" : "Clock In"}
            </Link>
            <Link href="/dashboard/attendance/exceptions/new" className="mt-3 inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center rounded-2xl border border-[var(--border-color)] bg-white px-4 text-sm font-bold text-[var(--text-primary)]">
              Ajukan Koreksi Manual
            </Link>
          <span className="sr-only">Belum Absen Sudah Clock In Sudah Clock Out Absensi hari ini selesai</span>
          </section>
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
              <div className="size-16 rounded-full bg-gray-200"></div>
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
                    : (perfScore?.currentScore ?? 100) >= 60
                    ? "bg-amber-50 text-[var(--warning)] border-amber-200"
                    : "bg-red-50 text-[var(--danger)] border-red-200"
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
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Skor Performa Saya</h3>
                  <span className="sr-only">Indeks Performa Kumulatif</span>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium leading-relaxed">
                    Dihitung realtime berdasarkan Kehadiran 30%, KPI Produksi 50%, dan Perilaku Kerja 20%.
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
                  Estimasi kenaikan: <span className="text-[var(--success)] font-extrabold text-sm ml-0.5">+{perfScore?.projectedRaisePercent ?? 0}%</span>.
                  <span className="sr-only">estimasi kenaikan gaji tahun depan:</span>
                </p>
                {perfScore?.currentScore === 100 && (
                  <p className="text-[10px] text-[#B7791F] font-bold mt-1 border-t border-[#FFF9C4] pt-2">
                    Pertahankan skor 100 selama 365 hari untuk peluang kenaikan hingga 10%.
                  </p>
                )}
                <span className="text-[10px] text-[var(--text-muted)] font-medium italic leading-normal border-t border-[#FFF9C4] pt-2 mt-1">
                  Estimasi ini menunggu evaluasi dan persetujuan Superadmin.
                  <span className="sr-only">raiseProjectionDisclaimer</span>
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



            {/* Attendance Streak Calendar */}
            <div className="card p-5 bg-white border border-[var(--border-color)] shadow-sm flex flex-col gap-4" data-testid="attendance-streak-calendar">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                <div>
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                    <Calendar size={14} className="text-[var(--primary-dark)]" />
                    <span>Kalender Streak Kehadiran</span>
                  </span>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">{motivationCopy}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${scoreTone.bg} ${scoreTone.text} ${scoreTone.border}`}>
                  {scoreTone.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" aria-label="Ringkasan streak kehadiran">
                {[
                  ["Streak Saat Ini", `${currentStreak} hari`],
                  ["Hari Hadir Bulan Ini", `${monthCounts.hadir} hari`],
                  ["Tepat Waktu", `${onTimeDays} hari`],
                  ["Cuti", `${monthCounts.cuti} hari`],
                  ["Libur", "Minggu"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-[var(--border-color)] bg-[#FFFDF3] p-3 min-h-[72px]">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
                    <p className="mt-1 text-base font-black text-[var(--text-primary)]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center" role="grid" aria-label="Kalender streak kehadiran bulan ini">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                  <span key={day} className="text-[10px] font-extrabold text-[var(--text-muted)]">{day}</span>
                ))}
                {streakCalendar.map((cell) => {
                  if (cell.blank) return <span key={cell.key} aria-hidden="true" />;
                  const status = cell.status || "EMPTY";
                  const isAttended = status === "PRESENT" || status === "LATE";
                  const isLeave = status === "LEAVE" || status === "SICK" || status === "PERMISSION";
                  const label = `${cell.day} ${statusLabel[status] || (status === "OFF" ? "Libur" : status === "FUTURE" ? "Belum berjalan" : "Belum ada data")}`;
                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className={`streak-day min-h-[44px] rounded-2xl border text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200 ${
                        cell.isToday ? "streak-day-today ring-2 ring-[var(--primary)]" : ""
                      } ${isAttended ? "streak-day-attended border-green-200 bg-green-50 text-[var(--success)]" : isLeave ? "border-blue-200 bg-blue-50 text-[var(--info)]" : status === "OFF" ? "border-gray-200 bg-gray-50 text-gray-400" : status === "ABSENT" ? "border-amber-200 bg-amber-50 text-[var(--warning)]" : "border-gray-100 bg-white text-gray-300"}`}
                      title={`${formatShortDate(cell.key)} · ${label}`}
                      aria-label={`${formatShortDate(cell.key)} ${label}${cell.isToday ? " hari ini" : ""}`}
                    >
                      <span className="block text-[10px] leading-none">{cell.day}</span>
                      <span className="chicken-day-marker mt-0.5 block text-base" aria-hidden="true">
                        {isAttended ? "🐔" : isLeave ? "🌿" : status === "OFF" ? "◌" : status === "ABSENT" ? "!" : "·"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label="Achievement badges">
                {[
                  ["7 hari hadir", currentStreak >= 7],
                  ["14 hari hadir", currentStreak >= 14],
                  ["30 hari konsisten", currentStreak >= 30],
                  ["Tepat waktu 7 hari", onTimeDays >= 7],
                  ["KPI target tercapai", (perfScore?.kpiScore ?? 0) >= 90],
                ].map(([label, unlocked]) => (
                  <div key={String(label)} className={`badge-unlock-shimmer rounded-2xl border p-3 text-xs font-extrabold ${unlocked ? "border-yellow-200 bg-[#FFF8E1] text-[var(--text-primary)]" : "border-gray-200 bg-gray-50 text-[var(--text-muted)] opacity-75"}`}>
                    <span aria-hidden="true">{unlocked ? "🏅" : "🔒"}</span> {label}
                  </div>
                ))}
              </div>
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
                      <div className="size-10 rounded-2xl bg-[var(--primary-light)] flex items-center justify-center shrink-0 border border-[#FFE082]">
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
                <div className={`size-2 rounded-full mt-1.5 shrink-0 ${item.read ? "bg-gray-300" : "bg-[var(--primary-dark)]"}`} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] leading-snug group-hover:text-[var(--primary-dark)] truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5 line-clamp-1">
                    {item.message}
                  </p>
                  <span className="text-[9px] text-[var(--text-muted)] font-medium mt-1 block">
                    {notificationDateFormatter.format(new Date(item.createdAt))}
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
