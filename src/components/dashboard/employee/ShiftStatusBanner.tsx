"use client";

import { MapPin, Clock, Check } from "lucide-react";
import { formatDistance } from "./helpers";
import { AttendanceCTA } from "./AttendanceCTA";
import type { AttendanceRecord, WorkLocationDetail } from "./types";

interface ShiftStatusBannerProps {
  workLocation: WorkLocationDetail | null;
  todayLabel: string;
  shiftTimeText: string;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  isGettingGps: boolean;
  gpsError: string;
  gpsPosition: GeolocationPosition | null;
  gpsDistanceMeters: number | null;
  isInsideRadius: boolean | null;
  todayRecord: AttendanceRecord | undefined;
}

export function ShiftStatusBanner({
  workLocation,
  todayLabel,
  shiftTimeText,
  hasCheckedIn,
  hasCheckedOut,
  isGettingGps,
  gpsError,
  gpsPosition,
  gpsDistanceMeters,
  isInsideRadius,
  todayRecord,
}: ShiftStatusBannerProps) {
  return (
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

        <AttendanceCTA todayRecord={todayRecord} hasCheckedIn={hasCheckedIn} hasCheckedOut={hasCheckedOut} />
      </div>
    </section>
  );
}
