"use client";

import Link from "next/link";
import { Calendar, Banknote, Stethoscope, ChevronRight } from "lucide-react";
import type { LeaveBalance } from "./types";

interface PersonalSummaryCardsProps {
  leaveBalance: LeaveBalance | null;
  monthCountsHadir: number;
  monthCountsCuti: number;
  monthCountsSakit: number;
}

export function PersonalSummaryCards({ leaveBalance, monthCountsHadir, monthCountsCuti, monthCountsSakit }: PersonalSummaryCardsProps) {
  return (
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
              {monthCountsHadir}
            </strong>
            <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">hadir</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-medium mt-1">
            Bulan ini: {monthCountsCuti} cuti · {monthCountsSakit} sakit
          </span>
        </article>
      </div>
    </section>
  );
}
