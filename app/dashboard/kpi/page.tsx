"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, TrendingUp, Users } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData } from "@/hooks/useDashboardQueries";

type KpiResultRow = {
  result: {
    id: string;
    period: string;
    actualValue: number;
    score: number;
    isApproved: boolean;
    notes?: string | null;
  };
  employee?: { id: string; fullName: string; nip?: string | null } | null;
  item?: { id: string; name: string; targetValue?: number | null; unit?: string | null } | null;
};

type EmployeeRow = { id: string; fullName: string; nip?: string | null };
type ProductionEntry = { id: string; date: string; quantity: string; unit: string; source: string; teamName: string };

type EmployeeSummary = {
  employeeId: string;
  period: string;
  totalScore: number;
  weightedScore: number;
  itemCount: number;
  approvedCount: number;
  items: KpiResultRow[];
};

const currentPeriod = new Date().toISOString().slice(0, 7);
const EMPTY_KPI_RESULTS: KpiResultRow[] = [];
const EMPTY_EMPLOYEES: EmployeeRow[] = [];
const EMPTY_PRODUCTION_ENTRIES: ProductionEntry[] = [];

function progressPercentage(score: number) {
  return Math.max(0, Math.min(Math.round(score || 0), 100));
}

function statusColor(score: number) {
  if (score >= 90) return "var(--success)";
  if (score >= 70) return "var(--primary)";
  return "var(--danger)";
}

