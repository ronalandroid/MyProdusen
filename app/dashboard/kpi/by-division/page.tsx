"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, RefreshCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { useRealtime } from "@/hooks/useRealtime";

type DivisionMetricRow = {
  divisionId: string | null;
  divisionName: string;
  metricType: string;
  unit: string;
  totalQuantity: number;
  employeeCount: number;
  entryCount: number;
};
type ByDivisionResponse = { period: string; rows: DivisionMetricRow[] };

const currentPeriod = new Date().toISOString().slice(0, 7);
const EMPTY_ROWS: DivisionMetricRow[] = [];

export default function KpiByDivisionPage() {
  const router = useRouter();
  const [period, setPeriod] = useState(currentPeriod);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["kpi-by-division", period],
    queryFn: () =>
      fetchApiData<ByDivisionResponse>(
        `/api/reports/kpi/by-division?period=${period}`,
        "Gagal mengambil KPI per divisi",
      ),
  });

  // Realtime: KPI production entries emit `dashboard.updated`, so this roll-up
  // refreshes live as leaders input production.
  useRealtime({ eventTypes: ["dashboard.updated"], onEvent: () => refetch() });

  const rows = data?.rows ?? EMPTY_ROWS;
  const byDivision = useMemo(() => {
    const map = new Map<string, DivisionMetricRow[]>();
    for (const row of rows) {
      const list = map.get(row.divisionName) ?? [];
      list.push(row);
      map.set(row.divisionName, list);
    }
    return [...map.entries()];
  }, [rows]);

  return (
    <main className="p-4 space-y-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Building2 size={20} aria-hidden="true" /> KPI per Divisi
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Total produksi & jumlah karyawan per divisi</p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Periode</span>
          <input
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value || currentPeriod)}
            className="rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-2 text-sm font-medium focus:outline-none focus:border-[var(--primary)]"
          />
        </label>
        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Muat ulang"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <RefreshCcw size={18} aria-hidden="true" />
        </button>
      </header>

      {isLoading ? (
        <LoadingSpinner size="lg" message="Memuat KPI per divisi..." />
      ) : isError ? (
        <p role="alert" className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Gagal memuat KPI per divisi. Coba muat ulang.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border-color)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">
          Belum ada data KPI produksi untuk periode ini.
        </p>
      ) : (
        byDivision.map(([division, metrics]) => (
          <section key={division} className="rounded-2xl border border-[var(--border-color)] bg-white p-4">
            <h2 className="mb-3 font-bold text-[var(--text-primary)]">{division}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="pb-2 font-semibold">Metrik</th>
                    <th className="pb-2 text-right font-semibold">Total</th>
                    <th className="pb-2 text-right font-semibold">Karyawan</th>
                    <th className="pb-2 text-right font-semibold">Entri</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.metricType} className="border-t border-[var(--border-color)]">
                      <td className="py-2 text-[var(--text-primary)]">{metric.metricType}</td>
                      <td className="py-2 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {metric.totalQuantity.toLocaleString("id-ID")} {metric.unit}
                      </td>
                      <td className="py-2 text-right">{metric.employeeCount}</td>
                      <td className="py-2 text-right">{metric.entryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      {isFetching && !isLoading ? (
        <p className="text-center text-xs text-[var(--text-muted)]">Menyinkronkan…</p>
      ) : null}
    </main>
  );
}
