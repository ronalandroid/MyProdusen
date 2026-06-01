"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Camera,
  CheckCircle2,
  FileWarning,
  MapPin,
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
  ClipboardList,
  Users,
} from "lucide-react";
import { getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

interface AttendanceRecord {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status?: string | null;
  workLocation?: { name?: string | null; address?: string | null } | null;
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

type Team = { id: string; name: string };
type LeaderPayload = { success: boolean; data?: { teams: Team[]; teamAssigned: boolean }; error?: string; message?: string };
type KpiPayload = { success: boolean; data?: Array<{ quantity: string; unit: string; date: string }>; error?: string; message?: string };

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

function formatTime(value?: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function LeaderBeranda({ profile }: { profile: ClientUserProfile | null }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [kpiRows, setKpiRows] = useState<Array<{ quantity: string; unit: string; date: string }>>([]);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [workLocation, setWorkLocation] = useState<WorkLocationDetail | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState("");

  // KPI Cetak states
  const [kpiMembers, setKpiMembers] = useState<any[]>([]);
  const [kpiValues, setKpiValues] = useState<Record<string, string>>({});
  const [isKpiLoading, setIsKpiLoading] = useState(false);
  const [isKpiSaving, setIsKpiSaving] = useState(false);
  const [kpiFeedback, setKpiFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // GPS states
  const [gpsPosition, setGpsPosition] = useState<GeolocationPosition | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [isGettingGps, setIsGettingGps] = useState(false);

  async function saveKpiCetak() {
    if (teams.length === 0) return;
    setIsKpiSaving(true);
    setKpiFeedback(null);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const entries = kpiMembers
        .filter((member) => kpiValues[member.id] !== undefined && kpiValues[member.id] !== "")
        .map((member) => ({
          employeeId: member.id,
          teamId: teams[0].id,
          date: todayStr,
          metricType: "production_count",
          quantity: Number(kpiValues[member.id]),
          unit: "cetakan",
        }));

      if (entries.length === 0) {
        throw new Error("Masukkan jumlah cetakan terlebih dahulu.");
      }

      const response = await fetch("/api/leader/kpi-production", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || "Gagal menyimpan KPI tim");
      }
      setKpiRows((previousRows) => [...entries.map((entry) => ({ quantity: String(entry.quantity), unit: entry.unit, date: entry.date })), ...previousRows].slice(0, 6));
      setKpiFeedback({ type: "success", message: "KPI tim berhasil disimpan. Progress leaderboard diperbarui." });
    } catch (err) {
      setKpiFeedback({ type: "error", message: err instanceof Error ? err.message : "Gagal menyimpan KPI tim" });
    } finally {
      setIsKpiSaving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadEverything() {
      try {
        const [leaderRes, kpiRes, attendanceRes, balanceRes, notifRes] = await Promise.all([
          fetch("/api/leader/me", { credentials: "include", cache: "no-store" }),
          fetch("/api/kpi/production/me", { credentials: "include", cache: "no-store" }),
          fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/leave/balance", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/notifications", { headers: getAuthHeaders(), cache: "no-store" }),
        ]);

        const leaderPayload = (await leaderRes.json()) as LeaderPayload;
        const kpiPayload = (await kpiRes.json()) as KpiPayload;
        const attendancePayload = (await attendanceRes.json()) as AttendanceResponse;
        const balancePayload = balanceRes.ok ? await balanceRes.json().catch(() => null) : null;
        const notifPayload = notifRes.ok ? await notifRes.json().catch(() => null) : null;

        if (cancelled) return;

        if (leaderPayload.success) {
          const fetchedTeams = leaderPayload.data?.teams || [];
          setTeams(fetchedTeams);
          if (fetchedTeams.length > 0) {
            setIsKpiLoading(true);
            try {
              const teamRes = await fetch(`/api/leader/team-employees?teamId=${encodeURIComponent(fetchedTeams[0].id)}`, { credentials: "include", cache: "no-store" });
              const teamPayload = await teamRes.json();
              if (teamPayload.success && !cancelled) {
                setKpiMembers(teamPayload.data || []);
              }

              const todayStr = new Date().toISOString().slice(0, 10);
              const kpiEntriesRes = await fetch(`/api/leader/kpi-production?teamId=${encodeURIComponent(fetchedTeams[0].id)}&date=${todayStr}`, { credentials: "include", cache: "no-store" });
              const kpiEntriesPayload = await kpiEntriesRes.json();
              if (kpiEntriesPayload.success && kpiEntriesPayload.data && !cancelled) {
                const initialValues: Record<string, string> = {};
                kpiEntriesPayload.data.forEach((entry: any) => {
                  initialValues[entry.employeeId] = String(entry.quantity);
                });
                setKpiValues(initialValues);
              }
            } catch (kpiErr) {
              console.error("Gagal memuat KPI tim:", kpiErr);
            } finally {
              if (!cancelled) setIsKpiLoading(false);
            }
          }
        } else {
          setError(leaderPayload.error || leaderPayload.message || "Anda belum ditetapkan ke tim. Hubungi Superadmin.");
        }

        if (kpiPayload.success) {
          setKpiRows(kpiPayload.data || []);
        }

        if (attendancePayload.success && attendancePayload.data) {
          setHistory(attendancePayload.data.slice(0, 5));
        }

        if (balancePayload?.success && balancePayload?.data) {
          setLeaveBalance(balancePayload.data);
        }

        if (notifPayload?.success && notifPayload?.data) {
          setNotifications(notifPayload.data.slice(0, 3));
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
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Beranda Leader belum lengkap.");
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

  const today = new Date().toISOString().slice(0, 10);
  const ownKpiToday = useMemo(() => kpiRows.filter((row) => row.date === today).reduce((sum, row) => sum + Number(row.quantity || 0), 0), [kpiRows, today]);

  const displayName = profile?.employee?.fullName || profile?.username || "Leader";
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
  const totalCetakan = kpiRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);

  const quickActions = [
    { name: "Absensi Saya", path: "/dashboard/attendance", icon: Clock, bg: "var(--primary-light)", text: "var(--primary-dark)" },
    { name: "Input KPI Tim", path: "/dashboard/leader/kpi-input", icon: ClipboardList, bg: "rgba(34,197,94,0.1)", text: "var(--success)" },
    { name: "Tim Saya", path: "/dashboard/leader/team", icon: Users, bg: "rgba(59,130,246,0.1)", text: "var(--info)" },
    { name: "KPI Saya", path: "/dashboard/kpi", icon: BarChart3, bg: "rgba(245,158,11,0.1)", text: "var(--warning)" },
    { name: "Laporan Tim", path: "/dashboard/leader/reports", icon: FileText, bg: "rgba(229,57,53,0.1)", text: "var(--danger)" },
    { name: "Payroll Saya", path: "/dashboard/payroll", icon: Banknote, bg: "rgba(107,114,128,0.1)", text: "#6B7280" },
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
              Leader · Tim: {teams.length ? teams.map((team) => team.name).join(", ") : "Belum ada tim"}
            </p>
          </div>
        </div>
        <Link href="/dashboard/notifications" className="icon-button shrink-0 relative bg-white border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]" aria-label="Notifikasi">
          <Bell size={20} className="text-[var(--text-primary)]" />
          {notifications.some(n => !n.read) && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--danger)]" />}
        </Link>
      </header>

      {error && (
        <div className="card border-dashed border-[var(--warning)] bg-amber-50/50 p-4 text-xs font-semibold text-amber-800" role="alert">
          {error}
        </div>
      )}

      <section className="gamification-hub leader-quest-board" aria-labelledby="leader-quest-title">
        <div>
          <p className="eyebrow">Gamification</p>
          <h2 id="leader-quest-title">Leader Quest Board</h2>
          <p>Streak absensi, cetakan tim, dan cuti sehat.</p>
        </div>
        <div className="gamification-metrics" role="list">
          <article className="gamification-badge gamification-badge-success" role="listitem">
            <span>Daily Attendance</span>
            <strong>{hasCheckedIn ? "1/1" : "0/1"}</strong>
            <div className="progress-track" aria-label="Daily Attendance progress"><i style={{ width: hasCheckedIn ? "100%" : "0%" }} /></div>
          </article>
          <article className="gamification-badge gamification-badge-warning" role="listitem">
            <span>Team Cetakan</span>
            <strong>{totalCetakan}</strong>
            <div className="progress-track" aria-label="Team Cetakan progress"><i style={{ width: `${Math.min(100, totalCetakan)}%` }} /></div>
          </article>
          <article className="gamification-badge gamification-badge-info" role="listitem">
            <span>Leave Balance</span>
            <strong>{leaveBalance?.available ?? 0}</strong>
            <div className="progress-track" aria-label="Leave Balance progress"><i style={{ width: `${leaveBalance?.entitlement ? Math.round(((leaveBalance.available ?? 0) / leaveBalance.entitlement) * 100) : 0}%` }} /></div>
          </article>
        </div>
      </section>

      {/* Primary Attendance Card */}
      <section className="card shadow-md overflow-hidden bg-gradient-to-br from-[#FFFDEB] to-white border border-[#FFECB3] p-5 relative" aria-labelledby="leader-attendance-card-title">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--primary)] opacity-10 rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[var(--primary-dark)] border border-[#FFE082] shadow-sm">
              <Clock size={12} strokeWidth={2.5} />
              {shiftTimeText}
            </span>
            <h2 id="leader-attendance-card-title" className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] mt-3">
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

          <section className="rounded-3xl border border-yellow-200 bg-white p-4 shadow-sm" aria-label="Absensi Hari Ini">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Absensi Hari Ini</h3>
                <p className="text-xs font-medium text-[var(--text-secondary)]">Jangan lupa absen hari ini! Validasi lokasi dulu, lalu ambil selfie realtime. Validasi lokasi dulu, lalu ambil selfie realtime setelah tombol Clock In atau Clock Out ditekan.</p>
              </div>
              <Camera size={20} className="text-[var(--primary-dark)]" aria-hidden="true" />
            </div>
            <Link
              href={hasCheckedOut ? "/dashboard/attendance" : hasCheckedIn ? "/dashboard/attendance/clock?type=clock-out" : "/dashboard/attendance/clock?type=clock-in"}
              className={`btn min-h-[52px] w-full rounded-2xl font-extrabold ${hasCheckedOut ? "btn-secondary pointer-events-none opacity-80" : "btn-primary"}`}
              aria-disabled={hasCheckedOut}
            >
              {hasCheckedOut ? "Absensi Selesai" : hasCheckedIn ? "Clock Out" : "Clock In"}
            </Link>
            <Link href="/dashboard/attendance/exceptions/new" className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[var(--border-color)] bg-white px-4 text-sm font-bold text-[var(--text-primary)]">
              Ajukan Koreksi Manual
            </Link>
          <span className="sr-only">Belum Absen Sudah Clock In Sudah Clock Out Absensi hari ini selesai</span>
          </section>
        </div>
      </section>

      {/* Quick Actions Grid (Max 2 rows on mobile) */}
      <section aria-labelledby="leader-actions-title">
        <div className="section-heading mb-3">
          <h2 id="leader-actions-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Menu Leader
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

      {/* Input KPI Cetak Card */}
      <section aria-labelledby="kpi-cetak-title" className="card p-5 shadow-sm border border-[var(--border-color)]">
        <div className="flex items-center justify-between gap-3 mb-4 border-b border-[var(--border-color)] pb-3">
          <div>
            <h2 id="kpi-cetak-title" className="text-base font-extrabold text-[var(--text-primary)]">
              Input KPI Cetak Hari Ini
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Isi jumlah produksi cetakan untuk anggota tim Anda ({new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" })}).
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-[var(--primary-dark)] border border-[#FFE082] shadow-sm">
            <ClipboardList size={12} /> Cetak
          </span>
        </div>

        {kpiFeedback && (
          <div role="status" className={`rounded-xl p-3 text-xs font-semibold mb-3 ${
            kpiFeedback.type === "success" ? "bg-green-50 text-[var(--success)] border border-green-200" : "bg-red-50 text-[var(--danger)] border border-red-200"
          }`}>
            {kpiFeedback.message}
          </div>
        )}

        {isKpiLoading ? (
          <div className="py-4 text-center text-xs text-[var(--text-muted)] animate-pulse">Memuat anggota tim...</div>
        ) : kpiMembers.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-muted)] font-medium bg-[var(--bg-secondary)] rounded-2xl border border-dashed border-[var(--border-color)]">
            Belum ada anggota tim terdaftar atau tidak ada Karyawan Cetak.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {kpiMembers.map((member) => (
              <div key={member.id} className="grid grid-cols-[1fr_100px] items-center gap-3 rounded-2xl border border-[var(--border-color)] p-3 hover:border-[var(--primary)] transition-all">
                <div className="min-w-0">
                  <p className="font-extrabold text-[var(--text-primary)] text-sm truncate leading-snug">{member.fullName}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-0.5">{member.nip} · Cetak</p>
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="min-h-[44px] w-full rounded-xl border border-[var(--border-color)] p-2 text-center font-bold text-sm bg-[var(--bg-secondary)] focus:bg-white focus:border-[var(--primary)] transition-all"
                  placeholder="0"
                  value={kpiValues[member.id] || ""}
                  onChange={(e) => setKpiValues(prev => ({ ...prev, [member.id]: e.target.value }))}
                />
              </div>
            ))}

            <button
              type="button"
              disabled={isKpiSaving || !Object.values(kpiValues).some(v => v !== "")}
              onClick={saveKpiCetak}
              className="btn btn-primary min-h-[44px] rounded-xl font-bold w-full mt-2"
            >
              {isKpiSaving ? "Menyimpan..." : "Simpan Semua Cetakan"}
            </button>
          </div>
        )}
      </section>

      {/* Team Summary */}
      <section aria-labelledby="team-summary-title">
        <div className="section-heading mb-3">
          <h2 id="team-summary-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
            Ringkasan Tim Saya
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Users size={14} className="text-[var(--primary-dark)]" />
              <span>Tim Terdaftar</span>
            </span>
            <div className="mt-1">
              <strong className="text-base font-extrabold text-[var(--text-primary)] line-clamp-1">
                {teams.length ? teams.map((team) => team.name).join(", ") : "Belum ada tim"}
              </strong>
            </div>
            <Link href="/dashboard/leader/team" className="text-[11px] font-bold text-[var(--primary-dark)] hover:underline mt-1 flex items-center gap-0.5">
              <span>Buka Tim</span> <ChevronRight size={10} />
            </Link>
          </article>

          <article className="card p-4 flex flex-col justify-between gap-1.5 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <BarChart3 size={14} className="text-[var(--success)]" />
              <span>Produksi Hari Ini</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                {ownKpiToday}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">pcs</span>
            </div>
            <Link href="/dashboard/kpi" className="text-[11px] font-bold text-[var(--primary-dark)] hover:underline mt-1 flex items-center gap-0.5">
              <span>Buka KPI</span> <ChevronRight size={10} />
            </Link>
          </article>
        </div>
      </section>

      {/* Pengumuman / Notifikasi Section */}
      <section aria-labelledby="leader-notifications-title" className="card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3 border-b border-[var(--border-color)] pb-3">
          <h2 id="leader-notifications-title" className="text-sm font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
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
