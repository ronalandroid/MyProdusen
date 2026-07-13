"use client";

import { Suspense, useEffect, useState } from "react";
import { sizedImageSrc } from "@/lib/images/sized-image-src";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Home, LogIn, LogOut, MapPin, ShieldCheck } from "lucide-react";
import { getAuthHeaders } from "@/lib/auth-client";
import { fetchApiData, useCachedProfile } from "@/hooks/useDashboardQueries";

type AttendanceRecord = {
  id: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status?: string | null;
  checkInGeoStatus?: string | null;
  checkOutGeoStatus?: string | null;
  checkInDistance?: number | null;
  checkOutDistance?: number | null;
  workLocation?: { name?: string | null; address?: string | null } | null;
};
type ClockType = "clock-in" | "clock-out";

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });

function formatTime(value?: string | null) {
  if (!value) return "-";
  return timeFormatter.format(new Date(value));
}

function geoStatusBadge(status?: string | null) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "INSIDE_RADIUS" || normalized === "APPROVED_MANUAL") {
    return { label: "Di dalam radius", bg: "rgba(34,197,94,0.12)", color: "var(--success)" };
  }
  if (normalized === "PENDING_REVIEW") {
    return { label: "Menunggu review admin", bg: "rgba(245,158,11,0.16)", color: "var(--warning)" };
  }
  if (!normalized) {
    return { label: "Tervalidasi", bg: "rgba(34,197,94,0.12)", color: "var(--success)" };
  }
  return { label: normalized.replace(/_/g, " "), bg: "rgba(220,38,38,0.12)", color: "var(--danger)" };
}

