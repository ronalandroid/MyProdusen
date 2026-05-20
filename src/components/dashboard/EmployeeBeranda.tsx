"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CheckCircle2, FileWarning, MapPin, ArrowRight, Clock, Calendar, Stethoscope, Banknote, TimerReset } from "lucide-react";
import { getAuthHeaders, type ClientUserProfile } from "@/lib/auth-client";

const WorkLocationMap = dynamic(
  () => import("@/components/locations/WorkLocationMap").then((mod) => mod.WorkLocationMap),
  { ssr: false, loading: () => <div className="h-32 rounded-2xl bg-[var(--bg-input)] animate-pulse" /> },
);

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

const statusLabel: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Hadir",
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

interface Props {
  profile: ClientUserProfile | null;
}

export default function EmployeeBeranda({ profile }: Props) {
  const [heatmap, setHeatmap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [workLocation, setWorkLocation] = useState<WorkLocationDetail | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEverything() {
      try {
        const [heatmapRes, attendanceRes] = await Promise.all([
          fetch("/api/dashboard/heatmap", { headers: getAuthHeaders(), cache: "no-store" }),
          fetch("/api/attendance", { headers: getAuthHeaders(), cache: "no-store" }),
        ]);

        const heatmapPayload = (await heatmapRes.json()) as HeatmapResponse;
        const attendancePayload = (await attendanceRes.json()) as AttendanceResponse;

        if (cancelled) return;

        if (heatmapRes.ok && heatmapPayload.success && heatmapPayload.data?.heatmap) {
          setHeatmap(heatmapPayload.data.heatmap);
        }

        if (attendanceRes.ok && attendancePayload.success && attendancePayload.data) {
          setHistory(attendancePayload.data.slice(0, 5));
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
      }
    }

    loadEverything();
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

  const sevenDaySeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = isoDate(date);
      const status = heatmap[key];
      const present = status === "PRESENT" || status === "LATE";
      return {
        key,
        label: new Intl.DateTimeFormat("id-ID", { weekday: "narrow" }).format(date),
        dayLabel: String(date.getDate()),
        present,
        status: status || null,
      };
    });
  }, [heatmap]);

  const greetingName = (profile?.employee?.fullName || profile?.username || "Karyawan").split(" ")[0];
  const initials = (profile?.employee?.fullName || profile?.username || "U").charAt(0).toUpperCase();
  const roleLabel = profile?.role === "SUPERADMIN" ? "Super Admin" : "Karyawan";

  return (
    <div className="flex flex-col gap-5">
      {/* Yellow greeting card */}
      <section
        className="card animate-slide-up"
        aria-labelledby="employee-greeting-title"
        style={{
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
          color: "var(--text-primary)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          border: "none",
        }}
      >
        <div
          className="avatar"
          aria-hidden="true"
          style={{ width: 56, height: 56, fontSize: 22, background: "rgba(255,255,255,0.35)", color: "var(--text-primary)" }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(17,17,17,0.7)" }}>
            {roleLabel}
          </p>
          <h2 id="employee-greeting-title" className="text-lg sm:text-xl font-bold leading-tight truncate">
            Halo, {greetingName}
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: "rgba(17,17,17,0.85)" }}>
            Selamat bekerja hari ini.
          </p>
        </div>
      </section>

      {loadError && (
        <div role="status" className="card text-xs text-[var(--text-secondary)]">
          {loadError}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Aksi karyawan">
        <Link href="/dashboard/payroll" className="card flex min-h-[88px] items-center justify-between gap-3 p-4">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[var(--text-primary)]">Gaji Saya</span>
            <span className="block text-xs text-[var(--text-secondary)]">Payroll, payslip, dan notifikasi gaji pribadi.</span>
          </span>
          <Banknote size={22} className="text-[var(--primary-dark)] flex-shrink-0" aria-hidden="true" />
        </Link>
        <Link href="/dashboard/overtime" className="card flex min-h-[88px] items-center justify-between gap-3 p-4">
          <span className="min-w-0">
            <span className="block text-sm font-bold text-[var(--text-primary)]">Lembur</span>
            <span className="block text-xs text-[var(--text-secondary)]">Pengajuan Lembur dan rate overtime aktif.</span>
          </span>
          <TimerReset size={22} className="text-[var(--primary-dark)] flex-shrink-0" aria-hidden="true" />
        </Link>
      </section>

      {/* Metric cards: Hadir / Izin / Cuti / Sakit */}
      <section aria-labelledby="employee-metrics-title">
        <div className="section-heading">
          <h2 id="employee-metrics-title">Bulan Ini</h2>
        </div>
        <div className="employee-metrics-grid">
          <MetricCard tone="success" icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Hadir" value={monthCounts.hadir} />
          <MetricCard tone="info" icon={<FileWarning size={18} aria-hidden="true" />} label="Izin" value={monthCounts.izin} />
          <MetricCard tone="primary" icon={<Calendar size={18} aria-hidden="true" />} label="Cuti" value={monthCounts.cuti} />
          <MetricCard tone="danger" icon={<Stethoscope size={18} aria-hidden="true" />} label="Sakit" value={monthCounts.sakit} />
        </div>
      </section>

      {/* 7-day attendance bar chart */}
      <section className="card" aria-labelledby="employee-bar-title">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="eyebrow">7 Hari Terakhir</p>
            <h3 id="employee-bar-title" className="text-base sm:text-lg">Kehadiran Saya</h3>
          </div>
          <Clock size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
        </div>
        <div className="flex items-end gap-2 h-28" role="img" aria-label="Diagram batang kehadiran 7 hari terakhir">
          {sevenDaySeries.map((day) => (
            <div key={day.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="employee-bar">
                <span
                  className="employee-bar-fill"
                  style={{
                    height: day.present ? "100%" : "12%",
                    background: day.present ? "var(--primary)" : "var(--bg-input)",
                    border: day.present ? "none" : "1px solid var(--border-color)",
                  }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase">{day.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{day.dayLabel}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Lokasi Kerja card */}
      <section className="card" aria-labelledby="employee-location-title">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="eyebrow">Lokasi Kerja</p>
            <h3 id="employee-location-title" className="text-base sm:text-lg truncate">
              {workLocation?.name || profile?.employee?.defaultLocation?.name || "Lokasi belum ditetapkan"}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {workLocation?.address || profile?.employee?.defaultLocation?.address || "Hubungi HR untuk pengaturan lokasi kerja."}
            </p>
            {workLocation?.radius ? (
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Radius geo-fence {workLocation.radius} meter.</p>
            ) : null}
          </div>
          <MapPin size={22} className="text-[var(--primary-dark)] flex-shrink-0" aria-hidden="true" />
        </div>
        {workLocation?.latitude && workLocation?.longitude ? (
          <WorkLocationMap
            latitude={Number(workLocation.latitude)}
            longitude={Number(workLocation.longitude)}
            radiusMeters={Number(workLocation.radius) || 100}
            label={workLocation.name}
            height={140}
          />
        ) : null}
        <Link href="/dashboard/attendance" className="text-link text-sm mt-3 inline-flex items-center gap-1">
          Buka Kehadiran <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>

      {/* Riwayat Kehadiran (last 5) */}
      <section aria-labelledby="employee-history-title">
        <div className="section-heading flex items-center justify-between">
          <h2 id="employee-history-title">Riwayat Kehadiran</h2>
          <Link href="/dashboard/attendance" className="text-link text-sm">Lihat semua</Link>
        </div>
        <div className="card p-0 overflow-hidden">
          {history.length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-secondary)]" role="status">
              Belum ada riwayat kehadiran.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border-color)" }}>
              {history.map((record) => {
                const status = (record.status || "PRESENT").toUpperCase();
                const tone = statusTone[status] || statusTone.PRESENT;
                return (
                  <li key={record.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {formatShortDate(record.checkInTime)}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Masuk {formatTime(record.checkInTime)} · Pulang {formatTime(record.checkOutTime)}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-semibold rounded-full px-2 py-1 whitespace-nowrap"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      {statusLabel[status] || status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

interface MetricCardProps {
  tone: "success" | "info" | "primary" | "danger";
  icon: React.ReactNode;
  label: string;
  value: number;
}

function MetricCard({ tone, icon, label, value }: MetricCardProps) {
  const palette: Record<MetricCardProps["tone"], { bg: string; color: string; chip: string }> = {
    success: { bg: "var(--success-bg)", color: "var(--success)", chip: "rgba(34,197,94,0.18)" },
    info: { bg: "var(--info-bg)", color: "var(--info)", chip: "rgba(59,130,246,0.18)" },
    primary: { bg: "var(--primary-light)", color: "var(--primary-dark)", chip: "rgba(255,193,7,0.25)" },
    danger: { bg: "var(--danger-bg)", color: "var(--danger)", chip: "rgba(229,57,53,0.18)" },
  };
  const colors = palette[tone];
  return (
    <article className="card flex items-center gap-3 p-3 sm:p-4">
      <span
        className="flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{ width: 40, height: 40, background: colors.bg, color: colors.color }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-secondary)] font-semibold truncate">{label}</p>
        <strong className="block text-xl sm:text-2xl text-[var(--text-primary)]">{value}</strong>
      </div>
    </article>
  );
}
