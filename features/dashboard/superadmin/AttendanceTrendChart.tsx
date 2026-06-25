import { BarChart3 } from "lucide-react";
import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { Legend } from "./Legend";

export function AttendanceTrendChart({ trend }: { trend: SuperadminInsights['attendanceTrend'] }) {
  const maxValue = Math.max(1, ...trend.map((day) => day.present + day.late + day.absent));
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">7 Hari Terakhir</p>
          <h3 className="text-base sm:text-lg">Tren Kehadiran</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Hadir, terlambat, dan absen per hari.</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
          <BarChart3 size={22} className="text-[var(--primary-dark)]" aria-hidden="true" />
        </div>
      </div>
      <div className="flex items-end gap-3 h-52" role="img" aria-label="Diagram batang tren kehadiran 7 hari terakhir">
        {trend.map((day) => {
          const presentHeight = Math.max(6, (day.present / maxValue) * 100);
          const lateHeight = Math.max(day.late ? 6 : 0, (day.late / maxValue) * 100);
          const absentHeight = Math.max(day.absent ? 6 : 0, (day.absent / maxValue) * 100);
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-2 min-w-0">
              <div className="w-full max-w-10 h-40 flex flex-col justify-end rounded-xl bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
                <span style={{ height: `${absentHeight}%`, background: 'var(--danger)' }} />
                <span style={{ height: `${lateHeight}%`, background: 'var(--warning)' }} />
                <span style={{ height: `${presentHeight}%`, background: 'var(--success)' }} />
              </div>
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">{day.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
        <Legend color="var(--success)" label="Hadir" />
        <Legend color="var(--warning)" label="Telat" />
        <Legend color="var(--danger)" label="Absen" />
      </div>
    </div>
  );
}
