import { Users } from "lucide-react";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { EmptyMiniState } from "./EmptyMiniState";

export function DivisionMonitoringChart({ divisions }: { divisions: SuperadminInsights['divisionMonitoring'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">Divisi</p>
          <h3 className="text-base sm:text-lg">Monitoring Karyawan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Kehadiran hari ini per divisi.</p>
        </div>
        <Users size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
      </div>
      <div className="space-y-4">
        {divisions.length ? divisions.map((division) => (
          <div key={division.division}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{division.division}</span>
              <span className="text-xs text-[var(--text-secondary)]">{division.employeeCount} orang · {division.attendanceRate}% hadir</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
              <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, division.attendanceRate)}%` }} />
            </div>
          </div>
        )) : <EmptyMiniState title="Belum ada divisi" description="Data divisi muncul setelah karyawan aktif memiliki divisi." />}
      </div>
    </div>
  );
}
