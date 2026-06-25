import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";
import { numberFormatter } from "./constants";
import { PerformerList } from "./PerformerList";

export function KpiOverviewCard({ overview }: { overview: SuperadminInsights['kpiOverview'] }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="eyebrow">KPI Bulan Ini</p>
          <h3 className="text-base sm:text-lg">Performa Karyawan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Rata-rata skor dan status approval.</p>
        </div>
        <div className="text-right">
          <strong className="text-3xl text-[var(--success)]">{overview.averageScore}</strong>
          <p className="text-[11px] text-[var(--text-secondary)]">Avg score</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-[var(--success-bg)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Disetujui</p>
          <strong className="text-xl text-[var(--success)]">{numberFormatter.format(overview.approvedCount)}</strong>
        </div>
        <div className="rounded-xl bg-[var(--warning-bg)] p-3">
          <p className="text-xs text-[var(--text-secondary)]">Menunggu</p>
          <strong className="text-xl text-[var(--warning)]">{numberFormatter.format(overview.pendingCount)}</strong>
        </div>
      </div>
      <PerformerList title="Top Performer" rows={overview.topPerformers} empty="Belum ada skor KPI." />
      <div className="mt-4">
        <PerformerList title="Perlu Dibantu" rows={overview.lowPerformers} empty="Belum ada data risiko KPI." />
      </div>
    </div>
  );
}