function SuccessSelfieThumbnail({ attendanceId, kind }: { attendanceId: string; kind: "check-in" | "check-out" }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    async function load() {
      try {
        const response = await fetch(`/api/attendances/${attendanceId}/selfie/${kind}`, {
          headers: getAuthHeaders(),
          cache: "no-store",
        });
        if (!response.ok) throw new Error();
        const blob = await response.blob();
        if (!active) return;
        createdUrl = URL.createObjectURL(blob);
        setImageUrl(createdUrl);
      } catch {
        setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [attendanceId, kind]);

  if (loading) {
    return <div className="text-[10px] text-[var(--text-secondary)] font-semibold animate-pulse">Memuat…</div>;
  }
  if (error || !imageUrl) {
    return <div className="text-[10px] text-[var(--danger)] font-bold">Gagal</div>;
  }
  return <img src={sizedImageSrc(imageUrl, 720)} alt="Selfie" className="size-full object-cover" />;
}

export default function AttendanceSuccessPage() {
  return (
    <Suspense fallback={<div className="phone-screen attendance-screen p-4 text-sm text-[var(--text-secondary)]">Memuat konfirmasi…</div>}>
      <AttendanceSuccessContent />
    </Suspense>
  );
}

function AttendanceSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") === "clock-out" ? "clock-out" : "clock-in") as ClockType;
  const isClockIn = type === "clock-in";
  const pendingReview = searchParams.get("pending") === "1";
  const savedOffline = searchParams.get("offline") === "1";

  const { data: profileData, isLoading: profileLoading } = useCachedProfile();
  const { data: todayData, isLoading: todayLoading } = useQuery<AttendanceRecord | null>({
    queryKey: ["attendance", "today", "success"],
    queryFn: async () => {
      const data = await fetchApiData<AttendanceRecord | null | { attendance?: AttendanceRecord | null }>(
        "/api/attendance/today",
        "Ringkasan absensi gagal dimuat.",
      );
      return ((data as { attendance?: AttendanceRecord | null } | null)?.attendance ?? data) as AttendanceRecord | null;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const profile = profileData ?? null;
  const record = todayData ?? null;
  const loading = profileLoading || todayLoading;

  const employee = profile?.employee;
  const shift = employee?.defaultShift;
  const shiftLabel = shift ? `${shift.name} (${shift.startTime.slice(0, 5)} - ${shift.endTime.slice(0, 5)})` : "Shift belum tersedia";
  const locationName = record?.workLocation?.name || employee?.defaultLocation?.name || "Lokasi kerja";

  const title = isClockIn ? "Clock In Berhasil" : "Clock Out Berhasil";
  const stampedTime = isClockIn ? formatTime(record?.checkInTime) : formatTime(record?.checkOutTime);
  const geo = geoStatusBadge(isClockIn ? record?.checkInGeoStatus : record?.checkOutGeoStatus);

  const timeline: Array<{ id: string; icon: typeof LogIn; label: string; time: string; active: boolean; tone: string; status?: string | null }> = [
    {
      id: "in",
      icon: LogIn,
      label: "Clock In",
      time: formatTime(record?.checkInTime),
      active: Boolean(record?.checkInTime),
      tone: "var(--attn-success)",
      status: record?.status,
    },
    {
      id: "out",
      icon: LogOut,
      label: "Clock Out",
      time: formatTime(record?.checkOutTime),
      active: Boolean(record?.checkOutTime),
      tone: "var(--attn-red)",
    },
  ];

  return (
    <div className="phone-screen attendance-screen pb-8" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-secondary btn-icon min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" onClick={() => router.push("/dashboard")} aria-label="Kembali ke beranda">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)]">Absensi Tersimpan</h1>
          <p className="text-xs font-semibold text-[var(--text-secondary)]" suppressHydrationWarning>
            {fullDateFormatter.format(new Date())}
          </p>
        </div>
      </header>

      {/* Hero confirmation */}
      <section className="card flex flex-col items-center gap-3 border border-[var(--attn-warn-border-soft)] bg-gradient-to-br from-[var(--attn-warn-bg)] to-white p-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[rgba(46,125,50,0.12)]" aria-hidden="true">
          <CheckCircle2 size={48} className="text-[var(--attn-success)] transition-transform duration-500 ease-out motion-safe:scale-105" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-[var(--text-primary)]">{savedOffline ? `${isClockIn ? "Clock In" : "Clock Out"} Tersimpan Lokal` : title}</h2>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">
            {savedOffline
              ? "Tersimpan di perangkat Anda. Absensi otomatis terkirim ke server saat koneksi kembali — tidak perlu mengulang."
              : loading ? "Menyimpan absensi…" : `${isClockIn ? "Tercatat masuk" : "Tercatat pulang"} pukul ${stampedTime}`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: geo.bg, color: geo.color }}>
          <ShieldCheck size={13} />
          {pendingReview ? "Menunggu review admin (di luar radius)" : geo.label}
        </span>
      </section>

      {/* Stamp detail */}
      <section className="card p-4">
        <div className="flex gap-3 items-stretch">
          <div className="flex-1 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white">
              <span className="flex items-center gap-1 text-[var(--text-muted)] font-semibold"><Clock size={12} /> Waktu</span>
              <strong className="mt-1 block text-sm font-extrabold">{stampedTime}</strong>
            </div>
            <div className="rounded-2xl border border-[var(--border-color)] p-3 bg-white">
              <span className="flex items-center gap-1 text-[var(--text-muted)] font-semibold"><Clock size={12} /> Shift</span>
              <strong className="mt-1 block text-sm font-extrabold truncate">{shiftLabel}</strong>
            </div>
            <div className="col-span-2 rounded-2xl border border-[var(--border-color)] p-3 bg-white">
              <span className="flex items-center gap-1 text-[var(--text-muted)] font-semibold"><MapPin size={12} /> Lokasi kerja</span>
              <strong className="mt-1 block text-sm font-extrabold">{locationName}</strong>
            </div>
          </div>
          
          {/* Selfie thumbnail container */}
          {record?.id && (
            <div className="w-24 shrink-0 flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] p-1 bg-[var(--bg-secondary)] overflow-hidden">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] mb-1">Foto Selfie</span>
              <div className="w-full flex-1 rounded-xl overflow-hidden relative min-h-[72px] bg-white border border-[var(--border-color)] flex items-center justify-center">
                <SuccessSelfieThumbnail attendanceId={record.id} kind={isClockIn ? "check-in" : "check-out"} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Today log timeline */}
      <section className="card p-4" aria-labelledby="today-log-title">
        <h2 id="today-log-title" className="mb-4 text-base font-extrabold">Log Hari Ini</h2>
        <ol className="relative flex flex-col gap-5 pl-2">
          <span aria-hidden="true" className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-[var(--border-color)]" />
          {timeline.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="relative flex items-center gap-4">
                <span
                  className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 bg-white"
                  style={{ borderColor: item.active ? item.tone : "var(--border-color)", color: item.active ? item.tone : "var(--text-muted)" }}
                  aria-hidden="true"
                >
                  <Icon size={16} />
                </span>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <strong className="block text-sm text-[var(--text-primary)]">{item.label}</strong>
                    {item.active && item.id === "in" ? (
                      <span
                        className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold"
                        style={item.status === "LATE" ? { background: "rgba(245,124,0,0.14)", color: "var(--attn-warning)" } : { background: "rgba(46,125,50,0.14)", color: "var(--attn-success)" }}
                      >
                        {item.status === "LATE" ? "Terlambat" : "Tepat Waktu"}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">{item.active ? "Tercatat" : "Belum Absen"}</span>
                    )}
                  </div>
                  <span className={`text-sm font-extrabold ${item.active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{item.time}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className="btn btn-primary min-h-[52px] flex-1 rounded-2xl font-extrabold">
          <Home size={18} /> Kembali ke Beranda
        </Link>
        <Link href="/dashboard/attendance" className="btn btn-secondary min-h-[52px] flex-1 rounded-2xl font-extrabold">
          Lihat Detail Absen
        </Link>
      </div>
    </div>
  );
}
