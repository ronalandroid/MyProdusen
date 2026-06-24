import type { SuperadminInsights } from "@/lib/dashboard/dashboard-types";

export function PerformerList({ title, rows, empty }: { title: string; rows: SuperadminInsights['kpiOverview']['topPerformers']; empty: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">{title}</p>
      <div className="space-y-2">
        {rows.length ? rows.map((row) => (
          <div key={`${title}-${row.employeeId}`} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
            <span className="min-w-0">
              <strong className="block truncate text-sm text-[var(--text-primary)]">{row.name}</strong>
              <small className="text-xs text-[var(--text-secondary)]">{row.division || 'Belum Diisi'}</small>
            </span>
            <strong className="text-sm text-[var(--text-primary)]">{row.score}</strong>
          </div>
        )) : <p className="text-xs text-[var(--text-secondary)]">{empty}</p>}
      </div>
    </div>
  );
}