export default function KPIPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
  } = useQuery({
    queryKey: ["kpi-overview", currentPeriod],
    queryFn: async () => {
      const [statsPayload, resultsPayload] = await Promise.all([
        fetchApiData<{ role?: string }>("/api/dashboard/stats", "Gagal mengambil role pengguna"),
        fetchApiData<KpiResultRow[]>(`/api/kpi/results?period=${currentPeriod}`, "Gagal mengambil KPI"),
      ]);

      const nextRole = statsPayload?.role || "EMPLOYEE";
      const results = Array.isArray(resultsPayload) ? resultsPayload : [];

      let productionEntries: ProductionEntry[] = [];
      try {
        const production = await fetchApiData<ProductionEntry[]>("/api/kpi/production/me", "Gagal mengambil produksi", { cache: "no-store" });
        productionEntries = Array.isArray(production) ? production : [];
      } catch {
        productionEntries = [];
      }

      let employees: EmployeeRow[] = [];
      if (nextRole === "SUPERADMIN") {
        try {
          const employeeData = await fetchApiData<EmployeeRow[]>("/api/employees?limit=100", "Gagal mengambil karyawan");
          employees = Array.isArray(employeeData) ? employeeData : [];
        } catch {
          employees = [];
        }
      }

      return { role: nextRole, results, productionEntries, employees };
    },
  });

  const role = initialData?.role || "EMPLOYEE";
  const results = initialData?.results ?? EMPTY_KPI_RESULTS;
  const employees = initialData?.employees ?? EMPTY_EMPLOYEES;
  const productionEntries = initialData?.productionEntries ?? EMPTY_PRODUCTION_ENTRIES;
  const loading = initialLoading;

  const canViewTeam = role === "SUPERADMIN";

  const loadInitialData = () => queryClient.invalidateQueries({ queryKey: ["kpi-overview"] });

  const {
    data: summaryData,
    isLoading: summaryQueryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: ["kpi-employee-summary", selectedEmployeeId, currentPeriod],
    enabled: Boolean(selectedEmployeeId),
    queryFn: () => fetchApiData<EmployeeSummary>(`/api/kpi/employee/${selectedEmployeeId}?period=${currentPeriod}`, "Gagal mengambil ringkasan KPI employee"),
  });

  const employeeSummary = selectedEmployeeId ? summaryData ?? null : null;
  const summaryLoading = Boolean(selectedEmployeeId) && summaryQueryLoading;

  const error =
    (initialError instanceof Error ? initialError.message : "") ||
    (summaryError instanceof Error ? summaryError.message : "");

  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    return Math.round(results.reduce((sum, row) => sum + Number(row.result?.score || 0), 0) / results.length);
  }, [results]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat modul KPI..." />
      </div>
    );
  }

  return (
    <div className="phone-screen feature-screen flex min-h-full flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" className="flex min-w-0 items-center gap-3 text-left" onClick={() => router.back()} aria-label="Kembali">
          <ArrowLeft size={24} aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold">{canViewTeam ? "KPI Tim" : "KPI Saya"}</h1>
            <p className="text-xs text-[var(--text-secondary)]">Periode {currentPeriod}</p>
          </div>
        </button>
        {canViewTeam && (
          <button type="button" className="btn btn-primary" onClick={() => router.push("/dashboard/kpi/template")}>
            Template KPI
          </button>
        )}
      </div>

      {error && (
        <div className="card border border-red-200 bg-red-50 p-4 text-sm text-[var(--danger)]" role="alert">
          {error}
          <button type="button" className="btn btn-secondary btn-sm ml-3" onClick={loadInitialData}>Coba lagi</button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><Target size={18} /> KPI Tercatat</div>
          <div className="text-2xl font-extrabold">{results.length}</div>
        </div>
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><TrendingUp size={18} /> Rata-rata</div>
          <div className="text-2xl font-extrabold">{averageScore}%</div>
        </div>
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><Users size={18} /> Role</div>
          <div className="truncate text-base font-extrabold leading-tight" title={role}>{role}</div>
        </div>
      </section>

      {!canViewTeam && (
        <section className="card p-4 sm:p-5">
          <h2 className="text-base font-bold">KPI Produksi Harian</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Sumber: Diinput oleh Leader</p>
          {productionEntries.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-[var(--bg-input)] p-4 text-sm font-semibold text-[var(--text-secondary)]">Belum ada input KPI hari ini.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {productionEntries.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-3">
                  <div><p className="font-bold">{entry.date}</p><p className="text-xs text-[var(--text-secondary)]">{entry.teamName} • {entry.source}</p></div>
                  <div className="text-right font-extrabold">{Number(entry.quantity).toLocaleString("id-ID")} {entry.unit}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {canViewTeam && (
        <section className="card p-4 sm:p-5">
          <label className="label" htmlFor="employee-kpi-select">Lihat KPI employee/tim</label>
          <select id="employee-kpi-select" className="input" value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)}>
            <option value="">Pilih employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.fullName}{employee.nip ? ` — ${employee.nip}` : ""}</option>
            ))}
          </select>
          {summaryLoading && <p className="mt-3 text-sm text-[var(--text-secondary)]">Memuat ringkasan employee...</p>}
          {employeeSummary && (
            <div className="mt-4 rounded-2xl bg-[var(--bg-input)] p-4">
              <div className="font-bold">Ringkasan employee terpilih</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">
                Total score {Math.round(employeeSummary.totalScore)}% · Weighted {Math.round(employeeSummary.weightedScore)}% · {employeeSummary.approvedCount}/{employeeSummary.itemCount} approved
              </div>
            </div>
          )}
        </section>
      )}

      {canViewTeam && (
        <section className="card p-4 sm:p-5" aria-label="Submit KPI result">
          <h2 className="text-base font-bold">Input / Submit Hasil KPI</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Hasil KPI approved tidak bisa diedit dari kartu ringkasan. Gunakan workflow template dan assignment untuk membuat hasil KPI baru, submit aktual, lalu approve dengan audit log.
          </p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => router.push('/dashboard/kpi/template')}>
            Submit KPI Result
          </button>
        </section>
      )}

      <section className="space-y-3">
        {!results.length ? (
          <div className="card p-8 text-center text-sm text-[var(--text-secondary)]" role="status">
            Belum ada hasil KPI untuk periode ini. Hubungi Superadmin jika KPI belum di-assign.
          </div>
        ) : (
          results.map((row) => {
            const score = progressPercentage(Number(row.result.score || 0));
            return (
              <div key={row.result.id} className="card p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{row.item?.name || "Item KPI"}</h3>
                    <p className="text-xs text-[var(--text-secondary)]">{row.employee?.fullName || "Employee"} · Target {row.item?.targetValue ?? "-"} {row.item?.unit || ""}</p>
                  </div>
                  <span className={`badge ${row.result.isApproved ? "badge-success" : "badge-warning"}`}>{row.result.isApproved ? "Approved" : "Pending"}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Aktual: {row.result.actualValue} {row.item?.unit || ""}</span>
                  <span className="font-bold" style={{ color: statusColor(score) }}>{score}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-input)]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: statusColor(score) }} />
                </div>
                {row.result.notes && <p className="mt-3 text-xs text-[var(--text-muted)]">Catatan: {row.result.notes}</p>}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
