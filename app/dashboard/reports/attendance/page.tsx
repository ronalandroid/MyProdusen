"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchApiData } from "@/hooks/useDashboardQueries";
import { getAuthHeaders } from "@/lib/auth-client";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "SICK" | "PERMISSION";
type GeoStatus = "INSIDE" | "OUTSIDE" | "UNKNOWN" | "GEOFENCE_EXCEPTION";

interface ReportRow {
  id: string;
  attendanceDate: string;
  employeeName: string;
  nip: string;
  division: string | null;
  position: string | null;
  workLocationName: string | null;
  shiftName: string | null;
  checkInTime: string;
  checkOutTime: string | null;
  totalWorkMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  geoStatus: GeoStatus;
  hasCheckInSelfie: boolean;
  hasCheckOutSelfie: boolean;
}

interface ReportPage {
  rows: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  scope: "self" | "team" | "all";
}

interface ReportSummary {
  totalRecords: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeaveSickPermission: number;
  totalMissingCheckout: number;
  totalOutsideGeofence: number;
  averageLateMinutes: number;
  totalWorkHours: number;
}

interface WorkLocationOption {
  id: string;
  name: string;
}

const STATUS_BADGE: Record<AttendanceStatus, { label: string; bg: string; color: string }> = {
  PRESENT: { label: "Hadir", bg: "rgba(34,197,94,0.12)", color: "var(--success)" },
  LATE: { label: "Terlambat", bg: "rgba(245,158,11,0.16)", color: "var(--warning)" },
  ABSENT: { label: "Tidak Hadir", bg: "rgba(220,38,38,0.12)", color: "var(--danger)" },
  LEAVE: { label: "Cuti", bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
  SICK: { label: "Sakit", bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
  PERMISSION: { label: "Izin", bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
};

const GEO_BADGE: Record<GeoStatus, { label: string; bg: string; color: string }> = {
  INSIDE: { label: "Dalam radius", bg: "rgba(34,197,94,0.12)", color: "var(--success)" },
  OUTSIDE: { label: "Luar radius", bg: "rgba(220,38,38,0.12)", color: "var(--danger)" },
  GEOFENCE_EXCEPTION: { label: "Pengecualian", bg: "rgba(245,158,11,0.16)", color: "var(--warning)" },
  UNKNOWN: { label: "Tidak ada GPS", bg: "rgba(120,120,120,0.16)", color: "var(--text-secondary)" },
};

function todayIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .split("T")[0];
}

function startOfMonthIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .split("T")[0];
}

function formatTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDateShort(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 menit";
  if (value < 60) return `${value} menit`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours} jam ${minutes} menit` : `${hours} jam`;
}

function buildQueryString(filters: Record<string, string | undefined | boolean>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "boolean") {
      if (value) params.set(key, "true");
      return;
    }
    if (value === "") return;
    params.set(key, value);
  });
  return params.toString();
}

export default function AttendanceReportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState<string>(startOfMonthIso());
  const [to, setTo] = useState<string>(todayIso());
  const [employeeId, setEmployeeId] = useState("");
  const [division, setDivision] = useState("");
  const [workLocationId, setWorkLocationId] = useState("");
  const [status, setStatus] = useState<string>("");
  const [geoStatus, setGeoStatus] = useState<string>("");
  const [lateOnly, setLateOnly] = useState(false);
  const [missingCheckoutOnly, setMissingCheckoutOnly] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryFilters = useMemo(
    () => ({
      from,
      to,
      employeeId: employeeId.trim(),
      division: division.trim(),
      workLocationId: workLocationId.trim(),
      status,
      geoStatus,
      lateOnly,
      missingCheckoutOnly,
    }),
    [from, to, employeeId, division, workLocationId, status, geoStatus, lateOnly, missingCheckoutOnly],
  );

  const workLocationsQuery = useQuery({
    queryKey: ["reports", "work-locations"],
    queryFn: () => fetchApiData<Array<{ id: string; name: string }>>("/api/work-locations?isActive=true", "Gagal mengambil lokasi kerja"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const workLocations: WorkLocationOption[] = (workLocationsQuery.data ?? []).map((loc) => ({
    id: loc.id,
    name: loc.name,
  }));

  const baseQuery = buildQueryString(queryFilters);

  const reportQuery = useQuery({
    queryKey: ["reports", "attendance-list", baseQuery, page, pageSize],
    queryFn: () =>
      fetchApiData<ReportPage>(
        `/api/reports/attendance?${baseQuery}&page=${page}&pageSize=${pageSize}`,
        "Gagal mengambil laporan absensi",
      ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const report = reportQuery.data ?? null;

  const summaryQuery = useQuery({
    queryKey: ["reports", "attendance-report-summary", baseQuery],
    queryFn: () =>
      fetchApiData<{ summary?: ReportSummary }>(
        `/api/reports/attendance/summary?${baseQuery}`,
        "Gagal mengambil ringkasan laporan",
      ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
  const summary = summaryQuery.data?.summary ?? null;

  const isLoading = reportQuery.isLoading || summaryQuery.isLoading;
  const error = actionError || reportQuery.error?.message || summaryQuery.error?.message || null;

  const reloadReport = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["reports", "attendance-list"] });
    void queryClient.invalidateQueries({ queryKey: ["reports", "attendance-report-summary"] });
  }, [queryClient]);

  const totalPages = report ? Math.max(1, Math.ceil(report.total / report.pageSize)) : 1;

  async function handleExport() {
    if (!from || !to) {
      setActionError("Tanggal awal dan akhir wajib diisi sebelum export.");
      return;
    }
    setIsExporting(true);
    setActionError(null);
    setExportMessage(null);
    try {
      const url = `/api/reports/attendance?${buildQueryString({ ...queryFilters, format: "csv" })}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) {
        let message = "Gagal export laporan";
        try {
          const data = await response.json();
          if (data?.error) message = data.error;
        } catch {
          /* not JSON */
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const filenameMatch = response.headers.get("content-disposition")?.match(/filename="?([^";]+)"?/);
      const filename = filenameMatch?.[1] || `attendance-report-${from}-to-${to}.csv`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setExportMessage(`CSV laporan kehadiran berhasil dibuat: ${filename}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal export laporan");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPdf() {
    if (!from || !to) {
      setActionError("Tanggal awal dan akhir wajib diisi sebelum export PDF.");
      return;
    }
    setIsExportingPdf(true);
    setActionError(null);
    setExportMessage(null);
    try {
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ reportType: "attendance_summary", from, to, division: division.trim() || undefined }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Gagal export PDF laporan kehadiran");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `attendance-report-${from}-to-${to}.pdf`;
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setExportMessage(`PDF laporan kehadiran berhasil dibuat: ${filename}. Gunakan file ini sebagai print preview atau cetak PDF.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Gagal export PDF laporan kehadiran");
    } finally {
      setIsExportingPdf(false);
    }
  }

  function resetFilters() {
    setFrom(startOfMonthIso());
    setTo(todayIso());
    setEmployeeId("");
    setDivision("");
    setWorkLocationId("");
    setStatus("");
    setGeoStatus("");
    setLateOnly(false);
    setMissingCheckoutOnly(false);
    setPage(1);
  }

  function applyPreset(preset: "today" | "week" | "month") {
    const now = new Date();
    const today = todayIso();
    if (preset === "today") {
      setFrom(today);
      setTo(today);
    } else if (preset === "week") {
      const day = now.getUTCDay() || 7; // Mon=1..Sun=7
      const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (day - 1)));
      setFrom(monday.toISOString().split("T")[0]);
      setTo(today);
    } else {
      setFrom(startOfMonthIso());
      setTo(today);
    }
    setPage(1);
  }

  return (
    <div className="feature-screen" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center gap-3 rounded-xl px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          onClick={() => router.back()}
          aria-label="Kembali ke halaman sebelumnya"
        >
          <ArrowLeft size={24} aria-hidden="true" />
          <h1 style={{ fontSize: "20px", fontWeight: 700 }}>Laporan Kehadiran</h1>
        </button>
        <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
          <Button
            variant="secondary"
            onClick={reloadReport}
            disabled={isLoading}
            fullWidth
            icon={<RefreshCw size={16} aria-hidden="true" />}
          >
            Muat Ulang
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            fullWidth
            icon={<Download size={16} aria-hidden="true" />}
          >
            {isExporting ? "Mengekspor..." : "Export CSV"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPdf}
            disabled={isExportingPdf || isLoading}
            fullWidth
            icon={<Download size={16} aria-hidden="true" />}
          >
            {isExportingPdf ? "Membuat PDF..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {exportMessage && (
        <div className="card" role="status" style={{ padding: "12px 16px", borderColor: "var(--success)", backgroundColor: "rgba(34,197,94,0.08)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>{exportMessage}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="card" style={{ padding: "12px 16px", borderColor: "var(--danger)", color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>
          {error}
        </div>
      )}

      <section className="card" style={{ padding: "16px" }}>
        <h2 className="text-sm font-semibold mb-3">Filter</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset("today")}>Hari ini</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset("week")}>Minggu ini</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => applyPreset("month")}>Bulan ini</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
          <Input label="Tanggal mulai" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <Input label="Tanggal akhir" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          <Input label="ID Karyawan" placeholder="ID atau kosongkan" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setPage(1); }} />
          <Input label="Divisi" placeholder="Contoh: PRD" value={division} onChange={(e) => { setDivision(e.target.value); setPage(1); }} />
          <div>
            <label className="block text-sm font-medium mb-1.5">Lokasi kerja</label>
            <select className="input" value={workLocationId} onChange={(e) => { setWorkLocationId(e.target.value); setPage(1); }}>
              <option value="">Semua lokasi</option>
              {workLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status absensi</label>
            <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Semua status</option>
              <option value="PRESENT">Hadir</option>
              <option value="LATE">Terlambat</option>
              <option value="ABSENT">Tidak Hadir</option>
              <option value="LEAVE">Cuti</option>
              <option value="SICK">Sakit</option>
              <option value="PERMISSION">Izin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Status geo</label>
            <select className="input" value={geoStatus} onChange={(e) => { setGeoStatus(e.target.value); setPage(1); }}>
              <option value="">Semua geo</option>
              <option value="INSIDE">Dalam radius</option>
              <option value="OUTSIDE">Luar radius</option>
              <option value="GEOFENCE_EXCEPTION">Pengecualian geo-fence</option>
              <option value="UNKNOWN">Tidak ada GPS</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={lateOnly} onChange={(e) => { setLateOnly(e.target.checked); setPage(1); }} />
            Hanya terlambat
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={missingCheckoutOnly} onChange={(e) => { setMissingCheckoutOnly(e.target.checked); setPage(1); }} />
            Belum check-out
          </label>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:flex sm:justify-end">
          <Button variant="secondary" onClick={resetFilters} fullWidth className="sm:w-auto sm:min-w-[120px]">Reset filter</Button>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
        <SummaryCard label="Total catatan" value={summary?.totalRecords ?? 0} loading={isLoading} />
        <SummaryCard label="Hadir" value={summary?.totalPresent ?? 0} accent="var(--success)" loading={isLoading} />
        <SummaryCard label="Terlambat" value={summary?.totalLate ?? 0} accent="var(--warning)" loading={isLoading} />
        <SummaryCard label="Tidak hadir" value={summary?.totalAbsent ?? 0} accent="var(--danger)" loading={isLoading} />
        <SummaryCard label="Cuti / Sakit / Izin" value={summary?.totalLeaveSickPermission ?? 0} loading={isLoading} />
        <SummaryCard label="Belum check-out" value={summary?.totalMissingCheckout ?? 0} accent="var(--warning)" loading={isLoading} />
        <SummaryCard label="Luar geo-fence" value={summary?.totalOutsideGeofence ?? 0} accent="var(--danger)" loading={isLoading} />
        <SummaryCard label="Rata-rata terlambat" value={`${Math.round(summary?.averageLateMinutes ?? 0)} mnt`} loading={isLoading} />
        <SummaryCard label="Total jam kerja" value={`${summary?.totalWorkHours ?? 0} jam`} loading={isLoading} />
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--bg-secondary)" }}>
              <tr>
                <Th>Tanggal</Th>
                <Th>Karyawan</Th>
                <Th>NIP</Th>
                <Th>Divisi</Th>
                <Th>Posisi</Th>
                <Th>Lokasi</Th>
                <Th>Shift</Th>
                <Th>Check-in</Th>
                <Th>Check-out</Th>
                <Th>Total kerja</Th>
                <Th>Telat</Th>
                <Th>Pulang awal</Th>
                <Th>Status</Th>
                <Th>Geo</Th>
                <Th>Selfie masuk</Th>
                <Th>Selfie pulang</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={16} style={{ textAlign: "center", padding: "32px" }}>
                    <LoadingSpinner />
                  </td>
                </tr>
              )}
              {!isLoading && (!report || report.rows.length === 0) && (
                <tr>
                  <td colSpan={16} style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary)", fontSize: "12px" }}>
                    Tidak ada data absensi pada filter yang dipilih.
                  </td>
                </tr>
              )}
              {!isLoading && report?.rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                  <Td>{formatDateShort(row.attendanceDate)}</Td>
                  <Td>{row.employeeName}</Td>
                  <Td>{row.nip}</Td>
                  <Td>{row.division || "-"}</Td>
                  <Td>{row.position || "-"}</Td>
                  <Td>{row.workLocationName || "-"}</Td>
                  <Td>{row.shiftName || "-"}</Td>
                  <Td>{formatTime(row.checkInTime)}</Td>
                  <Td>{formatTime(row.checkOutTime)}</Td>
                  <Td>{formatMinutes(row.totalWorkMinutes)}</Td>
                  <Td>{row.lateMinutes > 0 ? `${row.lateMinutes} mnt` : "-"}</Td>
                  <Td>{row.earlyLeaveMinutes > 0 ? `${row.earlyLeaveMinutes} mnt` : "-"}</Td>
                  <Td><Badge tone={STATUS_BADGE[row.status]} /></Td>
                  <Td><Badge tone={GEO_BADGE[row.geoStatus]} /></Td>
                  <Td>
                    {row.hasCheckInSelfie ? (
                      <a className="text-link" href={`/api/attendances/${row.id}/selfie/check-in`} target="_blank" rel="noreferrer">
                        Buka selfie masuk
                      </a>
                    ) : "Tidak"}
                  </Td>
                  <Td>
                    {row.hasCheckOutSelfie ? (
                      <a className="text-link" href={`/api/attendances/${row.id}/selfie/check-out`} target="_blank" rel="noreferrer">
                        Buka selfie pulang
                      </a>
                    ) : "Tidak"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report && report.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
            <span className="text-xs text-[var(--text-secondary)]">
              Menampilkan {(report.page - 1) * report.pageSize + 1}–{Math.min(report.page * report.pageSize, report.total)} dari {report.total}
            </span>
            <nav className="pagination-compact" aria-label="Navigasi halaman laporan kehadiran">
              <button type="button" className="pagination-button" disabled={report.page <= 1 || isLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span className="pagination-info">Hal. {report.page} / {totalPages}</span>
              <button type="button" className="pagination-button" disabled={report.page >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)}>Next</button>
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, accent, loading }: { label: string; value: number | string; accent?: string; loading?: boolean }) {
  return (
    <div className="card" style={{ padding: "14px" }}>
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color: accent || "var(--text-primary)" }}>
        {loading ? "…" : value}
      </p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px 16px",
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--text-secondary)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: "12px 16px", fontSize: "12px", whiteSpace: "nowrap" }}>{children}</td>
  );
}

function Badge({ tone }: { tone: { label: string; bg: string; color: string } }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        background: tone.bg,
        color: tone.color,
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {tone.label}
    </span>
  );
}
