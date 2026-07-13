"use client";

import Link from "next/link";
import { Camera, Clock } from "lucide-react";
import { formatTime } from "./helpers";
import type { AttendanceRecord } from "./types";

interface AttendanceCTAProps {
  todayRecord: AttendanceRecord | undefined;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
}

export function AttendanceCTA({ todayRecord, hasCheckedIn, hasCheckedOut }: AttendanceCTAProps) {
  return (
    <section className="rounded-3xl border border-yellow-200 bg-white p-4 shadow-sm" aria-label="Absensi Hari Ini">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Absensi Hari Ini</h3>
          <p className="text-xs font-medium text-[var(--text-secondary)]">Dua langkah singkat: cek lokasi, lalu selfie — selesai.</p>
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
  );
}
