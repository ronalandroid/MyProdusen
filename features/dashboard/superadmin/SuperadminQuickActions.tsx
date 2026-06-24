import Link from "next/link";
import { Users, Clock, Calendar, CheckCircle, AlertTriangle } from "lucide-react";
import type { DashboardStats } from "@/lib/dashboard/dashboard-types";
import { numberFormatter, SUPERADMIN_QUICK_ACTIONS } from "./constants";

export function SuperadminQuickActions({ stats }: { stats: DashboardStats }) {
  return (
    <>
      {/* Executive Summary Card */}
      <section aria-labelledby="executive-summary-title" className="mb-5">
        <div className="section-heading mb-3">
          <p className="eyebrow">Ringkasan Sistem</p>
          <h2 id="executive-summary-title">Executive Summary</h2>
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Users size={14} className="text-[var(--info)]" />
              <span>Total Karyawan</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.activeEmployees)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">aktif</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Clock size={14} className="text-[var(--success)]" />
              <span>Hadir Hari Ini</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.todayAttendance.present)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">orang ({stats.todayAttendance.percentage}%)</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <Calendar size={14} className="text-[var(--warning)]" />
              <span>Persetujuan Cuti</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.pendingLeave)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">pending</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <CheckCircle size={14} className="text-[var(--danger)]" />
              <span>Pending KPI</span>
            </span>
            <div className="mt-1">
              <strong className="text-xl font-extrabold text-[var(--text-primary)]">
                {numberFormatter.format(stats.pendingKpiApprovals)}
              </strong>
              <span className="text-xs font-medium text-[var(--text-secondary)] ml-1">approval</span>
            </div>
          </div>

          <div className="card p-4 flex flex-col justify-between gap-1 shadow-sm min-h-[96px] col-span-2 md:col-span-1">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Status Gaji</span>
            </span>
            <div className="mt-1">
              <strong className="text-sm font-extrabold text-[var(--text-primary)] line-clamp-1">
                {stats.payrollPeriodStatus?.period || "Siap audit"}
              </strong>
              <span className="text-[10px] text-[var(--text-secondary)] block">
                {stats.payrollPeriodStatus?.status || "Belum diproses"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section aria-labelledby="superadmin-quick-actions-title" className="mb-5">
        <div className="section-heading mb-3">
          <p className="eyebrow">Aksi Cepat</p>
          <h2 id="superadmin-quick-actions-title">Menu Utama Admin</h2>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {SUPERADMIN_QUICK_ACTIONS.map((action) => {
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
    </>
  );
}
