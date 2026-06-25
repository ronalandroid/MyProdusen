"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ArrowLeft, ClipboardList, Info, MapPin, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchApiData, fetchApiList, useCachedProfile } from "@/hooks/useDashboardQueries";
import { SelfieViewer } from "@/components/attendance/SelfieViewer";
import { MyExceptionPanel } from "@/components/attendance/MyExceptionPanel";
import SelfieReviewGrid from "@/components/attendance/SelfieReviewGrid";

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

type AttendanceRecord = {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  workLocation?: {
    name: string;
    address: string;
  } | null;
  checkInSelfieUploadedAt?: string | null;
  checkInSelfieSizeBytes?: number | null;
  checkInSelfieMimeType?: string | null;
  checkOutSelfieUploadedAt?: string | null;
  checkOutSelfieSizeBytes?: number | null;
  checkOutSelfieMimeType?: string | null;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function formatDate(date: Date) {
  return fullDateFormatter.format(date);
}

function formatShortDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
}

function calculateDistanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function AttendanceHeader({ onBack, avatarName }: { onBack: () => void; avatarName: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <button type="button" className="flex cursor-pointer items-center gap-3 animate-fade-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" onClick={onBack} aria-label="Kembali ke halaman sebelumnya">
        <ArrowLeft size={24} />
        <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Bell size={24} color="var(--text-primary)" />
        <div className="avatar flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[13px] font-bold text-[var(--text-primary)]">
          {avatarName.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function SuperadminAttendanceView({ onBack }: { onBack: () => void }) {
  return (
    <div className="phone-screen attendance-screen" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button type="button" className="btn btn-secondary btn-icon" onClick={onBack} aria-label="Kembali">
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Kehadiran</h1>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Superadmin mengelola monitoring, approval, dan laporan. Absensi selfie mandiri hanya untuk Karyawan dan Leader.
          </p>
        </div>
      </div>

      <section className="card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }} aria-labelledby="admin-attendance-title">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ backgroundColor: "var(--primary)", padding: "10px", borderRadius: "14px", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 id="admin-attendance-title" style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Laporan Kehadiran</h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Gunakan halaman laporan dan approval untuk memantau absensi, geo-fence, dan bukti selfie terlindungi.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/dashboard/reports/attendance" className="btn btn-primary min-h-[44px]">Buka Laporan Kehadiran</Link>
          <Link href="/dashboard/attendance/exceptions" className="btn btn-secondary min-h-[44px]">Approval Absensi</Link>
        </div>
      </section>

      <SelfieReviewGrid />
    </div>
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useCachedProfile();
  const profile = profileData ?? null;
  const { data: todayData, isLoading: todayLoading, error: todayError, refetch: refetchToday } = useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", "today"],
    queryFn: () => fetchApiData<AttendanceRecord | null>("/api/attendance/today", "Gagal mengambil absensi hari ini"),
    enabled: Boolean(profile && profile.role !== "SUPERADMIN"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const { data: historyData, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "history", "recent"],
    queryFn: () => fetchApiList<AttendanceRecord>("/api/attendance", "Gagal mengambil riwayat absensi"),
    enabled: Boolean(profile && profile.role !== "SUPERADMIN"),
    select: (records) => records.slice(0, 5),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const [viewerState, setViewerState] = useState<{ record: AttendanceRecord; kind: "check-in" | "check-out" } | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  const todayAttendance = todayData ?? null;
  const history = historyData ?? [];
  const error = profileError?.message || todayError?.message || historyError?.message || "";
  const isLoading = profileLoading || (Boolean(profile && profile.role !== "SUPERADMIN") && (todayLoading || historyLoading));

  const isSuperadminAttendanceViewer = profile?.role === "SUPERADMIN";
  const employee = profile?.employee;
  const locationName = todayAttendance?.workLocation?.name || employee?.defaultLocation?.name || "Lokasi kerja belum tersedia";
  const locationAddress = todayAttendance?.workLocation?.address || employee?.defaultLocation?.address || "Hubungi HR untuk pengaturan lokasi kerja.";
  const assignedLocation = employee?.defaultLocation;
  const officialPreviewDistanceMeters = assignedLocation
    ? calculateDistanceMeters(
        { latitude: assignedLocation.latitude, longitude: assignedLocation.longitude },
        { latitude: assignedLocation.latitude, longitude: assignedLocation.longitude },
      )
    : null;
  const shift = employee?.defaultShift;
  const shiftLabel = shift ? `${shift.name} (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})` : "Shift belum tersedia";

  const loadAttendance = async () => {
    await Promise.all([refetchProfile(), refetchToday(), refetchHistory()]);
  };

  if (isSuperadminAttendanceViewer) {
    return <SuperadminAttendanceView onBack={() => router.back()} />;
  }

  const hasCheckedIn = Boolean(todayAttendance?.checkInTime);
  const hasCheckedOut = Boolean(todayAttendance?.checkOutTime);

  const checkInDisabled = hasCheckedIn || isLoading || !assignedLocation;
  const checkOutDisabled = !hasCheckedIn || hasCheckedOut || isLoading || !assignedLocation;

  return (
    <div className="phone-screen attendance-screen pb-8" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <AttendanceHeader onBack={() => router.back()} avatarName={employee?.fullName || profile?.username || "U"} />

      {/* Time hero */}
      <div className="flex items-end justify-between">
        <div>
          <div suppressHydrationWarning className="text-4xl font-black leading-none tracking-tight text-[var(--text-primary)]">
            {now ? timeFormatter.format(now) : "--:--"}
          </div>
          <div suppressHydrationWarning className="mt-1.5 text-sm font-semibold text-[var(--text-secondary)]">
            {formatDate(now ?? new Date())}
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 border border-green-200">
          <span className="size-2 rounded-full bg-[var(--success)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--success)]">Online</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="text-xs font-bold text-[var(--danger)] bg-red-50 border border-red-200 rounded-2xl p-3">
          {error}
        </div>
      )}

      {/* Jadwal Hari Ini Section */}
      <section className="card p-4 border border-[var(--border-color)] bg-white" aria-labelledby="schedule-title">
        <h2 id="schedule-title" className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider mb-3">Jadwal Hari Ini</h2>
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--text-primary)]">
              <ClipboardList size={18} />
            </div>
            <div>
              <strong className="block text-sm font-extrabold text-[var(--text-primary)]">{shiftLabel}</strong>
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{locationName}</span>
            </div>
          </div>
        </div>
        
        {assignedLocation && (
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold p-1 px-2 border-t border-[var(--border-color)] pt-3">
            <span className="flex items-center gap-1"><MapPin size={13} className="text-[var(--text-muted)]" /> Lihat lokasi kehadiran lainnya</span>
            <ChevronRight size={14} className="text-[var(--text-muted)]" />
          </div>
        )}
      </section>

      {/* Notice Card */}
      <div className="card flex items-start gap-3 border border-[var(--attn-warn-border)] bg-[var(--attn-warn-bg)] p-4 rounded-2xl">
        <Info size={18} className="text-[var(--primary-dark)] shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-[var(--text-primary)] leading-relaxed">
          Foto selfie dan verifikasi lokasi GPS diperlukan untuk Clock In dan Clock Out.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/attendance/clock?type=clock-in"
          className={`min-h-[52px] flex-1 rounded-2xl font-black text-sm flex items-center justify-center shadow-md transition-all ${
            checkInDisabled
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed pointer-events-none"
              : "bg-[var(--attn-red)] hover:bg-[var(--attn-red-hover)] text-white"
          }`}
          aria-disabled={checkInDisabled}
        >
          Clock In
        </Link>
        <Link
          href="/dashboard/attendance/clock?type=clock-out"
          className={`min-h-[52px] flex-1 rounded-2xl font-black text-sm flex items-center justify-center border-2 shadow-md transition-all ${
            checkOutDisabled
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed pointer-events-none"
              : "border-[var(--attn-red)] text-[var(--attn-red)] bg-white hover:bg-red-50"
          }`}
          aria-disabled={checkOutDisabled}
        >
          Clock Out
        </Link>
      </div>

      {/* Log Hari Ini Section */}
      {todayAttendance && (
        <section className="card p-4 border border-[var(--border-color)] bg-white" aria-labelledby="today-log-title">
          <h2 id="today-log-title" className="mb-4 text-sm font-extrabold text-[var(--text-primary)]">Log Absensi Hari Ini</h2>
          <ol className="relative flex flex-col gap-5 pl-2">
            <span aria-hidden="true" className="absolute left-[19px] bottom-3 top-3 w-0.5 bg-[var(--border-color)]" />
            {([
              { id: "in", label: "Clock In", time: formatTime(todayAttendance.checkInTime), active: Boolean(todayAttendance.checkInTime), tone: "var(--attn-success)" },
              { id: "out", label: "Clock Out", time: formatTime(todayAttendance.checkOutTime), active: Boolean(todayAttendance.checkOutTime), tone: "var(--attn-red)" },
            ] as const).map((item) => {
              const late = todayAttendance.status === "LATE";
              const showBadge = item.id === "in" && item.active;
              return (
              <li key={item.id} className="relative flex items-center gap-4">
                <span
                  className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white"
                  style={{ borderColor: item.active ? item.tone : "var(--border-color)", color: item.active ? item.tone : "var(--text-muted)" }}
                  aria-hidden="true"
                >
                  <ClipboardList size={16} />
                </span>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <strong className="block text-sm font-extrabold text-[var(--text-primary)]">{item.label}</strong>
                    {showBadge ? (
                      <span
                        className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold"
                        style={late ? { background: "rgba(245,124,0,0.14)", color: "var(--attn-warning)" } : { background: "rgba(46,125,50,0.14)", color: "var(--attn-success)" }}
                      >
                        {late ? "Terlambat" : "Tepat Waktu"}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{item.active ? "Tercatat" : "Belum Absen"}</span>
                    )}
                  </div>
                  <span className={`text-sm font-black ${item.active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{item.time}</span>
                </div>
              </li>
            );})}
          </ol>
        </section>
      )}

      {/* Lokasi Kerja Card */}
      <div>
        <h2 className="text-sm font-extrabold text-[var(--text-primary)] mb-3">Lokasi Kerja</h2>
        <div className="card border border-[var(--border-color)] bg-white" style={{ padding: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px", color: "var(--text-primary)" }}>{locationName}</div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{locationAddress}</div>
            {assignedLocation ? (
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>{assignedLocation.latitude.toFixed(7)}, {assignedLocation.longitude.toFixed(7)}</span>
                <span>Radius resmi: {assignedLocation.radius} m</span>
                <span>Jarak ke lokasi preview: {officialPreviewDistanceMeters} m (dihitung ulang saat Clock In/Clock Out).</span>
                <span>Anda berada di luar radius lokasi kerja jika jarak GPS melebihi radius resmi.</span>
                <span>Server tetap menghitung jarak resmi; tampilan ini hanya preview.</span>
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "var(--danger)", marginTop: "6px", fontWeight: 700 }}>
                Lokasi kerja belum tersedia. Hubungi Superadmin.
              </div>
            )}
          </div>
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--attn-neutral-surface)] border border-[var(--border-color)] flex items-center justify-center">
            <MapPin size={24} className="text-[var(--danger)]" />
          </div>
        </div>
      </div>

      {/* Riwayat Kehadiran */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>Riwayat Kehadiran</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {history.length === 0 ? (
            <output className="card border border-dashed border-[var(--border-color)]" style={{ padding: "32px 16px", textAlign: "center", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
              Belum ada riwayat kehadiran.
            </output>
          ) : (
            history.map((record) => (
              <div key={record.id} className="card p-4 border border-[var(--border-color)] bg-white flex flex-col gap-3">
                <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>{formatShortDate(record.checkInTime)}</div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Clock In</span>
                    <div style={{ fontSize: "14px", fontWeight: 800 }}>{formatTime(record.checkInTime)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Clock Out</span>
                    <div style={{ fontSize: "14px", fontWeight: 800 }}>{formatTime(record.checkOutTime)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                  {record.checkInTime && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm rounded-xl px-3 py-1 text-xs font-bold"
                      onClick={() => setViewerState({ record, kind: "check-in" })}
                    >
                      Selfie Masuk
                    </button>
                  )}
                  {record.checkOutTime && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm rounded-xl px-3 py-1 text-xs font-bold"
                      onClick={() => setViewerState({ record, kind: "check-out" })}
                    >
                      Selfie Pulang
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewerState && (
        <SelfieViewer
          attendanceId={viewerState.record.id}
          kind={viewerState.kind}
          open
          onClose={() => setViewerState(null)}
          takenAt={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieUploadedAt || viewerState.record.checkInTime
              : viewerState.record.checkOutSelfieUploadedAt || viewerState.record.checkOutTime
          }
          sizeBytes={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieSizeBytes
              : viewerState.record.checkOutSelfieSizeBytes
          }
          mimeType={
            viewerState.kind === "check-in"
              ? viewerState.record.checkInSelfieMimeType
              : viewerState.record.checkOutSelfieMimeType
          }
        />
      )}

      <MyExceptionPanel todayAttendanceId={todayAttendance?.id || null} />
    </div>
  );
}
